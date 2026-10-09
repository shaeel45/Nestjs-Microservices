import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { of } from 'rxjs';
import { basename, join } from 'node:path';
import { unlink } from 'node:fs/promises';
import { ProductsController } from '../../api-gateway/src/products/products.controller.js';

describe('Products API (e2e)', () => {
  let app: INestApplication<App>;
  const productsClient = {
    send: vi.fn((_pattern: unknown, payload: unknown) => of(payload)),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [{ provide: 'PRODUCTS_SERVICE', useValue: productsClient }],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  it('exposes product CRUD endpoints', async () => {
    const product = { name: 'Mug', price: 12 };

    await request(app.getHttpServer()).get('/products').expect(200);
    expect(productsClient.send).toHaveBeenLastCalledWith(
      { cmd: 'products.findAll' },
      {},
    );

    await request(app.getHttpServer()).get('/products/3').expect(200);
    expect(productsClient.send).toHaveBeenLastCalledWith(
      { cmd: 'products.findById' },
      3,
    );

    await request(app.getHttpServer())
      .post('/products')
      .send({ ...product, price: '12' })
      .expect(201);
    expect(productsClient.send).toHaveBeenLastCalledWith(
      { cmd: 'products.create' },
      { ...product, price: 12 },
    );

    await request(app.getHttpServer())
      .patch('/products/3')
      .send({ stock: 5 })
      .expect(200);
    expect(productsClient.send).toHaveBeenLastCalledWith(
      { cmd: 'products.update' },
      { id: 3, product: { stock: 5 } },
    );

    await request(app.getHttpServer()).delete('/products/3').expect(200);
    expect(productsClient.send).toHaveBeenLastCalledWith(
      { cmd: 'products.delete' },
      3,
    );
  });

  it('uploads an image for a product by its id', async () => {
    const response = await request(app.getHttpServer())
      .post('/products/3/image')
      .attach('image', Buffer.from('test image'), {
        filename: 'product.png',
        contentType: 'image/png',
      })
      .expect(201);

    expect(productsClient.send).toHaveBeenCalledWith(
      { cmd: 'products.updateImage' },
      expect.objectContaining({
        id: 3,
        imageURL: expect.stringMatching(
          /^\/uploads\/products\/[0-9a-f-]+\.png$/,
        ),
      }),
    );

    const uploadedImage = response.body as { imageURL: string };
    await unlink(
      join(
        process.cwd(),
        'uploads',
        'products',
        basename(uploadedImage.imageURL),
      ),
    );
  });

  it('rejects non-image uploads', async () => {
    await request(app.getHttpServer())
      .post('/products/3/image')
      .attach('image', Buffer.from('not an image'), {
        filename: 'file.txt',
        contentType: 'text/plain',
      })
      .expect(400);

    expect(productsClient.send).not.toHaveBeenCalled();
  });

  afterEach(async () => {
    await app.close();
  });
});
