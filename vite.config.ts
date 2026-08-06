import { defineConfig } from "vite";

export default defineConfig({
  base: "/rough-sketch-layout-prototype/",
  server: {
    host: "127.0.0.1",
    port: 4179,
    strictPort: true
  },
  build: {
    outDir: "dist",
    emptyOutDir: true
  }
});
