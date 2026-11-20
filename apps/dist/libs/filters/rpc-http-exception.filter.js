var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Catch, HttpException } from '@nestjs/common';
import { BaseRpcExceptionFilter } from '@nestjs/microservices';
import { throwError } from 'rxjs';
let RpcHttpExceptionFilter = class RpcHttpExceptionFilter extends BaseRpcExceptionFilter {
    catch(exception, host) {
        if (exception instanceof HttpException) {
            const status = exception.getStatus();
            const response = exception.getResponse();
            const rawMessage = typeof response === 'string'
                ? response
                : response.message;
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
};
RpcHttpExceptionFilter = __decorate([
    Catch()
], RpcHttpExceptionFilter);
export { RpcHttpExceptionFilter };
//# sourceMappingURL=rpc-http-exception.filter.js.map