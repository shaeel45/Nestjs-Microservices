import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module.js';
import { PromoSyncModule } from '../promo/promo-sync.module.js';
import { CartController } from './cart.controller.js';
import { CartService } from './cart.service.js';

@Module({
  imports: [DatabaseModule, PromoSyncModule],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
