# Setup and build

**Covers** - installing the project, the package scripts, what a build produces
and where, and the test suite.
**Code** - `package.json`, `vite.config.ts`, `generator/devServer.ts`, `tsconfig.json`, `generator/generate.ts`, `test/`
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
| `pnpm dev` | the Vite dev server, with no export folder: models are built on demand and measured and thumbnailed in the browser ([../site/catalog-site.md](../site/catalog-site.md), "Local dev") |
| `pnpm build` | `build:models`, `tsc --noEmit`, then `vite build` into `dist/` |
| `pnpm preview` | serves `dist/` locally |
| `pnpm test` | Vitest, once |
| `pnpm typecheck` | `tsc --noEmit` over `src/`, `generator/`, `test/` |
| `pnpm deploy` | `pnpm build` and `wrangler deploy` from a workstation (CI normally does it) |

`export/`, `dist/` and `.wrangler/` are gitignored: everything in them is
regenerated from the code. A cold full model build can take a few minutes to
check and render every design; an unchanged design is not re-rendered at all
(see [../models/export.md](../models/export.md)). `pnpm dev` does not run it: the
dev server is ready in about a second and builds a model only when the page asks
for it.

## Layout

| Path | What lives there |
|---|---|
| `generator/` | Node-only: the mesh builder, the designs, the in-memory GLB writer and reader, the thumbnail rasterizer, the export writer |
| `src/` | the Solid site |
| `test/` | Vitest suites, all in the node environment |
| `.github/workflows/` | `deploy.yml` and `test.yml` |

`src/` imports **types only** from `generator/` (`generator/catalog.ts` and
`generator/sourceTree.ts`, which have no `node:` imports), so no generator code reaches the browser bundle.

## Tests

`pnpm test` runs every suite under `test/` and **must finish in under five
minutes** (AGENTS.md); it takes about three on a four-core machine
(`vite.config.ts`). Three things keep it there:

- **Shared workers.** `isolate: false` runs the files of a worker in one module
  registry: the generator is loaded once per worker, not once per file, and
  `maxWorkers: "100%"` uses every core.
- **One build per design.** `test/catalogCache.ts` keeps each design's default
  build (GLB bytes, triangles, rig, source tree), its LOD and its bundled JS
  module, so the files a worker runs share them. The checks every design gets
  run in **one pass per design** (`test/catalogSweep.ts`), split into eight
  files, `test/catalog-1.test.ts` .. `test/catalog-8.test.ts`, by position in the
  catalog: no z-fighting; deterministic GLB bytes and source tree; every
  primitive in a named scope and the tree's ranges tiling the GLB; the JS model
  building the GLB's triangles, colours, nodes, rig and clips, standalone and
  smaller than the full and LOD GLBs; the standalone LOD as the generator builds
  it, in budget; a rigged vehicle's `pose()`.
- **Sampled variants.** A test that builds a design's parameter combinations
  checks the defaults and three others spread evenly through the list, the same
  ones every run (`variantsUnderTest` and `sample` in `test/catalogCache.ts`):
  the sweep's flicker, envelope and JS-against-generator checks, the LOD
  checks, and the family suites' per-variant loops. **`TEST_ALL_VARIANTS=1 pnpm
  test` checks every combination**; it takes far longer, so it runs only when
  the user asks for it (AGENTS.md).

The whole-export tests export a few designs, not the catalog: `buildExport` and
`generateModels` take a design list, and `pnpm build` (which runs the same code
on every design, z-fighting guard included) covers the rest. Among the suites:

- `test/catalogSweep.ts` (via `test/catalog-*.test.ts`) - the per-design checks above.
- `test/models.test.ts` - the mesh builder winds faces outward (three.js culls
  back faces, so an inward wall is invisible in the game and the viewer), sweeps
  included; `findCoplanarOverlaps` finds and ignores the right faces; every
  skyscraper stands on y = 0, is taller than twice its width and stays at or
  below 10,000 triangles, every vehicle stands on its wheels, faces +x, fits a
  US road and its 10,000-triangle budget and stores flat normals, the
  articulated truck splits at the king pin and its trailer swings clear; the
  generator refuses a z-fighting design, writes, skips and prunes.
- `test/village.test.ts` - the village houses: ids and catalog fields, every
  shape on y = 0 at house size and under 10,000 triangles, finish parameters
  that only recolour, the side mirror ([../models/village.md](../models/village.md)).
- `test/export.test.ts` - `skyscrapers.meta.json`, `village.meta.json`, `vehicles.meta.json` and `catalog.json` match the
  designs and the files beside them, no GLB is written, every vehicle carries its game properties
  ([../models/game-properties.md](../models/game-properties.md)), and a rebuild writes the same documents.
- `test/jsModel.test.ts` - the bundler: no recorder or GLB writer in a bundle,
  deterministic bundles and `generateJsModels` ([../models/js-format.md](../models/js-format.md)).
- `test/params.test.ts` - parameter resolution and enumeration, valid enums and
  the meta entries' parameters ([../models/parameters.md](../models/parameters.md)).
- `test/catalogQuery.test.ts` - the site's search, sort, formatting, URL state and download links.
- `test/sourceTreeView.test.ts` - the Source tab's tree index, ranges and labels.
- `test/viewerHighlight.test.ts` - the preview's highlight groups and picking, on
  real designs built by their JS modules as the site builds them (no WebGL).
- `test/rig.test.ts` - steering, the joint renderer and the articulated vehicles'
  joints, and the trailers' and steered tyres' clearance, triangle against triangle
  with the helpers in `test/collision.ts` ([../models/vehicle-rig.md](../models/vehicle-rig.md)).
- `test/buses.test.ts` - the vlakosimdb buses' lengths, axles, doors, arches, road
  envelope and joints, and closed bodies: no ray from outside sees the inside of a
  face ([../models/buses.md](../models/buses.md)).
- `test/openttdGrf.test.ts`, `test/openttdExport.test.ts`, `test/exportList.test.ts` -
  the site's export ([../site/openttd-export.md](../site/openttd-export.md)).

Most tests are synchronous and CPU-bound. `test/setup.ts` (`setupFiles` in
`vite.config.ts`) yields one macrotask after every test, because Vitest reads its
workers' progress-report replies only when the event loop turns: a chain of
synchronous tests longer than 60 s otherwise fails the run with "Timeout calling
onTaskUpdate" though every test passed. Keep any single test well under that, or
`await` a `setImmediate` between its long steps. The same goes for work a file
does while it registers its tests: `warm()` in `test/catalogCache.ts` builds
designs ahead with a yield between them (the catalog files and
`test/rig.test.ts` use it), and `test/modelReference.test.ts` measures the
legacy table's models in an awaited loop.

Since a worker's files share their modules, a test must not depend on a module's
state as another file leaves it: `generate.ts` turns every design's id into its
procedural id on import, so compare ids through `proceduralId`.
