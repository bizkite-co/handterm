// vite.config.ts
import path from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // Whether to polyfill `node:` protocol imports.
      protocolImports: true,
    }),
    {
      name: 'monaco-editor-nls',
      enforce: 'pre',
      resolveId(id) {
        if (id.includes('monaco-editor/esm/vs/editor/editor.main.nls')) {
          return 'virtual:monaco-editor-nls';
        }
        return null;
      },
      load(id) {
        if (id === 'virtual:monaco-editor-nls') {
          return `export default {};`;
        }
        return null;
      },
    },
  ],
  base: '/', // Explicitly set to root for custom domain
  publicDir: 'public',
  build: {
    outDir: 'dist',
    target: 'esnext',
    sourcemap: true, // Enable source maps
    rollupOptions: {
      output: {
        manualChunks: {
          monacoEditor: ['@monaco-editor/react'],
        },
      },
    },
  },
  resolve: {
    alias: {
      'src': path.resolve(__dirname, './src'),
      // eslint-disable-next-line @typescript-eslint/naming-convention
      '@monaco-editor/react': path.resolve(__dirname, 'node_modules/@monaco-editor/react'),
      // eslint-disable-next-line @typescript-eslint/naming-convention
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
              return null;
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
      // eslint-disable-next-line @typescript-eslint/naming-convention
      'Cache-Control': 'public, max-age=31536000',
    },
    fs: {
      allow: ['..', path.resolve(__dirname, 'node_modules/@monaco-editor')],
    },
  },
});
