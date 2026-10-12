import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ClientProxy } from '@nestjs/microservices';
import { diskStorage } from 'multer';
import { mkdir, unlink } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { firstValueFrom } from 'rxjs';
import {
  CreateProductDto,
  ProductPaginationQueryDto,
  UpdateProductDto,
} from '../../../libs/dto/products/product.dto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Public } from '../auth/decorators/public.decorators.js';
import { Role } from '../auth/enums/role.enums.js';

const uploadDirectory = join(process.cwd(), 'uploads', 'products');
const imageExtensions: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
};

@Controller('products')
export class ProductsController {
  constructor(
    @Inject('PRODUCTS_SERVICE')
    private readonly productsClient: ClientProxy,
  ) {}

  @Public()
  @Get()
  findAll(@Query() query: ProductPaginationQueryDto) {
    return this.productsClient.send({ cmd: 'products.findAll' }, query);
  }

  @Public()
  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.productsClient.send({ cmd: 'products.findById' }, id);
  }

  @Public()
  @Post(':id/reviews')
  addReview(
    @Param('id', ParseIntPipe) id: number,
    @Body() review: { author: string; rating: number; comment: string },
  ) {
    return this.productsClient.send(
      { cmd: 'products.addReview' },
      { id, review },
    );
  }

  @Roles(Role.ADMIN)
  @Post()
  create(@Body() data: CreateProductDto) {
    return this.productsClient.send({ cmd: 'products.create' }, data);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() product: UpdateProductDto,
  ) {
    return this.productsClient.send(
      { cmd: 'products.update' },
      { id, product },
    );
  }

  @Roles(Role.ADMIN)
  @Post(':id/image')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: (_request, _file, callback) => {
          mkdir(uploadDirectory, { recursive: true })
            .then(() => callback(null, uploadDirectory))
            .catch((error: Error) => callback(error, uploadDirectory));
        },
        filename: (_request, file, callback) => {
          callback(null, `${randomUUID()}${imageExtensions[file.mimetype]}`);
        },
      }),
      fileFilter: (_request, file, callback) => {
        if (!imageExtensions[file.mimetype]) {
          callback(
            new BadRequestException(
              'Only JPEG, PNG, GIF, and WebP images are allowed',
            ),
            false,
          );
          return;
        }
        callback(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadImage(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    if (!image) {
      throw new BadRequestException('An image file is required');
    }

    const imageURL = `/uploads/products/${image.filename}`;
    try {
      return await firstValueFrom(
        this.productsClient.send(
          { cmd: 'products.updateImage' },
          { id, imageURL },
        ),
      );
    } catch (error) {
      try {
        await unlink(join(uploadDirectory, image.filename));
      } catch (cleanupError) {
        throw new AggregateError(
          [error, cleanupError],
          'Image upload failed and the uploaded file could not be removed',
        );
      }
      throw error;
    }
  }
  
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsClient.send({ cmd: 'products.delete' }, id);
  }
}
