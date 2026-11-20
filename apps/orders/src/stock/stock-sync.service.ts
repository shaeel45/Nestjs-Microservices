import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { sendRpc } from '../../../libs/rpc/rpc-client.util.js';

export interface StockItemLine {
  productId: number;
  quantity: number;
}

interface InventoryStockResult {
  item?: {
    id?: number;
    productId?: number;
    quantity?: number;
    reservedQuantity?: number;
  };
}

@Injectable()
export class StockSyncService {
  private readonly logger = new Logger(StockSyncService.name);

  constructor(
    @Inject('INVENTORY_SERVICE')
    private readonly inventory: ClientProxy,
    @Inject('PRODUCTS_SERVICE')
    private readonly products: ClientProxy,
  ) {}

  /**
   * Filter and aggregate lines by numeric product ID.
   * Ignore mock items (e.g. non-numeric IDs like "sh-1" from demo catalog).
   */
  filterStockLines(
    items: Array<{ productId?: string | number | null; quantity: number }>,
  ): StockItemLine[] {
    const map = new Map<number, number>();
    for (const item of items) {
      const id = Number(item.productId);
      if (Number.isInteger(id) && id > 0) {
        map.set(
          id,
          (map.get(id) || 0) + Math.max(1, Math.trunc(item.quantity || 1)),
        );
      }
    }
    return Array.from(map.entries()).map(([productId, quantity]) => ({
      productId,
      quantity,
    }));
  }

  /**
   * 1. Reserve stock during checkout to prevent overselling.
   * If any line fails, safely releases previously held reservations.
   */
  async reserveStock(
    lines: StockItemLine[],
    referenceId: string,
  ): Promise<StockItemLine[]> {
    const reserved: StockItemLine[] = [];
    for (const line of lines) {
      try {
        await sendRpc(this.inventory, 'inventory.reserveStock', {
          productId: line.productId,
          quantity: line.quantity,
          referenceId,
        });
        reserved.push(line);
      } catch (error) {
        await this.releaseStock(reserved, referenceId);
        const message =
          error instanceof Error
            ? error.message
            : `Insufficient stock for product ${line.productId}`;
        this.logger.warn(
          `Failed to reserve stock for product ${line.productId}: ${message}`,
        );
        throw new ConflictException(message);
      }
    }
    return reserved;
  }

  /**
   * 2. Consume stock when checkout finalizes.
   * Decrements on-hand stock and writes SALE history.
   * Also mirrors the new quantity to the products catalog stock cache.
   */
  async consumeStock(
    lines: StockItemLine[],
    referenceId: string,
  ): Promise<void> {
    for (const line of lines) {
      try {
        const result = await sendRpc<InventoryStockResult>(
          this.inventory,
          'inventory.consumeStock',
          {
            productId: line.productId,
            quantity: line.quantity,
            referenceId,
          },
        );

        if (result?.item?.quantity !== undefined) {
          await this.syncProductStock(line.productId, result.item.quantity);
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : `Failed to consume stock for product ${line.productId}`;
        this.logger.error(message);
        throw error;
      }
    }
  }

  /**
   * 3. Release reserved stock if checkout fails or is aborted.
   */
  async releaseStock(
    lines: StockItemLine[],
    referenceId: string,
  ): Promise<void> {
    if (lines.length === 0) return;
    await Promise.all(
      lines.map((line) =>
        sendRpc(this.inventory, 'inventory.releaseStock', {
          productId: line.productId,
          quantity: line.quantity,
          referenceId,
        }).catch((err) => {
          this.logger.warn(
            `Failed to release stock for product ${line.productId}: ${err?.message}`,
          );
        }),
      ),
    );
  }

  /**
   * 4. Restore/Increment stock when an order is CANCELLED.
   * Increments product quantity in inventory with type 'RETURN'
   * and synchronizes the catalog product stock cache.
   */
  async restoreStock(
    lines: StockItemLine[],
    referenceId: string,
    reason = 'Order cancelled - stock restored to inventory',
    performedBy = 'system',
  ): Promise<void> {
    if (lines.length === 0) return;
    for (const line of lines) {
      try {
        const result = await sendRpc<InventoryStockResult>(
          this.inventory,
          'inventory.adjustStock',
          {
            productId: line.productId,
            changeAmount: line.quantity, // Positive number increments stock
            type: 'RETURN',
            reason,
            referenceId,
            performedBy,
          },
        );

        if (result?.item?.quantity !== undefined) {
          await this.syncProductStock(line.productId, result.item.quantity);
        }
        this.logger.log(
          `Restored ${line.quantity} units for product ${line.productId} (ref: ${referenceId})`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to restore stock for product ${line.productId} (ref: ${referenceId}): ${
            error instanceof Error ? error.message : error
          }`,
        );
      }
    }
  }

  /**
   * Mirror inventory on-hand quantity back into the product catalog cache.
   */
  private async syncProductStock(
    productId: number,
    stock: number,
  ): Promise<void> {
    try {
      await sendRpc(this.products, 'products.setStockCache', {
        id: productId,
        stock,
      });
    } catch (error) {
      this.logger.warn(
        `Could not sync catalog stock cache for product ${productId}: ${
          error instanceof Error ? error.message : error
        }`,
      );
    }
  }
}
