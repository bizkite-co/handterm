import { vi } from 'vitest';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
  removeItem: vi.fn(),
  length: 0,
  key: vi.fn(),
};
global.localStorage = localStorageMock as typeof localStorage;

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

window.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

// Mock requestAnimationFrame
window.requestAnimationFrame = vi.fn((callback) => {
  return setTimeout(callback, 0);
});

// Mock canvas context
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn(() => ({
    data: new Array(4),
  })),
  putImageData: vi.fn(),
  createImageData: vi.fn(),
  setTransform: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  translate: vi.fn(),
  transform: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  fill: vi.fn(),
  arc: vi.fn(),
})) as unknown as typeof HTMLCanvasElement.prototype.getContext;

// Mock xterm.js
const mockTerminal = {
  loadAddon: vi.fn(),
  open: vi.fn(),
  write: vi.fn((_data: string) => {
  }),
  onData: vi.fn((callback) => {
    (window as WindowWithXtermCallback).__xtermDataCallback = (data: string) => {
      callback(data);
    };
    return { dispose: vi.fn() };
  }),
  onKey: vi.fn(),
  clear: vi.fn(),
  focus: vi.fn(),
  dispose: vi.fn(),
  reset: vi.fn(() => {
  }),
  scrollToBottom: vi.fn(),
  buffer: {
    active: {
      cursorX: 2,
      cursorY: 0,
      getLine: () => ({
        translateToString: () => {
          return '> ';
        }
      })
    }
  }
};

vi.mock('xterm', () => ({
  Terminal: vi.fn().mockImplementation(() => mockTerminal)
}));

vi.mock('@xterm/addon-fit', () => ({
  FitAddon: vi.fn().mockImplementation(() => ({
    fit: vi.fn(),
    activate: vi.fn(),
    dispose: vi.fn()
  }))
}));

// Define types for window extensions
interface WindowWithXtermCallback extends Window {
  __xtermDataCallback?: (data: string) => void;
  mockTerminal?: typeof mockTerminal;
  triggerTerminalInput?: (data: string) => void;
}

// Helper to trigger terminal input
function createTriggerTerminalInput(data: string) {
  const xtermDataCallback = (window as WindowWithXtermCallback).__xtermDataCallback;
  if (xtermDataCallback) {
    // For Enter key, ensure we send just \r
    if (data === '\r\n') {
      xtermDataCallback('\r');
    } else {
      xtermDataCallback(data);
    }
  }
}

// Initialize window extensions
(window as WindowWithXtermCallback).__xtermDataCallback = undefined;
(window as WindowWithXtermCallback).triggerTerminalInput = createTriggerTerminalInput;
(window as WindowWithXtermCallback).mockTerminal = mockTerminal;

// Set up callback handler
(window as WindowWithXtermCallback).__xtermDataCallback = (data: string) => {
  (window as WindowWithXtermCallback).__xtermDataCallback?.(data);
};
