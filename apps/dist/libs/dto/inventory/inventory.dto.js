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
import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min, } from 'class-validator';
export const InventoryTransactionType = {
    RESTOCK: 'RESTOCK',
    SALE: 'SALE',
    RETURN: 'RETURN',
    DAMAGE: 'DAMAGE',
    ADJUSTMENT: 'ADJUSTMENT',
};
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
export class CreateInventoryDto {
    productId;
    quantity;
    reservedQuantity;
    warehouse;
    lowStockThreshold;
}
__decorate([
    Type(() => Number),
    IsInt(),
    Min(1),
    __metadata("design:type", Number)
], CreateInventoryDto.prototype, "productId", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(0),
    __metadata("design:type", Number)
], CreateInventoryDto.prototype, "quantity", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(0),
    __metadata("design:type", Number)
], CreateInventoryDto.prototype, "reservedQuantity", void 0);
__decorate([
    IsOptional(),
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], CreateInventoryDto.prototype, "warehouse", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(0),
    __metadata("design:type", Number)
], CreateInventoryDto.prototype, "lowStockThreshold", void 0);
export class UpdateInventoryDto {
    warehouse;
    lowStockThreshold;
}
__decorate([
    IsOptional(),
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], UpdateInventoryDto.prototype, "warehouse", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(0),
    __metadata("design:type", Number)
], UpdateInventoryDto.prototype, "lowStockThreshold", void 0);
export class InventoryQueryDto {
    page = 1;
    limit = 20;
    all;
    productId;
    warehouse;
    lowStock;
    outOfStock;
}
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(1),
    __metadata("design:type", Number)
], InventoryQueryDto.prototype, "page", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(1),
    __metadata("design:type", Number)
], InventoryQueryDto.prototype, "limit", void 0);
__decorate([
    IsOptional(),
    Transform(({ value }) => toBool(value)),
    IsBoolean(),
    __metadata("design:type", Boolean)
], InventoryQueryDto.prototype, "all", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(1),
    __metadata("design:type", Number)
], InventoryQueryDto.prototype, "productId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], InventoryQueryDto.prototype, "warehouse", void 0);
__decorate([
    IsOptional(),
    Transform(({ value }) => toBool(value)),
    IsBoolean(),
    __metadata("design:type", Boolean)
], InventoryQueryDto.prototype, "lowStock", void 0);
__decorate([
    IsOptional(),
    Transform(({ value }) => toBool(value)),
    IsBoolean(),
    __metadata("design:type", Boolean)
], InventoryQueryDto.prototype, "outOfStock", void 0);
export class AdjustStockDto {
    productId;
    inventoryItemId;
    changeAmount;
    change;
    type;
    performedBy;
    reason;
    referenceId;
}
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(1),
    __metadata("design:type", Number)
], AdjustStockDto.prototype, "productId", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(1),
    __metadata("design:type", Number)
], AdjustStockDto.prototype, "inventoryItemId", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    __metadata("design:type", Number)
], AdjustStockDto.prototype, "changeAmount", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    __metadata("design:type", Number)
], AdjustStockDto.prototype, "change", void 0);
__decorate([
    IsOptional(),
    IsEnum(InventoryTransactionType),
    __metadata("design:type", String)
], AdjustStockDto.prototype, "type", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], AdjustStockDto.prototype, "performedBy", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], AdjustStockDto.prototype, "reason", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], AdjustStockDto.prototype, "referenceId", void 0);
export class ReserveStockDto {
    productId;
    quantity;
    referenceId;
}
__decorate([
    Type(() => Number),
    IsInt(),
    Min(1),
    __metadata("design:type", Number)
], ReserveStockDto.prototype, "productId", void 0);
__decorate([
    Type(() => Number),
    IsInt(),
    Min(1),
    __metadata("design:type", Number)
], ReserveStockDto.prototype, "quantity", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], ReserveStockDto.prototype, "referenceId", void 0);
export class ReleaseStockDto {
    productId;
    quantity;
    referenceId;
}
__decorate([
    Type(() => Number),
    IsInt(),
    Min(1),
    __metadata("design:type", Number)
], ReleaseStockDto.prototype, "productId", void 0);
__decorate([
    Type(() => Number),
    IsInt(),
    Min(1),
    __metadata("design:type", Number)
], ReleaseStockDto.prototype, "quantity", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], ReleaseStockDto.prototype, "referenceId", void 0);
export class ConsumeStockDto {
    productId;
    quantity;
    referenceId;
    performedBy;
    reason;
}
__decorate([
    Type(() => Number),
    IsInt(),
    Min(1),
    __metadata("design:type", Number)
], ConsumeStockDto.prototype, "productId", void 0);
__decorate([
    Type(() => Number),
    IsInt(),
    Min(1),
    __metadata("design:type", Number)
], ConsumeStockDto.prototype, "quantity", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], ConsumeStockDto.prototype, "referenceId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], ConsumeStockDto.prototype, "performedBy", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], ConsumeStockDto.prototype, "reason", void 0);
export class TransactionQueryDto {
    page = 1;
    limit = 20;
    type;
}
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(1),
    __metadata("design:type", Number)
], TransactionQueryDto.prototype, "page", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(1),
    __metadata("design:type", Number)
], TransactionQueryDto.prototype, "limit", void 0);
__decorate([
    IsOptional(),
    IsEnum(InventoryTransactionType),
    __metadata("design:type", String)
], TransactionQueryDto.prototype, "type", void 0);
//# sourceMappingURL=inventory.dto.js.map