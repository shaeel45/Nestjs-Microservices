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

@Controller('users')
export class UsersController {
  constructor(
    @Inject('USERS_SERVICE')
    private readonly userClient: ClientProxy,
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

  //DELETE: users/id
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.userClient.send({ cmd: 'users.delete' }, id);
  }

  //PUT: users
  @Put()
  update(@Body() data: UpdateUserDto & { id: number }) {
    return this.userClient.send({ cmd: 'users.update' }, data);
  }
}
