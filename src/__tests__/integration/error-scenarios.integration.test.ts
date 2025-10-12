/**
 * Integration тесты для обработки различных сценариев ошибок
 * Тестируют устойчивость системы к различным типам ошибок
 */

// Мокаем Next.js server для тестов API routes
jest.mock('next/server', () => ({
  NextRequest: jest.fn().mockImplementation((url) => ({
    url,
    method: 'GET',
    headers: new Map([['user-agent', 'test-agent']]),
    nextUrl: { searchParams: new URLSearchParams() },
  })),
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: () => Promise.resolve(data),
      status: init?.status || 200,
      headers: new Map(),
    })),
  },
}));

import { NextRequest } from 'next/server';
import { GET as getProduct } from '@/app/api/products/[barcode]/route';
import { GET as healthCheck } from '@/app/api/health/route';
import { ProductService } from '@/lib/services/product.service';

// Мокаем ProductService
jest.mock('@/lib/services/product.service');
const mockProductService = ProductService as jest.Mocked<typeof ProductService>;

// Мокаем console для тестов
const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

describe('Error Scenarios Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('Database Connection Errors', () => {
    it('должен обрабатывать потерю соединения с базой данных', async () => {
      // Arrange - имитируем потерю соединения
      const connectionError = new Error('Connection lost');
      connectionError.name = 'ConnectionError';
      mockProductService.findByBarcode.mockRejectedValue(connectionError);

      // Act
      const request = new NextRequest('http://localhost:3000/api/products/1234567890123');
      const params = Promise.resolve({ barcode: '1234567890123' });
      const response = await getProduct(request, { params });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INTERNAL_ERROR');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Ошибка в API поиска товара:',
        connectionError
      );
    });

    it('должен обрабатывать таймауты базы данных', async () => {
      // Arrange - имитируем таймаут
      const timeoutError = new Error('Query timeout');
      timeoutError.name = 'TimeoutError';
      mockProductService.findByBarcode.mockRejectedValue(timeoutError);

      // Act
      const request = new NextRequest('http://localhost:3000/api/products/1234567890123');
      const params = Promise.resolve({ barcode: '1234567890123' });
      const response = await getProduct(request, { params });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.message).toBe('Внутренняя ошибка сервера');
    });

    it('должен обрабатывать ошибки Prisma', async () => {
      // Arrange - различные типы Prisma ошибок
      const prismaErrors = [
        { code: 'P2002', message: 'Unique constraint failed', expectedStatus: 409, expectedCode: 'DUPLICATE_ERROR' },
        { code: 'P2025', message: 'Record not found', expectedStatus: 404, expectedCode: 'NOT_FOUND' },
        { code: 'P1001', message: 'Cannot reach database server', expectedStatus: 500, expectedCode: 'DATABASE_ERROR' },
        { code: 'P1008', message: 'Operations timed out', expectedStatus: 500, expectedCode: 'DATABASE_ERROR' },
      ];

      for (const error of prismaErrors) {
        // Arrange
        mockProductService.findByBarcode.mockRejectedValue(error);

        // Act
        const request = new NextRequest('http://localhost:3000/api/products/1234567890123');
        const params = Promise.resolve({ barcode: '1234567890123' });
        const response = await getProduct(request, { params });
        const data = await response.json();

        // Assert
        expect(response.status).toBe(error.expectedStatus);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe(error.expectedCode);

        // Очищаем моки для следующей итерации
        jest.clearAllMocks();
      }
    });
  });

  describe('Validation Error Scenarios', () => {
    it('должен обрабатывать различные типы невалидных штрихкодов', async () => {
      const invalidBarcodes = [
        { barcode: '', expectedMessage: 'Штрихкод не может быть пустым' },
        { barcode: 'A'.repeat(51), expectedMessage: 'Штрихкод слишком длинный' },
        { barcode: '123!@#456', expectedMessage: 'Штрихкод содержит недопустимые символы' },
        { barcode: '123 456 789', expectedMessage: 'Штрихкод содержит недопустимые символы' },
        { barcode: '123.456.789', expectedMessage: 'Штрихкод содержит недопустимые символы' },
      ];

      for (const { barcode, expectedMessage } of invalidBarcodes) {
        // Act
        const request = new NextRequest(`http://localhost:3000/api/products/${barcode}`);
        const params = Promise.resolve({ barcode });
        const response = await getProduct(request, { params });
        const data = await response.json();

        // Assert
        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('VALIDATION_ERROR');
        expect(data.error.details?.validationErrors?.[0]?.message).toBe(expectedMessage);

        // Проверяем, что запрос к базе данных не выполнялся
        expect(mockProductService.findByBarcode).not.toHaveBeenCalled();

        // Очищаем моки для следующей итерации
        jest.clearAllMocks();
      }
    });

    it('должен обрабатывать специальные символы в URL', async () => {
      const specialCases = [
        '%20', // пробел
        '%21', // !
        '%40', // @
        '%23', // #
      ];

      for (const encodedChar of specialCases) {
        // Act
        const request = new NextRequest(`http://localhost:3000/api/products/123${encodedChar}456`);
        const params = Promise.resolve({ barcode: `123${decodeURIComponent(encodedChar)}456` });
        const response = await getProduct(request, { params });
        const data = await response.json();

        // Assert
        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('VALIDATION_ERROR');

        jest.clearAllMocks();
      }
    });
  });

  describe('System Resource Errors', () => {
    it('должен обрабатывать нехватку памяти', async () => {
      // Arrange - имитируем ошибку нехватки памяти
      const memoryError = new Error('JavaScript heap out of memory');
      memoryError.name = 'RangeError';
      mockProductService.findByBarcode.mockRejectedValue(memoryError);

      // Act
      const request = new NextRequest('http://localhost:3000/api/products/1234567890123');
      const params = Promise.resolve({ barcode: '1234567890123' });
      const response = await getProduct(request, { params });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INTERNAL_ERROR');
    });

    it('должен обрабатывать превышение лимита запросов', async () => {
      // Arrange - имитируем множественные запросы
      const requests = Array.from({ length: 10 }, () => {
        mockProductService.findByBarcode.mockResolvedValue({
          id: 'test',
          barcode: '1234567890123',
          name: 'Test Product',
          description: 'Test',
          price: 99.99,
          quantity: 10,
          category: 'Test',
          supplier: 'Test',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        });

        const request = new NextRequest('http://localhost:3000/api/products/1234567890123');
        const params = Promise.resolve({ barcode: '1234567890123' });
        return getProduct(request, { params });
      });

      // Act
      const responses = await Promise.all(requests);

      // Assert - все запросы должны быть обработаны
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      expect(mockProductService.findByBarcode).toHaveBeenCalledTimes(10);
    });
  });

  describe('Health Check Error Scenarios', () => {
    it('должен обрабатывать различные типы ошибок health check', async () => {
      const healthErrors = [
        new Error('Database connection refused'),
        new Error('Authentication failed'),
        new Error('Service unavailable'),
        new TypeError('Cannot read property of undefined'),
      ];

      for (const error of healthErrors) {
        // Arrange
        mockProductService.healthCheck.mockRejectedValue(error);

        // Act
        const request = new NextRequest('http://localhost:3000/api/health');
        const response = await healthCheck(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(503);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('HEALTH_CHECK_ERROR');
        expect(data.data.status).toBe('error');
        expect(data.data.database).toBe('disconnected');

        jest.clearAllMocks();
      }
    });

    it('должен обрабатывать частичные сбои системы', async () => {
      // Arrange - база данных недоступна, но сервис работает
      mockProductService.healthCheck.mockResolvedValue(false);

      // Act
      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await healthCheck(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(503);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('DATABASE_CONNECTION_ERROR');
      expect(data.data.status).toBe('error');
      expect(data.data.database).toBe('disconnected');
      expect(data.data.timestamp).toBeDefined();
      expect(data.data.version).toBeDefined();
    });
  });

  describe('Concurrent Error Scenarios', () => {
    it('должен обрабатывать одновременные ошибки и успешные запросы', async () => {
      // Arrange - настраиваем смешанные результаты
      const mockProduct = {
        id: 'test',
        barcode: '1234567890123',
        name: 'Test Product',
        description: 'Test',
        price: 99.99,
        quantity: 10,
        category: 'Test',
        supplier: 'Test',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      mockProductService.findByBarcode
        .mockRejectedValueOnce(new Error('Database error'))
        .mockResolvedValueOnce(mockProduct)
        .mockResolvedValueOnce(null)
        .mockRejectedValueOnce(new Error('Another error'))
        .mockResolvedValueOnce(mockProduct);

      // Act - выполняем 5 одновременных запросов
      const requests = [
        { barcode: '1111111111111' }, // error
        { barcode: '2222222222222' }, // success
        { barcode: '3333333333333' }, // not found
        { barcode: '4444444444444' }, // error
        { barcode: '5555555555555' }, // success
      ].map(({ barcode }) => {
        const request = new NextRequest(`http://localhost:3000/api/products/${barcode}`);
        const params = Promise.resolve({ barcode });
        return getProduct(request, { params });
      });

      const responses = await Promise.all(requests);
      const dataResults = await Promise.all(responses.map(r => r.json()));

      // Assert
      expect(responses[0].status).toBe(500); // error
      expect(responses[1].status).toBe(200); // success
      expect(responses[2].status).toBe(404); // not found
      expect(responses[3].status).toBe(500); // error
      expect(responses[4].status).toBe(200); // success

      expect(dataResults[0].success).toBe(false);
      expect(dataResults[1].success).toBe(true);
      expect(dataResults[2].success).toBe(false);
      expect(dataResults[3].success).toBe(false);
      expect(dataResults[4].success).toBe(true);
    });
  });

  describe('Recovery and Resilience', () => {
    it('должен восстанавливаться после временных сбоев', async () => {
      // Arrange - временная ошибка, затем восстановление
      const tempError = new Error('Temporary service unavailable');
      const mockProduct = {
        id: 'recovery-test',
        barcode: '1234567890123',
        name: 'Recovery Test Product',
        description: 'Product for recovery testing',
        price: 99.99,
        quantity: 10,
        category: 'Test',
        supplier: 'Test',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      mockProductService.findByBarcode
        .mockRejectedValueOnce(tempError)
        .mockRejectedValueOnce(tempError)
        .mockResolvedValueOnce(mockProduct);

      // Act - три последовательных запроса
      const requests = [1, 2, 3].map(async () => {
        const request = new NextRequest('http://localhost:3000/api/products/1234567890123');
        const params = Promise.resolve({ barcode: '1234567890123' });
        return await getProduct(request, { params });
      });

      const responses = await Promise.all(requests);
      const dataResults = await Promise.all(responses.map(r => r.json()));

      // Assert
      expect(responses[0].status).toBe(500); // первая ошибка
      expect(responses[1].status).toBe(500); // вторая ошибка
      expect(responses[2].status).toBe(200); // восстановление

      expect(dataResults[0].success).toBe(false);
      expect(dataResults[1].success).toBe(false);
      expect(dataResults[2].success).toBe(true);
      expect(dataResults[2].data).toEqual(mockProduct);
    });

    it('должен логировать все ошибки для мониторинга', async () => {
      // Arrange
      const errors = [
        new Error('Database connection failed'),
        new Error('Query timeout'),
        new Error('Invalid response format'),
      ];

      for (const error of errors) {
        mockProductService.findByBarcode.mockRejectedValue(error);

        // Act
        const request = new NextRequest('http://localhost:3000/api/products/1234567890123');
        const params = Promise.resolve({ barcode: '1234567890123' });
        await getProduct(request, { params });

        // Assert - проверяем логирование ошибки
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Ошибка в API поиска товара:',
          error
        );

        jest.clearAllMocks();
      }
    });
  });
});