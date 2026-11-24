import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  CreateProductDto,
  ProductPaginationQueryDto,
  SearchProductsQueryDto,
  UpdateProductDto,
} from '../../libs/dto/products/product.dto.js';
import { ProductsService } from './products.service.js';

@Controller()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @MessagePattern({ cmd: 'products.findAll' })
  findAll(query?: ProductPaginationQueryDto) {
    return this.productsService.findAll(query);
  }

  /** Ranked search used by the storefront search page. */
  @MessagePattern({ cmd: 'products.search' })
  search(query: SearchProductsQueryDto) {
    return this.productsService.search(query);
  }

  /** Autocomplete suggestions used by the header search bar. */
  @MessagePattern({ cmd: 'products.suggest' })
  suggest(query: SearchProductsQueryDto) {
    return this.productsService.suggest(query);
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

  @MessagePattern({ cmd: 'products.addReview' })
  addReview(data: { id: number; review: { author: string; rating: number; comment: string } }) {
    return this.productsService.addReview(data.id, data.review);
  }

  @MessagePattern({ cmd: 'products.delete' })
  remove(id: number) {
    return this.productsService.remove(id);
  }

  /** Internal: mirror an inventory change into the catalog stock cache. */
  @MessagePattern({ cmd: 'products.setStockCache' })
  setStockCache(@Payload() data: { id: number; stock: number }) {
    return this.productsService.setStockCache(Number(data.id), Number(data.stock));
  }

  /** Compare product stock cache vs inventory and optionally repair it. */
  @MessagePattern({ cmd: 'products.reconcileStock' })
  reconcileStock(@Payload() options?: { fix?: boolean }) {
    return this.productsService.reconcileStock(options);
  }
}
