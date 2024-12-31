import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Automatically cleanup after each test
afterEach(() => {
  cleanup();
});

interface MockCanvasContext extends Omit<CanvasRenderingContext2D, 'canvas' | 'getContextAttributes'> {
  canvas: HTMLCanvasElement;
  getContextAttributes(): CanvasRenderingContext2DSettings;
}

// Create a type-safe mock of CanvasRenderingContext2D
const createMockContext = (): MockCanvasContext => {
  // First create a partial context with basic properties
  const baseContext = {
    canvas: document.createElement('canvas'),
    getContextAttributes: vi.fn().mockReturnValue({
      alpha: true,
      desynchronized: false,
      colorSpace: 'srgb'
    }),
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
    fontKerning: 'auto',
    fontStretch: 'normal',
    fontVariantCaps: 'normal',
    textRendering: 'auto',
    letterSpacing: '0px',
    wordSpacing: '0px',
  };

  // Create method mocks with proper overload signatures
  const methodMocks = {
    // Methods
    arc: vi.fn(),
    arcTo: vi.fn(),
    beginPath: vi.fn(),
    bezierCurveTo: vi.fn(),
    clearRect: vi.fn(),
    clip: vi.fn(),
    closePath: vi.fn(),
    createConicGradient: vi.fn().mockReturnValue({} as CanvasGradient),
    createImageData: vi.fn().mockImplementation((width: number, height: number) => new ImageData(width || 1, height || 1)),
    createLinearGradient: vi.fn().mockReturnValue({} as CanvasGradient),
    createPattern: vi.fn().mockReturnValue(null),
    createRadialGradient: vi.fn().mockReturnValue({} as CanvasGradient),
    drawFocusIfNeeded: vi.fn(),
    drawImage: vi.fn().mockImplementation(
      (
        _image: CanvasImageSource,
        _dx: number,
        _dy: number,
        _dw?: number,
        _dh?: number,
        _sx?: number,
        _sy?: number,
        _sw?: number,
        _sh?: number
      ): void => {
        // Count non-undefined arguments to determine which overload was called
        const argCount = [_image, _dx, _dy, _dw, _dh, _sx, _sy, _sw, _sh].filter(
          (arg) => arg !== undefined
        ).length;

        if (argCount === 3 || argCount === 5 || argCount === 9) {
          return;
        }
        throw new Error('Invalid number of arguments for drawImage');
      }
    ),
    ellipse: vi.fn(),
    fill: vi.fn(),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    getImageData: vi.fn().mockReturnValue(new ImageData(1, 1)),
    getLineDash: vi.fn().mockReturnValue([]),
    getTransform: vi.fn().mockReturnValue(new DOMMatrix()),
    isContextLost: vi.fn().mockReturnValue(false),
    isPointInPath: vi.fn().mockReturnValue(false),
    isPointInStroke: vi.fn().mockReturnValue(false),
    lineTo: vi.fn(),
    measureText: vi.fn().mockReturnValue({
      width: 0,
      actualBoundingBoxAscent: 0,
      actualBoundingBoxDescent: 0,
      actualBoundingBoxLeft: 0,
      actualBoundingBoxRight: 0,
      fontBoundingBoxAscent: 0,
      fontBoundingBoxDescent: 0,
      alphabeticBaseline: 0,
      emHeightAscent: 0,
      emHeightDescent: 0,
      hangingBaseline: 0,
      ideographicBaseline: 0
    }),
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
    translate: vi.fn()
  };

  // Combine base context and method mocks, then cast to the required type
  return { ...baseContext, ...methodMocks } as unknown as MockCanvasContext;
};

// Type-safe mock canvas
const mockCanvasContext = createMockContext();
const getContextMock = vi.fn().mockImplementation((contextId: string): CanvasRenderingContext2D | null => {
  return contextId === '2d' ? mockCanvasContext : null;
});

// Mock ResizeObserver
class ResizeObserverMock implements ResizeObserver {
  constructor(private callback: ResizeObserverCallback) {}
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

// Setup global mocks
global.ResizeObserver = ResizeObserverMock;
global.HTMLCanvasElement.prototype.getContext = getContextMock;
global.HTMLCanvasElement.prototype.toDataURL = vi.fn().mockReturnValue('');

// Mock window properties commonly used in React components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
});

// Mock IntersectionObserver
class IntersectionObserverMock implements IntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin = '0px';
  readonly thresholds: ReadonlyArray<number> = [0];

  constructor(private callback: IntersectionObserverCallback) {}

  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn().mockReturnValue([]);
}

global.IntersectionObserver = IntersectionObserverMock;

// Suppress console errors during tests but keep them available for inspection
const originalConsoleError = console.error;
console.error = vi.fn((...args: unknown[]) => {
  if (process.env.NODE_ENV === 'test') {
    return;
  }
  originalConsoleError(...args);
});

// Cleanup function to restore console.error
afterEach(() => {
  vi.mocked(console.error).mockClear();
});
