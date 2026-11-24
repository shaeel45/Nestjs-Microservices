import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { UsersController } from './users/users.controller.js';
import { AuthController } from './auth/auth.controller.js';
import { JwtAuthGuard } from './auth/guards/jwt-guard.js';
import { RolesGuard } from './auth/guards/roles.guard.js';
import { JwtModule } from '@nestjs/jwt';
import { ProductsController } from './products/products.controller.js';
import { InventoryController } from './inventory/inventory.controller.js';
import { PromoCodesController } from './promocodes/promocodes.controller.js';
import { OrdersController } from './orders/orders.controller.js';
import { CartController } from './cart/cart.controller.js';
import { CheckoutController } from './checkout/checkout.controller.js';
import { WishlistController } from './wishlist/wishlist.controller.js';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'AUTH_SERVICE',
        transport: Transport.TCP,
        options: {
          host: '127.0.0.1',
          port: 3001,
        },
      },
      {
        name: 'USERS_SERVICE',
        transport: Transport.TCP,
        options: {
          host: '127.0.0.1',
          port: 3002,
        },
      },
      {
        name: 'PRODUCTS_SERVICE',
        transport: Transport.TCP,
        options: {
          host: '127.0.0.1',
          port: 3003,
        },
      },
      {
        name: 'INVENTORY_SERVICE',
        transport: Transport.TCP,
        options: {
          host: '127.0.0.1',
          port: 3004,
        },
      },
      {
        name: 'PROMOCODES_SERVICE',
        transport: Transport.TCP,
        options: {
          host: '127.0.0.1',
          port: 3005,
        },
      },
      {
        name: 'ORDERS_SERVICE',
        transport: Transport.TCP,
        options: {
          host: '127.0.0.1',
          port: 3006,
        },
      },
    ]),
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET || 'default_secret',
      signOptions: {
        expiresIn: '15m',
      },
    }),
  ],
  controllers: [
    UsersController,
    AuthController,
    ProductsController,
    InventoryController,
    PromoCodesController,
    OrdersController,
    CartController,
    WishlistController,
    CheckoutController,
  ],
  providers: [JwtAuthGuard, RolesGuard],
})
export class ApiGatewayModule {}
