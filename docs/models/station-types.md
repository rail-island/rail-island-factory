# Station types

**Covers** - the eight railway station types of the `station` set: the layout recipes, the deck
every type stands on (platform end ramps, island underpasses), what each type builds, the train
sheds' shared vault, the shapes beyond the box, the passenger detail every type carries, the
loading-gauge rule, the no-flicker rule, the triangle budget the types are held to and the headless passenger view.
**Code** - `generator/sets/station.ts`, `generator/previews/stations.ts`,
`generator/previews/wayKit.ts`, `generator/renderPassengerView.ts`, `generator/coplanar.ts`,
`test/stationSet.test.ts`, `test/setPins.test.ts`
**See also** - [sets.md](sets.md) (the registry, landed modules, pins), [previews.md](previews.md),
[stations.md](stations.md) (the station buildings, fixed models), [lod.md](lod.md),
`.agents/skills/station/SKILL.md` (the checklist for changing a type)

## Frame and layout

A station is built in its own frame: x across the tracks, z along them, y up from the terrain
level, in studs. The game lays out a station of N tracks by its type's recipe
(`buildLayout`): rows of `platform`, `rail`, `island`, `building` and `gap`, saved with the
station so a later recipe change never moves a placed one. `furnish(type, length, layout)`
returns the boxes over any layout. The deck sits at `PLATFORM_HEIGHT` (1.75); a rail row is 8
wide over a 5-stud ballast bed.

**The gauge rule.** Nothing may hang below `PLATFORM_HEIGHT + ROOF_HEIGHT` (12.5) over a
ballast bed. `test/stationSet.test.ts` checks every box of every type at 1, 2, 3, 4 and 8
tracks and 40, 60, 120 and 240 studs; a tilted slab ending at the platform edge may reach a
fifth of a stud past it.

## The deck

`pushDeck` paves every walkable band (a deck row plus the ballast shoulders it borrows), with
the edge coping, the yellow safety lines and the cobbled outer trim. Two options:

- **End ramps.** The open-ended types (`platforms_only`, `platforms_shared`,
  `cantilever_wings`, `concourse`, `village_depot`, `heritage_canopy`) run each platform down to
  the terrain over its last `RAMP_LENGTH` (3.5) studs: a tilted slab (`rotX`) over a stepped
  fill that closes the wedge beneath it. Their furniture stays on the level deck: name boards
  1.2 studs in from the ramp, the wind shelters and the depot's fence inside it
  (`endInset(type)` for the fallback boards). The two train sheds keep full-height ends, under
  their end screens.
- **Underpasses.** Every island of a paired type except `concourse` (which has its
  footbridge) gets a stairwell: a 3 x 9 stud opening cut beside the island's centreline (where
  piers, masts and posts stand), one on a station shorter than 100 studs, two at the quarter
  points otherwise. The well holds a flight of six steps down from the +Z end to a dark passage
  floor at terrain level, a glass balustrade on three sides and a glass canopy on four posts
  over its head (`islandWells`, `pushUnderpasses`). The grand terminus moves its wells between
  its bench bays.

## The types

| type | layout | what it builds |
|---|---|---|
| `platforms_only` | plain deck, 3-stud platforms | ramps, posted name boards, benches, a lamp |
| `platforms_shared` | pairs, 10-stud islands | a V-roof over every band (below), underpasses |
| `arch_shed` | pairs | a glass vault per track group (below), underpasses |
| `cantilever_wings` | pairs | masts on every band, tilted wings with a glazed tip over the pairs (below), underpasses |
| `concourse` | pairs | low canopies and a glazed footbridge with a stair tower on every band (below) |
| `village_depot` | tracks side by side, a 10-stud house strip | the country station (below), a post-and-rail fence and lamps on the far platform |
| `heritage_canopy` | pairs | a gabled timber umbrella canopy on cast-iron posts over every band (below), underpasses |
| `grand_terminus` | pairs, 14-stud islands | stone arcades and glazed vaults, nave and aisles on a wide station (below), underpasses |

### The shared platforms

`platforms_shared` puts a V-roof draining to a valley gutter over every band, on two rows of
columns 15 studs apart, each with a base, a cap and a knee brace in to the roof. Each slope is
solid at the valley and the eave with a glazed skylight band between; fascias close the eaves
and both roof ends. The name board hangs at each roof end under the valley, framed top and
bottom, on two rods down from the roof's underside. A departure board (lit on both faces) and a
two-faced clock hang from cross beams. Each island gets a glass waiting shelter with a bench,
open to its track, across from its underpass (one, or two at the quarter points on a long
station); the other benches, each with a bin, stand on the level deck clear of the ramps.

