# Storekeeper

Веб-приложение для управления складом с функцией сканирования штрихкодов. Позволяет сканировать штрихкоды товаров с помощью камеры мобильного устройства и получать информацию о товарах из базы данных.

## Технологии

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (Prisma Postgres для разработки)
- **Сканирование**: @zxing/library

## Getting Started

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка базы данных

База данных уже настроена с Prisma Postgres. Для применения миграций:

```bash
npx prisma migrate dev
npx prisma generate
```

### 3. Запуск приложения

```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

## Работа с базой данных

### Просмотр данных через Prisma Studio

```bash
npx prisma studio
```

Откроет веб-интерфейс для просмотра и редактирования данных в браузере на http://localhost:5555

### Подключение к базе данных вручную

**Через psql:**
```bash
# Используйте параметры из декодированного DATABASE_URL
psql postgresql://postgres:postgres@localhost:51214/template1
```

**Через любой PostgreSQL клиент:**
- **Host**: localhost
- **Port**: 51214
- **Database**: template1  
- **Username**: postgres
- **Password**: postgres

### Полезные команды Prisma

```bash
# Просмотр статуса миграций
npx prisma migrate status

# Сброс базы данных
npx prisma migrate reset

# Применение изменений схемы без миграции
npx prisma db push
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
