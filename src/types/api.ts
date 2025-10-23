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
