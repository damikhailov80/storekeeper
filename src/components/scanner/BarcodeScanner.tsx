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
  const focusIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number } | null>(null);
  const userFocusActiveRef = useRef<boolean>(false);

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
    onPermissionChange?.(state);
  };

  const startScanning = async () => {
    try {
      setCameraError(null);
      updateScannerState('initializing');

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Ваш браузер не поддерживает доступ к камере');
      }

      const videoElement = videoRef.current;
      if (!videoElement) return;

      if (!readerRef.current) {
        readerRef.current = new BrowserMultiFormatReader();
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      };

      updateScannerState('active');

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
          }
        }
      );

      const stream = videoElement.srcObject as MediaStream;
      if (stream) {
        const videoTrack = stream.getVideoTracks()[0];
        const capabilities = videoTrack.getCapabilities?.();

        if (capabilities) {
          const applyMacroFocus = async () => {
            if (userFocusActiveRef.current) {
              return;
            }

            try {
              const trackConstraints: MediaTrackConstraints = {};

              if ('focusMode' in capabilities) {
                const focusModes = (capabilities as Record<string, unknown>).focusMode as string[] | undefined;

                if (focusModes?.includes('continuous')) {
                  (trackConstraints as Record<string, unknown>).focusMode = 'continuous';
                } else if (focusModes?.includes('auto')) {
                  (trackConstraints as Record<string, unknown>).focusMode = 'auto';
                }
              }

              if ('sharpness' in capabilities) {
                const sharpnessCaps = (capabilities as Record<string, unknown>).sharpness as { min?: number; max?: number } | undefined;
                if (sharpnessCaps?.max !== undefined) {
                  (trackConstraints as Record<string, unknown>).sharpness = sharpnessCaps.max;
                }
              }

              if ('exposureMode' in capabilities) {
                const exposureModes = (capabilities as Record<string, unknown>).exposureMode as string[] | undefined;
                if (exposureModes?.includes('continuous')) {
                  (trackConstraints as Record<string, unknown>).exposureMode = 'continuous';
                }
              }

              if ('zoom' in capabilities) {
                (trackConstraints as Record<string, unknown>).zoom = 1;
              }

              if (Object.keys(trackConstraints).length > 0) {
                await videoTrack.applyConstraints(trackConstraints);
              }
            } catch (e) {
            }
          };

          await applyMacroFocus();

          focusIntervalRef.current = setInterval(() => {
            applyMacroFocus();
          }, 1000);
        }
      }

      updatePermissionState('granted');
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setCameraError(errorMessage);
      onScanError(errorMessage);
      updateScannerState('error');

      if (error instanceof Error && error.name === 'NotAllowedError') {
        updatePermissionState('denied');
      }
    }
  };

  const stopScanning = () => {
    if (focusIntervalRef.current) {
      clearInterval(focusIntervalRef.current);
      focusIntervalRef.current = null;
    }

    userFocusActiveRef.current = false;

    if (readerRef.current) {
      readerRef.current.reset();
    }

    const videoElement = videoRef.current;
    if (videoElement?.srcObject) {
      const stream = videoElement.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoElement.srcObject = null;
    }

    updateScannerState('inactive');
    setCameraError(null);
    setFocusPoint(null);
  };

  const handleTapToFocus = async (event: React.TouchEvent<HTMLVideoElement> | React.MouseEvent<HTMLVideoElement>) => {
    const videoElement = videoRef.current;
    if (!videoElement || !videoElement.srcObject) return;

    event.preventDefault();
    event.stopPropagation();

    const rect = videoElement.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in event) {
      if (event.touches.length === 0) return;
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }

    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;

    setFocusPoint({ x: clientX - rect.left, y: clientY - rect.top });

    userFocusActiveRef.current = true;

    setTimeout(() => {
      userFocusActiveRef.current = false;
      setFocusPoint(null);
    }, 10000);

    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }

    try {
      const stream = videoElement.srcObject as MediaStream;
      const videoTrack = stream.getVideoTracks()[0];
      const capabilities = videoTrack.getCapabilities?.();

      if (capabilities) {
        const constraints: MediaTrackConstraints = {};
        let focusApplied = false;

        if ('focusMode' in capabilities) {
          const focusModes = (capabilities as Record<string, unknown>).focusMode as string[] | undefined;

          if (focusModes?.includes('single-shot')) {
            (constraints as Record<string, unknown>).focusMode = 'single-shot';

            if ('pointsOfInterest' in capabilities) {
              (constraints as Record<string, unknown>).pointsOfInterest = [{ x, y }];
            }
            focusApplied = true;
          } else if (focusModes?.includes('manual')) {
            (constraints as Record<string, unknown>).focusMode = 'manual';
            focusApplied = true;
          }
        }

        if (!focusApplied && 'focusMode' in capabilities) {
          const focusModes = (capabilities as Record<string, unknown>).focusMode as string[] | undefined;
          if (focusModes?.includes('continuous')) {
            (constraints as Record<string, unknown>).focusMode = 'continuous';
            focusApplied = true;
          }
        }

        if ('focusDistance' in capabilities) {
          const focusCaps = (capabilities as Record<string, unknown>).focusDistance as { min?: number; max?: number } | undefined;

          if (focusCaps?.min !== undefined && focusCaps?.max !== undefined) {
            const minScanDistance = Math.max(focusCaps.min, 0.05);
            const maxScanDistance = Math.min(focusCaps.max, 0.30);

            const distanceRatio = 1 - y;
            const targetDistance = minScanDistance + (maxScanDistance - minScanDistance) * distanceRatio;
            const clampedDistance = Math.max(focusCaps.min, Math.min(focusCaps.max, targetDistance));

            (constraints as Record<string, unknown>).focusDistance = clampedDistance;
            focusApplied = true;
          }
        }

        if (Object.keys(constraints).length > 0) {
          await videoTrack.applyConstraints(constraints);
        }

        if (!focusApplied) {
          const settings = videoTrack.getSettings();
          videoTrack.stop();

          await new Promise(resolve => setTimeout(resolve, 100));

          const newStream = await navigator.mediaDevices.getUserMedia({
            video: {
              ...settings,
              facingMode: 'environment',
            }
          });

          videoElement.srcObject = newStream;
        }
      }
    } catch (error) {
    }
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
            className="w-full h-auto rounded-lg shadow-lg cursor-pointer select-none"
            playsInline={true}
            muted={true}
            onTouchEnd={handleTapToFocus}
            onClick={handleTapToFocus}
            onPointerDown={handleTapToFocus}
            style={{
              touchAction: 'manipulation',
              userSelect: 'none',
              WebkitUserSelect: 'none'
            }}
          />

          {focusPoint && (
            <div
              className="absolute pointer-events-none z-10"
              style={{
                left: focusPoint.x - 30,
                top: focusPoint.y - 30,
                width: 60,
                height: 60,
              }}
            >
              <div className="w-full h-full border-2 border-yellow-400 rounded-full animate-ping opacity-75"></div>
              <div className="absolute inset-3 border-2 border-yellow-400 rounded-full"></div>
              <div className="absolute inset-1/2 w-1 h-1 bg-yellow-400 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-0.5 bg-yellow-400"></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-0.5 h-4 bg-yellow-400"></div>
              </div>
            </div>
          )}

          {scannerState === 'active' && !cameraError && (
            <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm">
              Сканирование активно
            </div>
          )}

          {scannerState === 'active' && !cameraError && !focusPoint && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-80 text-white px-4 py-2 rounded-lg text-sm text-center max-w-xs">
              <div className="flex items-center gap-2">
                <span>👆</span>
                <span>Коснитесь штрихкода для фокусировки</span>
              </div>
            </div>
          )}

          {focusPoint && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-yellow-500 bg-opacity-90 text-black px-4 py-2 rounded-lg text-sm text-center font-medium">
              🎯 Фокусировка...
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
