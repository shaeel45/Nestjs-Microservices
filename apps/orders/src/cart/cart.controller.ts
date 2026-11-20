import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  AddCartItemDto,
  ApplyCartPromoDto,
  CartLookupDto,
  CartTokenDto,
  ReplaceCartDto,
} from '../../../libs/dto/orders/cart.dto.js';
import { CartService } from './cart.service.js';

@Controller()
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @MessagePattern({ cmd: 'cart.get' })
  get(@Payload() data: CartLookupDto) {
    return this.cartService.getCart(data.cartToken, data);
  }

  @MessagePattern({ cmd: 'cart.addItem' })
  addItem(@Payload() data: AddCartItemDto) {
    return this.cartService.addItem(data);
  }

  /** Supports absolute quantity OR delta (+1 increment, -1 decrement). */
  @MessagePattern({ cmd: 'cart.updateItem' })
  updateItem(
    @Payload()
    data: {
      cartToken: string;
      itemId: number;
      quantity?: number;
      delta?: number;
    },
  ) {
    return this.cartService.updateItem({
      cartToken: data.cartToken,
      itemId: Number(data.itemId),
      quantity:
        data.quantity !== undefined && data.quantity !== null
          ? Number(data.quantity)
          : undefined,
      delta:
        data.delta !== undefined && data.delta !== null
          ? Number(data.delta)
          : undefined,
    });
  }

  @MessagePattern({ cmd: 'cart.removeItem' })
  removeItem(@Payload() data: { cartToken: string; itemId: number }) {
    return this.cartService.removeItem(data.cartToken, Number(data.itemId));
  }

  @MessagePattern({ cmd: 'cart.replace' })
  replace(@Payload() data: ReplaceCartDto) {
    return this.cartService.replaceItems(data);
  }

  @MessagePattern({ cmd: 'cart.clear' })
  clear(@Payload() data: CartTokenDto) {
    return this.cartService.clear(data.cartToken);
  }

  @MessagePattern({ cmd: 'cart.applyPromo' })
  applyPromo(@Payload() data: ApplyCartPromoDto) {
    return this.cartService.applyPromo(data.cartToken, data.code);
  }

  @MessagePattern({ cmd: 'cart.removePromo' })
  removePromo(@Payload() data: CartTokenDto) {
    return this.cartService.removePromo(data.cartToken);
  }
}
