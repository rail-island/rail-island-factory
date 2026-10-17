# Remove GLB processing

Status: agreed
Date: 2026-10-17
Area: rail-island-factory (generator, export, catalog site, tests, assets, skills, docs) and rail-island-webapp (asset build, Creator, catalogs, Worker, storage, tests, docs)

## Context of the change

Every model the game draws is now a procedural factory model, delivered as a
standalone JS module (`build(THREE, params, lod)`). The webapp switched to
procedural models only in its own `docs/specs/2026-10-16-procedural-models-only.md`,
but kept the whole GLB pipeline "for now". GLB code is still spread over both repositories.

### Factory (`rail-island-factory`)

- `generator/meshBuilder.ts` writes its own GLB (`toGlb`) per design at default
  params into `export/glb/<id>.glb`. This is the artefact the per-design
  incremental build keys on: the thumbnail is re-rendered only when the GLB bytes
  change.
- `generator/renderGlbThumb.ts` rasterizes thumbnails by reading the GLB file
  back from disk.
- Other code that parses GLB bytes:
  - `catalog.json` triangle, vertex, material and bbox stats (`glbStats.ts`), plus GLB byte and gzip sizes.
  - The z-fighting guard (`coplanar.ts`, on the full model and the LOD).
  - Legacy target sizes (`legacyMapping.ts`).
  - The review rasterizers (`orthoViews.ts`, `unitViews.ts`).
  - The 12 `*Comparison.ts` and 12 `*Report.ts` vlakosimdb native comparisons (about 3,000 lines): mesh -> `toGlb` -> `parseGlb` against hand-annotated BMP `landmarks.json`.
  - About 43 of the 49 test files, through `glbParse`, `glbTriangles`, `glbStats`, `glbPose` and `designGlb`.
- The site `src/ModelViewer.tsx` loads the GLB with `GLTFLoader` at default
  params and the JS model otherwise, and offers GLB downloads in the table and cards.
- `assets/` is 164 MB:
  - 1,152 vlakosimdb BMPs (22 MB) and 445 XMLs (30 MB).
  - About 104 MB of photos.
  - 133 `landmarks.json`, 117 `baseline.json` and 58 `COMPARISON.md`.
  - Two reference GLBs.
- No code reads vlakosimdb XML.
- Skills (`vlakosimdb-transfer`, `road-vehicle`, `aircraft`, `building`,
  `railroad-vehicle`) and many docs describe the GLB and native-comparison workflow.

### Webapp (`rail-island-webapp`)

- Stored models: 531 GLBs (131 MB) in `db/` (train, buildings, motocar, tram, trucks, ships, aircraft, cablecar), with their thumbs and meta files.
- `build:assets` still runs:
  - the legacy vehicle and building GLB builds (`scripts/models/build.ts`, `buildBuildings.ts`, the fleet entry builders);
  - LOD baking (`buildVehicleLod.ts`, `buildBuildingLod.ts`);
  - meshopt encoding (`encodeGlb.ts`, gltf-transform and meshoptimizer);
  - footprint measurement and thumbnail rendering.
- Other GLB tooling: `pnpm import:vehicles` mirrors vlakosimdb's export into `db/`, and `objToGlb.ts` converts OBJ files.
- `scripts/models/buildProcedural.ts` still reads `public/legacy-manifest.json` and
  `legacy-buildings.json` (outputs of the GLB build) for vehicle physics (weight,
  power, maxspeed, accel), draftFrac, ropeFrac, boardFrac, sizeClass and building
  plaza/block rules. Without them it falls back to category defaults.
- Runtime GLB code is dead or nearly so:
  - The `VehicleCatalog` and `HouseCatalog` GLB branches; no manifest entry has a non-empty `glb`.
  - `glbLoader.ts`, `staticAssets.ts`, `glbInspect.ts`, `glbVoxelise.ts`, `dequantize.ts`, the `.lod.bin` proxies and the Worker's `/api/lod/` route.
- The Creator (`src/creator/`) has two model tabs, PROCEDURAL and COMMON:
  - COMMON lists the old GLBs from `models-catalog.json` and previews the GLB itself.
  - MINE, COMMUNITY, ARCHIVE, uploads and packages were already removed from models.
  - The Creator's Woods section still has Common, Mine and Community.
