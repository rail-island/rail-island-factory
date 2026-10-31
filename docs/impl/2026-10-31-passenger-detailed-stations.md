# Passenger-detailed stations

Spec: docs/specs/2026-10-31-passenger-detailed-stations.md
Date: 2026-10-31
Status: implemented
Area: station set (`generator/sets/station.ts`), station previews and the preview sketch, the
site's 3D viewer, the `station` skill, docs; the game's station renderer (`rail-island-webapp`)

## What was done

- **Shapes beyond the box.** `StationBox` gains `shape` - `cylinder`, `sphere`, `dome`, `bar`,
  `arc` - with `sides`, `from`/`to` and `arc`. The set module meshes every shape itself
  (`stationBoxMesh`, smooth normals) and counts it from its fields (`stationBoxTriangles`,
  `stationTriangles`); the factory preview (`generator/previews/stations.ts`) and the game's
  `src/render/StationMesh.ts` both draw that mesh. A thin glass pane counts the two triangles
  the game draws. The train sheds' vaults, ribs and archivolts are single arcs now, which freed
  roughly half of `arch_shed`'s triangles.
- **One budget.** `test/stationSet.test.ts` holds every type to `6,000 + 40 x length x
  (tracks + 1)` = 30,000 at 4 x 120 (the user raised it from the spec's first 25k), at 1-8
  tracks and 40-240 studs. All eight types fit; the tightest are `arch_shed` 8 x 40 and
  `heritage_canopy` 1 x 240.
- **Passenger detail, all eight types** (`pushPassengerKit`): tactile strip, raised coping,
  paving joints, drainage gratings, sector letters A-D and track numbers in a block font,
  furniture clusters (ticket machine, validator, info pillar, timetable case, vending machine,
  bins), speaker and camera poles, lamps on the open platforms, stair nosings and handrails, a
  lit passage mouth and a glass lift beside every underpass. Items find free spots themselves
  (`Floor`). Per type: round columns and masts with bases and capitals, pier plinths and
  imposts, domed pendants, globe lanterns, round downpipes, bench armrests, cheaper three-sided
  dagger boards and lattice diagonals. Catenary stays the game's.
- **Passenger view in the site** (merged from a parallel branch): every Structures page has a
  Passenger view button - named eye-height viewpoints found from the drawn triangles, walking
  with keys/drag/touch, Esc back to orbit - and railway station pages get **Parked train** and
  **Catenary** overlay checkboxes, fed by `userData.passenger` hints the station previews now
  state (`generator/passengerHints.ts`, `src/viewerPassenger.ts`, `src/viewerOverlays.ts`).
- **Headless passenger view**: `generator/renderPassengerView.ts` renders a design from an eye
  inside it (named station views `platform`, `island`, `across`, `up`).
- **Skill and docs**: new `.agents/skills/station/SKILL.md` (listed in `AGENTS.md`);
  `docs/models/station-types.md` (shapes, passenger detail, budget table, passenger view),
  `docs/models/sets.md`, `docs/models/previews.md`, `docs/site/catalog-site.md`,
  `docs/models/js-format.md`, `docs/README.md`. Pins moved for the station types only
  (`pnpm sets:pins`).
- **Game (`rail-island-webapp`, branch `claude/dreamy-curie-mm4k8e`)**: `StationMesh` draws
  shapes from `Station.stationBoxMesh`; `db/procedural/sets/station.js`, `station.d.ts` and
  `pins.json` refreshed from this export (the station set only, not a full
  `pnpm import:factory`); `test/station.test.ts` measures shapes by their mesh,
  `test/stationMesh.test.ts` holds the near station to the factory's budget formula and checks
  every shape draws as counted; `docs/gameplay/stations.md` updated.

Checks:
- Factory: `pnpm typecheck` clean; full `pnpm test` 113 files, 7,467 tests passed in 4m58s on
  this 4-core container (the unchanged base commit takes 5m04s here: `test/stationSet.test.ts`
  was made faster - built stations shared, plain checks, corner bounds - so the suite is quicker
  than before); `pnpm build` passes; a scratch catalog sweep over the eight
  `proc-preview-station-*` pages (112 checks) passes; `pnpm sets:pins` redraws the station
  types only.
- Webapp: `pnpm typecheck` clean; full `pnpm test` 624 files, 8,332 passed with one expected
  failure (the station pins), then `pnpm sets:baseline` re-took the station pins only and
  `test/setPins.test.ts` passes; `test/station.test.ts` (45) and `test/stationMesh.test.ts`
  (14) pass.

## How to test

**Automated coverage.** No E2E framework exists in the factory (AGENTS.md: headless only). The
station behaviour is covered by `test/stationSet.test.ts` (budget, gauge with exact shape
meshes, name boards, glass, ramps, primitives), the catalog sweep and
`test/viewerPassenger.test.ts` (floors, steps, walls, viewpoints, overlays). In the game:
`test/station.test.ts`, `test/stationMesh.test.ts`.

**Setup.** `pnpm install`, then `pnpm dev` and open the site.

**Steps.**
1. Open Structures > Railway stations > Arched train shed; set Tracks 4, Length 120.
2. Orbit: the vault reads as smooth glass arcs on lattice ribs; piers have stone plinths and
   imposts; pendant lamps have domed shades.
3. Click **Passenger view**: the camera stands at eye height at a platform end. Pick each entry
   of the viewpoint select (Platform end, Middle, Under the roof, ...).
4. Walk with W/A/S/D or arrows, look by dragging, Shift to run, Q/E to turn: the platform edge
   stops you, the underpass stairs can be walked down step by step.
5. Look for: tactile strip behind the yellow line, sector signs "A".."D", the track-number sign,
   ticket machines, validators, info pillars, timetable cases, vending machines, bins, camera
   poles, the glass lift beside each stair.
6. Tick **Parked train**: UIC-Z coaches stand on the first track with a platform; tick
   **Catenary**: masts and wires over every track. Change Tracks/Length: both follow.
7. Press Esc or **Orbit view**: the orbit camera returns where it was.
8. Repeat 1-7 for the other seven station types; on a port or airport page only the passenger
   view (no overlays) is offered.

**Also worth trying.** 1 track x 40 studs (no sector signs, furniture still fits); 8 tracks x
240; a dam page shows "No place to stand"; on mobile, one finger looks and two walk. Headless:
`pnpm exec tsx generator/renderPassengerView.ts proc-preview-station-heritage-canopy out.png
--params tracks=4,length=120 --view island`.

## What is missing

Nothing of the spec's plan is left out. The game side is limited to the renderer, its tests and
the station set module; the rest of the factory export was not imported into the game
(publishing stays a separate step).

## Known problems

- The preview's coplanar step forces deck markings and machine panels to stand off by odd
  half-steps (`MARK_*`, `PANEL_OUT`); a later geometry change can land two faces in one plane
  again - the catalog sweep catches it.
- Walking and touch were not tried in a real browser (headless only, by the project's rule).
- The walking passenger passes through the overlay train and masts.
- `arch_shed` at 8 x 40 is within a few hundred triangles of its budget; more shed detail needs
  savings first.
- Kit items that find no free spot are silently left out; a crowded type may lose some.
- The full factory `pnpm test` is near the five-minute limit on a 4-core container (4m58s; the
  base was already 5m04s there).
- `generator/renderGlbThumb.ts` run as a CLI exits early in this container (exit 13); the
  build's thumbnails are fine.

## Recommended follow-ups

- Import the full factory export into the game (`pnpm import:factory`) when publishing, so the
  game's other models match this factory state.
- Make the passenger walk collide with the overlay train and masts.
- Let a station type's builder reserve furniture spots explicitly instead of relying on the
  free-spot search.
- Add platform canopies or shelters to `platforms_only` for a more inhabited open platform.

## Changelog

- Railway stations are far more detailed from the platform: tactile paving, sector and track
  signs, ticket machines, validators, info pillars, timetables, vending machines, bins, camera
  poles, lifts beside the stairs, round columns and lamps.
- Train shed vaults are smooth curved glass.
- Every railway station is held to 30,000 triangles at 4 tracks of 120 studs.
- Structure pages have a Passenger view: stand at eye height, pick a viewpoint or walk around.
- Railway station pages can show a parked train and the catenary.
