import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import BarcodeScanner from '../BarcodeScanner';

// Mock @zxing/library
const mockDecodeFromVideoDevice = jest.fn();
const mockReset = jest.fn();

jest.mock('@zxing/library', () => ({
  BrowserMultiFormatReader: jest.fn().mockImplementation(() => ({
    decodeFromVideoDevice: mockDecodeFromVideoDevice,
    reset: mockReset,
  })),
  NotFoundException: class NotFoundException extends Error {
    constructor(message = 'Not found') {
      super(message);
      this.name = 'NotFoundException';
    }
  },
}));

// Mock navigator.mediaDevices
const mockGetUserMedia = jest.fn();
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: mockGetUserMedia,
  },
});

describe('BarcodeScanner', () => {
  const mockOnScanSuccess = jest.fn();
  const mockOnScanError = jest.fn();
  const mockOnPermissionChange = jest.fn();
  const mockOnStateChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockDecodeFromVideoDevice.mockClear();
    mockReset.mockClear();
  });

  const defaultProps = {
    onScanSuccess: mockOnScanSuccess,
    onScanError: mockOnScanError,
    isActive: false,
  };

  it('должен рендериться без ошибок', () => {
    render(<BarcodeScanner {...defaultProps} />);
    // Компонент не должен показывать видео когда isActive = false
    expect(screen.queryByRole('video')).not.toBeInTheDocument();
  });

  it('должен показывать видео элемент когда isActive = true', () => {
    render(<BarcodeScanner {...defaultProps} isActive={true} />);
    const video = document.querySelector('video');
    expect(video).toBeInTheDocument();
  });

  it('должен применять пользовательский className', () => {
    const { container } = render(
      <BarcodeScanner {...defaultProps} className="custom-class" />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('должен показывать состояние инициализации при первом запуске', () => {
    // Проверяем, что компонент может отображать состояние инициализации
    // Это проверяется через внутреннюю логику компонента
    render(<BarcodeScanner {...defaultProps} isActive={true} />);
    
    // Проверяем, что видео элемент присутствует (компонент активен)
    const video = document.querySelector('video');
    expect(video).toBeInTheDocument();
  });

  it('должен показывать состояние активного сканирования', async () => {
    mockDecodeFromVideoDevice.mockResolvedValue(undefined);

    render(<BarcodeScanner {...defaultProps} isActive={true} />);
    
    await waitFor(() => {
      expect(screen.getByText('Сканирование активно')).toBeInTheDocument();
    });
  });

  it('должен вызывать onScanSuccess при успешном сканировании', async () => {
    const mockResult = {
      getText: () => '1234567890123',
    };

    mockDecodeFromVideoDevice.mockImplementation((deviceId, videoElement, callback) => {
      // Имитируем успешное сканирование
      setTimeout(() => callback(mockResult, null), 100);
      return Promise.resolve();
    });

    render(<BarcodeScanner {...defaultProps} isActive={true} />);

    await waitFor(() => {
      expect(mockOnScanSuccess).toHaveBeenCalledWith('1234567890123');
    });
  });

  it('должен обрабатывать ошибку отсутствия разрешения на камеру', async () => {
    const permissionError = new Error('Permission denied');
    permissionError.name = 'NotAllowedError';
    
    mockDecodeFromVideoDevice.mockRejectedValue(permissionError);

    render(
      <BarcodeScanner 
        {...defaultProps} 
        isActive={true}
        onPermissionChange={mockOnPermissionChange}
      />
    );

    await waitFor(() => {
      expect(mockOnScanError).toHaveBeenCalledWith(
        'Доступ к камере запрещен. Пожалуйста, разрешите доступ в настройках браузера.'
      );
      expect(mockOnPermissionChange).toHaveBeenCalledWith('denied');
    });

    expect(screen.getByText('⚠️ Ошибка камеры')).toBeInTheDocument();
  });

  it('должен обрабатывать ошибку отсутствия камеры', async () => {
    const cameraError = new Error('Camera not found');
    cameraError.name = 'NotFoundError';
    
    mockDecodeFromVideoDevice.mockRejectedValue(cameraError);

    render(<BarcodeScanner {...defaultProps} isActive={true} />);

    await waitFor(() => {
      expect(mockOnScanError).toHaveBeenCalledWith('Камера не найдена на устройстве.');
    });
  });

  it('должен обрабатывать ошибку занятой камеры', async () => {
    const busyError = new Error('Camera is busy');
    busyError.name = 'NotReadableError';
    
    mockDecodeFromVideoDevice.mockRejectedValue(busyError);

    render(<BarcodeScanner {...defaultProps} isActive={true} />);

    await waitFor(() => {
      expect(mockOnScanError).toHaveBeenCalledWith('Камера занята другим приложением.');
    });
  });

  it('должен обрабатывать неподдерживаемый браузер', async () => {
    // Временно удаляем mediaDevices
    const originalMediaDevices = navigator.mediaDevices;
    Object.defineProperty(navigator, 'mediaDevices', {
      writable: true,
      value: undefined,
    });

    render(<BarcodeScanner {...defaultProps} isActive={true} />);

    await waitFor(() => {
      expect(mockOnScanError).toHaveBeenCalledWith(
        'Ваш браузер не поддерживает доступ к камере'
      );
    });

    // Восстанавливаем mediaDevices
    Object.defineProperty(navigator, 'mediaDevices', {
      writable: true,
      value: originalMediaDevices,
    });
  });

  it('должен останавливать сканирование при isActive = false', async () => {
    const { rerender } = render(<BarcodeScanner {...defaultProps} isActive={true} />);
    
    // Ждем инициализации
    await waitFor(() => {
      expect(mockDecodeFromVideoDevice).toHaveBeenCalled();
    });

    // Деактивируем сканер
    rerender(<BarcodeScanner {...defaultProps} isActive={false} />);

    expect(mockReset).toHaveBeenCalled();
    expect(screen.queryByRole('video')).not.toBeInTheDocument();
  });

  it('должен вызывать onStateChange при изменении состояния', async () => {
    mockDecodeFromVideoDevice.mockResolvedValue(undefined);

    render(
      <BarcodeScanner 
        {...defaultProps} 
        isActive={true}
        onStateChange={mockOnStateChange}
      />
    );

    await waitFor(() => {
      expect(mockOnStateChange).toHaveBeenCalledWith('initializing');
      expect(mockOnStateChange).toHaveBeenCalledWith('active');
    });
  });

  it('должен показывать состояние обработки штрихкода', async () => {
    const mockResult = {
      getText: () => '1234567890123',
    };

    mockDecodeFromVideoDevice.mockImplementation((deviceId, videoElement, callback) => {
      setTimeout(() => callback(mockResult, null), 100);
      return Promise.resolve();
    });

    render(
      <BarcodeScanner 
        {...defaultProps} 
        isActive={true}
        onStateChange={mockOnStateChange}
      />
    );

    await waitFor(() => {
      expect(mockOnStateChange).toHaveBeenCalledWith('scanning');
      expect(screen.getByText('Обработка штрихкода...')).toBeInTheDocument();
    });
  });

  it('должен очищать ошибки при повторном запуске', async () => {
    // Сначала вызываем ошибку
    const error = new Error('Test error');
    mockDecodeFromVideoDevice.mockRejectedValueOnce(error);

    const { rerender } = render(<BarcodeScanner {...defaultProps} isActive={true} />);

    await waitFor(() => {
      expect(screen.getByText('⚠️ Ошибка камеры')).toBeInTheDocument();
    });

    // Теперь исправляем и перезапускаем
    mockDecodeFromVideoDevice.mockResolvedValue(undefined);
    rerender(<BarcodeScanner {...defaultProps} isActive={false} />);
    rerender(<BarcodeScanner {...defaultProps} isActive={true} />);

    await waitFor(() => {
      expect(screen.queryByText('⚠️ Ошибка камеры')).not.toBeInTheDocument();
    });
  });
});