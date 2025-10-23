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

async function getProductHandler(
  request: NextRequest,
  { params }: { params: Promise<{ barcode: string }> }
) {
  try {
    const { barcode: barcodeParam } = await params;
    
    const validationResult = BarcodeSchema.safeParse(barcodeParam);
    
    if (!validationResult.success) {
      return handleValidationError(validationResult.error);
    }

    const barcode = validationResult.data;

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
    if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'string' && error.code.startsWith('P')) {
      return handleDatabaseError(error as { code: string });
    }

    return createErrorResponse(
      'INTERNAL_ERROR',
      'Внутренняя ошибка сервера',
      undefined,
      500
    );
  }
}

export const GET = RequestLogger.withLogging(getProductHandler);