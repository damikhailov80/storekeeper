/**
 * Application error types
 */
export enum ErrorType {
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  
  // API errors
  API_ERROR = 'API_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  
  // Scanner errors
  CAMERA_ACCESS_DENIED = 'CAMERA_ACCESS_DENIED',
  CAMERA_NOT_AVAILABLE = 'CAMERA_NOT_AVAILABLE',
  SCANNER_INITIALIZATION_ERROR = 'SCANNER_INITIALIZATION_ERROR',
  BARCODE_SCAN_ERROR = 'BARCODE_SCAN_ERROR',
  UNSUPPORTED_BROWSER = 'UNSUPPORTED_BROWSER',
  
  // Database errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  PRODUCT_NOT_FOUND = 'PRODUCT_NOT_FOUND',
  
  // Generic errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
}

/**
 * Application error class
 */
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly code: string;
  public readonly details?: unknown;
  public readonly timestamp: Date;

  constructor(
    type: ErrorType,
    message: string,
    code?: string,
    details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.code = code || type;
    this.details = details;
    this.timestamp = new Date();
  }

  /**
   * Convert error to JSON for logging
   */
  toJSON() {
    return {
      name: this.name,
      type: this.type,
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
    };
  }
}

/**
 * Scanner-specific errors
 */
export class ScannerError extends AppError {
  constructor(message: string, code?: string, details?: unknown) {
    super(ErrorType.BARCODE_SCAN_ERROR, message, code, details);
    this.name = 'ScannerError';
  }
}

/**
 * API-specific errors
 */
export class ApiError extends AppError {
  public readonly statusCode: number;

  constructor(
    message: string,
    statusCode: number = 500,
    code?: string,
    details?: unknown
  ) {
    super(ErrorType.API_ERROR, message, code, details);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

/**
 * Validation error details
 */
export interface ValidationErrorDetail {
  field: string;
  message: string;
  value?: unknown;
}

/**
 * Validation error class
 */
export class ValidationError extends AppError {
  public readonly validationErrors: ValidationErrorDetail[];

  constructor(message: string, validationErrors: ValidationErrorDetail[]) {
    super(ErrorType.VALIDATION_ERROR, message, 'VALIDATION_ERROR', validationErrors);
    this.name = 'ValidationError';
    this.validationErrors = validationErrors;
  }
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Error context for logging and debugging
 */
export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
  timestamp: Date;
  severity: ErrorSeverity;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Error handler function type
 */
export type ErrorHandler = (error: AppError, context?: ErrorContext) => void;

/**
 * Error recovery strategies
 */
export enum ErrorRecoveryStrategy {
  RETRY = 'retry',
  FALLBACK = 'fallback',
  IGNORE = 'ignore',
  REDIRECT = 'redirect',
  RELOAD = 'reload',
}

/**
 * Error recovery action
 */
export interface ErrorRecoveryAction {
  strategy: ErrorRecoveryStrategy;
  label: string;
  action: () => void | Promise<void>;
}

/**
 * User-friendly error messages
 */
export const ERROR_MESSAGES: Record<ErrorType, string> = {
  [ErrorType.NETWORK_ERROR]: 'Проблема с сетевым соединением. Проверьте подключение к интернету.',
  [ErrorType.TIMEOUT_ERROR]: 'Превышено время ожидания. Попробуйте еще раз.',
  [ErrorType.CONNECTION_ERROR]: 'Не удается подключиться к серверу.',
  [ErrorType.API_ERROR]: 'Ошибка сервера. Попробуйте позже.',
  [ErrorType.VALIDATION_ERROR]: 'Некорректные данные.',
  [ErrorType.AUTHENTICATION_ERROR]: 'Ошибка аутентификации.',
  [ErrorType.AUTHORIZATION_ERROR]: 'Недостаточно прав доступа.',
  [ErrorType.CAMERA_ACCESS_DENIED]: 'Доступ к камере запрещен. Разрешите доступ в настройках браузера.',
  [ErrorType.CAMERA_NOT_AVAILABLE]: 'Камера недоступна или используется другим приложением.',
  [ErrorType.SCANNER_INITIALIZATION_ERROR]: 'Не удалось инициализировать сканер штрихкодов.',
  [ErrorType.BARCODE_SCAN_ERROR]: 'Ошибка сканирования штрихкода. Попробуйте еще раз.',
  [ErrorType.UNSUPPORTED_BROWSER]: 'Ваш браузер не поддерживает сканирование штрихкодов.',
  [ErrorType.DATABASE_ERROR]: 'Ошибка базы данных.',
  [ErrorType.PRODUCT_NOT_FOUND]: 'Товар с таким штрихкодом не найден.',
  [ErrorType.UNKNOWN_ERROR]: 'Произошла неизвестная ошибка.',
  [ErrorType.CONFIGURATION_ERROR]: 'Ошибка конфигурации приложения.',
};