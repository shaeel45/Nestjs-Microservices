var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Transform, Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsEmail, IsInt, IsNumber, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength, ValidateNested, } from 'class-validator';
import { PROMO_CODE_PATTERN, normalizePromoCode, } from '../promocodes/promo-code.dto.js';
export class CartItemDto {
    productId;
    name;
    price;
    quantity;
    size;
    color;
    image;
}
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(64),
    __metadata("design:type", String)
], CartItemDto.prototype, "productId", void 0);
__decorate([
    IsString(),
    MinLength(1),
    MaxLength(200),
    __metadata("design:type", String)
], CartItemDto.prototype, "name", void 0);
__decorate([
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CartItemDto.prototype, "price", void 0);
__decorate([
    Type(() => Number),
    IsInt(),
    Min(1),
    Max(999),
    __metadata("design:type", Number)
], CartItemDto.prototype, "quantity", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(64),
    __metadata("design:type", String)
], CartItemDto.prototype, "size", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(64),
    __metadata("design:type", String)
], CartItemDto.prototype, "color", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(1000),
    __metadata("design:type", String)
], CartItemDto.prototype, "image", void 0);
export class CartTokenDto {
    cartToken;
}
__decorate([
    IsString(),
    MinLength(8),
    MaxLength(128),
    __metadata("design:type", String)
], CartTokenDto.prototype, "cartToken", void 0);
export class CartLookupDto extends CartTokenDto {
    customerId;
    customerEmail;
}
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(64),
    __metadata("design:type", String)
], CartLookupDto.prototype, "customerId", void 0);
__decorate([
    IsOptional(),
    IsEmail(),
    __metadata("design:type", String)
], CartLookupDto.prototype, "customerEmail", void 0);
export class AddCartItemDto extends CartTokenDto {
    customerId;
    customerEmail;
    item;
}
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(64),
    __metadata("design:type", String)
], AddCartItemDto.prototype, "customerId", void 0);
__decorate([
    IsOptional(),
    IsEmail(),
    __metadata("design:type", String)
], AddCartItemDto.prototype, "customerEmail", void 0);
__decorate([
    ValidateNested(),
    Type(() => CartItemDto),
    __metadata("design:type", CartItemDto)
], AddCartItemDto.prototype, "item", void 0);
export class UpdateCartItemDto extends CartTokenDto {
    quantity;
    delta;
}
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(0),
    Max(999),
    __metadata("design:type", Number)
], UpdateCartItemDto.prototype, "quantity", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    __metadata("design:type", Number)
], UpdateCartItemDto.prototype, "delta", void 0);
export class RemoveCartItemDto extends CartTokenDto {
}
export class ReplaceCartDto extends CartTokenDto {
    customerId;
    customerEmail;
    items;
}
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(64),
    __metadata("design:type", String)
], ReplaceCartDto.prototype, "customerId", void 0);
__decorate([
    IsOptional(),
    IsEmail(),
    __metadata("design:type", String)
], ReplaceCartDto.prototype, "customerEmail", void 0);
__decorate([
    IsArray(),
    ArrayMaxSize(100),
    ValidateNested({ each: true }),
    Type(() => CartItemDto),
    __metadata("design:type", Array)
], ReplaceCartDto.prototype, "items", void 0);
export class ApplyCartPromoDto extends CartTokenDto {
    code;
}
__decorate([
    Transform(({ value }) => normalizePromoCode(value)),
    IsString(),
    Matches(PROMO_CODE_PATTERN, {
        message: 'code must be 3–32 characters and contain only letters, numbers, dashes, or underscores',
    }),
    __metadata("design:type", String)
], ApplyCartPromoDto.prototype, "code", void 0);
//# sourceMappingURL=cart.dto.js.map