### Platform furniture

The roofed types share their fittings: a departure board lit on both faces, a two-faced clock,
an island's glass waiting shelter with a bench (on the -X side of the centreline, open to its
track, across from the underpass), and a bench with a litter bin (`pushDepartureBoard`,
`pushTwoFacedClock`, `pushShelter`, `pushBenchWithBin`, `pushHangers`). Whatever hangs - a
name board, a departure board, a clock - hangs on two rods from the structure above it, and
whatever stands on the deck stays clear of the end ramps (`test/stationSet.test.ts`).

### The cantilever wings

Tapering masts 12 studs apart, each on a concrete footing with a stout lower shaft, a collar
and a slimmer upper shaft, stand on every band's centreline (on the level deck, clear of the
ramps) and carry a head beam; from it the wings reach out over the pairs, solid then glazed,
stopping short of the group's centre, on diagonal ties. A light strip runs along every platform
edge, fixed to the wing's underside. The name boards hang under the wings at both ends, framed
top and bottom, on two rods each. Two masts carry a departure board and a two-faced clock on
brackets at eye level. The outer platforms keep their glass windbreaks with a bench and a bin;
the islands get a waiting shelter and benches with bins between the masts.

### The concourse

Two canopies over every band, either side of the footbridge: a solid white roof with a glazed
rooflight strip down the middle, a spine beam under it, edge fascias and light strips fixed to
the underside, on columns with footings, cross beams and braces. A framed name board hangs at
each canopy's far end on two rods; a departure board and a clock hang from cross beams toward
the stairs. Islands get a waiting shelter under each canopy, every wide band benches with bins
between the columns. The glazed footbridge crosses the whole station at 11.6 studs, landing in
a stair tower on every band, with the name board and a clock either side of it on both flanks.

### The heritage canopy

A gabled timber umbrella canopy over every band, its eaves stopping at the platform edges, on
one row of cast-iron posts 10 studs apart: each post has a moulded base, a capital and two
spandrel brackets, and a lantern hangs from a bracket on a rod. Both eaves carry a fretted
valance of dagger boards every 1.25 studs (tilted square boxes); a glazed lantern runs along
the ridge. At each gable end a tie beam crosses the canopy and the framed name board hangs from
it on two rods. A clock and a train indicator are fixed to two posts at eye level. Islands get
a small timber waiting room across from their underpass; benches with bins stand between the
posts, on the level deck.

### The train sheds' vault

`arch_shed` and `grand_terminus` share one vault (`makeVault`): an elliptical arch of straight
slabs between two pier lines, risen to its type's proportion or higher, so that nothing hanging
below the arc dips into a track's gauge (checked one chord outside the ballast edge). The slab
count follows the arc's length - a chord of about 2.5 studs, 18 to 48 slabs - so a wide vault
does not show its facets. On it: the glazing (one slab per segment, the full shed length), a
glazing bar at every other joint, and ribs.

- **`arch_shed`** - one vault per track group, springing 4.8 studs above the deck from brick
  piers. Main ribs every 15 studs are lattices (an outer and an inner chord tied by a zigzag);
  a light rib runs halfway between them. A louvred ventilation lantern with a gabled cap runs
  along every crown. A pier line two vaults share carries a valley gutter and downpipes. Each
  vault's mouth is framed by a deep end arch and closed above the gauge only: a solid transom
  beam carrying the name board spans it just above the clearance line (with several vaults, a
  lattice girder across the whole station, on posts from every pier line, carries the name
  instead), and over it a fanlight of edge-to-edge glass fills the arch behind a sunburst of
  glazing bars radiating from a clock on the transom, crossed by a concentric ring. Below the
  transom the mouth is open.
- **`grand_terminus`** - up to two track groups share one great vault (springing at 9 studs).
  A wider station is a basilica: a nave over the middle group (or the middle two) and a lower
  aisle vault (springing at 7) over every other group, with a stone clerestory wall where an
  aisle meets the nave. Each vault ends in a stone screen with a fanlight, an archivolt and an
  entablature; the nave's carries the name board, the clock, the roof cross and a crown
  lantern, an aisle's a finial. Statues stand on every pier line. Below the gauge line each
  platform end closes with a framed screen: a stone lintel, jambs either side of an open
  passage and mullioned glass round it (a narrow platform keeps a plain stone portal).

### The village depot

