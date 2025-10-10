'use client';

import { useState, useCallback } from 'react';
import { ScannerState, PermissionState } from '@/types/components';

export interface UseBarcodeScanner {
  isActive: boolean;
  scannerState: ScannerState;
  permissionState: PermissionState;
  lastScannedCode: string | null;
  error: string | null;
  startScanning: () => void;
  stopScanning: () => void;
  handleScanSuccess: (barcode: string) => void;
  handleScanError: (error: string) => void;
  handlePermissionChange: (state: PermissionState) => void;
  handleStateChange: (state: ScannerState) => void;
  resetScanner: () => void;
}

export function useBarcodeScanner(
  onScanComplete?: (barcode: string) => void
): UseBarcodeScanner {
  const [isActive, setIsActive] = useState(false);
  const [scannerState, setScannerState] = useState<ScannerState>('inactive');
  const [permissionState, setPermissionState] = useState<PermissionState>('prompt');
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startScanning = useCallback(() => {
    setIsActive(true);
    setError(null);
  }, []);

  const stopScanning = useCallback(() => {
    setIsActive(false);
    setScannerState('inactive');
  }, []);

  const handleScanSuccess = useCallback(
    (barcode: string) => {
      setLastScannedCode(barcode);
      setError(null);
      onScanComplete?.(barcode);
    },
    [onScanComplete]
  );

  const handleScanError = useCallback((errorMessage: string) => {
    setError(errorMessage);
  }, []);

  const handlePermissionChange = useCallback((state: PermissionState) => {
    setPermissionState(state);
  }, []);

  const handleStateChange = useCallback((state: ScannerState) => {
    setScannerState(state);
  }, []);

  const resetScanner = useCallback(() => {
    setIsActive(false);
    setScannerState('inactive');
    setPermissionState('prompt');
    setLastScannedCode(null);
    setError(null);
  }, []);

  return {
    isActive,
    scannerState,
    permissionState,
    lastScannedCode,
    error,
    startScanning,
    stopScanning,
    handleScanSuccess,
    handleScanError,
    handlePermissionChange,
    handleStateChange,
    resetScanner,
  };
}
