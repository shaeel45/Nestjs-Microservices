import { NotFoundException } from '@nestjs/common';
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
});
