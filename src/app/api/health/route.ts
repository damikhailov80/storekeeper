import { NextRequest, NextResponse } from 'next/server';
import { ProductService } from '@/lib/services/product.service';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/api-response';
import { RequestLogger } from '@/lib/middleware/logger';

/**
 * GET /api/health
 * Проверка состояния системы и подключения к базе данных
 */
async function healthCheckHandler(request: NextRequest) {
  try {
    // Проверка подключения к базе данных
    const isDatabaseConnected = await ProductService.healthCheck();

    const healthStatus = {
      status: isDatabaseConnected ? 'ok' : 'error',
      database: isDatabaseConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
    };

    if (isDatabaseConnected) {
      return createSuccessResponse(healthStatus);
    } else {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_CONNECTION_ERROR',
            message: 'Нет подключения к базе данных',
          },
          data: healthStatus,
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }
  } catch (error: unknown) {
    console.error('Ошибка в health check:', error);
    
    const healthStatus = {
      status: 'error',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
    };

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'HEALTH_CHECK_ERROR',
          message: 'Ошибка при проверке состояния системы',
        },
        data: healthStatus,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}

// Экспортируем обернутый в логирование handler
export const GET = RequestLogger.withLogging(healthCheckHandler);