import { renderHook, act } from '@testing-library/react';
import { useTerminal } from './useTerminal';
import { TERMINAL_CONSTANTS } from 'src/constants/terminal';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import { useXTerm } from 'react-xtermjs';

// Mock the useXTerm hook
vi.mock('react-xtermjs', () => ({
  useXTerm: vi.fn()
}));

// Define mock types
type MockWrite = vi.Mock<[string], void>;
type MockInstance = {
  write: MockWrite;
  reset: vi.Mock;
  buffer: {
    active: {
      cursorY: number;
      cursorX: number;
      getLine: () => {
        translateToString: () => string;
      };
    };
  };
  loadAddon: vi.Mock;
  scrollToBottom: vi.Mock;
  onData: vi.Mock;
};

describe('useTerminal', () => {
  let mockInstance: MockInstance;
  let mockWrite: MockWrite;
  let dataHandler: (data: string) => void;

  beforeEach(() => {
    mockWrite = vi.fn() as MockWrite;
    mockInstance = {
      write: mockWrite,
      reset: vi.fn(),
      buffer: {
        active: {
          cursorY: 0,
          cursorX: TERMINAL_CONSTANTS.PROMPT_LENGTH,
          getLine: () => ({
            translateToString: () => TERMINAL_CONSTANTS.PROMPT
          })
        }
      },
      loadAddon: vi.fn(),
      scrollToBottom: vi.fn(),
      onData: vi.fn((handler) => {
        dataHandler = handler;
        return { dispose: vi.fn() };
      })
    };

    (useXTerm as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      instance: mockInstance,
      ref: { current: null }
    });
  });

  test('should write prompt exactly once during initialization', () => {
    renderHook(() => useTerminal());

    const promptWrites = mockWrite.mock.calls.filter(
      call => call[0] === TERMINAL_CONSTANTS.PROMPT
    );
    expect(promptWrites).toHaveLength(1);
  });

  test('should handle Enter key press correctly', () => {
    const { result } = renderHook(() => useTerminal());
    mockWrite.mockClear(); // Clear initialization calls

    // Simulate Enter key press
    act(() => {
      if (dataHandler) {
        dataHandler('\r'); // Enter key
      }
    });

    // Log all writes to terminal after Enter
    console.log('Writes after Enter:', mockWrite.mock.calls.map(call =>
      JSON.stringify(call[0]).replace(/\\x1b/g, 'ESC')
    ));

    // Count prompt writes after Enter
    const promptWrites = mockWrite.mock.calls.filter(
      call => call[0] === TERMINAL_CONSTANTS.PROMPT
    );
    expect(promptWrites).toHaveLength(1);
  });

  test('should handle command execution sequence', () => {
    const { result } = renderHook(() => useTerminal());
    mockWrite.mockClear();

    // Simulate a complete command sequence
    act(() => {
      if (dataHandler) {
        // Type 'test' command
        'test'.split('').forEach(char => dataHandler(char));
        // Press Enter
        dataHandler('\r');
      }
    });

    // Log the sequence of terminal writes
    console.log('Command execution sequence:', mockWrite.mock.calls.map(call =>
      JSON.stringify(call[0]).replace(/\\x1b/g, 'ESC')
    ));

    // Verify prompt appears exactly once after command
    const writesAfterNewline = mockWrite.mock.calls.findIndex(
      call => call[0] === '\r\n'
    );
    const promptWritesAfterCommand = mockWrite.mock.calls
      .slice(writesAfterNewline)
      .filter(call => call[0] === TERMINAL_CONSTANTS.PROMPT);

    expect(promptWritesAfterCommand).toHaveLength(1);
  });
});
