# Airfield

**Covers** - the airport set's drawing of a whole airport on the game's saved layout: what
the module receives (the layout) and returns (the field's boxes and the perimeter
details), the tags the game reacts to, the shared heights, the far level, the layout
fixtures the site's preview pages and the pins draw on, and what stays in the game.
**Code** - `generator/sets/airport.ts` (`airfield`, `airfieldLowDetail`, `pavementDeck`,
`runwayNumber`, `APRON_SURFACE`, `PAD_SURFACE`, `TYPE_META`, `terminal`, `furniture`,
`helipad`), `generator/sets/airfieldFixtures.ts`, `generator/previews/structures.ts`
(`airportSketch`), `generator/sets/pinCases.ts`, `test/airfield.test.ts`
**See also** - [sets.md](sets.md), [previews.md](previews.md), [props.md](props.md) (the
tower and windsock props), [surfaces.md](surfaces.md) (the `airport-*` pavements), the
game's `docs/gameplay/aircraft.md`, the spec `../specs/2026-11-06-airfield-drawn-by-factory.md`

## The split

The game solves an airport's layout once, when the player places it, and **saves the
positions**: the taxi graph's nodes and edges, the runways, the stands, the helipads, the
terminal pad and the footprint (`AirportData.layout`). It never solves a placed airport
again, because aircraft are routed over that ground. The layout is therefore the contract
between the two repositories, and it does not change under the module's feet.

| The module draws (this repository) | The game keeps |
|---|---|
| the paved deck, the runway paint and stencilled numbers, a grass strip's mown edges, the runway edge lights, the taxiway guide lines, stop bars, the international type's jet bridges, the helipads, the terminal, the name board, the perimeter fence and a grass field's markers, tufts and crates; the far level; the heights a vehicle stands at; each type's pavement surface | the layout solver, the taxi graph and the aircraft and helicopter sims; saving, validating and version-checking a layout (a layout from a newer build is drawn as a grass field); the world poses; binding the surface photos and tints; flashing the edge lights; the radar's turn and the windsock's swing; painting the airport's name on the `label` box; placing the tower and windsock props; the structure LOD layer |

## `airfield(layout, type, heading)`

`layout` is an `AirfieldLayout`: the part of the saved layout the drawing reads (nodes,
edges with `kind` and `width`, runways, stands, `pads?`, `building`, `footprint`), in
airport-local studs - X across the runways (positive toward the terminal), Z along them,
Y up from apron level. The game's own `AirportLayout` type must stay assignable to it,
which the game's typecheck proves on every import through `airport.d.ts`. `type` is a
known type id (the game resolves a stored one first). `heading` is the airport's rotation
in degrees, which is literally its runway heading; only the runway numbers read it.

It returns `{ boxes, details }`:

- `boxes` - the field: the game builds them into its merged meshes and its far level.
- `details` - the perimeter fittings, never part of the far level.

Every shape a saved map holds must draw: several runways (a layout from when several were
buildable), no `pads` (from before helipads), no runways at all (a heliport). Every edge
runs along an axis; a diagonal one would come with a new layout version on the game's side.

### The deck

Runways, taxiways and stands are ONE surface at ONE height (`APRON_SURFACE`, 0.5) in one
material. Their rectangles overlap by construction, so `pavementDeck` cuts their union
into disjoint rectangles first: overlapping coplanar faces flicker, and separating them
in height reads as steps in the tarmac. A stand's pad is sized from the big taxiway and
clamped to the layout's own stand spacing. The paint lies at one level above it and
never overlaps in plan.

### The tags

The boxes use the station box vocabulary (`TerminalBox`, also `AirfieldBox`), and the game
reacts to these tags, so they are the contract:

| Tag | The game |
|---|---|
| `depthLayer` 1 / 2 | the deck / the paint: a depth bias each; the far level keeps layer 1; the fence opens where layer 1 meets it |
| `material: "light"` | flashes it as a runway edge light |
| `material: "wood"` on layer 2 at a grass field | textures it as a mown edge, with the grass photo darkened |
| `lod: "shell"` | keeps it at the far level |
| `label: true` | paints the airport's name on it |

### Shared heights and widths

- `APRON_SURFACE` (0.5): the deck's top, where an aircraft's wheels stand.
- `PAD_SURFACE` (0.36): a helipad's slab and paint, where a helicopter's skids rest.
- `RUNWAY_WIDTH` (92) and `TAXIWAY_WIDTH` (30): the game's big class. Paint scales by a
  runway's own width against the first; stand pads are sized from the second. These are
  drawing constants - a saved layout carries its own widths.

`TYPE_META[type].surface` names the deck's pavement (`airport-grass`, `airport-asphalt`,
`airport-concrete`); the game binds its photo, tile and tint.

## The far level

`airfieldLowDetail(boxes)` keeps the deck and the `shell` boxes and makes glass opaque.
The site's low-detail preview uses it, so it shows what the game draws at distance.

## The fixtures

`generator/sets/airfieldFixtures.ts` holds saved layouts the game's solver wrote: every
runway type at every size (`<type>.<size>`: default runway length, three stands, the
type's helipads), the heliport (one layout, whatever the size) and a two-runway field
(`regional.tworunways`). They are data, not a copy of the solver: a saved layout is never
re-solved, so they stay valid whatever the game's solver does next. The file says how to
regenerate them; doing so is optional and moves the airport pins.

The airport preview pages (`proc-preview-airport-<type>`) draw `airfield` on the type's
fixture at the **Airport size** preview parameter (small, medium - the default - or big),
on a patch of grass the size of the footprint, with the control tower prop at the
furniture scale. The deck is drawn in the site's apron colours under the surface photo:
the module's deck colours are the game's linear averages of the tinted photos (its plain
far level), which read near black on a flat thumbnail.

## Pins and tests

`pinCases.ts` pins `airfield.<fixture>` (the field, its details and its far level, at
heading 20) beside the terminal, furniture and helipad cases. The game pins the same
drawing from its side (`field.*` in its `test/fixtures/set-pins.json`), taken before the
drawing moved here, so the move was proven 1:1.

`test/airfield.test.ts` checks, over every fixture and type: the box vocabulary, one deck
(one height, one material, no two pieces overlapping), every runway, taxiway and stand
paved, `pavementDeck` tiling a union exactly, paint and lights on the paved types only,
the runway numbers and their reciprocals, one name board, a jet bridge per stand at an
international hub only, the helipads where the layout put them, the far level, the fence
on the footprint, no shared visible plane (helipads included), and determinism.

## Helipads without flicker

`helipad` seats each green corner light 0.1 studs into the slab, so no foot lies on the
slab's top face. It draws the yellow aiming circle as eight stripes that never overlap in
plan: the four square to the axes are one box each, and the four diagonal ones are
staircases of rectangles, each one step deep and two long, that meet only along edges.
`test/airfield.test.ts` checks every field, helipads included, for shared visible planes,
and a pad on its own for seated lights and a circle that never overlaps itself.
