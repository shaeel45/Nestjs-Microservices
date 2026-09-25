import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { UsersService } from './users.service.js';
import {
  CreateUserDto,
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
}