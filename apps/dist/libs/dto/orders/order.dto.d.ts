export declare const ORDER_STATUSES: readonly ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
export type OrderStatusValue = (typeof ORDER_STATUSES)[number];
export declare const ORDER_STATUS_TRANSITIONS: Record<OrderStatusValue, OrderStatusValue[]>;
export declare function isValidStatusTransition(from: OrderStatusValue, to: OrderStatusValue): boolean;
export declare function normalizeOrderStatus(value: unknown): string;
export declare class OrderItemDto {
    productId?: string;
    name: string;
    price: number;
    quantity: number;
    size?: string;
    color?: string;
    image?: string;
}
export declare class ShippingAddressDto {
    fullName: string;
    email?: string;
    phone?: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
}
export declare class CreateOrderDto {
    customerId?: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    shippingAddress: ShippingAddressDto;
    shippingMethod?: string;
    paymentMethod?: string;
    promoCode?: string;
    notes?: string;
    status?: 'PENDING' | 'PROCESSING';
    items: OrderItemDto[];
    discount?: number;
    tax?: number;
    shippingFee?: number;
}
export declare class UpdateOrderStatusDto {
    status: OrderStatusValue;
    note?: string;
    performedBy?: string;
}
export declare class OrderQueryDto {
    page?: number;
    limit?: number;
    all?: boolean;
    search?: string;
    status?: OrderStatusValue;
    sortBy?: 'newest' | 'oldest' | 'total_desc' | 'total_asc';
    from?: string;
    to?: string;
}
export declare class MyOrdersQueryDto {
    customerId?: string;
    email?: string;
    limit?: number;
}
