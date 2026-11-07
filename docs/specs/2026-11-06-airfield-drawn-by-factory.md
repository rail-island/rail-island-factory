# The airfield drawn by the factory

Status: proposed
Date: 2026-11-06
Area: the airport set module (`generator/sets/airport.ts`), its pins
(`generator/sets/pinCases.ts`), the airport preview (`generator/previews/structures.ts`),
new layout fixtures, `docs/models/sets.md`, `docs/models/previews.md`; the game
(`rail-island-webapp`) consumes the result in `src/core/air/Airport.ts`,
`AirportArchitecture.ts`, `AirportDetails.ts` and `src/render/AirportMesh.ts`

## Context of the change

An airport is drawn in two halves today, split across the two repositories.

**The factory's airport set** (`generator/sets/airport.ts`, exported as
`export/sets/airport.js`) says what a *type* is:

- `TYPE_META`: the tower and windsock props, whether the type has runways, and its
  helipads.
- `terminal(pad, type)`: the terminal on the terminal pad.
- `furniture(pad, type)`: where the tower and windsock stand, and at what scale.
- `HELIPAD_SIDE` and `helipad(site, type)`: the pad classes and one pad's boxes.

The only part of the airfield the module ever receives is one rectangle, the terminal
pad, plus each helipad's site.

**The game** (`rail-island-webapp`) solves the layout and draws everything else:

- `src/core/air/AirportLayout.ts` `buildLayout` solves the layout: the taxi graph's
  nodes and edges, the runways, stands, pads, the terminal pad and the footprint. It is
  saved in the map as positions (`AirportData.layout`) and never moves afterwards,
  because aircraft are routed over it.
- `src/core/air/Airport.ts` `buildAirportBoxes(layout, type, heading)` draws the rest.
  It is about 300 lines of pure code with no Three.js:
  - the paved deck, cut into pieces that do not overlap (`pavementDeck`);
  - runway markings, including the stencilled runway numbers (`runwayNumber(heading)`);
  - a grass strip's mown edges;
  - runway edge lights;
  - taxiway guide lines;
  - stand stop bars and the international type's jet bridges;
  - the name board (a `label` box).

  It then calls the module's `terminal()` and `helipad()`.
- `src/core/air/AirportDetails.ts` `airportDetailBoxes` draws the fence and gates round
  the footprint, as a separate near-only group.
- `src/core/air/AirportArchitecture.ts` `airportLowDetailBoxes` picks the far level.
- `src/render/AirportMesh.ts` binds each type's pavement surface (`SURFACE_OF`: grass,
  asphalt, concrete) and does all the Three.js work.

So the factory's airport pages (`airportPreview`) show a terminal on a 24- or 48-stud pad
beside a plain strip of apron. They have no runway, no taxiways, no stands and no paint,
because none of that is the factory's to draw. The structures preview file says it
outright: "these show the type, not a placed instance".

The other structure sets already have the shape this change wants. The game solves, and
the module draws over what it solved:

- `station` `furnish(type, length, layout)`;
- `roadStation` `dress(type, site)`;
- `bridge` `buildBridge(type, path, heightAt)`.

## User request

"Explain, how airport is rendered in factory. [...] Why airport in factory doesn't show
the full airport, including runways?" - then: "OK, so when factory exports function,
which will take a airport layout and will render airport, is this reasonable?" - then:
"write it up as a spec".

## Decisions

The user asked for the write-up without a question round. Each answer below is the
recommendation, with its reason; any of them can be changed before implementation.

### What moves into the factory?
| Option | What it means |
|---|---|
| Everything drawn from the layout | The deck, paint, lights, stands, jet bridges, helipads, terminal, name board and fence: all of `buildAirportBoxes` and `airportDetailBoxes`. |
| Paint and fittings only | The game keeps the deck; the module draws what lies on it. |
| Preview only | The factory draws a sample airfield for its site; the game keeps its own code. |

**Answer: everything drawn from the layout.** Every other split leaves two copies of
one airfield. The preview-only option looks the most like the game on day one and drifts
from it on day two.

### What does the game keep?
**Answer: everything that decides positions or touches Three.js.** That is:

- the layout solver (`buildLayout`), the taxi graph and the aircraft and helicopter sims;
- layout persistence and validation (`isAirportLayout`, `canRenderLayout`,
  `renderTypeFor`);
