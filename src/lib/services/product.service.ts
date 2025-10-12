import { PrismaClient } from '@prisma/client';
import { ProductData } from '@/types/product';

const prisma = new PrismaClient();

export class ProductService {
  /**
   * Найти товар по штрихкоду (EAN)
   */
  static async findByBarcode(barcode: string): Promise<ProductData | null> {
    try {
      console.log('[ProductService] Поиск товара по баркоду:', barcode);
      const product = await prisma.ean_data.findUnique({
        where: {
          ean: barcode,
        },
      });

      console.log('[ProductService] Результат из БД:', product ? 'найден' : 'не найден');
      if (!product) {
        return null;
      }

      // Преобразуем Decimal в number и Date в string для клиента
      return {
        ean: product.ean,
        name: product.name,
        quantity: product.quantity ?? 0,
        min_quantity: product.min_quantity ?? 5,
        location: product.location,
        category: product.category,
        unit: product.unit,
        price: product.price ? Number(product.price) : 0,
        created_at: product.created_at?.toISOString() ?? new Date().toISOString(),
        updated_at: product.updated_at?.toISOString() ?? new Date().toISOString(),
      };
    } catch (error) {
      console.error('Ошибка при поиске товара по штрихкоду:', error);
      throw new Error('Ошибка базы данных при поиске товара');
    }
  }

  /**
   * Проверить подключение к базе данных
   */
  static async healthCheck(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Ошибка подключения к базе данных:', error);
      return false;
    }
  }

  /**
   * Закрыть подключение к базе данных
   */
  static async disconnect(): Promise<void> {
    await prisma.$disconnect();
  }
}