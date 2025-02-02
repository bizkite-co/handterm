/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-dynamic-delete, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import { test as baseTest, expect as playwrightExpect } from '@playwright/test';

// Clean up global scope
if (typeof global != 'undefined') {
  delete (global as any).expect;
  const matchersSymbol = Symbol.for('$$jest-matchers-object');
  if ((global as any)[matchersSymbol]) {
    delete (global as any)[matchersSymbol];
  }
}

export const test = baseTest;

export const expect = playwrightExpect;
