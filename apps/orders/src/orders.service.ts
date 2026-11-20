import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomInt } from 'node:crypto';
import { Prisma } from './generated/prisma/client.js';
import { PrismaService } from '../database/prisma.service.js';
import {
  CreateOrderDto,
  MyOrdersQueryDto,
  OrderQueryDto,
  UpdateOrderStatusDto,
  isValidStatusTransition,
  type OrderStatusValue,
} from '../../libs/dto/orders/order.dto.js';

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function endOfDay(value: string): Date {
  const date = new Date(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    date.setHours(23, 59, 59, 999);
  }
  return date;
}

const ORDER_INCLUDE = {
  items: { orderBy: { id: 'asc' } },
  events: { orderBy: { createdAt: 'asc' } },
} satisfies Prisma.OrderInclude;

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Paginated order list for the admin portal, with search, status filter,
   * date range and global stats (always over every order, not just the page).
   */
  async findAll(query?: OrderQueryDto) {
    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query?.limit) || 20));
    const skip = (page - 1) * limit;
    const all = query?.all === true;

    const where: Prisma.OrderWhereInput = {};
    const search = query?.search?.trim();
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (query?.status) {
      where.status = query.status;
    }
    if (query?.from || query?.to) {
      const createdAt: Prisma.DateTimeFilter = {};
      if (query.from) createdAt.gte = new Date(query.from);
      if (query.to) createdAt.lte = endOfDay(query.to);
      where.createdAt = createdAt;
    }

    const [total, rows, grouped] = await this.prisma.$transaction([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        orderBy: this.buildOrderBy(query?.sortBy),
        include: { _count: { select: { items: true } } },
        ...(all ? {} : { skip, take: limit }),
      }),
      this.prisma.order.groupBy({
        by: ['status'],
        _count: { _all: true },
        _sum: { total: true },
      }),
    ]);

    const stats = {
      total: 0,
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      revenue: 0,
    };

    for (const group of grouped) {
      const count = group._count._all;
      stats.total += count;
      const key = group.status.toLowerCase() as
        | 'pending'
        | 'processing'
        | 'shipped'
        | 'delivered'
        | 'cancelled';
      stats[key] = count;
      if (group.status !== 'CANCELLED') {
        stats.revenue += group._sum.total ?? 0;
      }
    }
    stats.revenue = roundMoney(stats.revenue);

    return {
      data: rows.map(({ _count, ...order }) => ({
        ...order,
        itemCount: _count.items,
      })),
      total,
      page: all ? 1 : page,
      limit: all ? total : limit,
      totalPages: all ? 1 : Math.max(1, Math.ceil(total / limit)),
      stats,
    };
  }

  async findById(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: ORDER_INCLUDE,
    });
    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }
    return order;
  }

  /** Public receipt lookup used by the storefront success page. */
  async findByNumber(orderNumber: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber: String(orderNumber ?? '').trim().toUpperCase() },
      include: ORDER_INCLUDE,
    });
    if (!order) {
      throw new NotFoundException(`Order ${orderNumber} not found`);
    }
    return order;
  }

  /** Orders belonging to one storefront customer (id or email). */
  async findMine(query?: MyOrdersQueryDto) {
    const customerId = query?.customerId?.trim();
    const email = query?.email?.trim();

    if (!customerId && !email) {
      throw new BadRequestException(
        'Provide a customerId or email to look up orders',
      );
    }

    const limit = Math.min(100, Math.max(1, Number(query?.limit) || 50));
    const or: Prisma.OrderWhereInput[] = [];
    if (customerId) or.push({ customerId });
    if (email) {
      or.push({ customerEmail: { equals: email, mode: 'insensitive' } });
    }

    const data = await this.prisma.order.findMany({
      where: { OR: or },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: ORDER_INCLUDE,
    });

    return { data, total: data.length };
  }

  /**
   * Persist a placed order. Money fields are recomputed server-side so a
   * tampered client payload cannot invent a lower total, and the order number
   * is retried on the (very unlikely) unique collision.
   */
  async create(data: CreateOrderDto) {
    const items = data.items.map((item) => {
      const unitPrice = roundMoney(Math.max(0, Number(item.price) || 0));
      const quantity = Math.max(1, Math.trunc(Number(item.quantity) || 1));
      return {
        productId: item.productId?.trim() || null,
        productName: item.name.trim(),
        unitPrice,
        quantity,
        size: item.size?.trim() || null,
        color: item.color?.trim() || null,
        image: item.image?.trim() || null,
        lineTotal: roundMoney(unitPrice * quantity),
      };
    });

    const subtotal = roundMoney(
      items.reduce((sum, item) => sum + item.lineTotal, 0),
    );
    const discount = roundMoney(
      Math.min(subtotal, Math.max(0, Number(data.discount) || 0)),
    );
    const tax = roundMoney(Math.max(0, Number(data.tax) || 0));
    const shippingFee = roundMoney(Math.max(0, Number(data.shippingFee) || 0));
    const total = roundMoney(subtotal - discount + tax + shippingFee);
    const status = data.status ?? 'PROCESSING';
    const address = data.shippingAddress;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        return await this.prisma.order.create({
          data: {
            orderNumber: this.generateOrderNumber(),
            status,
            customerId: data.customerId?.trim() || null,
            customerName: data.customerName.trim(),
            customerEmail: data.customerEmail.trim().toLowerCase(),
            customerPhone:
              data.customerPhone?.trim() || address.phone?.trim() || null,
            shippingFullName: address.fullName.trim(),
            shippingStreet: address.street.trim(),
            shippingCity: address.city.trim(),
            shippingState: address.state.trim(),
            shippingPostalCode: address.postalCode.trim(),
            shippingCountry: address.country.trim(),
            shippingMethod: data.shippingMethod?.trim() || 'Standard Shipping',
            paymentMethod: data.paymentMethod?.trim() || 'Credit Card',
            promoCode: data.promoCode?.trim().toUpperCase() || null,
            trackingNumber: this.generateTrackingNumber(),
            notes: data.notes?.trim() || null,
            subtotal,
            discount,
            tax,
            shippingFee,
            total,
            items: { create: items },
            events: {
              create: [{ toStatus: status, note: 'Order placed' }],
            },
          },
          include: ORDER_INCLUDE,
        });
      } catch (error) {
        const code = (error as { code?: string })?.code;
        if (code === 'P2002' && attempt < 4) continue;
        throw error;
      }
    }

    throw new Error('Could not allocate a unique order number');
  }

  /**
   * Move an order to a new status. The row is locked (SELECT ... FOR UPDATE)
   * so two admins cannot race the same transition, and every change writes an
   * audit event.
   */
  async updateStatus(id: number, data: UpdateOrderStatusDto) {
    const next = data.status;

    return this.prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<
        Array<{ id: number; status: string; trackingNumber: string | null }>
      >(Prisma.sql`
        SELECT "id", "status", "trackingNumber"
        FROM "ecommerce_orders"
        WHERE "id" = ${id}
        FOR UPDATE
      `);

      const current = rows[0];
      if (!current) {
        throw new NotFoundException(`Order ${id} not found`);
      }

      // Same status: no-op, no duplicate audit event.
      if (current.status === next) {
        return tx.order.findUnique({
          where: { id },
          include: ORDER_INCLUDE,
        });
      }

      if (
        !isValidStatusTransition(
          current.status as OrderStatusValue,
          next as OrderStatusValue,
        )
      ) {
        throw new BadRequestException(
          `Cannot move an order from ${current.status} to ${next}`,
        );
      }

      await tx.order.update({
        where: { id },
        data: {
          status: next,
          ...(next === 'SHIPPED' && !current.trackingNumber
            ? { trackingNumber: this.generateTrackingNumber() }
            : {}),
          ...(next === 'DELIVERED' ? { deliveredAt: new Date() } : {}),
          ...(next === 'CANCELLED' ? { cancelledAt: new Date() } : {}),
        },
      });

      await tx.orderStatusEvent.create({
        data: {
          orderId: id,
          fromStatus: current.status as OrderStatusValue,
          toStatus: next as OrderStatusValue,
          note: data.note?.trim() || null,
          performedBy: data.performedBy?.trim() || null,
        },
      });

      return tx.order.findUnique({
        where: { id },
        include: ORDER_INCLUDE,
      });
    });
  }

  async getEvents(id: number) {
    const exists = await this.prisma.order.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException(`Order ${id} not found`);
    }

    return this.prisma.orderStatusEvent.findMany({
      where: { orderId: id },
      orderBy: { createdAt: 'asc' },
    });
  }

  private buildOrderBy(
    sortBy?: OrderQueryDto['sortBy'],
  ): Prisma.OrderOrderByWithRelationInput {
    switch (sortBy) {
      case 'oldest':
        return { createdAt: 'asc' };
      case 'total_desc':
        return { total: 'desc' };
      case 'total_asc':
        return { total: 'asc' };
      default:
        return { createdAt: 'desc' };
    }
  }

  /** Human-friendly, collision-checked order number: SF-12345678. */
  private generateOrderNumber(): string {
    return `SF-${String(randomInt(0, 100_000_000)).padStart(8, '0')}`;
  }

  private generateTrackingNumber(): string {
    return `TRK${randomInt(1_000_000_000, 10_000_000_000)}`;
  }
}