- the world poses (`standPose`, `thresholdPose`, `padPose`);
- materials and texturing;
- the runway-light flashing, the radar and the windsock's motion;
- painting the name on the `label` box;
- placing props, and the structure LOD layer.

### What is the function's shape?
| Option | What it means |
|---|---|
| `airfield(layout, type, heading)` returning `{ boxes, details }` | One call. `boxes` is today's `buildAirportBoxes` output; `details` is the fence group the far level never sees. |
| Two functions | `airfield(...)` and `airfieldDetails(layout, type, boxes)`, as the game splits them today. |

**Answer: one call returning `{ boxes, details }`.** The fence is cut where the pavement
meets the boundary, so it needs the pavement anyway. One call keeps the game from
handing the module its own output back. `heading` is the airport's `rot`, which the
runway numbers read.

### How does the module know the layout's shape?
**Answer: the module declares its own `AirfieldLayout` type,** the subset it reads:

- nodes, edges (with `kind` and `width`), runways, stands, `pads?`, `building`,
  `footprint`.

A set module imports nothing, so it cannot import the game's type. The game's
`AirportLayout` (`src/core/rail/types.ts`) must stay assignable to the module's type.
`pnpm typecheck` checks that on every import through the generated `airport.d.ts`, so a
schema change on either side fails a build instead of drawing wrongly.

### Which box type does the module emit?
**Answer: the station set's `StationBox`, mirrored in the module.** The game already
draws airports through the station box vocabulary (`render/StationMesh.ts`
`buildBoxesGroup`), and that vocabulary carries every tag the game reads:

| Tag | What the game does with it |
|---|---|
| `depthLayer` 1 / 2 | Pavement or paint: its depth bias. `airportLowDetailBoxes` keeps the deck; the fence leaves openings round the deck. |
| `material: "light"` | The runway edge lights `AirportMesh` flashes. |
| `material: "wood"` at `depthLayer` 2 | A grass strip's mown edges (`AirportMesh` gives them their own treatment). |
| `lod: "shell"` | The silhouette the far level keeps. |
| `label: true` | The name board the game paints. |

The module's `TerminalBox` grows into that type. Because a module imports nothing, it
is declared again in `airport.ts`. The meaning of each tag is written into the type's doc
comments, since nothing else would keep the two sides agreeing.

### Who owns the shared heights?
**Answer: the module exports them, and the game reads them.**

- `APRON_SURFACE` (0.5): the deck top an aircraft's wheels stand on.
- `PAD_SURFACE` (0.36): the top of a helipad's slab and paint, where a helicopter's
  skids rest.

The game's `standPose` and `padSurface` read these instead of keeping their own copies,
so the pavement and the vehicles can never part. The module also exports the reference
widths its scaling uses today from the game's `SIZE_SPECS`: `RUNWAY_WIDTH` 92,
`TAXIWAY_WIDTH` 30 and the full-size terminal depth 48 (the module already has that one
as `FULL_SIZE_DEPTH`). These widths are drawing constants, not layout constants: a saved
layout carries its own widths, and the drawing only scales paint by them.

### Who names the pavement surface?
**Answer: the module, as `TYPE_META[type].surface`** (`airport-grass`, `airport-asphalt`,
`airport-concrete`). The game's `SURFACE_OF` table and the preview's `APRON` table say
the same thing twice today. The game keeps binding the photo, its tile size and its tint
(`render/surfaces.ts`).

### Who decides the far level?
**Answer: the module exports `airfieldLowDetail(boxes)`,** today's
`airportLowDetailBoxes`: the deck and the `shell` boxes, with glass made opaque. The
site's LOD preview then shows what the game will draw at distance. `bridge`
`lowDetailBoxes` set the precedent. The game's structure LOD layer still decides when to
switch levels and how to merge them.

### How does the game switch over?
| Option | What it means |
|---|---|
| Hard switch with the import | The webapp change that imports the new `airport.js` deletes its own drawing code in the same commit and calls the module. |
| Defensive adapter | The game reads `airfield` as optional, the way `core/air/airportSet.ts` reads the helipad half, and falls back to its own code. |

**Answer: hard switch.** The import is the webapp's own change, so the two halves land
together by construction. A fallback would keep the 400 lines this change exists to
delete. The helicopter adapter was defensive because the factory side shipped first
and the game had to run against both; here nothing on the game side is waiting on the
factory.

### Does the first move redraw anything?
**Answer: no. The first factory version is a verbatim port,** and the game proves it:
`test/airportGeometry.test.ts` (or a new test) records today's `buildAirportBoxes` and
`airportDetailBoxes` output on fixed layouts **before** the switch, and asserts the
imported module returns the same boxes, in order. That covers:

