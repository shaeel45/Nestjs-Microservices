import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {
  PROMO_CODE_PATTERN,
  normalizePromoCode,
} from '../promocodes/promo-code.dto.js';

/**
 * A cart line exactly as the storefront holds it. `productId` stays a string
 * because the demo catalog mixes numeric ids (inventory-backed) with slug ids
 * like "pa-1" (mock catalog, no stock record).
 */
export class CartItemDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  productId?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(999)
  quantity!: number;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  size?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  image?: string;
}

/** Shared cart identity + optional customer link. */
export class CartTokenDto {
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  cartToken!: string;
}

export class CartLookupDto extends CartTokenDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  customerId?: string;

  @IsOptional()
  @IsEmail()
  customerEmail?: string;
}

export class AddCartItemDto extends CartTokenDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  customerId?: string;

  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @ValidateNested()
  @Type(() => CartItemDto)
  item!: CartItemDto;
}

export class UpdateCartItemDto extends CartTokenDto {
  /** New absolute quantity. 0 removes the line. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(999)
  quantity?: number;

  /** Relative quantity change (+1 to increment, -1 to decrement). */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  delta?: number;
}

export class RemoveCartItemDto extends CartTokenDto {}

export class ReplaceCartDto extends CartTokenDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  customerId?: string;

  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items!: CartItemDto[];
}

export class ApplyCartPromoDto extends CartTokenDto {
  @Transform(({ value }) => normalizePromoCode(value))
  @IsString()
  @Matches(PROMO_CODE_PATTERN, {
    message:
      'code must be 3–32 characters and contain only letters, numbers, dashes, or underscores',
  })
  code!: string;
}
