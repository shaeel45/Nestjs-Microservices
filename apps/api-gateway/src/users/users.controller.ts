import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices/client/index.js';
import { firstValueFrom } from 'rxjs';

import { CreateUserDto, UpdateUserDto } from '../../../libs/dto/users/create-user.dto.js';
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
