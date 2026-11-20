import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module.js';
import { StockSyncModule } from '../stock/stock-sync.module.js';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';

@Module({
  imports: [DatabaseModule, StockSyncModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
