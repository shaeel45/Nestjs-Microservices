import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import {
  CreateInventoryDto,
  InventoryQueryDto,
  UpdateInventoryDto,
  AdjustStockDto,
} from '../../libs/dto/inventory/inventory.dto.js';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query?: InventoryQueryDto) {
    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.max(1, Number(query?.limit) || 20);

    const isLowStock = query?.lowStock === true || query?.lowStock === 'true';
    const isOutOfStock = query?.outOfStock === true || query?.outOfStock === 'true';

    const where: any = {};

    if (query?.productId !== undefined && !Number.isNaN(Number(query.productId))) {
      where.productId = Number(query.productId);
    }

    if (query?.warehouse && query.warehouse !== 'all') {
      where.warehouse = { equals: query.warehouse, mode: 'insensitive' };
    }

    if (isOutOfStock) {
      where.quantity = { lte: 0 };
    }

    const take = isLowStock ? undefined : limit;
    const skip = isLowStock ? undefined : (page - 1) * limit;

    const [total, data] = await Promise.all([
      this.prisma.inventoryItems.count({ where }),
      this.prisma.inventoryItems.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        ...(skip !== undefined ? { skip } : {}),
        ...(take !== undefined ? { take } : {}),
      }),
    ]);

    let result = data;
    if (isLowStock) {
      result = data.filter((item) => Number(item.quantity) <= Number(item.lowStockThreshold));
    }

    return {
      data: result,
      total: isLowStock ? result.length : total,
      page: isLowStock ? 1 : page,
      limit: isLowStock ? result.length : limit,
      totalPages: isLowStock ? 1 : Math.ceil(total / limit) || 1,
    };
  }

  async findById(id: number) {
    const item = await this.prisma.inventoryItems.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Inventory item with ID ${id} not found`);
    }
    return item;
  }

  async findByProductId(productId: number) {
    const item = await this.prisma.inventoryItems.findUnique({
      where: { productId },
    });
    if (!item) {
      throw new NotFoundException(`Inventory item for product ID ${productId} not found`);
    }
    return item;
  }

  async create(data: CreateInventoryDto) {
    const existing = await this.prisma.inventoryItems.findUnique({
      where: { productId: data.productId },
    });
    if (existing) {
      throw new BadRequestException(
        `Inventory item for product ID ${data.productId} already exists`,
      );
    }

    return this.prisma.inventoryItems.create({
      data: {
        productId: data.productId,
        quantity: Number(data.quantity) || 0,
        reservedQuantity: Number(data.reservedQuantity ?? 0) || 0,
        warehouse: data.warehouse ?? 'default',
        lowStockThreshold: Number(data.lowStockThreshold ?? 10) || 10,
      },
    });
  }

  async update(id: number, data: UpdateInventoryDto) {
    await this.findById(id);

    const formattedData: any = {};
    if (data.quantity !== undefined) formattedData.quantity = Number(data.quantity) || 0;
    if (data.reservedQuantity !== undefined)
      formattedData.reservedQuantity = Number(data.reservedQuantity) || 0;
    if (data.warehouse !== undefined) formattedData.warehouse = data.warehouse;
    if (data.lowStockThreshold !== undefined)
      formattedData.lowStockThreshold = Number(data.lowStockThreshold) || 10;

    return this.prisma.inventoryItems.update({ where: { id }, data: formattedData });
  }

  async adjustStock(data: AdjustStockDto) {
    const item = await this.findByProductId(data.productId);

    const change = data.change ?? 0;
    const newQuantity = Math.max(0, Number(item.quantity) + Number(change));

    return this.prisma.inventoryItems.update({
      where: { productId: data.productId },
      data: { quantity: newQuantity },
    });
  }

  async reserveStock(productId: number, quantity: number) {
    const item = await this.findByProductId(productId);
    const available = Number(item.quantity) - Number(item.reservedQuantity);
    if (available < Number(quantity)) {
      throw new BadRequestException(
        `Insufficient stock for product ID ${productId}. Available: ${available}`,
      );
    }

    return this.prisma.inventoryItems.update({
      where: { productId },
      data: {
        reservedQuantity: Number(item.reservedQuantity) + Number(quantity),
      },
    });
  }

  async releaseStock(productId: number, quantity: number) {
    const item = await this.findByProductId(productId);
    const newReserved = Math.max(
      0,
      Number(item.reservedQuantity) - Number(quantity),
    );

    return this.prisma.inventoryItems.update({
      where: { productId },
      data: { reservedQuantity: newReserved },
    });
  }

  async remove(id: number) {
    await this.findById(id);
    return this.prisma.inventoryItems.delete({ where: { id } });
  }
}
