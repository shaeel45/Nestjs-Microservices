import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/** Promo codes are uppercase, 3–32 chars, letters/digits/dash/underscore. */
export const PROMO_CODE_PATTERN = /^[A-Z0-9][A-Z0-9_-]{2,31}$/;

export function normalizePromoCode(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toUpperCase();
}

function toBool(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1';
  }
  return Boolean(value);
}

export class CreatePromoCodeDto {
  @Transform(({ value }) => normalizePromoCode(value))
  @IsString()
  @Matches(PROMO_CODE_PATTERN, {
    message:
      'code must be 3–32 characters and contain only letters, numbers, dashes, or underscores',
  })
  code!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  discountPercent!: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @IsOptional()
  @Transform(({ value }) => toBool(value))
  @IsBoolean()
  active?: boolean;

  /** Total allowed redemptions. Omit for unlimited. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxUses?: number;

  /** Minimum cart subtotal required to redeem the code. */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minOrderAmount?: number;

  /** ISO-8601 timestamp. Omit for a code that never expires. */
  @IsOptional()
  @IsISO8601()
  expiresAt?: string;
}

export class UpdatePromoCodeDto {
  @IsOptional()
  @Transform(({ value }) => normalizePromoCode(value))
  @IsString()
  @Matches(PROMO_CODE_PATTERN, {
    message:
      'code must be 3–32 characters and contain only letters, numbers, dashes, or underscores',
  })
  code?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  discountPercent?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @IsOptional()
  @Transform(({ value }) => toBool(value))
  @IsBoolean()
  active?: boolean;

  /** Send null to remove the usage cap. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxUses?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minOrderAmount?: number;

  /** Send null to clear the expiry date. */
  @IsOptional()
  @IsISO8601()
  expiresAt?: string | null;
}

export class SetPromoCodeActiveDto {
  @Transform(({ value }) => toBool(value))
  @IsBoolean()
  active!: boolean;
}

export class PromoCodeQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  /** Return every matching row (no pagination). */
  @IsOptional()
  @Transform(({ value }) => toBool(value))
  @IsBoolean()
  all?: boolean;

  /** Matches the code or the description (case-insensitive). */
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => toBool(value))
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsIn(['newest', 'code', 'discount', 'usage'])
  sortBy?: 'newest' | 'code' | 'discount' | 'usage';
}

export class ValidatePromoCodeDto {
  @Transform(({ value }) => normalizePromoCode(value))
  @IsString()
  @Matches(PROMO_CODE_PATTERN, {
    message:
      'code must be 3–32 characters and contain only letters, numbers, dashes, or underscores',
  })
  code!: string;

  /** Cart subtotal the discount is calculated against. */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  orderAmount?: number;
}

export class RedeemPromoCodeDto extends ValidatePromoCodeDto {
  /** Order id/number this redemption belongs to. */
  @IsOptional()
  @IsString()
  @MaxLength(64)
  orderReference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  performedBy?: string;
}

export class RedemptionQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
