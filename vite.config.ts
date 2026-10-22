import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // base สัมพัทธ์ — เว็บบน GitHub Pages (subpath) และ Netlify root ใช้ได้ทั้งคู่
  base: "./",
  plugins: [react()],
  build: {
    target: "es2022",
    chunkSizeWarningLimit: 900,
  },
});
