import { NextRequest } from 'next/server';
import { ProductService } from '@/lib/services/product.service';
import { BarcodeSchema } from '@/lib/validations/product.validation';
import {
  createSuccessResponse,
  createErrorResponse,
  handleValidationError,
  handleDatabaseError,
} from '@/lib/utils/api-response';
import { RequestLogger } from '@/lib/middleware/logger';

/**
 * GET /api/products/[barcode]
 * Поиск товара по штрихкоду
 */
async function getProductHandler(
  request: NextRequest,
  { params }: { params: Promise<{ barcode: string }> }
) {
  try {
    // Await params in Next.js 15
    const { barcode: barcodeParam } = await params;
    
    // Валидация штрихкода
    const validationResult = BarcodeSchema.safeParse(barcodeParam);
    
    if (!validationResult.success) {
      return handleValidationError(validationResult.error);
    }

    const barcode = validationResult.data;

    // Поиск товара в базе данных
    const product = await ProductService.findByBarcode(barcode);

    if (!product) {
      return createErrorResponse(
        'PRODUCT_NOT_FOUND',
        'Товар с указанным штрихкодом не найден',
        { barcode },
        404
      );
    }

    return createSuccessResponse(product);
  } catch (error: unknown) {
    // Обработка ошибок базы данных
    if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'string' && error.code.startsWith('P')) {
      return handleDatabaseError(error as { code: string });
    }

    // Общая обработка ошибок
    console.error('Ошибка в API поиска товара:', error);
    return createErrorResponse(
      'INTERNAL_ERROR',
      'Внутренняя ошибка сервера',
      undefined,
      500
    );
  }
}

// Экспортируем обернутый в логирование handler
export const GET = RequestLogger.withLogging(getProductHandler);