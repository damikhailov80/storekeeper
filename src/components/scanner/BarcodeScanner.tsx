'use client';

import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { BarcodeScannerProps, PermissionState, ScannerState } from '@/types/components';

export default function BarcodeScanner({
  onScanSuccess,
  onScanError,
  isActive,
  className = '',
  facingMode = 'environment',
  onPermissionChange,
  onStateChange,
}: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannerState, setScannerState] = useState<ScannerState>('inactive');
  const [permissionState, setPermissionState] = useState<PermissionState>('prompt');
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
  }, [isActive]);

  const updateScannerState = (state: ScannerState) => {
    setScannerState(state);
    onStateChange?.(state);
  };

  const updatePermissionState = (state: PermissionState) => {
    setPermissionState(state);
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

      // Инициализация сканера
      if (!readerRef.current) {
        readerRef.current = new BrowserMultiFormatReader();
      }

      const videoElement = videoRef.current;
      if (!videoElement) return;

      updateScannerState('active');

      // Запрос доступа к камере
      await readerRef.current.decodeFromVideoDevice(
        null, // используем камеру по умолчанию
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
            playsInline
            muted
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
