import { resolve } from 'path';

import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';


export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths({
      projects: ['./tsconfig.test.json']
    })
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest-setup.ts', './setupTests.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/playwright/**',
      'tests-examples/**',
      '**/e2e/**', // Exclude Playwright tests
      '**/*.spec.ts' // Exclude .spec files
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test-utils/',
        '**/*.d.ts',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/types/',
        'tests/',
        'e2e/'
      ]
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@hooks': resolve(__dirname, './src/hooks'),
      '@utils': resolve(__dirname, './src/utils'),
      '@contexts': resolve(__dirname, './src/contexts'),
      '@types': resolve(__dirname, './src/types'),
      '@assets': resolve(__dirname, './src/assets'),
      '@commands': resolve(__dirname, './src/commands'),
      '@game': resolve(__dirname, './src/game'),
      '@test-utils': resolve(__dirname, './src/test-utils')
    }
  }
});
