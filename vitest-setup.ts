import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Declare the ImageData interface to match the browser specification
declare global {
  interface ImageData {
    readonly data: Uint8ClampedArray;
    readonly width: number;
    readonly height: number;
    readonly colorSpace: PredefinedColorSpace;
  }

  interface ImageDataConstructor {
    new(width: number, height: number): ImageData;
    new(data: Uint8ClampedArray, width: number, height?: number, settings?: ImageDataSettings): ImageData;
    prototype: ImageData;
  }
}

// Implement the ImageData polyfill
class ImageDataPolyfill implements ImageData {
  readonly data: Uint8ClampedArray;
  readonly width: number;
  readonly height: number;
  readonly colorSpace: PredefinedColorSpace;

  constructor(
    width: number,
    height: number,
    data?: Uint8ClampedArray,
    colorSpace: PredefinedColorSpace = 'srgb'
  ) {
    this.width = width;
    this.height = height;
    this.data = data || new Uint8ClampedArray(width * height * 4);
    this.colorSpace = colorSpace;
  }
}

// Create a type-safe ImageData constructor
const createImageData = (
  width: number,
  height: number,
  data?: Uint8ClampedArray,
  colorSpace: PredefinedColorSpace = 'srgb'
): ImageData => new ImageDataPolyfill(width, height, data, colorSpace);

// Assign to global with proper typing
Object.defineProperty(global, 'ImageData', {
  value: createImageData,
  writable: true,
  configurable: true
});
import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { ImageData } from 'canvas';

// Declare the ImageData interface to match the browser specification
declare global {
  interface ImageData {
    readonly data: Uint8ClampedArray;
    readonly width: number;
    readonly height: number;
    readonly colorSpace: PredefinedColorSpace;
  }

  interface ImageDataConstructor {
    new(width: number, height: number): ImageData;
    new(data: Uint8ClampedArray, width: number, height?: number, settings?: ImageDataSettings): ImageData;
    prototype: ImageData;
  }
}

// Implement the ImageData polyfill
class ImageDataPolyfill implements ImageData {
  readonly data: Uint8ClampedArray;
  readonly width: number;
  readonly height: number;
  readonly colorSpace: PredefinedColorSpace;

  constructor(
    width: number,
    height: number,
    data?: Uint8ClampedArray,
    colorSpace: PredefinedColorSpace = 'srgb'
  ) {
    this.width = width;
    this.height = height;
    this.data = data || new Uint8ClampedArray(width * height * 4);
    this.colorSpace = colorSpace;
  }
}

// Create a type-safe ImageData constructor that matches both browser and Node.js environments
const createImageData = (
  width: number,
  height: number,
  data?: Uint8ClampedArray,
  colorSpace: PredefinedColorSpace = 'srgb'
): ImageData => new ImageDataPolyfill(width, height, data, colorSpace);

global.ImageData = createImageData as unknown as typeof ImageData;

