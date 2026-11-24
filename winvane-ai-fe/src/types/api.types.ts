export type TApiErrorBody = {
  statusCode: number;
  error: string;
  message: string | string[];
  code?: string;
  requestId?: string;
  timestamp?: string;
  path?: string;
};

export type TPaginated<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export interface IPaginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
