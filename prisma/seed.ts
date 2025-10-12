import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Тестовые данные товаров (15+ записей)
const sampleProducts = [
  {
    barcode: '1234567890123',
    name: 'Смартфон Samsung Galaxy S24',
    description: 'Флагманский смартфон с камерой 200MP и 8GB RAM',
    price: 89999.99,
    quantity: 15,
    category: 'Электроника',
    supplier: 'Samsung Electronics',
  },
  {
    barcode: '9876543210987',
    name: 'Молоко "Домик в деревне" 3.2%',
    description: 'Пастеризованное молоко высшего качества 1л',
    price: 85.50,
    quantity: 50,
    category: 'Продукты питания',
    supplier: 'Данон Россия',
  },
  {
    barcode: '5555555555555',
    name: 'Ручка шариковая Pilot',
    description: 'Ручка шариковая синяя, толщина линии 0.7мм',
    price: 125.00,
    quantity: 200,
    category: 'Канцелярия',
    supplier: 'Pilot Corporation',
  },
  {
    barcode: '1111111111111',
    name: 'Хлеб "Бородинский"',
    description: 'Ржаной хлеб с кориандром, 400г',
    price: 45.90,
    quantity: 25,
    category: 'Продукты питания',
    supplier: 'Хлебозавод №1',
  },
  {
    barcode: '2222222222222',
    name: 'Наушники Sony WH-1000XM5',
    description: 'Беспроводные наушники с активным шумоподавлением',
    price: 32999.00,
    quantity: 8,
    category: 'Электроника',
    supplier: 'Sony Corporation',
  },
  {
    barcode: '3333333333333',
    name: 'Футболка Adidas Originals',
    description: 'Хлопковая футболка унисекс, размер M',
    price: 2999.00,
    quantity: 30,
    category: 'Одежда',
    supplier: 'Adidas AG',
  },
  {
    barcode: '4444444444444',
    name: 'Кофе Lavazza Qualità Oro',
    description: 'Молотый кофе арабика, 250г',
    price: 599.00,
    quantity: 40,
    category: 'Продукты питания',
    supplier: 'Lavazza SpA',
  },
  {
    barcode: '6666666666666',
    name: 'Блокнот Moleskine Classic',
    description: 'Записная книжка в линейку, твердая обложка A5',
    price: 1890.00,
    quantity: 15,
    category: 'Канцелярия',
    supplier: 'Moleskine Srl',
  },
  {
    barcode: '7777777777777',
    name: 'Шампунь L\'Oreal Elseve',
    description: 'Шампунь для поврежденных волос, 400мл',
    price: 299.00,
    quantity: 60,
    category: 'Косметика',
    supplier: 'L\'Oreal Paris',
  },
  {
    barcode: '8888888888888',
    name: 'Планшет iPad Air',
    description: 'Планшет Apple iPad Air 10.9" 64GB Wi-Fi',
    price: 54999.00,
    quantity: 5,
    category: 'Электроника',
    supplier: 'Apple Inc.',
  },
  {
    barcode: '9999999999999',
    name: 'Джинсы Levi\'s 501',
    description: 'Классические прямые джинсы, размер 32/34',
    price: 7999.00,
    quantity: 12,
    category: 'Одежда',
    supplier: 'Levi Strauss & Co.',
  },
  {
    barcode: '1010101010101',
    name: 'Чай Ahmad Tea Earl Grey',
    description: 'Черный чай с бергамотом, 100 пакетиков',
    price: 189.00,
    quantity: 35,
    category: 'Продукты питания',
    supplier: 'Ahmad Tea Ltd',
  },
  {
    barcode: '1212121212121',
    name: 'Мышь Logitech MX Master 3',
    description: 'Беспроводная эргономичная мышь для работы',
    price: 7999.00,
    quantity: 18,
    category: 'Электроника',
    supplier: 'Logitech International',
  },
  {
    barcode: '1313131313131',
    name: 'Кроссовки Nike Air Max 270',
    description: 'Спортивные кроссовки унисекс, размер 42',
    price: 12999.00,
    quantity: 20,
    category: 'Обувь',
    supplier: 'Nike Inc.',
  },
  {
    barcode: '1414141414141',
    name: 'Стиральный порошок Ariel',
    description: 'Концентрированный порошок для белого белья, 3кг',
    price: 899.00,
    quantity: 25,
    category: 'Бытовая химия',
    supplier: 'Procter & Gamble',
  },
  {
    barcode: '1515151515151',
    name: 'Книга "Война и мир"',
    description: 'Роман Л.Н. Толстого, твердый переплет',
    price: 1299.00,
    quantity: 10,
    category: 'Книги',
    supplier: 'Издательство АСТ',
  },
  {
    barcode: '1616161616161',
    name: 'Зарядное устройство Anker',
    description: 'USB-C зарядное устройство 65W с кабелем',
    price: 3499.00,
    quantity: 22,
    category: 'Электроника',
    supplier: 'Anker Innovations',
  },
  {
    barcode: '1717171717171',
    name: 'Йогурт "Активиа" натуральный',
    description: 'Биойогурт с бифидобактериями, 150г',
    price: 65.90,
    quantity: 80,
    category: 'Продукты питания',
    supplier: 'Данон Россия',
  },
  {
    barcode: '5909990944514',
    name: 'Називин капли для носа',
    description: 'Капли для носа, сосудосуживающее средство 0.05%, 10мл',
    price: 189.00,
    quantity: 45,
    category: 'Медикаменты',
    supplier: 'Merck KGaA',
  },
  {
    barcode: '5900014003569',
    name: 'Пиво Карлсберг',
    description: 'Светлое пиво, 0.5л',
    price: 129.00,
    quantity: 100,
    category: 'Напитки',
    supplier: 'Carlsberg Group',
  },
  {
    barcode: '8859126000508',
    name: 'Natrathai Мангустиновое мыло',
    description: 'Натуральное тайское мыло с экстрактом мангустина, увлажняющее и антиоксидантное, 100г',
    price: 299.00,
    quantity: 35,
    category: 'Косметика',
    supplier: 'Natrathai Co., Ltd',
  },
  {
    barcode: '5901088013218',
    name: 'Яблочный сок',
    description: 'Натуральный яблочный сок 100%, 1л',
    price: 149.00,
    quantity: 50,
    category: 'Напитки',
    supplier: 'Сады Придонья',
  }
];

async function main() {
  console.log('🌱 Начинаем заполнение базы данных тестовыми данными...');

  // Очистка существующих данных
  console.log('🗑️  Очищаем существующие данные...');
  await prisma.product.deleteMany();

  // Создание тестовых товаров
  console.log('📦 Создаем тестовые товары...');

  for (const product of sampleProducts) {
    await prisma.product.create({
      data: product,
    });
    console.log(`✅ Создан товар: ${product.name} (${product.barcode})`);
  }

  console.log(`🎉 Успешно создано ${sampleProducts.length} тестовых товаров!`);
}

main()
  .catch((e) => {
    console.error('❌ Ошибка при заполнении базы данных:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });