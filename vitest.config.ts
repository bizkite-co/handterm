import path from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'src': path.resolve(__dirname, './src')
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [
      './vitest-setup.ts',
      './src/test-utils/setup.ts'
    ],
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}', '!src/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
    alias: {
      'src/': path.resolve(__dirname, './src/')
    }
  },
});
