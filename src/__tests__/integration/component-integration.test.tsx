/**
 * Integration тесты для компонентов
 * Тестируют взаимодействие между компонентами
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProductDisplay from '@/components/product/ProductDisplay';
import BarcodeScanner from '@/components/scanner/BarcodeScanner';
import { BrowserMultiFormatReader } from '@zxing/library';

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

describe('Component Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDecodeFromVideoDevice.mockClear();
    mockReset.mockClear();
  });

  describe('ProductDisplay Integration', () => {
    it('должен отображать полную информацию о товаре', () => {
      // Arrange
      const mockProduct = {
        id: '1',
        barcode: '1234567890123',
        name: 'Интеграционный тест товар',
        description: 'Полное описание товара для интеграционного тестирования',
        price: 299.99,
        quantity: 15,
        category: 'Электроника',
        supplier: 'Тест Поставщик',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      // Act
      render(
        <ProductDisplay
          product={mockProduct}
          loading={false}
          error={null}
        />
      );

      // Assert - проверяем все элементы товара
      expect(screen.getByText(mockProduct.name)).toBeInTheDocument();
      expect(screen.getByText(mockProduct.barcode)).toBeInTheDocument();
      expect(screen.getByText('299.99 ₽')).toBeInTheDocument();
      expect(screen.getByText('15 шт.')).toBeInTheDocument();
      expect(screen.getByText(mockProduct.category!)).toBeInTheDocument();
      expect(screen.getByText(mockProduct.supplier!)).toBeInTheDocument();
      expect(screen.getByText(mockProduct.description!)).toBeInTheDocument();
    });

    it('должен обрабатывать различные состояния загрузки', () => {
      // Test loading state
      const { rerender } = render(
        <ProductDisplay
          product={null}
          loading={true}
          error={null}
        />
      );

      expect(screen.getByText('Поиск товара...')).toBeInTheDocument();

      // Test error state
      rerender(
        <ProductDisplay
          product={null}
          loading={false}
          error="Ошибка сети"
        />
      );

      expect(screen.getByText('Ошибка')).toBeInTheDocument();
      expect(screen.getByText('Ошибка сети')).toBeInTheDocument();

      // Test not found state
      rerender(
        <ProductDisplay
          product={null}
          loading={false}
          error={null}
        />
      );

      expect(screen.getByText('Товар не найден')).toBeInTheDocument();
    });

    it('должен правильно отображать цветовые индикаторы количества', () => {
      const testCases = [
        { quantity: 0, expectedClass: 'text-red-600' },
        { quantity: 5, expectedClass: 'text-yellow-600' },
        { quantity: 15, expectedClass: 'text-green-600' },
      ];

      testCases.forEach(({ quantity, expectedClass }) => {
        const mockProduct = {
          id: '1',
          barcode: '1234567890123',
          name: 'Test Product',
          description: 'Test Description',
          price: 99.99,
          quantity: quantity,
          category: 'Test',
          supplier: 'Test',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        };

        const { unmount } = render(
          <ProductDisplay
            product={mockProduct}
            loading={false}
            error={null}
          />
        );

        const quantityElement = screen.getByText(`${quantity} шт.`);
        expect(quantityElement).toHaveClass(expectedClass);

        unmount();
      });
    });

    it('должен обрабатывать взаимодействие с кнопками', async () => {
      const user = userEvent.setup();
      const mockOnScanAgain = jest.fn();

      // Test error state with button
      render(
        <ProductDisplay
          product={null}
          loading={false}
          error="Тестовая ошибка"
          onScanAgain={mockOnScanAgain}
        />
      );

      const retryButton = screen.getByText('Попробовать снова');
      await user.click(retryButton);

      expect(mockOnScanAgain).toHaveBeenCalledTimes(1);
    });
  });

  describe('BarcodeScanner Integration', () => {
    it('должен обрабатывать полный цикл сканирования', async () => {
      const mockOnScanSuccess = jest.fn();
      const mockOnScanError = jest.fn();
      const mockOnStateChange = jest.fn();

      // Arrange - настраиваем успешное сканирование
      const testBarcode = '1234567890123';
      const mockResult = {
        getText: () => testBarcode,
      };

      mockDecodeFromVideoDevice.mockImplementation((deviceId, videoElement, callback) => {
        setTimeout(() => callback(mockResult, null), 100);
        return Promise.resolve();
      });

      // Act
      render(
        <BarcodeScanner
          onScanSuccess={mockOnScanSuccess}
          onScanError={mockOnScanError}
          onStateChange={mockOnStateChange}
          isActive={true}
        />
      );

      // Assert
      expect(mockDecodeFromVideoDevice).toHaveBeenCalled();

      await waitFor(() => {
        expect(mockOnScanSuccess).toHaveBeenCalledWith(testBarcode);
      });

      expect(mockOnStateChange).toHaveBeenCalledWith('initializing');
      expect(mockOnStateChange).toHaveBeenCalledWith('active');
      expect(mockOnStateChange).toHaveBeenCalledWith('scanning');
    });

    it('должен обрабатывать ошибки сканирования', async () => {
      const mockOnScanSuccess = jest.fn();
      const mockOnScanError = jest.fn();
      const mockOnStateChange = jest.fn();

      // Arrange - настраиваем ошибку сканирования
      const scanError = new Error('Camera access denied');
      scanError.name = 'NotAllowedError';
      mockDecodeFromVideoDevice.mockRejectedValue(scanError);

      // Act
      render(
        <BarcodeScanner
          onScanSuccess={mockOnScanSuccess}
          onScanError={mockOnScanError}
          onStateChange={mockOnStateChange}
          isActive={true}
        />
      );

      // Assert
      await waitFor(() => {
        expect(mockOnScanError).toHaveBeenCalled();
      });

      expect(mockOnStateChange).toHaveBeenCalledWith('error');
      expect(mockOnScanSuccess).not.toHaveBeenCalled();
    });

    it('должен правильно останавливать и запускать сканирование', () => {
      const mockOnScanSuccess = jest.fn();
      const mockOnScanError = jest.fn();

      // Act - сначала активный сканер
      const { rerender } = render(
        <BarcodeScanner
          onScanSuccess={mockOnScanSuccess}
          onScanError={mockOnScanError}
          isActive={true}
        />
      );

      expect(mockDecodeFromVideoDevice).toHaveBeenCalled();

      // Act - деактивируем сканер
      rerender(
        <BarcodeScanner
          onScanSuccess={mockOnScanSuccess}
          onScanError={mockOnScanError}
          isActive={false}
        />
      );

      // Assert
      expect(mockReset).toHaveBeenCalled();
    });

    it('должен отображать различные состояния UI', async () => {
      const mockOnScanSuccess = jest.fn();
      const mockOnScanError = jest.fn();

      // Test active state
      render(
        <BarcodeScanner
          onScanSuccess={mockOnScanSuccess}
          onScanError={mockOnScanError}
          isActive={true}
        />
      );

      // Проверяем наличие видео элемента
      const video = document.querySelector('video');
      expect(video).toBeInTheDocument();

      // Ждем появления индикатора активного сканирования
      await waitFor(() => {
        expect(screen.getByText('Сканирование активно')).toBeInTheDocument();
      });
    });
  });

  describe('Component Interaction Integration', () => {
    it('должен правильно передавать данные между компонентами', async () => {
      // Arrange
      const mockProduct = {
        id: '1',
        barcode: '1234567890123',
        name: 'Интеграционный товар',
        description: 'Товар для тестирования взаимодействия компонентов',
        price: 199.99,
        quantity: 10,
        category: 'Тест',
        supplier: 'Тест',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      let scannedBarcode = '';
      let productData = null;
      let isLoading = true;
      const error = null;

      const handleScanSuccess = (barcode: string) => {
        scannedBarcode = barcode;
        // Имитируем загрузку данных о товаре
        setTimeout(() => {
          if (barcode === mockProduct.barcode) {
            productData = mockProduct;
          }
          isLoading = false;
        }, 100);
      };

      // Имитируем успешное сканирование
      const testBarcode = '1234567890123';
      const mockResult = { getText: () => testBarcode };

      mockDecodeFromVideoDevice.mockImplementation((_deviceId, _videoElement, callback) => {
        // Вызываем callback немедленно для синхронного теста
        callback(mockResult, null);
        return Promise.resolve();
      });

      // Act - рендерим сканер
      const { rerender } = render(
        <BarcodeScanner
          onScanSuccess={handleScanSuccess}
          onScanError={() => {}}
          isActive={true}
        />
      );

      // Ждем сканирования
      await waitFor(() => {
        expect(scannedBarcode).toBe(testBarcode);
      });

      // Ждем загрузки данных
      await waitFor(() => {
        expect(isLoading).toBe(false);
      }, { timeout: 200 });

      // Act - рендерим компонент отображения товара
      rerender(
        <ProductDisplay
          product={productData}
          loading={isLoading}
          error={error}
        />
      );

      // Assert
      expect(screen.getByText(mockProduct.name)).toBeInTheDocument();
      expect(screen.getByText(mockProduct.barcode)).toBeInTheDocument();
    });

    it('должен обрабатывать цепочку ошибок между компонентами', async () => {
      // Arrange
      let scanError = '';
      let displayError = null;

      const handleScanError = (error: string) => {
        scanError = error;
        displayError = `Ошибка сканирования: ${error}`;
      };

      // Имитируем ошибку сканирования
      const cameraError = new Error('Camera not found');
      cameraError.name = 'NotFoundError';
      mockDecodeFromVideoDevice.mockRejectedValue(cameraError);

      // Act - рендерим сканер с ошибкой
      const { rerender } = render(
        <BarcodeScanner
          onScanSuccess={() => {}}
          onScanError={handleScanError}
          isActive={true}
        />
      );

      // Ждем обработки ошибки
      await waitFor(() => {
        expect(scanError).toBe('Камера не найдена на устройстве.');
      });

      // Act - рендерим компонент отображения с ошибкой
      rerender(
        <ProductDisplay
          product={null}
          loading={false}
          error={displayError}
        />
      );

      // Assert
      expect(screen.getByText('Ошибка')).toBeInTheDocument();
      expect(screen.getByText('Ошибка сканирования: Камера не найдена на устройстве.')).toBeInTheDocument();
    });
  });

  describe('Responsive Design Integration', () => {
    it('должен адаптироваться к различным размерам экрана', () => {
      // Test mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      const mockProduct = {
        id: '1',
        barcode: '1234567890123',
        name: 'Мобильный товар',
        description: 'Товар для мобильного отображения',
        price: 99.99,
        quantity: 5,
        category: 'Мобильные',
        supplier: 'Мобильный поставщик',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      render(
        <ProductDisplay
          product={mockProduct}
          loading={false}
          error={null}
        />
      );

      // Проверяем адаптивные классы
      const container = document.querySelector('.max-w-md');
      expect(container).toBeInTheDocument();

      const mobileContainer = document.querySelector('.mx-auto');
      expect(mobileContainer).toBeInTheDocument();
    });

    it('должен правильно отображать кнопки на мобильных устройствах', async () => {
      const user = userEvent.setup();
      const mockOnScanAgain = jest.fn();

      render(
        <ProductDisplay
          product={null}
          loading={false}
          error={null}
          onScanAgain={mockOnScanAgain}
        />
      );

      const scanAgainButton = screen.getByText('Сканировать снова');
      
      // Проверяем мобильно-дружественные классы
      expect(scanAgainButton).toHaveClass('touch-manipulation');
      
      await user.click(scanAgainButton);
      expect(mockOnScanAgain).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility Integration', () => {
    it('должен поддерживать screen readers', () => {
      const mockProduct = {
        id: '1',
        barcode: '1234567890123',
        name: 'Доступный товар',
        description: 'Товар для тестирования доступности',
        price: 149.99,
        quantity: 8,
        category: 'Доступность',
        supplier: 'Доступный поставщик',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      render(
        <ProductDisplay
          product={mockProduct}
          loading={false}
          error={null}
        />
      );

      // Проверяем семантическую структуру
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent(mockProduct.name);
    });

    it('должен иметь правильные ARIA атрибуты для кнопок', () => {
      render(
        <ProductDisplay
          product={null}
          loading={false}
          error="Тестовая ошибка"
          onScanAgain={() => {}}
        />
      );

      const button = screen.getByRole('button', { name: 'Попробовать снова' });
      expect(button).toBeInTheDocument();
    });
  });
});