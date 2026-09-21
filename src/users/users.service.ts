import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UsersRepository } from './users.repository.js';
import { CreateUserDto, UpdateUserDto } from '../dto/users/create-user.dto.js';
import { Prisma } from '@prisma/client/extension';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/wasm-compiler-edge';


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

    return user;
  }

  async createUser(dto: CreateUserDto) {
    try {
      return await this.usersRepository.create({
        name: dto.name,
        email: dto.email,
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
}