import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../modules-system/prisma/prisma.service';
import { GetSubcategoryGroupsDto } from './dto/getSubcategoryGroups.dto';
import { paginate } from '../../common/helpers/pagination.helper';
import { CreateSubcategoryGroupDto } from './dto/createSubcategoryGroup.dto';
import { UpdateSubcategoryGroupDto } from './dto/updateSubcategoryGroup.dto';

@Injectable()
export class SubcategoryGroupService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: GetSubcategoryGroupsDto) {
    const where = {
      is_deleted: false,
      name: query.keyword ? { contains: query.keyword } : undefined,
    };

    const subcategoryGroupList = await paginate(
      query,
      (pagination) =>
        this.prisma.subcategory_groups.findMany({
          where,
          orderBy: { id: 'asc' },
          select: {
            id: true,
            name: true,
            subcategories: {
              where: { is_deleted: false },
              select: { id: true, name: true },
            },
          },
          ...pagination,
        }),
      () => this.prisma.subcategory_groups.count({ where }),
    );

    return subcategoryGroupList;
  }

  async findOne(id: number) {
    const subcategoryGroup = await this.prisma.subcategory_groups.findFirst({
      where: { id, is_deleted: false },
      select: {
        id: true,
        name: true,
        subcategories: {
          where: { is_deleted: false },
          select: { id: true, name: true },
        },
      },
    });
    if (!subcategoryGroup)
      throw new NotFoundException('Subcategory group not found');

    return subcategoryGroup;
  }

  async createSubcategoryGroup(dto: CreateSubcategoryGroupDto) {
    const parent = await this.prisma.categories.findFirst({
      where: { id: dto.category_id, is_deleted: false },
    });
    if (!parent) {
      throw new NotFoundException('Category not found');
    }

    const existingSubcategoryGroup =
      await this.prisma.subcategory_groups.findFirst({
        where: {
          name: dto.name,
          category_id: dto.category_id,
          is_deleted: false,
        },
      });
    if (existingSubcategoryGroup) {
      throw new ConflictException('Subcategory group name already exists');
    }

    const newSubcategoryGroup = await this.prisma.subcategory_groups.create({
      data: { name: dto.name, category_id: dto.category_id },
      select: { id: true, name: true },
    });

    return newSubcategoryGroup;
  }

  async updateSubcategoryGroup(id: number, dto: UpdateSubcategoryGroupDto) {
    const existingSubcategoryGroup =
      await this.prisma.subcategory_groups.findFirst({
        where: { id, is_deleted: false },
      });
    if (!existingSubcategoryGroup) {
      throw new NotFoundException('Subcategory group not found');
    }

    if (dto.category_id !== undefined) {
      const parent = await this.prisma.categories.findFirst({
        where: { id: dto.category_id, is_deleted: false },
      });
      if (!parent) throw new NotFoundException('Category not found');
    }

    const duplicate = await this.prisma.subcategory_groups.findFirst({
      where: {
        name: dto.name ?? existingSubcategoryGroup.name,
        category_id: dto.category_id ?? existingSubcategoryGroup.category_id,
        is_deleted: false,
        id: { not: id },
      },
    });
    if (duplicate) {
      throw new ConflictException(
        'Subcategory group name already exists in this category',
      );
    }

    const updatedSubcategoryGroup = await this.prisma.subcategory_groups.update(
      {
        where: { id },
        data: { name: dto.name, category_id: dto.category_id },
        select: { id: true, name: true },
      },
    );

    return updatedSubcategoryGroup;
  }

  async deleteSubcategoryGroup(id: number, userId: number) {
    const existingSubcategoryGroup =
      await this.prisma.subcategory_groups.findFirst({
        where: { id, is_deleted: false },
      });
    if (!existingSubcategoryGroup) {
      throw new NotFoundException('Subcategory group not found');
    }

    const children = await this.prisma.subcategories.count({
      where: { subcategory_group_id: id, is_deleted: false },
    });

    if (children > 0) {
      throw new ConflictException(
        'Subcategory group still has active subcategories',
      );
    }

    await this.prisma.subcategory_groups.update({
      where: { id },
      data: { is_deleted: true, deleted_at: new Date(), deleted_by: userId },
    });

    return true;
  }
}
