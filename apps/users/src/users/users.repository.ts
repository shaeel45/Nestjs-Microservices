import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { Prisma } from '@prisma/client/extension';
import {
  CreateUserDto,
  UpdateShippingAddressDto,
  UpdateUserDto,
} from '../../../libs/dto/users/create-user.dto.js';
import { Role } from '../generated/prisma/enums.js';
// import {Prisma, User} from '@prisma/client';

/** Columns that make up the customer's default shipping address. */
export const SHIPPING_ADDRESS_SELECT = {
  addressStreet: true,
  addressCity: true,
  addressState: true,
  addressPostalCode: true,
  addressCountry: true,
} as const;

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

  findShippingAddress(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: SHIPPING_ADDRESS_SELECT,
    });
  }

  updateShippingAddress(id: number, data: UpdateShippingAddressDto) {
    const update: {
      addressStreet?: string;
      addressCity?: string;
      addressState?: string;
      addressPostalCode?: string;
      addressCountry?: string;
    } = {};

    if (data.street !== undefined) update.addressStreet = data.street;
    if (data.city !== undefined) update.addressCity = data.city;
    if (data.state !== undefined) update.addressState = data.state;
    if (data.postalCode !== undefined) update.addressPostalCode = data.postalCode;
    if (data.country !== undefined) update.addressCountry = data.country;

    return this.prisma.user.update({
      where: { id },
      data: update,
      select: SHIPPING_ADDRESS_SELECT,
    });
  }
}