// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM-compatible __dirname shim
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@features': path.resolve(__dirname, './src/features'),
    },
  },
  build: {
    // Code splitting for better chunk size
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'vendor-cognito': ['@aws-sdk/client-cognito-identity-provider'],
          'vendor-ui': ['react-hot-toast'],
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Allow larger chunks
  },
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: true
  },
  preview: {
    host: 'localhost',
    port: 4173,
    strictPort: true
  }
});
