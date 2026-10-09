import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import {
  CreateProductDto,
  UpdateProductDto,
} from '../../libs/dto/products/product.dto.js';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.products.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: number) {
    const product = await this.prisma.products.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  create(data: CreateProductDto) {
    return this.prisma.products.create({ data });
  }

  async update(id: number, data: UpdateProductDto) {
    await this.findById(id);
    return this.prisma.products.update({ where: { id }, data });
  }

  async updateImage(id: number, imageURL: string) {
    await this.findById(id);
    return this.prisma.products.update({
      where: { id },
      data: { imageURL },
    });
  }

  async remove(id: number) {
    await this.findById(id);
    return this.prisma.products.delete({ where: { id } });
  }
}
