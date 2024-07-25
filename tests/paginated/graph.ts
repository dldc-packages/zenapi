export interface Stuff {
  data: string;
  num: number;
}

export interface PageConfig {
  page?: number;
  pageSize?: number;
}

export type Paginated<Result> = (page?: PageConfig) => PaginatedResult<Result>;

export interface PaginatedResult<ResultItem> {
  data: ResultItem[];
  total: number;
}

export interface Namespace {
  listStuff: (search?: string) => Paginated<Stuff>;
}

export interface Graph {
  sub: Namespace;
}
