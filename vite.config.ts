// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'monaco-editor-css',
      enforce: 'pre',
      resolveId(source) {
        if (source.endsWith('.css') && source.includes('@monaco-editor')) {
          return source;
        }
      },
      load(id) {
        if (id.endsWith('.css') && id.includes('@monaco-editor')) {
          return '';
        }
      },
    },
  ],
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
