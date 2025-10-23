import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { ApiResponse } from '@/types/api';

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

export function createErrorResponse(
  code: string,
  message: string,
  details?: unknown,
  status: number = 400
): NextResponse<ApiResponse<null>> {
  const error = {
    code,
    message,
    ...(details ? { details } : {}),
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

export function handleValidationError(error: ZodError): NextResponse<ApiResponse<null>> {
  const validationErrors = error.issues.map((issue) => ({
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

export function handleDatabaseError(error: { code?: string }): NextResponse<ApiResponse<null>> {
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