// Polyfill DOMMatrix if not available
if (typeof DOMMatrix === 'undefined') {
  class DOMMatrixPolyfill {
    m11 = 1;
    m12 = 0;
    m13 = 0;
    m14 = 0;
    m21 = 0;
    m22 = 1;
    m23 = 0;
    m24 = 0;
    m31 = 0;
    m32 = 0;
    m33 = 1;
    m34 = 0;
    m41 = 0;
    m42 = 0;
    m43 = 0;
    m44 = 1;
    is2D = true;
    isIdentity = true;

    constructor(matrix?: string | number[]) {
      if (matrix) {
        const values = (typeof matrix === 'string'
          ? matrix.split(',').map(Number)
          : matrix).map(v => Number.isNaN(v) ? 0 : v);

        this.m11 = values[0] ?? 1;
        this.m12 = values[1] ?? 0;
        this.m13 = values[2] ?? 0;
        this.m14 = values[3] ?? 0;
        this.m21 = values[4] ?? 0;
        this.m22 = values[5] ?? 1;
        this.m23 = values[6] ?? 0;
        this.m24 = values[7] ?? 0;
        this.m31 = values[8] ?? 0;
        this.m32 = values[9] ?? 0;
        this.m33 = values[10] ?? 1;
        this.m34 = values[11] ?? 0;
        this.m41 = values[12] ?? 0;
        this.m42 = values[13] ?? 0;
        this.m43 = values[14] ?? 0;
        this.m44 = values[15] ?? 1;

        this.isIdentity = this.m11 === 1 && this.m12 === 0 && this.m13 === 0 && this.m14 === 0 &&
                         this.m21 === 0 && this.m22 === 1 && this.m23 === 0 && this.m24 === 0 &&
                         this.m31 === 0 && this.m32 === 0 && this.m33 === 1 && this.m34 === 0 &&
                         this.m41 === 0 && this.m42 === 0 && this.m43 === 0 && this.m44 === 1;
      }
    }

    static fromFloat32Array(array: Float32Array): DOMMatrix {
      return new DOMMatrixPolyfill([...array]) as unknown as DOMMatrix;
    }

    static fromFloat64Array(array: Float64Array): DOMMatrix {
      return new DOMMatrixPolyfill([...array]) as unknown as DOMMatrix;
    }

    static fromMatrix(other?: DOMMatrixInit): DOMMatrix {
      if (!other) {
        return new DOMMatrixPolyfill() as unknown as DOMMatrix;
      }

      const values = [
        other.m11 ?? 1, other.m12 ?? 0, other.m13 ?? 0, other.m14 ?? 0,
        other.m21 ?? 0, other.m22 ?? 1, other.m23 ?? 0, other.m24 ?? 0,
        other.m31 ?? 0, other.m32 ?? 0, other.m33 ?? 1, other.m34 ?? 0,
        other.m41 ?? 0, other.m42 ?? 0, other.m43 ?? 0, other.m44 ?? 1
      ];

      return new DOMMatrixPolyfill(values) as unknown as DOMMatrix;
    }
  }

  global.DOMMatrix = DOMMatrixPolyfill as unknown as typeof DOMMatrix;
}

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
import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Declare the ImageData interface to match the browser specification
declare global {
  interface ImageData {
    readonly data: Uint8ClampedArray;
    readonly width: number;
    readonly height: number;
    readonly colorSpace: PredefinedColorSpace;
  }

  interface ImageDataConstructor {
    new(width: number, height: number): ImageData;
    new(data: Uint8ClampedArray, width: number, height?: number, settings?: ImageDataSettings): ImageData;
    prototype: ImageData;
  }
}

// Implement the ImageData polyfill
class ImageDataPolyfill implements ImageData {
  readonly data: Uint8ClampedArray;
  readonly width: number;
  readonly height: number;
  readonly colorSpace: PredefinedColorSpace;

  constructor(
    width: number,
    height: number,
    data?: Uint8ClampedArray,
    colorSpace: PredefinedColorSpace = 'srgb'
  ) {
    this.width = width;
    this.height = height;
    this.data = data || new Uint8ClampedArray(width * height * 4);
    this.colorSpace = colorSpace;
  }
}

// Create a type-safe ImageData constructor
const createImageData = (
  width: number,
  height: number,
  data?: Uint8ClampedArray,
  colorSpace: PredefinedColorSpace = 'srgb'
): ImageData => new ImageDataPolyfill(width, height, data, colorSpace);

// Assign to global with proper typing
Object.defineProperty(global, 'ImageData', {
  value: createImageData,
  writable: true,
  configurable: true
});
import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Declare the ImageData interface to match the browser specification
declare global {
  interface ImageData {
    readonly data: Uint8ClampedArray;
    readonly width: number;
    readonly height: number;
    readonly colorSpace: PredefinedColorSpace;
  }

  interface ImageDataConstructor {
    new(width: number, height: number): ImageData;
    new(data: Uint8ClampedArray, width: number, height?: number, settings?: ImageDataSettings): ImageData;
    prototype: ImageData;
  }
}

