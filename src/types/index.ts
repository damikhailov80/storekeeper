// Base types for the Storekeeper application
export interface Product {
    id: string;
    barcode: string;
    name: string;
    description: string | null;
    price: number;
    quantity: number;
    category: string | null;
    supplier: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

export interface ErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
    };
    timestamp: string;
}