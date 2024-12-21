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
      '**/e2e/**',
      '**/playwright/**',
      'tests-examples/**'
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
    },
    alias: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      '@': resolve(__dirname, './src'),
      // eslint-disable-next-line @typescript-eslint/naming-convention
      '@components': resolve(__dirname, './src/components'),
      // eslint-disable-next-line @typescript-eslint/naming-convention
      '@hooks': resolve(__dirname, './src/hooks'),
      // eslint-disable-next-line @typescript-eslint/naming-convention
      '@utils': resolve(__dirname, './src/utils'),
      // eslint-disable-next-line @typescript-eslint/naming-convention
      '@contexts': resolve(__dirname, './src/contexts'),
      // eslint-disable-next-line @typescript-eslint/naming-convention
      '@types': resolve(__dirname, './src/types'),
      // eslint-disable-next-line @typescript-eslint/naming-convention
      '@assets': resolve(__dirname, './src/assets'),
      // eslint-disable-next-line @typescript-eslint/naming-convention
      '@commands': resolve(__dirname, './src/commands'),
      // eslint-disable-next-line @typescript-eslint/naming-convention
      '@game': resolve(__dirname, './src/game'),
      // eslint-disable-next-line @typescript-eslint/naming-convention
      '@test-utils': resolve(__dirname, './src/test-utils')
    }
  },
  resolve: {
    alias: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      '@': resolve(__dirname, './src'),
      // eslint-disable-next-line @typescript-eslint/naming-convention
      '@components': resolve(__dirname, './src/components'),
      // eslint-disable-next-line @typescript-eslint/naming-convention
      '@hooks': resolve(__dirname, './src/hooks'),
      // eslint-disable-next-line @typescript-eslint/naming-convention
      '@utils': resolve(__dirname, './src/utils'),
      // eslint-disable-next-line @typescript-eslint/naming-convention
      '@contexts': resolve(__dirname, './src/contexts'),
      // eslint-disable-next-line @typescript-eslint/naming-convention
      '@types': resolve(__dirname, './src/types'),
      // eslint-disable-next-line @typescript-eslint/naming-convention
      '@assets': resolve(__dirname, './src/assets'),
      // eslint-disable-next-line @typescript-eslint/naming-convention
      '@commands': resolve(__dirname, './src/commands'),
      // eslint-disable-next-line @typescript-eslint/naming-convention
      '@game': resolve(__dirname, './src/game'),
      // eslint-disable-next-line @typescript-eslint/naming-convention
      '@test-utils': resolve(__dirname, './src/test-utils')
    }
  }
});
