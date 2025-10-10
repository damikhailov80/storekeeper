import { NextRequest } from 'next/server';

export interface RequestLog {
  method: string;
  url: string;
  timestamp: string;
  userAgent?: string;
  ip?: string;
  duration?: number;
}

/**
 * Middleware для логирования HTTP запросов
 */
export class RequestLogger {
  /**
   * Логирует входящий запрос
   */
  static logRequest(request: NextRequest): RequestLog {
    const log: RequestLog = {
      method: request.method,
      url: request.url,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent') || undefined,
      ip: this.getClientIP(request),
    };

    console.log(`[${log.timestamp}] ${log.method} ${log.url} - IP: ${log.ip}`);
    return log;
  }

  /**
   * Логирует ответ с временем выполнения
   */
  static logResponse(requestLog: RequestLog, status: number, startTime: number): void {
    const duration = Date.now() - startTime;
    console.log(
      `[${new Date().toISOString()}] ${requestLog.method} ${requestLog.url} - ${status} - ${duration}ms`
    );
  }

  /**
   * Получает IP адрес клиента
   */
  private static getClientIP(request: NextRequest): string {
    // Проверяем различные заголовки для получения реального IP
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const cfConnectingIP = request.headers.get('cf-connecting-ip');

    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    if (realIP) {
      return realIP;
    }
    if (cfConnectingIP) {
      return cfConnectingIP;
    }

    // Fallback для локальной разработки
    return 'unknown';
  }

  /**
   * Создает обертку для API route с логированием
   */
  static withLogging<T extends unknown[]>(
    handler: (request: NextRequest, ...args: T) => Promise<Response>
  ) {
    return async (request: NextRequest, ...args: T): Promise<Response> => {
      const startTime = Date.now();
      const requestLog = this.logRequest(request);

      try {
        const response = await handler(request, ...args);
        this.logResponse(requestLog, response.status, startTime);
        return response;
      } catch (error) {
        this.logResponse(requestLog, 500, startTime);
        console.error(`[${new Date().toISOString()}] Error in ${requestLog.method} ${requestLog.url}:`, error);
        throw error;
      }
    };
  }
}