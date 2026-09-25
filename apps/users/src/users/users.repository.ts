import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { Prisma } from '@prisma/client/extension';
import { CreateUserDto, UpdateUserDto } from '../../../libs/dto/users/create-user.dto.js';
import { Role } from '../generated/prisma/enums.js';
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
      data: {
        fullname: data.fullname,
        lastname: data.lastname,
        email: data.email,
        role: data.role as Role,
      },
    });
  }

  update(id: number, data: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data: {
        fullname: data.fullname,
        lastname: data.lastname,
        email: data.email,
        role: data.role as Role,
      },
    });
  }

  delete(id: number) {
    return this.prisma.user.delete({
      where: { id },
    });
  }
}