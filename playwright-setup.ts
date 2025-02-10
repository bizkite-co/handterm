import { test as baseTest, expect as playwrightExpect } from '@playwright/test';

// Clean up global scope
if (typeof global != 'undefined') {
  delete (global as Record<string, unknown>).expect;
  const matchersSymbol = Symbol.for('$$jest-matchers-object');
  if ((global as Record<string | symbol, unknown>)[matchersSymbol]) {
    delete (global as Record<string | symbol, unknown>)[matchersSymbol];
  }
}

export const test = baseTest;

export const expect = playwrightExpect;
