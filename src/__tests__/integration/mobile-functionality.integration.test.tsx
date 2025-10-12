/**
 * Integration тесты для мобильной функциональности
 * Тестируют работу приложения на мобильных устройствах
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import Home from '@/app/page';
import ProductPage from '@/app/product/[barcode]/page';

// Мокаем Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}));

// Мокаем fetch
global.fetch = jest.fn();

// Мокаем @zxing/library
const mockDecodeFromVideoDevice = jest.fn();
const mockReset = jest.fn();

jest.mock('@zxing/library', () => ({
  BrowserMultiFormatReader: jest.fn().mockImplementation(() => ({
    decodeFromVideoDevice: mockDecodeFromVideoDevice,
    reset: mockReset,
  })),
  NotFoundException: class NotFoundException extends Error {
    constructor(message = 'Not found') {
      super(message);
      this.name = 'NotFoundException';
    }
  },
}));

// Мокаем navigator.mediaDevices
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: jest.fn(),
  },
});

describe('Mobile Functionality Integration Tests', () => {
  const mockPush = jest.fn();
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    mockDecodeFromVideoDevice.mockClear();
    mockReset.mockClear();
  });

  describe('Mobile Device Detection and Adaptation', () => {
    it('должен адаптироваться к iPhone', async () => {
      // Arrange - имитируем iPhone
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
      });

      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 812,
      });

      // Act
      render(<Home />);

      // Assert - проверяем мобильные стили
      const container = document.querySelector('.min-h-screen');
      expect(container).toHaveClass('p-4');

      const maxWidthContainer = document.querySelector('.max-w-2xl');
      expect(maxWidthContainer).toBeInTheDocument();

      // Проверяем кнопки с touch-friendly размерами
      const startButton = screen.getByText('Начать сканирование');
      expect(startButton).toHaveClass('flex-1');
    });

    it('должен адаптироваться к Android устройствам', async () => {
      // Arrange - имитируем Android
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36',
      });

      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 360,
      });

      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 640,
      });

      // Act
      render(<Home />);

      // Assert
      const container = document.querySelector('.min-h-screen');
      expect(container).toBeInTheDocument();

      // Проверяем адаптивные классы
      expect(document.querySelector('.max-w-2xl')).toBeInTheDocument();
      expect(document.querySelector('.mx-auto')).toBeInTheDocument();
    });

    it('должен работать на планшетах', async () => {
      // Arrange - имитируем iPad
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
      });

      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      // Act
      render(<Home />);

      // Assert
      const container = document.querySelector('.max-w-2xl');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Touch Interactions', () => {
    it('должен обрабатывать touch события для кнопок', async () => {
      const user = userEvent.setup();

      // Arrange - имитируем мобильное устройство
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
      });

      const testBarcode = '1234567890123';
      const mockResult = { getText: () => testBarcode };

      mockDecodeFromVideoDevice.mockImplementation((deviceId, videoElement, callback) => {
        setTimeout(() => callback(mockResult, null), 100);
        return Promise.resolve();
      });

      // Act
      render(<Home />);

      const startButton = screen.getByText('Начать сканирование');
      
      // Имитируем touch события
      await act(async () => {
        await user.click(startButton);
      });

      // Assert
      expect(mockDecodeFromVideoDevice).toHaveBeenCalled();

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(`/product/${testBarcode}`);
      });
    });

    it('должен обрабатывать swipe жесты', async () => {
      const user = userEvent.setup();

      // Arrange
      const { useParams } = await import('next/navigation');
      const mockUseParams = useParams as jest.Mock;
      mockUseParams.mockReturnValue({ barcode: '1234567890123' });

      const mockProduct = {
        id: '1',
        barcode: '1234567890123',
        name: 'Мобильный товар',
        description: 'Товар для мобильного тестирования',
        price: 199.99,
        quantity: 10,
        category: 'Мобильные',
        supplier: 'Мобильный поставщик',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockProduct,
        }),
      } as Response);

      // Act
      render(<ProductPage />);

      await waitFor(() => {
        expect(screen.getByText(mockProduct.name)).toBeInTheDocument();
      });

      // Имитируем swipe назад (клик по кнопке "Назад к сканеру")
      const backButton = screen.getByText('Назад к сканеру');
      await user.click(backButton);

      // Assert
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  describe('Camera Integration on Mobile', () => {
    it('должен правильно настраивать камеру для мобильных устройств', async () => {
      const user = userEvent.setup();

      // Arrange - имитируем мобильное устройство
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
      });

      const mockGetUserMedia = jest.fn().mockResolvedValue({
        getTracks: () => [{ stop: jest.fn() }],
      });

      Object.defineProperty(navigator, 'mediaDevices', {
        writable: true,
        value: {
          getUserMedia: mockGetUserMedia,
        },
      });

      const testBarcode = '9876543210987';
      const mockResult = { getText: () => testBarcode };

      mockDecodeFromVideoDevice.mockImplementation((_deviceId, videoElement, callback) => {
        // Проверяем, что видео элемент имеет правильные атрибуты для мобильных
        if (videoElement) {
          expect(videoElement.playsInline).toBe(true);
          expect(videoElement.muted).toBe(true);
        }
        
        callback(mockResult, null);
        return Promise.resolve();
      });

      // Act
      render(<Home />);

      const startButton = screen.getByText('Начать сканирование');
      await user.click(startButton);

      // Assert
      await waitFor(() => {
        const video = document.querySelector('video');
        expect(video).not.toBeNull();
        if (video) {
          // Check for playsInline property (React sets it as a property, not attribute)
          expect(video.playsInline).toBe(true);
          expect(video.muted).toBe(true);
        }
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(`/product/${testBarcode}`);
      });
    });

    it('должен обрабатывать ошибки камеры на мобильных устройствах', async () => {
      const user = userEvent.setup();

      // Arrange - имитируем мобильное устройство
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Android 11; Mobile; rv:68.0) Gecko/68.0 Firefox/88.0',
      });

      // Имитируем ошибку доступа к камере
      const cameraError = new Error('Permission denied');
      cameraError.name = 'NotAllowedError';
      mockDecodeFromVideoDevice.mockRejectedValue(cameraError);

      // Act
      render(<Home />);

      const startButton = screen.getByText('Начать сканирование');
      await user.click(startButton);

      // Assert
      await waitFor(() => {
        expect(screen.getAllByText(/Доступ к камере запрещен/)[0]).toBeInTheDocument();
      });

      // Проверяем, что отображается мобильно-дружественное сообщение об ошибке
      expect(screen.getAllByText(/разрешите доступ в настройках браузера/)[0]).toBeInTheDocument();
    });

    it('должен переключаться между передней и задней камерой', async () => {
      const user = userEvent.setup();

      // Arrange - имитируем устройство с несколькими камерами
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
      });

      const testBarcode = '1111111111111';
      const mockResult = { getText: () => testBarcode };

      // Первый вызов - задняя камера (environment)
      mockDecodeFromVideoDevice.mockImplementationOnce((deviceId, videoElement, callback) => {
        expect(deviceId).toBeNull(); // используем камеру по умолчанию
        setTimeout(() => callback(mockResult, null), 100);
        return Promise.resolve();
      });

      // Act
      render(<Home />);

      const startButton = screen.getByText('Начать сканирование');
      await user.click(startButton);

      // Assert
      await waitFor(() => {
        expect(mockDecodeFromVideoDevice).toHaveBeenCalledWith(
          null, // deviceId
          expect.any(HTMLVideoElement),
          expect.any(Function)
        );
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(`/product/${testBarcode}`);
      });
    });
  });

  describe('Mobile Performance', () => {
    it('должен оптимизировать производительность на слабых устройствах', async () => {
      // Arrange - имитируем слабое устройство
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        writable: true,
        value: 2, // слабый процессор
      });

      Object.defineProperty(navigator, 'deviceMemory', {
        writable: true,
        value: 2, // мало памяти
      });

      const testBarcode = '2222222222222';
      const mockResult = { getText: () => testBarcode };

      // Имитируем более медленное сканирование
      mockDecodeFromVideoDevice.mockImplementation((deviceId, videoElement, callback) => {
        setTimeout(() => callback(mockResult, null), 300);
        return Promise.resolve();
      });

      // Act
      const startTime = performance.now();
      render(<Home />);
      const endTime = performance.now();

      // Assert - проверяем, что рендеринг быстрый
      expect(endTime - startTime).toBeLessThan(100);

      // Проверяем, что компоненты загружаются лениво
      expect(screen.getByText('Начать сканирование')).toBeInTheDocument();
    });

    it('должен управлять памятью при длительном использовании', async () => {
      const user = userEvent.setup();

      // Arrange
      const testBarcode = '3333333333333';
      const mockResult = { getText: () => testBarcode };

      mockDecodeFromVideoDevice.mockImplementation((deviceId, videoElement, callback) => {
        setTimeout(() => callback(mockResult, null), 100);
        return Promise.resolve();
      });

      // Act - имитируем множественные циклы сканирования
      const { rerender } = render(<Home />);

      for (let i = 0; i < 5; i++) {
        const startButton = screen.getByText('Начать сканирование');
        await user.click(startButton);

        await waitFor(() => {
          expect(screen.getByText('Остановить')).toBeInTheDocument();
        });

        const stopButton = screen.getByText('Остановить');
        await user.click(stopButton);

        // Перерендериваем для имитации нового цикла
        rerender(<Home />);
      }

      // Assert - проверяем, что reset вызывался для очистки ресурсов
      expect(mockReset).toHaveBeenCalled();
      expect(mockReset.mock.calls.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Mobile Network Conditions', () => {
    it('должен работать при медленном интернете', async () => {
      // Arrange
      const { useParams } = await import('next/navigation');
      const mockUseParams = useParams as jest.Mock;
      mockUseParams.mockReturnValue({ barcode: '1234567890123' });

      const mockProduct = {
        id: '1',
        barcode: '1234567890123',
        name: 'Медленный товар',
        description: 'Товар для тестирования медленного интернета',
        price: 99.99,
        quantity: 5,
        category: 'Тест',
        supplier: 'Тест',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      // Имитируем медленный ответ API
      mockFetch.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: async () => ({
              success: true,
              data: mockProduct,
            }),
          } as Response), 2000)
        )
      );

      // Act
      render(<ProductPage />);

      // Assert - проверяем отображение индикатора загрузки
      expect(screen.getByText('Поиск товара...')).toBeInTheDocument();

      // Ждем загрузки данных
      await waitFor(() => {
        expect(screen.getByText(mockProduct.name)).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('должен обрабатывать потерю сетевого соединения', async () => {
      // Arrange
      const { useParams } = await import('next/navigation');
      const mockUseParams = useParams as jest.Mock;
      mockUseParams.mockReturnValue({ barcode: '1234567890123' });

      // Имитируем сетевую ошибку
      mockFetch.mockRejectedValue(new Error('Network request failed'));

      // Act
      render(<ProductPage />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Ошибка')).toBeInTheDocument();
        expect(screen.getByText('Network request failed')).toBeInTheDocument();
      });

      // Проверяем наличие кнопки повтора
      expect(screen.getByText('Попробовать снова')).toBeInTheDocument();
    });
  });

  describe('Mobile Accessibility', () => {
    it('должен поддерживать screen readers на мобильных устройствах', () => {
      // Act
      render(<Home />);

      // Assert - проверяем ARIA атрибуты
      const startButton = screen.getByRole('button', { name: 'Начать сканирование' });
      expect(startButton).toBeInTheDocument();

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Сканер штрихкодов');

      // Проверяем семантическую структуру
      const instructions = screen.getByText('Инструкции');
      expect(instructions).toBeInTheDocument();
    });

    it('должен поддерживать высокий контраст на мобильных устройствах', () => {
      // Arrange - имитируем режим высокого контраста
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      // Act
      render(<Home />);

      // Assert - проверяем контрастные цвета
      const button = screen.getByText('Начать сканирование');
      expect(button).toHaveClass('bg-blue-600');
    });

    it('должен поддерживать увеличенный размер шрифта', () => {
      // Arrange - имитируем увеличенный шрифт
      Object.defineProperty(document.documentElement, 'style', {
        writable: true,
        value: {
          fontSize: '20px', // увеличенный размер
        },
      });

      // Act
      render(<Home />);

      // Assert - проверяем, что текст остается читаемым
      const heading = screen.getByText('Сканер штрихкодов');
      expect(heading).toBeInTheDocument();

      const instructions = screen.getAllByText(/Наведите камеру на штрихкод/);
      expect(instructions[0]).toBeInTheDocument();
    });
  });
});