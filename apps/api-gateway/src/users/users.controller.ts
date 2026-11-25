import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  InternalServerErrorException,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices/client/index.js';
import { firstValueFrom } from 'rxjs';

import {
  CreateUserDto,
  ShippingAddressDto,
  UpdateShippingAddressDto,
  UpdateUserDto,
} from '../../../libs/dto/users/create-user.dto.js';
import type { JwtPayload } from '../../../libs/dto/auth/jwt-payload.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from '../auth/enums/role.enums.js';

type CustomerOrderRow = {
  id: number;
  orderNumber?: string;
  customerId?: string | null;
  customerEmail?: string | null;
  status?: string;
  total?: number;
  createdAt?: string | Date;
  itemCount?: number;
};

type CustomerUserRow = {
  id: number;
  email?: string;
  [key: string]: unknown;
};

@Controller('users')
export class UsersController {
  constructor(
    @Inject('USERS_SERVICE')
    private readonly userClient: ClientProxy,
    @Inject('ORDERS_SERVICE')
    private readonly ordersClient: ClientProxy,
  ) {}

  /** Send to the users microservice and keep its HTTP status on the gateway. */
  private async call<T>(cmd: string, payload: unknown): Promise<T> {
    try {
      return await firstValueFrom(this.userClient.send<T>({ cmd }, payload));
    } catch (error) {
      const err = error as {
        status?: number | string;
        statusCode?: number;
        message?: string | string[];
      };
      const status = Number(err?.statusCode ?? err?.status);
      const message = Array.isArray(err?.message)
        ? err.message.join(', ')
        : err?.message || 'Users service error';

      if (status === 400) throw new BadRequestException(message);
      if (status === 404) throw new NotFoundException(message);
      throw new InternalServerErrorException(message);
    }
  }

  //Get: users/admin/users
  @Roles(Role.ADMIN)
  @Get('admin/users')
  findAllAdmin() {
    return this.userClient.send({ cmd: 'users.findAll' }, {});
  }

  /**
   * Customers for the admin portal, enriched with order counts, lifetime spend
   * and a short order history so "View Orders" needs no second request.
   */
  @Roles(Role.ADMIN)
  @Get('admin/customers')
  async findCustomers() {
    const [users, orderPage] = await Promise.all([
      firstValueFrom(
        this.userClient.send<CustomerUserRow[]>({ cmd: 'users.findAll' }, {}),
      ),
      firstValueFrom(
        this.ordersClient.send<{ data?: CustomerOrderRow[] }>(
          { cmd: 'orders.findAll' },
          { all: true },
        ),
      ).catch(() => null),
    ]);

    const rows = Array.isArray(users) ? users : [];
    const orders = Array.isArray(orderPage?.data) ? orderPage.data : [];

    // Index orders by both identifiers so a renamed email or a missing
    // customerId still resolves to the right customer.
    const byKey = new Map<string, CustomerOrderRow[]>();
    const addToIndex = (key: string, order: CustomerOrderRow) => {
      const list = byKey.get(key) ?? [];
      list.push(order);
      byKey.set(key, list);
    };

    for (const order of orders) {
      if (order.customerId) addToIndex(`id:${String(order.customerId)}`, order);
      if (order.customerEmail) {
        addToIndex(`email:${order.customerEmail.toLowerCase()}`, order);
      }
    }

    return rows.map((user) => {
      const matched = new Map<string, CustomerOrderRow>();
      const keys = [
        `id:${String(user.id)}`,
        `email:${String(user.email ?? '').toLowerCase()}`,
      ];

      for (const key of keys) {
        for (const order of byKey.get(key) ?? []) {
          matched.set(String(order.id), order);
        }
      }

      const history = [...matched.values()].sort(
        (a, b) =>
          new Date(b.createdAt ?? 0).getTime() -
          new Date(a.createdAt ?? 0).getTime(),
      );

      const totalSpent = history
        .filter((order) => order.status !== 'CANCELLED')
        .reduce((sum, order) => sum + (Number(order.total) || 0), 0);

      return {
        ...user,
        orderCount: history.length,
        totalSpent: Math.round(totalSpent * 100) / 100,
        orders: history.slice(0, 25).map((order) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          createdAt: order.createdAt,
          total: order.total,
          status: order.status,
          itemCount: order.itemCount ?? 0,
        })),
      };
    });
  }
  //Get: users
  @Roles(Role.ADMIN)
  @Get()
  findAll() {
    return this.userClient.send({ cmd: 'users.findAll' }, {});
  }

  //POST: users
  @Post()
  create(@Body() data: CreateUserDto) {
    return this.userClient.send({ cmd: 'users.create' }, data);
  }

  //Get: users/me
  @Roles(Role.CUSTOMER, Role.ADMIN)
  @Get('me')
  getMe(@CurrentUser('sub') userId: number) {
    return firstValueFrom(
      this.userClient.send(
        {
          cmd: 'users.findById',
        },
        userId,
      ),
    );
  }

  //Get: users/me/address — the saved default shipping address.
  @Roles(Role.CUSTOMER, Role.ADMIN)
  @Get('me/address')
  getMyAddress(@CurrentUser('sub') userId: number) {
    return this.call('users.address.get', userId);
  }

  //PUT: users/me/address — replace the shipping address (profile form save).
  @Roles(Role.CUSTOMER, Role.ADMIN)
  @Put('me/address')
  replaceMyAddress(
    @CurrentUser('sub') userId: number,
    @Body() address: ShippingAddressDto,
  ) {
    return this.call('users.address.update', { userId, address });
  }

  //PATCH: users/me/address — partial update for individual fields.
  @Roles(Role.CUSTOMER, Role.ADMIN)
  @Patch('me/address')
  updateMyAddress(
    @CurrentUser('sub') userId: number,
    @Body() address: UpdateShippingAddressDto,
  ) {
    return this.call('users.address.update', { userId, address });
  }

  //Get: users/id
  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.userClient.send({ cmd: 'users.findById' }, id);
  }

  //DELETE: users/id — admin only.
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.call('users.delete', id);
  }

  //PUT: users
  @Put()
  update(@Body() data: UpdateUserDto & { id: number }) {
    return this.userClient.send({ cmd: 'users.update' }, data);
  }
}