// Implement the ImageData polyfill
class ImageDataPolyfill implements ImageData {
  readonly data: Uint8ClampedArray;
  readonly width: number;
  readonly height: number;
  readonly colorSpace: PredefinedColorSpace;

  constructor(
    width: number,
    height: number,
    data?: Uint8ClampedArray,
    colorSpace: PredefinedColorSpace = 'srgb'
  ) {
    this.width = width;
    this.height = height;
    this.data = data || new Uint8ClampedArray(width * height * 4);
    this.colorSpace = colorSpace;
  }
}

// Create a type-safe ImageData constructor
const createImageData = (
  width: number,
  height: number,
  data?: Uint8ClampedArray,
  colorSpace: PredefinedColorSpace = 'srgb'
): ImageData => new ImageDataPolyfill(width, height, data, colorSpace);

// Assign to global with proper typing
Object.defineProperty(global, 'ImageData', {
  value: createImageData,
  writable: true,
  configurable: true
});
import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Declare the ImageData interface to match the browser specification
declare global {
  interface ImageData {
    readonly data: Uint8ClampedArray;
    readonly width: number;
    readonly height: number;
    readonly colorSpace: PredefinedColorSpace;
  }

  interface ImageDataConstructor {
    new(width: number, height: number): ImageData;
    new(data: Uint8ClampedArray, width: number, height?: number, settings?: ImageDataSettings): ImageData;
    prototype: ImageData;
  }
}

// Implement the ImageData polyfill
class ImageDataPolyfill implements ImageData {
  readonly data: Uint8ClampedArray;
  readonly width: number;
  readonly height: number;
  readonly colorSpace: PredefinedColorSpace;

  constructor(
    width: number,
    height: number,
    data?: Uint8ClampedArray,
    colorSpace: PredefinedColorSpace = 'srgb'
  ) {
    this.width = width;
    this.height = height;
    this.data = data || new Uint8ClampedArray(width * height * 4);
    this.colorSpace = colorSpace;
  }
}

// Create a type-safe ImageData constructor
const createImageData = (
  width: number,
  height: number,
  data?: Uint8ClampedArray,
  colorSpace: PredefinedColorSpace = 'srgb'
): ImageData => new ImageDataPolyfill(width, height, data, colorSpace);

// Assign to global with proper typing
Object.defineProperty(global, 'ImageData', {
  value: createImageData,
  writable: true,
  configurable: true
});
import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Declare the ImageData interface to match the browser specification
declare global {
  interface ImageData {
    readonly data: Uint8ClampedArray;
    readonly width: number;
    readonly height: number;
    readonly colorSpace: PredefinedColorSpace;
  }

  interface ImageDataConstructor {
    new(width: number, height: number): ImageData;
    new(data: Uint8ClampedArray, width: number, height?: number, settings?: ImageDataSettings): ImageData;
    prototype: ImageData;
  }
}

// Implement the ImageData polyfill
class ImageDataPolyfill implements ImageData {
  readonly data: Uint8ClampedArray;
  readonly width: number;
  readonly height: number;
  readonly colorSpace: PredefinedColorSpace;

  constructor(
    width: number,
    height: number,
    data?: Uint8ClampedArray,
    colorSpace: PredefinedColorSpace = 'srgb'
  ) {
    this.width = width;
    this.height = height;
    this.data = data || new Uint8ClampedArray(width * height * 4);
    this.colorSpace = colorSpace;
  }
}

// Create a type-safe ImageData constructor
const createImageData = (
  width: number,
  height: number,
  data?: Uint8ClampedArray,
  colorSpace: PredefinedColorSpace = 'srgb'
): ImageData => new ImageDataPolyfill(width, height, data, colorSpace);

// Assign to global with proper typing
Object.defineProperty(global, 'ImageData', {
  value: createImageData,
  writable: true,
  configurable: true
});
import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { ImageData } from 'canvas';

