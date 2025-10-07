/**
 * Central export file for all TypeScript types and interfaces
 */

// Product types
export type {
  Product,
  ProductData,
  CreateProductInput,
  UpdateProductInput,
  ProductSearchFilters,
} from './product';

// API types
export type {
  BaseApiResponse,
  SuccessApiResponse,
  ErrorApiResponse,
  ApiResponse,
  ProductSearchResponse,
  HealthCheckResponse,
} from './api';

export {
  ApiErrorCode,
  HttpStatusCode,
} from './api';

// Error types
export type {
  ErrorContext,
  ErrorHandler,
  ErrorRecoveryAction,
  ValidationErrorDetail,
} from './errors';

export {
  ErrorType,
  ErrorSeverity,
  ErrorRecoveryStrategy,
  AppError,
  ScannerError,
  ApiError,
  ValidationError,
  ERROR_MESSAGES,
} from './errors';

// Validation types
export type {
  BarcodeFormat,
  FieldValidationResult,
  FormValidationResult,
  ValidationContext,
  ValidatorFunction,
  ValidationRule,
  ValidationSchema,
} from './validation';

export {
  BARCODE_PATTERNS,
  PRODUCT_VALIDATION_RULES,
  VALIDATION_MESSAGES,
  validateBarcode,
  validatePrice,
} from './validation';

// Component types
export type {
  ScannerState,
  PermissionState,
  ScannerStateObject,
  BarcodeScannerProps,
  ProductDisplayProps,
  ProductLoadingState,
  ScannerPageState,
  ScannerPageActions,
  ToastType,
  ToastMessage,
  ToastContextValue,
  LoadingButtonProps,
  ErrorBoundaryState,
  ErrorBoundaryProps,
  ModalProps,
  ConfirmationDialogProps,
  CameraPermissionStatus,
  DeviceCapabilities,
  AppConfig,
} from './components';