import { vi } from 'vitest';

// Create a reusable canvas context mock
export const createMockCanvasContext = () => {
  const mockContext = {
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    drawImage: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    // Add more methods as needed for comprehensive mocking
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
        delete (HTMLCanvasElement.prototype as any).getContext;
      }
    }
  };
};

// Export the type for CanvasMock
export type CanvasMock = ReturnType<typeof setupCanvasMock>;
