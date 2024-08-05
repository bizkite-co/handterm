// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import monacoEditorPluginImport from 'vite-plugin-monaco-editor';

// Type assertion to handle the default property
const monacoEditorPlugin = (monacoEditorPluginImport as any).default || monacoEditorPluginImport;

if (typeof monacoEditorPlugin !== 'function') {
  throw new Error('Expected monacoEditorPlugin to be a function');
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    monacoEditorPlugin({
      // You can specify the languages you need here
    }),
  ],
  server: {
    port: 5173, // Ensure the port is set correctly
  },
  base: '/',
  build: {
    target: 'esnext'
  },
  resolve: {
    alias: {
      '/shared/': path.resolve(__dirname, '../shared/'),
    }
  },
});