import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';
import { DomainError } from './domain-error.js';

// Mesmo formato do 400 do ValidationPipe: `message` é sempre um array.
@Catch(DomainError)
export class DomainErrorFilter implements ExceptionFilter<DomainError> {
  catch(error: DomainError, host: ArgumentsHost): void {
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(400)
      .json({
        statusCode: 400,
        error: 'Bad Request',
        message: [error.message],
      });
  }
}
