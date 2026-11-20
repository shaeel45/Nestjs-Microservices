import { BadGatewayException, BadRequestException, ConflictException, ForbiddenException, GatewayTimeoutException, HttpException, InternalServerErrorException, NotFoundException, ServiceUnavailableException, UnauthorizedException, UnprocessableEntityException, } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
export function toHttpException(error) {
    if (error instanceof HttpException)
        return error;
    const err = error;
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
export async function sendRpc(client, cmd, payload) {
    try {
        return await firstValueFrom(client.send({ cmd }, payload));
    }
    catch (error) {
        throw toHttpException(error);
    }
}
//# sourceMappingURL=rpc-client.util.js.map