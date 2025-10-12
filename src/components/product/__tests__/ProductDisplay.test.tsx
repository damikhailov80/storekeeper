import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProductDisplay from '../ProductDisplay';
import { ProductData } from '@/types/product';

describe('ProductDisplay', () => {
  const mockOnScanAgain = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockProduct: ProductData = {
    id: '1',
    barcode: '1234567890123',
    name: 'Тестовый товар',
    description: 'Описание тестового товара',
    price: 99.99,
    quantity: 15,
    category: 'Электроника',
    supplier: 'Тестовый поставщик',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  describe('Loading state', () => {
    it('должен показывать индикатор загрузки', () => {
      render(
        <ProductDisplay
          product={null}
          loading={true}
          error={null}
        />
      );

      expect(screen.getByText('Поиск товара...')).toBeInTheDocument();
      // Проверяем наличие спиннера по классу
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('не должен показывать кнопку "Попробовать снова" в состоянии загрузки', () => {
      render(
        <ProductDisplay
          product={null}
          loading={true}
          error={null}
          onScanAgain={mockOnScanAgain}
        />
      );

      expect(screen.queryByText('Попробовать снова')).not.toBeInTheDocument();
    });
  });

  describe('Error state', () => {
    it('должен показывать сообщение об ошибке', () => {
      const errorMessage = 'Ошибка сети';
      
      render(
        <ProductDisplay
          product={null}
          loading={false}
          error={errorMessage}
        />
      );

      expect(screen.getByText('Ошибка')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('должен показывать кнопку "Попробовать снова" при наличии onScanAgain', () => {
      render(
        <ProductDisplay
          product={null}
          loading={false}
          error="Ошибка сети"
          onScanAgain={mockOnScanAgain}
        />
      );

      expect(screen.getByText('Попробовать снова')).toBeInTheDocument();
    });

    it('должен вызывать onScanAgain при клике на кнопку', async () => {
      const user = userEvent.setup();
      
      render(
        <ProductDisplay
          product={null}
          loading={false}
          error="Ошибка сети"
          onScanAgain={mockOnScanAgain}
        />
      );

      const button = screen.getByText('Попробовать снова');
      await user.click(button);

      expect(mockOnScanAgain).toHaveBeenCalledTimes(1);
    });

    it('не должен показывать кнопку без onScanAgain', () => {
      render(
        <ProductDisplay
          product={null}
          loading={false}
          error="Ошибка сети"
        />
      );

      expect(screen.queryByText('Попробовать снова')).not.toBeInTheDocument();
    });
  });

  describe('Product not found state', () => {
    it('должен показывать сообщение "Товар не найден"', () => {
      render(
        <ProductDisplay
          product={null}
          loading={false}
          error={null}
        />
      );

      expect(screen.getByText('Товар не найден')).toBeInTheDocument();
      expect(screen.getByText('Товар с таким штрихкодом отсутствует в базе данных')).toBeInTheDocument();
    });

    it('должен показывать кнопку "Сканировать снова" при наличии onScanAgain', () => {
      render(
        <ProductDisplay
          product={null}
          loading={false}
          error={null}
          onScanAgain={mockOnScanAgain}
        />
      );

      expect(screen.getByText('Сканировать снова')).toBeInTheDocument();
    });

    it('должен вызывать onScanAgain при клике на кнопку "Сканировать снова"', async () => {
      const user = userEvent.setup();
      
      render(
        <ProductDisplay
          product={null}
          loading={false}
          error={null}
          onScanAgain={mockOnScanAgain}
        />
      );

      const button = screen.getByText('Сканировать снова');
      await user.click(button);

      expect(mockOnScanAgain).toHaveBeenCalledTimes(1);
    });
  });

  describe('Product found state', () => {
    it('должен отображать основную информацию о товаре', () => {
      render(
        <ProductDisplay
          product={mockProduct}
          loading={false}
          error={null}
        />
      );

      expect(screen.getByText(mockProduct.name)).toBeInTheDocument();
      expect(screen.getByText(mockProduct.barcode)).toBeInTheDocument();
      expect(screen.getByText('99.99 zł')).toBeInTheDocument();
      expect(screen.getByText('15 шт.')).toBeInTheDocument();
    });

    it('должен отображать категорию если она есть', () => {
      render(
        <ProductDisplay
          product={mockProduct}
          loading={false}
          error={null}
        />
      );

      expect(screen.getByText('Категория:')).toBeInTheDocument();
      expect(screen.getByText(mockProduct.category!)).toBeInTheDocument();
    });

    it('должен отображать поставщика если он есть', () => {
      render(
        <ProductDisplay
          product={mockProduct}
          loading={false}
          error={null}
        />
      );

      expect(screen.getByText('Поставщик:')).toBeInTheDocument();
      expect(screen.getByText(mockProduct.supplier!)).toBeInTheDocument();
    });

    it('должен отображать описание если оно есть', () => {
      render(
        <ProductDisplay
          product={mockProduct}
          loading={false}
          error={null}
        />
      );

      expect(screen.getByText('Описание:')).toBeInTheDocument();
      expect(screen.getByText(mockProduct.description!)).toBeInTheDocument();
    });

    it('не должен отображать категорию если её нет', () => {
      const productWithoutCategory = { ...mockProduct, category: null };
      
      render(
        <ProductDisplay
          product={productWithoutCategory}
          loading={false}
          error={null}
        />
      );

      expect(screen.queryByText('Категория:')).not.toBeInTheDocument();
    });

    it('не должен отображать поставщика если его нет', () => {
      const productWithoutSupplier = { ...mockProduct, supplier: null };
      
      render(
        <ProductDisplay
          product={productWithoutSupplier}
          loading={false}
          error={null}
        />
      );

      expect(screen.queryByText('Поставщик:')).not.toBeInTheDocument();
    });

    it('не должен отображать описание если его нет', () => {
      const productWithoutDescription = { ...mockProduct, description: null };
      
      render(
        <ProductDisplay
          product={productWithoutDescription}
          loading={false}
          error={null}
        />
      );

      expect(screen.queryByText('Описание:')).not.toBeInTheDocument();
    });

    it('должен показывать зеленый цвет для большого количества товара', () => {
      const productWithHighQuantity = { ...mockProduct, quantity: 15 };
      
      render(
        <ProductDisplay
          product={productWithHighQuantity}
          loading={false}
          error={null}
        />
      );

      const quantityElement = screen.getByText('15 шт.');
      expect(quantityElement).toHaveClass('text-green-600');
    });

    it('должен показывать желтый цвет для малого количества товара', () => {
      const productWithLowQuantity = { ...mockProduct, quantity: 5 };
      
      render(
        <ProductDisplay
          product={productWithLowQuantity}
          loading={false}
          error={null}
        />
      );

      const quantityElement = screen.getByText('5 шт.');
      expect(quantityElement).toHaveClass('text-yellow-600');
    });

    it('должен показывать красный цвет для нулевого количества товара', () => {
      const productOutOfStock = { ...mockProduct, quantity: 0 };
      
      render(
        <ProductDisplay
          product={productOutOfStock}
          loading={false}
          error={null}
        />
      );

      const quantityElement = screen.getByText('0 шт.');
      expect(quantityElement).toHaveClass('text-red-600');
    });

    it('должен показывать кнопку "Сканировать другой товар" при наличии onScanAgain', () => {
      render(
        <ProductDisplay
          product={mockProduct}
          loading={false}
          error={null}
          onScanAgain={mockOnScanAgain}
        />
      );

      expect(screen.getByText('Сканировать другой товар')).toBeInTheDocument();
    });

    it('должен вызывать onScanAgain при клике на кнопку "Сканировать другой товар"', async () => {
      const user = userEvent.setup();
      
      render(
        <ProductDisplay
          product={mockProduct}
          loading={false}
          error={null}
          onScanAgain={mockOnScanAgain}
        />
      );

      const button = screen.getByText('Сканировать другой товар');
      await user.click(button);

      expect(mockOnScanAgain).toHaveBeenCalledTimes(1);
    });

    it('не должен показывать кнопку без onScanAgain', () => {
      render(
        <ProductDisplay
          product={mockProduct}
          loading={false}
          error={null}
        />
      );

      expect(screen.queryByText('Сканировать другой товар')).not.toBeInTheDocument();
    });

    it('должен правильно форматировать цену с двумя десятичными знаками', () => {
      const productWithPrice = { ...mockProduct, price: 123.5 };
      
      render(
        <ProductDisplay
          product={productWithPrice}
          loading={false}
          error={null}
        />
      );

      expect(screen.getByText('123.50 zł')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('должен иметь правильные ARIA атрибуты для кнопок', () => {
      render(
        <ProductDisplay
          product={null}
          loading={false}
          error="Ошибка"
          onScanAgain={mockOnScanAgain}
        />
      );

      const button = screen.getByRole('button', { name: 'Попробовать снова' });
      expect(button).toBeInTheDocument();
    });

    it('должен иметь семантически правильную структуру для товара', () => {
      render(
        <ProductDisplay
          product={mockProduct}
          loading={false}
          error={null}
        />
      );

      // Проверяем наличие заголовка
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(mockProduct.name);
    });
  });
});