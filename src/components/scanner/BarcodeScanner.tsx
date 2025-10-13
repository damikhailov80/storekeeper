'use client';

import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { BarcodeScannerProps, PermissionState, ScannerState } from '@/types/components';

export default function BarcodeScanner({
  onScanSuccess,
  onScanError,
  isActive,
  className = '',
  onPermissionChange,
  onStateChange,
}: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannerState, setScannerState] = useState<ScannerState>('inactive');
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    if (!isActive) {
      stopScanning();
      return;
    }

    startScanning();

    return () => {
      stopScanning();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  const updateScannerState = (state: ScannerState) => {
    setScannerState(state);
    onStateChange?.(state);
  };

  const updatePermissionState = (state: PermissionState) => {
    onPermissionChange?.(state);
  };

  const startScanning = async () => {
    try {
      setCameraError(null);
      updateScannerState('initializing');

      // Проверка поддержки getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Ваш браузер не поддерживает доступ к камере');
      }

      const videoElement = videoRef.current;
      if (!videoElement) return;

      // Инициализация сканера
      if (!readerRef.current) {
        readerRef.current = new BrowserMultiFormatReader();
      }

      // Настройки для камеры с автофокусом
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: 'environment', // задняя камера
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          // @ts-ignore - эти свойства поддерживаются на мобильных устройствах
          focusMode: 'continuous',
          // @ts-ignore
          focusDistance: 0,
          // @ts-ignore
          advanced: [{ focusMode: 'continuous' }],
        },
      };

      updateScannerState('active');

      // Запуск сканирования с constraints
      await readerRef.current.decodeFromConstraints(
        constraints,
        videoElement,
        (result, error) => {
          if (result) {
            updateScannerState('scanning');
            const barcode = result.getText();
            onScanSuccess(barcode);
            updatePermissionState('granted');
          }

          if (error && !(error instanceof NotFoundException)) {
            console.error('Ошибка сканирования:', error);
          }
        }
      );

      // Применяем дополнительные настройки фокуса после запуска
      const stream = videoElement.srcObject as MediaStream;
      if (stream) {
        const videoTrack = stream.getVideoTracks()[0];
        const capabilities = videoTrack.getCapabilities?.();

        if (capabilities) {
          const trackConstraints: any = {};

          // Включаем автофокус, если поддерживается
          if ('focusMode' in capabilities) {
            trackConstraints.focusMode = 'continuous';
          }

          // Устанавливаем расстояние фокуса для макросъемки
          if ('focusDistance' in capabilities) {
            trackConstraints.focusDistance = 0;
          }

          if (Object.keys(trackConstraints).length > 0) {
            try {
              await videoTrack.applyConstraints(trackConstraints);
            } catch (e) {
              console.warn('Не удалось применить настройки фокуса:', e);
            }
          }
        }
      }

      updatePermissionState('granted');
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setCameraError(errorMessage);
      onScanError(errorMessage);
      updateScannerState('error');

      // Определяем состояние разрешения на основе ошибки
      if (error instanceof Error && error.name === 'NotAllowedError') {
        updatePermissionState('denied');
      }
    }
  };

  const stopScanning = () => {
    if (readerRef.current) {
      readerRef.current.reset();
    }

    // Останавливаем все треки видеопотока
    const videoElement = videoRef.current;
    if (videoElement?.srcObject) {
      const stream = videoElement.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoElement.srcObject = null;
    }

    updateScannerState('inactive');
    setCameraError(null);
  };

  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
      if (error.name === 'NotAllowedError') {
        return 'Доступ к камере запрещен. Пожалуйста, разрешите доступ в настройках браузера.';
      }
      if (error.name === 'NotFoundError') {
        return 'Камера не найдена на устройстве.';
      }
      if (error.name === 'NotReadableError') {
        return 'Камера занята другим приложением.';
      }
      return error.message;
    }
    return 'Неизвестная ошибка при доступе к камере';
  };

  return (
    <div className={`relative w-full max-w-md mx-auto ${className}`}>
      {isActive && (
        <>
          <video
            ref={videoRef}
            className="w-full h-auto rounded-lg shadow-lg"
            playsInline={true}
            muted={true}
          />

          {scannerState === 'active' && !cameraError && (
            <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm">
              Сканирование активно
            </div>
          )}

          {scannerState === 'scanning' && (
            <div className="absolute top-4 left-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm animate-pulse">
              Обработка штрихкода...
            </div>
          )}

          {scannerState === 'initializing' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 rounded-lg">
              <div className="text-center p-4">
                <p className="text-white">Инициализация камеры...</p>
              </div>
            </div>
          )}

          {cameraError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 rounded-lg">
              <div className="text-center p-4">
                <p className="text-red-400 mb-2">⚠️ Ошибка камеры</p>
                <p className="text-white text-sm">{cameraError}</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
