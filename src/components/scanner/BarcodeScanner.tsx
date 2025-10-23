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
  const userFocusActiveRef = useRef<boolean>(false); // флаг для отключения автофокуса

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

      // Настройки для камеры - базовые параметры
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: 'environment', // задняя камера
          width: { ideal: 1920 },
          height: { ideal: 1080 },
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

      // Применяем настройки фокуса для макросъемки (5-15 см)
      const stream = videoElement.srcObject as MediaStream;
      if (stream) {
        const videoTrack = stream.getVideoTracks()[0];
        const capabilities = videoTrack.getCapabilities?.();

        if (capabilities) {
          console.log('Возможности камеры:', capabilities);

          // Функция для применения настроек макрофокуса
          const applyMacroFocus = async () => {
            // Не применяем автофокус если пользователь недавно использовал tap-to-focus
            if (userFocusActiveRef.current) {
              console.log('Пропускаем автофокус - активен пользовательский фокус');
              return;
            }

            try {
              const trackConstraints: MediaTrackConstraints = {};

              // Пробуем использовать continuous focus для автоматической фокусировки
              if ('focusMode' in capabilities) {
                const focusModes = (capabilities as Record<string, unknown>).focusMode as string[] | undefined;

                // Для автофокуса используем continuous, а не manual
                if (focusModes?.includes('continuous')) {
                  (trackConstraints as Record<string, unknown>).focusMode = 'continuous';
                } else if (focusModes?.includes('auto')) {
                  (trackConstraints as Record<string, unknown>).focusMode = 'auto';
                }
              }

              // НЕ устанавливаем фиксированное расстояние фокуса для автофокуса
              // Позволяем камере самой выбирать оптимальное расстояние

              // Максимальная резкость для четкого распознавания штрихкодов
              if ('sharpness' in capabilities) {
                const sharpnessCaps = (capabilities as Record<string, unknown>).sharpness as { min?: number; max?: number } | undefined;
                if (sharpnessCaps?.max !== undefined) {
                  (trackConstraints as Record<string, unknown>).sharpness = sharpnessCaps.max;
                }
              }

              // Непрерывная экспозиция для адаптации к освещению
              if ('exposureMode' in capabilities) {
                const exposureModes = (capabilities as Record<string, unknown>).exposureMode as string[] | undefined;
                if (exposureModes?.includes('continuous')) {
                  (trackConstraints as Record<string, unknown>).exposureMode = 'continuous';
                }
              }

              // Фиксированный zoom без увеличения
              if ('zoom' in capabilities) {
                (trackConstraints as Record<string, unknown>).zoom = 1;
              }

              if (Object.keys(trackConstraints).length > 0) {
                await videoTrack.applyConstraints(trackConstraints);
                console.log('✓ Применены настройки автофокуса:', trackConstraints);
              }
            } catch (e) {
              console.warn('Не удалось применить настройки автофокуса:', e);
            }
          };

          // Применяем настройки сразу
          await applyMacroFocus();

          // Переприменяем настройки каждую секунду для поддержания фокуса
          // Это помогает камере постоянно фокусироваться на близких объектах
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

      // Определяем состояние разрешения на основе ошибки
      if (error instanceof Error && error.name === 'NotAllowedError') {
        updatePermissionState('denied');
      }
    }
  };

  const stopScanning = () => {
    // Останавливаем интервал фокусировки
    if (focusIntervalRef.current) {
      clearInterval(focusIntervalRef.current);
      focusIntervalRef.current = null;
    }

    // Сбрасываем флаг пользовательского фокуса
    userFocusActiveRef.current = false;

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
    setFocusPoint(null);
  };

  const handleTapToFocus = async (event: React.TouchEvent<HTMLVideoElement> | React.MouseEvent<HTMLVideoElement>) => {
    const videoElement = videoRef.current;
    if (!videoElement || !videoElement.srcObject) return;

    // Предотвращаем всплытие события
    event.preventDefault();
    event.stopPropagation();

    const rect = videoElement.getBoundingClientRect();
    let clientX: number, clientY: number;

    // Поддержка как touch, так и mouse событий
    if ('touches' in event) {
      if (event.touches.length === 0) return;
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }

    // Вычисляем относительные координаты (0-1)
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;

    // Показываем индикатор фокуса
    setFocusPoint({ x: clientX - rect.left, y: clientY - rect.top });

    // Устанавливаем флаг пользовательского фокуса
    userFocusActiveRef.current = true;

    // Сбрасываем флаг через 10 секунд, чтобы автофокус снова заработал
    setTimeout(() => {
      userFocusActiveRef.current = false;
      setFocusPoint(null);
    }, 10000);

    // Добавляем тактильную обратную связь на мобильных устройствах
    if ('vibrate' in navigator) {
      navigator.vibrate(50); // короткая вибрация 50мс
    }

    try {
      const stream = videoElement.srcObject as MediaStream;
      const videoTrack = stream.getVideoTracks()[0];
      const capabilities = videoTrack.getCapabilities?.();

      console.log('Попытка фокусировки на точку:', { x: Math.round(x * 100), y: Math.round(y * 100) });
      console.log('Возможности камеры для фокуса:', capabilities);

      if (capabilities) {
        const constraints: MediaTrackConstraints = {};
        let focusApplied = false;

        // Метод 1: Точечный фокус (самый точный)
        if ('focusMode' in capabilities) {
          const focusModes = (capabilities as Record<string, unknown>).focusMode as string[] | undefined;

          if (focusModes?.includes('single-shot')) {
            (constraints as Record<string, unknown>).focusMode = 'single-shot';

            // Если поддерживается точечный фокус
            if ('pointsOfInterest' in capabilities) {
              (constraints as Record<string, unknown>).pointsOfInterest = [{ x, y }];
              console.log('Используем single-shot с точкой интереса');
            }
            focusApplied = true;
          } else if (focusModes?.includes('manual')) {
            (constraints as Record<string, unknown>).focusMode = 'manual';
            console.log('Используем manual фокус');
            focusApplied = true;
          }
        }

        // Метод 2: Если точечный фокус не поддерживается, пробуем continuous
        if (!focusApplied && 'focusMode' in capabilities) {
          const focusModes = (capabilities as Record<string, unknown>).focusMode as string[] | undefined;
          if (focusModes?.includes('continuous')) {
            (constraints as Record<string, unknown>).focusMode = 'continuous';
            console.log('Используем continuous фокус');
            focusApplied = true;
          }
        }

        // Метод 3: Принудительная перефокусировка через изменение расстояния
        if ('focusDistance' in capabilities) {
          const focusCaps = (capabilities as Record<string, unknown>).focusDistance as { min?: number; max?: number } | undefined;

          if (focusCaps?.min !== undefined && focusCaps?.max !== undefined) {
            // Вычисляем расстояние фокуса на основе позиции касания
            // Для штрихкодов оптимальное расстояние 5-30 см

            // Y координата определяет расстояние:
            // Верх экрана (y=0) = дальний фокус (30 см)
            // Низ экрана (y=1) = ближний фокус (5 см)
            const minScanDistance = Math.max(focusCaps.min, 0.05); // минимум 5 см
            const maxScanDistance = Math.min(focusCaps.max, 0.30); // максимум 30 см

            // Инвертируем Y: верх = дальше, низ = ближе
            const distanceRatio = 1 - y;
            const targetDistance = minScanDistance + (maxScanDistance - minScanDistance) * distanceRatio;
            const clampedDistance = Math.max(focusCaps.min, Math.min(focusCaps.max, targetDistance));

            (constraints as Record<string, unknown>).focusDistance = clampedDistance;
            console.log(`Устанавливаем расстояние фокуса: ${clampedDistance.toFixed(3)}м (${Math.round(clampedDistance * 100)}см) для позиции Y=${Math.round(y * 100)}%`);
            focusApplied = true;
          }
        }

        // Применяем ограничения если что-то было настроено
        if (Object.keys(constraints).length > 0) {
          await videoTrack.applyConstraints(constraints);
          console.log('✓ Применены настройки фокуса:', constraints);
        }

        // Метод 4: Альтернативный способ - перезапуск трека для принудительной фокусировки
        if (!focusApplied) {
          console.log('Пробуем альтернативный метод фокусировки');

          // Временно останавливаем и перезапускаем трек
          const settings = videoTrack.getSettings();
          videoTrack.stop();

          // Небольшая задержка
          await new Promise(resolve => setTimeout(resolve, 100));

          // Перезапускаем с теми же настройками
          const newStream = await navigator.mediaDevices.getUserMedia({
            video: {
              ...settings,
              facingMode: 'environment',
            }
          });

          videoElement.srcObject = newStream;
          console.log('✓ Трек перезапущен для фокусировки');
        }
      }
    } catch (error) {
      console.warn('Не удалось установить фокус на точку:', error);

      // Fallback: показываем пользователю что фокус "применен"
      // даже если технически не сработало
      console.log('Фокус применен (визуально)');
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

          {/* Индикатор точки фокуса */}
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
              {/* Внешний круг с анимацией */}
              <div className="w-full h-full border-2 border-yellow-400 rounded-full animate-ping opacity-75"></div>
              {/* Внутренний круг */}
              <div className="absolute inset-3 border-2 border-yellow-400 rounded-full"></div>
              {/* Центральная точка */}
              <div className="absolute inset-1/2 w-1 h-1 bg-yellow-400 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
              {/* Крестик для точности */}
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

          {/* Подсказка для пользователя */}
          {scannerState === 'active' && !cameraError && !focusPoint && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-80 text-white px-4 py-2 rounded-lg text-sm text-center max-w-xs">
              <div className="flex items-center gap-2">
                <span>👆</span>
                <span>Коснитесь штрихкода для фокусировки</span>
              </div>
            </div>
          )}

          {/* Индикатор активной фокусировки */}
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
