import { NextRequest } from 'next/server';
import { GET } from '../health/route';
import { ProductService } from '@/lib/services/product.service';

// Мокаем ProductService
jest.mock('@/lib/services/product.service');
const mockProductService = ProductService as jest.Mocked<typeof ProductService>;

// Мокаем console.log для тестов логирования
const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

describe('/api/health', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('должен вернуть статус OK когда база данных подключена', async () => {
    // Arrange
    mockProductService.healthCheck.mockResolvedValue(true);
    const request = new NextRequest('http://localhost:3000/api/health');

    // Act
    const response = await GET(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.status).toBe('ok');
    expect(data.data.database).toBe('connected');
    expect(data.data.timestamp).toBeDefined();
    expect(data.data.version).toBeDefined();
  });

  it('должен вернуть статус ERROR когда база данных не подключена', async () => {
    // Arrange
    mockProductService.healthCheck.mockResolvedValue(false);
    const request = new NextRequest('http://localhost:3000/api/health');

    // Act
    const response = await GET(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(503);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('DATABASE_CONNECTION_ERROR');
    expect(data.error.message).toBe('Нет подключения к базе данных');
    expect(data.data.status).toBe('error');
    expect(data.data.database).toBe('disconnected');
  });

  it('должен обработать исключение при проверке здоровья', async () => {
    // Arrange
    const error = new Error('Database connection failed');
    mockProductService.healthCheck.mockRejectedValue(error);
    const request = new NextRequest('http://localhost:3000/api/health');

    // Act
    const response = await GET(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(503);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('HEALTH_CHECK_ERROR');
    expect(data.error.message).toBe('Ошибка при проверке состояния системы');
    expect(data.data.status).toBe('error');
    expect(data.data.database).toBe('disconnected');
  });

  it('должен включать версию приложения в ответ', async () => {
    // Arrange
    const originalVersion = process.env.npm_package_version;
    process.env.npm_package_version = '2.0.0';
    mockProductService.healthCheck.mockResolvedValue(true);
    const request = new NextRequest('http://localhost:3000/api/health');

    // Act
    const response = await GET(request);
    const data = await response.json();

    // Assert
    expect(data.data.version).toBe('2.0.0');

    // Cleanup
    process.env.npm_package_version = originalVersion;
  });

  it('должен использовать версию по умолчанию если npm_package_version не установлена', async () => {
    // Arrange
    const originalVersion = process.env.npm_package_version;
    delete process.env.npm_package_version;
    mockProductService.healthCheck.mockResolvedValue(true);
    const request = new NextRequest('http://localhost:3000/api/health');

    // Act
    const response = await GET(request);
    const data = await response.json();

    // Assert
    expect(data.data.version).toBe('1.0.0');

    // Cleanup
    process.env.npm_package_version = originalVersion;
  });

  it('должен логировать запросы', async () => {
    // Arrange
    mockProductService.healthCheck.mockResolvedValue(true);
    const request = new NextRequest('http://localhost:3000/api/health');

    // Act
    await GET(request);

    // Assert
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/\[.*\] GET http:\/\/localhost:3000\/api\/health - IP: .*/)
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/\[.*\] GET http:\/\/localhost:3000\/api\/health - 200 - \d+ms/)
    );
  });
});