/**
 * Type tests to ensure all types are working correctly
 */

import { Decimal } from '@prisma/client/runtime/library';
import {
  Product,
  ProductData,
  ApiResponse,
  AppError,
  ErrorType,
  validateBarcode,
  validatePrice,
  BARCODE_PATTERNS,
} from '../index';

describe('Type System Tests', () => {
  describe('Product Types', () => {
    it('should create valid Product type', () => {
      const product: Product = {
        id: 'test-id',
        barcode: '1234567890123',
        name: 'Test Product',
        description: 'Test Description',
        price: new Decimal(99.99),
        quantity: 10,
        category: 'Electronics',
        supplier: 'Test Supplier',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(product.id).toBe('test-id');
      expect(product.barcode).toBe('1234567890123');
      expect(product.name).toBe('Test Product');
    });

    it('should create valid ProductData type', () => {
      const productData: ProductData = {
        id: 'test-id',
        barcode: '1234567890123',
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        quantity: 10,
        category: 'Electronics',
        supplier: 'Test Supplier',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      expect(productData.price).toBe(99.99);
      expect(typeof productData.createdAt).toBe('string');
    });
  });

  describe('API Response Types', () => {
    it('should create valid success response', () => {
      const response: ApiResponse<string> = {
        success: true,
        data: 'test data',
        timestamp: '2024-01-01T00:00:00Z',
      };

      expect(response.success).toBe(true);
      expect(response.data).toBe('test data');
    });

    it('should create valid error response', () => {
      const response: ApiResponse<string> = {
        success: false,
        error: {
          code: 'TEST_ERROR',
          message: 'Test error message',
        },
        timestamp: '2024-01-01T00:00:00Z',
      };

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('TEST_ERROR');
    });
  });

  describe('Validation Functions', () => {
    it('should validate correct barcode', () => {
      const result = validateBarcode('1234567890123');
      expect(result.isValid).toBe(true);
      expect(result.format).toBe('EAN13');
    });

    it('should reject invalid barcode', () => {
      const result = validateBarcode('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should validate correct price', () => {
      const result = validatePrice(99.99);
      expect(result.isValid).toBe(true);
      expect(result.value).toBe(99.99);
    });

    it('should reject negative price', () => {
      const result = validatePrice(-10);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Error Types', () => {
    it('should create AppError correctly', () => {
      const error = new AppError(
        ErrorType.PRODUCT_NOT_FOUND,
        'Product not found',
        'PRODUCT_NOT_FOUND'
      );

      expect(error.type).toBe(ErrorType.PRODUCT_NOT_FOUND);
      expect(error.message).toBe('Product not found');
      expect(error.code).toBe('PRODUCT_NOT_FOUND');
    });
  });

  describe('Constants', () => {
    it('should have correct barcode patterns', () => {
      expect(BARCODE_PATTERNS.EAN13).toEqual(/^\d{13}$/);
      expect(BARCODE_PATTERNS.EAN8).toEqual(/^\d{8}$/);
    });
  });
});

