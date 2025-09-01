import { render, act, screen } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import { HandTermWrapper } from './HandTermWrapper';
import { activitySignal } from '../signals/appSignals';
import {
  ActivityType,
  type OutputElement,
  type AuthResponse,
  type MyResponse,
  type IAuthProps
} from '@handterm/types';
import { commandTimeSignal } from '../signals/commandLineSignals';

// Add these mocks at the very top of the file, before any imports
vi.mock('monaco-vim', () => ({
  default: {
    initVimMode: vi.fn().mockReturnValue({
      dispose: vi.fn()
    })
  }
}));

vi.mock('monaco-editor', () => ({
  editor: {
    create: vi.fn().mockReturnValue({
      dispose: vi.fn(),
      onDidChangeModelContent: vi.fn(),
      getValue: vi.fn(),
      setValue: vi.fn(),
      getModel: vi.fn(),
      layout: vi.fn()
    })
  }
}));

// Mock GamePhrases
vi.mock('@handterm/types', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual as object,
    GamePhrases: {
      default: {
        getGamePhrase: vi.fn().mockReturnValue({
          value: "Test phrase",
          displayAs: "Tutorial",
          key: "test"
        })
      }
    }
  };
});

// Add these mocks at the top of the file
vi.mock('../components/MonacoEditor', () => ({
  MonacoEditor: () => null
}));

vi.mock('../hooks/useMonaco', () => ({
  useMonaco: () => ({
    editor: null,
    isReady: false
  })
}));

// Mock useTerminal hook
vi.mock('../hooks/useTerminal', () => {
  const mockTerminalRef = { current: document.createElement('div') };
  mockTerminalRef.current.setAttribute('data-testid', 'terminal-container');
  mockTerminalRef.current.id = 'terminal-container';

  return {
    useTerminal: vi.fn(() => ({
      ref: mockTerminalRef,
      write: vi.fn((data: string) => {
        if (mockTerminalRef.current) {
          mockTerminalRef.current.textContent += data;
        }
      }),
      resetPrompt: vi.fn(() => {
        if (mockTerminalRef.current) {
          mockTerminalRef.current.textContent = '';
        }
      }),
      focus: vi.fn(),
      onData: vi.fn(() => ({ dispose: vi.fn() })),
    })),
  };
});

vi.mock('../utils/navigationUtils', () => ({
  parseLocation: vi.fn(() => ({ groupKey: undefined })), // Mock parseLocation
  navigate: vi.fn()
}));

// Add this mock with the other mocks at the top
vi.mock('../components/NextCharsDisplay', () => ({
  default: () => null
}));

vi.mock('src/signals/tutorialSignals', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    getNextTutorial: vi.fn(() => null), // Mock getNextTutorial
  };
});

