import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UsersService } from './users.service.js';
import {
  CreateUserDto,
  UpdateShippingAddressDto,
  UpdateUserDto,
} from '../../../libs/dto/users/create-user.dto.js';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @MessagePattern({ cmd: 'users.findAll' })
  findAll() {
    return this.usersService.getUsers();
  }

  @MessagePattern({ cmd: 'users.findById' })
  findById(id: number) {
    return this.usersService.getUserById(id);
  }

  @MessagePattern({ cmd: 'users.create' })
  create(data: CreateUserDto) {
    return this.usersService.createUser(data);
  }

  @MessagePattern({ cmd: 'users.update' })
  update(data: UpdateUserDto & { id: number }) {
    return this.usersService.updateUser(data.id, data);
  }

  @MessagePattern({ cmd: 'users.delete' })
  remove(id: number) {
    return this.usersService.deleteUser(id);
  }

  @MessagePattern({ cmd: 'users.findByEmail' })
  findByEmail(email: string) {
    return this.usersService.findByEmail(email);
  }

  @MessagePattern({ cmd: 'users.address.get' })
  getAddress(@Payload() userId: number) {
    return this.usersService.getShippingAddress(Number(userId));
  }

  @MessagePattern({ cmd: 'users.address.update' })
  updateAddress(
    @Payload() data: { userId: number; address: UpdateShippingAddressDto },
  ) {
    return this.usersService.updateShippingAddress(
      Number(data.userId),
      data.address,
    );
  }
}