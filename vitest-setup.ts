import { expect } from 'vitest';
import '@testing-library/jest-dom';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
Object.keys(matchers).forEach(key => {
  expect.extend({ [key]: matchers[key] });
});
