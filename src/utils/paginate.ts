import type { PaginationMeta } from '../types/api';

/** Client-side page of `items` with the same meta shape the backend returns. */
export function paginate<T>(items: T[], page: number, pageSize: number): { items: T[]; pagination: PaginationMeta } {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  return {
    items: items.slice((page - 1) * pageSize, page * pageSize),
    pagination: {
      currentPage: page,
      pageSize,
      totalItems: items.length,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}
