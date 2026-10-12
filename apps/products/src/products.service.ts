import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import {
  CreateProductDto,
  ProductPaginationQueryDto,
  UpdateProductDto,
} from '../../libs/dto/products/product.dto.js';

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
  constructor(private readonly prisma: PrismaService) {}

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

  async findById(id: number) {
    const product = await this.prisma.products.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  create(data: CreateProductDto) {
    const formattedData: any = {
      name: data.name,
      description: data.description ?? '',
      price: Number(data.price) || 0,
      original_price: Number(data.original_price ?? data.price) || 0,
      stock: Number(data.stock) || 0,
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

    return this.prisma.products.create({ data: formattedData });
  }

  async update(id: number, data: UpdateProductDto) {
    await this.findById(id);

    const formattedData: any = {};
    if (data.name !== undefined) formattedData.name = data.name;
    if (data.description !== undefined) formattedData.description = data.description;
    if (data.price !== undefined) formattedData.price = Number(data.price) || 0;
    if (data.original_price !== undefined) formattedData.original_price = Number(data.original_price) || 0;
    if (data.stock !== undefined) formattedData.stock = Number(data.stock) || 0;
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
    return this.prisma.products.delete({ where: { id } });
  }
}

