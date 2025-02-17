import { render, act, waitFor } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import { HandTermWrapper } from './HandTermWrapper';
import { activitySignal } from '../signals/appSignals';
import { ActivityType, type IAuthProps, type OutputElement, type MyResponse, type AuthResponse } from '@handterm/types';
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
    // Reset signals and storage
    activitySignal.value = ActivityType.NORMAL;
    commandTimeSignal.value = new Date();
    localStorage.clear();

    // Clear all terminal content
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('should initialize activity state only once', () => {
    const activityTransitions: ActivityType[] = [];
    const unsubscribe = activitySignal.subscribe((value) => {
      // Only track actual changes in activity type
      if (activityTransitions.length === 0 || activityTransitions[activityTransitions.length - 1] !== value) {
        activityTransitions.push(value);
      }
    });

    render(<HandTermWrapper {...mockProps} />);
    unsubscribe();

    expect(activityTransitions.length).toBe(1);
    expect(activityTransitions[0]).toBe(ActivityType.NORMAL);
  });

  test('should handle page load with stored activity', () => {
    const storedActivity = ActivityType.NORMAL;
    localStorage.setItem('lastActivity', storedActivity);

    const activityTransitions: ActivityType[] = [];
    const unsubscribe = activitySignal.subscribe((value) => {
      // Only track actual changes in activity type
      if (activityTransitions.length === 0 || activityTransitions[activityTransitions.length - 1] !== value) {
        activityTransitions.push(value);
      }
    });

    render(<HandTermWrapper {...mockProps} />);
    unsubscribe();

    expect(activityTransitions.length).toBe(1);
    expect(activityTransitions[0]).toBe(storedActivity);
  });

  test('should render prompt in normal mode', async () => {
    const { container } = render(<HandTermWrapper {...mockProps} />);

    await waitFor(() => {
      const promptElements = container.querySelectorAll('.prompt, .tutorial-prompt');
      expect(promptElements.length).toBe(1);
    });
  });

  test('should maintain single prompt after activity changes', async () => {
    const { container } = render(<HandTermWrapper {...mockProps} />);

    // Initial check
    await waitFor(() => {
      const promptElements = container.querySelectorAll('.prompt, .tutorial-prompt');
      expect(promptElements.length).toBe(1);
    });

    // Change activity
    act(() => {
      activitySignal.value = ActivityType.GAME;
    });

    // Check after activity change
    await waitFor(() => {
      const promptElements = container.querySelectorAll('.prompt, .tutorial-prompt');
      expect(promptElements.length).toBe(1);
    });
  });

  test('should maintain single prompt after terminal reset', async () => {
    const { container, rerender } = render(<HandTermWrapper {...mockProps} />);

    // Initial check
    await waitFor(() => {
      const promptElements = container.querySelectorAll('.prompt, .tutorial-prompt');
      expect(promptElements.length).toBe(1);
    });

    // Simulate component rerender
    rerender(<HandTermWrapper {...mockProps} />);

    // Check after rerender
    await waitFor(() => {
      const promptElements = container.querySelectorAll('.prompt, .tutorial-prompt');
      expect(promptElements.length).toBe(1);
    });
  });
});