- all three size classes;
- a heliport;
- a layout with no `pads`;
- an old layout with several runways.

Redesigns (new markings, new lights, a different jet bridge) come after, as ordinary
type changes that move the set pins on purpose.

### What does the factory preview draw on?
**Answer: committed layout fixtures, produced once by the game's solver.**
`generator/sets/airfieldFixtures.ts` holds plain JSON layouts:

- one per size class (small, medium, big) with three stands;
- one heliport.

They are written out by running the webapp's `buildLayout` once. The preview parameter
`pad` (24 / 48 studs) becomes `size` (small / medium / big). The page draws
`airfield(fixture, type, 0)` plus the props, so it shows the whole airport: runway,
ladder, stands, terminal, helipads and fence.

Fixtures cannot drift in the sense that matters: the game never re-solves a saved
layout, so a fixture is exactly what some saved map holds. If the game's solver changes,
the fixtures stay valid. A note in the fixture file says how to regenerate them, and that
regenerating is optional.

## High-level plan

1. **Factory: layout type and fixtures.** Declare `AirfieldLayout` and the extended box
   type in `generator/sets/airport.ts`. Add `airfieldFixtures.ts` with the four layouts.
   Depends on nothing.
2. **Factory: port the drawing verbatim.** Move into the module, unchanged in output:
   - `buildAirportBoxes` with `pavementDeck`, the runway markings and digits, the edge
     lights, the taxiway lines, the stands and jet bridges, the name board and the
     pads;
   - `airportDetailBoxes`;
   - `airportLowDetailBoxes`.

   Export `airfield(layout, type, heading)`, `airfieldLowDetail(boxes)`,
   `APRON_SURFACE`, `PAD_SURFACE` and `TYPE_META[type].surface`. The module still
   imports nothing. `terminal`, `furniture` and `helipad` stay exported, since the game
   and the pins call them.
3. **Factory: pins and tests.** New pin cases `airfield.<type>.<size>` over the fixtures,
   and `airfield.heliport`. A test proves that the deck pieces never overlap and cover
   every runway, edge and stand rectangle; this moves over from the game's
   `airportGeometry` test. A test proves that every box carries a material from the
   vocabulary. Existing pins (`terminal`, `furniture`, `helipad`) must not move.
4. **Factory: the preview.** `airportSketch` draws `airfield(fixture, type, 0)`, the
   tower prop and the windsock, on the type's surface, with `size` as the preview
   parameter. The LOD preview uses `airfieldLowDetail`. Thumbnails are rebuilt
   (`pnpm build:models`, commit `build-cache/`). Preview pages are not game text
   (docs/models/text.md), so no translations are needed. Show the user every type at
   every size before finishing.
5. **Factory: documents.** Rewrite the `airport` row in `docs/models/sets.md` (what the
   module holds versus what the game keeps). Update the airport line in
   `docs/models/previews.md`. Add a short airfield section to the set's documentation.
