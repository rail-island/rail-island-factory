# Vehicle interiors

Spec: docs/specs/2026-10-25-vehicle-interiors.md
Date: 2026-10-25
Status: implemented
Area: generator (interior kit, door kits, coach kit, railcar kit, bus assembly and shell, slice lofts, every passenger design with doors, GLB reader, JS bundling), catalog site (3D preview)

## What was done

Every passenger vehicle that opens its doors now has a generic cabin per car
behind them. The cabin is hidden while every door of its car is shut. The
reference is [docs/models/interiors.md](../models/interiors.md); doors.md, js-format.md, export.md,
buses.md and catalog-site.md were updated to match.

- **The cabin** (`generator/interior.ts`, `drawCabin`):
  - floor, ceiling, side and end walls, and a reveal at each doorway;
  - the side windows seen from inside, as dark panes on the walls;
  - box seats in 2+2, 2+1 or 1+1 rows, left out of every door's clear zone on
    either side and facing the middle of the car;
  - a bus's wheel-arch podiums;
  - one shared palette, capped at 1,500 triangles per car's interior.
- **The interior part**: a child part `interior-<car>` (`MeshCore.spin`).
  `interiorTable.ts` maps each interior to the door clips that reveal it.
  - The JS model builds it hidden and carries `userData.interiors`.
  - The GLB marks the node `extras.interior` and lists the table in the scene
    extras. `collectTriangles` (and so thumbnails, stats, budgets and the source
    tree) leaves it out unless asked.
  - The catalog's `triangles` is the exterior's
    (`MeshBuilder.exteriorTriangleCount`).
- **Doorways through every shell.** The spec's "cabin replaces vestibule"
  decision is implemented per kit; each kit cuts the doorway and puts a frame
  round it:
  - **Coach kit** (`Volume.openings` for every opening door, plug doors
    included): the dark vestibules are gone. A volume with doorways drops the
    chords at band boundaries between the cabin's floor and ceiling.
  - **Railcar kit**: the same as the coach kit.
  - **Buses**: the shell cells over a doorway lose their side face.
  - **TGV Duplex and Shinkansen 0**: through the slice body's `drawShell`.
  - **DR VT 18.16**: through `loftHalves`.
  - **Designs**: plug-door designs gained their doorway lists. These are the
    T6, the metro, Bmo, the DB and DR double-deckers, CD 470, 471 and 680,
    DB 628, MDmot, TGV, ICE 1, CD 843, the Bi20, and the UIC-Z through the
    livery coaches.
- **Gap strips**: dark strips riding on a leaf behind the gap to its neighbour,
  so a shut door shows no see-through slit.
- **Bundle size**: the interior code stays out of the shared runtime.
  `jsModel.ts`'s `noInteriors` plugin stubs `interior.ts`, `interiorTable.ts` and
  `coachCabin.ts` for designs without an interior. The two JS-size tests that sat
  at 2 and 47 bytes of margin on the base (`proc-tree-deadtree`,
  `proc-vehicle-csd-dsk`) now have 28 and 479.
- **The site**:
  - `src/viewerInteriors.ts`: an interior is shown while one of its doors stands
    open or opening.
  - **Interior on / Interior off** forces every interior on and cuts the model
    away just under the ceilings.
  - The triangle count is the exterior's; the highlight and picking skip the
    interiors.
- **Headless views**: `renderGlbThumb` takes `ThumbOptions` (`interiors`,
  `cutAbove`, `xRange`, `view`).
- **Tests**:
  - new: `test/interiors.test.ts` (kit, per-design coverage, budget, seats clear
    of the doors, no LOD interior, shell chord regression) and
    `test/viewerInteriors.test.ts`;
  - `test/doors.test.ts`: every leaf opens onto the cabin; rays across every
    shut door; z-fighting checked with the interiors shown;
  - `test/catalogSweep.ts`: the JS model's interiors and their hiding;
  - the UIC-Z hash pins re-pinned, and the CD 471 landmark R17 re-mapped to the
    skirt's new leaves.

Checks: `pnpm typecheck` and `pnpm test` pass (269 s on a four-core
container). `pnpm build` has not been run on this branch.
`TEST_ALL_VARIANTS=1 pnpm test` was not run: it runs only when the user asks
for it (AGENTS.md).

## Follow-up changes

1. **Windows seen from inside** ("missing windows are strange"). The cabin's
   side walls now carry a dark pane over every side window's glass, so an open
   door looks onto windows rather than a blank wall; the windows stay opaque.
   Buses, the slice-lofted sets and the VT 18.16 pass their window lists to the
   cabin. The coach kit lays its windows after the cabin, so `Coach.window` and
   glass laid with `Coach.sidePanel` route a pane into the car's interior part
   (`laterWindows`). Tests cover the routing, a door leaf's light getting none,
   and panes on every kit; the UIC-Z pins moved again.
2. **Walls stop at the body's bottom edge** (found while checking the windows: on
   the Bmo the far wall showed below the body over the bogies, through the open
   doors). A cabin's side and end walls now start at the body's bottom edge where
   it stands above the floor (`Cabin.bottom`, passed by the coach kit and the
   VT 18.16), with a regression test in `test/interiors.test.ts`.
3. **Tests under five minutes** ("tests should run under 5 minutes, don't run all
   combinations"). AGENTS.md now limits `pnpm test` to five minutes and runs
   `TEST_ALL_VARIANTS=1` only on request. The per-vehicle interior test checks
   each design's defaults, and the ray scan across shut doors pre-filters
   triangles per door. The oak test checks every seed and the fixed sample, not
   all 80 combinations.
4. **Faster slow test files** ("trim the slower test files to get under 5
   minutes; one tree test at most 5 seconds"). `test/setup.ts` compares equal
   typed arrays (GLB bytes) natively, which `toEqual` walked element by element.
   The tree tests make one `expect` per level, not one per triangle. The door
   test poses every clip shut at once. `pnpm test` went from 428 s to 269 s on a
   four-core container; the oak file takes 5 s, each species of the kit about 3.5 s.

## How to test

**Automated coverage.** No E2E framework exists in this repository, and
AGENTS.md asks for headless checks only. The interior behaviour is covered by
Vitest: `pnpm exec vitest run test/interiors.test.ts test/viewerInteriors.test.ts test/doors.test.ts`.

**Setup.** `pnpm install`, `pnpm build:models`, then `pnpm dev` and open the
catalog site.

**Steps.**
1. Open any tram, coach, unit, metro car or bus (e.g. Tatra T3) and its 3D
   preview. The model arrives with its doors shut: no interior shows, and the
   gaps between the leaves are dark.
2. Press **Open right**. The doors open over 2 s and the cabin appears behind
   them: grey floor, light walls with dark window panes where the side windows
   are, blue seats, none in front of a door.
3. Press **Close**. Once the doors have shut, the cabin disappears again.
4. Press **Interior on**. Every cabin shows with the doors shut and the model is
   cut away above the ceilings: from above you see the seat rows, gaps at each
   door. Press **Interior off** to go back.
5. On a set (TGV Duplex, `unit` train) open one side: every car's cabin shows,
   because each car has doors on that side.
6. The detail page's triangle count is the exterior's (it does not change with
   the interior).

**Also worth trying.**
- A bus (Karosa, Citaro): podiums over the wheel arches with seats on them;
  steer to full lock with the pose slider and open the doors; the front tyre
  stays inside its podium.
- The CSD Be31 has two small cabins (its end vestibules), no seats.
- The Bi20 has six compartment doors per side, so no seat row fits; its cabin is
  floor and walls only.
- A locomotive or wagon has no Interior button.

## What is missing

Nothing - the spec is implemented in full. The game is untouched, as the spec says.

## Known problems

- The game (rail-island-webapp) does not read `userData.interiors` yet: an export
  imported now opens its doors onto an empty, see-through shell. Do not import
  before the game adopts it.
- The Bi20's compartment doors stand closer than a door's clear zone plus a
  seat row, so its cabin has no seats; the Be31's vestibule cabins have none either.
- The cabin's floor is one level per car body. A high-floor car with step wells
  shows a riser at its doorways; a seat over a skirt cut away above the wheels
  stands raised on that cut. Buses and the slice-lofted sets pass no
  `Cabin.bottom` (a bus has its podiums over the arches instead).
- Double-deckers show one level at door height, as decided.
- Cabin walls are inset from the narrowest skin between floor and ceiling. Where
  a body tapers (noses, bus corners), the walls stand outside the shell, facing
  inward, so they are invisible from outside; seats are kept where the shell
  holds them.
- Bodies with doorways now draw their bands wall by wall wherever a chord is
  dropped, which renames those source-tree leaves (`sweep-n` to `facets-n`).
  The CD 471 landmark R17 was re-mapped; other reports keyed on such leaves would
  need the same.
- Interior parts are recognised by name (`interior`, `interior-*`): a design must
  not name another part that way.

## Recommended follow-ups

- Teach the game to show and hide `userData.interiors` with its door clips, then
  re-import the factory export.
- Longitudinal benches for metro cars and trams if the transverse rows look wrong
  through their many doors.
- Regenerate the comparison reports (`assets/*/COMPARISON.md`) that list source-tree
  leaves of bodies with doorways.

## Changelog

- Trams, coaches, units, metro cars and buses show a simple interior through their
  open doors: floor, walls with their windows, and seat rows, which keep the
  doorways free.
- The model page's 3D preview shows each car's interior while its doors open, and
  an Interior button shows every interior with the model cut away above it.
