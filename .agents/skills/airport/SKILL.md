---
name: airport
description: Create or change the airfield the airport set draws on the game's saved layout (generator/sets/airport.ts) - the triangle budgets per type and size (30,000 for a medium airport), the one-deck rule with its rounded corners, the paint that never lies on paint, the station shapes the airport may use, the fence, the service area, the far level, pins and headless checks. Use whenever an airport type, its terminal, its fittings or its site preview is added or changed. The control tower and windsock props use the props rules instead.
---

# Airports

An airport type is drawn by the GAME on a layout it solved once and saved: every
runway, taxiway, stand, helipad and the terminal pad stay where the save put them,
because aircraft are routed over them. The module only decides what is drawn ON that
ground. Read `docs/models/airfield.md` (the contract) and `docs/models/sets.md`
(landed sets, pins) before editing; the shapes are in
`docs/models/station-types.md` ("Shapes").

## Rules

- `generator/sets/airport.ts` imports nothing and types every export; it is bundled
  into `export/sets/airport.js` for the game. Its box type mirrors the station
  vocabulary by hand (`TerminalBox`): a new field there is a new field in
  `StationBox` first.
- Every saved shape must draw: several runways, no `pads`, no runways at all.
  Never re-derive a position the layout holds.
- ONE deck: runways, taxiways, stands, the service strip and the fillets are one
  material at one height (`APRON_SURFACE`), never two pieces over one another.
  New pavement goes through `pavementDeck` (rectangles) or `deckFillets` (rounded
  inside corners, opening only into ground the rectangles leave open).
- Paint lies at one level and never overlaps paint in plan: break a line round
  another (a holding bar round the centreline), trim it where it meets one, or join
  two at a corner with a ring (`quarterRing`).
- A box standing on something sinks into it (`standing`, `SEAT`); no two boxes may
  share a visible plane where they overlap (the airfield test finds them).
- `material: "light"` FLASHES in the game (runway edge lights, a pad's corner
  lights). A lamp that must not flash (floodlights, PAPI) is `sign` in a lamp colour.
- `netting` is a fence's chain-link: one thin pane per straight run (two triangles).
- Things on the grass take their spot from `Ground` (clear of pavement, runways,
  the terminal, pads and the service gate's approach); things on the apron stand on
  the service strip. The perimeter stays inside the footprint.
- The far level (`airfieldLowDetail`) keeps the deck's rectangles and `lod: "shell"`
  masses only. New detail is near-only: do not tag it `shell` unless it is a mass
  that must be seen from afar.

## Triangle budgets

The whole airport as the game draws it - field, perimeter details and the control
tower prop (`test/airfield.test.ts`, `stationTriangles`):

| Type | small | medium | big |
|---|---:|---:|---:|
| regional, international | 18,000 | 30,000 | 40,000 |
| grass field | 8,000 | 8,000 | 8,000 |
| heliport | 12,000 | | |

Spend triangles on what reads from the game's camera and from the avatar on the
apron: the terminal's roof line, jet bridges, ground vehicles, signs, the service
area. Do not spend them on repeats along the fence or the runway edge.

## Checks

1. `pnpm typecheck`; `pnpm exec vitest run test/airfield.test.ts test/stationSet.test.ts test/previews.test.ts`.
2. `pnpm sets:pins` - read which cases redraw; only the airport cases you meant to
   change may move (a change to the station shapes must move no station pin).
3. `pnpm build:models` and commit `build-cache/`; the game pins the same drawing
   (`field.*` in its `test/fixtures/set-pins.json`) after its next import.
4. Every bug fix gets a regression test in `test/airfield.test.ts`.
5. Show the user: the four `proc-preview-airport-*` pages (three-quarter view) and
   close-ups of what changed - a scratch renderer that crops the preview's
   triangles to a plan region (copy `generator/renderGlbThumb.ts`'s projection),
   images in the scratchpad, never the repository. Say what you would improve next.
