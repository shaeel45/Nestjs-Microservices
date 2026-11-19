import { ArgumentsHost, Catch, HttpException } from '@nestjs/common';
import { BaseRpcExceptionFilter } from '@nestjs/microservices';
import { throwError } from 'rxjs';

/**
 * Preserve HTTP semantics (status + message) when an HttpException is
 * thrown inside the TCP microservice. The default RPC filter collapses
 * everything to a generic "Internal server error", which makes the
 * gateway unable to return 400/404/409 responses.
 */
@Catch()
export class RpcHttpExceptionFilter extends BaseRpcExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      const rawMessage =
        typeof response === 'string'
          ? response
          : (response as { message?: string | string[] }).message;
      const message = Array.isArray(rawMessage)
        ? rawMessage.join(', ')
        : rawMessage || exception.message;

      return throwError(() => ({
        status,
        statusCode: status,
        message,
        error: exception.name,
      }));
    }

    return super.catch(exception, host);
  }
}
