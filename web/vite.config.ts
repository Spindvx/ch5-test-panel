import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * @crestron/ch5-crcomlib and @crestron/ch5-webxpanel ship as UMD bundles
 * intended to be loaded via <script> tags at runtime — they expose
 * window.CrComLib and window.WebXPanel and don't have proper ESM
 * entry points. We tell Rolldown to leave the import paths alone
 * (don't try to bundle them), and the panel loads cr-com-lib.js from
 * the libraries/ folder of the .ch5z. cip.ts then reads window.CrComLib
 * directly — no `import "@crestron/ch5-crcomlib"` in shipped JS.
 */
export default defineConfig({
  plugins: [react()],
  base: "./",
  server: { host: "0.0.0.0", port: 5173 },
  build: {
    outDir: "dist",
    target: "es2020",
    rollupOptions: {
      external: ["@crestron/ch5-crcomlib", "@crestron/ch5-webxpanel"],
    },
  },
});
