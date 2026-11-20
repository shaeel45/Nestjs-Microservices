export declare const InventoryTransactionType: {
    readonly RESTOCK: "RESTOCK";
    readonly SALE: "SALE";
    readonly RETURN: "RETURN";
    readonly DAMAGE: "DAMAGE";
    readonly ADJUSTMENT: "ADJUSTMENT";
};
export type InventoryTransactionType = (typeof InventoryTransactionType)[keyof typeof InventoryTransactionType];
export declare class CreateInventoryDto {
    productId: number;
    quantity?: number;
    reservedQuantity?: number;
    warehouse?: string;
    lowStockThreshold?: number;
}
export declare class UpdateInventoryDto {
    warehouse?: string;
    lowStockThreshold?: number;
}
export declare class InventoryQueryDto {
    page?: number;
    limit?: number;
    all?: boolean;
    productId?: number;
    warehouse?: string;
    lowStock?: boolean;
    outOfStock?: boolean;
}
export declare class AdjustStockDto {
    productId?: number;
    inventoryItemId?: number;
    changeAmount?: number;
    change?: number;
    type?: InventoryTransactionType;
    performedBy?: string;
    reason?: string;
    referenceId?: string;
}
export declare class ReserveStockDto {
    productId: number;
    quantity: number;
    referenceId?: string;
}
export declare class ReleaseStockDto {
    productId: number;
    quantity: number;
    referenceId?: string;
}
export declare class ConsumeStockDto {
    productId: number;
    quantity: number;
    referenceId?: string;
    performedBy?: string;
    reason?: string;
}
export declare class TransactionQueryDto {
    page?: number;
    limit?: number;
    type?: InventoryTransactionType;
}
