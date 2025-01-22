import { test as baseTest, type Page, expect as playwrightExpect } from '@playwright/test';
import { exposeSignals } from './src/test-utils/exposeSignals';
import { ActivityType } from '@handterm/types';

const activitySignalBrand = Symbol('activitySignal');
import { vi } from 'vitest';
import type {} from './src/types/WindowExtensions';

// Ensure all required signals and properties are exposed before tests run
export function initializeTestEnvironment(): void {
  exposeSignals();

  // Initialize required window properties with proper typing
  window.activitySignal = {
    // @ts-expect-error - Mock implementation satisfies Signal interface
    value: {
      current: ActivityType.NORMAL,
      previous: null,
      transitionInProgress: false,
      tutorialCompleted: false
    },
    type: 'activitySignal',
    props: {},
    key: 'activitySignal',
    brand: Symbol('activitySignal') as unknown as unique symbol,
    peek: vi.fn(() => window.activitySignal.value),
    toJSON: vi.fn(() => window.activitySignal.value),
    toString: vi.fn(() => JSON.stringify(window.activitySignal.value)),
    valueOf: vi.fn(() => window.activitySignal.value),
    subscribe: vi.fn((callback: (value: typeof window.activitySignal.value) => void) => {
      callback(window.activitySignal.value);
      return () => {};
    }),
    set: vi.fn((value: ActivityType) => {
      window.activitySignal.value = {
        current: value,
        previous: window.activitySignal.value.current,
        transitionInProgress: false,
        tutorialCompleted: window.activitySignal.value.tutorialCompleted
      };
    })
  };

  window.tutorialSignals = {
    currentStep: {
      value: 0,
      set: vi.fn(),
      subscribe: vi.fn()
    },
    totalSteps: {
      value: 10,
      set: vi.fn(),
      subscribe: vi.fn()
    },
    isComplete: {
      value: false,
      set: vi.fn(),
      subscribe: vi.fn()
    }
  };

  // Initialize command line signals with proper typing
  window.commandLineSignal = {
    value: '',
    set: vi.fn((value: string) => {
      window.commandLineSignal.value = value;
    }),
    subscribe: vi.fn((callback: (value: string) => void) => {
      callback(window.commandLineSignal.value);
    })
  };

  // Initialize GitHub related properties
  window.github = {
    executeCommand: vi.fn().mockImplementation((command: string) => {
      return Promise.resolve({
        status: 'success',
        message: `Executed ${command}`
      });
    }),
    getCredentials: vi.fn().mockResolvedValue({
      username: 'testuser',
      token: 'testtoken'
    })
  };

  // Add missing functions
  window.setActivity = (activity: string) => {
    window.activitySignal.value = activity;
    const signals = window.signals as { activity: { set: (value: string) => void } };
    signals.activity.set(activity);
  };

  window.setNextTutorial = () => {
    const current = window.tutorialSignals.currentStep.value;
    if (current < window.tutorialSignals.totalSteps.value) {
      window.tutorialSignals.currentStep.value = current + 1;
      const signals = window.signals as { tutorial: { set: (value: number) => void } };
      signals.tutorial.set(current + 1);
    }
  };

  // Initialize Monaco editor mock
  window.monaco = {
    editor: {
      create: vi.fn(),
      setModelLanguage: vi.fn(),
      defineTheme: vi.fn(),
      setValue: vi.fn(),
      getValue: vi.fn().mockReturnValue(''),
      focus: vi.fn()
    }
  };

  // Initialize localStorage mock with in-memory storage
  const storage = new Map<string, string>();
  window.localStorage = {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
    clear: () => storage.clear(),
    length: storage.size,
    key: (index: number) => Array.from(storage.keys())[index] ?? null
  };

  console.log('Test environment initialized with signals:', window.signals);
}

// Clean up global scope
if (typeof global !== 'undefined') {
  delete (global as any).expect;
  const matchersSymbol = Symbol.for('$$jest-matchers-object');
  if ((global as any)[matchersSymbol]) {
    delete (global as any)[matchersSymbol];
  }
}

export const test = baseTest.extend<{ page: Page }>({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      (window as typeof window & { initializeTestEnvironment: () => void }).initializeTestEnvironment();
      if (!window.signals) {
        throw new Error('Signals not properly exposed in test environment');
      }
    });
    await use(page);
  },
});

export const expect = playwrightExpect;
