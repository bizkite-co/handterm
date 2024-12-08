import { vi } from 'vitest';

// Define an interface for the mock canvas context methods
interface MockCanvasContext {
  fillRect: ReturnType<typeof vi.fn>;
  clearRect: ReturnType<typeof vi.fn>;
  drawImage: ReturnType<typeof vi.fn>;
  beginPath: ReturnType<typeof vi.fn>;
  closePath: ReturnType<typeof vi.fn>;
  stroke: ReturnType<typeof vi.fn>;
  fill: ReturnType<typeof vi.fn>;
}

// Create a reusable canvas context mock
export const createMockCanvasContext = (): MockCanvasContext => {
  const mockContext: MockCanvasContext = {
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    drawImage: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
  };

  return mockContext;
};

// Global mock for canvas context
export const setupCanvasMock = () => {
  const originalGetContext = HTMLCanvasElement.prototype.getContext;
  const mockGetContext = vi.fn(() => createMockCanvasContext());

  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    value: mockGetContext,
    configurable: true,
    writable: true
  });

  return {
    mockGetContext,
    restoreOriginalGetContext: () => {
      // Safely restore original implementation
      if (originalGetContext) {
        Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
          value: originalGetContext,
          configurable: true,
          writable: true
        });
      } else {
        // If no original method existed, remove the property
        const canvasProto = HTMLCanvasElement.prototype as { getContext?: unknown };
        delete canvasProto.getContext;
      }
    }
  };
};

// Export the type for CanvasMock
export type CanvasMock = ReturnType<typeof setupCanvasMock>;
