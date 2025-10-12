# Миграция на новую базу данных

## Изменения в структуре данных

Проект адаптирован для работы с новой базой данных PostgreSQL (cosmetics).

### Основная таблица: `ean_data`

Структура таблицы:
- `ean` (String, PRIMARY KEY) - штрихкод товара (EAN)
- `name` (String) - название товара
- `quantity` (Int) - количество на складе
- `min_quantity` (Int) - минимальный остаток
- `location` (String) - расположение на складе
- `category` (String) - категория товара
- `unit` (String) - единица измерения
- `price` (Decimal) - цена товара
- `created_at` (DateTime) - дата создания
- `updated_at` (DateTime) - дата обновления

### Изменения в коде

1. **Prisma Schema** (`prisma/schema.prisma`)
   - Оставлена только модель `ean_data`
   - EAN используется как первичный ключ
   - Остальные таблицы проигнорированы

2. **Типы** (`src/types/product.ts`)
   - Обновлены интерфейсы `Product` и `ProductData`
   - Удалены поля: `id`, `barcode`, `description`, `supplier`
   - Добавлены поля: `ean`, `min_quantity`, `location`, `unit`

3. **Сервис** (`src/lib/services/product.service.ts`)
   - Метод `findByBarcode()` теперь работает с таблицей `ean_data`
   - Поиск по полю `ean` вместо `barcode`

4. **Компонент отображения** (`src/components/product/ProductDisplay.tsx`)
   - Обновлено отображение полей товара
   - Добавлены: EAN, минимальный остаток, расположение, единица измерения
   - Удалены: описание, поставщик

5. **Seed файл** (`prisma/seed.ts`)
   - Обновлены тестовые данные для таблицы `ean_data`
   - Используется `upsert` для безопасного добавления данных

## Подключение к базе данных

Строка подключения в `.env`:
```
DATABASE_URL="postgresql://anton:Rea1Password!@additional-postgres.yarganix.com:5432/cosmetics?sslmode=require"
```

## Команды для работы

```bash
# Генерация Prisma Client
npx prisma generate

# Заполнение тестовыми данными
npx prisma db seed

# Сборка проекта
npm run build

# Запуск в режиме разработки
npm run dev
```

## Проверка работы

Сервис успешно подключается к базе данных и может:
- Искать товары по EAN коду
- Отображать информацию о товаре
- Показывать количество на складе и минимальный остаток
- Отображать расположение товара на складе
