export declare const PROMO_CODE_PATTERN: RegExp;
export declare function normalizePromoCode(value: unknown): string;
export declare class CreatePromoCodeDto {
    code: string;
    discountPercent: number;
    description?: string;
    active?: boolean;
    maxUses?: number;
    minOrderAmount?: number;
    expiresAt?: string;
}
export declare class UpdatePromoCodeDto {
    code?: string;
    discountPercent?: number;
    description?: string;
    active?: boolean;
    maxUses?: number | null;
    minOrderAmount?: number;
    expiresAt?: string | null;
}
export declare class SetPromoCodeActiveDto {
    active: boolean;
}
export declare class PromoCodeQueryDto {
    page?: number;
    limit?: number;
    all?: boolean;
    search?: string;
    active?: boolean;
    sortBy?: 'newest' | 'code' | 'discount' | 'usage';
}
export declare class ValidatePromoCodeDto {
    code: string;
    orderAmount?: number;
}
export declare class RedeemPromoCodeDto extends ValidatePromoCodeDto {
    orderReference?: string;
    performedBy?: string;
}
export declare class RedemptionQueryDto {
    page?: number;
    limit?: number;
}
