# The airfield drawn by the factory

Spec: docs/specs/2026-11-06-airfield-drawn-by-factory.md
Date: 2026-11-06
Status: implemented
Area: factory `generator/sets/airport.ts`, `generator/sets/airfieldFixtures.ts`,
`generator/sets/pinCases.ts`, `generator/previews/structures.ts`, `test/airfield.test.ts`,
`docs/models/airfield.md`, `docs/models/sets.md`, `docs/models/previews.md`; game
(`rail-island-webapp`) `src/core/air/Airport.ts`, `AirportArchitecture.ts`,
`AirportDetails.ts` (deleted), `src/render/AirportMesh.ts`, `db/procedural/sets/airport.*`,
`test/helpers/setPinCases.ts`, `test/helpers/legacyAirportLayouts.ts`,
`docs/gameplay/aircraft.md`, `docs/architecture/sets.md`

## What was done

Both repositories are on branch `claude/trusting-pasteur-wu558z`, the session's designated
branch, instead of a newly cut `claude/<slug>-<hex>` branch.

**Factory.**
- **New module exports.** `generator/sets/airport.ts` now exports:
  - `airfield(layout, type, heading)`, returning `{ boxes, details }`. It is the game's
    `buildAirportBoxes` and `airportDetailBoxes`, ported line for line.
  - `airfieldLowDetail`, `pavementDeck` and `runwayNumber`.
  - `APRON_SURFACE`, `PAD_SURFACE`, `RUNWAY_WIDTH` and `TAXIWAY_WIDTH`.
  - The `AirfieldLayout` input type.
  - The box type `TerminalBox`, which gained `depthLayer` and `label` and documents every
    tag the game reacts to.
  - `TYPE_META[type].surface`.

  The module still imports nothing.
- **Fixtures.** `generator/sets/airfieldFixtures.ts` holds 11 saved layouts written by the
  game's solver: every runway type at every size, the heliport, and a two-runway field.
- **Pins.** The pins gain `airfield.<fixture>`.
- **Preview.** The airport pages draw the whole airport at an **Airport size** preview
  parameter (small, medium or big). It replaces the old **Terminal pad** parameter.
- **Tests.** `test/airfield.test.ts` has 12 tests carrying the drawing rules.
- **Docs.** `docs/models/airfield.md` is new.

**Game.** Done in the spec's order:
1. Pinned the whole field on the old code: `field.<type>.<size>` for 4 types × 3 sizes,
   and `field.regional.tworunways`. Each case covers the boxes, details, far level and
   props.
2. Ran `pnpm import:factory`. It touched only the five `db/procedural/sets/airport.*`,
   `pins.json` and `registry.ts` files.
3. Switched the code:
   - `Airport.buildAirfield` and `buildAirportBoxes` call the module.
   - `airportLowDetailBoxes`, `APRON_SURFACE`, `padSurface` and the pavement surface read
     the module.
   - `AirportDetails.ts` and about 400 lines of drawing in `Airport.ts` are deleted.

Every game pin held after the switch, which proves the move is 1:1. A direct comparison
also matched the two drawings box for box on all 11 fixtures × 4 types × 3 headings.

**Checks.**
- Factory: `pnpm typecheck` passes. `pnpm test` passes (172 files, 10,584 tests).
  `pnpm build:models` passes and `build-cache/` is committed.
- Game: `pnpm typecheck` passes. `pnpm test` passes (656 files, 8,896 tests).
  `pnpm build` passes.

## Follow-up changes

1. **Fix the helipad flicker.** `helipad` now seats its corner lights 0.1 into the slab
   and draws the aiming circle's diagonals as staircases of rectangles that meet only
   along edges. The coplanar test covers the pads, and a pad-only regression test was
   added. The helipad and airfield pins, and the game's `field.*` pins with pads, moved
   on purpose.

## How to test

