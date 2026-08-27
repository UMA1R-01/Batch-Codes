import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Relative base so the built bundle also works from a file:// origin,
  // which is what a Tauri webview serves. Do not change to '/'.
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  // Tauri expects a fixed, predictable dev server port.
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
    watch: { ignored: ['**/src-tauri/**'] },
  },
  build: {
    outDir: 'dist',
    target: 'es2022',
    sourcemap: false,
  },
});
