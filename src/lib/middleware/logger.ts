import { NextRequest } from 'next/server';

export interface RequestLog {
  method: string;
  url: string;
  timestamp: string;
  userAgent?: string;
  ip?: string;
  duration?: number;
}

export class RequestLogger {
  static logRequest(request: NextRequest): RequestLog {
    const log: RequestLog = {
      method: request.method,
      url: request.url,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent') || undefined,
      ip: this.getClientIP(request),
    };

    return log;
  }

  static logResponse(requestLog: RequestLog, status: number, startTime: number): void {
    const duration = Date.now() - startTime;
  }

  private static getClientIP(request: NextRequest): string {
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

    return 'unknown';
  }

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
        throw error;
      }
    };
  }
}