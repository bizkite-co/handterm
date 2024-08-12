// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react()
  ],
  base: '/',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    target: 'esnext',
  },
  resolve: {
    alias: {
      'monaco-editor': 'monaco-editor',
    },
  },
  optimizeDeps: {
    include: ['monaco-editor'],
  },
  worker: {
    format: 'es',
  },
  server: {
    headers: {
      'Cache-Control': 'public, max-age=31536000',
    },
    fs: {
      allow: ['..'],
    },
  },
});
