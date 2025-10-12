import { ProductData } from './product';

/**
 * Scanner state types
 */
export type ScannerState = 'inactive' | 'initializing' | 'active' | 'scanning' | 'error';

export type PermissionState = 'prompt' | 'granted' | 'denied';

/**
 * Scanner state object
 */
export interface ScannerStateObject {
  state: ScannerState;
  permissionState: PermissionState;
  error: string | null;
  lastScannedCode: string | null;
  scanCount: number;
}

/**
 * Barcode scanner component props
 */
export interface BarcodeScannerProps {
  onScanSuccess: (barcode: string) => void;
  onScanError: (error: string) => void;
  isActive: boolean;
  className?: string;
  width?: number;
  height?: number;
  facingMode?: 'user' | 'environment';
  onPermissionChange?: (state: PermissionState) => void;
  onStateChange?: (state: ScannerState) => void;
}

/**
 * Product display component props
 */
export interface ProductDisplayProps {
  product: ProductData | null;
  isLoading: boolean;
  error: string | null;
  onRetry?: () => void;
  onClose?: () => void;
  className?: string;
}

/**
 * Product loading states
 */
export type ProductLoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Scanner page state
 */
export interface ScannerPageState {
  isScanning: boolean;
  scannerState: ScannerStateObject;
  scannedBarcode: string | null;
  product: ProductData | null;
  productLoadingState: ProductLoadingState;
  productError: string | null;
  showProductDetails: boolean;
  retryCount: number;
}

/**
 * Scanner page actions
 */
export interface ScannerPageActions {
  startScanning: () => void;
  stopScanning: () => void;
  resetScanner: () => void;
  searchProduct: (barcode: string) => Promise<void>;
  retryProductSearch: () => void;
  clearProduct: () => void;
  showProduct: () => void;
  hideProduct: () => void;
}

/**
 * Toast notification types
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Toast context
 */
export interface ToastContextValue {
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

/**
 * Loading button props
 */
export interface LoadingButtonProps {
  isLoading: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Error boundary state
 */
export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Error boundary props
 */
export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * Modal props
 */
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

/**
 * Confirmation dialog props
 */
export interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

/**
 * Camera permission status
 */
export interface CameraPermissionStatus {
  state: PermissionState;
  canRequest: boolean;
  isSupported: boolean;
}

/**
 * Device capabilities
 */
export interface DeviceCapabilities {
  hasCamera: boolean;
  supportsBarcodeScanning: boolean;
  isSecureContext: boolean;
  userAgent: string;
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
}

/**
 * App configuration
 */
export interface AppConfig {
  apiBaseUrl: string;
  scannerConfig: {
    retryAttempts: number;
    retryDelay: number;
    scanTimeout: number;
    supportedFormats: string[];
  };
  ui: {
    toastDuration: number;
    loadingTimeout: number;
    animationDuration: number;
  };
}