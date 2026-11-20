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
import { IsBoolean, IsIn, IsInt, IsISO8601, IsNumber, IsOptional, IsString, Matches, Max, MaxLength, Min, } from 'class-validator';
export const PROMO_CODE_PATTERN = /^[A-Z0-9][A-Z0-9_-]{2,31}$/;
export function normalizePromoCode(value) {
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
export class CreatePromoCodeDto {
    code;
    discountPercent;
    description;
    active;
    maxUses;
    minOrderAmount;
    expiresAt;
}
__decorate([
    Transform(({ value }) => normalizePromoCode(value)),
    IsString(),
    Matches(PROMO_CODE_PATTERN, {
        message: 'code must be 3–32 characters and contain only letters, numbers, dashes, or underscores',
    }),
    __metadata("design:type", String)
], CreatePromoCodeDto.prototype, "code", void 0);
__decorate([
    Type(() => Number),
    IsInt(),
    Min(1),
    Max(100),
    __metadata("design:type", Number)
], CreatePromoCodeDto.prototype, "discountPercent", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], CreatePromoCodeDto.prototype, "description", void 0);
__decorate([
    IsOptional(),
    Transform(({ value }) => toBool(value)),
    IsBoolean(),
    __metadata("design:type", Boolean)
], CreatePromoCodeDto.prototype, "active", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(1),
    __metadata("design:type", Number)
], CreatePromoCodeDto.prototype, "maxUses", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], CreatePromoCodeDto.prototype, "minOrderAmount", void 0);
__decorate([
    IsOptional(),
    IsISO8601(),
    __metadata("design:type", String)
], CreatePromoCodeDto.prototype, "expiresAt", void 0);
export class UpdatePromoCodeDto {
    code;
    discountPercent;
    description;
    active;
    maxUses;
    minOrderAmount;
    expiresAt;
}
__decorate([
    IsOptional(),
    Transform(({ value }) => normalizePromoCode(value)),
    IsString(),
    Matches(PROMO_CODE_PATTERN, {
        message: 'code must be 3–32 characters and contain only letters, numbers, dashes, or underscores',
    }),
    __metadata("design:type", String)
], UpdatePromoCodeDto.prototype, "code", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(1),
    Max(100),
    __metadata("design:type", Number)
], UpdatePromoCodeDto.prototype, "discountPercent", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(200),
    __metadata("design:type", String)
], UpdatePromoCodeDto.prototype, "description", void 0);
__decorate([
    IsOptional(),
    Transform(({ value }) => toBool(value)),
    IsBoolean(),
    __metadata("design:type", Boolean)
], UpdatePromoCodeDto.prototype, "active", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(1),
    __metadata("design:type", Object)
], UpdatePromoCodeDto.prototype, "maxUses", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], UpdatePromoCodeDto.prototype, "minOrderAmount", void 0);
__decorate([
    IsOptional(),
    IsISO8601(),
    __metadata("design:type", Object)
], UpdatePromoCodeDto.prototype, "expiresAt", void 0);
export class SetPromoCodeActiveDto {
    active;
}
__decorate([
    Transform(({ value }) => toBool(value)),
    IsBoolean(),
    __metadata("design:type", Boolean)
], SetPromoCodeActiveDto.prototype, "active", void 0);
export class PromoCodeQueryDto {
    page = 1;
    limit = 20;
    all;
    search;
    active;
    sortBy;
}
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(1),
    __metadata("design:type", Number)
], PromoCodeQueryDto.prototype, "page", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(1),
    __metadata("design:type", Number)
], PromoCodeQueryDto.prototype, "limit", void 0);
__decorate([
    IsOptional(),
    Transform(({ value }) => toBool(value)),
    IsBoolean(),
    __metadata("design:type", Boolean)
], PromoCodeQueryDto.prototype, "all", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], PromoCodeQueryDto.prototype, "search", void 0);
__decorate([
    IsOptional(),
    Transform(({ value }) => toBool(value)),
    IsBoolean(),
    __metadata("design:type", Boolean)
], PromoCodeQueryDto.prototype, "active", void 0);
__decorate([
    IsOptional(),
    IsIn(['newest', 'code', 'discount', 'usage']),
    __metadata("design:type", String)
], PromoCodeQueryDto.prototype, "sortBy", void 0);
export class ValidatePromoCodeDto {
    code;
    orderAmount;
}
__decorate([
    Transform(({ value }) => normalizePromoCode(value)),
    IsString(),
    Matches(PROMO_CODE_PATTERN, {
        message: 'code must be 3–32 characters and contain only letters, numbers, dashes, or underscores',
    }),
    __metadata("design:type", String)
], ValidatePromoCodeDto.prototype, "code", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], ValidatePromoCodeDto.prototype, "orderAmount", void 0);
export class RedeemPromoCodeDto extends ValidatePromoCodeDto {
    orderReference;
    performedBy;
}
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(64),
    __metadata("design:type", String)
], RedeemPromoCodeDto.prototype, "orderReference", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(64),
    __metadata("design:type", String)
], RedeemPromoCodeDto.prototype, "performedBy", void 0);
export class RedemptionQueryDto {
    page = 1;
    limit = 20;
}
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(1),
    __metadata("design:type", Number)
], RedemptionQueryDto.prototype, "page", void 0);
__decorate([
    IsOptional(),
    Type(() => Number),
    IsInt(),
    Min(1),
    __metadata("design:type", Number)
], RedemptionQueryDto.prototype, "limit", void 0);
//# sourceMappingURL=promo-code.dto.js.map