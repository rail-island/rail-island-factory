# Airfield

**Covers** - the airport set's drawing of a whole airport on the game's saved layout: what
the module receives (the layout) and returns (the field's boxes and the perimeter
details), the tags the game reacts to, the shapes it draws with, the shared heights, the
deck and its rounded corners, the paint, the apron and the service area, the fence, the
far level, the triangle budgets, the layout fixtures the site's preview pages and the
pins draw on, and what stays in the game.
**Code** - `generator/sets/airport.ts` (`airfield`, `airfieldLowDetail`, `pavementDeck`,
`deckFillets`, `runwayNumber`, `APRON_SURFACE`, `PAD_SURFACE`, `TYPE_META`, `terminal`,
`furniture`, `helipad`), `generator/sets/airfieldFixtures.ts`, `generator/previews/structures.ts`
(`airportSketch`), `generator/sets/pinCases.ts`, `test/airfield.test.ts`, `.agents/skills/airport/`
**See also** - [sets.md](sets.md), [previews.md](previews.md), [boarding-door.md](boarding-door.md) (where a bridge docks), [props.md](props.md) (the
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
| the paved deck with its rounded inside corners and the apron's service road, the runway paint and stencilled numbers, a grass strip's mown edges, the runway edge lights, the taxiway guide lines and their turns, holding points with their signs, the PAPIs, stop bars, the international type's jet bridges (their parts, limits and rest pose), floodlight masts and parked ground vehicles, the helipads, the terminal, the name board, the service area (hangar, fire station, fuel farm), the perimeter fence and its service gate, a grass field's markers, tufts and crates; the far level; the heights a vehicle stands at; each type's pavement surface | the layout solver, the taxi graph and the aircraft and helicopter sims; saving, validating and version-checking a layout (a layout from a newer build is drawn as a grass field); the world poses; binding the surface photos and tints; flashing the edge lights; the radar's turn and the windsock's swing; posing the jet bridges to a parked aircraft's door; painting the airport's name on the `label` box; placing the tower and windsock props; the structure LOD layer |

## `airfield(layout, type, heading)`

`layout` is an `AirfieldLayout`: the part of the saved layout the drawing reads (nodes,
edges with `kind` and `width`, runways, stands, `pads?`, `building`, `footprint`), in
airport-local studs - X across the runways (positive toward the terminal), Z along them,
Y up from apron level. The game's own `AirportLayout` type must stay assignable to it,
which the game's typecheck proves on every import through `airport.d.ts`. `type` is a
known type id (the game resolves a stored one first). `heading` is the airport's rotation
in degrees, which is literally its runway heading; only the runway numbers read it.

It returns `{ boxes, details, bridges }`:

- `boxes` - the field: the game builds them into its merged meshes and its far level.
- `details` - the perimeter fittings, never part of the far level.
- `bridges` - the jet bridges' moving parts, which the game poses (below); none but at an
  international hub.

Every shape a saved map holds must draw: several runways (a layout from when several were
buildable), no `pads` (from before helipads), no runways at all (a heliport). Every edge
runs along an axis; a diagonal one would come with a new layout version on the game's side.

### The deck

Runways, taxiways, stands and the apron's service road are ONE surface at ONE height
(`APRON_SURFACE`, 0.5) in one material. Their rectangles overlap by construction, so
`pavementDeck` cuts their union into disjoint rectangles first: overlapping coplanar
faces flicker, and separating them in height reads as steps in the tarmac. A stand's pad
is sized from the big taxiway and clamped to the layout's own stand spacing.

The **service road** is the strip between the stands' pads and the terminal's frontage,
the terminal's length, cut short of its helipads and run half a stud under its plinth. It is
ground like the rest, so every type paves it (the game holds the deck identical across the
types); only its paint, masts and vehicles are a paved type's.

**Rounded corners.** `deckFillets` finds every inside corner of the union (a grid vertex
three of whose four cells are paved) and rounds it with a fillet - a `ring` shape with
`fillet: true`, the same material at the same height, filling the corner between the arc
and the two edges. Its radius is half the widest taxiway, at most 35% of the open ground
before the next pavement either way (two corners facing across a gap leave grass between), and
shrinks until its square touches no pavement and no other fillet. A fillet only fills
ground the rectangles leave open, so the saved surfaces are unchanged.

### The paint

The paint lies at one level above the deck and never overlaps paint in plan:

- **Runway markings** - centreline dashes, side stripes, threshold bars, aiming points
  and the stencilled numbers (`runwayNumber` reads the heading).
- **Taxi lines** - one along every edge, trimmed half a width where a stub meets the
  spine. Where exactly two lines meet at a right angle (the spine's ends) both stop
  short by half the narrower taxiway's width and a quarter `ring` of paint joins them.
- **Holding points** - on every runway link, up to 10 studs off the runway's edge: two
  dashed bars on the runway's side, two solid ones on the taxiway's, broken round the
  centreline. A red mandatory sign stands beside each on the grass.
- **Stop bars** across each stand; on the service road an edge line on the stands' side
  and a dashed centre line.

A runway end has a **PAPI** abeam its aiming point on the landing aircraft's left: four
housings out from the edge, two white lenses and two red. Its lamps, and the floodlights,
are `sign` in a lamp colour: only `light` flashes.

## The apron and the service area

At each gap between the stands (and beyond the outer two) the service road carries a
**floodlight mast** (a round pole on a plinth, a head of three lamps) by the terminal and a
parked **ground vehicle** on the stands' side, in turn a baggage train (a tractor and two
carts), nothing (the gap keeps only its mast) and a belt loader. There is no fuel bowser
on the apron; the fuel farm stands in the service area.

### Jet bridges

Every stand of an international hub has a **jet bridge** the game docks to the parked
aircraft's forward left door ([boarding-door.md](boarding-door.md)) and pulls back before it
leaves. The drawing is split by what moves:

- in `boxes`, static: the **fixed link** out of the terminal's glazing and the **rotunda**
  on its column. The rotunda stands short of the frontage and to the parked aircraft's
  left (it parks nose-in heading +X, so its left is -Z): 10 studs at furniture scale 1,
  never nearer than 6.5, so the tunnel reaches the door from the side and never crosses
  the fuselage.
- in `bridges` (`JetBridge`), per stand: the moving parts, each in its own frame - the
  **outer** tunnel section (the tunnel frame: the rotunda's axis at the tunnel `floor`,
  +X out along the tunnel, pitched to the cab), the narrower **inner** section that
  telescopes out of it (origin at the tunnel's end), the level **cab** with its bellows
  (origin at the tunnel's end, +X its door face; it turns about there), the **bogie**'s
  wheels on the apron under the tunnel `bogieBack` short of its end, and its **leg**, one
  stud tall, which the game stretches from the wheels (`legBase`) to the tunnel's underside
  (`legTop` under the floor). With them, the limits a pose keeps to: `reach` (the tunnel's
  length in plan, rotunda axis to the cab's rear: the outer section alone, 10 studs, to
  both sections less a stud of overlap, 22 studs, past the rotunda's radius), `lift` (the
  cab floor, 2 to 9 studs). The tunnel's lengths and the lift are absolute studs, while
  everything else is at furniture scale: the gap a tunnel spans is set by the aircraft's
  length against the stand-to-terminal clearance, and aircraft are not drawn at it; `maxSlope` (0.15), and the pose at **rest**.

A pose (`JetBridgePose`) is the tunnel's `yaw` (radians about +Y, three.js sense), its
`length`, the cab floor's `lift` and the cab's `cabYaw`. At **rest** the tunnel lies short
(the outer section only), level and straight back from the rotunda (`yaw` PI), the cab
looking along it: clear of every stand's fuselage and of the terminal
(`test/airfield.test.ts`). `jetBridgeBoxes(bridge, pose)` draws the parts at a pose in
airport-local boxes, as the game's own transforms place them: the site's previews draw
the bridges at rest with it, and so does the far level, whose shell is the outer
tunnel section, the cab and the leg, as before the bridges moved. The tunnel's glazing is unchanged.

The **service area** stands on the open grass (`Ground`: inside the fence's reach, 10 studs
off the pavement, 20 off a runway, off the terminal, the pads, the service gate's approach
and what was placed before), each piece at the free spot nearest its target:

| Type | Hangar | Fire station | Fuel farm |
|---|---|---|---|
| regional | at the terminal's south end, a barrel vault (`arc`, `rotY`) over steel walls, its three-leaf door to the field | beside it, three red doors, a drill tower, the crash tender | 2 tanks in a bund, at the north end |
| international | the same, a quarter larger | the same | 3 tanks |
| heliport | - | - | 1 tank |

The **international terminal**'s roof bays are barrel vaults (`arc`) closed by round end
walls (`cylinder`), glazed along the crown; the far level keeps the flat roof under them.

## The fence

The perimeter fence is drawn per straight run, not per bay: only the posts repeat (every
8 studs, 10 on a grass field), so a run of any length costs a few boxes besides them.

- **A paved field's** security fence: posts, a top and a bottom rail and ONE `netting`
  pane per run, barbed wire on arms (`bar`s) leaning out from every second post with
  three strands along them. At the service gate in the far cross-fence: stout gate
  posts, a red and white lifting barrier and a guard booth inside.
- **A grass field's** timber post-and-rail: posts and two rails per run.

It opens wherever the terminal or the pavement meets it, and stays inside the footprint.

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
| `material: "netting"` | draws it grey, see-through and two-sided: a fence's chain-link, one pane (two triangles) when thin |

### The shapes

An airport box may be any station shape - a cylinder, sphere, dome, bar, arc or a flat
`ring` - and may be turned in plan (`rotY`), exactly as a station box
([station-types.md](station-types.md), "Shapes"). The module imports nothing, so
`TerminalBox` repeats those fields; the game meshes a shape with the station set's
`stationBoxMesh` and the site's preview draws the same mesh, so what is counted is
what is drawn. A shape's `cx..sz` do not bound it: every test measures it by its mesh
(`stationBoxBounds`). A ring's `sx`/`sz` are set to its full circle's square, which
bounds it from outside.

### Shared heights and widths

- `APRON_SURFACE` (0.5): the deck's top, where an aircraft's wheels stand.
- `PAD_SURFACE` (0.36): a helipad's slab and paint, where a helicopter's skids rest.
- `RUNWAY_WIDTH` (92) and `TAXIWAY_WIDTH` (30): the game's big class. Paint scales by a
  runway's own width against the first; stand pads are sized from the second. These are
  drawing constants - a saved layout carries its own widths.

`TYPE_META[type].surface` names the deck's pavement (`airport-grass`, `airport-asphalt`,
`airport-concrete`); the game binds its photo, tile and tint.

## The far level

`airfieldLowDetail(boxes, bridges)` keeps the deck's rectangles (not its rounded corners)
and the `shell` boxes - the jet bridges' at rest among them - and makes glass opaque. The site's low-detail preview uses it, so it shows
what the game draws at distance. New detail stays near-only, so a distant airport costs
what it did.

## Triangle budgets

The whole airport as the game draws it - the field, the perimeter details, the jet bridges
at rest and the control tower prop - counted with `stationTriangles` (`test/airfield.test.ts`):

| Type | small | medium | big |
|---|---:|---:|---:|
| regional, international | 18,000 | 30,000 | 40,000 |
| grass field | 8,000 | 8,000 | 8,000 |
| heliport | 12,000 | | |

At the fixtures a medium international airport draws about 11,500 with its tower, a
heliport about 3,500: the fence, which drew 10,000 to 12,000 of an airport's triangles
bay by bay, now draws about 3,000.

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
(one height, one material, no two pieces overlapping, measured by mesh), every runway,
taxiway and stand paved, `pavementDeck` tiling a union exactly, the fillets (off the
pavement, at a corner, never overlapping), the corner turns and the holding points with
their signs, paint and lights on the paved types only, the runway numbers and their
reciprocals, one name board, a jet bridge per stand at an international hub only (its
rotunda to the aircraft's left, its parts in their own frames, at rest clear of every
fuselage and the terminal, a pose ending where it says with its leg reaching the tunnel), the
helipads where the layout put them, the service area clear of the pavement, the fence
(one pane per run, the barbed wire, the barrier; timber on grass) on the footprint, the
far level, no shared visible plane (helipads included), the triangle budgets, and
determinism.

## Helipads without flicker

`helipad` seats each green corner light 0.1 studs into the slab, so no foot lies on the
slab's top face. It draws the yellow aiming circle as one flat `ring` of 32 segments (256
triangles), round and in one piece; it was once a staircase of rectangles on the
diagonals, which read as steps and cost twice as much. `test/airfield.test.ts` checks
every field, helipads included, for shared visible planes, and a pad on its own for
seated lights and a circle that is one ring of two radii.
