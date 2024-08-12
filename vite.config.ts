// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'monaco-editor-css',
      enforce: 'pre',
      resolveId(source) {
        if (source.endsWith('.css') && source.includes('monaco-editor')) {
          return source;
        }
      },
      load(id) {
        if (id.endsWith('.css') && id.includes('monaco-editor')) {
          const cssPath = path.resolve(__dirname, 'node_modules', id);
          if (fs.existsSync(cssPath)) {
            return fs.readFileSync(cssPath, 'utf-8');
          }
        }
      },
    },
  ],
  base: '/',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          'monaco-editor': ['monaco-editor'],
        },
      },
    },
  },
  resolve: {
    alias: {
      'monaco-editor': path.resolve(__dirname, 'node_modules/monaco-editor'),
    },
  },
  optimizeDeps: {
    include: [
      'monaco-editor/esm/vs/editor/editor.api',
      'monaco-editor/esm/vs/editor/editor.worker',
      'monaco-editor/esm/vs/language/typescript/ts.worker',
      'monaco-editor/esm/vs/language/json/json.worker',
      'monaco-editor/esm/vs/language/css/css.worker',
      'monaco-editor/esm/vs/language/html/html.worker',
    ],
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
