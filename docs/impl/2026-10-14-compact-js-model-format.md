# Compact JS model format

Spec: docs/specs/2026-10-14-compact-js-model-format.md
Date: 2026-10-14
Status: implemented
Area: generator (meshCore, meshBuilder, threeBuilder, jsModel, generate, catalog), export folder, catalog site (table, model page)

## What was done

- `MeshBuilder` is split: `generator/meshCore.ts` holds the geometry (ring helpers, `tri`..`box`, `scope`, `part`);
  `meshBuilder.ts` extends it with the source-tree recording and `toGlb`; `threeBuilder.ts` extends it with
  `toGroup(THREE, name)`. GLBs and source trees stayed byte-identical (checked against sha256 of all 22 files
  before and after).
- `generator/jsModel.ts` bundles each design with esbuild (added as a direct devDependency) into
  `export/js/<id>.js`: no imports, `export default build(THREE)` returning a `THREE.Group`, a plugin swapping the
  recording builder for the lean one. Designs are now exported functions so the bundle tree-shakes the other nine.
- `pnpm build:models` writes the files (`generateJsModels`; `buildExport` is now async), prints GLB / gzip GLB / JS /
  gzip JS per model, and `catalog.json` records gain `glbGzipBytes`, `jsUrl`, `jsBytes`, `jsGzipBytes`.
- Site: the table has a JS column; GLB and JS sizes are links that download the file without opening the model; the
  model page's spec list links them and shows the gzip sizes.
- Docs: new `docs/models/js-format.md`; export, skyscrapers, vehicles, source-tree, catalog-site, setup-and-build and README updated.
- Result: 5.0-6.0 kB per skyscraper (2.2-2.6 kB gzip) against 36-214 kB of GLB; truck 11.5 kB against 356 kB.
- Checks: `pnpm typecheck`, `pnpm test` (122 tests, including the new `test/jsModel.test.ts` and download tests) and
  `pnpm build` all pass.

## How to test

**Automated coverage.** `pnpm test` - `test/jsModel.test.ts` (parity with the GLB using real three.js, standalone
file, determinism, write/skip/prune) and `test/catalogQuery.test.ts` (download links). No browser E2E: the repository
has no E2E framework and CLAUDE.md asks for headless checks only.

**Setup.** `pnpm build:models && pnpm dev` (the user runs the browser).

**Steps.**
1. Open the list in a wide window. The table has a **JS** column after **GLB**.
2. Click a GLB size: the browser downloads `<id>.glb` and the model page does not open. Click a JS size: `<id>.js`.
3. Press Tab to a size link and Enter: it downloads and the row does not open.
4. Click elsewhere in the row: the model opens. In the Specs tab, **GLB**, **JS** are links; **GLB gzip** and **JS gzip** are listed.
5. Sort by JS: largest first.
6. In a scratch page: `import build from "/js/veh-american-truck.js"; scene.add(build(THREE))` shows the truck with a separately rotatable `trailer` child group.

**Also worth trying.** Delete `export/js` and rebuild (the files return); remove a design (its file goes); rebuild twice (second build leaves the files untouched).

## What is missing

Nothing - the spec is implemented in full. The site's 3D viewer still loads GLBs, as the spec decided.

## Known problems

- Each file repeats about 4 kB of shared geometry code, so against gzip the simplest models gain little (pyramid: 4.1 kB GLB gzip vs 5.0 kB JS raw, 2.2 kB gzip).
- Scope names (`m.scope("floor 3", ...)`) stay in the bundle as dead strings and closures; stripping them would shave a little.
- The bundle assumes three.js colour management (hex read as sRGB); with it disabled the colours differ from the GLB.
- Class fields are emitted natively (ES2022 target); a consumer needing older syntax must transpile.

## Recommended follow-ups

1. Let the site's 3D viewer load the JS model, which also exercises the format with a real consumer.
2. Strip `scope` calls from the bundle to shrink it.
3. Consider a shared runtime file for consumers that load many models, if "single file per model" is relaxed.

## Changelog

- Every model is also available as a single standalone JavaScript file.
- The model table lists the JavaScript size and the GLB and JavaScript sizes download their files when clicked.
- The model page shows gzip sizes of both files.
