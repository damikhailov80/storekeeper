// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

require('@testing-library/jest-dom');

// Mock Prisma client for tests
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    product: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  })),
  Decimal: jest.fn().mockImplementation((value) => ({
    toNumber: () => parseFloat(value),
    toString: () => value.toString(),
    valueOf: () => parseFloat(value),
  })),
}));

// Mock @zxing/library for barcode scanner tests
jest.mock('@zxing/library', () => ({
  BrowserMultiFormatReader: jest.fn().mockImplementation(() => ({
    decodeFromVideoDevice: jest.fn(),
    reset: jest.fn(),
  })),
  NotFoundException: class NotFoundException extends Error {
    constructor(message = 'Not found') {
      super(message);
      this.name = 'NotFoundException';
    }
  },
}));

// Mock navigator.mediaDevices for camera tests
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: jest.fn(),
  },
});