**Automated coverage.** There is no E2E test: neither repository has an E2E framework for
this, and both forbid driving a browser without agreement.
- Factory: `pnpm exec vitest run test/airfield.test.ts test/setPins.test.ts`.
- Game: `pnpm exec vitest run test/setPins.test.ts test/airport*.test.ts`. The `field.*`
  pins prove the game draws exactly what it drew before.

**Setup.**
- Factory: `pnpm install`, `pnpm build:models`, `pnpm dev`.
- Game: `pnpm install`, `pnpm build:assets`, `pnpm dev`, signed in with any account that
  can place an airport.

**Steps.**
1. Factory site: open Structures, then the Regional airport page
   (`proc-preview-airport-regional`). You should see a whole airport: an asphalt runway
   with markings and numbers 36/18, ladder taxiways with yellow lines, three stands, the
   terminal, the tower, one helipad and a perimeter fence.
2. Switch the **Airport size** preview parameter to Small, then Big. The field, runway
   and terminal should shrink and grow.
3. Open the International page: two helipads, and a jet bridge at every stand.
4. Open the Grass airfield page: a grass strip with two mown edges, no paint and no
   lights.
5. Open the Heliport page: four pads and the operations building, with no runway.
6. Toggle the low level of detail on any airport page. The paint, fence and fittings
   should disappear, and the deck and buildings should remain.
7. Game: open a map that has airports and compare them with production. Nothing should
   differ: paving, paint, lights, jet bridges, helipads, fence and name board are all as
   before.
8. Game: place a new airport of each type and size. An aircraft should park on the deck,
   neither floating above it nor sunk into it, and a helicopter should rest on a pad.

**Also worth trying.**
- A map saved with a two-runway airport still draws both strips.
- The runway edge lights still flash when an aircraft reserves the runway.
- The far level, viewed from a map-width out, keeps the deck and buildings without
  flicker.

## What is missing

Nothing - the spec is implemented in full. Two parts are implemented differently from
how the spec worded them:
- The fixtures are one layout per type per size, not one per size, because a type's
  helipads are part of its saved layout.
- The two-runway fixture is built by hand (`legacyAirportLayouts.ts`), because the
  solver now clamps to one runway.

## Known problems

- **The heliport ignores the size parameter.** The solver makes one heliport layout at
  every size, so the Heliport page's Airport size changes nothing.
- **The deck colours are overridden in the preview.** The module's deck colours are the
  game's linear tint averages, which look near black on flat thumbnails. The preview
  draws the deck in the site's apron colours under the surface photo instead.
- **The control tower is hard to see on thumbnails.** It stands where the game places it,
  at the terminal's end, and at whole-field framing it is only a few pixels tall.
- **The windsock fabric prop is not drawn on the preview pages.** This is the same as
  before the change; the windsock's pole is drawn.
- **The `airport.types` pin moved.** This is on purpose: `TYPE_META` gained `surface`.
  The terminal, furniture and helipad pins did not move.
- **The factory suite takes about 5 minutes on a 4-core box.** It ran in 5 min 4 s,
  against the 5-minute rule. The new file adds 2.6 s of the 1,086 s of test time, so the
  suite was already at the limit before this change.
- **The game's import came from the factory's feature branch.** Merge the factory branch
  first. If factory `master` moves before the game branch lands, re-run
  `pnpm import:factory` on the game branch.

## Recommended follow-ups

- Give ports the same treatment: the module draws the berths on the game's saved port
  layout, so the port pages show a real harbour.
- Frame the airport thumbnails on the terminal end, or add a tower close-up view, so a
  type's building reads on the site's catalog grid.
- Draw the preview at a non-zero heading, so the runway numbers differ between pages.
- Factor the factory suite's slowest catalog files to bring `pnpm test` safely under
  5 minutes.

## Changelog

- The factory's airport pages show the whole airport (runway, taxiways, stands, terminal,
  helipads and fence) at a choice of small, medium or big.
- Airports in the game look exactly as before. Their drawing now comes from the model
  factory.
