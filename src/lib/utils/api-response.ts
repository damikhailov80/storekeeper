import { NextResponse } from 'next/server';
import { ApiResponse, ApiError } from '@/types/api';

/**
 * Создать успешный API ответ
 */
export function createSuccessResponse<T>(
  data: T,
  status: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

/**
 * Создать ответ с ошибкой
 */
export function createErrorResponse(
  code: string,
  message: string,
  details?: any,
  status: number = 400
): NextResponse<ApiResponse<null>> {
  const error: ApiError = {
    code,
    message,
    ...(details && { details }),
  };

  return NextResponse.json(
    {
      success: false,
      error,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

/**
 * Обработать ошибки валидации Zod
 */
export function handleValidationError(error: any): NextResponse<ApiResponse<null>> {
  if (error.name === 'ZodError') {
    const validationErrors = error.issues.map((issue: any) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));

    return createErrorResponse(
      'VALIDATION_ERROR',
      'Ошибка валидации данных',
      { validationErrors },
      400
    );
  }

  return createErrorResponse(
    'INTERNAL_ERROR',
    'Внутренняя ошибка сервера',
    undefined,
    500
  );
}

/**
 * Обработать ошибки базы данных
 */
export function handleDatabaseError(error: any): NextResponse<ApiResponse<null>> {
  console.error('Database error:', error);

  // Prisma ошибки
  if (error.code === 'P2002') {
    return createErrorResponse(
      'DUPLICATE_ERROR',
      'Запись с такими данными уже существует',
      undefined,
      409
    );
  }

  if (error.code === 'P2025') {
    return createErrorResponse(
      'NOT_FOUND',
      'Запись не найдена',
      undefined,
      404
    );
  }

  return createErrorResponse(
    'DATABASE_ERROR',
    'Ошибка базы данных',
    undefined,
    500
  );
}