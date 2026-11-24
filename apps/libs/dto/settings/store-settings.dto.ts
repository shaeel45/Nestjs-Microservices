import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export const SHIPPING_METHODS = ['standard', 'express'] as const;
export type ShippingMethod = (typeof SHIPPING_METHODS)[number];

function toBool(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true' || value === '1';
  return Boolean(value);
}

/**
 * Editable store configuration. Every field is optional so the admin portal
 * can PATCH a single control, while the storefront reads the merged record.
 */
export class UpdateStoreSettingsDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  storeName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  tagline?: string;

  @IsOptional()
  @IsEmail()
  supportEmail?: string;

  /** Promotion copy shown in the storefront top banner. */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  bannerText?: string;

  @IsOptional()
  @Transform(({ value }) => toBool(value))
  @IsBoolean()
  bannerActive?: boolean;

  @IsOptional()
  @Transform(({ value }) => toBool(value))
  @IsBoolean()
  freeShippingEnabled?: boolean;

  /** Order subtotal at which standard shipping becomes free. */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  freeShippingThreshold?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  standardShippingRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  expressShippingRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(30)
  handlingDays?: number;

  @IsOptional()
  @IsIn(SUPPORTED_CURRENCIES)
  currency?: SupportedCurrency;
}

/** Query for `GET /settings/shipping/quote`. */
export class ShippingQuoteQueryDto {
  /** Cart subtotal used to decide whether free shipping applies. */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  subtotal?: number = 0;

  @IsOptional()
  @IsIn(SHIPPING_METHODS)
  method?: ShippingMethod = 'standard';
}
