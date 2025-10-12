import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Реальные данные товаров из базы данных (первые 10 уникальных EAN)
const sampleProducts = [
  {
    ean: '5909990944514',
    name: 'Test Product 1',
    price: 48.12,
    quantity: 78,
    min_quantity: 5,
    location: 'CS-9-A-18',
    category: 'Cosmetics',
    unit: 'pieces',
  },
  {
    ean: '8850024101571',
    name: 'Zielony Tajski Balsam Royal Thai Herb z Tłuszczem Krokodyla, 50g',
    price: 18.70,
    quantity: 48,
    min_quantity: 5,
    location: 'CS-7-A-8',
    category: 'Cosmetics',
    unit: 'pieces',
  },
  {
    ean: '8850024101588',
    name: 'Tajski Balsam Royal Thai Herb, White Tiger, na Bóle Stawów, Mięśni, 50g',
    price: 35.37,
    quantity: 45,
    min_quantity: 5,
    location: 'CS-3-A-8',
    category: 'Cosmetics',
    unit: 'pieces',
  },
  {
    ean: '8850024101595',
    name: 'Tajski Niebieski Balsam Royal Thai Herb, Maść na Żylaki i Opuchliznę, 50g',
    price: 50.07,
    quantity: 82,
    min_quantity: 5,
    location: 'CS-8-A-15',
    category: 'Cosmetics',
    unit: 'pieces',
  },
  {
    ean: '8850024102752',
    name: 'Tajski Czerwony Balsam Tygrysi Royal Thai Herb, Silnie Rozgrzewający, 50g',
    price: 42.06,
    quantity: 92,
    min_quantity: 5,
    location: 'CS-10-A-19',
    category: 'Cosmetics',
    unit: 'pieces',
  },
  {
    ean: '8850024118265',
    name: 'Tajski Suchy Inhalator do Nosa Thai Herb z Kolekcją Tajskich Ziół green 20g',
    price: 28.93,
    quantity: 14,
    min_quantity: 5,
    location: 'CS-10-A-3',
    category: 'Cosmetics',
    unit: 'pieces',
  },
  {
    ean: '8850056468444',
    name: 'Balsam Tajski Royal Thai Herb Czarna King Kobra – Maść Rozgrzewająca, 50g',
    price: 27.80,
    quantity: 71,
    min_quantity: 5,
    location: 'CS-8-A-4',
    category: 'Cosmetics',
    unit: 'pieces',
  },
  {
    ean: '8850109001215',
    name: 'Tajski Żółty Balsam Klasyczny Siang Pure, Maść Rozgrzewająca, 12g',
    price: 13.66,
    quantity: 88,
    min_quantity: 5,
    location: 'CS-2-A-12',
    category: 'Cosmetics',
    unit: 'pieces',
  },
  {
    ean: '8850109001314',
    name: 'Tajski Biały Balsam Klasyczny Siang Pure, Maść Łagodząca, 12g',
    price: 34.10,
    quantity: 48,
    min_quantity: 5,
    location: 'CS-2-A-12',
    category: 'Cosmetics',
    unit: 'pieces',
  },
  {
    ean: '8850348110013',
    name: 'Tajska ziołowa pasta Herbal – tradycyjna receptura, Naturalna ochrona, 100g',
    price: 56.47,
    quantity: 62,
    min_quantity: 5,
    location: 'CS-2-A-20',
    category: 'Cosmetics',
    unit: 'pieces',
  },
];

async function main() {
  console.log('🌱 Начинаем заполнение базы данных тестовыми данными...');

  // Создание тестовых товаров
  console.log('📦 Создаем тестовые товары...');

  for (const product of sampleProducts) {
    try {
      await prisma.ean_data.upsert({
        where: { ean: product.ean },
        update: product,
        create: product,
      });
      console.log(`✅ Создан/обновлен товар: ${product.name} (${product.ean})`);
    } catch (error) {
      console.error(`❌ Ошибка при создании товара ${product.ean}:`, error);
    }
  }

  console.log(`🎉 Успешно обработано ${sampleProducts.length} товаров!`);
}

main()
  .catch((e) => {
    console.error('❌ Ошибка при заполнении базы данных:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });