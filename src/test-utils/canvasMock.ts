import { vi, type Mock } from 'vitest';

interface MockCanvasContext {
  fillRect: Mock<any, any>;
  clearRect: Mock<any, any>;
  drawImage: Mock<any, any>;
  beginPath: Mock<any, any>;
  closePath: Mock<any, any>;
  stroke: Mock<any, any>;
  fill: Mock<any, any>;
}

export const createMockCanvasContext = (): MockCanvasContext => {
  return {
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    drawImage: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
  };
};

const createRestoreOriginalGetContext = (originalGetContext: typeof HTMLCanvasElement.prototype.getContext): (() => void) => {
  const restoreOriginalGetContext = (): void => {
    if (originalGetContext) {
      Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
        value: originalGetContext,
        configurable: true,
        writable: true
      });
    } else {
      const canvasProto = HTMLCanvasElement.prototype as { getContext?: unknown };
      delete canvasProto.getContext;
    }
  };
  return restoreOriginalGetContext;
}

export const setupCanvasMock = (): {
  mockGetContext: Mock<any, any>;
  restoreOriginalGetContext: () => void;
} => {
  const originalGetContext = HTMLCanvasElement.prototype.getContext.bind(HTMLCanvasElement.prototype);
  const mockGetContext = vi.fn(() => createMockCanvasContext());

  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    value: mockGetContext,
    configurable: true,
    writable: true
  });

  return {
    mockGetContext,
    restoreOriginalGetContext: createRestoreOriginalGetContext(originalGetContext)
  };
};

export type CanvasMock = ReturnType<typeof setupCanvasMock>;
