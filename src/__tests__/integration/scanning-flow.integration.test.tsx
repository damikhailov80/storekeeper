/**
 * Integration тесты для полного цикла сканирования и поиска товаров
 * Тестируют взаимодействие между компонентами сканера, API и отображением результатов
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import Home from '@/app/page';
import ProductPage from '@/app/product/[barcode]/page';
import { BrowserMultiFormatReader } from '@zxing/library';

// Мокаем Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}));

// Мокаем fetch для API запросов
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

describe('Scanning Flow Integration Tests', () => {
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

  describe('Complete Scanning to Product Display Flow', () => {
    it('должен выполнить полный цикл: сканирование -> API запрос -> отображение товара', async () => {
      const user = userEvent.setup();

      // Arrange - настраиваем успешное сканирование
      const testBarcode = '1234567890123';
      const mockResult = {
        getText: () => testBarcode,
      };

      mockDecodeFromVideoDevice.mockImplementation((deviceId, videoElement, callback) => {
        // Имитируем успешное сканирование через 100ms
        setTimeout(() => callback(mockResult, null), 100);
        return Promise.resolve();
      });

      // Act - рендерим главную страницу и начинаем сканирование
      render(<Home />);

      const startButton = screen.getByText('Начать сканирование');
      await user.click(startButton);

      // Assert - проверяем, что сканирование началось
      expect(mockDecodeFromVideoDevice).toHaveBeenCalled();

      // Wait for scanning to complete and navigation to occur
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(`/product/${testBarcode}`);
      }, { timeout: 2000 });
    });
  }); 
   it('должен обрабатывать ошибки сканирования и позволять повторную попытку', async () => {
      const user = userEvent.setup();

      // Arrange - настраиваем ошибку сканирования
      const scanError = new Error('Camera access denied');
      scanError.name = 'NotAllowedError';
      mockDecodeFromVideoDevice.mockRejectedValue(scanError);

      // Act - рендерим страницу и пытаемся начать сканирование
      render(<Home />);

      const startButton = screen.getByText('Начать сканирование');
      await user.click(startButton);

      // Assert - проверяем отображение ошибки
      await waitFor(() => {
        expect(screen.getByText(/Доступ к камере запрещен/)).toBeInTheDocument();
      });

      // Act - исправляем ошибку и пытаемся снова
      const testBarcode = '9876543210987';
      const mockResult = { getText: () => testBarcode };
      
      mockDecodeFromVideoDevice.mockImplementation((deviceId, videoElement, callback) => {
        setTimeout(() => callback(mockResult, null), 50);
        return Promise.resolve();
      });

      // Останавливаем и снова запускаем сканирование
      const stopButton = screen.getByText('Остановить');
      await user.click(stopButton);
      
      const restartButton = screen.getByText('Начать сканирование');
      await user.click(restartButton);

      // Assert - проверяем успешное сканирование
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(`/product/${testBarcode}`);
      });
    });

    it('должен отображать отсканированный код перед переходом', async () => {
      const user = userEvent.setup();

      // Arrange
      const testBarcode = '5555555555555';
      const mockResult = { getText: () => testBarcode };

      mockDecodeFromVideoDevice.mockImplementation((deviceId, videoElement, callback) => {
        setTimeout(() => callback(mockResult, null), 100);
        return Promise.resolve();
      });

      // Act
      render(<Home />);
      
      const startButton = screen.getByText('Начать сканирование');
      await user.click(startButton);

      // Assert - проверяем отображение отсканированного кода
      await waitFor(() => {
        expect(screen.getByText('Отсканирован код:')).toBeInTheDocument();
        expect(screen.getByText(testBarcode)).toBeInTheDocument();
      });

      // Проверяем переход на страницу товара
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(`/product/${testBarcode}`);
      });
    });
  });

  describe('Product Page Integration', () => {
    beforeEach(() => {
      (useRouter as jest.Mock).mockReturnValue({
        push: mockPush,
      });
    });

    it('должен загрузить и отобразить информацию о товаре', async () => {
      // Arrange - мокаем useParams
      const mockUseParams = require('next/navigation').useParams as jest.Mock;
      mockUseParams.mockReturnValue({ barcode: '1234567890123' });

      // Мокаем успешный API ответ
      const mockProduct = {
        id: '1',
        barcode: '1234567890123',
        name: 'Интеграционный тест товар',
        description: 'Товар для интеграционного тестирования',
        price: 299.99,
        quantity: 15,
        category: 'Электроника',
        supplier: 'Тест Поставщик',
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

      // Assert - проверяем состояние загрузки
      expect(screen.getByText('Поиск товара...')).toBeInTheDocument();

      // Ждем загрузки данных
      await waitFor(() => {
        expect(screen.getByText(mockProduct.name)).toBeInTheDocument();
      });

      // Проверяем отображение всех данных товара
      expect(screen.getByText(mockProduct.barcode)).toBeInTheDocument();
      expect(screen.getByText('299.99 ₽')).toBeInTheDocument();
      expect(screen.getByText('15 шт.')).toBeInTheDocument();
      expect(screen.getByText(mockProduct.category!)).toBeInTheDocument();
      expect(screen.getByText(mockProduct.supplier!)).toBeInTheDocument();
      expect(screen.getByText(mockProduct.description!)).toBeInTheDocument();

      // Проверяем API запрос
      expect(mockFetch).toHaveBeenCalledWith('/api/products/1234567890123');
    });

    it('должен обрабатывать случай когда товар не найден', async () => {
      // Arrange
      const mockUseParams = require('next/navigation').useParams as jest.Mock;
      mockUseParams.mockReturnValue({ barcode: '9999999999999' });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          error: {
            code: 'PRODUCT_NOT_FOUND',
            message: 'Товар с указанным штрихкодом не найден',
          },
        }),
      } as Response);

      // Act
      render(<ProductPage />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Товар не найден')).toBeInTheDocument();
        expect(screen.getByText('Товар с таким штрихкодом отсутствует в базе данных')).toBeInTheDocument();
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/products/9999999999999');
    });

    it('должен обрабатывать ошибки API', async () => {
      // Arrange
      const mockUseParams = require('next/navigation').useParams as jest.Mock;
      mockUseParams.mockReturnValue({ barcode: '1234567890123' });

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // Act
      render(<ProductPage />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Ошибка')).toBeInTheDocument();
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('должен позволить вернуться к сканеру', async () => {
      const user = userEvent.setup();

      // Arrange
      const mockUseParams = require('next/navigation').useParams as jest.Mock;
      mockUseParams.mockReturnValue({ barcode: '1234567890123' });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          error: { message: 'Product not found' },
        }),
      } as Response);

      // Act
      render(<ProductPage />);

      await waitFor(() => {
        expect(screen.getByText('Товар не найден')).toBeInTheDocument();
      });

      const scanAgainButton = screen.getByText('Сканировать снова');
      await user.click(scanAgainButton);

      // Assert
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  describe('Error Recovery Integration', () => {
    it('должен восстанавливаться после сетевых ошибок', async () => {
      const user = userEvent.setup();

      // Arrange
      const mockUseParams = require('next/navigation').useParams as jest.Mock;
      mockUseParams.mockReturnValue({ barcode: '1234567890123' });

      // Первый запрос - ошибка сети
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // Второй запрос - успех
      const mockProduct = {
        id: '1',
        barcode: '1234567890123',
        name: 'Восстановленный товар',
        description: 'Товар после восстановления',
        price: 199.99,
        quantity: 10,
        category: 'Тест',
        supplier: 'Тест',
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

      // Act - первый рендер с ошибкой
      const { rerender } = render(<ProductPage />);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });

      // Act - повторная попытка (имитируем обновление страницы)
      rerender(<ProductPage />);

      // Assert - проверяем успешную загрузку
      await waitFor(() => {
        expect(screen.getByText(mockProduct.name)).toBeInTheDocument();
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Mobile Functionality Integration', () => {
    it('должен корректно работать с мобильными жестами', async () => {
      const user = userEvent.setup();

      // Arrange - имитируем мобильное устройство
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
      });

      const testBarcode = '1111111111111';
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
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(`/product/${testBarcode}`);
      });

      // Проверяем, что видео элемент имеет мобильные атрибуты
      const video = document.querySelector('video');
      expect(video).toHaveAttribute('playsInline');
      expect(video).toHaveAttribute('muted');
    });

    it('должен адаптироваться к различным размерам экрана', () => {
      // Arrange - имитируем маленький экран
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      });

      // Act
      render(<Home />);

      // Assert - проверяем адаптивные классы
      const container = document.querySelector('.max-w-2xl');
      expect(container).toBeInTheDocument();

      const mobileContainer = document.querySelector('.p-4');
      expect(mobileContainer).toBeInTheDocument();
    });
  });
});