/**
 * Validation schema types for Zod integration
 */

/**
 * Barcode validation patterns
 */
export const BARCODE_PATTERNS = {
  EAN13: /^\d{13}$/,
  EAN8: /^\d{8}$/,
  UPCA: /^\d{12}$/,
  CODE128: /^[\x00-\x7F]+$/,
  CODE39: /^[A-Z0-9\-\.\$\/\+\%\s]+$/,
} as const;

/**
 * Barcode format types
 */
export type BarcodeFormat = keyof typeof BARCODE_PATTERNS;

/**
 * Validation rules for product fields
 */
export const PRODUCT_VALIDATION_RULES = {
  barcode: {
    minLength: 8,
    maxLength: 13,
    required: true,
  },
  name: {
    minLength: 1,
    maxLength: 255,
    required: true,
  },
  description: {
    maxLength: 1000,
    required: false,
  },
  price: {
    min: 0,
    max: 999999.99,
    required: true,
  },
  quantity: {
    min: 0,
    max: 999999,
    required: false,
    default: 0,
  },
  category: {
    maxLength: 100,
    required: false,
  },
  supplier: {
    maxLength: 255,
    required: false,
  },
} as const;

/**
 * Field validation result
 */
export interface FieldValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Form validation result
 */
export interface FormValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
  data?: Record<string, unknown>;
}

/**
 * Validation context
 */
export interface ValidationContext {
  field: string;
  value: unknown;
  data: Record<string, unknown>;
}

/**
 * Custom validator function type
 */
export type ValidatorFunction = (
  value: unknown,
  context: ValidationContext
) => string | null;

/**
 * Validation rule definition
 */
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: ValidatorFunction[];
  message?: string;
}

/**
 * Schema definition for form validation
 */
export type ValidationSchema = Record<string, ValidationRule>;

/**
 * Common validation messages
 */
export const VALIDATION_MESSAGES = {
  required: 'Это поле обязательно для заполнения',
  minLength: (min: number) => `Минимальная длина: ${min} символов`,
  maxLength: (max: number) => `Максимальная длина: ${max} символов`,
  min: (min: number) => `Минимальное значение: ${min}`,
  max: (max: number) => `Максимальное значение: ${max}`,
  pattern: 'Неверный формат',
  email: 'Неверный формат email',
  url: 'Неверный формат URL',
  number: 'Должно быть числом',
  integer: 'Должно быть целым числом',
  positive: 'Должно быть положительным числом',
  barcode: 'Неверный формат штрихкода',
} as const;

/**
 * Barcode validation function
 */
export function validateBarcode(barcode: string): {
  isValid: boolean;
  format?: BarcodeFormat;
  error?: string;
} {
  if (!barcode || typeof barcode !== 'string') {
    return { isValid: false, error: 'Штрихкод не может быть пустым' };
  }

  const trimmedBarcode = barcode.trim();
  
  if (trimmedBarcode.length === 0) {
    return { isValid: false, error: 'Штрихкод не может быть пустым' };
  }

  // Check against known patterns
  for (const [format, pattern] of Object.entries(BARCODE_PATTERNS)) {
    if (pattern.test(trimmedBarcode)) {
      return { 
        isValid: true, 
        format: format as BarcodeFormat 
      };
    }
  }

  return { 
    isValid: false, 
    error: 'Неподдерживаемый формат штрихкода' 
  };
}

/**
 * Price validation function
 */
export function validatePrice(price: unknown): {
  isValid: boolean;
  value?: number;
  error?: string;
} {
  if (price === null || price === undefined || price === '') {
    return { isValid: false, error: 'Цена обязательна' };
  }

  const numericPrice = typeof price === 'string' ? parseFloat(price) : 
                       typeof price === 'number' ? price : NaN;

  if (isNaN(numericPrice)) {
    return { isValid: false, error: 'Цена должна быть числом' };
  }

  if (numericPrice < 0) {
    return { isValid: false, error: 'Цена не может быть отрицательной' };
  }

  if (numericPrice > 999999.99) {
    return { isValid: false, error: 'Цена слишком большая' };
  }

  // Check for reasonable decimal places (max 2)
  const decimalPlaces = (numericPrice.toString().split('.')[1] || '').length;
  if (decimalPlaces > 2) {
    return { isValid: false, error: 'Цена может иметь максимум 2 знака после запятой' };
  }

  return { isValid: true, value: numericPrice };
}