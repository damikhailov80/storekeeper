# Storekeeper

Веб-приложение для управления складом с функцией сканирования штрихкодов. Позволяет сканировать штрихкоды товаров с помощью камеры мобильного устройства и получать информацию о товарах из базы данных.

## Технологии

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (Prisma Postgres для разработки)
- **Сканирование**: @zxing/library, @zxing/browser

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

**Для локальной разработки (HTTP):**
```bash
npm run dev
```
Откройте [http://localhost:3000](http://localhost:3000) в браузере.

**Для тестирования на мобильных устройствах (HTTPS):**
```bash
npm run dev:https
```
Откройте [https://localhost:3000](https://localhost:3000) в браузере.

> **Примечание:** Команда `dev:https` автоматически создает самоподписанный SSL сертификат и запускает сервер с поддержкой HTTPS, что необходимо для работы камеры на мобильных устройствах.

### 4. Доступ с мобильных устройств

Для тестирования сканера штрихкодов на мобильном устройстве требуется HTTPS:

1. **Узнайте IP-адрес вашего компьютера:**
   ```bash
   # На macOS/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1
   
   # На Windows
   ipconfig | findstr "IPv4"
   ```

2. **Запустите сервер с HTTPS:**
   ```bash
   npm run dev:https
   ```

3. **Откройте приложение на мобильном устройстве:**
   - Подключите мобильное устройство к той же Wi-Fi сети
   - Откройте браузер на телефоне
   - Перейдите по адресу: `https://[ВАШ_IP]:3000`
   - Например: `https://192.168.1.58:3000`

4. **Примите самоподписанный сертификат:**
   - Браузер покажет предупреждение о безопасности
   - Нажмите "Дополнительно" → "Перейти на сайт"
   - Или "Принять риск и продолжить"

5. **Разрешите доступ к камере** при запросе браузера

**Примечание:** Самоподписанный SSL сертификат создается автоматически при первом запуске и сохраняется в папке `.ssl/`.

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

## Использование компонента BarcodeScanner

### Базовый пример

```tsx
'use client';

import { BarcodeScanner } from '@/components/scanner';
import { useBarcodeScanner } from '@/hooks';

export default function ScannerPage() {
  const {
    isActive,
    scannerState,
    lastScannedCode,
    error,
    startScanning,
    stopScanning,
    handleScanSuccess,
    handleScanError,
    handlePermissionChange,
    handleStateChange,
  } = useBarcodeScanner((barcode) => {
    console.log('Отсканирован штрихкод:', barcode);
    // Здесь можно выполнить поиск товара по API
  });

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Сканер штрихкодов</h1>
      
      <BarcodeScanner
        isActive={isActive}
        onScanSuccess={handleScanSuccess}
        onScanError={handleScanError}
        onPermissionChange={handlePermissionChange}
        onStateChange={handleStateChange}
        facingMode="environment"
      />

      <div className="mt-4 space-y-2">
        <button
          onClick={isActive ? stopScanning : startScanning}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          {isActive ? 'Остановить' : 'Начать сканирование'}
        </button>

        {lastScannedCode && (
          <p className="text-green-600">
            Последний код: {lastScannedCode}
          </p>
        )}

        {error && (
          <p className="text-red-600">Ошибка: {error}</p>
        )}
      </div>
    </div>
  );
}
```

### Возможности компонента

- ✅ Автоматическое распознавание штрихкодов (EAN-13, UPC-A, Code 128 и др.)
- ✅ Обработка разрешений на доступ к камере
- ✅ Отображение состояний (инициализация, активно, сканирование, ошибка)
- ✅ Обработка различных типов ошибок камеры
- ✅ Поддержка передней и задней камеры
- ✅ Адаптивный дизайн для мобильных устройств

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
