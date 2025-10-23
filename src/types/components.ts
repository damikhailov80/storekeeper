/**
 * Scanner state types
 */
export type ScannerState = 'inactive' | 'initializing' | 'active' | 'scanning' | 'error';

export type PermissionState = 'prompt' | 'granted' | 'denied';

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
