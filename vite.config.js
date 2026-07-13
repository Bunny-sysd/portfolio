import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'docs',
  },
  server: {
    port: 8099,
    strictPort: true,
    host: '127.0.0.1'
  }
});
