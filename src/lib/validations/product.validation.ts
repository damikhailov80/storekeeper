import { z } from 'zod';

/**
 * Схема валидации для штрихкода
 */
export const BarcodeSchema = z.string()
  .min(1, 'Штрихкод не может быть пустым')
  .max(50, 'Штрихкод слишком длинный')
  .regex(/^[0-9A-Za-z\-]+$/, 'Штрихкод содержит недопустимые символы');

/**
 * Типы, выведенные из схем
 */
export type BarcodeInput = z.infer<typeof BarcodeSchema>;
