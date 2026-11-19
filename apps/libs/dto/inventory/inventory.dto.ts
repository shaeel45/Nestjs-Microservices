import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export const InventoryTransactionType = {
  RESTOCK: 'RESTOCK',
  SALE: 'SALE',
  RETURN: 'RETURN',
  DAMAGE: 'DAMAGE',
  ADJUSTMENT: 'ADJUSTMENT',
} as const;

export type InventoryTransactionType =
  (typeof InventoryTransactionType)[keyof typeof InventoryTransactionType];

function toBool(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1';
  }
  return Boolean(value);
}

export class CreateInventoryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  productId!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  quantity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  reservedQuantity?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  warehouse?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  lowStockThreshold?: number;
}

/**
 * Metadata-only update. On-hand and reserved quantities deliberately cannot
 * be changed here — they must go through adjust-stock / reserve / release /
 * consume so every change is validated and audited.
 */
export class UpdateInventoryDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  warehouse?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  lowStockThreshold?: number;
}

export class InventoryQueryDto {
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

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  productId?: number;

  @IsOptional()
  @IsString()
  warehouse?: string;

  /** Items where quantity <= lowStockThreshold */
  @IsOptional()
  @Transform(({ value }) => toBool(value))
  @IsBoolean()
  lowStock?: boolean;

  /** Items where quantity <= 0 */
  @IsOptional()
  @Transform(({ value }) => toBool(value))
  @IsBoolean()
  outOfStock?: boolean;
}

export class AdjustStockDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  productId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  inventoryItemId?: number;

  /** Signed delta applied to on-hand quantity (preferred). */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  changeAmount?: number;

  /** Backward-compatible alias for changeAmount. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  change?: number;

  @IsOptional()
  @IsEnum(InventoryTransactionType)
  type?: InventoryTransactionType;

  @IsOptional()
  @IsString()
  performedBy?: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  referenceId?: string;
}

export class ReserveStockDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  productId!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsString()
  referenceId?: string;
}

export class ReleaseStockDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  productId!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsString()
  referenceId?: string;
}

/**
 * Finalize a reservation into an actual sale. Decrements both on-hand
 * quantity and reservedQuantity and writes a SALE transaction.
 */
export class ConsumeStockDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  productId!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsString()
  referenceId?: string;

  @IsOptional()
  @IsString()
  performedBy?: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class TransactionQueryDto {
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

  @IsOptional()
  @IsEnum(InventoryTransactionType)
  type?: InventoryTransactionType;
}
