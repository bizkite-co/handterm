// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'monaco-editor-nls',
      enforce: 'pre',
      resolveId(id) {
        if (id.includes('monaco-editor/esm/vs/editor/editor.main.nls')) {
          return 'virtual:monaco-editor-nls';
        }
      },
      load(id) {
        if (id === 'virtual:monaco-editor-nls') {
          return `export default {};`;
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
          'monaco-editor': ['@monaco-editor/react'],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@monaco-editor/react': path.resolve(__dirname, 'node_modules/@monaco-editor/react'),
      'monaco-editor': path.resolve(__dirname, 'node_modules/monaco-editor'),
    },
  },
  optimizeDeps: {
    include: ['@monaco-editor/react'],
    esbuildOptions: {
      plugins: [
        {
          name: 'monaco-editor-css',
          setup(build) {
            build.onResolve({ filter: /\.css$/, namespace: 'file' }, args => {
              if (args.path.includes('monaco-editor')) {
                return { path: args.path, namespace: 'monaco-editor-css' };
              }
            });
            build.onLoad({ filter: /.*/, namespace: 'monaco-editor-css' }, () => {
              return { contents: '', loader: 'js' };
            });
          },
        },
      ],
    },
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