6. **Game: record, import, switch.** Done in this order:
   1. Record the box snapshots on today's code.
   2. Run `pnpm import:factory`.
   3. Replace `buildAirportBoxes`, `airportDetailBoxes` and `airportLowDetailBoxes` with
      the module's calls.
   4. Read `APRON_SURFACE`, `PAD_SURFACE` and the surface from the module.
   5. Delete `SURFACE_OF` and the moved constants.
   6. Assert the snapshots match.

   `core/avatar/WalkStructures.ts` (the visitor's walkable surfaces) reads the same
   boxes, so it switches too. Update `docs/gameplay/aircraft.md` and
   `docs/rendering/props.md`. Depends on 2, and lands after the factory is merged.
7. **Later, outside this spec: redesigns.** Once the module owns the airfield, a new
   marking or fitting is a factory change with a pin move and a re-import. No game change
   is needed unless it adds a tag the game must react to.

## Database and persistent storage

There is no database, and **no persisted data changes**:

- **Saved airport layouts** (`AirportData.layout` in the game's saved maps): unchanged
  in shape and content. The module only reads them. `LAYOUT_VERSION` does not move.
- **Set ids stored in saved maps** (`grass_field`, `regional`, `international`,
  `heliport`): unchanged.
- **Prop ids** (`proc-prop-airport-tower`, `proc-prop-airport-windsock`): unchanged.
- **Factory export, read by the game's import:** `sets/airport.js` and `airport.d.ts`
  gain `airfield`, `airfieldLowDetail`, `APRON_SURFACE`, `PAD_SURFACE` and
  `TYPE_META[type].surface`. `sets/pins.json` gains the `airfield.*` cases.
- **Factory committed files:** the new `generator/sets/airfieldFixtures.ts`.
  `build-cache/` is refreshed for the four airport preview designs.
- **Preview parameter** `pad` -> `size`: the parameter exists on the site only. No saved
  map holds a preview parameter, so the rename is free.

## Architecture decisions

- **The game solves, the module draws.** This is the split the station, road station
  and bridge sets already follow. It puts every pixel of an airport in the repository
  whose site can show it, and leaves every position in the repository whose sims depend
  on it.
- **The saved layout is the contract.** It is frozen by design: the game never re-solves
  a placed airport. That makes it a sound interface between two repositories: the
  module can change freely and still draw old maps, because what it is given never
  changes underneath it.
- **Shared heights live in the module.** A vehicle standing on pavement must read the
  same number the pavement was drawn at. Keeping one copy is what prevents a floating
  or sunk aircraft after a redesign.
- **Verbatim first, redesign later.** A port that changes nothing can be proven with an
  equality test. A port that also redesigns can only be reviewed by eye.
- **Fixtures instead of a copy of the solver.** The factory needs representative
  layouts, not the ability to make new ones, and the solver's coupling to the sims stays
  in the game.
- **A hard switch instead of an adapter.** Both halves land in the webapp's own import
  change, so there is no window in which the game runs against a module without
  `airfield`.

## Weaknesses and risks

- **A much larger contract.** Today the module receives one rectangle; afterwards it
  receives the whole layout schema and emits five tags the game reacts to. Mitigation:
  - the module declares both types;
  - the game's typecheck checks its layout against them on every import;
  - the snapshot test catches any behavioural drift at the switch.
- **Old saved layouts.** These include multi-runway layouts from when several were
  buildable, layouts with no `pads`, and possibly odd stand spacings (the deck already
  clamps stand pads to the saved spacing). The verbatim port keeps every such rule.
  Mitigation: the game's snapshot set includes a multi-runway and a pad-less layout, and
  the factory pins include one too.
- **Every edge is assumed to be parallel to an axis.** This is true of every generated
  layout today and is stated in the game's code. Making it explicit in the module's type
  documentation is the only guard; a diagonal edge would need a `LAYOUT_VERSION` bump on
  the game side anyway.
- **Runway number stencils depend on `heading`.** The preview draws heading 0, so
  every preview runway reads 36/18. That is correct but always the same. Open question:
  should the preview use a non-zero heading (for example 90, reading 09/27) so the
  stencil is visibly exercised?
- **Thumbnail framing.** A whole big airfield is 332 x 400 studs against a terminal
  48 studs deep, so the three-quarter thumbnail may make the terminal tiny. Open
  question: should the thumbnail frame the full field (the point of the change), or
  frame the terminal with the field running out of shot? The proposal is the full field
  at the default `size` (medium), checked headlessly before sign-off.
- **Triangle counts and the site's passenger view.** A full airfield adds the deck, a
  few hundred paint strips and the fence to each preview page. That is small next to a
  station's 30,000-triangle budget, but the passenger view's walkable-surface hints will
  now find a very large flat deck. Low risk; checked headlessly.
- **Tests move between repositories.** The game's `airportGeometry`, `airportLights`,
  `airportDetails` and `airportPads` tests partly test drawing that now lives in the
  factory. Decide per test:
  - drawing rules move to the factory suite;
  - game behaviour stays (lights flashing, walking the deck, poses on the pavement).

  Nothing may be deleted without its rule landing on the other side.
- **The game's `canRenderLayout` fallback** (a newer layout is drawn as a grass field)
  stays the game's decision. The module draws whatever type it is handed and does no
  version check of its own.

## Out of scope

- Any change to the layout solver, the saved layout format or `LAYOUT_VERSION`.
- Visual redesigns of markings, lights, jet bridges or the fence (step 7, later
  changes).
- Moving the radar or the windsock's motion, or the runway-light flashing, into the
  factory. Animation stays in the game.
- The same treatment for ports (`port` set), which have the same split and the same
  preview limitation. A natural follow-up with its own spec.
- Publishing to the game as part of the factory change. The webapp's import (step 6) is
  its own step.
