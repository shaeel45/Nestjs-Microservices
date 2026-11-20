export declare class CartItemDto {
    productId?: string;
    name: string;
    price: number;
    quantity: number;
    size?: string;
    color?: string;
    image?: string;
}
export declare class CartTokenDto {
    cartToken: string;
}
export declare class CartLookupDto extends CartTokenDto {
    customerId?: string;
    customerEmail?: string;
}
export declare class AddCartItemDto extends CartTokenDto {
    customerId?: string;
    customerEmail?: string;
    item: CartItemDto;
}
export declare class UpdateCartItemDto extends CartTokenDto {
    quantity?: number;
    delta?: number;
}
export declare class RemoveCartItemDto extends CartTokenDto {
}
export declare class ReplaceCartDto extends CartTokenDto {
    customerId?: string;
    customerEmail?: string;
    items: CartItemDto[];
}
export declare class ApplyCartPromoDto extends CartTokenDto {
    code: string;
}
