import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from './generated/prisma/client.js';
import { PrismaService } from '../database/prisma.service.js';
import {
  AdjustStockDto,
  ConsumeStockDto,
  CreateInventoryDto,
  InventoryQueryDto,
  InventoryTransactionType,
  ReleaseStockDto,
  ReserveStockDto,
  TransactionQueryDto,
  UpdateInventoryDto,
} from '../../libs/dto/inventory/inventory.dto.js';

type InventoryItemRow = {
  id: number;
  productId: number;
  quantity: number;
  reservedQuantity: number;
  warehouse: string;
  lowStockThreshold: number;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Stock levels with pagination and filters (including low-stock/out-of-stock).
   * Low-stock compares quantity <= lowStockThreshold at the DB level so totals
   * and pagination stay correct.
   */
  async getStockLevels(query?: InventoryQueryDto) {
    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query?.limit) || 20));
    const skip = (page - 1) * limit;
    const all = query?.all === true;

    const productId =
      query?.productId !== undefined && !Number.isNaN(Number(query.productId))
        ? Number(query.productId)
        : undefined;
    const warehouse =
      query?.warehouse && query.warehouse !== 'all'
        ? query.warehouse
        : undefined;
    const lowStock = query?.lowStock === true;
    const outOfStock = query?.outOfStock === true;

    // Column-to-column comparison (quantity <= lowStockThreshold) needs raw SQL.
    if (lowStock) {
      const conditions: Prisma.Sql[] = [
        Prisma.sql`"quantity" <= "lowStockThreshold"`,
      ];
      if (productId !== undefined) {
        conditions.push(Prisma.sql`"productId" = ${productId}`);
      }
      if (warehouse) {
        conditions.push(
          Prisma.sql`LOWER("warehouse") = LOWER(${warehouse})`,
        );
      }
      if (outOfStock) {
        conditions.push(Prisma.sql`"quantity" <= 0`);
      }
      const where = Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`;

      const [rows, countRows] = await this.prisma.$transaction([
        this.prisma.$queryRaw<InventoryItemRow[]>(Prisma.sql`
          SELECT "id", "productId", "quantity", "reservedQuantity", "warehouse",
                 "lowStockThreshold", "createdAt", "updatedAt"
          FROM "ecommerce_inventory"
          ${where}
          ORDER BY "updatedAt" DESC
          ${all ? Prisma.empty : Prisma.sql`LIMIT ${limit} OFFSET ${skip}`}
        `),
        this.prisma.$queryRaw<{ count: bigint }[]>(Prisma.sql`
          SELECT COUNT(*)::bigint AS count FROM "ecommerce_inventory" ${where}
        `),
      ]);

      const total = Number(countRows[0]?.count ?? 0);
      return all
        ? { data: rows, total, page: 1, limit: total, totalPages: 1 }
        : this.paginated(rows, total, page, limit);
    }

    const where: Prisma.InventoryItemWhereInput = {};
    if (productId !== undefined) where.productId = productId;
    if (warehouse) where.warehouse = { equals: warehouse, mode: 'insensitive' };
    if (outOfStock) where.quantity = { lte: 0 };

    const [total, data] = await this.prisma.$transaction([
      this.prisma.inventoryItem.count({ where }),
      this.prisma.inventoryItem.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        ...(all ? {} : { skip, take: limit }),
      }),
    ]);

    return all
      ? { data, total, page: 1, limit: total, totalPages: 1 }
      : this.paginated(data, total, page, limit);
  }

  /** Backward-compatible alias for the existing `inventory.findAll` command. */
  async findAll(query?: InventoryQueryDto) {
    return this.getStockLevels(query);
  }

  async findById(id: number) {
    const item = await this.prisma.inventoryItem.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Inventory item ${id} not found`);
    }
    return item;
  }

  async findByProductId(productId: number) {
    const item = await this.prisma.inventoryItem.findUnique({
      where: { productId },
    });
    if (!item) {
      throw new NotFoundException(
        `Inventory item for product ${productId} not found`,
      );
    }
    return item;
  }

  async create(data: CreateInventoryDto) {
    const existing = await this.prisma.inventoryItem.findUnique({
      where: { productId: data.productId },
    });
    if (existing) {
      throw new ConflictException(
        `Inventory for product ${data.productId} already exists`,
      );
    }

    const quantity = Number(data.quantity ?? 0);
    const reservedQuantity = Number(data.reservedQuantity ?? 0);
    if (reservedQuantity > quantity) {
      throw new BadRequestException(
        'reservedQuantity cannot exceed quantity',
      );
    }

    return this.prisma.inventoryItem.create({
      data: {
        productId: data.productId,
        quantity,
        reservedQuantity,
        warehouse: data.warehouse ?? 'default',
        lowStockThreshold: Number(data.lowStockThreshold ?? 10),
      },
    });
  }

  /**
   * Idempotent "create if missing" used by the products service when a
   * product is created or when its stock cache is bootstrapped. Unlike
   * `create`, an existing record is returned untouched instead of throwing.
   */
  async ensureStock(data: {
    productId: number;
    quantity?: number;
    warehouse?: string;
    lowStockThreshold?: number;
  }) {
    const productId = Number(data.productId);
    if (!Number.isInteger(productId) || productId <= 0) {
      throw new BadRequestException('productId is required');
    }

    const existing = await this.prisma.inventoryItem.findUnique({
      where: { productId },
    });
    if (existing) {
      return { item: existing, created: false };
    }

    const quantity = Math.max(0, Math.trunc(Number(data.quantity ?? 0)));
    try {
      const item = await this.prisma.inventoryItem.create({
        data: {
          productId,
          quantity,
          reservedQuantity: 0,
          warehouse: data.warehouse ?? 'default',
          lowStockThreshold: Number(data.lowStockThreshold ?? 10),
        },
      });
      return { item, created: true };
    } catch (error) {
      // Concurrent create won the race — return the row that now exists.
      if ((error as { code?: string })?.code === 'P2002') {
        const item = await this.prisma.inventoryItem.findUnique({
          where: { productId },
        });
        if (item) return { item, created: false };
      }
      throw error;
    }
  }

  /**
   * Metadata-only update (warehouse / low-stock threshold). Quantities are
   * intentionally immutable here so every stock change is audited via
   * adjust-stock, reserve, release, or consume.
   */
  async update(id: number, data: UpdateInventoryDto) {
    await this.findById(id);

    return this.prisma.inventoryItem.update({
      where: { id },
      data: {
        ...(data.warehouse !== undefined ? { warehouse: data.warehouse } : {}),
        ...(data.lowStockThreshold !== undefined
          ? { lowStockThreshold: Number(data.lowStockThreshold) }
          : {}),
      },
    });
  }

  /**
   * Atomic stock adjustment with transaction history.
   * The inventory row is locked (SELECT ... FOR UPDATE) so concurrent
   * adjustments serialize and cannot interleave read-modify-write.
   */
  async adjustStock(dto: AdjustStockDto) {
    const changeAmountRaw = dto.changeAmount ?? dto.change;
    if (
      changeAmountRaw === undefined ||
      changeAmountRaw === null ||
      Number.isNaN(Number(changeAmountRaw))
    ) {
      throw new BadRequestException('changeAmount (or change) is required');
    }

    const changeAmount = Math.trunc(Number(changeAmountRaw));
    if (changeAmount === 0) {
      throw new BadRequestException('changeAmount must be non-zero');
    }
    if (!dto.productId && !dto.inventoryItemId) {
      throw new BadRequestException(
        'productId or inventoryItemId is required',
      );
    }

    const type = dto.type ?? InventoryTransactionType.ADJUSTMENT;

    return this.prisma.$transaction(async (tx) => {
      const item = await this.lockItem(tx, {
        productId: dto.productId ? Number(dto.productId) : undefined,
        inventoryItemId: dto.inventoryItemId
          ? Number(dto.inventoryItemId)
          : undefined,
      });

      const quantityBefore = item.quantity;
      const quantityAfter = quantityBefore + changeAmount;

      if (quantityAfter < 0) {
        throw new BadRequestException(
          `Insufficient stock: cannot apply change ${changeAmount} to quantity ${quantityBefore}`,
        );
      }
      if (quantityAfter < item.reservedQuantity) {
        throw new BadRequestException(
          `Adjustment would make quantity (${quantityAfter}) less than reserved (${item.reservedQuantity})`,
        );
      }

      const updated = await tx.inventoryItem.update({
        where: { id: item.id },
        data: { quantity: quantityAfter },
      });

      const transaction = await tx.inventoryTransaction.create({
        data: {
          inventoryItemId: item.id,
          type,
          changeAmount,
          quantityBefore,
          quantityAfter,
          performedBy: dto.performedBy ?? null,
          reason: dto.reason ?? null,
          referenceId: dto.referenceId ?? null,
        },
      });

      return { item: updated, transaction };
    });
  }

  /**
   * Check-and-reserve stock for checkout. Prevents overselling under
   * concurrency: the row is locked and availability (quantity - reserved)
   * is validated inside the same transaction.
   */
  async reserveStock(dto: ReserveStockDto) {
    const quantity = Math.trunc(Number(dto.quantity));
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new BadRequestException('quantity must be a positive integer');
    }
    const productId = Number(dto.productId);

    return this.prisma.$transaction(async (tx) => {
      const item = await this.lockItem(tx, { productId });

      const available = item.quantity - item.reservedQuantity;
      if (available < quantity) {
        throw new ConflictException(
          `Insufficient available stock for product ${productId}. Available: ${available}, requested: ${quantity}`,
        );
      }

      const updated = await tx.inventoryItem.update({
        where: { id: item.id },
        data: { reservedQuantity: { increment: quantity } },
      });

      return {
        item: updated,
        reserved: quantity,
        availableBefore: available,
        availableAfter: available - quantity,
        referenceId: dto.referenceId ?? null,
      };
    });
  }

  /**
   * Release previously reserved stock (checkout cancelled/expired).
   * Atomic and clamped to [0, reservedQuantity].
   */
  async releaseStock(dto: ReleaseStockDto) {
    const quantity = Math.trunc(Number(dto.quantity));
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new BadRequestException('quantity must be a positive integer');
    }
    const productId = Number(dto.productId);

    return this.prisma.$transaction(async (tx) => {
      const item = await this.lockItem(tx, { productId });
      const released = Math.min(quantity, item.reservedQuantity);

      const updated = await tx.inventoryItem.update({
        where: { id: item.id },
        data: { reservedQuantity: item.reservedQuantity - released },
      });

      return {
        item: updated,
        released,
        requested: quantity,
        referenceId: dto.referenceId ?? null,
      };
    });
  }

  /**
   * Finalize a checkout: turn reserved stock into a completed sale.
   * Decrements on-hand quantity and releases the matching reservation in
   * one locked transaction, and writes a SALE history row.
   */
  async consumeStock(dto: ConsumeStockDto) {
    const quantity = Math.trunc(Number(dto.quantity));
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new BadRequestException('quantity must be a positive integer');
    }
    const productId = Number(dto.productId);

    return this.prisma.$transaction(async (tx) => {
      const item = await this.lockItem(tx, { productId });

      if (item.quantity < quantity) {
        throw new ConflictException(
          `Insufficient stock for product ${productId}. On hand: ${item.quantity}, requested: ${quantity}`,
        );
      }

      const quantityBefore = item.quantity;
      const quantityAfter = quantityBefore - quantity;
      const reservedReleased = Math.min(quantity, item.reservedQuantity);

      const updated = await tx.inventoryItem.update({
        where: { id: item.id },
        data: {
          quantity: quantityAfter,
          reservedQuantity: item.reservedQuantity - reservedReleased,
        },
      });

      const transaction = await tx.inventoryTransaction.create({
        data: {
          inventoryItemId: item.id,
          type: InventoryTransactionType.SALE,
          changeAmount: -quantity,
          quantityBefore,
          quantityAfter,
          performedBy: dto.performedBy ?? null,
          reason: dto.reason ?? 'Checkout sale',
          referenceId: dto.referenceId ?? null,
        },
      });

      return {
        item: updated,
        transaction,
        consumed: quantity,
        reservedReleased,
        referenceId: dto.referenceId ?? null,
      };
    });
  }

  /**
   * Paginated audit trail for a single inventory item.
   */
  async getTransactions(inventoryItemId: number, query?: TransactionQueryDto) {
    await this.findById(inventoryItemId);

    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query?.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.InventoryTransactionWhereInput = {
      inventoryItemId,
    };
    if (query?.type) where.type = query.type;

    const [total, data] = await this.prisma.$transaction([
      this.prisma.inventoryTransaction.count({ where }),
      this.prisma.inventoryTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return this.paginated(data, total, page, limit);
  }

  async remove(id: number) {
    await this.findById(id);
    return this.prisma.inventoryItem.delete({ where: { id } });
  }

  /**
   * Remove the inventory record (and cascaded history) for a product.
   * Used when a product is deleted so no orphan inventory rows remain.
   */
  async deleteByProductId(productId: number) {
    const id = Number(productId);
    const item = await this.prisma.inventoryItem.findUnique({
      where: { productId: id },
    });
    if (!item) {
      return { deleted: false, productId: id };
    }

    await this.prisma.inventoryItem.delete({ where: { id: item.id } });
    return { deleted: true, productId: id, id: item.id };
  }

  // --- helpers ---

  private paginated<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
  ) {
    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  /**
   * Row-lock the inventory item inside a transaction.
   * Uses SELECT ... FOR UPDATE so concurrent reserve/adjust operations serialize.
   */
  private async lockItem(
    tx: Prisma.TransactionClient,
    key: { productId?: number; inventoryItemId?: number },
  ): Promise<InventoryItemRow> {
    let rows: InventoryItemRow[];

    if (key.inventoryItemId !== undefined) {
      rows = await tx.$queryRaw<InventoryItemRow[]>(Prisma.sql`
        SELECT "id", "productId", "quantity", "reservedQuantity", "warehouse",
               "lowStockThreshold", "createdAt", "updatedAt"
        FROM "ecommerce_inventory"
        WHERE "id" = ${key.inventoryItemId}
        FOR UPDATE
      `);
    } else if (key.productId !== undefined) {
      rows = await tx.$queryRaw<InventoryItemRow[]>(Prisma.sql`
        SELECT "id", "productId", "quantity", "reservedQuantity", "warehouse",
               "lowStockThreshold", "createdAt", "updatedAt"
        FROM "ecommerce_inventory"
        WHERE "productId" = ${key.productId}
        FOR UPDATE
      `);
    } else {
      throw new BadRequestException(
        'productId or inventoryItemId is required',
      );
    }

    const item = rows[0];
    if (!item) {
      const ref = key.productId ?? key.inventoryItemId;
      throw new NotFoundException(
        `Inventory item not found for identifier ${ref}`,
      );
    }
    return item;
  }
}
