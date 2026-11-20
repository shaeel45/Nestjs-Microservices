import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { CheckoutDto } from '../../../libs/dto/orders/checkout.dto.js';
import { CreateOrderDto } from '../../../libs/dto/orders/order.dto.js';
import {
  CartService,
  FREE_SHIPPING_THRESHOLD,
  STANDARD_SHIPPING_FEE,
  TAX_RATE,
  roundMoney,
} from '../cart/cart.service.js';
import { OrdersService } from '../orders/orders.service.js';
import { StockSyncService, StockItemLine } from '../stock/stock-sync.service.js';
import { PromoSyncService, PromoRedemptionResult } from '../promo/promo-sync.service.js';

interface CheckoutLine {
  productId: string | null;
  name: string;
  price: number;
  quantity: number;
  size: string | null;
  color: string | null;
  image: string | null;
  lineTotal: number;
}

/**
 * Checkout orchestration for the orders service:
 *
 *   claim cart → validate promo → reserve stock (check inventory)
 *   → write order (audit event) → consume stock (decrements on-hand + SALE history)
 *   → redeem promo → clear cart
 *
 * Every failure path compensates:
 *   - releases reservations
 *   - cancels created order with audit event
 *   - restores consumed stock (increments back)
 *   - restores cart items
 */
@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);

  constructor(
    private readonly cartService: CartService,
    private readonly ordersService: OrdersService,
    private readonly stockSyncService: StockSyncService,
    private readonly promoSyncService: PromoSyncService,
  ) {}

  async checkout(dto: CheckoutDto) {
    const claimed = await this.cartService.claimForCheckout(dto.cartToken);
    const claimedItems = claimed?.items ?? [];

    let lines: CheckoutLine[];
    if (claimedItems.length > 0) {
      lines = claimedItems.map((item) => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        image: item.image,
        lineTotal: item.lineTotal,
      }));
    } else if (dto.items?.length) {
      // Storefront fallback snapshot: recomputes line totals safely
      lines = dto.items.map((item) => {
        const price = roundMoney(Math.max(0, Number(item.price) || 0));
        const quantity = Math.max(1, Math.trunc(Number(item.quantity) || 1));
        return {
          productId: item.productId?.trim() || null,
          name: item.name.trim(),
          price,
          quantity,
          size: item.size?.trim() || null,
          color: item.color?.trim() || null,
          image: item.image?.trim() || null,
          lineTotal: roundMoney(price * quantity),
        };
      });
    } else {
      throw new BadRequestException('Your cart is empty');
    }

    const subtotal = roundMoney(
      lines.reduce((sum, line) => sum + line.lineTotal, 0),
    );
    const promoCode =
      dto.promoCode ?? claimed?.cart.promoCode?.trim().toUpperCase() ?? null;

    let order: Awaited<ReturnType<OrdersService['create']>> | null = null;
    let reserved: StockItemLine[] = [];
    let stockLines: StockItemLine[] = [];
    const referenceId = `CHK-${dto.cartToken.slice(0, 8)}-${Date.now()}`;

    try {
      // 1) Validate promo before touching stock
      let promo: {
        code?: string;
        discountPercent?: number;
        discountAmount?: number;
      } | null = null;

      if (promoCode) {
        const validation = await this.promoSyncService.validatePromo(
          promoCode,
          subtotal,
        );
        promo = {
          code: validation.code,
          discountPercent: validation.discountPercent ?? 0,
          discountAmount: roundMoney(
            validation.discountAmount ??
              (subtotal * (validation.discountPercent ?? 0)) / 100,
          ),
        };
      }

      const discount = promo
        ? roundMoney(Math.min(subtotal, promo.discountAmount ?? 0))
        : 0;
      const shippingFee =
        dto.shippingFee !== undefined
          ? roundMoney(dto.shippingFee)
          : subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0
            ? 0
            : STANDARD_SHIPPING_FEE;
      const tax =
        dto.tax !== undefined
          ? roundMoney(dto.tax)
          : roundMoney((subtotal - discount) * TAX_RATE);

      // 2) Decrement/Reserve Stock:
      // Filter lines backed by actual numeric inventory product ID
      stockLines = this.stockSyncService.filterStockLines(lines);

      if (stockLines.length > 0) {
        reserved = await this.stockSyncService.reserveStock(
          stockLines,
          referenceId,
        );
      }

      // 3) Persist order with server-calculated amounts & audit trail
      const orderInput: CreateOrderDto = {
        customerId: dto.customerId ?? claimed?.cart.customerId ?? undefined,
        customerName: dto.customerName,
        customerEmail: dto.customerEmail,
        customerPhone: dto.customerPhone,
        shippingAddress: dto.shippingAddress,
        shippingMethod: dto.shippingMethod,
        paymentMethod: dto.paymentMethod,
        promoCode: promo?.code,
        notes: dto.notes,
        status: 'PROCESSING',
        items: lines.map((line) => ({
          productId: line.productId ?? undefined,
          name: line.name,
          price: line.price,
          quantity: line.quantity,
          size: line.size ?? undefined,
          color: line.color ?? undefined,
          image: line.image ?? undefined,
        })),
        discount,
        tax,
        shippingFee,
      };

      order = await this.ordersService.create(orderInput);

      // 4) Finalize sale: consumes reservation, decrements on-hand stock and syncs products cache
      if (stockLines.length > 0) {
        await this.stockSyncService.consumeStock(stockLines, referenceId);
      }

      // 5) Redeem promo code (best effort once the order exists)
      let promoResult: PromoRedemptionResult | null = null;
      if (promo?.code) {
        promoResult = await this.promoSyncService.redeemPromo(
          promo.code,
          subtotal,
          order.orderNumber,
        );
      }

      // 6) Clear cart promo snapshot
      if (claimed) {
        await this.cartService.clearPromo(claimed.cart.id);
      }

      return {
        order,
        promo: promoResult,
        warnings: promoResult?.warning ? [promoResult.warning] : [],
      };
    } catch (error) {
      // Rollback compensation
      if (reserved.length > 0) {
        await this.stockSyncService.releaseStock(reserved, referenceId);
      }

      if (order) {
        try {
          await this.ordersService.updateStatus(order.id, {
            status: 'CANCELLED',
            note: 'Checkout could not be finalized; stock or promo failed',
          });
        } catch (cancelError) {
          this.logger.error(
            `Failed to cancel order ${order.id} after checkout failure: ${
              cancelError instanceof Error ? cancelError.message : cancelError
            }`,
          );
        }
      }

      if (claimed && claimedItems.length > 0) {
        try {
          await this.cartService.restoreItems(claimed.cart.id, claimedItems);
        } catch (restoreError) {
          this.logger.error(
            `Failed to restore cart ${claimed.cart.id} after checkout failure: ${
              restoreError instanceof Error ? restoreError.message : restoreError
            }`,
          );
        }
      }

      throw error;
    }
  }
}
