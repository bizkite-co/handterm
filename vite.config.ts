// vite.config.ts
import path from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      globals: {
        Buffer: true,
        process: true,
      },
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
      '@monaco-editor/react': path.resolve(__dirname, 'node_modules/@monaco-editor/react'),
      'monaco-editor': path.resolve(__dirname, 'node_modules/monaco-editor'),
    },
  },
  optimizeDeps: {
    include: [
      '@monaco-editor/react',
      '@preact/signals-react',
      'hoist-non-react-statics',
      '@xterm/xterm',
      '@xterm/addon-fit',
      'react-xtermjs'
    ],
    exclude: [
      '@emotion/react/jsx-dev-runtime',
      'vite-plugin-node-polyfills/shims/buffer',
      'vite-plugin-node-polyfills/shims/global',
      'vite-plugin-node-polyfills/shims/process',
      'vite-plugin-node-polyfills_shims_buffer',
      'vite-plugin-node-polyfills_shims_global',
      'vite-plugin-node-polyfills_shims_process',
      'chunk-2MKEI7ZQ',
      'chunk-NS4ASZ7Z',
      'chunk-NDUKVSJZ',
      'chunk-3TFVT2CW',
      'chunk-4MBMRILA',
      'canvas-confetti'
    ],
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
      'Cache-Control': 'public, max-age=31536000',
    },
    fs: {
      allow: ['..', path.resolve(__dirname, 'node_modules/@monaco-editor')],
    },
  },
});
