import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UsersRepository } from './users.repository.js';
import {
  CreateUserDto,
  UpdateShippingAddressDto,
  UpdateUserDto,
} from '../../../libs/dto/users/create-user.dto.js';
import { Prisma } from '@prisma/client/extension';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/wasm-compiler-edge';

/** Address shape returned by the users API (matches the storefront model). */
export type ShippingAddress = {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  hasAddress: boolean;
};

type AddressColumns = {
  addressStreet?: string | null;
  addressCity?: string | null;
  addressState?: string | null;
  addressPostalCode?: string | null;
  addressCountry?: string | null;
};

/** Flatten the address columns into the object the frontends consume. */
export function toShippingAddress(row: AddressColumns | null): ShippingAddress {
  const street = row?.addressStreet ?? '';
  const city = row?.addressCity ?? '';
  const state = row?.addressState ?? '';
  const postalCode = row?.addressPostalCode ?? '';
  const country = row?.addressCountry ?? '';

  return {
    street,
    city,
    state,
    postalCode,
    country: country || 'United States',
    hasAddress: Boolean(street || city || postalCode),
  };
}

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
  ) {}

  async getUsers() {
    return this.usersRepository.findMany();
  }

  async getUserById(id: number) {
    const user = await this.usersRepository.findById(id);

    if (!user) {
      throw new NotFoundException(
        `User with ID ${id} not found`,
      );
    }

    return {
      ...user,
      address: toShippingAddress(user),
    };
  }

  async getShippingAddress(userId: number) {
    const address = await this.usersRepository.findShippingAddress(userId);

    if (!address) {
      throw new NotFoundException(
        `User with ID ${userId} not found`,
      );
    }

    return toShippingAddress(address);
  }

  async updateShippingAddress(
    userId: number,
    dto: UpdateShippingAddressDto,
  ) {
    // Reuse the guard so a missing user yields a 404 instead of a Prisma error.
    await this.getUserById(userId);

    const updated = await this.usersRepository.updateShippingAddress(
      userId,
      dto,
    );

    return toShippingAddress(updated);
  }

  async createUser(dto: CreateUserDto) {
    try {
      return await this.usersRepository.create({
        fullname: dto.fullname,
        lastname: dto.lastname,
        email: dto.email,
        role: dto.role, 
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Email already exists',
        );
      }

      throw error;
    }
  }

  async updateUser(
    id: number,
    dto: UpdateUserDto,
  ) {
    await this.getUserById(id);

    try {
      return await this.usersRepository.update(
        id,
        dto,
      );
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Email already exists',
        );
      }

      throw error;
    }
  }

  async deleteUser(id: number) {
    await this.getUserById(id);

    await this.usersRepository.delete(id);

    return {
      message: 'User deleted successfully',
    };
  }

  findByEmail(email: string) {
    return this.usersRepository.findByEmail(email);
  }
}