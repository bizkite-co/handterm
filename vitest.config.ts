import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

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
