import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import type { Mock } from 'vitest';

// Automatically cleanup after each test
afterEach(() => {
  cleanup();
});

// Create a type-safe mock of CanvasRenderingContext2D
const createMockContext = () => {
  const context = {
    canvas: document.createElement('canvas'),
    getContextAttributes: vi.fn(() => ({
      alpha: true,
      desynchronized: false,
      colorSpace: 'srgb',
      willReadFrequently: false,
    })),
    // Properties
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    fillStyle: '#000',
    strokeStyle: '#000',
    filter: 'none',
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'low' as const,
    lineCap: 'butt' as const,
    lineDashOffset: 0,
    lineJoin: 'miter' as const,
    lineWidth: 1,
    miterLimit: 10,
    shadowBlur: 0,
    shadowColor: 'rgba(0, 0, 0, 0)',
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    direction: 'ltr' as const,
    font: '10px sans-serif',
    textAlign: 'start' as const,
    textBaseline: 'alphabetic' as const,

    // Methods
    arc: vi.fn(),
    arcTo: vi.fn(),
    beginPath: vi.fn(),
    bezierCurveTo: vi.fn(),
    clearRect: vi.fn(),
    clip: vi.fn(),
    closePath: vi.fn(),
    createConicGradient: vi.fn(),
    createImageData: vi.fn(() => new ImageData(1, 1)),
    createLinearGradient: vi.fn(),
    createPattern: vi.fn(),
    createRadialGradient: vi.fn(),
    drawImage: vi.fn(),
    ellipse: vi.fn(),
    fill: vi.fn(),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    getImageData: vi.fn(() => new ImageData(1, 1)),
    getLineDash: vi.fn(() => []),
    getTransform: vi.fn(() => new DOMMatrix()),
    isPointInPath: vi.fn(() => false),
    isPointInStroke: vi.fn(() => false),
    lineTo: vi.fn(),
    measureText: vi.fn(() => ({
      width: 0,
      actualBoundingBoxAscent: 0,
      actualBoundingBoxDescent: 0,
      actualBoundingBoxLeft: 0,
      actualBoundingBoxRight: 0,
      fontBoundingBoxAscent: 0,
      fontBoundingBoxDescent: 0,
    })),
    moveTo: vi.fn(),
    putImageData: vi.fn(),
    quadraticCurveTo: vi.fn(),
    rect: vi.fn(),
    reset: vi.fn(),
    resetTransform: vi.fn(),
    restore: vi.fn(),
    rotate: vi.fn(),
    roundRect: vi.fn(),
    save: vi.fn(),
    scale: vi.fn(),
    setLineDash: vi.fn(),
    setTransform: vi.fn(),
    stroke: vi.fn(),
    strokeRect: vi.fn(),
    strokeText: vi.fn(),
    transform: vi.fn(),
    translate: vi.fn(),
    isContextLost: vi.fn(() => false),
  };

  return context as unknown as CanvasRenderingContext2D;
};

// Type-safe mock canvas
const mockCanvasContext = createMockContext();
const getContextMock = vi.fn((contextId: string, _options?: any) => {
  if (contextId === '2d') {
    return mockCanvasContext;
  }
  return null;
}) as unknown as typeof HTMLCanvasElement.prototype.getContext;

// Mock ResizeObserver
class ResizeObserverMock implements ResizeObserver {
  constructor(private callback: ResizeObserverCallback) {}
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

// Setup global mocks
global.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
global.HTMLCanvasElement.prototype.getContext = getContextMock;
global.HTMLCanvasElement.prototype.toDataURL = vi.fn(() => '');

// Mock window properties commonly used in React components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
class IntersectionObserverMock implements IntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '0px';
  readonly thresholds: ReadonlyArray<number> = [0];

  constructor(private callback: IntersectionObserverCallback) {}

  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);
}

global.IntersectionObserver = IntersectionObserverMock as unknown as typeof IntersectionObserver;

// Suppress console errors during tests but keep them available for inspection
const originalConsoleError = console.error;
console.error = vi.fn((...args) => {
  if (process.env.NODE_ENV === 'test') {
    return;
  }
  originalConsoleError(...args);
});

// Cleanup function to restore console.error
afterEach(() => {
  (console.error as Mock).mockClear();
});
