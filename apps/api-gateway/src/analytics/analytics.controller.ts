import { Controller, Get, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from '../auth/enums/role.enums.js';

/** Pretty labels for the category slugs stored on products. */
const CATEGORY_LABELS: Record<string, string> = {
  shirts: 'Shirts & Tops',
  pants: 'Pants & Trousers',
  shoes: 'Footwear & Shoes',
  accessories: 'Accessories',
};

type ProductSummary = {
  id: number | string;
  name?: string;
  category?: string | null;
};

type ProductRevenueRow = {
  productId: string | null;
  productName: string;
  quantity: number;
  revenue: number;
};

type OrderAnalytics = {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  revenueGrowth: number;
  ordersGrowth: number;
  statusCounts: Record<string, number>;
  monthlySales: Array<{ month: string; revenue: number; orders: number }>;
  recentOrders: Array<Record<string, unknown>>;
  productRevenue: ProductRevenueRow[];
  generatedAt: string;
};

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function categoryLabel(value?: string | null): string {
  if (!value || !value.trim()) return 'Other';
  const key = value.trim().toLowerCase();
  if (CATEGORY_LABELS[key]) return CATEGORY_LABELS[key];
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Older carts stored slug ids ("sh-1", "acc-2") that no longer resolve to a
 * catalog row, so fall back to the slug prefix before giving up.
 */
function categoryFromProductId(value: string): string | null {
  const key = value.trim().toLowerCase();
  if (key.startsWith('sh-shoe-') || key.startsWith('shoe-')) return 'Footwear & Shoes';
  if (key.startsWith('sh-')) return 'Shirts & Tops';
  if (key.startsWith('pa-')) return 'Pants & Trousers';
  if (key.startsWith('acc-')) return 'Accessories';
  return null;
}

/**
 * Admin dashboard metrics. Revenue figures come from the orders service; the
 * product revenue it returns is rolled up into categories here, where the
 * products catalog is available.
 */
@Controller('analytics')
export class AnalyticsController {
  constructor(
    @Inject('ORDERS_SERVICE')
    private readonly ordersClient: ClientProxy,
    @Inject('PRODUCTS_SERVICE')
    private readonly productsClient: ClientProxy,
  ) {}

  @Roles(Role.ADMIN)
  @Get('dashboard')
  async dashboard() {
    const summary = await firstValueFrom(
      this.ordersClient.send<OrderAnalytics>(
        { cmd: 'orders.analytics' },
        {},
      ),
    );

    // Category data is a nice-to-have: never fail the dashboard over it.
    let products: ProductSummary[] = [];
    try {
      const response = await firstValueFrom(
        this.productsClient.send<unknown>(
          { cmd: 'products.findAll' },
          { all: true },
        ),
      );
      const list = Array.isArray(response)
        ? response
        : (response as { data?: ProductSummary[] } | null)?.data;
      if (Array.isArray(list)) products = list;
    } catch {
      products = [];
    }

    const productById = new Map(
      products.map((product) => [String(product.id), product]),
    );

    const categories = new Map<string, { category: string; revenue: number }>();
    for (const row of summary.productRevenue ?? []) {
      const product = row.productId
        ? productById.get(String(row.productId))
        : undefined;
      const category =
        categoryLabel(product?.category) === 'Other' && row.productId
          ? categoryFromProductId(String(row.productId)) ?? 'Other'
          : categoryLabel(product?.category);
      const entry = categories.get(category) ?? { category, revenue: 0 };
      entry.revenue = roundMoney(entry.revenue + (Number(row.revenue) || 0));
      categories.set(category, entry);
    }

    return {
      ...summary,
      salesByCategory: [...categories.values()]
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 6),
      topProducts: (summary.productRevenue ?? []).slice(0, 5),
    };
  }
}
