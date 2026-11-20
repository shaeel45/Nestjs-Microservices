import { Module } from '@nestjs/common';
import { RpcClientsModule } from './clients/clients.module.js';
import { StockSyncModule } from './stock/stock-sync.module.js';
import { PromoSyncModule } from './promo/promo-sync.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { CartModule } from './cart/cart.module.js';
import { CheckoutModule } from './checkout/checkout.module.js';

/**
 * Orders service root. Clean modular folders:
 *   - orders/    Order management (CRUD, admin stats, audit trail, cancellation stock restore)
 *   - cart/      Server-side shopping cart & items (increment/decrement)
 *   - checkout/  Checkout orchestration with automatic stock decrement & promo redemption
 *   - stock/     Inventory & Product stock synchronization (decrement on checkout, increment on cancel)
 *   - promo/     Promo code validation & redemption client
 *   - clients/   Shared TCP microservice RPC clients
 */
@Module({
  imports: [
    RpcClientsModule,
    StockSyncModule,
    PromoSyncModule,
    OrdersModule,
    CartModule,
    CheckoutModule,
  ],
})
export class AppModule {}
