import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // 確保 GitHub Pages 二級子路徑資源引用正確
  server: {
    host: true, // 允許區網裝置透過本機 IP 訪問測試
    port: 3000
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true
  }
});
