import { GET } from '../products/[barcode]/route';
import { ProductService } from '@/lib/services/product.service';
import { NextRequest } from 'next/server';

// Мокаем ProductService
jest.mock('@/lib/services/product.service');
const mockProductService = ProductService as jest.Mocked<typeof ProductService>;

describe('/api/products/[barcode]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('должен вернуть товар при валидном штрихкоде', async () => {
    const mockProduct = {
      id: '1',
      barcode: '1234567890123',
      name: 'Тестовый товар',
      description: 'Описание товара',
      price: 100.50,
      quantity: 10,
      category: 'Тест',
      supplier: 'Тестовый поставщик',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockProductService.findByBarcode.mockResolvedValue(mockProduct);

    const request = new NextRequest('http://localhost:3000/api/products/1234567890123');
    const params = { barcode: '1234567890123' };

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.id).toBe(mockProduct.id);
    expect(data.data.barcode).toBe(mockProduct.barcode);
    expect(data.data.name).toBe(mockProduct.name);
    expect(data.data.price).toBe(mockProduct.price);
    expect(mockProductService.findByBarcode).toHaveBeenCalledWith('1234567890123');
  });

  it('должен вернуть 404 если товар не найден', async () => {
    mockProductService.findByBarcode.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/products/9999999999999');
    const params = { barcode: '9999999999999' };

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('PRODUCT_NOT_FOUND');
  });

  it('должен вернуть ошибку валидации для невалидного штрихкода', async () => {
    const request = new NextRequest('http://localhost:3000/api/products/invalid!barcode');
    const params = { barcode: 'invalid!barcode' };

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('должен обработать ошибку базы данных', async () => {
    mockProductService.findByBarcode.mockRejectedValue(new Error('Database connection failed'));

    const request = new NextRequest('http://localhost:3000/api/products/1234567890123');
    const params = { barcode: '1234567890123' };

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('INTERNAL_ERROR');
  });
});