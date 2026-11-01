import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../modules-system/prisma/generated/prisma/client';
import { PrismaService } from '../../modules-system/prisma/prisma.service';
import { CreateReviewDto } from './dto/createReview.dto';
import { UpdateReviewDto } from './dto/updateReview.dto';
import { GetReviewsDto } from './dto/getReviews.dto';
import { paginate } from '../../common/helpers/pagination.helper';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { UpdateModerationDto } from '../../common/dto/updateModeration.dto';

const REVIEW_SELECT = {
  id: true,
  rating: true,
  content: true,
  created_at: true,
  gig_id: true,
  users_reviews_user_idTousers: {
    select: { id: true, name: true, avatar: true },
  },
} satisfies Prisma.reviewsSelect;

const withAuthor = <T extends { users_reviews_user_idTousers: unknown }>({
  users_reviews_user_idTousers: author,
  ...review
}: T) => ({ ...review, author });

@Injectable()
export class ReviewService {
  constructor(private prisma: PrismaService) {}

  async recalcGigRating(tx: Prisma.TransactionClient, gigId: number) {
    const agg = await tx.reviews.aggregate({
      where: { gig_id: gigId, is_deleted: false, moderation_status: 'Active' },
      _avg: { rating: true },
      _count: { _all: true },
    });
    await tx.gigs.update({
      where: { id: gigId },
      data: {
        rating: Math.round((agg._avg.rating ?? 0) * 100) / 100,
        review: agg._count._all,
      },
    });
  }

  async findReviewsByGig(query: GetReviewsDto) {
    const where: Prisma.reviewsWhereInput = {
      gig_id: query.gig_id,
      is_deleted: false,
      moderation_status: 'Active',
      users_reviews_user_idTousers: {
        is_deleted: false,
        account_status: 'Active',
      },
    };

    const gigReviews = await paginate(
      query,
      (pagination) =>
        this.prisma.reviews.findMany({
          where,
          orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
          select: REVIEW_SELECT,
          ...pagination,
        }),
      () => this.prisma.reviews.count({ where }),
    );

    return { ...gigReviews, items: gigReviews.items.map(withAuthor) };
  }

  async findMyReviews(query: PaginationDto, userId: number) {
    const where: Prisma.reviewsWhereInput = {
      user_id: userId,
      is_deleted: false,
    };

    const myReviews = await paginate(
      query,
      (pagination) =>
        this.prisma.reviews.findMany({
          where,
          orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
          select: {
            ...REVIEW_SELECT,
            moderation_status: true,
            gigs: { select: { id: true, title: true } },
          },
          ...pagination,
        }),
      () => this.prisma.reviews.count({ where }),
    );

    return { ...myReviews, items: myReviews.items.map(withAuthor) };
  }

  async createReview(dto: CreateReviewDto, userId: number) {
    const order = await this.prisma.orders.findFirst({
      where: { id: dto.order_id, buyer_id: userId, is_deleted: false },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== 'Completed')
      throw new ConflictException('You can only review completed orders');

    const existingReview = await this.prisma.reviews.findUnique({
      where: { order_id: order.id },
    });
    if (existingReview)
      throw new ConflictException('You already reviewed this order');

    const newReview = await this.prisma.$transaction(async (tx) => {
      const review = await tx.reviews.create({
        data: {
          gig_id: order.gig_id,
          user_id: userId,
          order_id: order.id,
          rating: dto.rating,
          content: dto.content,
        },
        select: REVIEW_SELECT,
      });
      await this.recalcGigRating(tx, order.gig_id);
      return review;
    });

    return newReview;
  }

  async updateReview(id: number, dto: UpdateReviewDto, userId: number) {
    const existingReview = await this.prisma.reviews.findFirst({
      where: { id, is_deleted: false },
    });
    if (!existingReview) throw new NotFoundException('Review not found');
    if (existingReview.user_id !== userId)
      throw new ForbiddenException('You can only update your own reviews');

    const updatedReview = await this.prisma.$transaction(async (tx) => {
      const review = await tx.reviews.update({
        where: { id },
        data: dto,
        select: REVIEW_SELECT,
      });
      await this.recalcGigRating(tx, review.gig_id);
      return review;
    });

    return updatedReview;
  }

  async updateModerationStatus(id: number, dto: UpdateModerationDto) {
    const review = await this.prisma.reviews.findFirst({
      where: { id, is_deleted: false },
    });
    if (!review) throw new NotFoundException('Review not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.reviews.update({
        where: { id },
        data: { moderation_status: dto.moderation_status },
      });
      await this.recalcGigRating(tx, review.gig_id);
    });
    return true;
  }

  async deleteReview(id: number, user: { id: number; role: string }) {
    const review = await this.prisma.reviews.findFirst({
      where: { id, is_deleted: false },
    });
    if (!review) throw new NotFoundException('Review not found');

    const isOwner = review.user_id === user.id;
    const isAdmin = ['SuperAdmin', 'Admin'].includes(user.role);
    if (!isOwner && !isAdmin)
      throw new ForbiddenException(
        'You do not have permission for this action',
      );

    await this.prisma.$transaction(async (tx) => {
      await tx.reviews.update({
        where: { id },
        data: {
          is_deleted: true,
          deleted_at: new Date(),
          deleted_by: user.id,
        },
      });
      await this.recalcGigRating(tx, review.gig_id);
      return true;
    });

    return true;
  }
}