The house strip holds the station's buildings along the platform, as many as its length allows
(`depotPieces`), in this order of need: the stationmaster's two-storey stucco house (plinth,
string course, corner quoins, windows on both storeys and in the gables, chimneys, the name
board over the door), its single-storey waiting-room wing, a timber goods shed with battens, a
sliding door to the track and a loading apron, and a brick privy. A tiled awning on posts with
knee braces, a fretted valance, lamps and benches runs along the house and the wing.

The house is drawn in station boxes, not placed as a prop: the game places props only for sets
whose data names one (`cableCarStation`, `port`, `airport`; [props.md](props.md)), and a
station type has no such field yet.

## Shapes

Besides the box (and the gable prism), a station box may be one of five **shapes**
(`StationBox.shape`). The set module meshes every one itself (`stationBoxMesh`: triangles in
the station frame, a normal per vertex - smooth round sides, flat caps), and the game and the
factory's preview both draw that mesh, so what the budget counts is what is drawn. A shape's
triangle count follows from its fields alone (`stationBoxTriangles`):

| shape | what it is | fields | triangles |
|---|---|---|---|
| `cylinder` | an N-sided prism inscribed in the box, sy tall, tilted like a box | `sides` 3-24 (8) | 4N - 4 |
| `sphere` | a low-poly ellipsoid inscribed in the box | `sides` 4-24, even (8) | N(N - 2) |
| `dome` | the upper half of an ellipsoid, its base at the box's bottom | `sides` 4-24, even (8) | 2N x round(N/4) - 2 |
| `bar` | a member from `from` to `to`, sx wide and sy deep | `sides` 4 or absent: square, else round | 12, or 4N - 4 |
| `arc` | a curved slab swept along Z: the elliptical arc `arc` (`rx`, `ry`, `a0`, `a1`, `thick`) about (cx, cy), sz long | `sides`: segments 1-64 | 8N + 4; thin glass 2N |

