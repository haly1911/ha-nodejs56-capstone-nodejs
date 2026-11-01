import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../modules-system/prisma/prisma.service';
import { GetUsersDto } from './dto/getUsers.dto';
import { Prisma } from '../../modules-system/prisma/generated/prisma/client';
import { paginate } from '../../common/helpers/pagination.helper';
import { UpdateProfileDto } from './dto/updateProfile.dto';
import { ChangePasswordDto } from './dto/changePassword.dto';
import * as bcrypt from 'bcrypt';
import { UpdateUserStatusDto } from './dto/updateUserStatus.dto';
import { UpdateUserRoleDto } from './dto/updateUserRole.dto';
import { CreateUserDto } from './dto/createUser.dto';
import { CloudinaryService } from '../../modules-system/cloudinary/cloudinary.service';

const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  phone: true,
  birthday: true,
  gender: true,
  role: true,
  account_status: true,
  avatar: true,
  skill: true,
  certification: true,
  created_at: true,
} as const;

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private cloudinary: CloudinaryService,
  ) {}
  private assertCanManage(
    actor: { id: number; role: string },
    target: { id: number; role: string },
  ) {
    if (target.id === actor.id)
      throw new ForbiddenException('You cannot manage your own account');
    if (target.role === 'SuperAdmin')
      throw new ForbiddenException('SuperAdmin accounts cannot be managed');
    if (target.role === 'Admin' && actor.role !== 'SuperAdmin') {
      throw new ForbiddenException('Only SuperAdmin can manage admin accounts');
    }
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const updatedProfile = await this.prisma.users.update({
      where: { id: userId },
      data: dto,
      select: USER_SELECT,
    });
    return updatedProfile;
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.prisma.users.findFirst({
      where: { id: userId },
      omit: { password: false },
    });

    if (user?.password) {
      if (!dto.oldPassword) {
        throw new BadRequestException('Please enter your old password');
      } else {
        const isValid = bcrypt.compareSync(dto.oldPassword, user.password);
        if (!isValid)
          throw new BadRequestException('Old password is incorrect');
      }
    }

    const newPassword = bcrypt.hashSync(dto.newPassword, 10);
    await this.prisma.users.update({
      where: { id: userId },
      data: { password: newPassword },
    });

    return true;
  }

  async uploadAvatar(
    userId: number,
    file: {
      buffer: Buffer;
      mimetype: string;
      size: number;
      originalname: string;
    },
  ) {
    const currentUser = await this.prisma.users.findUnique({
      where: { id: userId },
      select: { avatar_public_id: true },
    });
    const uploaded = await this.cloudinary.uploadImage(
      file.buffer,
      'capstone_nodejs',
    );

    try {
      await this.prisma.users.update({
        where: { id: userId },
        data: {
          avatar: uploaded.secure_url,
          avatar_public_id: uploaded.public_id,
        },
      });
    } catch (error) {
      await this.cloudinary.deleteImage(uploaded.public_id);
      throw error;
    }

    await this.cloudinary.deleteImage(currentUser?.avatar_public_id);
    return { avatar: uploaded.secure_url };
  }

  async findAll(query: GetUsersDto) {
    const where: Prisma.usersWhereInput = {
      is_deleted: false,
      role: query.role,
      account_status: query.accountStatus,
      OR: query.keyword
        ? [
            { name: { contains: query.keyword } },
            { email: { contains: query.keyword } },
          ]
        : undefined,
    };

    const userList = await paginate(
      query,
      (pagination) =>
        this.prisma.users.findMany({
          where,
          orderBy: { id: 'asc' },
          select: USER_SELECT,
          ...pagination,
        }),
      () => this.prisma.users.count({ where }),
    );

    return userList;
  }

  async findOne(id: number) {
    const user = await this.prisma.users.findFirst({
      where: { id, is_deleted: false },
      select: USER_SELECT,
    });
    if (!user) throw new NotFoundException('User not found');

    return user;
  }

  async createUser(dto: CreateUserDto, actor: { id: number; role: string }) {
    if (dto.role === 'Admin' && actor.role !== 'SuperAdmin')
      throw new ForbiddenException('You can not create an admin account');

    const existingUser = await this.prisma.users.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) throw new ConflictException('Account already exists');

    const hashPassword = bcrypt.hashSync(dto.password, 10);
    const newUser = await this.prisma.users.create({
      data: { ...dto, password: hashPassword },
      select: USER_SELECT,
    });

    return newUser;
  }

  async updateStatus(
    id: number,
    dto: UpdateUserStatusDto,
    actor: { id: number; role: string },
  ) {
    const target = await this.prisma.users.findFirst({
      where: { id, is_deleted: false },
    });
    if (!target) throw new NotFoundException('User not found');
    this.assertCanManage(actor, target);
    await this.prisma.users.update({
      where: { id: target.id },
      data: dto,
    });
    return true;
  }

  async updateRole(
    id: number,
    dto: UpdateUserRoleDto,
    actor: { id: number; role: string },
  ) {
    const target = await this.prisma.users.findFirst({
      where: { id, is_deleted: false },
    });
    if (!target) throw new NotFoundException('User not found');
    this.assertCanManage(actor, target);
    await this.prisma.users.update({
      where: { id: target.id },
      data: dto,
    });
    return true;
  }

  async deleteUser(id: number, actor: { id: number; role: string }) {
    const target = await this.prisma.users.findFirst({
      where: { id, is_deleted: false },
    });
    if (!target) throw new NotFoundException('User not found');

    this.assertCanManage(actor, target);

    const activeGigs = await this.prisma.gigs.count({
      where: { seller_id: target.id, is_deleted: false },
    });
    const activeOrders = await this.prisma.orders.count({
      where: {
        buyer_id: target.id,
        is_deleted: false,
        status: { in: ['Pending', 'InProgress'] },
      },
    });
    if (activeGigs > 0)
      throw new ConflictException('This account still has gigs');
    if (activeOrders > 0)
      throw new ConflictException('This account still has active orders');

    await this.prisma.users.update({
      where: { id: target.id },
      data: { is_deleted: true, deleted_at: new Date(), deleted_by: actor.id },
    });
    return true;
  }
}
