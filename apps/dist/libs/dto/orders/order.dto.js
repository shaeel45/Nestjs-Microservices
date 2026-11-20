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
import { ArrayMinSize, IsArray, IsBoolean, IsEmail, IsIn, IsInt, IsISO8601, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength, ValidateNested, } from 'class-validator';
export const ORDER_STATUSES = [
    'PENDING',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
];
export const ORDER_STATUS_TRANSITIONS = {
    PENDING: ['PROCESSING', 'CANCELLED'],
    PROCESSING: ['SHIPPED', 'CANCELLED'],
    SHIPPED: ['DELIVERED', 'CANCELLED'],
    DELIVERED: [],
    CANCELLED: [],
};
export function isValidStatusTransition(from, to) {
    return ORDER_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}
export function normalizeOrderStatus(value) {
    return String(value ?? '')
        .trim()
        .toUpperCase();
}
function toBool(value) {
    if (value === undefined || value === null || value === '')
        return undefined;
    if (typeof value === 'boolean')
        return value;
    if (typeof value === 'string') {
        return value.toLowerCase() === 'true' || value === '1';
    }
    return Boolean(value);
}
export class OrderItemDto {
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
], OrderItemDto.prototype, "productId", void 0);
__decorate([
    IsString(),
    MinLength(1),
    MaxLength(200),
    __metadata("design:type", String)
], OrderItemDto.prototype, "name", void 0);
__decorate([
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], OrderItemDto.prototype, "price", void 0);
__decorate([
    Type(() => Number),
    IsInt(),
    Min(1),
    Max(999),
    __metadata("design:type", Number)
], OrderItemDto.prototype, "quantity", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(64),
    __metadata("design:type", String)
], OrderItemDto.prototype, "size", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(64),
    __metadata("design:type", String)
], OrderItemDto.prototype, "color", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(1000),
    __metadata("design:type", String)
], OrderItemDto.prototype, "image", void 0);
export class ShippingAddressDto {
    fullName;
    email;
    phone;
    street;
    city;
    state;
    postalCode;
    country;
}
__decorate([
    IsString(),
    MinLength(1),
    MaxLength(120),
    __metadata("design:type", String)
], ShippingAddressDto.prototype, "fullName", void 0);
__decorate([
    IsOptional(),
    IsEmail(),
    __metadata("design:type", String)
], ShippingAddressDto.prototype, "email", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(32),
    __metadata("design:type", String)
], ShippingAddressDto.prototype, "phone", void 0);
__decorate([
    IsString(),
    MinLength(1),
    MaxLength(200),
    __metadata("design:type", String)
], ShippingAddressDto.prototype, "street", void 0);
__decorate([
    IsString(),
    MinLength(1),
    MaxLength(100),
    __metadata("design:type", String)
], ShippingAddressDto.prototype, "city", void 0);
__decorate([
    IsString(),
    MinLength(1),
    MaxLength(100),
    __metadata("design:type", String)
], ShippingAddressDto.prototype, "state", void 0);
__decorate([
    IsString(),
    MinLength(1),
    MaxLength(32),
    __metadata("design:type", String)
], ShippingAddressDto.prototype, "postalCode", void 0);
__decorate([
    IsString(),
    MinLength(1),
    MaxLength(100),
    __metadata("design:type", String)
], ShippingAddressDto.prototype, "country", void 0);
export class CreateOrderDto {
    customerId;
    customerName;
    customerEmail;
    customerPhone;
    shippingAddress;
    shippingMethod;
    paymentMethod;
    promoCode;
    notes;
    status;
    items;
    discount;
    tax;
    shippingFee;
}
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(64),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "customerId", void 0);
__decorate([
    IsString(),
    MinLength(1),
    MaxLength(120),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "customerName", void 0);
__decorate([
    IsEmail(),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "customerEmail", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(32),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "customerPhone", void 0);
__decorate([
    ValidateNested(),
    Type(() => ShippingAddressDto),
    __metadata("design:type", ShippingAddressDto)
], CreateOrderDto.prototype, "shippingAddress", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(120),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "shippingMethod", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(120),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "paymentMethod", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(64),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "promoCode", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(500),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "notes", void 0);
__decorate([
    IsOptional(),
    Transform(({ value }) => normalizeOrderStatus(value)),
    IsIn(['PENDING', 'PROCESSING']),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "status", void 0);
__decorate([
    IsArray(),
    ArrayMinSize(1),
    ValidateNested({ each: true }),
    Type(() => OrderItemDto),
    __metadata("design:type", Array)
], CreateOrderDto.prototype, "items", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateOrderDto.prototype, "discount", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateOrderDto.prototype, "tax", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreateOrderDto.prototype, "shippingFee", void 0);
export class UpdateOrderStatusDto {
    status;
    note;
    performedBy;
}
__decorate([
    Transform(({ value }) => normalizeOrderStatus(value)),
    IsIn([...ORDER_STATUSES]),
    __metadata("design:type", String)
], UpdateOrderStatusDto.prototype, "status", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(500),
    __metadata("design:type", String)
], UpdateOrderStatusDto.prototype, "note", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(64),
    __metadata("design:type", String)
], UpdateOrderStatusDto.prototype, "performedBy", void 0);
export class OrderQueryDto {
    page = 1;
    limit = 20;
    all;
    search;
    status;
    sortBy;
    from;
    to;
}
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(1),
    __metadata("design:type", Number)
], OrderQueryDto.prototype, "page", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(1),
    __metadata("design:type", Number)
], OrderQueryDto.prototype, "limit", void 0);
__decorate([
    IsOptional(),
    Transform(({ value }) => toBool(value)),
    IsBoolean(),
    __metadata("design:type", Boolean)
], OrderQueryDto.prototype, "all", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], OrderQueryDto.prototype, "search", void 0);
__decorate([
    IsOptional(),
    Transform(({ value }) => normalizeOrderStatus(value)),
    IsIn([...ORDER_STATUSES]),
    __metadata("design:type", String)
], OrderQueryDto.prototype, "status", void 0);
__decorate([
    IsOptional(),
    IsIn(['newest', 'oldest', 'total_desc', 'total_asc']),
    __metadata("design:type", String)
], OrderQueryDto.prototype, "sortBy", void 0);
__decorate([
    IsOptional(),
    IsISO8601(),
    __metadata("design:type", String)
], OrderQueryDto.prototype, "from", void 0);
__decorate([
    IsOptional(),
    IsISO8601(),
    __metadata("design:type", String)
], OrderQueryDto.prototype, "to", void 0);
export class MyOrdersQueryDto {
    customerId;
    email;
    limit = 50;
}
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(64),
    __metadata("design:type", String)
], MyOrdersQueryDto.prototype, "customerId", void 0);
__decorate([
    IsOptional(),
    IsEmail(),
    __metadata("design:type", String)
], MyOrdersQueryDto.prototype, "email", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(1),
    Max(100),
    __metadata("design:type", Number)
], MyOrdersQueryDto.prototype, "limit", void 0);
//# sourceMappingURL=order.dto.js.map