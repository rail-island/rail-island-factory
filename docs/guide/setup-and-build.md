# Setup and build

**Covers** - installing the project, the package scripts, what a build produces
and where, and the test suite.
**Code** - `package.json`, `vite.config.ts`, `tsconfig.json`, `generator/generate.ts`, `test/`
**See also** - [deploy.md](deploy.md), [../models/export.md](../models/export.md),
[../site/catalog-site.md](../site/catalog-site.md)

## Requirements

Node 22 and pnpm 10 (`packageManager` in `package.json` pins the exact pnpm).
`pnpm install` also runs the build scripts of `esbuild` and `workerd`, the two
packages `pnpm.onlyBuiltDependencies` allows.

## Scripts

| Script | What it does |
|---|---|
| `pnpm build:models` | runs the generator: writes `export/` (see [../models/export.md](../models/export.md)) |
| `pnpm dev` | `build:models`, then the Vite dev server with `export/` as its publicDir |
| `pnpm build` | `build:models`, `tsc --noEmit`, then `vite build` into `dist/` |
| `pnpm preview` | serves `dist/` locally |
| `pnpm test` | Vitest, once |
| `pnpm typecheck` | `tsc --noEmit` over `src/`, `generator/`, `test/` |
| `pnpm deploy` | `pnpm build` and `wrangler deploy` from a workstation (CI normally does it) |

`export/`, `dist/` and `.wrangler/` are gitignored: everything in them is
regenerated from the code. A full model build takes a few seconds; an unchanged
design is not re-rendered at all (see [../models/export.md](../models/export.md)).

## Layout

| Path | What lives there |
|---|---|
| `generator/` | Node-only: the mesh builder, the designs, the GLB reader, the thumbnail rasterizer, the export writer |
| `src/` | the Solid site |
| `test/` | Vitest suites, all in the node environment |
| `.github/workflows/` | `deploy.yml` and `test.yml` |

`src/` imports **types only** from `generator/` (`generator/catalog.ts` and
`generator/sourceTree.ts`, which have no `node:` imports), so no generator code reaches the browser bundle.

## Tests

`pnpm test` runs five suites:

- `test/models.test.ts` - the mesh builder winds faces outward (three.js culls
  back faces, so an inward wall is invisible in the game and the viewer), sweeps
  included; every skyscraper stands on y = 0, is taller than twice its width and
  stays under 4,000 triangles, every vehicle stands on its wheels, faces +x,
  fits a US road and its budgets (10,000 triangles, 300 kB), the articulated
  truck splits at the king pin and its trailer swings clear; parts and the
  compact encoding; no design z-fights; the bytes are deterministic; the generator writes, skips and prunes;
  every primitive sits in a scope and the source tree's triangle ranges match
  the GLB.
- `test/export.test.ts` - `skyscrapers.meta.json`, `vehicles.meta.json` and `catalog.json` match the
  designs and the files beside them, and a rebuild writes the same documents.
- `test/catalogQuery.test.ts` - the site's search, sort, formatting and URL state.
- `test/sourceTreeView.test.ts` - the Source tab's tree index, ranges and labels.
- `test/viewerHighlight.test.ts` - the preview's highlight groups and picking, on
  real GLBs loaded with three's GLTFLoader (no WebGL).
