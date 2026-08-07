

export interface PaginationMeta {
  limit: number;
  hasNextPage: boolean;
  nextCursor?: string | null;
  total?: number;
  page?: number;
  totalPages?: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}
