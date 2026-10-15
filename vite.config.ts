/// <reference types="vitest/config" />
import { buildSync } from "esbuild";
import { defineConfig, type Plugin } from "vite";
import solid from "vite-plugin-solid";

/**
 * Inline src/boot.ts (the loading line and the error box) into index.html as a
 * classic script, ahead of the stylesheet and the app bundle, so it runs even
 * when those are slow or fail to load. Vite bundles only module scripts, so the
 * boot script is compiled here with esbuild instead.
 */
function inlineBoot(): Plugin {
  return {
    name: "inline-boot",
    transformIndexHtml() {
      const out = buildSync({
        entryPoints: ["src/bootEntry.ts"],
        bundle: true,
        format: "iife",
        minify: true,
        target: "es2019",
        write: false,
      });
      return [{ tag: "script", children: out.outputFiles[0]!.text, injectTo: "head-prepend" }];
    },
  };
}

// The site is a static Solid SPA. Its data is the generator's export folder,
// served as Vite's publicDir: `pnpm build:models` writes export/ (glb/, thumbs/,
// catalog.json, skyscrapers.meta.json) and `vite build` copies it into dist/ as
// it stands, so the deployed site serves the very files the game would import.
export default defineConfig({
  plugins: [solid(), inlineBoot()],
  publicDir: "export",
  build: {
    // three (~560 kB) is its own chunk, loaded only when a model page opens
    // (src/ModelDetail.tsx imports the viewer lazily) -- it is expected to be big.
    chunkSizeWarningLimit: 700,
  },
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    setupFiles: ["test/setup.ts"],
  },
});
