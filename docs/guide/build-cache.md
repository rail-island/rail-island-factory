# The build cache

**Covers** - the committed `build-cache/` (every design's build facts and the confirmed
models' thumbnails), how a design's cache key is made, what a build skips for an
unchanged design, `export/.build-keys.json`, the deploy's export cache, what to
commit after a model change, and merging branches that both changed it.
**Code** - `generator/buildCache.ts`, `generator/cacheResolve.ts`, `.gitattributes`, `generator/generate.ts` (`generateModels`,
`generateJsModels`, `buildExport`, `designKeys`), `generator/jsModel.ts` (`bundleFlags`),
`.github/workflows/deploy.yml`, `test/buildCache.test.ts`
**See also** - [setup-and-build.md](setup-and-build.md), [deploy.md](deploy.md),
[../models/export.md](../models/export.md), [../site/workshop.md](../site/workshop.md)

## Why

Building, checking and measuring every one of the catalog's 1,046 designs took a
cold `pnpm build:models` about 13 minutes on four cores, and every deploy started
cold (`export/` is gitignored). The slow parts were not the geometry itself:

| Part | Cold, all designs |
|---|---|
| building every design, the z-fighting and LOD / coarse / Max checks | ~2 min |
| the vehicles' rider seats (a 10 cm height map of every triangle, riderSeat.ts) | ~2.5 min |
| the JS bundles, mostly building the models again for what a bundle needs to know | ~2.7 min |
| the confirmed models' thumbnails (the software rasterizer) | ~2 min |
| the OpenTTD formations' and the legacy table's measurements | ~0.7 min |

All of it is a pure function of the design's code and data, so it is kept.

## What is kept

`build-cache/` is committed:

| Path | What |
|---|---|
| `build-cache/facts/<id>.json` | a design's facts under its key, a file per design: triangles, `glbStats`, rig, side-view frame, rider seat, an aeroplane's boarding door, the JS bundle's switches (`BundleFlags`: rigged, surfaces, passenger hints, interior) and the extents measured for the legacy table and the OpenTTD formations, by parameter values |
| `build-cache/thumbs/<id>.png` | a confirmed model's thumbnail (no draft's: the site draws those in the browser, [../site/workshop.md](../site/workshop.md)) |

A design's facts are written only once it passed the checks, so a cached design
needs no check again. The source trees (200 MB of JSON) and the JS models are not
committed: they are rewritten from a build or kept in the export (below).

## The key

`designKey` (`buildCache.ts`) is a SHA-256 over:

- the text of every file the design's source module imports, at any depth - static
  `import ... from`, `export ... from` and bare `import "..."`, `.json` files
  included, line endings normalised. A dynamic `import()` does not count: only a
  command-line entry uses one (`renderGlbThumb.ts` loads `generate.ts` so), and
  generator code reads no files at build time;
- the same over `PIPELINE`, the files every design passes through: the recording mesh
  builder and GLB writer, the source tree, the checks, `glbStats`, the rider seat, the
  thumbnail renderer, the JS bundler and its lean builder;
- the design's own data - every field, a function by its name - which takes in
  what `generate.ts` puts on it (its procedural id, its OpenTTD block);
- for an aeroplane, the text of `boardingDoor.ts`, the boarding door's measurement
  ([../models/boarding-door.md](../models/boarding-door.md)) - an aeroplane's key only,
  so changing it rebuilds no other design;
- the settings the build reads beside it: its catalog fields, whether it is a
  vehicle and takes the side view, `THUMB_VERSION` and the thumbnail size, the
  coarse and Max detail caps, the esbuild version and `CACHE_VERSION`.

`generate.ts` is not part of any key, and neither is a table the site or the game's
meta files change for other reasons (`catalogModels.json`, `linkTable.ts`,
`soundTable.ts`, `openttdTable.ts`, `openttdIds.json`, `countryTable.ts`, the
phrasebooks): adding a family, confirming a model or adding a link re-keys no model.
`test/buildCache.test.ts` checks that. A change in a shared kit re-keys exactly the
designs whose modules import it; a change in a `PIPELINE` file re-keys every design.

## A build

`generateModels` keys every design (about half a second for the catalog) and builds
only what the cache cannot give:

- **cached** (the facts' key matches): not built, not checked. Its thumbnail is copied
  from `build-cache/thumbs/` into `export/thumbs/`, its tree file stays as it is,
  its JS model stays (`generateJsModels`), and the legacy table and the OpenTTD
  check read its extents from the facts.
- **cached, but a file is missing** (a fresh checkout has no `export/`): built
  without the checks, for its source tree, or for a confirmed model's thumbnail
  missing from the cache.
- **changed** (no facts under its key): built, checked, measured; a confirmed model's
  thumbnail rendered into `build-cache/thumbs/`; its facts stored. A z-fighting or
  over-budget design still fails the build before anything is written.

`generateJsModels` bundles a design only when its file was not written for its key,
with its cached `BundleFlags`: esbuild alone, eight bundles at a time, no build.
`export/.build-keys.json` records the key each JS model and source tree in the export
was written for. Facts of a design that no longer exists, and thumbnails of one that
is not confirmed, are removed.

A test's own export folder gets a cache of its own (`.build-cache/` inside it,
`cacheDirFor`), and a design with no source module (a test's) is never cached.

## The deploy

`deploy.yml` restores the newest `export/` from the GitHub Actions cache before
`pnpm build` and saves this run's under its commit. With the committed
`build-cache/` current and the restored export, an unchanged design costs only its
key; a stale file is rewritten, never shipped, because its key no longer matches.
Without either cache the build is still correct, only slower.

## After a model change

Run `pnpm build:models` and **commit `build-cache/`** with the change. Every new,
changed or newly confirmed model's facts and thumbnail land there, which also makes
`build-cache/thumbs/<id>.png` the place to look at the result.
`test/buildCache.test.ts` fails while the committed cache is stale - a design whose
key moved, a design that no longer exists, a confirmed model without its thumbnail -
and names them. Never edit `build-cache/` by hand.

## Merging

The facts are a file per design (they were one `facts.json`, which every pair of
branches that touched any model conflicted in, and resolving it by taking one side
threw the other side's entries away, so every design it had re-keyed was built
again). Now git merges two branches that changed different designs without a
conflict: each side's files are kept as they are, and after the merge every file
still matches its design's key unless the merged code re-keys it (a shared kit both
branches changed), which `pnpm build:models` then rebuilds alone.

Where both branches changed the same design, its file (or thumbnail) conflicts.
`.gitattributes` marks `build-cache/**` `merge=binary`, so git never writes conflict
markers into it; run **`pnpm cache:resolve`** (`cacheResolve.ts`): it takes the
incoming side's file of each conflicted path (or drops one that side deleted), runs
the build - which rebuilds exactly the designs whose key no longer matches, usually
the few both branches changed - and stages `build-cache/`. A facts file that does not
parse or holds another `CACHE_VERSION` is skipped on reading, so its design is
built again rather than failing the build. An old single `facts.json` is read once
and removed on the next save.

`CACHE_VERSION` (`buildCache.ts`) is bumped when what a facts entry holds or how a
key is made changes; `THUMB_VERSION` (`generate.ts`) when a thumbnail's framing or
lighting does. Either rebuilds every design once.
