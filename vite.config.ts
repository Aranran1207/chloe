import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [vue()],
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@framework': path.resolve(__dirname, './src/framework'),
      '@core': path.resolve(__dirname, './src/core')
    }
  },
  server: {
    port: 12070,
    strictPort: true,
    watch: {
      ignored: ['**/config.json']
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
});
