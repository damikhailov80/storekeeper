# Deployment Guide

Руководство по развертыванию Storekeeper на Vercel.

---

## Первоначальный деплой

### Шаг 1: Подготовка

```bash
# Проверьте, что все работает локально
npm run build
npm test

# Закоммитьте изменения
git add .
git commit -m "ready for deployment"
git push origin main
```

### Шаг 2: Создание проекта на Vercel

1. Перейдите на [vercel.com](https://vercel.com) и войдите через GitHub
2. Нажмите **"Add New Project"**
3. Выберите ваш репозиторий `storekeeper`
4. **НЕ НАЖИМАЙТЕ "Deploy"** - сначала настроим базу данных

### Шаг 3: Настройка базы данных

**Вариант A: Vercel Postgres (рекомендуется)**

1. В проекте перейдите в **Storage** → **Create Database** → **Postgres**
2. Vercel автоматически добавит переменные окружения
3. Переименуйте `POSTGRES_URL_NON_POOLING` в `DATABASE_URL`

**Вариант B: Внешняя база данных**

1. Создайте PostgreSQL на [neon.tech](https://neon.tech) или [supabase.com](https://supabase.com)
2. Скопируйте connection string
3. В Vercel: **Settings** → **Environment Variables** → добавьте:
   - Name: `DATABASE_URL`
   - Value: `postgresql://user:password@host:port/database`
   - Environment: Production

### Шаг 4: Деплой

1. Нажмите **"Deploy"**
2. Дождитесь завершения (2-3 минуты)
3. Скопируйте URL вашего приложения

### Шаг 5: Применение миграций

```bash
# Установите Vercel CLI
npm i -g vercel

# Войдите и свяжите проект
vercel login
vercel link

# Загрузите переменные окружения
vercel env pull .env.production

# Примените миграции
source .env.production
npm run db:migrate:deploy

# Заполните тестовыми данными (опционально)
npm run db:seed
```

### Шаг 6: Проверка

```bash
# Проверьте health endpoint
curl https://your-app.vercel.app/api/health

# Откройте в браузере
open https://your-app.vercel.app
```

---

## Обновление приложения

После первоначального деплоя обновления происходят автоматически:

```bash
# Внесите изменения в код
git add .
git commit -m "feat: add new feature"
git push origin main

# Vercel автоматически задеплоит изменения
```

### Если изменилась схема базы данных

```bash
# 1. Создайте миграцию локально
npx prisma migrate dev --name your_migration_name

# 2. Закоммитьте миграцию
git add prisma/migrations
git commit -m "feat: add migration"
git push origin main

# 3. Миграция применится автоматически при деплое
```

---

## Переменные окружения

### Обязательные

```env
DATABASE_URL=postgresql://user:password@host:port/database
```

### Опциональные

```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

---

## Полезные команды

```bash
# Просмотр логов
vercel logs

# Просмотр деплоев
vercel ls

# Откат к предыдущей версии
vercel rollback

# Добавление переменной окружения
vercel env add VARIABLE_NAME production
```

---

## Troubleshooting

### Ошибка: "Cannot connect to database"

**Решение:** Проверьте `DATABASE_URL` в Vercel Settings → Environment Variables

### Ошибка: "Prisma Client not found"

**Решение:** Убедитесь, что в `package.json` есть:
```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

### Ошибка: "Table does not exist"

**Решение:** Примените миграции:
```bash
vercel env pull .env.production
source .env.production
npm run db:migrate:deploy
```

### Ошибка сборки

**Решение:** Проверьте логи в Vercel Dashboard и убедитесь, что `npm run build` работает локально

---

## Дополнительная информация

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)
