import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const host = process.env.TAURI_DEV_HOST;

// When deploying to GitHub Pages at https://hasnain7abbas.github.io/hamcalc/
// asset URLs must be prefixed with /hamcalc/. For Tauri builds the app is served
// from the bundle root, so we keep base "/" there.
const isPages = process.env.GITHUB_PAGES === "true";

export default defineConfig({
  base: isPages ? "/hamcalc/" : "/",
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? { protocol: "ws", host, port: 1421 }
      : undefined,
    watch: { ignored: ["**/src-tauri/**"] },
  },
  build: {
    target: "es2020",
    chunkSizeWarningLimit: 1500,
  },
});
