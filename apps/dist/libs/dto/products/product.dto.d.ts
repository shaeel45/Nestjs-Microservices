export declare class CreateProductDto {
    name: string;
    description?: string;
    price: number;
    original_price?: number;
    stock?: number;
    colors?: string[] | string;
    sizes?: string[] | string;
    images?: string[];
    details?: string[];
    rating?: any;
    review?: any;
    imageURL?: string;
    category?: string;
    isNew?: boolean;
    isTrending?: boolean;
    isFeatured?: boolean;
}
export declare class UpdateProductDto {
    name?: string;
    description?: string;
    price?: number;
    original_price?: number;
    stock?: number;
    colors?: string[] | string;
    sizes?: string[] | string;
    images?: string[];
    details?: string[];
    rating?: any;
    review?: any;
    imageURL?: string;
    category?: string;
    isNew?: boolean;
    isTrending?: boolean;
    isFeatured?: boolean;
}
export declare class ProductPaginationQueryDto {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    sortBy?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean | string;
    all?: boolean | string;
}
