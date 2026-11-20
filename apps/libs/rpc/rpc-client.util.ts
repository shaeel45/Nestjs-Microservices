import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  GatewayTimeoutException,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

/**
 * Translate a downstream microservice error into the matching HTTP exception.
 * The shared RpcHttpExceptionFilter ships `{ status, statusCode, message }`, so
 * a 409 from the inventory service stays a 409 at the gateway.
 */
export function toHttpException(error: unknown): HttpException {
  if (error instanceof HttpException) return error;

  const err = error as {
    status?: number | string;
    statusCode?: number | string;
    message?: string | string[];
  };
  const status = Number(err?.statusCode ?? err?.status);
  const message = Array.isArray(err?.message)
    ? err.message.join(', ')
    : err?.message || 'Downstream service error';

  switch (status) {
    case 400:
      return new BadRequestException(message);
    case 401:
      return new UnauthorizedException(message);
    case 403:
      return new ForbiddenException(message);
    case 404:
      return new NotFoundException(message);
    case 409:
      return new ConflictException(message);
    case 422:
      return new UnprocessableEntityException(message);
    case 502:
      return new BadGatewayException(message);
    case 503:
      return new ServiceUnavailableException(message);
    case 504:
      return new GatewayTimeoutException(message);
    default:
      return new InternalServerErrorException(message);
  }
}

/** Send a TCP command and rethrow downstream failures as HTTP exceptions. */
export async function sendRpc<T>(
  client: ClientProxy,
  cmd: string,
  payload: unknown,
): Promise<T> {
  try {
    return await firstValueFrom(client.send<T>({ cmd }, payload));
  } catch (error) {
    throw toHttpException(error);
  }
}
