/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

// The site is a static Solid SPA. Its data is the generator's export folder,
// served as Vite's publicDir: `pnpm build:models` writes export/ (glb/, thumbs/,
// catalog.json, skyscrapers.meta.json) and `vite build` copies it into dist/ as
// it stands, so the deployed site serves the very files the game would import.
export default defineConfig({
  plugins: [solid()],
  publicDir: "export",
  build: {
    // three (~560 kB) is its own chunk, loaded only when a model page opens
    // (src/ModelDetail.tsx imports the viewer lazily) -- it is expected to be big.
    chunkSizeWarningLimit: 700,
  },
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
  },
});
