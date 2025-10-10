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
  { params }: { params: { barcode: string } }
) {
  try {
    // Валидация штрихкода
    const validationResult = BarcodeSchema.safeParse(params.barcode);
    
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
  } catch (error: any) {
    // Обработка ошибок базы данных
    if (error.code && error.code.startsWith('P')) {
      return handleDatabaseError(error);
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