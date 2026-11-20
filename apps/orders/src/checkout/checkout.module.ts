import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module.js';
import { CartModule } from '../cart/cart.module.js';
import { OrdersModule } from '../orders/orders.module.js';
import { StockSyncModule } from '../stock/stock-sync.module.js';
import { PromoSyncModule } from '../promo/promo-sync.module.js';
import { CheckoutController } from './checkout.controller.js';
import { CheckoutService } from './checkout.service.js';

@Module({
  imports: [
    DatabaseModule,
    CartModule,
    OrdersModule,
    StockSyncModule,
    PromoSyncModule,
  ],
  controllers: [CheckoutController],
  providers: [CheckoutService],
  exports: [CheckoutService],
})
export class CheckoutModule {}
