import { Body, Controller, Get, Inject, Param, ParseIntPipe, Post, Delete, Put } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices/client/index.js';
import { CreateUserDto, UpdateUserDto } from '../../../libs/dto/users/create-user.dto.js';
import type { JwtPayload } from '../../../libs/dto/auth/jwt-payload.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@Controller('users')
export class UsersController {
    constructor(@Inject('USERS_SERVICE')
    private readonly userClient : ClientProxy){}

    @Get()
    findAll() {
        return this.userClient.send({ cmd: 'users.findAll' }, {});
    }

    @Post()
    create(@Body() data: CreateUserDto) {
        return this.userClient.send({ cmd: 'users.create' }, data);
    }

    @Get(':id')
    findById(@Param('id', ParseIntPipe) id:number){
        return this.userClient.send({ cmd: 'users.findById' }, id);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id:number){
        return this.userClient.send({ cmd: 'users.delete' }, id);
    }

    @Put()
    update(@Body() data: UpdateUserDto & { id: number }) {
        return this.userClient.send({ cmd: 'users.update' }, data );
    }

    @Get('me')
    getMe(@CurrentUser() user: JwtPayload){
        return this.userClient.send(
            {
                cmd : 'users.findById'
            },
            user.sub
        )
    }
}
