import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import {
  CreateInventoryDto,
  InventoryQueryDto,
  UpdateInventoryDto,
  AdjustStockDto,
} from '../../libs/dto/inventory/inventory.dto.js';
import { InventoryService } from './inventory.service.js';

@Controller()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @MessagePattern({ cmd: 'inventory.findAll' })
  findAll(query?: InventoryQueryDto) {
    return this.inventoryService.findAll(query);
  }

  @MessagePattern({ cmd: 'inventory.findById' })
  findById(id: number) {
    return this.inventoryService.findById(id);
  }

  @MessagePattern({ cmd: 'inventory.findByProductId' })
  findByProductId(productId: number) {
    return this.inventoryService.findByProductId(productId);
  }

  @MessagePattern({ cmd: 'inventory.create' })
  create(data: CreateInventoryDto) {
    return this.inventoryService.create(data);
  }

  @MessagePattern({ cmd: 'inventory.update' })
  update(data: { id: number; inventory: UpdateInventoryDto }) {
    return this.inventoryService.update(data.id, data.inventory);
  }

  @MessagePattern({ cmd: 'inventory.adjustStock' })
  adjustStock(data: AdjustStockDto) {
    return this.inventoryService.adjustStock(data);
  }

  @MessagePattern({ cmd: 'inventory.reserveStock' })
  reserveStock(data: { productId: number; quantity: number }) {
    return this.inventoryService.reserveStock(data.productId, data.quantity);
  }

  @MessagePattern({ cmd: 'inventory.releaseStock' })
  releaseStock(data: { productId: number; quantity: number }) {
    return this.inventoryService.releaseStock(data.productId, data.quantity);
  }

  @MessagePattern({ cmd: 'inventory.delete' })
  remove(id: number) {
    return this.inventoryService.remove(id);
  }
}
