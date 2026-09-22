import { Body, Controller, Get, Inject, Param, ParseIntPipe, Post, Delete, Put } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices/client/index.js';

@Controller('users')
export class UsersController {
    constructor(@Inject('USERS_SERVICE')
    private readonly userClient : ClientProxy){}

    @Get()
    findAll() {
        return this.userClient.send({ cmd: 'users.findAll' }, {});
    }

    @Post()
    create(@Body() data: { name: string; email: string }) {
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
    update(@Body() data: { id: number; name: string; email: string }) {
        return this.userClient.send({ cmd: 'users.update' }, data );
    }
}
