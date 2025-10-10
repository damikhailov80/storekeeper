import { NextRequest } from 'next/server';
import { RequestLogger } from '../logger';

// Мокаем console.log и console.error
const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

describe('RequestLogger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('logRequest', () => {
    it('должен логировать базовую информацию о запросе', () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'GET',
        headers: {
          'user-agent': 'Mozilla/5.0 Test Browser',
        },
      });

      // Act
      const log = RequestLogger.logRequest(request);

      // Assert
      expect(log.method).toBe('GET');
      expect(log.url).toBe('http://localhost:3000/api/test');
      expect(log.userAgent).toBe('Mozilla/5.0 Test Browser');
      expect(log.timestamp).toBeDefined();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[.*\] GET http:\/\/localhost:3000\/api\/test - IP: .*/)
      );
    });

    it('должен обрабатывать запросы без user-agent', () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/test');

      // Act
      const log = RequestLogger.logRequest(request);

      // Assert
      expect(log.userAgent).toBeUndefined();
    });

    it('должен извлекать IP из x-forwarded-for заголовка', () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'x-forwarded-for': '192.168.1.1, 10.0.0.1',
        },
      });

      // Act
      const log = RequestLogger.logRequest(request);

      // Assert
      expect(log.ip).toBe('192.168.1.1');
    });

    it('должен извлекать IP из x-real-ip заголовка', () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'x-real-ip': '192.168.1.2',
        },
      });

      // Act
      const log = RequestLogger.logRequest(request);

      // Assert
      expect(log.ip).toBe('192.168.1.2');
    });
  });

  describe('logResponse', () => {
    it('должен логировать ответ с временем выполнения', () => {
      // Arrange
      const requestLog = {
        method: 'GET',
        url: 'http://localhost:3000/api/test',
        timestamp: new Date().toISOString(),
      };
      const startTime = Date.now() - 100; // 100ms назад

      // Act
      RequestLogger.logResponse(requestLog, 200, startTime);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[.*\] GET http:\/\/localhost:3000\/api\/test - 200 - \d+ms/)
      );
    });
  });

  describe('withLogging', () => {
    it('должен обернуть handler с логированием для успешного запроса', async () => {
      // Arrange
      const mockHandler = jest.fn().mockResolvedValue(new Response('OK', { status: 200 }));
      const wrappedHandler = RequestLogger.withLogging(mockHandler);
      const request = new NextRequest('http://localhost:3000/api/test');

      // Act
      const response = await wrappedHandler(request);

      // Assert
      expect(mockHandler).toHaveBeenCalledWith(request);
      expect(response.status).toBe(200);
      expect(consoleSpy).toHaveBeenCalledTimes(2); // request log + response log
    });

    it('должен обернуть handler с логированием для ошибки', async () => {
      // Arrange
      const error = new Error('Test error');
      const mockHandler = jest.fn().mockRejectedValue(error);
      const wrappedHandler = RequestLogger.withLogging(mockHandler);
      const request = new NextRequest('http://localhost:3000/api/test');

      // Act & Assert
      await expect(wrappedHandler(request)).rejects.toThrow('Test error');
      expect(mockHandler).toHaveBeenCalledWith(request);
      expect(consoleSpy).toHaveBeenCalledTimes(2); // request log + error response log
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[.*\] Error in GET http:\/\/localhost:3000\/api\/test:/),
        error
      );
    });

    it('должен передавать дополнительные параметры в handler', async () => {
      // Arrange
      const mockHandler = jest.fn().mockResolvedValue(new Response('OK', { status: 200 }));
      const wrappedHandler = RequestLogger.withLogging(mockHandler);
      const request = new NextRequest('http://localhost:3000/api/test');
      const params = { id: '123' };

      // Act
      await wrappedHandler(request, params);

      // Assert
      expect(mockHandler).toHaveBeenCalledWith(request, params);
    });
  });
});