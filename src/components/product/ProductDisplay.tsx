'use client';

import { ProductData } from '@/types/product';

interface ProductDisplayProps {
  product: ProductData | null;
  loading: boolean;
  error: string | null;
  onScanAgain?: () => void;
}

export default function ProductDisplay({
  product,
  loading,
  error,
  onScanAgain,
}: ProductDisplayProps) {
  // Loading state
  if (loading) {
    return (
      <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Поиск товара...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Ошибка</h3>
          <p className="text-gray-600 text-center">{error}</p>
          {onScanAgain && (
            <button
              onClick={onScanAgain}
              className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors active:bg-blue-800 touch-manipulation"
            >
              Попробовать снова
            </button>
          )}
        </div>
      </div>
    );
  }

  // Product not found state
  if (!product) {
    return (
      <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900">
            Товар не найден
          </h3>
          <p className="text-gray-600 text-center">
            Товар с таким штрихкодом отсутствует в базе данных
          </p>
          {onScanAgain && (
            <button
              onClick={onScanAgain}
              className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors active:bg-blue-800 touch-manipulation"
            >
              Сканировать снова
            </button>
          )}
        </div>
      </div>
    );
  }

  // Product found - display details
  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex flex-col space-y-4">
        {/* Success icon */}
        <div className="flex items-center justify-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        {/* Product name */}
        <h2 className="text-2xl font-bold text-gray-900 text-center">
          {product.name}
        </h2>

        {/* Product details */}
        <div className="space-y-3 pt-4 border-t border-gray-200">
          {/* EAN */}
          {product.ean && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">EAN:</span>
              <span className="text-gray-900 font-mono">{product.ean}</span>
            </div>
          )}

          {/* Price */}
          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-medium">Цена:</span>
            <span className="text-2xl font-bold text-green-600">
              {product.price.toFixed(2)} ₽
            </span>
          </div>

          {/* Quantity */}
          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-medium">На складе:</span>
            <span
              className={`font-semibold ${
                product.quantity > product.min_quantity
                  ? 'text-green-600'
                  : product.quantity > 0
                    ? 'text-yellow-600'
                    : 'text-red-600'
              }`}
            >
              {product.quantity} {product.unit || 'шт.'}
            </span>
          </div>

          {/* Min Quantity */}
          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-medium">Мин. остаток:</span>
            <span className="text-gray-900">{product.min_quantity} {product.unit || 'шт.'}</span>
          </div>

          {/* Location */}
          {product.location && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">Расположение:</span>
              <span className="text-gray-900">{product.location}</span>
            </div>
          )}

          {/* Category */}
          {product.category && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">Категория:</span>
              <span className="text-gray-900">{product.category}</span>
            </div>
          )}
        </div>

        {/* Scan again button */}
        {onScanAgain && (
          <button
            onClick={onScanAgain}
            className="mt-6 w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors active:bg-blue-800 touch-manipulation font-medium"
          >
            Сканировать другой товар
          </button>
        )}
      </div>
    </div>
  );
}
