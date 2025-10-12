import { Decimal } from '@prisma/client/runtime/library';

/**
 * Product model type based on Prisma schema (ean_data table)
 */
export interface Product {
  ean: string;
  name: string | null;
  quantity: number | null;
  min_quantity: number | null;
  location: string | null;
  category: string | null;
  unit: string | null;
  price: Decimal | null;
  created_at: Date | null;
  updated_at: Date | null;
}

/**
 * Product data for client-side usage (with serialized price)
 */
export interface ProductData {
  ean: string;
  name: string | null;
  quantity: number;
  min_quantity: number;
  location: string | null;
  category: string | null;
  unit: string | null;
  price: number;
  created_at: string;
  updated_at: string;
}

/**
 * Input type for creating a new product
 */
export interface CreateProductInput {
  ean: string;
  name: string;
  price: number;
  quantity?: number;
  min_quantity?: number;
  location?: string | null;
  category?: string | null;
  unit?: string | null;
}

/**
 * Input type for updating an existing product
 */
export interface UpdateProductInput {
  ean?: string;
  name?: string;
  price?: number;
  quantity?: number;
  min_quantity?: number;
  location?: string | null;
  category?: string | null;
  unit?: string | null;
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