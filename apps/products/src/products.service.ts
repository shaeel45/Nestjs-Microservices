import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../database/prisma.service.js';
import {
  CreateProductDto,
  ProductPaginationQueryDto,
  UpdateProductDto,
} from '../../libs/dto/products/product.dto.js';

type InventoryItemSummary = {
  id: number;
  productId: number;
  quantity: number;
  reservedQuantity: number;
};

type StockDiscrepancy = {
  type: 'missing_inventory' | 'quantity_mismatch' | 'orphan_inventory';
  productId: number;
  productName: string | null;
  productStock: number | null;
  inventoryQuantity: number | null;
  resolved: boolean;
  error?: string;
};

function toArray(value?: string | string[] | null): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
}

function toJson(value: any, fallback: any): any {
  if (value === undefined || value === null) return fallback;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }
  return value;
}

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject('INVENTORY_SERVICE')
    private readonly inventoryClient: ClientProxy,
  ) {}

  private inventory<T>(cmd: string, payload: unknown): Promise<T> {
    return firstValueFrom(this.inventoryClient.send<T>({ cmd }, payload));
  }

  async findAll(query?: ProductPaginationQueryDto) {
    const isAll = query?.all === true || query?.all === 'true';
    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.max(1, Number(query?.limit) || 12);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query?.category && query.category !== 'all') {
      where.category = { equals: query.category, mode: 'insensitive' };
    }

    if (query?.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { category: { contains: term, mode: 'insensitive' } },
      ];
    }

    if (query?.minPrice !== undefined && !Number.isNaN(Number(query.minPrice))) {
      where.price = { ...(where.price || {}), gte: Number(query.minPrice) };
    }

    if (query?.maxPrice !== undefined && !Number.isNaN(Number(query.maxPrice))) {
      where.price = { ...(where.price || {}), lte: Number(query.maxPrice) };
    }

    if (query?.inStock === true || query?.inStock === 'true') {
      where.stock = { gt: 0 };
    }

    let orderBy: any = { createdAt: 'desc' };
    if (query?.sortBy === 'price-asc') {
      orderBy = { price: 'asc' };
    } else if (query?.sortBy === 'price-desc') {
      orderBy = { price: 'desc' };
    } else if (query?.sortBy === 'newest') {
      orderBy = { createdAt: 'desc' };
    } else if (query?.sortBy === 'featured') {
      orderBy = [{ isFeatured: 'desc' }, { createdAt: 'desc' }];
    }

    if (isAll) {
      const data = await this.prisma.products.findMany({
        where,
        orderBy,
      });
      return {
        data,
        total: data.length,
        page: 1,
        limit: data.length,
        totalPages: 1,
      };
    }

    const [total, data] = await Promise.all([
      this.prisma.products.count({ where }),
      this.prisma.products.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findById(id: number) {
    const product = await this.prisma.products.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  async create(data: CreateProductDto) {
    const stock = Math.max(0, Math.trunc(Number(data.stock) || 0));
    const formattedData: any = {
      name: data.name,
      description: data.description ?? '',
      price: Number(data.price) || 0,
      original_price: Number(data.original_price ?? data.price) || 0,
      stock,
      category: data.category ?? '',
      imageURL: data.imageURL ?? '',
      isNew: Boolean(data.isNew),
      isTrending: Boolean(data.isTrending),
      isFeatured: Boolean(data.isFeatured),
      colors: toArray(data.colors),
      sizes: toArray(data.sizes),
      images: toArray(data.images),
      details: toArray(data.details),
      rating: toJson(data.rating, { rate: 0, count: 0 }),
      review: toJson(data.review, []),
    };

    const product = await this.prisma.products.create({ data: formattedData });
    // Auto-create the matching inventory record so every product is tracked.
    await this.ensureInventory(product.id, stock);
    return product;
  }

  /** Create-if-missing inventory record; never blocks product creation. */
  private async ensureInventory(productId: number, stock: number) {
    try {
      await this.inventory('inventory.ensureStock', {
        productId,
        quantity: Math.max(0, Math.trunc(Number(stock) || 0)),
      });
    } catch (error) {
      this.logger.warn(
        `Could not create inventory for product ${productId}: ${
          (error as Error).message
        }`,
      );
    }
  }

  /**
   * Stock edits go through the inventory service so every change is
   * audited. Inventory is authoritative; the product `stock` field is
   * only a catalog cache and is set to the quantity inventory returns.
   */
  private async resolveStock(
    productId: number,
    currentStock: number,
    nextStock: number,
  ): Promise<number> {
    const target = Math.max(0, Math.trunc(Number(nextStock) || 0));

    let ensured: {
      item?: { quantity?: number };
      created?: boolean;
    };
    try {
      ensured = await this.inventory('inventory.ensureStock', {
        productId,
        quantity: target,
      });
    } catch (error) {
      throw new Error(
        `Inventory service unavailable; stock was not changed: ${
          (error as Error).message
        }`,
      );
    }

    if (ensured?.created) return target;

    const base = Number(ensured?.item?.quantity ?? currentStock);
    const delta = target - base;
    if (delta === 0) return base;

    const adjusted = await this.inventory<{ item?: { quantity?: number } }>(
      'inventory.adjustStock',
      {
        productId,
        changeAmount: delta,
        type: 'ADJUSTMENT',
        performedBy: 'admin-portal',
        reason: 'Product stock edited from the admin portal',
      },
    );

    return Number(adjusted?.item?.quantity ?? target);
  }

  async update(id: number, data: UpdateProductDto) {
    const current = await this.findById(id);

    const formattedData: any = {};
    if (data.name !== undefined) formattedData.name = data.name;
    if (data.description !== undefined) formattedData.description = data.description;
    if (data.price !== undefined) formattedData.price = Number(data.price) || 0;
    if (data.original_price !== undefined) formattedData.original_price = Number(data.original_price) || 0;
    if (data.stock !== undefined) {
      formattedData.stock = await this.resolveStock(id, current.stock, data.stock);
    }
    if (data.category !== undefined) formattedData.category = data.category;
    if (data.imageURL !== undefined) formattedData.imageURL = data.imageURL;
    if (data.isNew !== undefined) formattedData.isNew = Boolean(data.isNew);
    if (data.isTrending !== undefined) formattedData.isTrending = Boolean(data.isTrending);
    if (data.isFeatured !== undefined) formattedData.isFeatured = Boolean(data.isFeatured);
    if (data.colors !== undefined) formattedData.colors = toArray(data.colors);
    if (data.sizes !== undefined) formattedData.sizes = toArray(data.sizes);
    if (data.images !== undefined) formattedData.images = toArray(data.images);
    if (data.details !== undefined) formattedData.details = toArray(data.details);
    if (data.rating !== undefined) formattedData.rating = toJson(data.rating, { rate: 0, count: 0 });
    if (data.review !== undefined) formattedData.review = toJson(data.review, []);

    return this.prisma.products.update({ where: { id }, data: formattedData });
  }

  async updateImage(id: number, imageURL: string) {
    await this.findById(id);
    return this.prisma.products.update({
      where: { id },
      data: { imageURL },
    });
  }

  async addReview(id: number, reviewData: { author: string; rating: number; comment: string }) {
    const product = await this.findById(id);
    const existingReviews: any[] = Array.isArray(product.review) ? (product.review as any[]) : [];
    const newReview = {
      id: Date.now(),
      author: reviewData.author || 'Anonymous',
      role: 'Verified Buyer',
      rating: Number(reviewData.rating) || 5,
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      comment: reviewData.comment || '',
      product: product.name,
    };
    const updatedReviews = [newReview, ...existingReviews];
    const totalRating = updatedReviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0);
    const avgRating = Number((totalRating / updatedReviews.length).toFixed(1));
    const newRating = { rate: avgRating, count: updatedReviews.length };

    return this.prisma.products.update({
      where: { id },
      data: {
        review: updatedReviews,
        rating: newRating,
      },
    });
  }

  async remove(id: number) {
    await this.findById(id);

    // Clean up the inventory record (and its history) before deleting the
    // product so no orphan inventory rows are left behind.
    try {
      await this.inventory('inventory.deleteByProductId', id);
    } catch (error) {
      this.logger.warn(
        `Could not remove inventory for product ${id}: ${
          (error as Error).message
        }`,
      );
    }

    return this.prisma.products.delete({ where: { id } });
  }

  /**
   * Internal hook used by the gateway to mirror an inventory mutation into
   * the catalog stock cache. Never touches the inventory quantity.
   */
  async setStockCache(id: number, stock: number) {
    const productId = Number(id);
    const value = Math.max(0, Math.trunc(Number(stock) || 0));
    const product = await this.prisma.products.findUnique({
      where: { id: productId },
    });
    if (!product) return null;

    return this.prisma.products.update({
      where: { id: productId },
      data: { stock: value },
    });
  }

  /**
   * Compare every product's `stock` cache with the authoritative inventory
   * quantity. With `fix: true`, missing inventory records are created,
   * mismatched caches are corrected from inventory, and orphan inventory
   * rows are removed.
   */
  async reconcileStock(options?: { fix?: boolean }) {
    const fix = options?.fix === true;
    const products = await this.prisma.products.findMany();

    const inventoryResult = await this.inventory<unknown>(
      'inventory.findAll',
      { all: true },
    );
    const items: InventoryItemSummary[] = Array.isArray(inventoryResult)
      ? (inventoryResult as InventoryItemSummary[])
      : ((inventoryResult as { data?: InventoryItemSummary[] })?.data ?? []);

    const byProduct = new Map<number, InventoryItemSummary>();
    for (const item of items) {
      byProduct.set(Number(item.productId), item);
    }
    const productIds = new Set(products.map((product) => product.id));

    const discrepancies: StockDiscrepancy[] = [];

    for (const product of products) {
      const item = byProduct.get(product.id);

      if (!item) {
        const entry: StockDiscrepancy = {
          type: 'missing_inventory',
          productId: product.id,
          productName: product.name,
          productStock: product.stock,
          inventoryQuantity: null,
          resolved: false,
        };
        discrepancies.push(entry);

        if (fix) {
          try {
            await this.inventory('inventory.ensureStock', {
              productId: product.id,
              quantity: product.stock,
            });
            entry.resolved = true;
          } catch (error) {
            entry.error = (error as Error).message;
          }
        }
        continue;
      }

      if (Number(item.quantity) !== Number(product.stock)) {
        const entry: StockDiscrepancy = {
          type: 'quantity_mismatch',
          productId: product.id,
          productName: product.name,
          productStock: product.stock,
          inventoryQuantity: Number(item.quantity),
          resolved: false,
        };
        discrepancies.push(entry);

        if (fix) {
          try {
            // Inventory is authoritative → correct the catalog cache.
            await this.prisma.products.update({
              where: { id: product.id },
              data: { stock: Number(item.quantity) },
            });
            entry.resolved = true;
          } catch (error) {
            entry.error = (error as Error).message;
          }
        }
      }
    }

    for (const item of items) {
      if (productIds.has(Number(item.productId))) continue;

      const entry: StockDiscrepancy = {
        type: 'orphan_inventory',
        productId: Number(item.productId),
        productName: null,
        productStock: null,
        inventoryQuantity: Number(item.quantity),
        resolved: false,
      };
      discrepancies.push(entry);

      if (fix) {
        try {
          await this.inventory('inventory.deleteByProductId', item.productId);
          entry.resolved = true;
        } catch (error) {
          entry.error = (error as Error).message;
        }
      }
    }

    return {
      checkedProducts: products.length,
      inventoryRecords: items.length,
      discrepanciesFound: discrepancies.length,
      discrepanciesFixed: discrepancies.filter((entry) => entry.resolved)
        .length,
      fixed: fix,
      discrepancies,
    };
  }
}

