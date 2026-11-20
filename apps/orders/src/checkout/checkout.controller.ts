import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CheckoutDto } from '../../../libs/dto/orders/checkout.dto.js';
import { CheckoutService } from './checkout.service.js';

@Controller()
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @MessagePattern({ cmd: 'checkout.run' })
  checkout(@Payload() data: CheckoutDto) {
    return this.checkoutService.checkout(data);
  }
}
