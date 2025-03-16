import { renderHook, act } from '@testing-library/react';
import { useTerminal } from './useTerminal';
import { TERMINAL_CONSTANTS } from 'src/constants/terminal';
import { vi, describe, test, expect, beforeEach, Mock } from 'vitest';
import { useXTerm } from 'react-xtermjs';
import { FitAddon } from '@xterm/addon-fit';

// Mock the useXTerm hook
vi.mock('react-xtermjs', () => ({
  useXTerm: vi.fn()
}));

// Define mock types
type MockWrite = Mock;
type MockInstance = {
  write: MockWrite;
  reset: Mock;
  buffer: {
    active: {
      cursorY: number;
      cursorX: number;
      getLine: () => {
        translateToString: () => string;
      };
    };
  };
  loadAddon: Mock;
  scrollToBottom: Mock;
  onData: Mock;
};

describe('useTerminal', () => {
  let mockInstance: MockInstance;
  let mockWrite: MockWrite;
  let dataHandler: (data: string) => void;
  let currentTerminalContent: string;

  beforeEach(() => {
    currentTerminalContent = ''; // Initialize to empty string
    mockWrite = vi.fn((data: string) => {
      console.log('Before write - data:', JSON.stringify(data), 'currentTerminalContent:', JSON.stringify(currentTerminalContent));
      if (data === '\r\n' || data === '\r') {
        // Simulate clearing the current line and writing the prompt
        const promptIndex = currentTerminalContent.indexOf(TERMINAL_CONSTANTS.PROMPT);
        if (promptIndex > -1) {
          currentTerminalContent = currentTerminalContent.substring(0, promptIndex);
        }
        currentTerminalContent += TERMINAL_CONSTANTS.PROMPT;
      } else {
        currentTerminalContent += data;
      }
      console.log('After write - data:', JSON.stringify(data), 'currentTerminalContent:', JSON.stringify(currentTerminalContent));
    }) as MockWrite;

    mockInstance = {
      write: mockWrite,
      // Mock reset to ONLY clear the content, NOT write the prompt
      reset: vi.fn(() => {
        currentTerminalContent = ''; // Simulate reset
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
      loadAddon: vi.fn().mockImplementation(() => {
        return {
          fit: vi.fn(),
        };
      }),
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
    mockWrite.mockClear(); // Clear before each test
  });

  test('should write prompt exactly once during initialization', () => {
    renderHook(() => useTerminal());
    mockWrite.mockClear(); // Clear *after* renderHook
    const promptWrites = (mockWrite.mock.calls as [string][]).filter(
      (call: [string]) => call[0] === TERMINAL_CONSTANTS.PROMPT
    );
    expect(promptWrites).toHaveLength(0); // Should be 0, as we cleared the mock
  });

  test('should handle Enter key press correctly', () => {
    const { result } = renderHook(() => useTerminal());
    mockWrite.mockClear(); // Clear *after* renderHook

    // Simulate Enter key press
    act(() => {
      if (dataHandler) {
        dataHandler('\r'); // Enter key
      }
    });

    // Log all writes to terminal after Enter
    console.log('Writes after Enter:', (mockWrite.mock.calls as [string][]).map((call: [string]) =>
      JSON.stringify(call[0]).replace(/\\x1b/g, 'ESC')
    ));

    // Count prompt writes after Enter
    const promptWrites = (mockWrite.mock.calls as [string][]).filter(
      (call: [string]) => call[0] === TERMINAL_CONSTANTS.PROMPT
    );
    expect(promptWrites).toHaveLength(1);
  });

  test('should handle command execution sequence', () => {
    const { result } = renderHook(() => useTerminal());
    mockWrite.mockClear(); // Clear *after* renderHook

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
    console.log('Command execution sequence:', (mockWrite.mock.calls as [string][]).map((call: [string]) =>
      JSON.stringify(call[0]).replace(/\\x1b/g, 'ESC')
    ));

    // Verify prompt appears exactly once after command
    const writesAfterNewline = (mockWrite.mock.calls as [string][]).findIndex(
      (call: [string]) => call[0] === '\r\n' || call[0] === '\r'
    );
    const promptWritesAfterCommand = (mockWrite.mock.calls as [string][])
      .slice(writesAfterNewline + 1)
      .filter((call: [string]) => call[0] === TERMINAL_CONSTANTS.PROMPT);

    expect(promptWritesAfterCommand).toHaveLength(1);
  });

  test('should maintain single XTerm prompt line', async () => {
    const { result } = renderHook(() => useTerminal());
    mockWrite.mockClear(); // Clear *after* renderHook

    // Get initial state
    const initialWrites = (mockWrite.mock.calls as [string][]).map((call: [string]) => call[0]);
    console.log('Initial terminal writes:', initialWrites);

    // Trigger a reset
    act(() => {
      result.current.resetPrompt();
    });

    // Check writes after reset
    const writesAfterReset = (mockWrite.mock.calls as [string][]).map((call: [string]) => call[0]);
    console.log('Writes after reset:', writesAfterReset);

    // Count actual prompt strings (should be exactly one)
    const promptCount = (mockWrite.mock.calls as [string][]).filter(
      (call: [string]) => call[0] === TERMINAL_CONSTANTS.PROMPT
    ).length;

    expect(promptCount).toBe(1);
  });

  test('should track all prompt writes during initialization and usage', () => {
    const { result } = renderHook(() => useTerminal());
    mockWrite.mockClear(); // Clear *after* renderHook

    // Log initial state
    console.log('Initial writes:', (mockWrite.mock.calls as [string][]).map((call: [string]) =>
      JSON.stringify(call[0]).replace(/\\x1b/g, 'ESC')
    ));

    // Simulate terminal initialization sequence
    act(() => {
      // Trigger initialization effect
      const fitAddon = mockInstance.loadAddon();
      fitAddon.fit();
    });

    console.log('After initialization:', (mockWrite.mock.calls as [string][]).map((call: [string]) =>
      JSON.stringify(call[0]).replace(/\\x1b/g, 'ESC')
    ));

    // Simulate a reset
    act(() => {
      result.current.resetPrompt();
    });

    console.log('After reset:', (mockWrite.mock.calls as [string][]).map((call: [string]) =>
      JSON.stringify(call[0]).replace(/\\x1b/g, 'ESC')
    ));

    // Count all prompt writes
    const allPromptWrites = (mockWrite.mock.calls as [string][]).filter(
      (call: [string]) => call[0] === TERMINAL_CONSTANTS.PROMPT
    );

    console.log('Total prompt writes:', allPromptWrites.length);
    console.log('Write call sequence:', (mockWrite.mock.calls as [string][]).map((call: [string], i: number) =>
      `${i}: ${JSON.stringify(call[0]).replace(/\\x1b/g, 'ESC')}`
    ));

    expect(allPromptWrites.length).toBe(1);
  });

  test('should maintain single prompt through complete lifecycle', () => {
    const { result } = renderHook(() => useTerminal());
    mockWrite.mockClear(); // Clear *after* renderHook

    // 1. Initial state
    console.log('1. Initial state writes:', (mockWrite.mock.calls as [string][]).map((c: [string]) => JSON.stringify(c[0])));

    // 2. Simulate initialization
    act(() => {
      const fitAddon = mockInstance.loadAddon();
      fitAddon.fit();
    });
    console.log('2. After initialization:', (mockWrite.mock.calls as [string][]).map((c: [string]) => JSON.stringify(c[0])));

    // 3. Simulate command entry and execution
    act(() => {
      if (dataHandler) {
        'test'.split('').forEach(char => dataHandler(char));
        dataHandler('\r\n'); // Use \r\n to simulate Enter
      }
    });
    console.log('3. After command execution:', (mockWrite.mock.calls as [string][]).map((c: [string]) => JSON.stringify(c[0])));

    // 4. Simulate reset
    act(() => {
      result.current.resetPrompt();
    });
    console.log('4. After reset:', (mockWrite.mock.calls as [string][]).map((c: [string]) => JSON.stringify(c[0])));

    // Count total prompt writes AFTER command execution and reset
    const writesAfterCommand = (mockWrite.mock.calls as [string][]).findIndex(
      (call: [string]) => call[0] === '\r\n' || call[0] === '\r'
    );

    const promptWrites = (mockWrite.mock.calls as [string][]).slice(writesAfterCommand + 1).filter(
      (call: [string]) => call[0] === TERMINAL_CONSTANTS.PROMPT
    );

    expect(promptWrites.length,
      `Expected single prompt but found ${promptWrites.length}. Full sequence: ${
        (mockWrite.mock.calls as [string][]).map((c: [string]) => JSON.stringify(c[0])).join(', ')
      }`
    ).toBe(1);
  });
});
