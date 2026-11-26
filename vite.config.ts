/// <reference types="vitest/config" />
import fs, { readFileSync } from "node:fs";
import { buildSync } from "esbuild";
import { defineConfig, type Plugin } from "vite";
import solid from "vite-plugin-solid";
import { devExport } from "./generator/devServer.ts";
import { writeSitePages } from "./generator/sitePages.ts";

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

/**
 * After the bundle is written: one prerendered page per model and per category, the
 * home page's content, 404.html, sitemap.xml and robots.txt (generator/sitePages.ts,
 * docs/site/seo-pages.md), each from the built index.html, so they name its hashed
 * assets.
 */
function sitePages(): Plugin {
  let outDir = "dist";
  return {
    name: "site-pages",
    apply: "build",
    configResolved(config) {
      outDir = config.build.outDir;
    },
    async closeBundle() {
      const n = await writeSitePages(outDir);
      this.info(`site pages: ${n} files`);
    },
  };
}

/**
 * Cloudflare's response headers for the assets-only Worker (`_headers` at the
 * root of dist/; wrangler reads it and does not serve it). parade.json is read by
 * railisland.com's own script in the browser, so it allows any origin; its
 * images are plain <img> loads and need no CORS, but each name carries a hash of
 * everything that shapes it, so they are cached for a year
 * (docs/site/train-parade.md).
 */
export const ASSET_HEADERS = `/parade.json
  Access-Control-Allow-Origin: *

/parade/img/*
  Cache-Control: public, max-age=31536000, immutable
`;

function assetHeaders(): Plugin {
  return {
    name: "asset-headers",
    apply: "build",
    generateBundle() {
      this.emitFile({ type: "asset", fileName: "_headers", source: ASSET_HEADERS });
    },
  };
}

// The site is a static Solid SPA. Its data is the generator's export folder,
// served as Vite's publicDir: `pnpm build:models` writes export/ (js/, thumbs/,
// catalog.json, skyscrapers.meta.json) and `vite build` copies it into dist/ as
// it stands, so the deployed site serves the very files the game would import.
// `pnpm dev` uses no export folder: generator/devServer.ts serves the data on
// demand and the browser measures and renders the rest (docs/site/catalog-site.md).
/**
 * The suites only the full run (`pnpm test:full`, on demand) runs: the whole-catalog
 * sweeps and the heaviest family suites, each over ten seconds of a worker's time.
 * `pnpm test` runs every other file - the quick suite, under two minutes
 * (docs/guide/setup-and-build.md, "Quick and full"). A new suite that takes more
 * than that joins this list.
 */
export const FULL_ONLY_TESTS: readonly string[] = [
  "test/airfield.test.ts",
  "test/animalDrawn.test.ts",
  "test/buses.test.ts",
  "test/catalog-*.test.ts",
  "test/cd230.test.ts",
  "test/characters.test.ts",
  "test/csdCoaches.test.ts",
  "test/czechEmus.test.ts",
  "test/czechEmusClassic.test.ts",
  "test/doors*.test.ts",
  "test/emitters.test.ts",
  "test/export.test.ts",
  "test/foreignUnits.test.ts",
  "test/glass.test.ts",
  "test/interiors.test.ts",
  "test/loads.test.ts",
  "test/lod.test.ts",
  "test/models.test.ts",
  "test/mtrMTrain.test.ts",
  "test/openttdOneClick.test.ts",
  "test/pantographs.test.ts",
  "test/plazaLandmarks.test.ts",
  "test/railSupports.test.ts",
  "test/rig.test.ts",
  "test/rolling.test.ts",
  "test/seriesCabFace.test.ts",
  "test/stationSet.test.ts",
  "test/trainParade.test.ts",
  "test/trams.test.ts",
  "test/treeSpecies.test.ts",
  "test/usCarbodies.test.ts",
  "test/woods.test.ts",
  "test/worldAircraft.test.ts",
  "test/worldBuses2.test.ts",
  "test/worldTrains*.test.ts",
  "test/worldTrams.test.ts",
  "test/worldTrucks.test.ts",
];

/**
 * A run's file filters (`pnpm test test/buses.test.ts`, `pnpm test buses`): Vitest applies
 * `exclude` before them, so a named full-only suite would match nothing without this.
 */
const TEST_FILES = fs.existsSync("test") ? fs.readdirSync("test").filter((f) => f.endsWith(".test.ts")).map((f) => `test/${f}`) : [];
const NAMES_FILES = process.argv.slice(2).some((a) => !a.startsWith("-") && a !== "run" && TEST_FILES.some((f) => f.includes(a.replace(/\\/g, "/").replace(/^\.\//, ""))));

/**
 * Whether this run is the full one: `pnpm test:full`, a run that asks for every variant,
 * design or fleet option, or one that names its files.
 */
const FULL_RUN =
  process.env.npm_lifecycle_event === "test:full" ||
  ["TEST_FULL", "TEST_ALL_VARIANTS", "TEST_ALL_DESIGNS", "TEST_FLEET_COVER"].some((k) => process.env[k] === "1") ||
  NAMES_FILES;

export default defineConfig(({ command, mode }) => ({
  // Under Vitest the components compile for the server, so a test renders them to
  // markup with solid-js/web renderToString (test/chainsView.test.ts); the site build is unchanged.
  plugins: [solid(mode === "test" ? { ssr: true } : {}), inlineBoot(), socialPreview(), assetHeaders(), sitePages(), devExport()],
  publicDir: command === "serve" ? false : "export",
  build: {
    // three (~560 kB) is its own chunk, loaded only when a model page opens
    // (src/ModelDetail.tsx imports the viewer lazily) -- it is expected to be big.
    chunkSizeWarningLimit: 700,
  },
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    exclude: FULL_RUN ? [] : [...FULL_ONLY_TESTS],
    setupFiles: ["test/setup.ts"],
    // The files share their worker's modules: the generator is loaded once per
    // worker, not once per file, and test/catalogCache.ts keeps each design's
    // build and JS bundle for every file that worker runs (docs/guide/setup-and-build.md).
    isolate: false,
    // Every core: the tests are CPU-bound and the main process only reports.
    maxWorkers: "100%",
    // A larger young generation: the builds allocate fast and short-lived, and the default's
    // scavenges took over a quarter of the workers' time (about a tenth less wall time).
    poolOptions: { forks: { execArgv: ["--max-semi-space-size=64"] } },
    // Some tests build whole families; 5 s is too tight on a small machine.
    testTimeout: 120_000,
  },
}));
