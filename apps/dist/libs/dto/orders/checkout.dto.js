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
import { ArrayMaxSize, ArrayMinSize, IsArray, IsEmail, IsNumber, IsOptional, IsString, MaxLength, Min, MinLength, ValidateNested, } from 'class-validator';
import { CartItemDto } from './cart.dto.js';
import { ShippingAddressDto } from './order.dto.js';
import { normalizePromoCode } from '../promocodes/promo-code.dto.js';
export class CheckoutDto {
    cartToken;
    customerId;
    customerName;
    customerEmail;
    customerPhone;
    shippingAddress;
    shippingMethod;
    paymentMethod;
    promoCode;
    notes;
    tax;
    shippingFee;
    items;
}
__decorate([
    IsString(),
    MinLength(8),
    MaxLength(128),
    __metadata("design:type", String)
], CheckoutDto.prototype, "cartToken", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(64),
    __metadata("design:type", String)
], CheckoutDto.prototype, "customerId", void 0);
__decorate([
    IsString(),
    MinLength(1),
    MaxLength(120),
    __metadata("design:type", String)
], CheckoutDto.prototype, "customerName", void 0);
__decorate([
    IsEmail(),
    __metadata("design:type", String)
], CheckoutDto.prototype, "customerEmail", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(32),
    __metadata("design:type", String)
], CheckoutDto.prototype, "customerPhone", void 0);
__decorate([
    ValidateNested(),
    Type(() => ShippingAddressDto),
    __metadata("design:type", ShippingAddressDto)
], CheckoutDto.prototype, "shippingAddress", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(120),
    __metadata("design:type", String)
], CheckoutDto.prototype, "shippingMethod", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(120),
    __metadata("design:type", String)
], CheckoutDto.prototype, "paymentMethod", void 0);
__decorate([
    IsOptional(),
    Transform(({ value }) => value === undefined || value === null || value === ''
        ? undefined
        : normalizePromoCode(value)),
    IsString(),
    MaxLength(32),
    __metadata("design:type", String)
], CheckoutDto.prototype, "promoCode", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(500),
    __metadata("design:type", String)
], CheckoutDto.prototype, "notes", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CheckoutDto.prototype, "tax", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CheckoutDto.prototype, "shippingFee", void 0);
__decorate([
    IsOptional(),
    IsArray(),
    ArrayMinSize(1),
    ArrayMaxSize(100),
    ValidateNested({ each: true }),
    Type(() => CartItemDto),
    __metadata("design:type", Array)
], CheckoutDto.prototype, "items", void 0);
//# sourceMappingURL=checkout.dto.js.map