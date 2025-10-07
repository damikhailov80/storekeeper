import { Decimal } from '@prisma/client/runtime/library';

/**
 * Product model type based on Prisma schema
 */
export interface Product {
  id: string;
  barcode: string;
  name: string;
  description: string | null;
  price: Decimal;
  quantity: number;
  category: string | null;
  supplier: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Product data for client-side usage (with serialized price)
 */
export interface ProductData {
  id: string;
  barcode: string;
  name: string;
  description: string | null;
  price: number;
  quantity: number;
  category: string | null;
  supplier: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Input type for creating a new product
 */
export interface CreateProductInput {
  barcode: string;
  name: string;
  description?: string | null;
  price: number;
  quantity?: number;
  category?: string | null;
  supplier?: string | null;
}

/**
 * Input type for updating an existing product
 */
export interface UpdateProductInput {
  barcode?: string;
  name?: string;
  description?: string | null;
  price?: number;
  quantity?: number;
  category?: string | null;
  supplier?: string | null;
}

/**
 * Product search filters
 */
export interface ProductSearchFilters {
  category?: string;
  supplier?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
}