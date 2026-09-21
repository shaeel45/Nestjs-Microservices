import { Body, Controller, Get, Post } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { CreateUserDto } from '../dto/users/create-user.dto.js';

@Controller('users')
export class UsersController {
    constructor(private readonly user: UsersService) {} 

    @Get()
    findAll() {
        return this.user.getUsers();
    }

    @Post()
    create(@Body() data: CreateUserDto) {
        return this.user.createUser(data);
    }
}
