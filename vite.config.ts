// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    target: 'esnext',
  },
  resolve: {
    alias: {
      '@monaco-editor/react': path.resolve(__dirname, 'node_modules/@monaco-editor/react'),
    },
  },
  optimizeDeps: {
    include: ['@monaco-editor/react'],
  },
  server: {
    headers: {
      'Cache-Control': 'public, max-age=31536000',
    },
    fs: {
      allow: ['..', path.resolve(__dirname, 'node_modules/@monaco-editor')],
    },
  },
});
