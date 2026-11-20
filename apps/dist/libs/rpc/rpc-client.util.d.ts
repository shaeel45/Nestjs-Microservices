import { HttpException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
export declare function toHttpException(error: unknown): HttpException;
export declare function sendRpc<T>(client: ClientProxy, cmd: string, payload: unknown): Promise<T>;
