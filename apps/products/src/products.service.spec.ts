import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../database/prisma.service.js';
import { ProductsService } from './products.service.js';

describe('ProductsService', () => {
  let service: ProductsService;
  const products = {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: { products } },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  it('lists products newest first', async () => {
    products.findMany.mockResolvedValue([]);

    await service.findAll();

    expect(products.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: 'desc' },
    });
  });

  it('throws when a requested product does not exist', async () => {
    products.findUnique.mockResolvedValue(null);

    await expect(service.findById(42)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('creates a product', async () => {
    const product = { name: 'Shoes', price: 49.99 };
    products.create.mockResolvedValue({ id: 1, ...product });

    await service.create(product);

    expect(products.create).toHaveBeenCalledWith({ data: product });
  });

  it('updates and deletes existing products', async () => {
    products.findUnique.mockResolvedValue({ id: 1 });
    products.update.mockResolvedValue({ id: 1, stock: 4 });
    products.delete.mockResolvedValue({ id: 1 });

    await service.update(1, { stock: 4 });
    await service.updateImage(1, '/uploads/products/shoes.jpg');
    await service.remove(1);

    expect(products.update).toHaveBeenNthCalledWith(1, {
      where: { id: 1 },
      data: { stock: 4 },
    });
    expect(products.update).toHaveBeenNthCalledWith(2, {
      where: { id: 1 },
      data: { imageURL: '/uploads/products/shoes.jpg' },
    });
    expect(products.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it('ranks a name match above a description-only match', async () => {
    products.findMany.mockResolvedValue([
      {
        id: 2,
        name: 'Relaxed Linen Tee',
        description: 'Cut from oxford-weight cotton.',
        category: 'shirts',
        price: 24,
        stock: 0,
      },
      {
        id: 1,
        name: 'Oxford Cotton Shirt',
        description: 'A wardrobe staple.',
        category: 'shirts',
        price: 89,
        stock: 6,
      },
    ]);

    const result = await service.search({ q: 'oxford', limit: 8 });

    expect(result.data.map((product) => product.id)).toEqual([1, 2]);
    expect(result.total).toBe(2);
    expect(result.data[0].relevance).toBeGreaterThan(result.data[1].relevance);
    expect(result.suggestions.products[0]).toMatchObject({
      id: 1,
      name: 'Oxford Cotton Shirt',
      category: 'shirts',
    });
    expect(result.suggestions.categories).toEqual([
      { name: 'shirts', count: 2 },
    ]);
  });

  it('builds keyword completions from matched product names', async () => {
    products.findMany.mockResolvedValue([
      { id: 3, name: 'Classic Oxford Shirt', category: 'shirts', stock: 1 },
    ]);

    const result = await service.suggest({ q: 'oxf' });

    expect(result.suggestions.keywords).toContain('Oxford');
    expect(result.total).toBe(1);
    expect(result).not.toHaveProperty('data');
  });

  it('rejects a search without usable terms', async () => {
    await expect(service.search({ q: '   ' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(products.findMany).not.toHaveBeenCalled();
  });
});