A box is 12 triangles, a gable prism 8, and a **glass pane** - glass no thicker than 0.4 studs,
box or arc - 2: the game draws it as one two-sided surface. A round shape is turned so that no
flat faces along an axis (a box's face could lie in its plane); a three-sided prism keeps a
corner pointing down its local -X (the heritage canopy's dagger boards). Every check that
measures a box (`test/stationSet.test.ts`: the gauge, the name boards, the glass) measures a
shape by its mesh (`stationBoxBounds`).

## Passenger detail

Every type is drawn for the passenger standing on its platform as much as for the camera
above it. Over what its builder made, `furnish` adds the **passenger kit** to every platform and
island band (`pushPassengerKit`):

- **Surface and edges** - a pale tactile strip behind every safety line, a raised coping along
  the edge (nothing reaches out over the ballast), paving joints every 6 studs (broken at the
  stairwells), drainage gratings along the back of an outer platform.
- **Signs** - sector letters A-D on posts at the four sector centres of a platform at least 80
  studs long, and the numbers of the tracks a band serves (counted from -X) near its middle,
  lettered on both faces of their panels in a 3 x 5 block font.
- **Furniture and information** - clusters every 20 studs, in turn per band: a ticket machine
  (lit screen, ledge, hood) with a validator and a bin; an info pillar (round, lit panels, domed
  cap) with a bin; a timetable case (lit poster both sides) with a vending machine or a bin.
  Speaker and camera poles every 30 studs; lamps on posts with bracket arms on the open
  platforms of `platforms_only`.
- **Stairs, lifts and the underpass** - every underpass flight has contrasting nosings on its
  treads and landing, a round handrail down each side wall and a lit mouth to the passage at its
  foot; a glass lift (corner posts, panes, a door frame and call button away from the stair, a
  cab with a ceiling light) stands at the well's closed end.

Every standing item looks for a free spot on its band's level deck, between the tactile strips
and clear of the ramps, from its slot outward (`Floor`): nothing the type built may stand on its
footprint or hang below its top there, and a stairwell counts as taken. An item with no free spot
is left out. Each type also draws its own structure for the eye level: round columns and masts
with bases and capitals (`platforms_shared`, `concourse`, `cantilever_wings`, the heritage posts),
stone plinths and imposts on the arch shed's piers and the terminus' pilasters, domed pendant
lamps in the arch shed, globe lanterns on the village depot and the terminus' lamp standards,
round downpipes, and bench armrests.

**The preview's coplanar step.** The site draws every material a hair bigger than the one
registered before it ([previews.md](previews.md), "Drawing"); a marking that lies a few
hundredths above the deck could land in the deck's grown plane. The kit's deck markings and a
machine's panels therefore stand off by odd halves of that step (`MARK_*`, `PANEL_OUT`), and the
preview registers the materials drawn only on thin parts (letters, screens, posters) first, so
they take the smallest steps.

## No flicker in the game

The game draws a station's boxes exactly as given - unlike the site, it grows no material by a
coplanar step - so two faces of two colours lying in one plane and facing one way flicker as
the camera moves. `test/stationSet.test.ts` ("flicker") meshes every type as the game does (a
glass pane and a glazed arc from both sides) at 1 x 40, 2 x 60, 4 x 120, 3 x 240 and 8 x 60 and
holds it to none (`findCoplanarTriangles`, generator/coplanar.ts); a face looking down onto the
deck or the terrain is never seen and is let be. Parts that would end flush stand off instead:

- a deck slab's sides stop `DECK_INSET` (0.02) inside its band, behind the coping and the outer
  trim, which in turn run 0.02 past the slab's ends (the grand terminus' long side once
  flickered along its whole foot);
- a beam, board, gutter or fascia as long as its roof stops `FLUSH` (0.02) short of the roof's
  ends; a cornice or tie beam stands `FLUSH` proud of the wall or board it caps; a post stands
  `FLUSH` off the top it would share;
- a vault's arc springs `ARC_SPRING_LIFT` above its springing line, so its end faces do not lie
  in the cornice's or the pier's plane;
- a paving joint that would end in the plane of a part standing on it moves along.

## Glass in the game

The game draws `glass` see-through; the factory's previews draw it opaque. A pane is
therefore glass only where something should show through it - a shed's glazing, a
shelter's walls, a canopy's rooflight. A window in a solid wall (the village depot's house,
wing and gables, the heritage canopy's waiting room) is an opaque dark `steel` pane, since a
glass one would show its own frame and wall through it; and a glass roof sits on a steel rim,
not a plate. `test/stationSet.test.ts` holds every type to it: no thin flat glass pane may lie
on a solid face.

## Triangle budget

Every type is held to one budget: a fixed part for what a station has once - end facades,
boards, the depot's buildings - plus a part per stud of length per track, counting one more track
for the outer platforms:

`budget = 6,000 + 40 x length x (tracks + 1)` - **30,000 for 4 tracks of 120 studs**

A station grows with its size as the trains standing in it do, and stays far below them: a
coach is held to 16,000 triangles, so a 240-stud platform of coaches is about 140,000 a track.
`test/stationSet.test.ts` checks every type at 1, 2, 3, 4 and 8 tracks and 40 to 240 studs
(triangles / budget):

| type | 2 x 60 | 4 x 120 | 8 x 240 |
|---|---|---|---|
| `platforms_only` | 2,884 / 13,200 | 6,522 / 30,000 | 11,436 / 92,400 |
| `platforms_shared` | 5,592 / 13,200 | 16,804 / 30,000 | 48,208 / 92,400 |
| `arch_shed` | 6,590 / 13,200 | 24,054 / 30,000 | 77,986 / 92,400 |
| `cantilever_wings` | 4,976 / 13,200 | 16,924 / 30,000 | 53,100 / 92,400 |
| `concourse` | 5,652 / 13,200 | 17,760 / 30,000 | 51,244 / 92,400 |
| `village_depot` | 4,268 / 13,200 | 7,210 / 30,000 | 10,220 / 92,400 |
| `heritage_canopy` | 6,432 / 13,200 | 20,796 / 30,000 | 64,440 / 92,400 |
| `grand_terminus` | 5,144 / 13,200 | 16,426 / 30,000 | 56,816 / 92,400 |

The tightest cases are the arch shed at 8 x 40 and the heritage canopy at 1 x 240 (within a
few hundred and about a thousand triangles of their budgets). A change that redraws a type
moves its pins (`pnpm sets:pins`, [sets.md](sets.md)).

## Passenger view

`generator/renderPassengerView.ts` renders a design headlessly from a camera standing inside it
- an eye height of 2.55 studs over the deck, 70 degrees of view, over a pale sky - with the
triangles cut at the near plane:

    pnpm exec tsx generator/renderPassengerView.ts proc-preview-station-arch-shed out.png \
      --params tracks=4,length=120 --view island

A railway station page has four named views from its layout: `platform` (the first platform,
near one end, looking along it), `island` (the first island), `across` (from the island over the
tracks) and `up` (into the roof); `--eye x,y,z --look x,y,z` places any other camera. The site's
3D viewer offers the same view in the browser ([previews.md](previews.md)).
