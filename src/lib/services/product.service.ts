import { PrismaClient } from '@prisma/client';
import { ProductData } from '@/types/product';

const prisma = new PrismaClient();

export class ProductService {
  /**
   * Найти товар по штрихкоду
   */
  static async findByBarcode(barcode: string): Promise<ProductData | null> {
    try {
      const product = await prisma.product.findUnique({
        where: {
          barcode: barcode,
        },
      });

      if (!product) {
        return null;
      }

      // Преобразуем Decimal в number и Date в string для клиента
      return {
        ...product,
        price: Number(product.price),
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
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