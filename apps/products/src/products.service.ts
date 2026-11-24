import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../database/prisma.service.js';
import {
  CreateProductDto,
  ProductPaginationQueryDto,
  SearchProductsQueryDto,
  UpdateProductDto,
} from '../../libs/dto/products/product.dto.js';

type InventoryItemSummary = {
  id: number;
  productId: number;
  quantity: number;
  reservedQuantity: number;
};

type StockDiscrepancy = {
  type: 'missing_inventory' | 'quantity_mismatch' | 'orphan_inventory';
  productId: number;
  productName: string | null;
  productStock: number | null;
  inventoryQuantity: number | null;
  resolved: boolean;
  error?: string;
};

type RankedProduct = { product: any; score: number };

type ProductSuggestion = {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
};

type CategorySuggestion = { name: string; count: number };

/** Hard ceiling on rows scored in memory for one search request. */
const SEARCH_CANDIDATE_LIMIT = 200;

/** Split free-text input into unique, lowercase search tokens. */
function tokenize(value: string): string[] {
  return Array.from(
    new Set(
      value
        .toLowerCase()
        .split(/\s+/)
        .map((token) => token.replace(/[^\p{L}\p{N}'-]/gu, ''))
        .filter((token) => token.length > 0),
    ),
  );
}

function capitalize(value: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function toLowerList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).toLowerCase());
}

function ratingValue(product: any): number {
  const rating = product?.rating;
  if (typeof rating === 'number') return rating;
  if (rating && typeof rating === 'object') {
    const rate = Number((rating as { rate?: unknown }).rate);
    return Number.isFinite(rate) ? rate : 0;
  }
  return 0;
}

/**
 * Relevance score for a single product. Higher is better:
 * exact/prefix name matches outweigh description-only matches, and
 * per-token matches let multi-word queries ("black oxford") rank items
 * that hit every word above items that only hit one.
 */
function scoreProduct(product: any, phrase: string, tokens: string[]): number {
  const name = String(product.name ?? '').toLowerCase();
  const description = String(product.description ?? '').toLowerCase();
  const category = String(product.category ?? '').toLowerCase();
  const colors = toLowerList(product.colors);
  const sizes = toLowerList(product.sizes);
  const details = toLowerList(product.details);

  let score = 0;

  if (name === phrase) score += 140;
  else if (name.startsWith(phrase)) score += 100;
  else if (name.includes(phrase)) score += 80;

  if (category === phrase) score += 60;
  else if (category.includes(phrase)) score += 40;

  if (description.includes(phrase)) score += 15;

  for (const token of tokens) {
    if (name.split(/\s+/).includes(token)) score += 24;
    else if (name.includes(token)) score += 16;

    if (category.split(/\s+/).includes(token)) score += 12;
    else if (category.includes(token)) score += 8;

    if (description.includes(token)) score += 4;

    if (colors.some((color) => color === token)) score += 10;
    else if (colors.some((color) => color.includes(token))) score += 6;

    if (sizes.some((size) => size === token)) score += 6;
    if (details.some((detail) => detail.includes(token))) score += 3;
  }

  // Tiny nudges so equally relevant products surface buyable/featured first.
  if (Number(product.stock) > 0) score += 3;
  if (product.isFeatured) score += 2;
  if (product.isTrending) score += 1;

  return score;
}

function toProductSuggestion(product: any): ProductSuggestion {
  const images = Array.isArray(product.images) ? product.images : [];
  return {
    id: Number(product.id),
    name: String(product.name ?? ''),
    price: Number(product.price) || 0,
    image: product.imageURL || images[0] || '',
    category: String(product.category ?? ''),
  };
}

/** Word completions ("oxf" → "Oxford") drawn from the matched result set. */
function buildKeywordSuggestions(
  products: any[],
  phrase: string,
  limit: number,
): string[] {
  const scores = new Map<string, number>();

  const collect = (raw: string, weight: number) => {
    const word = raw.replace(/[^\p{L}\p{N}'-]/gu, '').trim();
    if (!word) return;
    const key = word.toLowerCase();
    if (key === phrase || !key.startsWith(phrase)) return;
    scores.set(key, (scores.get(key) ?? 0) + weight);
  };

  for (const product of products) {
    for (const word of String(product.name ?? '').split(/\s+/)) {
      collect(word, 3);
    }
    collect(String(product.category ?? ''), 2);
    for (const value of toLowerList(product.colors)) collect(value, 1);
    for (const value of toLowerList(product.sizes)) collect(value, 1);
  }

  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => capitalize(word));
}

function buildCategorySuggestions(
  products: any[],
  limit: number,
): CategorySuggestion[] {
  const counts = new Map<string, number>();
  for (const product of products) {
    const name = String(product.category ?? '').trim();
    if (!name) continue;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}

function toArray(value?: string | string[] | null): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
}

function toJson(value: any, fallback: any): any {
  if (value === undefined || value === null) return fallback;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }
  return value;
}

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject('INVENTORY_SERVICE')
    private readonly inventoryClient: ClientProxy,
  ) {}

  private inventory<T>(cmd: string, payload: unknown): Promise<T> {
    return firstValueFrom(this.inventoryClient.send<T>({ cmd }, payload));
  }

  async findAll(query?: ProductPaginationQueryDto) {
    const isAll = query?.all === true || query?.all === 'true';
    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.max(1, Number(query?.limit) || 12);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query?.category && query.category !== 'all') {
      where.category = { equals: query.category, mode: 'insensitive' };
    }

    if (query?.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { category: { contains: term, mode: 'insensitive' } },
      ];
    }

    if (query?.minPrice !== undefined && !Number.isNaN(Number(query.minPrice))) {
      where.price = { ...(where.price || {}), gte: Number(query.minPrice) };
    }

    if (query?.maxPrice !== undefined && !Number.isNaN(Number(query.maxPrice))) {
      where.price = { ...(where.price || {}), lte: Number(query.maxPrice) };
    }

    if (query?.inStock === true || query?.inStock === 'true') {
      where.stock = { gt: 0 };
    }

    let orderBy: any = { createdAt: 'desc' };
    if (query?.sortBy === 'price-asc') {
      orderBy = { price: 'asc' };
    } else if (query?.sortBy === 'price-desc') {
      orderBy = { price: 'desc' };
    } else if (query?.sortBy === 'newest') {
      orderBy = { createdAt: 'desc' };
    } else if (query?.sortBy === 'featured') {
      orderBy = [{ isFeatured: 'desc' }, { createdAt: 'desc' }];
    }

    if (isAll) {
      const data = await this.prisma.products.findMany({
        where,
        orderBy,
      });
      return {
        data,
        total: data.length,
        page: 1,
        limit: data.length,
        totalPages: 1,
      };
    }

    const [total, data] = await Promise.all([
      this.prisma.products.count({ where }),
      this.prisma.products.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Storefront search: ranked matches plus autocomplete suggestions.
   *
   * The database narrows the candidate set with a token `OR` filter, then
   * results are scored in memory so an exact/prefix name hit outranks a
   * product that only mentions the term in its description. The candidate
   * set is capped, which keeps the sort cheap while staying accurate for a
   * storefront-sized catalog.
   */
  async search(query: SearchProductsQueryDto) {
    const startedAt = Date.now();
    const phrase = String(query?.q ?? '').trim();
    const tokens = tokenize(phrase);
    if (tokens.length === 0) {
      throw new BadRequestException('A search term is required');
    }

    const limit = Math.min(50, Math.max(1, Number(query?.limit) || 8));
    const page = Math.max(1, Number(query?.page) || 1);
    const suggestionLimit = Math.min(
      20,
      Math.max(1, Number(query?.suggestionLimit) || 5),
    );

    const candidates = await this.prisma.products.findMany({
      where: this.buildSearchWhere(tokens, query),
      orderBy: { createdAt: 'desc' },
      take: SEARCH_CANDIDATE_LIMIT,
    });

    const ranked: RankedProduct[] = [];
    for (const product of candidates) {
      const score = scoreProduct(product, phrase.toLowerCase(), tokens);
      if (score > 0) ranked.push({ product, score });
    }

    this.sortSearchResults(ranked, query?.sortBy);

    const total = ranked.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * limit;
    const pageItems = ranked.slice(start, start + limit);
    const rankedProducts = ranked.map((entry) => entry.product);

    return {
      query: phrase,
      tokens,
      took: Date.now() - startedAt,
      total,
      page: safePage,
      limit,
      totalPages,
      data: pageItems.map((entry) => ({
        ...entry.product,
        relevance: Number(entry.score.toFixed(2)),
      })),
      suggestions: {
        products: ranked
          .slice(0, suggestionLimit)
          .map((entry) => toProductSuggestion(entry.product)),
        categories: buildCategorySuggestions(
          rankedProducts,
          Math.min(5, suggestionLimit),
        ),
        keywords: buildKeywordSuggestions(
          rankedProducts,
          phrase.toLowerCase(),
          Math.min(6, suggestionLimit + 1),
        ),
      },
    };
  }

  /**
   * Lightweight feed for the header autocomplete. Runs the same ranking as
   * `search` but returns only the suggestion groups (no product page).
   */
  async suggest(query: SearchProductsQueryDto) {
    const result = await this.search({ ...query, page: 1, limit: 1 });
    return {
      query: result.query,
      took: result.took,
      total: result.total,
      suggestions: result.suggestions,
    };
  }

  /** Build the Prisma `where` clause for a tokenized search query. */
  private buildSearchWhere(
    tokens: string[],
    query: SearchProductsQueryDto,
  ): any {
    const matches: any[] = [];

    for (const token of tokens) {
      // Array columns are matched case-sensitively, so cover the common
      // casings instead of relying on `mode: 'insensitive'`.
      const variants = Array.from(
        new Set([token, capitalize(token), token.toUpperCase()]),
      );

      matches.push(
        { name: { contains: token, mode: 'insensitive' } },
        { description: { contains: token, mode: 'insensitive' } },
        { category: { contains: token, mode: 'insensitive' } },
        { colors: { hasSome: variants } },
        { sizes: { hasSome: variants } },
        { details: { hasSome: variants } },
      );
    }

    const where: any = { OR: matches };

    if (query?.category && query.category !== 'all') {
      where.category = { equals: query.category, mode: 'insensitive' };
    }

    if (query?.minPrice !== undefined && !Number.isNaN(Number(query.minPrice))) {
      where.price = { ...(where.price || {}), gte: Number(query.minPrice) };
    }

    if (query?.maxPrice !== undefined && !Number.isNaN(Number(query.maxPrice))) {
      where.price = { ...(where.price || {}), lte: Number(query.maxPrice) };
    }

    if (query?.inStock === true || query?.inStock === 'true') {
      where.stock = { gt: 0 };
    }

    return where;
  }

  /** Relevance is the default; explicit sorts still respect the query. */
  private sortSearchResults(ranked: RankedProduct[], sortBy?: string) {
    const byScore = (a: RankedProduct, b: RankedProduct) => b.score - a.score;
    const byNewest = (a: RankedProduct, b: RankedProduct) =>
      new Date(b.product.createdAt ?? 0).getTime() -
      new Date(a.product.createdAt ?? 0).getTime();

    switch (sortBy) {
      case 'price-asc':
        ranked.sort(
          (a, b) =>
            (Number(a.product.price) || 0) - (Number(b.product.price) || 0) ||
            byScore(a, b),
        );
        break;
      case 'price-desc':
        ranked.sort(
          (a, b) =>
            (Number(b.product.price) || 0) - (Number(a.product.price) || 0) ||
            byScore(a, b),
        );
        break;
      case 'rating':
        ranked.sort(
          (a, b) =>
            ratingValue(b.product) - ratingValue(a.product) || byScore(a, b),
        );
        break;
      case 'newest':
        ranked.sort((a, b) => byNewest(a, b) || byScore(a, b));
        break;
      default:
        ranked.sort((a, b) => byScore(a, b) || byNewest(a, b));
    }
  }

  async findById(id: number) {
    const product = await this.prisma.products.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  async create(data: CreateProductDto) {
    const stock = Math.max(0, Math.trunc(Number(data.stock) || 0));
    const formattedData: any = {
      name: data.name,
      description: data.description ?? '',
      price: Number(data.price) || 0,
      original_price: Number(data.original_price ?? data.price) || 0,
      stock,
      category: data.category ?? '',
      imageURL: data.imageURL ?? '',
      isNew: Boolean(data.isNew),
      isTrending: Boolean(data.isTrending),
      isFeatured: Boolean(data.isFeatured),
      colors: toArray(data.colors),
      sizes: toArray(data.sizes),
      images: toArray(data.images),
      details: toArray(data.details),
      rating: toJson(data.rating, { rate: 0, count: 0 }),
      review: toJson(data.review, []),
    };

    const product = await this.prisma.products.create({ data: formattedData });
    // Auto-create the matching inventory record so every product is tracked.
    await this.ensureInventory(product.id, stock);
    return product;
  }

  /** Create-if-missing inventory record; never blocks product creation. */
  private async ensureInventory(productId: number, stock: number) {
    try {
      await this.inventory('inventory.ensureStock', {
        productId,
        quantity: Math.max(0, Math.trunc(Number(stock) || 0)),
      });
    } catch (error) {
      this.logger.warn(
        `Could not create inventory for product ${productId}: ${
          (error as Error).message
        }`,
      );
    }
  }

  /**
   * Stock edits go through the inventory service so every change is
   * audited. Inventory is authoritative; the product `stock` field is
   * only a catalog cache and is set to the quantity inventory returns.
   */
  private async resolveStock(
    productId: number,
    currentStock: number,
    nextStock: number,
  ): Promise<number> {
    const target = Math.max(0, Math.trunc(Number(nextStock) || 0));

    let ensured: {
      item?: { quantity?: number };
      created?: boolean;
    };
    try {
      ensured = await this.inventory('inventory.ensureStock', {
        productId,
        quantity: target,
      });
    } catch (error) {
      throw new Error(
        `Inventory service unavailable; stock was not changed: ${
          (error as Error).message
        }`,
      );
    }

    if (ensured?.created) return target;

    const base = Number(ensured?.item?.quantity ?? currentStock);
    const delta = target - base;
    if (delta === 0) return base;

    const adjusted = await this.inventory<{ item?: { quantity?: number } }>(
      'inventory.adjustStock',
      {
        productId,
        changeAmount: delta,
        type: 'ADJUSTMENT',
        performedBy: 'admin-portal',
        reason: 'Product stock edited from the admin portal',
      },
    );

    return Number(adjusted?.item?.quantity ?? target);
  }

  async update(id: number, data: UpdateProductDto) {
    const current = await this.findById(id);

    const formattedData: any = {};
    if (data.name !== undefined) formattedData.name = data.name;
    if (data.description !== undefined) formattedData.description = data.description;
    if (data.price !== undefined) formattedData.price = Number(data.price) || 0;
    if (data.original_price !== undefined) formattedData.original_price = Number(data.original_price) || 0;
    if (data.stock !== undefined) {
      formattedData.stock = await this.resolveStock(id, current.stock, data.stock);
    }
    if (data.category !== undefined) formattedData.category = data.category;
    if (data.imageURL !== undefined) formattedData.imageURL = data.imageURL;
    if (data.isNew !== undefined) formattedData.isNew = Boolean(data.isNew);
    if (data.isTrending !== undefined) formattedData.isTrending = Boolean(data.isTrending);
    if (data.isFeatured !== undefined) formattedData.isFeatured = Boolean(data.isFeatured);
    if (data.colors !== undefined) formattedData.colors = toArray(data.colors);
    if (data.sizes !== undefined) formattedData.sizes = toArray(data.sizes);
    if (data.images !== undefined) formattedData.images = toArray(data.images);
    if (data.details !== undefined) formattedData.details = toArray(data.details);
    if (data.rating !== undefined) formattedData.rating = toJson(data.rating, { rate: 0, count: 0 });
    if (data.review !== undefined) formattedData.review = toJson(data.review, []);

    return this.prisma.products.update({ where: { id }, data: formattedData });
  }

  async updateImage(id: number, imageURL: string) {
    await this.findById(id);
    return this.prisma.products.update({
      where: { id },
      data: { imageURL },
    });
  }

  async addReview(id: number, reviewData: { author: string; rating: number; comment: string }) {
    const product = await this.findById(id);
    const existingReviews: any[] = Array.isArray(product.review) ? (product.review as any[]) : [];
    const newReview = {
      id: Date.now(),
      author: reviewData.author || 'Anonymous',
      role: 'Verified Buyer',
      rating: Number(reviewData.rating) || 5,
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      comment: reviewData.comment || '',
      product: product.name,
    };
    const updatedReviews = [newReview, ...existingReviews];
    const totalRating = updatedReviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0);
    const avgRating = Number((totalRating / updatedReviews.length).toFixed(1));
    const newRating = { rate: avgRating, count: updatedReviews.length };

    return this.prisma.products.update({
      where: { id },
      data: {
        review: updatedReviews,
        rating: newRating,
      },
    });
  }

  async remove(id: number) {
    await this.findById(id);

    // Clean up the inventory record (and its history) before deleting the
    // product so no orphan inventory rows are left behind.
    try {
      await this.inventory('inventory.deleteByProductId', id);
    } catch (error) {
      this.logger.warn(
        `Could not remove inventory for product ${id}: ${
          (error as Error).message
        }`,
      );
    }

    return this.prisma.products.delete({ where: { id } });
  }

  /**
   * Internal hook used by the gateway to mirror an inventory mutation into
   * the catalog stock cache. Never touches the inventory quantity.
   */
  async setStockCache(id: number, stock: number) {
    const productId = Number(id);
    const value = Math.max(0, Math.trunc(Number(stock) || 0));
    const product = await this.prisma.products.findUnique({
      where: { id: productId },
    });
    if (!product) return null;

    return this.prisma.products.update({
      where: { id: productId },
      data: { stock: value },
    });
  }

  /**
   * Compare every product's `stock` cache with the authoritative inventory
   * quantity. With `fix: true`, missing inventory records are created,
   * mismatched caches are corrected from inventory, and orphan inventory
   * rows are removed.
   */
  async reconcileStock(options?: { fix?: boolean }) {
    const fix = options?.fix === true;
    const products = await this.prisma.products.findMany();

    const inventoryResult = await this.inventory<unknown>(
      'inventory.findAll',
      { all: true },
    );
    const items: InventoryItemSummary[] = Array.isArray(inventoryResult)
      ? (inventoryResult as InventoryItemSummary[])
      : ((inventoryResult as { data?: InventoryItemSummary[] })?.data ?? []);

    const byProduct = new Map<number, InventoryItemSummary>();
    for (const item of items) {
      byProduct.set(Number(item.productId), item);
    }
    const productIds = new Set(products.map((product) => product.id));

    const discrepancies: StockDiscrepancy[] = [];

    for (const product of products) {
      const item = byProduct.get(product.id);

      if (!item) {
        const entry: StockDiscrepancy = {
          type: 'missing_inventory',
          productId: product.id,
          productName: product.name,
          productStock: product.stock,
          inventoryQuantity: null,
          resolved: false,
        };
        discrepancies.push(entry);

        if (fix) {
          try {
            await this.inventory('inventory.ensureStock', {
              productId: product.id,
              quantity: product.stock,
            });
            entry.resolved = true;
          } catch (error) {
            entry.error = (error as Error).message;
          }
        }
        continue;
      }

      if (Number(item.quantity) !== Number(product.stock)) {
        const entry: StockDiscrepancy = {
          type: 'quantity_mismatch',
          productId: product.id,
          productName: product.name,
          productStock: product.stock,
          inventoryQuantity: Number(item.quantity),
          resolved: false,
        };
        discrepancies.push(entry);

        if (fix) {
          try {
            // Inventory is authoritative → correct the catalog cache.
            await this.prisma.products.update({
              where: { id: product.id },
              data: { stock: Number(item.quantity) },
            });
            entry.resolved = true;
          } catch (error) {
            entry.error = (error as Error).message;
          }
        }
      }
    }

    for (const item of items) {
      if (productIds.has(Number(item.productId))) continue;

      const entry: StockDiscrepancy = {
        type: 'orphan_inventory',
        productId: Number(item.productId),
        productName: null,
        productStock: null,
        inventoryQuantity: Number(item.quantity),
        resolved: false,
      };
      discrepancies.push(entry);

      if (fix) {
        try {
          await this.inventory('inventory.deleteByProductId', item.productId);
          entry.resolved = true;
        } catch (error) {
          entry.error = (error as Error).message;
        }
      }
    }

    return {
      checkedProducts: products.length,
      inventoryRecords: items.length,
      discrepanciesFound: discrepancies.length,
      discrepanciesFixed: discrepancies.filter((entry) => entry.resolved)
        .length,
      fixed: fix,
      discrepancies,
    };
  }
}

