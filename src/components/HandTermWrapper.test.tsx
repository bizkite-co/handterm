import { render, act } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import { HandTermWrapper } from './HandTermWrapper';
import { activitySignal } from '../signals/appSignals';
import { ActivityType } from '@handterm/types';
import { commandTimeSignal } from '../signals/commandLineSignals';
import { TerminalTestUtils } from '../test-utils/TerminalTestUtils';

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
vi.mock('../hooks/useTerminal', () => ({
  useTerminal: () => ({
    xtermRef: { current: document.createElement('div') },
    writeToTerminal: vi.fn(),
    resetPrompt: vi.fn(),
  })
}));

// Add this mock with the other mocks at the top
vi.mock('../components/NextCharsDisplay', () => ({
  NextCharsDisplay: () => null
}));

describe('HandTermWrapper', () => {
  const mockAuth: IAuthProps = {
    isAuthenticated: false,
    user: null,
    loading: false,
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
    isLoggedIn: false,
    isLoading: false,
    isError: false,
    error: null,
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
    commandTimeSignal.value = new Date();
    localStorage.clear();

    // Clear all terminal content
    document.body.innerHTML = '';

    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('should initialize activity state only once', async () => {
    const activityTransitions: ActivityType[] = [];

    // Subscribe before rendering
    const unsubscribe = activitySignal.subscribe((value) => {
      activityTransitions.push(value);
    });

    render(<HandTermWrapper {...mockProps} />);
    await TerminalTestUtils.waitForPrompt();

    unsubscribe();

    // Filter out duplicate consecutive values
    const uniqueTransitions = activityTransitions.filter((value, index, array) =>
      index === 0 || value !== array[index - 1]
    );

    expect(uniqueTransitions.length).toBe(1);
    expect(uniqueTransitions[0]).toBe(ActivityType.NORMAL);
  });

  test('should handle page load with stored activity', async () => {
    const storedActivity = ActivityType.NORMAL;
    localStorage.setItem('lastActivity', storedActivity);

    const activityTransitions: ActivityType[] = [];

    const unsubscribe = activitySignal.subscribe((value) => {
      activityTransitions.push(value);
    });

    render(<HandTermWrapper {...mockProps} />);
    await TerminalTestUtils.waitForPrompt();

    unsubscribe();

    const uniqueTransitions = activityTransitions.filter((value, index, array) =>
      index === 0 || value !== array[index - 1]
    );

    expect(uniqueTransitions.length).toBe(1);
    expect(uniqueTransitions[0]).toBe(storedActivity);
  });

  test('should render prompt in normal mode', async () => {
    render(<HandTermWrapper {...mockProps} />);
    await TerminalTestUtils.waitForPrompt();

    const promptCount = await TerminalTestUtils.getPromptCount();
    expect(promptCount).toBe(1);
  });

  test('should maintain single prompt after activity changes', async () => {
    render(<HandTermWrapper {...mockProps} />);
    await TerminalTestUtils.waitForPrompt();

    // Initial check
    let promptCount = await TerminalTestUtils.getPromptCount();
    expect(promptCount).toBe(1);

    // Change activity
    act(() => {
      activitySignal.value = ActivityType.GAME;
    });

    // Check after activity change
    await TerminalTestUtils.waitForPrompt();
    promptCount = await TerminalTestUtils.getPromptCount();
    expect(promptCount).toBe(1);
  });

  test('should maintain single prompt after terminal reset', async () => {
    const { rerender } = render(<HandTermWrapper {...mockProps} />);
    await TerminalTestUtils.waitForPrompt();

    // Initial check
    let promptCount = await TerminalTestUtils.getPromptCount();
    expect(promptCount).toBe(1);

    // Simulate component rerender
    rerender(<HandTermWrapper {...mockProps} />);

    // Check after rerender
    await TerminalTestUtils.waitForPrompt();
    promptCount = await TerminalTestUtils.getPromptCount();
    expect(promptCount).toBe(1);
  });
});
