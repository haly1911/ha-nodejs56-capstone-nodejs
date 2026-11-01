import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../modules-system/prisma/prisma.service';
import { GetSubcategoriesDto } from './dto/getSubcategories.dto';
import { paginate } from '../../common/helpers/pagination.helper';
import { CreateSubcategoryDto } from './dto/createSubcategory.dto';
import { UpdateSubcategoryDto } from './dto/updateSubcategory.dto';

@Injectable()
export class SubcategoryService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: GetSubcategoriesDto) {
    const where = {
      is_deleted: false,
      name: query.keyword ? { contains: query.keyword } : undefined,
    };

    const subcategoryList = await paginate(
      query,
      (pagination) =>
        this.prisma.subcategories.findMany({
          where,
          orderBy: { id: 'asc' },
          select: {
            id: true,
            name: true,
          },
          ...pagination,
        }),
      () => this.prisma.subcategories.count({ where }),
    );

    return subcategoryList;
  }

  async findOne(id: number) {
    const subcategory = await this.prisma.subcategories.findFirst({
      where: { id, is_deleted: false },
      select: {
        id: true,
        name: true,
      },
    });
    if (!subcategory) throw new NotFoundException('Subcategory not found');

    return subcategory;
  }

  async createSubcategory(dto: CreateSubcategoryDto) {
    const parent = await this.prisma.subcategory_groups.findFirst({
      where: { id: dto.subcategory_group_id, is_deleted: false },
    });
    if (!parent) {
      throw new NotFoundException('Subcategory group not found');
    }

    const existingSubcategory = await this.prisma.subcategories.findFirst({
      where: {
        name: dto.name,
        subcategory_group_id: dto.subcategory_group_id,
        is_deleted: false,
      },
    });
    if (existingSubcategory) {
      throw new ConflictException('Subcategory name already exists');
    }

    const newSubcategory = await this.prisma.subcategories.create({
      data: { name: dto.name, subcategory_group_id: dto.subcategory_group_id },
      select: { id: true, name: true },
    });

    return newSubcategory;
  }

  async updateSubcategory(id: number, dto: UpdateSubcategoryDto) {
    const existingSubcategory = await this.prisma.subcategories.findFirst({
      where: { id, is_deleted: false },
    });
    if (!existingSubcategory) {
      throw new NotFoundException('Subcategory not found');
    }

    if (dto.subcategory_group_id !== undefined) {
      const parent = await this.prisma.subcategory_groups.findFirst({
        where: { id: dto.subcategory_group_id, is_deleted: false },
      });
      if (!parent) throw new NotFoundException('Subcategory group not found');
    }

    const duplicate = await this.prisma.subcategories.findFirst({
      where: {
        name: dto.name ?? existingSubcategory.name,
        subcategory_group_id:
          dto.subcategory_group_id ?? existingSubcategory.subcategory_group_id,
        is_deleted: false,
        id: { not: id },
      },
    });
    if (duplicate) {
      throw new ConflictException(
        'Subcategory name already exists in this subcategory group',
      );
    }

    const updatedSubcategory = await this.prisma.subcategories.update({
      where: { id },
      data: { name: dto.name, subcategory_group_id: dto.subcategory_group_id },
      select: { id: true, name: true },
    });

    return updatedSubcategory;
  }

  async deleteSubcategory(id: number, userId: number) {
    const existingSubcategory = await this.prisma.subcategories.findFirst({
      where: { id, is_deleted: false },
    });
    if (!existingSubcategory) {
      throw new NotFoundException('Subcategory not found');
    }

    const children = await this.prisma.gigs.count({
      where: { subcategory_id: id, is_deleted: false },
    });

    if (children > 0) {
      throw new ConflictException('Subcategory still has active gigs');
    }

    await this.prisma.subcategories.update({
      where: { id },
      data: { is_deleted: true, deleted_at: new Date(), deleted_by: userId },
    });

    return true;
  }
}
