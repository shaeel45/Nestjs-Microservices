import { ArgumentsHost, Catch, HttpException } from '@nestjs/common';
import { BaseRpcExceptionFilter } from '@nestjs/microservices';
import { EMPTY, throwError } from 'rxjs';

/**
 * Preserve HTTP semantics (status + message) when an HttpException is
 * thrown inside a TCP microservice. The default RPC filter collapses
 * everything to a generic "Internal server error", which makes the
 * gateway unable to return 400/404/409 responses.
 *
 * Shared by every microservice that exposes HttpException-based
 * validation to the API gateway.
 */
@Catch()
export class RpcHttpExceptionFilter extends BaseRpcExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // The monolith registers this filter for both contexts. HTTP requests
    // keep Nest's normal JSON error contract; only RPC errors need the
    // status-preserving envelope below.
    if (host.getType() === 'http') {
      const response = host.switchToHttp().getResponse<{
        status(code: number): { json(body: unknown): void };
      }>();

      // Errors coming back from a TCP call arrive as a plain
      // { status, statusCode, message, error } object rather than an
      // HttpException, so translate them before writing the response.
      const rpcError = exception as {
        status?: number | string;
        statusCode?: number;
        message?: string | string[];
        error?: string;
      };
      const status =
        exception instanceof HttpException
          ? exception.getStatus()
          : Number(rpcError?.statusCode ?? rpcError?.status) || 500;
      const payload =
        exception instanceof HttpException
          ? exception.getResponse()
          : {
              statusCode: status,
              message: Array.isArray(rpcError?.message)
                ? rpcError.message.join(', ')
                : rpcError?.message || 'Internal server error',
              error: rpcError?.error,
            };

      response
        .status(status)
        .json(
          typeof payload === 'string'
            ? { statusCode: status, message: payload }
            : payload,
        );
      // The HTTP adapter ignores a filter's return value; the response has
      // already been written above.
      return EMPTY;
    }

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
