import {
  BarcodeSchema,
  CreateProductSchema,
  UpdateProductSchema,
  BarcodeInput,
  CreateProductInput,
  UpdateProductInput,
} from '../product.validation';

describe('Product Validation', () => {
  describe('BarcodeSchema', () => {
    it('должен принимать валидные штрихкоды', () => {
      const validBarcodes = [
        '1234567890123',
        '123456789012',
        'ABC123DEF456',
        '12345-67890',
        'A1B2C3D4E5F6',
      ];

      validBarcodes.forEach(barcode => {
        const result = BarcodeSchema.safeParse(barcode);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe(barcode);
        }
      });
    });

    it('должен отклонять пустые штрихкоды', () => {
      const result = BarcodeSchema.safeParse('');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Штрихкод не может быть пустым');
      }
    });

    it('должен отклонять слишком длинные штрихкоды', () => {
      const longBarcode = 'A'.repeat(51);
      const result = BarcodeSchema.safeParse(longBarcode);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Штрихкод слишком длинный');
      }
    });

    it('должен отклонять штрихкоды с недопустимыми символами', () => {
      const invalidBarcodes = [
        '123456789012!',
        '123@456#789',
        '123 456 789',
        '123.456.789',
        '123/456/789',
      ];

      invalidBarcodes.forEach(barcode => {
        const result = BarcodeSchema.safeParse(barcode);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Штрихкод содержит недопустимые символы');
        }
      });
    });

    it('должен принимать штрихкоды с дефисами', () => {
      const result = BarcodeSchema.safeParse('123-456-789');
      expect(result.success).toBe(true);
    });

    it('должен принимать смешанные буквенно-цифровые штрихкоды', () => {
      const result = BarcodeSchema.safeParse('ABC123def456');
      expect(result.success).toBe(true);
    });
  });

  describe('CreateProductSchema', () => {
    const validProduct: CreateProductInput = {
      barcode: '1234567890123',
      name: 'Тестовый товар',
      description: 'Описание товара',
      price: 99.99,
      quantity: 10,
      category: 'Электроника',
      supplier: 'Тестовый поставщик',
    };

    it('должен принимать валидный товар', () => {
      const result = CreateProductSchema.safeParse(validProduct);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validProduct);
      }
    });

    it('должен принимать товар с минимальными обязательными полями', () => {
      const minimalProduct = {
        barcode: '1234567890123',
        name: 'Товар',
        price: 1.0,
        quantity: 0,
      };

      const result = CreateProductSchema.safeParse(minimalProduct);
      expect(result.success).toBe(true);
    });

    it('должен принимать товар с null значениями для опциональных полей', () => {
      const productWithNulls = {
        ...validProduct,
        description: null,
        category: null,
        supplier: null,
      };

      const result = CreateProductSchema.safeParse(productWithNulls);
      expect(result.success).toBe(true);
    });

    describe('barcode validation', () => {
      it('должен отклонять товар с невалидным штрихкодом', () => {
        const invalidProduct = { ...validProduct, barcode: '' };
        const result = CreateProductSchema.safeParse(invalidProduct);
        expect(result.success).toBe(false);
      });
    });

    describe('name validation', () => {
      it('должен отклонять товар с пустым названием', () => {
        const invalidProduct = { ...validProduct, name: '' };
        const result = CreateProductSchema.safeParse(invalidProduct);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Название товара обязательно');
        }
      });

      it('должен отклонять товар со слишком длинным названием', () => {
        const invalidProduct = { ...validProduct, name: 'A'.repeat(256) };
        const result = CreateProductSchema.safeParse(invalidProduct);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Название товара слишком длинное');
        }
      });

      it('должен принимать название максимальной длины', () => {
        const productWithMaxName = { ...validProduct, name: 'A'.repeat(255) };
        const result = CreateProductSchema.safeParse(productWithMaxName);
        expect(result.success).toBe(true);
      });
    });

    describe('description validation', () => {
      it('должен отклонять слишком длинное описание', () => {
        const invalidProduct = { ...validProduct, description: 'A'.repeat(1001) };
        const result = CreateProductSchema.safeParse(invalidProduct);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Описание слишком длинное');
        }
      });

      it('должен принимать описание максимальной длины', () => {
        const productWithMaxDescription = { ...validProduct, description: 'A'.repeat(1000) };
        const result = CreateProductSchema.safeParse(productWithMaxDescription);
        expect(result.success).toBe(true);
      });
    });

    describe('price validation', () => {
      it('должен отклонять отрицательную цену', () => {
        const invalidProduct = { ...validProduct, price: -1 };
        const result = CreateProductSchema.safeParse(invalidProduct);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Цена должна быть положительной');
        }
      });

      it('должен отклонять нулевую цену', () => {
        const invalidProduct = { ...validProduct, price: 0 };
        const result = CreateProductSchema.safeParse(invalidProduct);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Цена должна быть положительной');
        }
      });

      it('должен отклонять слишком большую цену', () => {
        const invalidProduct = { ...validProduct, price: 1000000 };
        const result = CreateProductSchema.safeParse(invalidProduct);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Цена слишком большая');
        }
      });

      it('должен принимать максимальную допустимую цену', () => {
        const productWithMaxPrice = { ...validProduct, price: 999999.99 };
        const result = CreateProductSchema.safeParse(productWithMaxPrice);
        expect(result.success).toBe(true);
      });

      it('должен принимать минимальную положительную цену', () => {
        const productWithMinPrice = { ...validProduct, price: 0.01 };
        const result = CreateProductSchema.safeParse(productWithMinPrice);
        expect(result.success).toBe(true);
      });
    });

    describe('quantity validation', () => {
      it('должен отклонять отрицательное количество', () => {
        const invalidProduct = { ...validProduct, quantity: -1 };
        const result = CreateProductSchema.safeParse(invalidProduct);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Количество не может быть отрицательным');
        }
      });

      it('должен отклонять дробное количество', () => {
        const invalidProduct = { ...validProduct, quantity: 1.5 };
        const result = CreateProductSchema.safeParse(invalidProduct);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Количество должно быть целым числом');
        }
      });

      it('должен принимать нулевое количество', () => {
        const productWithZeroQuantity = { ...validProduct, quantity: 0 };
        const result = CreateProductSchema.safeParse(productWithZeroQuantity);
        expect(result.success).toBe(true);
      });

      it('должен принимать большое количество', () => {
        const productWithLargeQuantity = { ...validProduct, quantity: 999999 };
        const result = CreateProductSchema.safeParse(productWithLargeQuantity);
        expect(result.success).toBe(true);
      });
    });

    describe('category validation', () => {
      it('должен отклонять слишком длинную категорию', () => {
        const invalidProduct = { ...validProduct, category: 'A'.repeat(101) };
        const result = CreateProductSchema.safeParse(invalidProduct);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Категория слишком длинная');
        }
      });

      it('должен принимать категорию максимальной длины', () => {
        const productWithMaxCategory = { ...validProduct, category: 'A'.repeat(100) };
        const result = CreateProductSchema.safeParse(productWithMaxCategory);
        expect(result.success).toBe(true);
      });
    });

    describe('supplier validation', () => {
      it('должен отклонять слишком длинного поставщика', () => {
        const invalidProduct = { ...validProduct, supplier: 'A'.repeat(256) };
        const result = CreateProductSchema.safeParse(invalidProduct);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Поставщик слишком длинный');
        }
      });

      it('должен принимать поставщика максимальной длины', () => {
        const productWithMaxSupplier = { ...validProduct, supplier: 'A'.repeat(255) };
        const result = CreateProductSchema.safeParse(productWithMaxSupplier);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('UpdateProductSchema', () => {
    it('должен принимать частичное обновление товара', () => {
      const partialUpdate: UpdateProductInput = {
        name: 'Новое название',
        price: 199.99,
      };

      const result = UpdateProductSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(partialUpdate);
      }
    });

    it('должен принимать пустое обновление', () => {
      const emptyUpdate = {};
      const result = UpdateProductSchema.safeParse(emptyUpdate);
      expect(result.success).toBe(true);
    });

    it('должен принимать обновление только одного поля', () => {
      const singleFieldUpdate = { quantity: 50 };
      const result = UpdateProductSchema.safeParse(singleFieldUpdate);
      expect(result.success).toBe(true);
    });

    it('должен применять те же правила валидации к предоставленным полям', () => {
      const invalidUpdate = { price: -100 };
      const result = UpdateProductSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Цена должна быть положительной');
      }
    });

    it('должен принимать null значения для опциональных полей', () => {
      const updateWithNulls = {
        description: null,
        category: null,
        supplier: null,
      };

      const result = UpdateProductSchema.safeParse(updateWithNulls);
      expect(result.success).toBe(true);
    });
  });

  describe('Type inference', () => {
    it('должен правильно выводить типы', () => {
      // Эти тесты проверяют, что типы выводятся правильно во время компиляции
      const barcode: BarcodeInput = '1234567890123';
      expect(typeof barcode).toBe('string');

      const createProduct: CreateProductInput = {
        barcode: '1234567890123',
        name: 'Товар',
        price: 99.99,
        quantity: 10,
      };
      expect(createProduct.barcode).toBe('1234567890123');

      const updateProduct: UpdateProductInput = {
        name: 'Новое название',
      };
      expect(updateProduct.name).toBe('Новое название');
    });
  });
});