import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';

describe('ProductsController', () => {
  let productsController: ProductsController;
  const productsService = {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateImage: vi.fn(),
    remove: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [{ provide: ProductsService, useValue: productsService }],
    }).compile();

    productsController = app.get<ProductsController>(ProductsController);
  });

  it('routes product operations to the service', () => {
    const data = { name: 'Shoes', price: 49.99 };
    const update = { id: 5, product: { stock: 4 } };

    productsController.findAll();
    productsController.findById(5);
    productsController.create(data);
    productsController.update(update);
    productsController.updateImage({ id: 5, imageURL: '/uploads/products/shoes.jpg' });
    productsController.remove(5);

    expect(productsService.findAll).toHaveBeenCalledOnce();
    expect(productsService.findById).toHaveBeenCalledWith(5);
    expect(productsService.create).toHaveBeenCalledWith(data);
    expect(productsService.update).toHaveBeenCalledWith(5, update.product);
    expect(productsService.updateImage).toHaveBeenCalledWith(
      5,
      '/uploads/products/shoes.jpg',
    );
    expect(productsService.remove).toHaveBeenCalledWith(5);
  });
});
