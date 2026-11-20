import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  Inject,
  InternalServerErrorException,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  CreateOrderDto,
  MyOrdersQueryDto,
  OrderQueryDto,
  UpdateOrderStatusDto,
} from '../../../libs/dto/orders/order.dto.js';
import { Public } from '../auth/decorators/public.decorators.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from '../auth/enums/role.enums.js';

@Controller('orders')
export class OrdersController {
  constructor(
    @Inject('ORDERS_SERVICE')
    private readonly ordersClient: ClientProxy,
  ) {}

  /**
   * Send to the orders microservice and translate its RPC error into the
   * matching HTTP exception so clients get real 400/404/409s.
   */
  private async call<T>(cmd: string, payload: unknown): Promise<T> {
    try {
      return await firstValueFrom(this.ordersClient.send<T>({ cmd }, payload));
    } catch (error) {
      throw this.toHttpError(error);
    }
  }

  private toHttpError(error: unknown) {
    const err = error as {
      status?: number | string;
      statusCode?: number;
      message?: string | string[];
    };
    const status = Number(err?.statusCode ?? err?.status);
    const message = Array.isArray(err?.message)
      ? err.message.join(', ')
      : err?.message || 'Orders service error';

    if (status === 400) return new BadRequestException(message);
    if (status === 404) return new NotFoundException(message);
    if (status === 409) return new ConflictException(message);
    return new InternalServerErrorException(message);
  }

  // --- Storefront (public) ---
  // Static paths are declared before `:id` so they are not shadowed.

  /** Place an order. Money is recomputed by the service. */
  @Public()
  @Post()
  create(@Body() data: CreateOrderDto) {
    return this.call('orders.create', data);
  }

  /** Order history for one storefront customer (id or email). */
  @Public()
  @Get('mine')
  findMine(@Query() query: MyOrdersQueryDto) {
    return this.call('orders.mine', query);
  }

  /** Public receipt lookup by order number (success page / order tracking). */
  @Public()
  @Get('track/:orderNumber')
  findByNumber(@Param('orderNumber') orderNumber: string) {
    return this.call('orders.findByNumber', orderNumber);
  }

  // --- Admin ---

  @Roles(Role.ADMIN)
  @Get()
  findAll(@Query() query: OrderQueryDto) {
    return this.call('orders.findAll', query);
  }

  @Roles(Role.ADMIN)
  @Get(':id/events')
  events(@Param('id', ParseIntPipe) id: number) {
    return this.call('orders.events', id);
  }

  @Roles(Role.ADMIN)
  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.call('orders.findById', id);
  }

  @Roles(Role.ADMIN)
  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() order: UpdateOrderStatusDto,
  ) {
    return this.call('orders.updateStatus', { id, order });
  }
}
