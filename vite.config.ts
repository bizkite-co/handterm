// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react()
  ],
  base: '/',
  publicDir: 'public', // Serve static files from the public directory
  build: {
    outDir: 'dist', // Output directory for build files
    target: 'esnext',
  },
  resolve: {
    alias: {
      // Remove monaco-editor alias
    },
  },
  worker: {
    format: 'es',
  },
  server: {
    headers: {
      'Cache-Control': 'public, max-age=31536000',
    },
  },
});
