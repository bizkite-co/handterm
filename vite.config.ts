import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import dotenv from 'dotenv';
import monacoEditorPlugin from 'vite-plugin-monaco-editor';

dotenv.config();

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    monacoEditorPlugin({
      // You can specify the languages you need here
      
    }),
  ],
  base: '/',
  build: {
    target: 'esnext'
  },
  resolve: {
    alias: {
      '/shared/': path.resolve(__dirname, '../shared/'),
      '@codemirror/language': '@codemirror/language',
      '@codemirror/search': '@codemirror/search',
      '@codemirror/commands': '@codemirror/commands',
      '@codemirror/lang-javascript': '@codemirror/lang-javascript', // Add this line
    }
  },
})
