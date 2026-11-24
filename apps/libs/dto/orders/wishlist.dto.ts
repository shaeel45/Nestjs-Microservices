import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

/**
 * A saved product. `productId` stays a string because the demo catalog mixes
 * numeric ids (inventory-backed) with slug ids like "pa-1" (mock catalog).
 */
export class WishlistItemDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  productId?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  image?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  category?: string;
}

/** Shared wishlist identity + optional customer link. */
export class WishlistTokenDto {
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  wishlistToken!: string;
}

export class WishlistLookupDto extends WishlistTokenDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  customerId?: string;

  @IsOptional()
  @IsEmail()
  customerEmail?: string;
}

export class AddWishlistItemDto extends WishlistLookupDto {
  @ValidateNested()
  @Type(() => WishlistItemDto)
  item!: WishlistItemDto;
}

/** Add the product when missing, remove it when already saved. */
export class ToggleWishlistItemDto extends WishlistLookupDto {
  @ValidateNested()
  @Type(() => WishlistItemDto)
  item!: WishlistItemDto;
}

/** Replace the whole saved list (used to push a browser wishlist to the API). */
export class SyncWishlistDto extends WishlistLookupDto {
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => WishlistItemDto)
  items!: WishlistItemDto[];
}

export class RemoveWishlistItemDto extends WishlistTokenDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  productId?: string;

  /** Stored item id; used when the product has no id of its own. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  itemId?: number;
}
