/**
 * Integration тесты для API интеграции с базой данных
 * Тестируют полный цикл работы с API и базой данных
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

// Мокаем ProductService для контроля поведения базы данных
jest.mock('@/lib/services/product.service');
const mockProductService = ProductService as jest.Mocked<typeof ProductService>;

// Мокаем console для тестов логирования
const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

describe('API Database Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('Product API Integration', () => {
    it('должен выполнить полный цикл поиска товара', async () => {
      // Arrange - подготавливаем тестовые данные
      const mockProduct = {
        id: 'test-id-1',
        barcode: '1234567890123',
        name: 'Интеграционный тест товар',
        description: 'Товар для интеграционного тестирования',
        price: 199.99,
        quantity: 25,
        category: 'Тестовая категория',
        supplier: 'Тестовый поставщик',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      mockProductService.findByBarcode.mockResolvedValue(mockProduct);

      // Act - выполняем запрос к API
      const request = new NextRequest('http://localhost:3000/api/products/1234567890123');
      const params = Promise.resolve({ barcode: '1234567890123' });
      
      const response = await getProduct(request, { params });
      const data = await response.json();

      // Assert - проверяем результат
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockProduct);
      expect(mockProductService.findByBarcode).toHaveBeenCalledWith('1234567890123');
      
      // Проверяем логирование
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[.*\] GET http:\/\/localhost:3000\/api\/products\/1234567890123 - IP: .*/)
      );
    });

    it('должен обрабатывать случай когда товар не найден в базе данных', async () => {
      // Arrange
      mockProductService.findByBarcode.mockResolvedValue(null);

      // Act
      const request = new NextRequest('http://localhost:3000/api/products/9999999999999');
      const params = Promise.resolve({ barcode: '9999999999999' });
      
      const response = await getProduct(request, { params });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('PRODUCT_NOT_FOUND');
      expect(data.error.message).toBe('Товар с указанным штрихкодом не найден');
      expect(mockProductService.findByBarcode).toHaveBeenCalledWith('9999999999999');
    });

    it('должен обрабатывать ошибки базы данных', async () => {
      // Arrange - имитируем ошибку базы данных
      const dbError = new Error('Ошибка базы данных при поиске товара');
      mockProductService.findByBarcode.mockRejectedValue(dbError);

      // Act
      const request = new NextRequest('http://localhost:3000/api/products/1234567890123');
      const params = Promise.resolve({ barcode: '1234567890123' });
      
      const response = await getProduct(request, { params });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INTERNAL_ERROR');
      expect(data.error.message).toBe('Внутренняя ошибка сервера');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Ошибка в API поиска товара:',
        dbError
      );
    });

    it('должен обрабатывать Prisma ошибки базы данных', async () => {
      // Arrange - имитируем Prisma ошибку P2002 (duplicate)
      const prismaError = { code: 'P2002', message: 'Unique constraint failed' };
      mockProductService.findByBarcode.mockRejectedValue(prismaError);

      // Act
      const request = new NextRequest('http://localhost:3000/api/products/1234567890123');
      const params = Promise.resolve({ barcode: '1234567890123' });
      
      const response = await getProduct(request, { params });
      const data = await response.json();

      // Assert - P2002 returns 409 with DUPLICATE_ERROR
      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('DUPLICATE_ERROR');
    });

    it('должен валидировать штрихкод перед запросом к базе данных', async () => {
      // Act - отправляем невалидный штрихкод
      const request = new NextRequest('http://localhost:3000/api/products/invalid!barcode');
      const params = Promise.resolve({ barcode: 'invalid!barcode' });
      
      const response = await getProduct(request, { params });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      
      // Проверяем, что запрос к базе данных не выполнялся
      expect(mockProductService.findByBarcode).not.toHaveBeenCalled();
    });

    it('должен обрабатывать различные форматы штрихкодов', async () => {
      // Arrange
      const testCases = [
        '1234567890123', // EAN-13
        '12345678901',   // UPC-A
        'ABC123DEF456',  // Alphanumeric
        '123-456-789',   // With dashes
      ];

      const mockProduct = {
        id: 'test-id',
        barcode: '',
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        quantity: 10,
        category: 'Test',
        supplier: 'Test Supplier',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      for (const barcode of testCases) {
        // Arrange
        const productWithBarcode = { ...mockProduct, barcode };
        mockProductService.findByBarcode.mockResolvedValue(productWithBarcode);

        // Act
        const request = new NextRequest(`http://localhost:3000/api/products/${barcode}`);
        const params = Promise.resolve({ barcode });
        
        const response = await getProduct(request, { params });
        const data = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.barcode).toBe(barcode);
        expect(mockProductService.findByBarcode).toHaveBeenCalledWith(barcode);

        // Очищаем моки для следующей итерации
        jest.clearAllMocks();
      }
    });
  });

  describe('Health Check Integration', () => {
    it('должен выполнить полную проверку состояния системы', async () => {
      // Arrange
      mockProductService.healthCheck.mockResolvedValue(true);
      const originalVersion = process.env.npm_package_version;
      process.env.npm_package_version = '1.2.3';

      // Act
      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await healthCheck(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('ok');
      expect(data.data.database).toBe('connected');
      expect(data.data.version).toBe('1.2.3');
      expect(data.data.timestamp).toBeDefined();
      expect(mockProductService.healthCheck).toHaveBeenCalledTimes(1);

      // Cleanup
      process.env.npm_package_version = originalVersion;
    });

    it('должен обрабатывать недоступность базы данных', async () => {
      // Arrange
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
    });

    it('должен обрабатывать исключения при проверке здоровья', async () => {
      // Arrange
      const healthError = new Error('Health check failed');
      mockProductService.healthCheck.mockRejectedValue(healthError);

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
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Ошибка в health check:',
        healthError
      );
    });
  });

  describe('API Error Handling Integration', () => {
    it('должен обрабатывать последовательные ошибки и восстановление', async () => {
      // Arrange - первый запрос с ошибкой, второй успешный
      const dbError = new Error('Temporary database error');
      const mockProduct = {
        id: 'test-id',
        barcode: '1234567890123',
        name: 'Recovery Test Product',
        description: 'Product for recovery testing',
        price: 149.99,
        quantity: 5,
        category: 'Test',
        supplier: 'Test',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      mockProductService.findByBarcode
        .mockRejectedValueOnce(dbError)
        .mockResolvedValueOnce(mockProduct);

      // Act - первый запрос (ошибка)
      const request1 = new NextRequest('http://localhost:3000/api/products/1234567890123');
      const params1 = Promise.resolve({ barcode: '1234567890123' });
      const response1 = await getProduct(request1, { params: params1 });
      const data1 = await response1.json();

      // Assert - первый запрос
      expect(response1.status).toBe(500);
      expect(data1.success).toBe(false);

      // Act - второй запрос (успех)
      const request2 = new NextRequest('http://localhost:3000/api/products/1234567890123');
      const params2 = Promise.resolve({ barcode: '1234567890123' });
      const response2 = await getProduct(request2, { params: params2 });
      const data2 = await response2.json();

      // Assert - второй запрос
      expect(response2.status).toBe(200);
      expect(data2.success).toBe(true);
      expect(data2.data).toEqual(mockProduct);
      expect(mockProductService.findByBarcode).toHaveBeenCalledTimes(2);
    });

    it('должен логировать все запросы и ответы', async () => {
      // Arrange
      mockProductService.findByBarcode.mockResolvedValue(null);

      // Act
      const request = new NextRequest('http://localhost:3000/api/products/1234567890123');
      const params = Promise.resolve({ barcode: '1234567890123' });
      await getProduct(request, { params });

      // Assert - проверяем логирование запроса и ответа
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[.*\] GET http:\/\/localhost:3000\/api\/products\/1234567890123 - IP: .*/)
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[.*\] GET http:\/\/localhost:3000\/api\/products\/1234567890123 - 404 - \d+ms/)
      );
    });
  });

  describe('Performance Integration Tests', () => {
    it('должен обрабатывать множественные одновременные запросы', async () => {
      // Arrange
      const mockProduct = {
        id: 'concurrent-test',
        barcode: '1111111111111',
        name: 'Concurrent Test Product',
        description: 'Product for concurrent testing',
        price: 99.99,
        quantity: 100,
        category: 'Test',
        supplier: 'Test',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      mockProductService.findByBarcode.mockResolvedValue(mockProduct);

      // Act - выполняем 5 одновременных запросов
      const requests = Array.from({ length: 5 }, () => {
        const request = new NextRequest(`http://localhost:3000/api/products/1111111111111`);
        const params = Promise.resolve({ barcode: '1111111111111' });
        return getProduct(request, { params });
      });

      const responses = await Promise.all(requests);
      const dataPromises = responses.map(response => response.json());
      const dataResults = await Promise.all(dataPromises);

      // Assert - все запросы должны быть успешными
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      dataResults.forEach(data => {
        expect(data.success).toBe(true);
        expect(data.data).toEqual(mockProduct);
      });

      // Проверяем, что сервис был вызван для каждого запроса
      expect(mockProductService.findByBarcode).toHaveBeenCalledTimes(5);
    });

    it('должен обрабатывать запросы с таймаутом', async () => {
      // Arrange - имитируем медленный ответ базы данных
      mockProductService.findByBarcode.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(null), 100))
      );

      // Act
      const startTime = Date.now();
      const request = new NextRequest('http://localhost:3000/api/products/1234567890123');
      const params = Promise.resolve({ barcode: '1234567890123' });
      const response = await getProduct(request, { params });
      const endTime = Date.now();

      // Assert
      expect(response.status).toBe(404);
      expect(endTime - startTime).toBeGreaterThanOrEqual(100);
      expect(mockProductService.findByBarcode).toHaveBeenCalledWith('1234567890123');
    });
  });
});