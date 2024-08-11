// vite.config.ts
import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import monacoEditorPlugin, { type IMonacoEditorOpts } from 'vite-plugin-monaco-editor';

// Access the actual function nested under default
const monacoEditorPluginDefault = ((monacoEditorPlugin as any).default) as (options: IMonacoEditorOpts) => any;

export default defineConfig({
  plugins: [
    react(),
    monacoEditorPluginDefault({
      languageWorkers: ['typescript', 'json', 'html', 'css'],
      publicPath: '/',
    }),
  ],
  base: '/',
  publicDir: 'public', // Ensure Vite serves static files from the dist directory
  build: {
    outDir: 'public',
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          jsonWorker: ['monaco-editor/esm/vs/language/json/json.worker'],
          cssWorker: ['monaco-editor/esm/vs/language/css/css.worker'],
          htmlWorker: ['monaco-editor/esm/vs/language/html/html.worker'],
          tsWorker: ['monaco-editor/esm/vs/language/typescript/ts.worker'],
          editorWorker: ['monaco-editor/esm/vs/editor/editor.worker'],
        },
      },
    },
  },
  resolve: {
    alias: {
      '/shared/': path.resolve(__dirname, '../shared/'),
      'monaco-editor': path.resolve(__dirname, 'node_modules/monaco-editor'),
    },
  },
  worker: {
    format: 'es',
  },
});