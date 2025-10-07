# Design Document

## Overview

Система управления складом с функцией сканирования штрихкодов представляет собой полнофункциональное веб-приложение, построенное на современном стеке технологий. Приложение использует Next.js 14 с App Router, TypeScript для типобезопасности, PostgreSQL для хранения данных и современные веб-API для доступа к камере мобильных устройств.

Архитектура следует принципам разделения ответственности, где frontend отвечает за пользовательский интерфейс и взаимодействие с камерой, а backend обрабатывает бизнес-логику и взаимодействие с базой данных.

## Architecture

### High-Level Architecture

```mermaid
graph TB
    A[Mobile Browser] --> B[Next.js Frontend]
    B --> C[Camera API]
    B --> D[Barcode Scanner Library]
    B --> E[Next.js API Routes]
    E --> F[Database Service Layer]
    F --> G[PostgreSQL Database]
    
    H[Development Environment] --> I[Local PostgreSQL]
    H --> J[Next.js Dev Server]
    
    K[Production Environment] --> L[Vercel/Railway]
    L --> M[Production PostgreSQL]
```

### Technology Stack

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS для стилизации
- @zxing/library для сканирования штрихкодов
- React Hook Form для управления формами

**Backend:**
- Next.js API Routes
- Prisma ORM для работы с базой данных
- Zod для валидации данных

**Database:**
- PostgreSQL
- Prisma для миграций и схемы

**Development & Deployment:**
- Docker для локальной разработки
- Vercel или Railway для деплоя
- GitHub Actions для CI/CD

## Components and Interfaces

### Frontend Components

#### 1. BarcodeScanner Component
```typescript
interface BarcodeScannerProps {
  onScanSuccess: (barcode: string) => void;
  onScanError: (error: string) => void;
  isActive: boolean;
}
```

**Responsibilities:**
- Управление доступом к камере
- Инициализация библиотеки сканирования
- Обработка результатов сканирования
- Отображение видеопотока

#### 2. ProductDisplay Component
```typescript
interface ProductDisplayProps {
  product: Product | null;
  loading: boolean;
  error: string | null;
}
```

**Responsibilities:**
- Отображение информации о товаре
- Обработка состояний загрузки и ошибок
- Адаптивный дизайн для мобильных устройств

#### 3. ScannerPage Component
```typescript
interface ScannerPageState {
  isScanning: boolean;
  scannedBarcode: string | null;
  product: Product | null;
  loading: boolean;
  error: string | null;
}
```

**Responsibilities:**
- Координация между сканером и отображением продукта
- Управление состоянием приложения
- Обработка пользовательских действий

### Backend API Interfaces

#### 1. Product Search API
```typescript
// GET /api/products/[barcode]
interface ProductSearchResponse {
  success: boolean;
  data?: Product;
  error?: string;
}
```

#### 2. Health Check API
```typescript
// GET /api/health
interface HealthCheckResponse {
  status: 'ok' | 'error';
  database: 'connected' | 'disconnected';
  timestamp: string;
}
```

### Service Layer

#### 1. ProductService
```typescript
interface ProductService {
  findByBarcode(barcode: string): Promise<Product | null>;
  createProduct(product: CreateProductInput): Promise<Product>;
  updateProduct(id: string, updates: UpdateProductInput): Promise<Product>;
}
```

#### 2. DatabaseService
```typescript
interface DatabaseService {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  healthCheck(): Promise<boolean>;
}
```

## Data Models

### Product Model
```typescript
interface Product {
  id: string;
  barcode: string;
  name: string;
  description: string | null;
  price: number;
  quantity: number;
  category: string | null;
  supplier: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

### Database Schema (Prisma)
```prisma
model Product {
  id          String   @id @default(cuid())
  barcode     String   @unique
  name        String
  description String?
  price       Decimal  @db.Decimal(10, 2)
  quantity    Int      @default(0)
  category    String?
  supplier    String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("products")
}
```

## Error Handling

### Frontend Error Handling

1. **Camera Access Errors**
   - Отсутствие разрешения на камеру
   - Камера недоступна или занята
   - Неподдерживаемый браузер

2. **Scanning Errors**
   - Неудачное распознавание штрихкода
   - Таймаут сканирования
   - Некорректный формат штрихкода

3. **API Errors**
   - Сетевые ошибки
   - Ошибки сервера (5xx)
   - Ошибки валидации (4xx)

### Backend Error Handling

1. **Database Errors**
   - Ошибки подключения
   - Ошибки запросов
   - Нарушение ограничений

2. **Validation Errors**
   - Некорректный формат штрихкода
   - Отсутствующие обязательные поля
   - Неверные типы данных

3. **Business Logic Errors**
   - Товар не найден
   - Дублирование штрихкодов
   - Недостаточные права доступа

### Error Response Format
```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}
```

## Testing Strategy

### Unit Testing
- **Frontend Components**: React Testing Library + Jest
- **API Routes**: Jest + Supertest
- **Service Layer**: Jest + Mock Database
- **Utility Functions**: Jest

### Integration Testing
- **API Integration**: Test API routes with real database
- **Database Integration**: Test Prisma queries
- **Camera Integration**: Mock camera API for testing

### End-to-End Testing
- **Playwright** для тестирования пользовательских сценариев
- **Mobile Testing**: Тестирование на различных мобильных устройствах
- **Cross-browser Testing**: Chrome, Safari, Firefox

### Performance Testing
- **Lighthouse** для анализа производительности
- **Bundle Analysis**: Анализ размера JavaScript бандлов
- **Database Performance**: Тестирование запросов к базе данных

## Development Environment Setup

### Local Development Stack
```yaml
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: warehouse_dev
      POSTGRES_USER: dev_user
      POSTGRES_PASSWORD: dev_password
    ports:
      - "5432:5432"
  
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://dev_user:dev_password@postgres:5432/warehouse_dev
    depends_on:
      - postgres
