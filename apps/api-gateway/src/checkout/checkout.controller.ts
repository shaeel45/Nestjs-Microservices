import { Body, Controller, Inject, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CheckoutDto } from '../../../libs/dto/orders/checkout.dto.js';
import { sendRpc } from '../../../libs/rpc/rpc-client.util.js';
import { Public } from '../auth/decorators/public.decorators.js';

/**
 * One-shot checkout for the storefront. The orders service owns the whole
 * flow: promo validation, stock reserve/consume, order + audit trail,
 * redemption and cart clearing.
 */
@Public()
@Controller('checkout')
export class CheckoutController {
  constructor(
    @Inject('ORDERS_SERVICE')
    private readonly ordersClient: ClientProxy,
  ) {}

  @Post()
  checkout(@Body() data: CheckoutDto) {
    return sendRpc(this.ordersClient, 'checkout.run', data);
  }
}
