import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  AdjustStockDto,
  ConsumeStockDto,
  CreateInventoryDto,
  InventoryQueryDto,
  ReleaseStockDto,
  ReserveStockDto,
  TransactionQueryDto,
  UpdateInventoryDto,
} from '../../libs/dto/inventory/inventory.dto.js';
import { InventoryService } from './inventory.service.js';

@Controller()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @MessagePattern({ cmd: 'inventory.findAll' })
  findAll(@Payload() query?: InventoryQueryDto) {
    return this.inventoryService.getStockLevels(query);
  }

  @MessagePattern({ cmd: 'inventory.findById' })
  findById(@Payload() id: number) {
    return this.inventoryService.findById(Number(id));
  }

  @MessagePattern({ cmd: 'inventory.findByProductId' })
  findByProductId(@Payload() productId: number) {
    return this.inventoryService.findByProductId(Number(productId));
  }

  @MessagePattern({ cmd: 'inventory.findTransactions' })
  findTransactions(
    @Payload() data: { inventoryItemId: number; query?: TransactionQueryDto },
  ) {
    return this.inventoryService.getTransactions(
      Number(data.inventoryItemId),
      data.query,
    );
  }

  @MessagePattern({ cmd: 'inventory.create' })
  create(@Payload() data: CreateInventoryDto) {
    return this.inventoryService.create(data);
  }

  /** Create-if-missing, used by the products service on product create. */
  @MessagePattern({ cmd: 'inventory.ensureStock' })
  ensureStock(
    @Payload()
    data: {
      productId: number;
      quantity?: number;
      warehouse?: string;
      lowStockThreshold?: number;
    },
  ) {
    return this.inventoryService.ensureStock(data);
  }

  @MessagePattern({ cmd: 'inventory.update' })
  update(@Payload() data: { id: number; inventory: UpdateInventoryDto }) {
    return this.inventoryService.update(Number(data.id), data.inventory);
  }

  /** Atomic adjustment + InventoryTransaction history */
  @MessagePattern({ cmd: 'inventory.adjustStock' })
  adjustStock(@Payload() data: AdjustStockDto) {
    return this.inventoryService.adjustStock(data);
  }

  /** Checkout-safe reservation (prevents overselling) */
  @MessagePattern({ cmd: 'inventory.reserveStock' })
  reserveStock(@Payload() data: ReserveStockDto) {
    return this.inventoryService.reserveStock(data);
  }

  /** Release/cancel a reservation */
  @MessagePattern({ cmd: 'inventory.releaseStock' })
  releaseStock(@Payload() data: ReleaseStockDto) {
    return this.inventoryService.releaseStock(data);
  }

  /** Finalize a reservation into a completed sale (SALE history). */
  @MessagePattern({ cmd: 'inventory.consumeStock' })
  consumeStock(@Payload() data: ConsumeStockDto) {
    return this.inventoryService.consumeStock(data);
  }

  @MessagePattern({ cmd: 'inventory.delete' })
  remove(@Payload() id: number) {
    return this.inventoryService.remove(Number(id));
  }

  /** Clean up inventory when its product is deleted. */
  @MessagePattern({ cmd: 'inventory.deleteByProductId' })
  deleteByProductId(@Payload() productId: number) {
    return this.inventoryService.deleteByProductId(Number(productId));
  }
}
