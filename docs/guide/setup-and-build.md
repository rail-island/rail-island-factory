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
regenerated from the code. A cold full model build can take a few minutes to
check and render every design; an unchanged design is not re-rendered at all
(see [../models/export.md](../models/export.md)).

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

Full-catalog integration tests run the initial synchronous thumbnail render in
an actual Node subprocess (`test/generateSubprocess.ts`), keeping Vitest's worker
responsive to runner messages. The model suite also yields between its
synchronous geometry checks so runner replies are processed. The assertions
still check all generated files, repeatability and pruning; no model builds are mocked. These checks can take a
few minutes.

`pnpm test` runs every suite under `test/` with a 120 s default test timeout
(`vite.config.ts`): many tests build every design, and the catalog keeps growing.
Among them:

- `test/models.test.ts` - the mesh builder winds faces outward (three.js culls
  back faces, so an inward wall is invisible in the game and the viewer), sweeps
  included; every skyscraper stands on y = 0, is taller than twice its width and
  stays at or below 10,000 triangles, every vehicle stands on its wheels, faces +x,
  fits a US road and its 10,000-triangle budget and stores flat normals, the
  articulated truck splits at the king pin and its trailer swings clear; parts;
  no design z-fights; the bytes are deterministic; the generator writes, skips and prunes;
  every primitive sits in a scope and the source tree's triangle ranges match
  the GLB.
- `test/village.test.ts` - the village houses: ids and catalog fields, every
  shape on y = 0 at house size and under 10,000 triangles, finish parameters
  that only recolour, the side mirror ([../models/village.md](../models/village.md)).
- `test/export.test.ts` - `skyscrapers.meta.json`, `village.meta.json`, `vehicles.meta.json` and `catalog.json` match the
  designs and the files beside them, and a rebuild writes the same documents.
- `test/jsModel.test.ts` - each design's standalone JS model builds the GLB's triangles, colours and parts
  with real three.js, and is standalone and smaller ([../models/js-format.md](../models/js-format.md)).
- `test/catalogQuery.test.ts` - the site's search, sort, formatting, URL state and download links.
- `test/sourceTreeView.test.ts` - the Source tab's tree index, ranges and labels.
- `test/viewerHighlight.test.ts` - the preview's highlight groups and picking, on
  real GLBs loaded with three's GLTFLoader (no WebGL).
- `test/rig.test.ts` - steering, the joint renderer and `pose()` of every rigged road
  vehicle, and the trailers' and steered tyres' clearance, triangle against triangle
  with the helpers in `test/collision.ts` ([../models/vehicle-rig.md](../models/vehicle-rig.md)).
- `test/buses.test.ts` - the vlakosimdb buses' lengths, axles, doors, arches, road
  envelope and joints, and closed bodies: no ray from outside sees the inside of a
  face ([../models/buses.md](../models/buses.md)).

Most tests are synchronous and CPU-bound. `test/setup.ts` (`setupFiles` in
`vite.config.ts`) yields one macrotask after every test, because Vitest reads its
workers' progress-report replies only when the event loop turns: a chain of
synchronous tests longer than 60 s otherwise fails the run with "Timeout calling
onTaskUpdate" though every test passed. Keep any single test well under that, or
`await` a `setImmediate` between its long steps (the `generateModels` test does).
