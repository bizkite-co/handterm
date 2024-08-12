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
      'monaco-editor': path.resolve(__dirname, 'node_modules/monaco-editor'),
    },
  },
  optimizeDeps: {
    include: ['monaco-editor/esm/vs/editor/editor.api'],
  },
  worker: {
    format: 'es',
  },
  server: {
    headers: {
      'Cache-Control': 'public, max-age=31536000',
    },
    fs: {
      allow: ['..', path.resolve(__dirname, 'node_modules/monaco-editor')],
    },
  },
});
