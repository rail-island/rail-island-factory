# OpenTTD GRF and GLB export

Spec: docs/specs/2026-10-17-openttd-grf-export.md
Date: 2026-10-17
Status: implemented
Area: catalog site (`src/`: model page, app bar, export panel, export run, `src/openttd/`), design metadata (`generator/design.ts`, `generator/catalog.ts`, `generator/generate.ts`, `generator/vehicles.ts`), docs

## What was done

- **Export list.** Every model page has an "Add to export" button that adds the
  model at the parameter values on screen; the same model can be listed once per
  variant. The app bar's "Export (n)" button opens a side panel with the entries
  (thumbnail, title, variant, remove), the set name, the format (GRF for OpenTTD
  or ZIP of GLB files), Export with progress and Cancel, and a report of skipped
  entries. The list lives in localStorage under `factory.openttdExport`
  (`src/exportList.ts`, `src/ExportPanel.tsx`, `src/App.tsx`, `src/ModelDetail.tsx`).
- **ZIP of GLBs.** `src/exportRun.ts` builds each entry from its JS module and
  writes it with three's `GLTFExporter`; `src/zip.ts` packs them, stored, with
  fixed dates.
- **GRF.** `src/openttd/`: `properties.ts` (vehicle type, figures with category
  defaults, part lengths, hashed ids, GRF id), `projection.ts` (per part and
  direction: model-to-tile matrix, sprite frame, projection, clipping planes),
  `spriteRenderer.ts` (WebGL), `pixels.ts` (filtering to 4x, 2x and normal zoom),
  `grf.ts` (the container v2 encoder and its sprite compression). Model loading
  moved from `ModelViewer.tsx` into `src/modelModule.ts`, shared by both.
- **Design metadata.** An optional `openttd` block on a design
  (`OpenttdProperties`, `checkOpenttdProperties`), carried into `catalog.json`
  only; the CD 163 declares one.
- **Docs.** New `docs/site/openttd-export.md` (indexed); `catalog-site.md`,
  `export.md` and `game-properties.md` updated.
- **Checks.** The GRF layout was compared with nmlc 0.9's output for the same
  NML, and GRFs built in node by the same encoder and projection (with a software
  rasterizer standing in for WebGL) were loaded in OpenTTD 13.4 with a test AI
  that builds track, road and the exported vehicles: no load warnings, correct
  names and figures, articulated trains and buses, sprites aligned on the track.
  `pnpm typecheck` and `pnpm build` pass; `pnpm test` passes (3,872 tests, after
  the suite was redesigned to run in under three minutes - see Follow-up changes).

## Follow-up changes

1. Make the test suite run in under five minutes. The full suite had grown past
   40 minutes; it now runs in about 2.5 minutes on four cores: shared workers
   (`isolate: false`), one build and bundle per design (`test/catalogCache.ts`), the
   per-design checks in one sharded pass (`test/catalogSweep.ts`), sampled variants
   (`TEST_ALL_VARIANTS=1` for all), whole-export tests on a few designs, and a
   sweep-and-prune prefilter in the z-fighting detector (docs/guide/setup-and-build.md).
2. Exported locomotives crawled in OpenTTD: their "Max. Tractive Effort" read 0 kN.
   The encoder now writes the tractive effort coefficient 0.3 for every train and
   road vehicle (as nmlc does), and a regression test in `test/openttdGrf.test.ts`
   pins it; in OpenTTD 13.4 the CD 163 now has 250 kN.
3. Trains sat beside their rails, and a long coach's slices did not line up (shifted
   doors, a jagged roof). OpenTTD draws a vehicle's sprite from a corner of its
   bounding box, moved by direction and length, not from its position; the sprite
   offsets now count from that anchor (`spriteAnchor`), pinned by a regression test
   in `test/openttdExport.test.ts` and checked in OpenTTD 13.4.

## How to test

