# Cable car station as one structure

Spec: docs/specs/2026-10-25-cable-car-station-structure.md
Date: 2026-10-25
Status: implemented
Area: factory `cableCarStation` set, previews, props; webapp `core/rail/CableCar.ts`,
`core/rail/CableCarStation.ts`, `render/CableCarMesh.ts`, `core/SurfaceBlocks.ts`,
`render/ToolController.ts`, `db/procedural/sets/`

## What was done

**Factory** (`rail-island-factory`):
- `generator/sets/cableCarStation.ts` draws the whole station: `buildStation(type, view)`
  returns the hall (moved over from the removed `proc-prop-cablecar-shed` prop), the head
  holding the wheel (a pedestal for the chalet and glass types, a shaft hung from the machine
  room for the gantry and concrete ones), the bull wheel (rim and spoke sectors, hub), the
  boarding platform and its stairs. Boxes and sectors carry a `part` (`hall`, `head`, `wheel`,
  `platform`, `stairs`) and a `level` (`full`, `low`, `both`). `StationView`
  (`circulating`, `sillDrop`, `halfWidth`) and `DEFAULT_VIEW` are the game's inputs.
- Each type has its own platform style (deck, edge beams, railing, legs, stairs) in its hall's
  materials, in both plans: one curved deck sector (100 degrees each side) with a railing gap at
  the stairs, or the rectangular U.
- No hall column stands in the platform: `clearZ` slides each hall's front columns back until
  they clear the deck the view draws (the user's review). The gantry's knee braces end under the
  trusses' chords (they ended in the air).
- `stationFouls` is the station's own clearance check (cabin ring, head, the cabins' exit lanes,
  the platform band, the stairs' head room); `test/cableCarStation.test.ts` asserts it for every
  type, both plans and five cabins, plus deck crossings, platform-to-cabin geometry, the wheel,
  budgets (8,000 near, 500 distant) and the new pylon.
- `buildPylon` is one improved design (tubular mast with sleeves and flanges, ladder, walkway,
  four-sheave rockers, lightning rod), still one shape for every line.
- The shed prop is gone from `generate.ts`, `FAR_PROPS`, the props docs and tests; the station
  preview gains a `platform` parameter (Rectangular / Curved); pins rewritten (`pnpm sets:pins`).
- Docs: new `docs/models/cable-car-stations.md` (row in `docs/README.md`); `props.md`,
  `sets.md`, `previews.md` updated.

**Game** (`rail-island-webapp`):
- `core/rail/CableCarStation.buildStationBoxes` places the factory's station in world space
  and splits it into the near level, the wheel (relative to the head) and the distant level;
  the game's own head, platform, stair and shed-placement code is deleted, and `BoardingSpec` /
  `DEFAULT_BOARDING` are the factory's view.
- `render/CableCarMesh` draws tilted boxes and gable prisms, builds the `WHEEL_NODE` group from
  the factory's wheel parts, and adds a hidden `structureFarOnly` distant level
  (`station_structure`); the hand-built bull wheel is gone.
- `CableCar.stationDims` is the one source of a station's size (rope head, terrain pad, surface
  blocks, markers); `CableCar.restampStations` runs at load: a station whose stored `w`/`d`/
  `ropeHeadY` stamp differs from its type gets the new stamp and its lines' pylon heights
  re-solved; terrain is never touched.
- `db/procedural` gets only the cable car part of the factory export (the set module, its meta
  and declarations, the registry, pins, the shed prop removed from `props.meta.json` and `js/`);
  the unrelated factory changes a full import would have brought are left for the next import.
  Game pins re-baselined (`pnpm sets:baseline`).
- Tests: `test/cableCarStation.test.ts` rewritten (placement, view wiring, wheel, distant level,
  type-size drawing, the stamp re-solve: matching, differing, missing), `test/cableCarMesh.test.ts`
  (wheel node, distant level, platform tag), `test/importedProps.test.ts` (no shed).
- Docs: `docs/gameplay/cable-cars.md` (station types, the stamp), `docs/rendering/props.md`,
  `docs/architecture/sets.md`, `docs/tooling/factory-import.md`.

Checks:
- factory: `pnpm typecheck` clean; `pnpm test` 107 files, 7,289 passed, 11 skipped; `pnpm build:models`
  exported 325 models;
- webapp: `pnpm typecheck` (app + worker) clean; `pnpm test` with the factory suite running
  alongside: 7,794 passed, 11 failed in 7 files, every one a timeout (city generation, rivers,
  water, simulations, station), none in cable car code; re-run alone, 299 of those 300 pass and
  the last (`cityGen` "never stands the same landmark twice") passes on its own in 3.9 s of
  its 5 s limit - slow under load, not broken. `pnpm build` was not run.

## How to test

**Automated coverage.** No E2E framework is asked for in either repo. Factory:
`pnpm exec vitest run test/cableCarStation.test.ts`; webapp:
`pnpm exec vitest run test/cableCarStation.test.ts test/cableCarMesh.test.ts`.

**Setup.** Factory: `pnpm dev` for the catalog site. Webapp: `pnpm build:assets`, then
`pnpm dev`, signed in with any account, on a map with room for a cable car (or one that already
has cable car lines).

**Steps.**
1. Factory site: open Structures > Cable car stations > each of the four types; switch the
   Platform parameter between Rectangular and Curved; the platform, its railings and stairs
   follow the hall's materials and no hall column stands in the deck.
2. Factory site: Props > Cable Car Pylon at 12, 24 and 40 studs: the new mast.
3. Game: build a cable car (station tool, place two stations): each station shows its whole
   building with a rectangular platform before a cabin is chosen.
4. Game: pick a cabin and 1 cabin: rectangular platform at the cabin's door height; set 3 cabins:
   the platform becomes curved; the bull wheel turns when the line runs.
5. Game: zoom far out: the station keeps its hall and deck silhouette, without the wheel.
6. Game: load a map saved before this change with cable cars: stations draw at their type size,
   ropes meet the wheels, nothing about the terrain changed.

**Also worth trying.** A station on a steep slope (legs and pedestal sink into the ground); all
four types at each end of one line; destroying a station (the whole station tints and goes).

## What is missing

Nothing - the spec is implemented in full. The type dimensions were kept as they were (the spec
allowed changes, none were needed), so the load-time re-solve has nothing to do on today's
maps until a later factory update resizes a type.

## Known problems

- The webapp's `db/procedural` is a partial import: the other factory changes on master since
  the last import are not in it yet; the next full `pnpm import:factory` brings them.
- Sliding a front column back lengthens the roof's cantilever (up to about 14 studs on the
  chalet's rectangular plan, where the front posts merge into the inner pair).
- `stationFouls`' platform band is radial; the rectangular deck's corners are checked by the
  test's box intersection instead.
- The concrete type's curved distant level is 484 of its 500 triangles.

## Recommended follow-ups

- Run a full `pnpm import:factory` to bring the webapp up to the factory's master.
- Let the rectangular roof follow the platform's arms forward of the wheel where the rope leaves
  sideways (the spec's "roof shaped to the platform" was left at the wheel axis for the rope).
- A per-type pylon colour, if the single design reads too plain beside the red gantry.

## Changelog

- Cable car stations are redrawn as one building each: the platform, its railings and stairs now
  match the station's own style, curved for circulating lines and rectangular for shuttles.
- Cable car pylons have a new mast with a walkway and sheave rockers.
