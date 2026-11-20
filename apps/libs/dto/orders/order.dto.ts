import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export const ORDER_STATUSES = [
  'PENDING',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
] as const;

export type OrderStatusValue = (typeof ORDER_STATUSES)[number];

/**
 * Statuses an order may move to from each state. Delivered and cancelled are
 * terminal so history cannot be rewritten by accident.
 */
export const ORDER_STATUS_TRANSITIONS: Record<
  OrderStatusValue,
  OrderStatusValue[]
> = {
  PENDING: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};

export function isValidStatusTransition(
  from: OrderStatusValue,
  to: OrderStatusValue,
): boolean {
  return ORDER_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export function normalizeOrderStatus(value: unknown): string {
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

export class OrderItemDto {
  /** Storefront/catalog product reference (numeric or slug-style ids). */
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

export class ShippingAddressDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  fullName!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  street!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  city!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  state!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(32)
  postalCode!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  country!: string;
}

export class CreateOrderDto {
  /** External user id from the storefront (e.g. "usr-..."). */
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

  @IsOptional()
  @IsString()
  @MaxLength(64)
  promoCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  /** New orders start as PROCESSING unless the caller asks for PENDING. */
  @IsOptional()
  @Transform(({ value }) => normalizeOrderStatus(value))
  @IsIn(['PENDING', 'PROCESSING'])
  status?: 'PENDING' | 'PROCESSING';

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  /** Line totals are recomputed from items; only these adjustments are trusted. */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discount?: number;

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
}

export class UpdateOrderStatusDto {
  @Transform(({ value }) => normalizeOrderStatus(value))
  @IsIn([...ORDER_STATUSES])
  status!: OrderStatusValue;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  performedBy?: string;
}

export class OrderQueryDto {
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

  /** Matches order number, customer name, email or phone. */
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => normalizeOrderStatus(value))
  @IsIn([...ORDER_STATUSES])
  status?: OrderStatusValue;

  @IsOptional()
  @IsIn(['newest', 'oldest', 'total_desc', 'total_asc'])
  sortBy?: 'newest' | 'oldest' | 'total_desc' | 'total_asc';

  /** Inclusive lower bound on the order date (ISO-8601). */
  @IsOptional()
  @IsISO8601()
  from?: string;

  /** Inclusive upper bound on the order date (ISO-8601 or YYYY-MM-DD). */
  @IsOptional()
  @IsISO8601()
  to?: string;
}

export class MyOrdersQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  customerId?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;
}