**Automated coverage.** No E2E framework exists in the repository (and AGENTS.md
asks for headless checks); the logic is covered by Vitest:
`pnpm exec vitest run test/openttdGrf.test.ts test/openttdExport.test.ts test/exportList.test.ts`.
The WebGL sprite renderer and the panel are browser-only.

**Setup.** `pnpm dev`, open the site. OpenTTD 13 or 14 with any base set for the
GRF check.

**Steps.**
1. Open the CD 163 / 363 model page; press **Add to export**. The button turns to
   "In the export" and the app bar reads **Export (1)**.
2. Choose Livery "CD 162" in Parameters; the button reads "Add to export" again;
   press it. **Export (2)**.
3. Open a bus (Mercedes-Benz O 345 G), a coach (CSD Bam), a ship (Passenger
   Ferry), an aircraft (Boeing 737-800) and a building (any skyscraper); add each.
4. Press **Export (7)** in the app bar. The panel lists seven entries; with
   *GRF for OpenTTD* chosen the skyscraper is greyed "Not in a GRF".
5. Type a set name, press **Export .grf (6 models)**. The progress bar runs model
   by model; a `<name>.grf` downloads; the panel says the skyscraper was skipped.
6. Copy the GRF into OpenTTD's `newgrf` folder, enable it in NewGRF settings,
   start a game after 1990. The build windows list the CD 163 / 363 twice
   ("... (CD 162)"), the coach, the bus, the ferry and the 737, with the factory's
   speeds and powers. Build them and look at 4x zoom: the CD 163 is about one tile
   long, the bus three parts that bend.
7. Choose *ZIP of GLB files* and Export: a `<name>.zip` downloads with seven GLBs
   (`proc-vehicle-cd-163.glb`, `proc-vehicle-cd-163--livery-cd162.glb`, ...) that
   open in a glTF viewer.
8. Reload the page: the list is still there.

**Also worth trying.** Remove entries with the x button; Cancel during an export
(the panel says "Export cancelled."); an export list with only buildings
(GRF Export is disabled: 0 models); a private window (the list works but is not
kept); editing localStorage to name a model id that does not exist (the panel
reports one dropped entry on load); a long TGV trailer set (articulated into many
parts).

## What is missing

Nothing - the spec is implemented in full. The open point it left (how long one
OpenTTD length is) was settled with the user during implementation: true
proportions at one eighth per metre (below).

## Known problems

- The scale (8 m per 8/8) makes trains long: a 26 m coach is 1.6 tiles, so
  OpenTTD's default `max_train_length` (7 tiles) holds a locomotive and about four
  coaches; stations need to be long.
- Ships and aircraft are fitted into one tile, so they are not at the trains' scale.
- Part slices cut the model at straight planes; a coupler or a gangway at a part
  boundary is split between two sprites.
- The WebGL renderer was not run headlessly here; its pixels may differ slightly
  between GPUs, so two exports of the same list can differ in sprite bytes (ids
  and behaviour do not).
- The sprite lighting is a fixed flat-diffuse light; chrome and glass look matte.
- GLBs from GLTFExporter differ from the build's own GLB (node layout, material
  encoding); colours match.
- Category defaults (costs, capacities, dates) are rough; only the CD 163 declares
  its own figures.

## Recommended follow-ups

- Declare `openttd` blocks (dates, capacities, costs) on the most used vehicles.
- Company-colour masks from tagged livery materials, so OpenTTD can recolour.
- A per-set option for the length scale (true proportions vs OpenTTD's squeeze).
- Mark consecutive units (a TGV power car and its trailer set) as attachable, or
  export a whole consist as one articulated vehicle.
- Animated running gear for steam locomotives via motion-counter sprite sets.

## Changelog

- Model pages have an "Add to export" button; the app bar's Export button opens
  the export list.
- Export the list as a GRF for OpenTTD (vehicles, at true proportions, with all
  three zoom levels) or as a ZIP of GLB files, built in the browser.
- The export list is kept in the browser between visits.
