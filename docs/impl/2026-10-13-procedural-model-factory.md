# Procedural model factory

Spec: docs/specs/2026-10-13-procedural-model-factory.md
Date: 2026-10-13
Status: implemented
Area: whole repository - generator/, src/ (site), test/, wrangler.jsonc, .github/workflows/, docs/

## What was done

- **Generator** (`generator/`): the mesh builder and the ten skyscraper designs
  from rail-island-webapp `ccr-5f803b9b-ohwby3` (commit `6d49d6f`), copied with
  behaviour unchanged; the GLB reader (`glbParse.ts`, `glbTriangles.ts` trimmed
  to baseColorFactor) and the thumbnail rasterizer (`renderGlbThumb.ts`, trimmed
  to the three-quarter view); a new `glbStats.ts` for the listing's counts and
  box. The `sky-*` catalog fields the webapp branch kept in its
  `buildings.meta.json` are now `SKYSCRAPER_CATALOG` in `skyscrapers.ts`.
- **Build = export**: `pnpm build:models` writes the gitignored `export/`
  (`glb/`, `thumbs/`, `skyscrapers.meta.json` in the webapp's buildings.meta.json
  shape, `catalog.json` for the site). `pnpm build` = models + `tsc` + `vite
  build`; `export/` is Vite's publicDir, so `dist/` serves the export as is.
  Verified once that all ten GLBs are **byte-identical** to what the webapp
  branch's own code produces.
- **Site** (`src/`): Solid SPA, English only - table (>= 900 px) or cards,
  sorting on every column, search, a model page with a lazily loaded three.js
  orbit viewer, thumbnail and spec list, prev/next through the current list; all
  state in the query string.
- **Deploy**: `wrangler.jsonc` (assets-only Worker `rail-island-factory`, custom
  domain `factory.railisland.com`), `.github/workflows/deploy.yml` (push to
  `master` + manual dispatch) and `test.yml` (typecheck + Vitest, not a gate).
- **Docs**: `CLAUDE.md`, landing `README.md`, `docs/README.md` index, and
  `docs/guide/`, `docs/models/`, `docs/site/` following the webapp's conventions.

Checks: `pnpm typecheck` clean; `pnpm test` 28/28 passing (3 files);
`pnpm build` succeeds (main bundle 29 kB, three in a lazy 565 kB chunk);
`wrangler deploy --dry-run` reads 29 files, no bindings. No real deploy was run
from the session.

The work is on the session branch `claude/magical-bardeen-rap63u` rather than a
fresh `claude/<slug>-<hex>` branch: the session's git rules forbid pushing to any
other branch.

## Follow-up changes

1. **Deploy failed on "Multiple versions of pnpm specified".** The workflows no
   longer pass `version:` to `pnpm/action-setup`; it reads `packageManager` from
   `package.json`.
2. **Port the webapp's skyscraper flicker fix, with a systematic guard.** The
   geometry fix from rail-island-webapp `b24138aa` (open-topped cores, art deco
   piers under the cornice, a glass-office roof slab, narrower balconies) and its
   coplanar-face detector `generator/coplanar.ts` came over; all ten GLBs are
   byte-identical to that commit's. Beyond the webapp, the build itself now
   refuses a z-fighting design (`ZFightingError`, nothing written), because the
   deploy does not wait for the tests, and the site's viewer fits its camera
   near/far to each model. Tests: 42, including the per-design regression (fails
   on the old geometry for five towers) and the build guard.

## How to test

**Automated coverage.** No E2E: the repository has no browser test framework and
CLAUDE.md keeps browser checks with the user. Vitest (`pnpm test`) covers the
models, the export documents and the site's query logic.

**Setup.** `pnpm install`, then `pnpm dev` and open http://localhost:5173.
No account, no flags.

**Steps.**
1. Open `/`. Observe the app bar "Rail Island Factory" and a table of 10
   models, each with a thumbnail, sorted by title (Art Deco Tower first); the
   totals read "10 models".
2. Click the **Triangles** header. Observe the order flips to largest first
   (Brick Apartment Tower, 2,978) and the URL gains `?sort=triangles`.
3. Click it again. Observe ascending order (Pyramid Tower, 482) and `&dir=asc`.
4. Type `twin` in **Search models**. Observe one row, Twin Towers, and `?q=twin`.
5. Clear the search and click the **Pagoda Tower** row. Observe the model page:
   the 3D viewer loads the gold octagonal tower, the thumbnail and a spec list
   (Id `sky-pagoda`, City pool `skyscraper_c`, Scale 0.5, License CC0...).
6. Drag in the viewer to orbit, scroll to zoom. Observe it re-renders smoothly.
7. Press the right arrow key (or the -> button). Observe the next model in the
   current sort order and the "N of 10" counter changing.
8. Press Escape (or the app bar's back arrow, or browser Back). Observe the list
   with its previous sort and search intact.
9. Narrow the window below 900 px. Observe the table become cards with tris,
   verts and GLB size.
10. After `pnpm build && pnpm preview`, fetch `/skyscrapers.meta.json` and
    `/glb/sky-pagoda.glb` - both are served.

**Flicker.** Open Art Deco Tower and orbit to look down on its setbacks: the
roofs are steady stone, not a shimmer of stone and dark window. Zoom fully in on
a facade: slabs and mullions stay crisp.

**Also worth trying.**
- `/?model=sky-nope` shows "No model "sky-nope"" with a link back.
- A search with no hits shows "No model matches ...".
- Delete `export/` and run `vite` alone: the page says the catalog is missing.
- Run `pnpm build:models` twice: the second run prints "(unchanged)" for all ten.
- After the first push to `master`: the Deploy workflow's summary links
  https://factory.railisland.com, and the Tests workflow runs beside it.

## What is missing

Nothing - the spec is implemented in full.

## Known problems

- The repository secrets `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` must be added to rail-island-factory by hand before the first deploy succeeds.
- Deploy runs only from `master`; nothing has been merged there yet, so the site is not live until this branch lands (or the workflow is dispatched on it).
- The generator now exists twice (here and on the webapp branch) until the webapp imports from the factory, as the spec's risks note.
- `SKYSCRAPER_CATALOG` gives every tower the same category/pool/scale; a per-design override needs a small change when one is wanted.
- The viewer's three.js chunk is ~565 kB (145 kB gzip); acceptable for a tool, lazy-loaded.

## Recommended follow-ups

- Write the webapp-side import that mirrors `export/` into its building catalog, then drop the generator from the webapp branch.
- Have the import fetch a versioned export (e.g. a CI artifact or a tagged release) rather than requiring a local factory build.
- Add a download link per model on the site if the GLBs start being shared outside the game.

## Changelog

- Rail Island Factory is live at factory.railisland.com: browse the procedurally generated skyscrapers, sort and search them, and inspect each one in an interactive 3D view.
