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
    esbuildOptions: {
      plugins: [
        {
          name: 'monaco-css-plugin',
          setup(build) {
            build.onResolve({ filter: /\.css$/, namespace: 'file' }, args => {
              if (args.path.includes('monaco-editor')) {
                return { path: args.path, namespace: 'monaco-css' }
              }
            })
            build.onLoad({ filter: /.*/, namespace: 'monaco-css' }, async (args) => {
              return { contents: '', loader: 'css' }
            })
          },
        },
      ],
    },
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
