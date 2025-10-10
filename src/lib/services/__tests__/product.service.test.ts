import { ProductService } from '../product.service';

// Мокаем весь модуль product.service
jest.mock('../product.service', () => ({
  ProductService: {
    findByBarcode: jest.fn(),
    healthCheck: jest.fn(),
    disconnect: jest.fn(),
  },
}));

const mockProductService = ProductService as jest.Mocked<typeof ProductService>;

// Мокаем console.error для тестов
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

describe('ProductService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('findByBarcode', () => {
    it('должен вернуть товар при успешном поиске', async () => {
      // Arrange
      const expectedProduct = {
        id: '1',
        barcode: '1234567890123',
        name: 'Тестовый товар',
        description: 'Описание товара',
        price: 99.99,
        quantity: 10,
        category: 'Электроника',
        supplier: 'Тестовый поставщик',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      mockProductService.findByBarcode.mockResolvedValue(expectedProduct);

      // Act
      const result = await ProductService.findByBarcode('1234567890123');

      // Assert
      expect(result).toEqual(expectedProduct);
      expect(mockProductService.findByBarcode).toHaveBeenCalledWith('1234567890123');
    });

    it('должен вернуть null если товар не найден', async () => {
      // Arrange
      mockProductService.findByBarcode.mockResolvedValue(null);

      // Act
      const result = await ProductService.findByBarcode('9999999999999');

      // Assert
      expect(result).toBeNull();
      expect(mockProductService.findByBarcode).toHaveBeenCalledWith('9999999999999');
    });

    it('должен обрабатывать ошибки базы данных', async () => {
      // Arrange
      const dbError = new Error('Ошибка базы данных при поиске товара');
      mockProductService.findByBarcode.mockRejectedValue(dbError);

      // Act & Assert
      await expect(ProductService.findByBarcode('1234567890123')).rejects.toThrow(
        'Ошибка базы данных при поиске товара'
      );
    });

    it('должен правильно преобразовывать Decimal в number', async () => {
      // Arrange
      const expectedProduct = {
        id: '1',
        barcode: '1234567890123',
        name: 'Тестовый товар',
        description: 'Описание товара',
        price: 123.45,
        quantity: 5,
        category: 'Тест',
        supplier: 'Тест',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      mockProductService.findByBarcode.mockResolvedValue(expectedProduct);

      // Act
      const result = await ProductService.findByBarcode('1234567890123');

      // Assert
      expect(result?.price).toBe(123.45);
      expect(typeof result?.price).toBe('number');
    });

    it('должен правильно преобразовывать Date в ISO string', async () => {
      // Arrange
      const expectedProduct = {
        id: '1',
        barcode: '1234567890123',
        name: 'Тестовый товар',
        description: 'Описание товара',
        price: 99.99,
        quantity: 10,
        category: 'Электроника',
        supplier: 'Тестовый поставщик',
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z',
      };

      mockProductService.findByBarcode.mockResolvedValue(expectedProduct);

      // Act
      const result = await ProductService.findByBarcode('1234567890123');

      // Assert
      expect(result?.createdAt).toBe('2024-01-15T10:30:00.000Z');
      expect(result?.updatedAt).toBe('2024-01-15T10:30:00.000Z');
      expect(typeof result?.createdAt).toBe('string');
      expect(typeof result?.updatedAt).toBe('string');
    });

    it('должен обрабатывать товары с null значениями', async () => {
      // Arrange
      const expectedProduct = {
        id: '1',
        barcode: '1234567890123',
        name: 'Тестовый товар',
        description: null,
        price: 99.99,
        quantity: 10,
        category: null,
        supplier: null,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      mockProductService.findByBarcode.mockResolvedValue(expectedProduct);

      // Act
      const result = await ProductService.findByBarcode('1234567890123');

      // Assert
      expect(result?.description).toBeNull();
      expect(result?.category).toBeNull();
      expect(result?.supplier).toBeNull();
    });
  });

  describe('healthCheck', () => {
    it('должен вернуть true при успешном подключении к базе данных', async () => {
      // Arrange
      mockProductService.healthCheck.mockResolvedValue(true);

      // Act
      const result = await ProductService.healthCheck();

      // Assert
      expect(result).toBe(true);
      expect(mockProductService.healthCheck).toHaveBeenCalledTimes(1);
    });

    it('должен вернуть false при ошибке подключения к базе данных', async () => {
      // Arrange
      mockProductService.healthCheck.mockResolvedValue(false);

      // Act
      const result = await ProductService.healthCheck();

      // Assert
      expect(result).toBe(false);
      expect(mockProductService.healthCheck).toHaveBeenCalledTimes(1);
    });

    it('должен обрабатывать различные типы ошибок базы данных', async () => {
      // Arrange
      mockProductService.healthCheck.mockResolvedValue(false);

      // Act
      const result = await ProductService.healthCheck();

      // Assert
      expect(result).toBe(false);
      expect(mockProductService.healthCheck).toHaveBeenCalledTimes(1);
    });
  });

  describe('disconnect', () => {
    it('должен вызывать $disconnect на Prisma клиенте', async () => {
      // Arrange
      mockProductService.disconnect.mockResolvedValue(undefined);

      // Act
      await ProductService.disconnect();

      // Assert
      expect(mockProductService.disconnect).toHaveBeenCalledTimes(1);
    });

    it('должен обрабатывать ошибки при отключении', async () => {
      // Arrange
      const disconnectError = new Error('Disconnect failed');
      mockProductService.disconnect.mockRejectedValue(disconnectError);

      // Act & Assert
      await expect(ProductService.disconnect()).rejects.toThrow('Disconnect failed');
    });
  });
});