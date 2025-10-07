# Warehouse Barcode Scanner

Система управления складом с функцией сканирования штрихкодов - это веб-приложение, которое позволяет пользователям сканировать штрихкоды товаров с помощью камеры мобильного устройства, находить информацию о товарах в базе данных и отображать детали товара на веб-странице.

## Технологический стек

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Barcode Scanning**: @zxing/library
- **Development**: Docker, ESLint, Prettier

## Основные функции

- 📱 Сканирование штрихкодов с помощью камеры мобильного устройства
- 🔍 Поиск товаров в базе данных по штрихкоду
- 📊 Отображение детальной информации о товаре
- 📱 Адаптивный дизайн для мобильных устройств
- 🔒 Безопасная обработка данных

## Требования к системе

- Node.js 18+ 
- PostgreSQL 13+
- Современный браузер с поддержкой Camera API
- HTTPS для доступа к камере (в продакшн)

## Быстрый старт

### Локальная разработка

1. Клонируйте репозиторий:
```bash
git clone <repository-url>
cd warehouse-barcode-scanner
```

2. Установите зависимости:
```bash
npm install
```

3. Настройте переменные окружения:
```bash
cp .env.example .env.local
# Отредактируйте .env.local с вашими настройками
```

4. Запустите PostgreSQL (с помощью Docker):
```bash
docker-compose up -d postgres
```

5. Выполните миграции базы данных:
```bash
npx prisma migrate dev
```

6. Заполните базу тестовыми данными:
```bash
npm run seed
```

7. Запустите приложение:
```bash
npm run dev
```

Приложение будет доступно по адресу: http://localhost:3000

## Структура проекта

```
warehouse-barcode-scanner/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── components/        # React компоненты
│   └── page.tsx          # Главная страница
├── lib/                   # Утилиты и сервисы
├── prisma/               # Схема базы данных и миграции
├── types/                # TypeScript типы
├── public/               # Статические файлы
└── docker-compose.yml    # Docker конфигурация
```

## API Endpoints

- `GET /api/products/[barcode]` - Поиск товара по штрихкоду
- `GET /api/health` - Проверка состояния системы

## Разработка

### Команды

```bash
npm run dev          # Запуск в режиме разработки
npm run build        # Сборка для продакшн
npm run start        # Запуск продакшн сборки
npm run lint         # Проверка кода
npm run type-check   # Проверка типов TypeScript
npm run seed         # Заполнение базы тестовыми данными
```

### Тестирование

```bash
npm run test         # Запуск unit тестов
npm run test:e2e     # Запуск end-to-end тестов
npm run test:watch   # Запуск тестов в watch режиме
```

## Деплой

### Vercel (рекомендуется)

1. Подключите репозиторий к Vercel
2. Настройте переменные окружения
3. Настройте PostgreSQL базу данных
4. Деплой произойдет автоматически

### Docker

```bash
docker-compose up --build
```

## Лицензия

MIT License

## Поддержка

Если у вас есть вопросы или проблемы, создайте issue в репозитории.