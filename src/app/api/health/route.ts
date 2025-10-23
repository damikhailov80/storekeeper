import { NextResponse } from 'next/server';
import { ProductService } from '@/lib/services/product.service';
import { createSuccessResponse } from '@/lib/utils/api-response';
import { RequestLogger } from '@/lib/middleware/logger';

async function healthCheckHandler() {
  try {
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
  } catch {
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

export const GET = RequestLogger.withLogging(healthCheckHandler);