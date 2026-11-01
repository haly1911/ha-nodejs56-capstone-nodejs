import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../modules-system/prisma/generated/prisma/client';
import { PrismaService } from '../../modules-system/prisma/prisma.service';
import { CreateReportDto } from './dto/createReport.dto';
import { GetReportsDto } from './dto/getReports.dto';
import { paginate } from '../../common/helpers/pagination.helper';
import { HandleReportDto } from './dto/handleReport.dto';
import { ReviewService } from '../review/review.service';

const TARGET_COLUMN = {
  gig: 'gig_id',
  review: 'review_id',
  user: 'reported_user_id',
} as const;

const TRANSITIONS: Record<string, string[]> = {
  Pending: ['Reviewing', 'Resolved', 'Rejected'],
  Reviewing: ['Resolved', 'Rejected'],
};

const REPORT_SELECT = {
  id: true,
  reason: true,
  description: true,
  status: true,
  resolution_note: true,
  created_at: true,
  handled_at: true,
  gigs: { select: { id: true, title: true } },
  reviews: { select: { id: true, content: true, rating: true } },
  users_reports_reported_user_idTousers: {
    select: { id: true, name: true, email: true },
  },
  users_reports_reporter_idTousers: { select: { id: true, name: true } },
} satisfies Prisma.reportsSelect;

type ReportRow = Prisma.reportsGetPayload<{ select: typeof REPORT_SELECT }>;

const mapReport = ({
  users_reports_reporter_idTousers: reporter,
  users_reports_reported_user_idTousers: reportedUser,
  gigs: gig,
  reviews: review,
  ...report
}: ReportRow) => ({ ...report, reporter, reportedUser, gig, review });

@Injectable()
export class ReportService {
  constructor(
    private prisma: PrismaService,
    private reviewService: ReviewService,
  ) {}

  async createReport(dto: CreateReportDto, userId: number) {
    if (dto.target_type === 'gig') {
      const gig = await this.prisma.gigs.findFirst({
        where: { id: dto.target_id, is_deleted: false },
      });
      if (!gig) throw new NotFoundException('Gig not found');
      if (gig.seller_id === userId)
        throw new ForbiddenException('You can not report your own gigs');
    }
    if (dto.target_type === 'review') {
      const review = await this.prisma.reviews.findFirst({
        where: { id: dto.target_id, is_deleted: false },
      });
      if (!review) throw new NotFoundException('Review not found');
      if (review.user_id === userId)
        throw new ForbiddenException('You can not report your own review');
    }
    if (dto.target_type === 'user') {
      const user = await this.prisma.users.findFirst({
        where: { id: dto.target_id, is_deleted: false },
      });
      if (!user) throw new NotFoundException('User not found');
      if (user.id === userId)
        throw new ForbiddenException('You can not report your own account');
    }

    const col = TARGET_COLUMN[dto.target_type];

    const existingReport = await this.prisma.reports.findFirst({
      where: { reporter_id: userId, [col]: dto.target_id },
    });
    if (existingReport)
      throw new ConflictException('You already reported this');

    const newReport = await this.prisma.reports.create({
      data: {
        reporter_id: userId,
        reason: dto.reason,
        description: dto.description,
        [col]: dto.target_id,
      },
      select: REPORT_SELECT,
    });

    return mapReport(newReport);
  }

  async findMyReports(query: GetReportsDto, userId: number) {
    const where: Prisma.reportsWhereInput = {
      reporter_id: userId,
      status: query.status,
    };

    const myReports = await paginate(
      query,
      (pagination) =>
        this.prisma.reports.findMany({
          where,
          orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
          select: REPORT_SELECT,
          ...pagination,
        }),
      () => this.prisma.reports.count({ where }),
    );

    return { ...myReports, items: myReports.items.map(mapReport) };
  }

