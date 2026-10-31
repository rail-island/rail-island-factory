---
name: station
description: Create or change a railway station type in Rail Island Factory (generator/sets/station.ts) - the triangle budget (30,000 for 4 tracks of 120 studs), the shapes beyond the box, the passenger detail every type carries, the gauge and glass rules, pins, the game's station renderer and headless passenger-view checks. Use whenever a station type, the station kit or its site preview is added or changed. The fixed station buildings (Prague main station and the others in generator/stations.ts) use the building skill instead.
---

# Railway station types

A station type is a function the GAME runs over the tracks it generates, so it must
work for any track count (1 to 8) and any length (40 to 240 studs) - not only for the
site's preview. Paths below are relative to the repository root. Read
`docs/models/station-types.md` (the contract) and `docs/models/sets.md` (landed sets,
pins) before editing.

## Rules

- `generator/sets/station.ts` imports nothing and types every export; it is bundled
  into `export/sets/station.js` for the game. Never rename a type id (saved maps store
  it); retire one with an alias in the registry. A new type needs its label translated
  (`translate-text`).
- Units are studs (1.5 a metre). Frame: x across the tracks, z along them, y up from
  the terrain; the deck is at `PLATFORM_HEIGHT` (1.75).
- **The gauge.** Nothing may hang below `PLATFORM_HEIGHT + ROOF_HEIGHT` (12.5) over a
  ballast bed, and no upright box may reach over the ballast at all.
- **Glass.** The game draws glass see-through: a window in a solid wall is an opaque
  dark `steel` pane; a glass roof sits on a steel rim, not a plate.
- **Name boards** (`label`) stay clear of posts, masts and ties; whatever hangs hangs on
  two rods; nothing standing on the deck stands on an end ramp.
- Tag the silhouette: `lod: "shell"` (roofs, vaults, walls), `lod: "support"` (one
  family of repeated supports).

## Triangle budget

One budget for every type, counted as the game draws it (`stationTriangles`):

`budget = 6,000 + 40 x length x (tracks + 1)` - **30,000 for 4 tracks of 120 studs**
(9,200 at 1 x 40, 92,400 at 8 x 240).

A box is 12 triangles, a gable prism 8, a glass pane (glass no thicker than 0.4) 2.
`test/stationSet.test.ts` checks every type at 1, 2, 3, 4 and 8 tracks and 40, 60, 120
and 240 studs. The tight corners are short wide stations (8 x 40: per-band fixed costs)
and long single-track ones (1 x 240: per-stud repetition) - check both, not only 4 x 120.

## Shapes beyond the box

Use them where a passenger would see a box's corners (`StationBox.shape`; the table in
`docs/models/station-types.md`, "Shapes"):

- `cylinder` (`sides`): columns, posts, bins, lamp poles, downpipes; 6-12 sides.
- `sphere` / `dome`: lamp globes, shades, a pillar's cap; 8-10 sides.
- `bar` (`from`, `to`; `sides` for round): handrails, braces, lattice diagonals,
  brackets - no rotX/rotZ arithmetic.
- `arc` (`arc: { rx, ry, a0, a1, thick }`, `sides` = segments): a vault, a rib, an
  archivolt as ONE piece (8 per segment + 4; a thin glass arc 2 per segment). Prefer it
  to a slab per segment.

The set module meshes every shape (`stationBoxMesh`); the game and the preview draw that
mesh. Spend triangles where they read at eye height; three-sided prisms and bars are
cheap for repeated small parts (dagger boards, diagonals).

## Passenger detail

Every type carries the passenger kit (`pushPassengerKit`): tactile strips, coping,
joints, gratings, sector letters and track numbers, furniture clusters (ticket machine,
validator, info pillar, timetable case, vending machine, bins), speaker and camera poles,
open-platform lamps, stair nosings and handrails, the lit passage and the glass lift.
Items find a free spot themselves (`Floor`), so a type change rarely needs to touch the
kit; check that a new structure does not crowd the platforms so much that the kit's items
all drop out. A type's own structure should read at eye level: round columns and masts,
bases and capitals, lamps with shades or globes, gutters and downpipes, bench armrests.

**No flicker in the game.** The game draws the boxes exactly: two faces of two colours in
one plane facing one way flicker. Never end a part flush with another of another colour -
stop it `FLUSH` (0.02) short or proud, as `docs/models/station-types.md` ("No flicker in the
game") lists; `test/stationSet.test.ts` ("flicker") checks the game's own geometry.

Thin faces near another face (a marking above the deck, a screen on a machine) stand off
by an odd half of the preview's coplanar step (`MARK_*`, `PANEL_OUT`: 0.0041337 x n.5);
a round shape is turned so no flat faces along an axis.

## The game's renderer

The game (`rail-island-webapp`) draws the boxes in `src/render/StationMesh.ts` and a
shape from the set's own `stationBoxMesh`. A new shape or a new box field needs that
renderer, `test/station.test.ts` and `test/stationMesh.test.ts` there updated in the same
change, and the game's copy of `db/procedural/sets/station.js` refreshed only when the
user asks for the game side (publishing is a separate step).

## Checks

1. `pnpm typecheck`; `pnpm exec vitest run test/stationSet.test.ts test/setPins.test.ts test/previews.test.ts`
   (the station tests include the game-geometry flicker check).
2. The catalog sweep on the station pages: a scratch test calling `sweep()` (with
   `warm()`) on the `proc-preview-station-*` ids - it catches z-fighting the box checks
   cannot (not `TEST_ALL_VARIANTS=1 pnpm test`, which runs only when the user asks).
3. `pnpm sets:pins` - only the types you meant to change may move.
4. Every bug fix gets a regression test in `test/stationSet.test.ts`.
5. Show the user, from the passenger's eye and from above:
   - passenger views, before/after, at 4 x 120 for every changed type:
     `pnpm exec tsx generator/renderPassengerView.ts proc-preview-station-<type> out.png --params tracks=4,length=120 --view platform|island|across|up`
     (or `--eye x,y,z --look x,y,z` for a close-up of what changed);
   - the three-quarter view: `pnpm exec tsx generator/renderGlbThumb.ts proc-preview-station-<type> out.png 512`.
   Write images to the scratchpad, never the repository; send them with `SendUserFile`
   (`display: "render"`), captioned with the type and the view, and say what you would
   improve next.