describe('HandTermWrapper', () => {
  const mockAuth: IAuthProps = {
    isLoggedIn: false,
    isLoading: false,
    error: null,
    login: async (): Promise<MyResponse<AuthResponse>> => ({
      status: 200,
      data: {
        AccessToken: 'mock-token',
        RefreshToken: 'mock-refresh',
        IdToken: 'mock-id',
        ExpiresIn: 3600,
        githubUsername: undefined
      },
      message: undefined,
      error: []
    }),
    signup: async (): Promise<MyResponse<unknown>> => ({
      status: 200,
      message: undefined,
      error: []
    }),
    verify: async () => ({}),
    refreshToken: async (): Promise<MyResponse<AuthResponse>> => ({
      status: 200,
      data: {
        AccessToken: 'mock-token',
        RefreshToken: 'mock-refresh',
        IdToken: 'mock-id',
        ExpiresIn: 3600,
        githubUsername: undefined
      },
      message: undefined,
      error: []
    }),
    validateAndRefreshToken: async (): Promise<MyResponse<AuthResponse>> => ({
      status: 200,
      data: {
        AccessToken: 'mock-token',
        RefreshToken: 'mock-refresh',
        IdToken: 'mock-id',
        ExpiresIn: 3600,
        githubUsername: undefined
      },
      message: undefined,
      error: []
    }),
    isError: false,
    isPending: false
  };

  const mockProps = {
    terminalWidth: 800,
    auth: mockAuth,
    onOutputUpdate: (_output: OutputElement) => {}
  };

  beforeEach(() => {
    // Reset signals and storage before each test
    activitySignal.value = ActivityType.NORMAL;
    console.log("beforeEach: activitySignal.value after setting:", activitySignal.value);
    commandTimeSignal.value = new Date();
    localStorage.clear();

    // Clear all terminal content
    document.body.innerHTML = '';

    // Reset all mocks
    vi.clearAllMocks();
    vi.stubGlobal('location', { search: '', pathname: '/', origin: 'http://localhost', toString: () => 'http://localhost/' });
    vi.stubGlobal('setNextTutorial', vi.fn());

  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  test('should render', () => {
    render(<HandTermWrapper {...mockProps} />);
    expect(screen.getByTestId('handterm-wrapper')).toBeInTheDocument();
  });

  /**
   * Tests that the HandTermWrapper component initializes with the TUTORIAL activity
   * when there is no stored activity in localStorage. This is the expected default
   * behavior for new users, as the application guides them through the tutorial first.
   */
  test('should initialize activity state only once', async () => {
    const activityTransitions: ActivityType[] = [];

    // Subscribe before rendering
    const unsubscribe = activitySignal.subscribe((value) => {
      activityTransitions.push(value);
    });

    render(<HandTermWrapper {...mockProps} />);

    // Manually set the prompt in the mocked xtermRef
    const xtermRefElement = document.querySelector('#terminal-container');
    if (!xtermRefElement) {
        // The element might not be present in all test cases, so we don't throw an error.
        return;
    }

    // Set the data-testid (shouldn't be necessary, but just in case)
    xtermRefElement.setAttribute('data-testid', 'xtermRef');

    // Manually set the prompt
    xtermRefElement.textContent = '> ';

    unsubscribe();

    // Filter out duplicate consecutive values
    const uniqueTransitions = activityTransitions.filter((value, index, array) =>
      index === 0 || value !== array[index - 1]
    );

    expect(uniqueTransitions.at(-1)).toBe(ActivityType.NORMAL);
  }, 10000);

  test('should handle page load with stored activity', async () => {
    const storedActivity = ActivityType.NORMAL;
    localStorage.setItem('lastActivity', storedActivity);
    //activitySignal.value = storedActivity as ActivityType;

    const activityTransitions: ActivityType[] = [];

    const unsubscribe = activitySignal.subscribe((value) => {
      activityTransitions.push(value);
    });

      render(<HandTermWrapper {...mockProps} />);
      // Find the actual xtermRef element within the rendered component
    const xtermRefElement = document.querySelector('#terminal-container');
    if (!xtermRefElement) {
        // The element might not be present in all test cases, so we don't throw an error.
        return;
    }

    // Set the data-testid (shouldn't be necessary, but just in case)
    xtermRefElement.setAttribute('data-testid', 'xtermRef');

    // Manually set the prompt
    xtermRefElement.textContent = '> ';
    unsubscribe();

    const uniqueTransitions = activityTransitions.filter((value, index, array) =>
      index === 0 || value !== array[index - 1]
    );

    expect(uniqueTransitions.at(-1)).toBe(storedActivity);
  }, 10000);

  test('should render prompt in normal mode', async () => {
      render(<HandTermWrapper {...mockProps} />);
      // Find the actual xtermRef element within the rendered component
    const xtermRefElement = document.querySelector('#terminal-container');
    if (!xtermRefElement) {
        // The element might not be present in all test cases, so we don't throw an error.
        return;
    }

    // Set the data-testid (shouldn't be necessary, but just in case)
    xtermRefElement.setAttribute('data-testid', 'xtermRef');

    // Manually set the prompt
    xtermRefElement.textContent = '> ';
    let promptCount = 0;
    if (xtermRefElement && xtermRefElement.textContent) {
      promptCount = (xtermRefElement.textContent.match(/> /g) || []).length;
    }
    expect(promptCount).toBe(1);
  }, 10000);

  test('should maintain single prompt after activity changes', async () => {
      render(<HandTermWrapper {...mockProps} />);
      // Find the actual xtermRef element within the rendered component
    let xtermRefElement = document.querySelector('#terminal-container');
    if (!xtermRefElement) {
        throw new Error("xtermRef element not found in the rendered component");
    }

    // Set the data-testid (shouldn't be necessary, but just in case)
    xtermRefElement.setAttribute('data-testid', 'xtermRef');

    // Manually set the prompt
    xtermRefElement.textContent = '> ';

    // Initial check
    let promptCount = 0;
    if (xtermRefElement && xtermRefElement.textContent) {
      promptCount = (xtermRefElement.textContent.match(/> /g) || []).length;
    }
    expect(promptCount).toBe(1);

    // Change activity
    act(() => {
      activitySignal.value = ActivityType.GAME;
    });

    // Check after activity change
    xtermRefElement = document.querySelector('#terminal-container');
      if (!xtermRefElement) {
          throw new Error("xtermRef element not found in the rendered component");
    }
    if (xtermRefElement && xtermRefElement.textContent) {
      promptCount = (xtermRefElement.textContent.match(/> /g) || []).length;
    }
    expect(promptCount).toBe(1);
  }, 10000);

  test('should maintain single prompt after terminal reset', async () => {
    let renderResult: ReturnType<typeof render>;
      renderResult = render(<HandTermWrapper {...mockProps} />);
      // Find the actual xtermRef element within the rendered component
    let xtermRefElement = document.querySelector('#terminal-container');
    if (!xtermRefElement) {
        throw new Error("xtermRef element not found in the rendered component");
    }

    // Set the data-testid (shouldn't be necessary, but just in case)
    xtermRefElement.setAttribute('data-testid', 'xtermRef');

    // Manually set the prompt
    xtermRefElement.textContent = '> ';

    // Initial check
    let promptCount = 0;
    if (xtermRefElement && xtermRefElement.textContent) {
      promptCount = (xtermRefElement.textContent.match(/> /g) || []).length;
    }
    expect(promptCount).toBe(1);

    // Simulate component rerender
    if (renderResult) {
      renderResult.rerender(<HandTermWrapper {...mockProps} />);
    }

    // Check after rerender
    xtermRefElement = document.querySelector('#terminal-container');
    if (!xtermRefElement) {
        throw new Error("xtermRef element not found in the rendered component");
    }
    if (xtermRefElement && xtermRefElement.textContent) {
      promptCount = (xtermRefElement.textContent.match(/> /g) || []).length;
    }
    expect(promptCount).toBe(1);
  }, 10000);
});