```

### Environment Variables
```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/warehouse_db

# Next.js
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# Development
NODE_ENV=development
```

### Test Data Setup

#### Sample Products for Testing
```typescript
const sampleProducts = [
  {
    barcode: "1234567890123",
    name: "Смартфон Samsung Galaxy",
    description: "Флагманский смартфон с камерой 108MP",
    price: 45000.00,
    quantity: 15,
    category: "Электроника",
    supplier: "Samsung Electronics"
  },
  {
    barcode: "9876543210987",
    name: "Молоко 3.2%",
    description: "Пастеризованное молоко 1л",
    price: 85.50,
    quantity: 50,
    category: "Продукты питания",
    supplier: "Молочный завод №1"
  },
  {
    barcode: "5555555555555",
    name: "Ручка шариковая синяя",
    description: "Ручка шариковая, синие чернила",
    price: 25.00,
    quantity: 200,
    category: "Канцелярия",
    supplier: "OfficeMax"
  }
  // ... дополнительные тестовые товары
];
```

#### Database Seeding Script
```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Очистка существующих данных
  await prisma.product.deleteMany();
  
  // Создание тестовых товаров
  for (const product of sampleProducts) {
    await prisma.product.create({
      data: product
    });
  }
}
```

## Deployment Architecture

### Production Deployment Options

#### Option 1: Vercel + Railway
- **Frontend**: Vercel для Next.js приложения
- **Database**: Railway PostgreSQL
- **Advantages**: Простота настройки, автоматический деплой
- **Considerations**: Ограничения бесплатного плана

#### Option 2: Docker + VPS
- **Infrastructure**: Docker Compose на VPS
- **Database**: PostgreSQL в контейнере
- **Advantages**: Полный контроль, экономичность
- **Considerations**: Требует больше настройки

### CI/CD Pipeline
```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: npm test
  
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: # deployment commands
```

## Development Process Requirements

### Task Execution Workflow

Каждый таск в плане реализации должен выполняться согласно следующему процессу:

1. **Выполнение таска**: Разработчик или AI-агент реализует функциональность согласно описанию таска
2. **Проверка кода**: После завершения таска необходимо:
   - Проверить качество написанного кода
   - Убедиться в соответствии требованиям
   - Проверить типобезопасность (TypeScript)
   - Запустить линтеры и форматтеры
3. **Ручное тестирование**: Протестировать реализованную функциональность:
   - Запустить приложение локально
   - Проверить работоспособность новой функции
   - Убедиться, что существующая функциональность не сломана
4. **Коммит изменений**: После успешной проверки:
   - Добавить изменения в Git (`git add .`)
   - Создать осмысленный коммит с описанием выполненного таска
   - Формат коммита: `feat: [номер таска] - краткое описание`
   - Пример: `feat: task-1 - инициализация Git репозитория и базовая настройка проекта`

### Git Workflow Requirements

- **Инициализация**: Проект должен быть инициализирован как Git репозиторий на первом таске
- **Коммиты**: Каждый завершенный таск должен быть закоммичен отдельно
- **Сообщения коммитов**: Использовать конвенциональные коммиты (Conventional Commits)
- **Ветвление**: Для сложных тасков можно использовать feature-ветки
- **История**: Поддерживать чистую и понятную историю коммитов

### Quality Assurance

- **Code Review**: Каждый таск должен пройти проверку кода
- **Testing**: Обязательное тестирование функциональности перед коммитом
- **Documentation**: Обновление документации при необходимости
- **Rollback Plan**: Возможность отката изменений в случае проблем

## Security Considerations

### Frontend Security
- **HTTPS Only**: Принудительное использование HTTPS
- **Content Security Policy**: Ограничение загрузки ресурсов
- **Camera Permissions**: Безопасная обработка разрешений

### Backend Security
- **Input Validation**: Валидация всех входящих данных
- **SQL Injection Prevention**: Использование Prisma ORM
- **Rate Limiting**: Ограничение частоты запросов
- **CORS Configuration**: Настройка разрешенных источников

### Database Security
- **Connection Encryption**: SSL соединения
- **Access Control**: Ограниченные права пользователей
- **Backup Strategy**: Регулярные резервные копии