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
  let currentTerminalContent: string;

  beforeEach(() => {
    currentTerminalContent = TERMINAL_CONSTANTS.PROMPT;
    mockWrite = vi.fn((data: string) => {
      if (data === '\r\n') {
        currentTerminalContent = '';
      } else {
        currentTerminalContent += data;
      }
    }) as MockWrite;

    mockInstance = {
      write: mockWrite,
      reset: vi.fn(() => {
        currentTerminalContent = '';
      }),
      buffer: {
        active: {
          cursorY: 0,
          cursorX: TERMINAL_CONSTANTS.PROMPT_LENGTH,
          getLine: () => ({
            translateToString: () => currentTerminalContent
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

  test('should maintain single XTerm prompt line', async () => {
    const { result } = renderHook(() => useTerminal());
    mockWrite.mockClear(); // Clear initialization calls

    // Get initial state
    const initialWrites = mockWrite.mock.calls.map(call => call[0]);
    console.log('Initial terminal writes:', initialWrites);

    // Trigger a reset
    act(() => {
      result.current.resetPrompt();
    });

    // Check writes after reset
    const writesAfterReset = mockWrite.mock.calls.map(call => call[0]);
    console.log('Writes after reset:', writesAfterReset);

    // Count actual prompt strings (should be exactly one)
    const promptCount = mockWrite.mock.calls.filter(
      call => call[0] === TERMINAL_CONSTANTS.PROMPT
    ).length;

    expect(promptCount).toBe(1);
  });

  test('should track all prompt writes during initialization and usage', () => {
    const { result } = renderHook(() => useTerminal());

    // Clear any initialization writes
    mockWrite.mockClear();

    // Log initial state
    console.log('Initial writes:', mockWrite.mock.calls.map(call =>
      JSON.stringify(call[0]).replace(/\\x1b/g, 'ESC')
    ));

    // Simulate terminal initialization sequence
    act(() => {
      // Trigger initialization effect
      if (mockInstance.loadAddon.mock.calls.length > 0) {
        const fitAddon = mockInstance.loadAddon.mock.calls[0][0];
        fitAddon.fit();
      }
    });

    console.log('After initialization:', mockWrite.mock.calls.map(call =>
      JSON.stringify(call[0]).replace(/\\x1b/g, 'ESC')
    ));

    // Simulate a reset
    act(() => {
      result.current.resetPrompt();
    });

    console.log('After reset:', mockWrite.mock.calls.map(call =>
      JSON.stringify(call[0]).replace(/\\x1b/g, 'ESC')
    ));

    // Count all prompt writes
    const allPromptWrites = mockWrite.mock.calls.filter(
      call => call[0] === TERMINAL_CONSTANTS.PROMPT
    );

    console.log('Total prompt writes:', allPromptWrites.length);
    console.log('Write call sequence:', mockWrite.mock.calls.map((call, i) =>
      `${i}: ${JSON.stringify(call[0]).replace(/\\x1b/g, 'ESC')}`
    ));

    expect(allPromptWrites.length).toBe(1);
  });

  test('should maintain single prompt through complete lifecycle', () => {
    const { result } = renderHook(() => useTerminal());
    mockWrite.mockClear();

    // 1. Initial state
    console.log('1. Initial state writes:', mockWrite.mock.calls.map(c => JSON.stringify(c[0])));

    // 2. Simulate initialization
    act(() => {
      if (mockInstance.loadAddon.mock.calls.length > 0) {
        const fitAddon = mockInstance.loadAddon.mock.calls[0][0];
        fitAddon.fit();
      }
    });
    console.log('2. After initialization:', mockWrite.mock.calls.map(c => JSON.stringify(c[0])));

    // 3. Simulate command entry and execution
    act(() => {
      if (dataHandler) {
        'test'.split('').forEach(char => dataHandler(char));
        dataHandler('\r');
      }
    });
    console.log('3. After command execution:', mockWrite.mock.calls.map(c => JSON.stringify(c[0])));

    // 4. Simulate reset
    act(() => {
      result.current.resetPrompt();
    });
    console.log('4. After reset:', mockWrite.mock.calls.map(c => JSON.stringify(c[0])));

    // Count total prompt writes
    const promptWrites = mockWrite.mock.calls.filter(
      call => call[0] === TERMINAL_CONSTANTS.PROMPT
    );

    expect(promptWrites.length,
      `Expected single prompt but found ${promptWrites.length}. Full sequence: ${
        mockWrite.mock.calls.map(c => JSON.stringify(c[0])).join(', ')
      }`
    ).toBe(1);
  });
});
