import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { CartItemDto } from './cart.dto.js';
import { ShippingAddressDto } from './order.dto.js';
import { normalizePromoCode } from '../promocodes/promo-code.dto.js';

/**
 * One call that turns a server-side cart into a paid order:
 * validates the promo, reserves + consumes stock, writes the order and audit
 * trail, redeems the promo, then clears the cart.
 */
export class CheckoutDto {
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  cartToken!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  customerId?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  customerName!: string;

  @IsEmail()
  customerEmail!: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  customerPhone?: string;

  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress!: ShippingAddressDto;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  shippingMethod?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  paymentMethod?: string;

  /** Overrides the promo stored on the cart when present. */
  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === null || value === ''
      ? undefined
      : normalizePromoCode(value),
  )
  @IsString()
  @MaxLength(32)
  promoCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  tax?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  shippingFee?: number;

  /**
   * Snapshot fallback for the rare case where the server cart is empty (for
   * example the storefront could not sync before checking out).
   */
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items?: CartItemDto[];
}
