import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { REQUEST_ID_HEADER } from '../constants';
import { IErrorResponse } from '../interfaces';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  constructor(private readonly configService: ConfigService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { requestId?: string }>();

    const requestId =
      request.requestId ||
      (request.headers[REQUEST_ID_HEADER] as string) ||
      randomUUID();

    response.setHeader('X-Request-Id', requestId);

    const isProduction =
      this.configService.get<string>('app.nodeEnv') === 'production' ||
      process.env.NODE_ENV === 'production';

    const { statusCode, error, message, code } = this.extractErrorInfo(
      exception,
      isProduction,
    );

    const errorBody: IErrorResponse = {
      statusCode,
      error,
      message,
      ...(code ? { code } : {}),
      requestId,
      timestamp: new Date().toISOString(),
      path: request.originalUrl || request.url,
    };

    if (statusCode >= Number(HttpStatus.INTERNAL_SERVER_ERROR)) {
      this.logger.error(
        `[${requestId}] ${request.method} ${request.url} - ${error}: ${
          exception instanceof Error ? exception.stack : String(exception)
        }`,
      );
    } else {
      this.logger.warn(
        `[${requestId}] ${request.method} ${request.url} - ${statusCode} ${error}${code ? ` [code: ${code}]` : ''}`,
      );
    }

    response.status(statusCode).json(errorBody);
  }

  private extractErrorInfo(
    exception: unknown,
    isProduction: boolean,
  ): {
    statusCode: number;
    error: string;
    message: string | string[];
    code?: string;
  } {
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, unknown>;
        return {
          statusCode,
          error:
            typeof resObj.error === 'string'
              ? resObj.error
              : (HttpStatus[statusCode] ?? 'Error'),
          message: (resObj.message as string | string[]) || exception.message,
          code: typeof resObj.code === 'string' ? resObj.code : undefined,
        };
      }

      return {
        statusCode,
        error: HttpStatus[statusCode] ?? 'Error',
        message: typeof res === 'string' ? res : exception.message,
      };
    }

    const isTechnicalError =
      exception instanceof Error &&
      (/violates|constraint|relation|syntax error|typeorm|queryrunner|database|cannot read properties|null value in column|driver/i.test(
        exception.message,
      ) ||
        exception.name === 'QueryFailedError');

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message:
        isProduction || isTechnicalError
          ? 'An unexpected server error occurred. Please try again later.'
          : exception instanceof Error
            ? exception.message
            : 'Internal server error',
    };
  }
}
