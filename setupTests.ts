import { vi, beforeAll } from 'vitest';
import { test } from '@playwright/test';

// Initialize localStorage before any tests run
beforeAll(() => {
  if (typeof window.localStorage === 'undefined') {
    const store: Record<string, string | undefined> = {};
    window.localStorage = {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => { store[key] = value; },
      removeItem: (key: string) => { store[key] = undefined; },
      clear: () => { Object.keys(store).forEach(key => { store[key] = undefined; }); },
      length: Object.keys(store).length,
      key: (index: number) => Object.keys(store)[index] ?? null
    };
  }
});

// Initialize localStorage for all tests
test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
    if (typeof window.localStorage === 'undefined') {
      const store: Record<string, string | undefined> = {};
      window.localStorage = {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => { store[key] = value; },
        removeItem: (key: string) => { store[key] = undefined; },
        clear: () => { Object.keys(store).forEach(key => { store[key] = undefined; }); },
        length: Object.keys(store).length,
        key: (index: number) => Object.keys(store)[index] || null
      };
    }
  });
});

// Suppress console warnings by mocking console methods
vi.spyOn(console, 'warn').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});
