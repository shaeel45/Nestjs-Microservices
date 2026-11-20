var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Min, } from 'class-validator';
export class CreateProductDto {
    name;
    description;
    price;
    original_price;
    stock;
    colors;
    sizes;
    images;
    details;
    rating;
    review;
    imageURL;
    category;
    isNew;
    isTrending;
    isFeatured;
}
__decorate([
    IsString(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "name", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "description", void 0);
__decorate([
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateProductDto.prototype, "price", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateProductDto.prototype, "original_price", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(0),
    __metadata("design:type", Number)
], CreateProductDto.prototype, "stock", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", Object)
], CreateProductDto.prototype, "colors", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", Object)
], CreateProductDto.prototype, "sizes", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", Array)
], CreateProductDto.prototype, "images", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", Array)
], CreateProductDto.prototype, "details", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", Object)
], CreateProductDto.prototype, "rating", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", Object)
], CreateProductDto.prototype, "review", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "imageURL", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "category", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], CreateProductDto.prototype, "isNew", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], CreateProductDto.prototype, "isTrending", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], CreateProductDto.prototype, "isFeatured", void 0);
export class UpdateProductDto {
    name;
    description;
    price;
    original_price;
    stock;
    colors;
    sizes;
    images;
    details;
    rating;
    review;
    imageURL;
    category;
    isNew;
    isTrending;
    isFeatured;
}
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateProductDto.prototype, "name", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateProductDto.prototype, "description", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateProductDto.prototype, "price", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdateProductDto.prototype, "original_price", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(0),
    __metadata("design:type", Number)
], UpdateProductDto.prototype, "stock", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", Object)
], UpdateProductDto.prototype, "colors", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", Object)
], UpdateProductDto.prototype, "sizes", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", Array)
], UpdateProductDto.prototype, "images", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", Array)
], UpdateProductDto.prototype, "details", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", Object)
], UpdateProductDto.prototype, "rating", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", Object)
], UpdateProductDto.prototype, "review", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateProductDto.prototype, "imageURL", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateProductDto.prototype, "category", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], UpdateProductDto.prototype, "isNew", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], UpdateProductDto.prototype, "isTrending", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], UpdateProductDto.prototype, "isFeatured", void 0);
export class ProductPaginationQueryDto {
    page = 1;
    limit = 12;
    category;
    search;
    sortBy;
    minPrice;
    maxPrice;
    inStock;
    all;
}
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(1),
    __metadata("design:type", Number)
], ProductPaginationQueryDto.prototype, "page", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(1),
    __metadata("design:type", Number)
], ProductPaginationQueryDto.prototype, "limit", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], ProductPaginationQueryDto.prototype, "category", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], ProductPaginationQueryDto.prototype, "search", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], ProductPaginationQueryDto.prototype, "sortBy", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], ProductPaginationQueryDto.prototype, "minPrice", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], ProductPaginationQueryDto.prototype, "maxPrice", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", Object)
], ProductPaginationQueryDto.prototype, "inStock", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", Object)
], ProductPaginationQueryDto.prototype, "all", void 0);
//# sourceMappingURL=product.dto.js.map