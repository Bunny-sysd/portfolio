import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'docs',
  },
  server: {
    port: 5173,
    strictPort: false,
    host: '127.0.0.1'
  }
});
