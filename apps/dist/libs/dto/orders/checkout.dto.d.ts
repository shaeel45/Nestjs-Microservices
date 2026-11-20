import { CartItemDto } from './cart.dto.js';
import { ShippingAddressDto } from './order.dto.js';
export declare class CheckoutDto {
    cartToken: string;
    customerId?: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    shippingAddress: ShippingAddressDto;
    shippingMethod?: string;
    paymentMethod?: string;
    promoCode?: string;
    notes?: string;
    tax?: number;
    shippingFee?: number;
    items?: CartItemDto[];
}
