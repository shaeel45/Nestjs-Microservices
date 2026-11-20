import { ArgumentsHost } from '@nestjs/common';
import { BaseRpcExceptionFilter } from '@nestjs/microservices';
export declare class RpcHttpExceptionFilter extends BaseRpcExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost): import("rxjs").Observable<any>;
}
