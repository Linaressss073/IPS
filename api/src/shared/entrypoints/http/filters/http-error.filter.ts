import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import type { Response } from 'express';

const BY_STATUS: Record<number, { code: string; message: string }> = {
  400: { code: 'BAD_REQUEST', message: 'The request is not valid' },
  401: { code: 'UNAUTHORIZED', message: 'Sign in to continue' },
  403: { code: 'FORBIDDEN', message: 'You are not allowed to do this' },
  404: { code: 'ROUTE_NOT_FOUND', message: 'The requested resource does not exist' },
  413: { code: 'PAYLOAD_TOO_LARGE', message: 'The request is too large' },
  415: { code: 'UNSUPPORTED_MEDIA_TYPE', message: 'The request format is not supported' },
};

/** Framework errors (bad JSON, unknown route, no token) in the same body as domain errors. */
@Catch(HttpException)
export class HttpErrorFilter implements ExceptionFilter {
  catch(error: HttpException, host: ArgumentsHost) {
    const status = error.getStatus();
    const body = error.getResponse();
    const response = host.switchToHttp().getResponse<Response>();
    const known = BY_STATUS[status];
    // Anything else (e.g. the health check's 503 body) keeps its own shape.
    if (!known) return void response.status(status).json(body);
    const fields =
      typeof body === 'object' && Array.isArray((body as { message?: unknown }).message)
        ? { errors: (body as { message: string[] }).message }
        : {};
    response.status(status).json({ statusCode: status, ...known, ...fields });
  }
}
