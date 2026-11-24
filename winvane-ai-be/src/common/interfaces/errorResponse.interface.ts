export interface IErrorResponse {
  statusCode: number;
  error: string;
  message: string | string[];
  code?: string;
  requestId: string;
  timestamp: string;
  path: string;
}
