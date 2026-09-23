import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { Prisma } from '@prisma/client/extension';
import { CreateUserDto, UpdateUserDto } from '../../../libs/dto/users/create-user.dto.js';
// import {Prisma, User} from '@prisma/client';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany() {
    return this.prisma.user.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  create(data: CreateUserDto) {
    return this.prisma.user.create({
      data,
    });
  }

  update(id: number, data: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  delete(id: number) {
    return this.prisma.user.delete({
      where: { id },
    });
  }
}