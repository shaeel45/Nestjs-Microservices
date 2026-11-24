import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN',
}

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  fullname: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  lastname: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(UserRole)
  role: UserRole;
}

export class UpdateUserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  fullname: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  lastname: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(UserRole)
  role: UserRole;
}

/**
 * Default shipping address for the signed-in customer.
 * `PUT /users/me/address` replaces the whole address, so every line is
 * required except `state` (some countries do not use one).
 */
export class ShippingAddressDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  street: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  city: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  state?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  postalCode: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  country: string;
}

/** Partial address update (`PATCH /users/me/address`). */
export class UpdateShippingAddressDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  street?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  state?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  postalCode?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  country?: string;
}
