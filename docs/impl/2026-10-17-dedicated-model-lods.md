# Dedicated LODs for every model

Spec: docs/specs/2026-10-17-dedicated-model-lods.md
Date: 2026-10-17
Status: implemented
Area: generator (lodKit and nine family LOD adapters, rig, lod budget, jsModel, design), tests, docs/models/lod.md, docs/models/vehicle-rig.md, AGENTS.md, skills

## What was done

Every one of the 193 designs now has its own `buildLod`; the generic convex-hull
LOD (`lod.ts` recipes, `lodHull.ts`, `MeshCore.lowDetail`) is removed and
`ProceduralDesign.buildLod` is required, so a model without one does not compile.

- **Shared kit** `generator/lodKit.ts`: the painted shell from profile tables
  (`lodShell`: vee noses, colour bands, cab paint, windows in the one `lodGlass`),
  parts (bogies, boxes, roof boxes, rods, pantographs, wheels, roofs, prisms),
  `windowBands`, and `fitLod` with the shared fitting order (optional parts,
  profile detail, least visible band, windows; optional parts come back when they
  fit) and `LodSpec.sections` for articulated vehicles.
- **Budgets** (`lodBudget`): 100 per vehicle and ordinary building, min(300, 100 n)
  for an articulated vehicle with n sections, 200 aircraft, 500 landmarks.
- **Articulated LODs bend**: section nodes at the full rig's pivots and bellows
  drawn by `drawJoint`; the group carries a rig of sections, joints and
  maxBendDeg, and `pose` / `renderJoint` now bend a LOD that has one (`rig.ts`).
- **Family adapters**, one per kit, built in batches:
  - `lodLocos.ts`: Czech electrics, mainline and small diesels (16 designs).
  - `lodClassic.ts`: CD 150, CD 230, CSD / Bmo / green-white coaches, vehicles.ts
    wagons, American truck (17).
  - `lodUnits.ts`: DMUs, EMUs, DB 628, ICE 1, TGV, KiHa 40, MDmot, 81-71 metro (17).
  - `lodTrams.ts`: trams, CZ/SK coaches, German double-deck coaches (10).
  - `lodSteam.ts`: steam locomotives and tenders, freight wagons (19).
  - `lodRoad.ts`: buses and trucks (15).
  - `lodAir.ts`: aircraft, ferries, cable car cabins (14).
  - `lodBuildings.ts` (shared building solids) with `lodCommercial.ts`,
    `lodStreets.ts`, `lodVillage.ts`, `lodStations.ts`, `lodFountains.ts`:
    commercial houses and streets, village houses, stations, fountains (31).
  - `lodLandmarks.ts`: churches, cathedrals, landmarks, towers, skyscrapers (24).
  - CD 163 / 263 and the mainline electrics on the kit directly (`cd163LodBody`,
    `boxLocoLod`).
- Full models are unchanged: each batch compared full GLB bytes before and after
  its refactors.
- Docs: `docs/models/lod.md` (rewritten: geometry, kit, families, rig contract),
  `docs/models/vehicle-rig.md`, `AGENTS.md` and the four modelling skills.
- Checks: `pnpm typecheck` clean; `pnpm test` 62 files / 6448 tests passed; `pnpm build` succeeded.

## Follow-up changes

1. "Make it all; report each batch sheet but do not wait": the review gate became
   a report - every batch's full/LOD contact sheet was sent as it finished and the
   next went on without waiting; the batches ran in parallel.
2. "Move the duplicated helpers into lodKit": the kit's shell now takes two ends of
   their own (`front` / `rear` with their own paint and windscreens) and cab paint
   as x ranges, which replaced the trams' copy of the shell and fitting
   (`lodEndsShell`, `fitEnds`) and the units' mirror-and-clamp workaround and
   fitting copy; `fitLod` took over their rules (a band goes from every section
   of a set alike, a body's roof band stays, `LATE` optional parts after the
   profile, a `coarse` profile ladder for units). One `lodBlock` and one
   `lodWheel` (with a tread option) replace the five box and two wheel helpers;
   `drawSections`, `sameBands` and `lerp` replace their copies; the buildings'
   banded block is `lodMass`. 63 designs' LODs changed slightly (checked on
   before/after sheets); the full models are untouched.

## How to test

**Automated coverage.** No E2E framework (headless only, AGENTS.md).
`test/lod.test.ts` builds every design's standalone JS LOD and every parameter
combination: budget, flicker, banned materials, model-space parity with the
generator, determinism, and the rig contract (posing bends articulated LODs and
leaves static ones untouched). `test/lodKit.test.ts` covers the kit;
`test/lod-<group>.test.ts` (locos, classic, units, trams, steam, road, air,
buildings, landmarks) check each family. Run `pnpm test`.

**Setup.** `pnpm install`, `pnpm build:models`, `pnpm dev`.

**Steps.**
1. Open any model in the catalog and tick **Low level of detail**.
2. Observe the distant model: its silhouette, colours as bands, for vehicles the
   dark windscreens and window bands and running gear down to the rail or road;
   the shown triangle count is within the budget (100 / 200 / 300 / 500).
3. Change each parameter (livery, variant, finish); the LOD follows it.
4. In a consumer, build `proc-vehicle-tatra-kt8` with `lod = true` and call the
   module's `pose(group, { bend: [0.3, 0.2] })`: the sections turn and the
   bellows re-draw; `proc-vehicle-cd-163` with `lod = true` stays unchanged.

**Also worth trying.** A many-band livery (CD 182, CD 363 037) gives thin lines up
first; the TGV with 6 cars stays within 300; a winter alpine hut, a fountain and
Prague main station (500).

## What is missing

Nothing of the spec's plan is left out. The factory site's pose sliders are still
disabled in LOD mode (the spec did not ask for them).

## Known problems

- Session rules required the session branch `claude/relaxed-lovelace-uc67bc`, not a fresh one.
- The game (`rail-island-webapp`) must pose articulated LODs; until it does they show straight.
- `lodBudget` counts sections on the default build; the TGV (default: power car) sets `lodTriangles: 300`.
- The spec's fitting order is extended: profile detail between optional parts and bands; small windows are optional parts.
- Thin livery lines and non-band paint (swooshes, V stripes, diagonal stripes, aircraft cheatlines) are often lost.
- Retractable aircraft gear is left out of LOD (a static LOD cannot retract it); fixed gear stays.
- Skyscraper facades read as stripes; some simple models use well under their budget (bell tower, Louvre, tenders).
- The three readers of the coach builder's volumes (lodClassic, lodTrams, lodUnits) stay separate: each reads them for a different purpose.
- Semi-trucks have no bellows (as in full detail), so `renderJoint` is not called for them.

## Recommended follow-ups

- Teach the webapp to pose articulated LOD models (sections and joints) like full ones.
- Consider one reader of the coach builder's volumes for the classic, tram and unit adapters.
- Make `lodBudget` take the section count of the selected parameters instead of the default build.
- Add a slanted-band shell primitive for sweep liveries.
- Enable the site's pose sliders for articulated LODs.

## Changelog

- Every model's distant view is its own low-detail model: vehicles show their
  livery, windscreens, windows, running gear and pantographs; buildings their
  masses, roofs and colours; landmarks their towers, spires and domes.
- Articulated buses, trams and trainsets bend in their distant view too.
