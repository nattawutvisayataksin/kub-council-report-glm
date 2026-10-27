import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // base สัมพัทธ์ — เว็บบน GitHub Pages (subpath) และ Netlify root ใช้ได้ทั้งคู่
  base: "./",
  plugins: [react()],
  // Windows อาจล็อกไฟล์รูปชั่วคราว ทำให้ native watcher ของ Vite ล้มด้วย EBUSY
  server: {
    watch: {
      usePolling: true,
      interval: 500,
    },
  },
  build: {
    target: "es2022",
    chunkSizeWarningLimit: 900,
  },
});
