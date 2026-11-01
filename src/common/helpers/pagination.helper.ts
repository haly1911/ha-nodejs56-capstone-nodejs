import { PaginationDto } from "../dto/pagination.dto";

export const buildPagination = (page: number, pageSize: number) => ({
  skip: (page - 1) * pageSize,
  take: pageSize,
});

export const buildMeta = (total: number, page: number, pageSize: number) => ({
  page,
  pageSize,
  total,
  totalPages: Math.ceil(total / pageSize),
});

export const paginate = async <T>(
  query: PaginationDto,
  findItems: (pagination: { skip: number; take: number }) => Promise<T[]>,
  countItems: () => Promise<number>,
) => {
  const { page, pageSize } = query;
  const [items, total] = await Promise.all([
    findItems(buildPagination(page, pageSize)),
    countItems(),
  ]);
  return { items, meta: buildMeta(total, page, pageSize) };
};
