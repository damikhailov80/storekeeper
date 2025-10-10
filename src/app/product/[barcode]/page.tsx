'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProductDisplay } from '@/components/product';
import { ProductData } from '@/types/product';

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const barcode = Array.isArray(params.barcode) ? params.barcode[0] : params.barcode;

  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!barcode) return;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/products/${barcode}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || 'Ошибка при загрузке товара');
        }

        if (data.success && data.data) {
          setProduct(data.data);
        } else {
          setProduct(null);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Неизвестная ошибка'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [barcode]);

  const handleScanAgain = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/')}
            className="flex items-center text-blue-600 hover:text-blue-700 transition-colors mb-4"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Назад к сканеру
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            Информация о товаре
          </h1>
        </div>

        {/* Product Display */}
        <ProductDisplay
          product={product}
          loading={loading}
          error={error}
          onScanAgain={handleScanAgain}
        />
      </div>
    </div>
  );
}
