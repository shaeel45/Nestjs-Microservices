import { Module } from '@nestjs/common';

import { ApiGatewayModule } from '../../api-gateway/src/api-gateway.module.js';
import { AppModule as AuthAppModule } from '../../auth/src/auth.module.js';
import { AppModule as UsersAppModule } from '../../users/src/users.module.js';
import { ProductsModule } from '../../products/src/products.module.js';
import { InventoryModule } from '../../inventory/src/inventory.module.js';
import { PromoCodesModule } from '../../promocodes/src/promocodes.module.js';
import { AppModule as OrdersAppModule } from '../../orders/src/app.module.js';

/**
 * Single-process composition of the whole ShopForge backend.
 *
 * The HTTP surface (api-gateway controllers) and the six service modules are
 * loaded into one Nest container. The services keep their `@MessagePattern`
 * handlers, so the gateway's existing `ClientProxy` calls keep working; the
 * TCP listeners are simply bound to loopback inside this same process.
 *
 * This keeps every feature module, DTO, guard and Prisma client untouched
 * while collapsing seven OS processes into one deployable unit.
 */
@Module({
  imports: [
    ApiGatewayModule,
    AuthAppModule,
    UsersAppModule,
    ProductsModule,
    InventoryModule,
    PromoCodesModule,
    OrdersAppModule,
  ],
})
export class MonolithModule {}
