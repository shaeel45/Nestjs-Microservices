import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import {
  CreateProductDto,
  UpdateProductDto,
} from '../../libs/dto/products/product.dto.js';
import { ProductsService } from './products.service.js';

@Controller()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @MessagePattern({ cmd: 'products.findAll' })
  findAll() {
    return this.productsService.findAll();
  }

  @MessagePattern({ cmd: 'products.findById' })
  findById(id: number) {
    return this.productsService.findById(id);
  }

  @MessagePattern({ cmd: 'products.create' })
  create(data: CreateProductDto) {
    return this.productsService.create(data);
  }

  @MessagePattern({ cmd: 'products.update' })
  update(data: { id: number; product: UpdateProductDto }) {
    return this.productsService.update(data.id, data.product);
  }

  @MessagePattern({ cmd: 'products.updateImage' })
  updateImage(data: { id: number; imageURL: string }) {
    return this.productsService.updateImage(data.id, data.imageURL);
  }

  @MessagePattern({ cmd: 'products.delete' })
  remove(id: number) {
    return this.productsService.remove(id);
  }
}
