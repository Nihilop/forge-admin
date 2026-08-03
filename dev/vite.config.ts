import { defineConfig } from "vite"
import path from "node:path"
import vue from "@vitejs/plugin-vue"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    // `@forge` = racine du KIT Forge (../ui) → les imports internes du kit résolvent.
    alias: { "@forge": path.resolve(__dirname, "../ui") },
  },
  server: { cors: true, host: true },
  build: { manifest: true, outDir: "dist", rollupOptions: { input: "src/main.ts" } },
})
