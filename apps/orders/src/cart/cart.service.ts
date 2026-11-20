import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../../database/prisma.service.js';
import {
  AddCartItemDto,
  CartItemDto,
  ReplaceCartDto,
} from '../../../libs/dto/orders/cart.dto.js';
import { PromoSyncService } from '../promo/promo-sync.service.js';

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Free standard shipping at/above this subtotal (mirrors storefront threshold). */
const FREE_SHIPPING_THRESHOLD = 75;
const STANDARD_SHIPPING_FEE = 9.99;
const TAX_RATE = 0.08;

const CART_INCLUDE = {
  items: { orderBy: { id: 'asc' } },
} satisfies Prisma.CartInclude;

type CartWithItems = Prisma.CartGetPayload<{ include: typeof CART_INCLUDE }>;
type CartItemRecord = CartWithItems['items'][number];

interface NormalizedLine {
  productId: string | null;
  name: string;
  price: number;
  quantity: number;
  size: string | null;
  color: string | null;
  image: string | null;
  lineTotal: number;
  variantKey: string;
}

/**
 * Server-side shopping cart: every storefront mutation is stored and validated
 * here so checkout can trust the stored lines, promo and quantities.
 */
@Injectable()
export class CartService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly promoSyncService: PromoSyncService,
  ) {}

  // --- Storefront operations -------------------------------------------------

  async getCart(
    cartToken: string,
    customer?: { customerId?: string; customerEmail?: string },
  ) {
    const cart = await this.getOrCreate(cartToken, customer);
    return this.toView(cart);
  }

  async addItem(data: AddCartItemDto) {
    const cart = await this.getOrCreate(data.cartToken, data);
    const line = this.normalizeLine(data.item);

    await this.prisma.$executeRaw(Prisma.sql`
      INSERT INTO "ecommerce_cart_items"
        ("cartId", "productId", "name", "price", "quantity", "size", "color",
         "image", "lineTotal", "variantKey", "createdAt", "updatedAt")
      VALUES (
        ${cart.id}, ${line.productId}, ${line.name}, ${line.price},
        ${line.quantity}, ${line.size}, ${line.color}, ${line.image},
        ${line.lineTotal}, ${line.variantKey}, NOW(), NOW()
      )
      ON CONFLICT ("cartId", "variantKey") DO UPDATE SET
        "quantity" = "ecommerce_cart_items"."quantity" + EXCLUDED."quantity",
        "price" = EXCLUDED."price",
        "lineTotal" = ROUND(
          ("ecommerce_cart_items"."quantity" + EXCLUDED."quantity")
          * EXCLUDED."price"::numeric,
          2
        )::double precision,
        "updatedAt" = NOW()
    `);
    await this.touch(cart.id);

    return this.getCart(data.cartToken, data);
  }

  /**
   * Update item quantity: supports absolute quantity OR relative increment/decrement (delta).
   * Resulting quantity <= 0 removes the line.
   */
  async updateItem(params: {
    cartToken: string;
    itemId: number;
    quantity?: number;
    delta?: number;
  }) {
    const cart = await this.getOrCreate(params.cartToken);
    const item = await this.prisma.cartItem.findFirst({
      where: { id: params.itemId, cartId: cart.id },
    });

    if (!item) {
      throw new NotFoundException(`Cart item ${params.itemId} not found`);
    }

    let finalQuantity: number;
    if (params.delta !== undefined && params.delta !== null) {
      finalQuantity = item.quantity + Math.trunc(Number(params.delta));
    } else if (params.quantity !== undefined && params.quantity !== null) {
      finalQuantity = Math.trunc(Number(params.quantity));
    } else {
      throw new BadRequestException('Either quantity or delta must be provided');
    }

    if (finalQuantity <= 0) {
      await this.prisma.cartItem.delete({ where: { id: item.id } });
    } else {
      await this.prisma.cartItem.update({
        where: { id: item.id },
        data: {
          quantity: finalQuantity,
          lineTotal: roundMoney(item.price * finalQuantity),
        },
      });
    }
    await this.touch(cart.id);

    return this.getCart(params.cartToken);
  }

  async removeItem(cartToken: string, itemId: number) {
    const cart = await this.getOrCreate(cartToken);
    await this.prisma.cartItem.deleteMany({
      where: { id: itemId, cartId: cart.id },
    });
    await this.touch(cart.id);

    return this.getCart(cartToken);
  }

  /** Replace the whole cart (used to sync a local cart from the storefront). */
  async replaceItems(data: ReplaceCartDto) {
    const cart = await this.getOrCreate(data.cartToken, data);
    const lines = this.mergeLines(
      data.items.map((item) => this.normalizeLine(item)),
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      if (lines.length > 0) {
        await tx.cartItem.createMany({
          data: lines.map((line) => ({ ...line, cartId: cart.id })),
          skipDuplicates: true,
        });
      }
    });
    await this.touch(cart.id);

    return this.getCart(data.cartToken, data);
  }

  async clear(cartToken: string) {
    const cart = await this.getOrCreate(cartToken);
    await this.prisma.$transaction([
      this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } }),
      this.prisma.cart.update({
        where: { id: cart.id },
        data: { promoCode: null, promoPercent: null, promoValidUntil: null },
      }),
    ]);

    return this.getCart(cartToken);
  }

  // --- Promo ----------------------------------------------------------------

  async applyPromo(cartToken: string, code: string) {
    const cart = await this.getOrCreate(cartToken);
    const subtotal = this.subtotalOf(cart);
    const validation = await this.promoSyncService.validatePromo(code, subtotal);

    const updated = await this.prisma.cart.update({
      where: { id: cart.id },
      data: {
        promoCode: validation.code,
        promoPercent: validation.discountPercent ?? 0,
      },
      include: CART_INCLUDE,
    });

    return this.toView(updated);
  }

  async removePromo(cartToken: string) {
    const cart = await this.getOrCreate(cartToken);
    const updated = await this.prisma.cart.update({
      where: { id: cart.id },
      data: { promoCode: null, promoPercent: null, promoValidUntil: null },
      include: CART_INCLUDE,
    });

    return this.toView(updated);
  }

  // --- Checkout support -----------------------------------------------------

  /**
   * Atomically claim the cart's lines for checkout.
   */
  async claimForCheckout(cartToken: string) {
    return this.prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<Array<{ id: number }>>(Prisma.sql`
        SELECT "id" FROM "ecommerce_carts" WHERE "cartToken" = ${cartToken} FOR UPDATE
      `);
      const cartId = rows[0]?.id;
      if (!cartId) return null;

      const cart = await tx.cart.findUnique({
        where: { id: cartId },
        include: CART_INCLUDE,
      });
      if (!cart) return null;

      const items = cart.items;
      if (items.length > 0) {
        await tx.cartItem.deleteMany({ where: { cartId } });
      }

      return { cart, items };
    });
  }

  /** Put claimed lines back when checkout fails (best effort, idempotent). */
  async restoreItems(cartId: number, items: CartItemRecord[]) {
    if (items.length === 0) return;
    await this.prisma.cartItem.createMany({
      data: items.map((item) => ({
        cartId,
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        image: item.image,
        lineTotal: item.lineTotal,
        variantKey: item.variantKey,
      })),
      skipDuplicates: true,
    });
  }

  async clearPromo(cartId: number) {
    await this.prisma.cart.update({
      where: { id: cartId },
      data: { promoCode: null, promoPercent: null, promoValidUntil: null },
    });
  }

  // --- Internals ------------------------------------------------------------

  private async getOrCreate(
    cartToken: string,
    customer?: { customerId?: string; customerEmail?: string },
  ): Promise<CartWithItems> {
    return this.prisma.cart.upsert({
      where: { cartToken },
      create: {
        cartToken,
        customerId: customer?.customerId?.trim() || null,
        customerEmail: customer?.customerEmail?.trim().toLowerCase() || null,
      },
      update: {
        ...(customer?.customerId?.trim()
          ? { customerId: customer.customerId.trim() }
          : {}),
        ...(customer?.customerEmail?.trim()
          ? { customerEmail: customer.customerEmail.trim().toLowerCase() }
          : {}),
      },
      include: CART_INCLUDE,
    });
  }

  private async touch(cartId: number) {
    await this.prisma.cart.update({
      where: { id: cartId },
      data: { updatedAt: new Date() },
    });
  }

  private normalizeLine(item: CartItemDto): NormalizedLine {
    const name = item.name.trim();
    const productId = item.productId?.trim() || null;
    const price = roundMoney(Math.max(0, Number(item.price) || 0));
    const quantity = Math.max(1, Math.trunc(Number(item.quantity) || 1));
    const size = item.size?.trim() || null;
    const color = item.color?.trim() || null;

    return {
      productId,
      name,
      price,
      quantity,
      size,
      color,
      image: item.image?.trim() || null,
      lineTotal: roundMoney(price * quantity),
      variantKey: `${productId ?? name}|${size ?? ''}|${color ?? ''}`,
    };
  }

  private mergeLines(lines: NormalizedLine[]): NormalizedLine[] {
    const merged = new Map<string, NormalizedLine>();
    for (const line of lines) {
      const existing = merged.get(line.variantKey);
      if (!existing) {
        merged.set(line.variantKey, line);
        continue;
      }
      const quantity = existing.quantity + line.quantity;
      merged.set(line.variantKey, {
        ...existing,
        quantity,
        lineTotal: roundMoney(existing.price * quantity),
      });
    }
    return [...merged.values()];
  }

  private subtotalOf(cart: CartWithItems): number {
    return roundMoney(
      cart.items.reduce((sum, item) => sum + item.lineTotal, 0),
    );
  }

  /** Cart view consumed by storefront & checkout. */
  private toView(cart: CartWithItems) {
    const subtotal = this.subtotalOf(cart);
    const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    const promo = cart.promoCode
      ? {
          code: cart.promoCode,
          discountPercent: cart.promoPercent ?? 0,
          discountAmount: roundMoney(
            (subtotal * (cart.promoPercent ?? 0)) / 100,
          ),
          description: `${cart.promoPercent ?? 0}% off applied.`,
        }
      : null;
    const discountAmount = promo?.discountAmount ?? 0;
    const shippingFee =
      subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0
        ? 0
        : STANDARD_SHIPPING_FEE;
    const tax = roundMoney((subtotal - discountAmount) * TAX_RATE);

    return {
      cartToken: cart.cartToken,
      customerId: cart.customerId,
      customerEmail: cart.customerEmail,
      items: cart.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        image: item.image,
        lineTotal: item.lineTotal,
      })),
      itemCount,
      subtotal,
      promo,
      shippingFee,
      tax,
      total: roundMoney(
        Math.max(0, subtotal - discountAmount + shippingFee + tax),
      ),
      updatedAt: cart.updatedAt,
    };
  }
}

export { roundMoney, FREE_SHIPPING_THRESHOLD, STANDARD_SHIPPING_FEE, TAX_RATE };
