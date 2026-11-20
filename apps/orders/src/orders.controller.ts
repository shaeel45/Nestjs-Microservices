import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  CreateOrderDto,
  MyOrdersQueryDto,
  OrderQueryDto,
  UpdateOrderStatusDto,
} from '../../libs/dto/orders/order.dto.js';
import { OrdersService } from './orders.service.js';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @MessagePattern({ cmd: 'orders.findAll' })
  findAll(@Payload() query?: OrderQueryDto) {
    return this.ordersService.findAll(query);
  }

  /** Storefront: orders belonging to one customer. */
  @MessagePattern({ cmd: 'orders.mine' })
  findMine(@Payload() query?: MyOrdersQueryDto) {
    return this.ordersService.findMine(query);
  }

  /** Storefront: public receipt lookup by order number. */
  @MessagePattern({ cmd: 'orders.findByNumber' })
  findByNumber(@Payload() orderNumber: string) {
    return this.ordersService.findByNumber(orderNumber);
  }

  @MessagePattern({ cmd: 'orders.findById' })
  findById(@Payload() id: number) {
    return this.ordersService.findById(Number(id));
  }

  @MessagePattern({ cmd: 'orders.create' })
  create(@Payload() data: CreateOrderDto) {
    return this.ordersService.create(data);
  }

  @MessagePattern({ cmd: 'orders.updateStatus' })
  updateStatus(@Payload() data: { id: number; order: UpdateOrderStatusDto }) {
    return this.ordersService.updateStatus(Number(data.id), data.order);
  }

  @MessagePattern({ cmd: 'orders.events' })
  events(@Payload() id: number) {
    return this.ordersService.getEvents(Number(id));
  }
}
