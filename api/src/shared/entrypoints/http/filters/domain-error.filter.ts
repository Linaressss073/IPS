import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { DomainError } from '../../../domain/index.js';

const STATUS_BY_KIND: Record<DomainError['kind'], HttpStatus> = {
  validation: HttpStatus.BAD_REQUEST,
  unauthorized: HttpStatus.UNAUTHORIZED,
  'not-found': HttpStatus.NOT_FOUND,
  conflict: HttpStatus.CONFLICT,
  forbidden: HttpStatus.FORBIDDEN,
};

/** Translates domain errors into HTTP responses. */
@Catch(DomainError)
export class DomainErrorFilter implements ExceptionFilter {
  catch(error: DomainError, host: ArgumentsHost) {
    const status = STATUS_BY_KIND[error.kind];
    host.switchToHttp().getResponse<Response>().status(status).json({
      statusCode: status,
      code: error.code,
      message: error.message,
    });
  }
}
