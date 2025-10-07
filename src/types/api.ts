import { ProductData } from './product';

/**
 * Base API response structure
 */
export interface BaseApiResponse {
  success: boolean;
  timestamp: string;
}

/**
 * Successful API response
 */
export interface SuccessApiResponse<T = unknown> extends BaseApiResponse {
  success: true;
  data: T;
}

/**
 * Error API response
 */
export interface ErrorApiResponse extends BaseApiResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Union type for all API responses
 */
export type ApiResponse<T = unknown> = SuccessApiResponse<T> | ErrorApiResponse;

/**
 * Product search API response
 */
export interface ProductSearchResponse extends BaseApiResponse {
  success: boolean;
  data?: ProductData;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Health check API response
 */
export interface HealthCheckResponse extends BaseApiResponse {
  success: true;
  data: {
    status: 'ok' | 'error';
    database: 'connected' | 'disconnected';
    uptime: number;
    version: string;
  };
}

/**
 * API error codes
 */
export enum ApiErrorCode {
  // General errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  INVALID_REQUEST = 'INVALID_REQUEST',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  
  // Product-specific errors
  PRODUCT_NOT_FOUND = 'PRODUCT_NOT_FOUND',
  INVALID_BARCODE = 'INVALID_BARCODE',
  DUPLICATE_BARCODE = 'DUPLICATE_BARCODE',
  
  // Database errors
  DATABASE_CONNECTION_ERROR = 'DATABASE_CONNECTION_ERROR',
  DATABASE_QUERY_ERROR = 'DATABASE_QUERY_ERROR',
}

/**
 * HTTP status codes
 */
export enum HttpStatusCode {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
}