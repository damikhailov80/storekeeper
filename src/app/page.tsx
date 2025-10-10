'use client';

import { useRouter } from 'next/navigation';
import BarcodeScanner from '@/components/scanner/BarcodeScanner';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { Button } from '@/components/ui/button';

export default function Home() {
  const router = useRouter();
  
  const handleScanComplete = (barcode: string) => {
    // Redirect to product page after successful scan
    router.push(`/product/${barcode}`);
  };

  const {
    isActive,
    scannerState,
    lastScannedCode,
    error,
    startScanning,
    stopScanning,
    handleScanSuccess,
    handleScanError,
    handlePermissionChange,
    handleStateChange,
  } = useBarcodeScanner(handleScanComplete);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Сканер штрихкодов
          </h1>
          <p className="text-gray-600 text-sm mb-4">
            Наведите камеру на штрихкод для сканирования
          </p>

          <div className="flex gap-2 mb-4">
            {!isActive ? (
              <Button
                onClick={startScanning}
                variant="primary"
                size="lg"
                className="flex-1"
              >
                Начать сканирование
              </Button>
            ) : (
              <Button
                onClick={stopScanning}
                variant="outline"
                size="lg"
                className="flex-1"
              >
                Остановить
              </Button>
            )}
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {lastScannedCode && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 text-sm font-medium">
                Отсканирован код:
              </p>
              <p className="text-green-900 text-lg font-mono mt-1">
                {lastScannedCode}
              </p>
            </div>
          )}

          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Статус: <span className="font-medium">{getScannerStateText(scannerState)}</span>
            </p>
          </div>
        </div>

        <BarcodeScanner
          isActive={isActive}
          onScanSuccess={handleScanSuccess}
          onScanError={handleScanError}
          onPermissionChange={handlePermissionChange}
          onStateChange={handleStateChange}
          className="mb-4"
        />

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Инструкции
          </h2>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start">
              <span className="mr-2">1.</span>
              <span>Нажмите "Начать сканирование" для активации камеры</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">2.</span>
              <span>Разрешите доступ к камере в браузере</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">3.</span>
              <span>Наведите камеру на штрихкод</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">4.</span>
              <span>Код будет распознан автоматически</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function getScannerStateText(state: string): string {
  const stateMap: Record<string, string> = {
    inactive: 'Неактивен',
    initializing: 'Инициализация...',
    active: 'Активен',
    scanning: 'Сканирование...',
    error: 'Ошибка',
  };
  return stateMap[state] || state;
}