// Ensure ImageData is properly polyfilled before any mocks are created
class ImageDataPolyfill implements ImageData {
  readonly data: Uint8ClampedArray;
  readonly width: number;
  readonly height: number;
  readonly colorSpace: PredefinedColorSpace;

  constructor(
    width: number,
    height: number,
    data?: Uint8ClampedArray,
    colorSpace: PredefinedColorSpace = 'srgb'
  ) {
    this.width = width;
    this.height = height;
    this.data = data || new Uint8ClampedArray(width * height * 4);
    this.colorSpace = colorSpace;
  }
}

// Create a type-safe ImageData constructor that matches both browser and Node.js environments
const createImageData = (
  width: number,
  height: number,
  data?: Uint8ClampedArray,
  colorSpace: PredefinedColorSpace = 'srgb'
): ImageData => new ImageDataPolyfill(width, height, data, colorSpace);

global.ImageData = createImageData as unknown as typeof ImageData;

// Polyfill DOMMatrix if not available
if (typeof DOMMatrix === 'undefined') {
  class DOMMatrixPolyfill {
    m11 = 1;
    m12 = 0;
    m13 = 0;
    m14 = 0;
    m21 = 0;
    m22 = 1;
    m23 = 0;
    m24 = 0;
    m31 = 0;
    m32 = 0;
    m33 = 1;
    m34 = 0;
    m41 = 0;
    m42 = 0;
    m43 = 0;
    m44 = 1;
    is2D = true;
    isIdentity = true;

    constructor(matrix?: string | number[]) {
      if (matrix) {
        const values = (typeof matrix === 'string'
          ? matrix.split(',').map(Number)
          : matrix).map(v => Number.isNaN(v) ? 0 : v);

        this.m11 = values[0] ?? 1;
        this.m12 = values[1] ?? 0;
        this.m13 = values[2] ?? 0;
        this.m14 = values[3] ?? 0;
        this.m21 = values[4] ?? 0;
        this.m22 = values[5] ?? 1;
        this.m23 = values[6] ?? 0;
        this.m24 = values[7] ?? 0;
        this.m31 = values[8] ?? 0;
        this.m32 = values[9] ?? 0;
        this.m33 = values[10] ?? 1;
        this.m34 = values[11] ?? 0;
        this.m41 = values[12] ?? 0;
        this.m42 = values[13] ?? 0;
        this.m43 = values[14] ?? 0;
        this.m44 = values[15] ?? 1;

        this.isIdentity = this.m11 === 1 && this.m12 === 0 && this.m13 === 0 && this.m14 === 0 &&
                         this.m21 === 0 && this.m22 === 1 && this.m23 === 0 && this.m24 === 0 &&
                         this.m31 === 0 && this.m32 === 0 && this.m33 === 1 && this.m34 === 0 &&
                         this.m41 === 0 && this.m42 === 0 && this.m43 === 0 && this.m44 === 1;
      }
    }

    static fromFloat32Array(array: Float32Array): DOMMatrix {
      return new DOMMatrixPolyfill([...array]) as unknown as DOMMatrix;
    }

    static fromFloat64Array(array: Float64Array): DOMMatrix {
      return new DOMMatrixPolyfill([...array]) as unknown as DOMMatrix;
    }

    static fromMatrix(other?: DOMMatrixInit): DOMMatrix {
      if (!other) {
        return new DOMMatrixPolyfill() as unknown as DOMMatrix;
      }

      const values = [
        other.m11 ?? 1, other.m12 ?? 0, other.m13 ?? 0, other.m14 ?? 0,
        other.m21 ?? 0, other.m22 ?? 1, other.m23 ?? 0, other.m24 ?? 0,
        other.m31 ?? 0, other.m32 ?? 0, other.m33 ?? 1, other.m34 ?? 0,
        other.m41 ?? 0, other.m42 ?? 0, other.m43 ?? 0, other.m44 ?? 1
      ];

      return new DOMMatrixPolyfill(values) as unknown as DOMMatrix;
    }
  }

  global.DOMMatrix = DOMMatrixPolyfill as unknown as typeof DOMMatrix;
}

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
