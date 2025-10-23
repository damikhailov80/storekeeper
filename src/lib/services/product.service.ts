import { PrismaClient } from '@prisma/client';
import { ProductData } from '@/types/product';

const prisma = new PrismaClient();

export class ProductService {
  static async findByBarcode(barcode: string): Promise<ProductData | null> {
    try {
      const product = await prisma.ean_data.findUnique({
        where: {
          ean: barcode,
        },
      });

      if (!product) {
        return null;
      }

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
      throw new Error('Ошибка базы данных при поиске товара');
    }
  }

  static async healthCheck(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      return false;
    }
  }

  static async disconnect(): Promise<void> {
    await prisma.$disconnect();
  }
}