- User and community models:
  - `worker/userModels.ts` and `worker/communityModels.ts`: uploads are refused unless `MODEL_UPLOADS_ENABLED`, but reads are still served.
  - D1 table `public_models`.
  - R2 `users/<sub>/db/<modelId>.glb|.src.glb|.webp|.json`.
  - `user/<guid>` ids in saved maps draw as stand-in boxes.
- Saved maps store model ids and params. Old GLB ids resolve at draw time through
  the factory's `legacy-models.json` (531 ids). It does not depend on any GLB.

## User request

In both webapp and factory, remove GLB processing: recoding, import from
vlakosim DB, analysing etc. We have everything now in procedural models; GLBs
are no longer needed. In the Creator, remove tabs COMMUNITY, COMMON, MINE - keep
only PROCEDURAL (so remove the tab control entirely). Simplify the pipeline as
much as possible - no GLB processing.

## Decisions

### In the factory, what replaces the GLB as the build's primary per-design output (thumbnails, catalog stats, z-fighting guard and tests all read GLB bytes today)?
| Option | What it means |
|---|---|
| In-memory triangles | Stop writing export/glb/. Thumbnails, stats, coplanar check and tests read the MeshBuilder's triangle soup directly; incremental build keys on a hash of the JS model / triangles. toGlb and glbParse are deleted. Large test rewrite. |
| Thumbnails from JS model | Same, but thumbnails and checks run the shipped JS model (build(THREE)) in Node, so what is checked is exactly what the game draws. Slower build, needs three in the generator path. |
| Keep toGlb internally | No GLB files written or shown on the site, but toGlb stays as an internal serialisation that stats, thumbnails and tests parse. Least work, but GLB code remains. |

**Answer: Keep toGlb internally**

### What happens to the vlakosimdb native-comparison tooling in the factory (12 *Comparison + 12 *Report files, landmarks.json/baseline.json/COMPARISON.md, 22 MB BMP + 30 MB XML in assets/, the vlakosimdb-transfer skill)?
| Option | What it means |
|---|---|
| Remove all of it | Delete comparisons, reports, their tests, the XML/BMP/landmark/baseline files and the skill. Models frozen; loses proportion regression tests. |
| Keep comparison tests only | Keep *Comparison + landmarks.json + BMPs as regression tests, ported to in-memory triangles; delete *Report CLIs, XML, COMPARISON.md and baselines. |
| Keep everything, port off GLB | Only swap GLB parsing for in-memory triangles; tooling and assets stay. |

**Answer: Keep everything, port off GLB**

### On the factory site, what does the 3D preview and the download offer once there is no GLB?
| Option | What it means |
|---|---|
| JS model only | Viewer always builds from the JS module (default params too); GLB size column and download disappear; JS download stays. |
| JS + export GLB on demand | Viewer uses JS; a "Download GLB" button exports the built scene in the browser with GLTFExporter. No GLB in the build. |

**Answer: JS model only**

### The two factory answers pull slightly apart: toGlb stays as an internal serialisation, but the comparisons "port off GLB". Which reading is right?
| Option | What it means |
|---|---|
| One internal GLB path | toGlb + glbParse/glbTriangles stay as the single internal analysis path for everything (stats, thumbs, coplanar, tests, comparisons, reports). Nothing written to disk or shown; the comparisons need no porting. |
| Comparisons on triangles | Comparisons and reports move to in-memory triangles; toGlb stays only for stats, thumbnails, coplanar and tests. Two analysis paths coexist. |

**Answer: One internal GLB path** - this supersedes the "port off GLB" part of the
previous answer: the vlakosimdb tooling and assets all stay, unchanged, on the
internal GLB path.

### The webapp's procedural build still takes vehicle physics (weight, power, maxspeed, accel), draft/rope/board fractions, sizeClass and building plaza/block rules from the legacy GLB manifests. Where do these values live after the GLB build is gone?
| Option | What it means |
|---|---|
| Factory meta.json | Snapshot today's values once into the factory designs; the meta.json files carry them; the webapp reads them from the import. Factory becomes the single source. |
| Frozen JSON in webapp | Snapshot today's legacy fields once into a committed webapp file keyed by procedural id; buildProcedural reads it. New designs get category defaults until added by hand. |
| Category defaults | Drop the inherited values; every vehicle/building uses category defaults. Changes gameplay for existing maps. |

