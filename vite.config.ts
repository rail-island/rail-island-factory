/// <reference types="vitest/config" />
import { readFileSync } from "node:fs";
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

/** The link-preview image index.html's og:image and twitter:image name. */
const SOCIAL_PREVIEW = { source: "src/social-preview.png", fileName: "social-preview.png" };

/**
 * Emit src/social-preview.png at the site root under a fixed, unhashed name:
 * index.html names it by an absolute URL, which Vite leaves alone, and the
 * public folder is the generated export (docs/site/catalog-site.md).
 */
function socialPreview(): Plugin {
  return {
    name: "social-preview",
    apply: "build",
    generateBundle() {
      this.emitFile({ type: "asset", fileName: SOCIAL_PREVIEW.fileName, source: readFileSync(SOCIAL_PREVIEW.source) });
    },
  };
}

// The site is a static Solid SPA. Its data is the generator's export folder,
// served as Vite's publicDir: `pnpm build:models` writes export/ (glb/, thumbs/,
// catalog.json, skyscrapers.meta.json) and `vite build` copies it into dist/ as
// it stands, so the deployed site serves the very files the game would import.
export default defineConfig({
  plugins: [solid(), inlineBoot(), socialPreview()],
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
    // The files share their worker's modules: the generator is loaded once per
    // worker, not once per file, and test/catalogCache.ts keeps each design's
    // build and JS bundle for every file that worker runs (docs/guide/setup-and-build.md).
    isolate: false,
    // Every core: the tests are CPU-bound and the main process only reports.
    maxWorkers: "100%",
    // Some tests build whole families; 5 s is too tight on a small machine.
    testTimeout: 120_000,
  },
});
