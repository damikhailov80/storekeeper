import { z } from 'zod';

/**
 * Схема валидации для штрихкода
 */
export const BarcodeSchema = z.string()
  .min(1, 'Штрихкод не может быть пустым')
  .max(50, 'Штрихкод слишком длинный')
  .regex(/^[0-9A-Za-z\-]+$/, 'Штрихкод содержит недопустимые символы');

/**
 * Схема валидации для создания товара
 */
export const CreateProductSchema = z.object({
  barcode: BarcodeSchema,
  name: z.string()
    .min(1, 'Название товара обязательно')
    .max(255, 'Название товара слишком длинное'),
  description: z.string()
    .max(1000, 'Описание слишком длинное')
    .optional()
    .nullable(),
  price: z.number()
    .positive('Цена должна быть положительной')
    .max(999999.99, 'Цена слишком большая'),
  quantity: z.number()
    .int('Количество должно быть целым числом')
    .min(0, 'Количество не может быть отрицательным'),
  category: z.string()
    .max(100, 'Категория слишком длинная')
    .optional()
    .nullable(),
  supplier: z.string()
    .max(255, 'Поставщик слишком длинный')
    .optional()
    .nullable(),
});

/**
 * Схема валидации для обновления товара
 */
export const UpdateProductSchema = CreateProductSchema.partial();

/**
 * Типы, выведенные из схем
 */
export type BarcodeInput = z.infer<typeof BarcodeSchema>;
export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;