**Answer: Factory meta.json**

### What happens to the webapp's 531 source GLBs (131 MB in db/), the GLB build/LOD-bake/meshopt scripts, the vlakosimdb import (pnpm import:vehicles + skills) and the dead GLB branches in VehicleCatalog/HouseCatalog?
| Option | What it means |
|---|---|
| Delete all | Remove db/ GLB trees, thumbs and meta, every GLB script, import:vehicles, objToGlb, the add-buildings/building-scales/import-vehicles skills, runtime GLB loaders and catalog branches, /api/lod, gltf-transform/meshoptimizer deps. Git history keeps the files. |
| Delete code, keep db/ files | Remove pipeline/runtime code, leave db/ GLBs in the repo as an archive. |
| Move db/ to an archive repo | Delete from webapp; push the db/ trees to a separate archive repository first. |

**Answer: Delete all**

### User and community uploaded models (uploads already disabled): Worker routes /api/models*, D1 table public_models, R2 users/<sub>/db/*.glb, user/<guid> ids in saved maps drawn as stand-in boxes. What to do?
| Option | What it means |
|---|---|
| Remove code, keep stand-ins, delete data | Delete routes and code; drop public_models by migration; delete R2 users/*/db/ objects; keep the user/<guid> stand-in box. |
| Remove code, leave data | Delete routes and code, keep stand-ins; leave the D1 table and R2 objects untouched (orphaned) for a later cleanup. |
| Keep as is | The user-model backend stays read-only as today. |

**Answer: Remove code, leave data**

### The Creator's Woods section still has Common/Mine/Community tabs (woods types, not GLBs). Does "remove the tab control entirely" cover it?
| Option | What it means |
|---|---|
| Models only | Only the model list loses its PROCEDURAL/COMMON switch; Woods keeps its tabs. |
| Woods too | Remove Woods' Mine/Community and its user/community woods storage as well. |

**Answer: Models only**

### How do the snapshotted physics/plaza values live in the factory before they reach the meta.json files?
| Option | What it means |
|---|---|
| Fields on each design | Values written once into the TypeScript design declarations (a game-properties block: weight, power, max speed, accel, ...); reviewed per model, new designs must fill them. Exported into the meta entries. |
| Committed JSON table | One JSON file keyed by model id, produced once from the webapp's current legacy-manifest; merged into meta at build. |

**Answer: Fields on each design**

### The export contract today carries a `glb` field in every meta.json entry and glbUrl/glbBytes/glbGzipBytes in catalog.json. What happens to them?
| Option | What it means |
|---|---|
| Remove the fields | Meta entries carry `js` (and thumb) instead; the webapp import and procedural build change in the same plan. |
| Keep, empty | `glb` stays as an empty string for compatibility; no consumer-side change now. |

**Answer: Remove the fields**

### Without the COMMON tab, the Creator no longer shows which old GLB id maps to which procedural model. Keep that information anywhere?
| Option | What it means |
|---|---|
| Drop it | Creator lists procedural models only; the legacy table keeps working silently for saved maps; models-catalog.json loses legacy rows. |
| Alias list on detail | A procedural model's detail panel lists the old ids that resolve to it, text only. |

**Answer: Drop it**

### When a factory design has no game-properties block (a new vehicle, or one the legacy snapshot did not cover), what happens?
| Option | What it means |
|---|---|
| Build fails | Vehicles must declare their properties; the factory build/test fails until they do. No silent category defaults. |
| Category defaults | The webapp falls back to category defaults with a warning, as it does today when the legacy manifests are missing. |

**Answer: Build fails**

### How is the work delivered across the two repositories?
| Option | What it means |
|---|---|
| Factory first, then webapp | The factory change lands first (no GLB files, new meta fields incl. game properties); then the webapp imports it and deletes its GLB pipeline. Each repo stays green on its own. |
| Webapp cleanup first | The webapp freezes today's physics into its own build first and deletes the GLB pipeline; the factory follows and the webapp switches source later. |

**Answer: Factory first, then webapp**

## High-level plan

1. **Factory: game properties.** Snapshot, once, the values the webapp now
   inherits from its legacy GLB manifests into each vehicle and building design
   as a game-properties block:
   - for vehicles: weight, power, max speed, acceleration, the old placement scale, draftFrac, ropeFrac, boardFrac and sizeClass;
   - for buildings: plaza and block rules.

   The snapshot is taken from the webapp's current `public/legacy-manifest.json`
   and `legacy-buildings.json`, matched per design and, where the old manifest
   differed per parameter variant, per variant. A vehicle design without the block
   fails the build and the tests. The block is exported in the meta.json entries.
2. **Factory: no GLB output.**
   - The build stops writing `export/glb/`.
   - `toGlb` with `glbParse`/`glbTriangles` stays as the one internal, in-memory analysis path for all of these:
     - thumbnails;
     - `catalog.json` stats;
     - the z-fighting guard and the legacy target sizes;
     - the vlakosimdb comparisons and reports;
     - tests.
   - Thumbnails are rasterized from the in-memory bytes, not from a file.
   - The incremental build keys on those bytes (or their hash) instead of a file on disk.
   - The meta.json `glb` field and `catalog.json` `glbUrl`/`glbBytes`/`glbGzipBytes` are removed.
   - Docs, skills and AGENTS.md stop describing a GLB export. The vlakosimdb tooling, its assets and its skill stay as they are.
3. **Factory site: JS only.** The viewer always builds from the JS module,
   default params included. `GLTFLoader`, the GLB size column and the GLB
   download go; the JS download stays.
4. **Webapp: consume the new contract.** Re-import the factory export. Its procedural build
   takes game properties from the factory meta instead of the legacy manifests,
   and reads `js` instead of `glb`.
5. **Webapp: delete the GLB pipeline.** Remove:
   - the `db/` GLB trees with their thumbs and meta;
   - the legacy vehicle and building builds, LOD baking, meshopt encoding, footprint measurement, thumbnail rendering and OBJ conversion;
   - `import:vehicles` and the `import-vehicles`, `add-buildings-to-catalog` and `building-scales` skills;
   - the runtime GLB loaders and the dead GLB branches in the vehicle and house catalogs;
   - the `.lod.bin` legacy proxies and `/api/lod/`;
   - the GLB-only dependencies.

   `build:assets` becomes the factory import, the procedural build and the
   catalog. Anything the procedural far-band path shares with the old proxy code stays.
6. **Webapp: user and community models.** Delete the upload, community and
   file-serving Worker routes, GLB validation (`glbInspect`, `modelDetect`) and
   the clients. Keep only what draws a `user/<guid>` id as a stand-in box, so old
   maps load. The D1 table and the R2 objects are left in place, unused.
7. **Webapp: Creator.** The model list shows procedural models only. The
   PROCEDURAL/COMMON switch, the `origin` URL parameter, the GLB preview path
   and the legacy rows of `models-catalog.json` go. The Woods section keeps
   its tabs. The obsolete upload, community and archive i18n keys go too.
8. **Docs** in both repos are updated with each step. The webapp's CLAUDE.md
   Assets section is rewritten for a db/ without GLBs.

Phases 1-3 are one factory change. Phases 4-8 are one webapp change that
depends on the factory change being on master.

## Database and persistent storage

- **Factory design declarations (source code, committed).**
  - What it holds: a new game-properties block per design. Vehicles carry weight
    (t), power (kW), max speed (km/h), acceleration, old placement scale,
    draftFrac, ropeFrac, boardFrac and sizeClass. Buildings carry plaza and block
    rules in the shapes the webapp already uses. Optional overrides per parameter
    variant.
  - Who writes and reads it: written once from the webapp's current legacy
    manifests, then by hand; the factory build reads it.
  - Lifetime: permanent. Required for vehicles.
- **Factory export meta.json files (generated, gitignored; the import contract).**
  - New: the game-properties block per entry.
  - Removed: the `glb` field.
  - `catalog.json` loses `glbUrl`, `glbBytes` and `glbGzipBytes`.
  - `export/glb/` is no longer written.
  - `legacy-models.json` and `model-reference.js` are unchanged.
- **Webapp `db/procedural/` (committed import mirror).** It carries the new meta
  fields. `db/` loses every GLB tree, which is about 131 MB of files plus thumbs
  and meta; git history keeps them.
- **Webapp generated `public/` files.**
  - No longer produced: `legacy-manifest.json`, `legacy-buildings.json`, `public/models/*.glb` and the `.lod.bin` files.
  - `models-catalog.json` loses its legacy rows.
  - `manifest.json` and `buildings.json` keep their shape: the values only change source, and `glb: ""` may be dropped.
- **D1 table `public_models` and R2 `users/<sub>/db/*`.** Left untouched: no
  migration, nothing deleted, nothing reads or writes them any more. Account
  reset logic that counts or deletes `public_models` either stays or is removed
  together with the code. Either way, no data changes.
- **Saved maps.** No change. Old GLB ids still resolve through the legacy table.
  `user/<guid>` ids still draw as stand-in boxes.

## Architecture decisions

- **toGlb stays as the single internal analysis format.** Porting the thumbnail
  rasterizer, stats, z-fighting guard, comparisons and about 43 test files to
  raw triangles is the larger rewrite. One serialisation everyone already parses
  keeps a single code path, and it removes everything user- and
  consumer-visible about GLB.
- **The factory owns the game properties.** This beats a frozen webapp table:
  a new design arrives complete with physics. The build failing on a missing
  block prevents silent category defaults that would change gameplay.
- **The contract fields are removed, not kept empty.** Both consumers change in
  the same plan anyway, and an empty `glb` would invite new dead branches.
- **Factory first.** The webapp cannot delete its legacy manifests until the
  factory carries the values they provide. Each repository stays green on its own.
- **User data is left in place.** Deleting R2 objects and dropping a D1 table
  are irreversible. Leaving them orphaned costs only storage and keeps the
  option open.

## Weaknesses and risks

- **The snapshot can mis-assign values (medium likelihood).** Old-to-new
  matching goes through the legacy table, and some designs map from several old
  ids or substitutes. A train could then get another vehicle's power or speed.
  Mitigation: produce the snapshot from the same matching code `buildProcedural`
  uses today, and diff the webapp's built `manifest.json` before and after.
  The physics fields must be identical.
- **Internal GLB remains.** The factory still contains `toGlb`, `glbParse` and
  the GLB-based tests. "No GLB processing" holds for outputs and the webapp, not
  for the factory's internals. A later spec could port them to triangles.
- **The default-param viewer now runs the JS model.** A JS/GLB parity
  difference that hid behind the GLB path (materials, normals, rig) may show on
  the site. The existing parity test covers the triangles, not materials.
- **Cold-build thumbnail timing.** Thumbnails rendered from memory must keep
  the "re-render only on change" behaviour. Without a GLB file on disk to
  compare against, it needs a stored hash, or every build re-renders 189 thumbs.
- **The webapp embedded build** (`scripts/embedded/content.ts`) and
  `public/service-worker.js` / `_headers` reference GLB paths. They must be
  cleaned, or the embedded build breaks.
- **Orphaned D1 and R2 data** keeps costing storage and still holds user
  uploads. Account reset must not regress: a user deleting their account still
  expects their uploads gone, so keep that deletion or note it.
- **Open:** whether to keep or remove the `accountReset` handling of
  `public_models` and the R2 user-model prefix. The spec leaves the data in
  place; the reset path is decided during implementation, defaulting to keeping
  the deletion.

## Out of scope

- Porting the factory's internal analysis (thumbnails, stats, comparisons,
  tests) off GLB to raw triangles.
- Removing or slimming the vlakosimdb comparison tooling, its BMP/XML assets or
  the `vlakosimdb-transfer` skill.
- Deleting the D1 `public_models` table or the R2 user-model objects.
- The Creator's Woods section and its Common/Mine/Community tabs, and user or
  community woods storage.
- Showing old-id aliases anywhere in the Creator.
- Re-tuning any physics value; the snapshot copies today's values unchanged.
- Generating new LOD variants, and the public API consumed by web-railisland-com.