  async findAll(query: GetReportsDto) {
    const where: Prisma.reportsWhereInput = {
      status: query.status,
      reason: query.reason,
      gig_id: query.target_type === 'gig' ? { not: null } : undefined,
      review_id: query.target_type === 'review' ? { not: null } : undefined,
      reported_user_id:
        query.target_type === 'user' ? { not: null } : undefined,
    };

    const reportList = await paginate(
      query,
      (pagination) =>
        this.prisma.reports.findMany({
          where,
          orderBy: [{ created_at: 'asc' }, { id: 'asc' }],
          select: REPORT_SELECT,
          ...pagination,
        }),
      () => this.prisma.reports.count({ where }),
    );

    return { ...reportList, items: reportList.items.map(mapReport) };
  }

  async findOne(id: number, user: { id: number; role: string }) {
    const report = await this.prisma.reports.findFirst({
      where: { id },
      select: REPORT_SELECT,
    });
    if (!report) throw new NotFoundException('Report not found');

    const isOwner = report.users_reports_reporter_idTousers.id === user.id;
    const isAdmin = ['Admin', 'SuperAdmin'].includes(user.role);
    if (!isOwner && !isAdmin) {
      throw new NotFoundException('Report not found');
    }

    return mapReport(report);
  }

  async handleReport(id: number, dto: HandleReportDto, userId: number) {
    const report = await this.prisma.reports.findFirst({
      where: { id },
      select: {
        status: true,
        gig_id: true,
        review_id: true,
        reported_user_id: true,
      },
    });
    if (!report) throw new NotFoundException('Report not found');

    const allowedStatus = TRANSITIONS[report.status]?.includes(dto.status);
    if (!allowedStatus) {
      throw new ConflictException(
        `Cannot change report from ${report.status} to ${dto.status}`,
      );
    }

    if (['Resolved', 'Rejected'].includes(dto.status) && !dto.resolution_note)
      throw new BadRequestException('Missing resolution note');
    if (dto.action && dto.status !== 'Resolved')
      throw new BadRequestException('This report has not been resolved yet');
    if (dto.action === 'Hide' && report.reported_user_id)
      throw new BadRequestException('You can only suspend or ban an account');
    if (
      (dto.action === 'Suspend' || dto.action === 'Ban') &&
      (report.gig_id || report.review_id)
    )
      throw new BadRequestException('You can only hide a gig or review');

    if (dto.action && report.reported_user_id) {
      const reportedUser = await this.prisma.users.findUnique({
        where: { id: report.reported_user_id },
      });
      if (reportedUser?.role !== 'User')
        throw new ForbiddenException(
          'You can not suspend or ban admin accounts',
        );
    }

    await this.prisma.$transaction(async (tx) => {
      const closing = ['Resolved', 'Rejected'].includes(dto.status);
      const result = await tx.reports.updateMany({
        where: { id, status: report.status },
        data: {
          status: dto.status,
          handled_by: userId,
          handled_at: closing ? new Date() : null,
          resolution_note: dto.resolution_note,
        },
      });
      if (result.count === 0) {
        throw new ConflictException('Report status has changed, please reload');
      }

      if (dto.action) {
        if (dto.action === 'Hide' && report.gig_id) {
          await tx.gigs.update({
            where: { id: report.gig_id },
            data: {
              moderation_status: 'Hidden',
            },
          });
        }
        if (dto.action === 'Hide' && report.review_id) {
          const review = await tx.reviews.update({
            where: { id: report.review_id },
            data: {
              moderation_status: 'Hidden',
            },
            select: { gig_id: true },
          });
          await this.reviewService.recalcGigRating(tx, review.gig_id);
        }
        if (
          (dto.action === 'Suspend' || dto.action === 'Ban') &&
          report.reported_user_id
        ) {
          await tx.users.update({
            where: { id: report.reported_user_id },
            data: {
              account_status: dto.action === 'Suspend' ? 'Suspended' : 'Banned',
            },
          });
        }
      }
    });

    return true;
  }
}
