import { AxiosError } from 'axios';
import type { TApiErrorBody } from '@/types/api.types';

export class ApiError extends Error {
  readonly statusCode: number;
  readonly error: string;
  readonly messages: string[];
  readonly code?: string;
  readonly requestId?: string;
  readonly path?: string;

  constructor(
    statusCode: number,
    error: string,
    messages: string[] | string,
    code?: string,
    requestId?: string,
    path?: string
  ) {
    const normalizedMessages = Array.isArray(messages) ? messages : [messages];
    super(normalizedMessages[0] ?? 'An unexpected error occurred');
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.error = error;
    this.messages = normalizedMessages;
    this.code = code;
    this.requestId = requestId;
    this.path = path;
  }
}

export function normalizeError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof AxiosError) {
    if (error.response?.data) {
      const data = error.response.data as Partial<TApiErrorBody>;
      const statusCode = typeof data.statusCode === 'number' ? data.statusCode : error.response.status;
      const errorTitle = typeof data.error === 'string' ? data.error : error.response.statusText || 'Error';
      let messages = data.message ? data.message : error.message;

      const rawText = Array.isArray(messages) ? messages.join(' ') : String(messages);
      const isTechnical =
        /violates|constraint|relation|syntax error|typeorm|queryrunner|database|cannot read properties|null value in column|driver|internal server error|request failed with status code 500/i.test(
          rawText
        );

      if (statusCode >= 500 || isTechnical) {
        messages = 'An unexpected server error occurred. Please try again later.';
      }

      return new ApiError(
        statusCode,
        errorTitle,
        messages,
        data.code,
        data.requestId,
        data.path
      );
    }

    if (error.code === 'ECONNABORTED' || error.message.toLowerCase().includes('timeout')) {
      return new ApiError(0, 'Timeout Error', 'Request timed out. Please check your connection and retry.');
    }

    return new ApiError(0, 'Network Error', 'Unable to connect to the server. Please check your network.');
  }

  if (error instanceof Error) {
    const isTechnical =
      /violates|constraint|relation|syntax error|typeorm|queryrunner|database|cannot read properties|null value in column|driver/i.test(
        error.message
      );
    return new ApiError(
      500,
      'Internal Error',
      isTechnical ? 'An unexpected server error occurred. Please try again later.' : error.message
    );
  }

  return new ApiError(500, 'Unknown Error', 'An unexpected error occurred.');
}

export function isApiErrorCode(error: unknown, code: string): boolean {
  if (error instanceof ApiError) {
    return error.code === code;
  }
  if (error instanceof AxiosError && error.response?.data) {
    const data = error.response.data as Partial<TApiErrorBody>;
    return data.code === code;
  }
  return false;
}

export function getErrorMessage(error: unknown): string {
  const normalized = normalizeError(error);
  return normalized.messages.join('. ');
}
