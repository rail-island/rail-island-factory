# Bridges

**Covers** - the bridge set's types: what each one builds over the path the game hands in, the
shared kit (deck section, piers, abutments, the lateral frame), structural spans and the cable
types' tower plan, the members an overhead line hangs from, part tags, triangle budgets, and the
checks.
**Code** - `generator/sets/bridge.ts`, `generator/previews/bridges.ts`, `test/bridgeSet.test.ts`,
`test/bridgeBudget.test.ts`
**See also** - [sets.md](sets.md) (the registry, landed sets, pins), [previews.md](previews.md),
[lod.md](lod.md), [surfaces.md](surfaces.md), the `bridge` skill (`.agents/skills/bridge/`)

## What the game hands in, what the module returns

The game plans where a bridge stands - its path, grade profile and the lanes its deck carries -
and calls `buildBridge(type, path, heightAt)` with the path as plain points (`pathFromPoints`:
points, deck width, the lane recentring `shiftAmount`, the deck support height `supportY` and the
overhead clearance `clearanceY`) and a terrain height function. The module returns a list of
`BridgeBox` descriptors in world space, which the game (and the site's preview) draws:

| Shape | What it is |
|---|---|
| `box` | a box at a centre with a size and yaw; `topScale` tapers its top (piers, tower legs) |
| `strut` | a square bar from `a` to `b` (truss members, hangers, stays) |
| `span` | a box from `a` to `b`, `w` wide and `h` tall |
| `ribbon` | a convex cross-section swept along a centreline with mitred joints (the deck, cornices, parapets, girders, chords, arches, cables) |
| `wall` | a vertical slab of varying height swept along stations (masonry spandrels, arch bands, the barrel vault) |

Units are studs (1.5 studs a metre). Ribbon and wall sections are given along the game's sweep
perpendicular, `(tz, -tx)`; the module's own lateral direction (`pathRight`) is the opposite, so
an offset flips sign on the way into a section. The site's sketch sweeps along `(-tz, tx)` and
flips every section back (`previews/bridges.ts`).

**The lateral frame.** A lateral offset is taken along the mitre at each path vertex, blended
along each segment (`pathRightAt`), so a constant offset is a straight line on every segment that
meets its neighbours exactly - where the renderer's mitred sweep puts the deck. The curve sampler
(`adaptiveCurvePoints`) then adds no points to a level member along a bend.

## Types

| Type | Tier | Span limit | Superstructure | Piers |
|---|---|---|---|---|
| `beam` | plain | - | slab with two concrete girders underneath | concrete every ~25 studs |
| `box_girder` | plain | 65 | trapezoidal concrete box under the slab, haunched: a parabolic soffit from 3.4 studs deep over the piers to 1.8 at mid-span | concrete at span boundaries, under the haunch |
| `plate_girder` | framed | 60 | steel through-girders span / 11 deep (2.6 to 5 studs) along the deck edges - the railing too, no parapet or cornice - a quarter of their depth below the slab, top flanges rounding down at the ends, stiffeners on both faces of the web, cross girders under the slab | concrete, cap under the girders |
| `truss` | framed | 64 | Pratt through truss: inclined end posts with portal frames, verticals, diagonals sloping down toward mid-span, a polygonal (Parker) top chord rising up to 4 studs on spans over 40, a crossbeam at every top node with X bracing between | concrete at span boundaries only |
| `deck_truss` | framed | 65 | Warren truss with verticals under the deck, a cross frame between the trusses at every other panel point and X bracing in the bottom plane | concrete under the truss |
| `timber_trestle` | framed | - | plank deck on two stringers and a post-and-rail guard; a bent every ~8 studs of two plumb and two battered posts on footings under a cap, X braced in stories of 10 studs with girts at the story lines and along the bridge at the first one | the bents |
| `arch` | framed | 80 | concrete deck arch: two ribs thickening toward the springings, pairs of spandrel columns every ~5 studs with a cap beam under the slab, struts between the ribs | a concrete block under each rib, the two tied by a cap beam (`PierSpec.columns`) |
| `stone_arch`, `brick_arch` | framed | 28 | masonry arches: spandrel walls, arch bands with a keystone, barrel vault | masonry, with cutwaters and pilasters between arches |
| `cantilever` | signature | 90 | Forth-fashion: towers at the quarters (two splayed legs a side, X braced, a crossbeam with knee braces on top), anchor arms back to the span's ends and cantilever arms out to 0.4 of the span, deepest at the towers (a straight top chord, a bottom chord curving up from the tower foot), N webs, a Warren suspended span under the slab between the arm tips | under the towers, and anchor piers at span boundaries |
| `tied_arch` | signature | 100 | box-section steel arches springing from knuckles on tie girders along the deck edges, a hanger about every 4 studs, transverse struts above the wires with X bracing between them | concrete at span boundaries |
| `network_arch` | signature | 100 | as `tied_arch` with crossing hangers | concrete at span boundaries |
| `suspension` | signature | 140 (main span) | towers, main cables, hangers, stiffening girders, anchor blocks | under the towers |
| `cable_stayed` | signature | 120 (main span) | H towers (two tapering legs beside the deck, a crossbeam on top), a fan of stays from each leg every 4 studs, edge girders | under the towers |
| `cable_stayed_y` | signature | 120 (main span) | inverted-Y towers: the legs upright beside the deck to a knee 2 studs over the wire envelope (a strut there), leaning in above it to one mast over the deck's centre, whose stays fan down to both deck edges in two inclined planes; edge girders | under the towers |

A type the module does not know builds as `beam`.

## Structural spans

`TYPE_META[type].maxSpan` is the span policy. `getStructuralSpanRanges` divides a bridge into
equal spans of at most that length; `buildBridge` runs the type's builder once per span over a
clipped path, so its superstructure (and its span-proportional heights) repeats per span, and
places the boundary piers (`boundaryPierStyle`) between them. A type without a limit is built
once over the whole path.

**Cable types** are the exception: one structure over the whole bridge.
`cableTowerDistances(type, length)` stands the towers at the ends of one or more main spans (the
fewest that keep each within `maxSpan`) with a back span of half a main span at each end; towers
are shared by neighbouring main spans. Their structural spans are the back and main spans between
towers. Tower height follows the main span: up to 26 studs for a suspension bridge, 28 for a
cable-stayed one. A suspension bridge's cables run from an anchor block at each end over the
tower tops, sagging so the lowest point still clears the overhead wires; it has a hanger every 4
studs. A cable-stayed tower fans a stay every 4 studs over half of each neighbouring main span
and over its back span.

## The kit

**Deck section.** Every deck is a slab ribbon (`DECK_THICKNESS` 0.8) with a cornice at each edge (except where the edge is something else: the plate girder's girders, the trestle's planks).
The cornice is an edge beam standing 0.12 proud of the slab top, 0.15 beyond its edge and 0.65
below its underside, so the deck has a shadow line. Parapets (`PARAPET_HEIGHT` 1.6) carry a
coping 0.1 wider each side. All of these are separate convex ribbons with no face in the slab's
planes. The masonry types build them of their masonry; the trestle of timber.

**Piers** (`pushPier`, `PierSpec`):

- concrete (`pier`, `tower`): a shaft that widens with its height (up to 1.6 times) and tapers to
  its given size at the cap. A pier taller than 4 studs stands on a footing: a plinth sunk into
  the ground, 0.3 studs of it showing - but only where the ground under it is flat (corners and
  centre within 0.4 studs, `footprintTerrain`; a river bed counts): on a slope a flat slab would
  jut out of the hillside. Every column, and a masonry block, reaches down to the lowest ground
  under its own footprint, so a pier on a slope never hangs off it. The column standing on the terrain is the box tagged
  `ground` - what the game charts for ships - so a river still takes a hull beside a slim pier
  (the game samples a cell's corners against the charted rect; a wide footing blocked four). A deck 14 or more studs wide (two tracks, a road) stands on twin columns. The
  cap is as wide as what stands on it (`capWidth`): the girders, the truss, both tower legs. The
  bearings sit under the members (`bearings`). `under` stops the pier below a superstructure
  hanging under the slab (girders, box, deck truss, cantilever towers).
- masonry (`stone`, `brick`): one block 0.4 wider than the deck. An intermediate pier gets a
  cutwater at each face (a square column turned 45 degrees, up to the arch springing) and a
  pilaster above it up to the coping; the two abutments get neither.

**Abutments** (`buildAbutments`): a wing wall at each corner, reaching the local ground or cut
short 3.5 studs down on a steep crossing.

**Ground.** Every box standing on the terrain is tagged `ground`; the game charts those for
ships. `test/bridgeSet.test.ts` holds the tag to exactly the boxes whose foot is on the terrain.

## Overhead members

`overheadMembers(type, length, deckWidth, clearanceY)` lists where the superstructure crosses
over the track, as fractions of the whole path, for the game's catenary planner:
`point` members (each on a real crossbeam over the wires, `test/bridgeSet.test.ts`: the truss top crossbeams at every other inner node and both portals, at the top chord's height there, the cantilever tower portals, the tied arch struts above
the wire envelope) a wire is taken up to, and `span` members (the cable types' tower legs) a
perpendicular wire is strung between. Types with nothing over the deck return none, which tells
the planner to use deck masts. `overheadMemberEndpoints` gives a member's world endpoints in the
same lateral frame as the mesh.

## Part tags

`part` decides what each level keeps: `deck` (the slab), `support` (piers, footings, caps,
bents, anchor blocks), `frame` (the silhouette: girders, chords, arches, towers, cables, walls,
outer stays) and `detail` (cornices, copings, stiffeners, web members, hangers, inner stays).
A middle level keeps everything but `detail`.

**The distant level** is the module's too: `lowDetailBoxes(boxes)` keeps the `deck`, `support`
and `frame` boxes and thins every sweep to the points that still bend it (`simplifyIndices`,
Ramer-Douglas-Peucker over the centreline - for a wall with its opening heights, so a straight
centreline cannot flatten a masonry arch - at 0.12 studs for the deck, 0.45 for the rest).
The game draws it far away and the site's distant preview is the same function, so the two
cannot drift apart. Untagged parapets and every `detail` box (the masonry vault, keystones,
web members, hangers) go.

## Triangle budgets

A bridge grows with its length, so like a train - budgeted per car and added up
([../models/lod.md](lod.md)) - it is budgeted per length: a tier's rate per 100 studs of bridge
plus an allowance for its two ends. Triangles are counted as the site draws them.

| Tier | Per 100 studs | Ends | 60 studs | 160 studs | 400 studs |
|---|---:|---:|---:|---:|---:|
| plain | 2,000 | 1,000 | 2,200 | 4,200 | 9,000 |
| framed | 4,000 | 1,000 | 3,400 | 7,400 | 17,000 |
| signature | 6,000 | 1,500 | 5,100 | 11,100 | 25,500 |
| distant level (every tier) | 1,500 | 500 | 1,400 | 2,900 | 6,500 |

For scale: a 160-stud (107 m) bridge stays within one row house (10,000) for the plain and
framed tiers and about one rail vehicle (15,000) for a signature bridge. The distant level is
also held to 65% of the full level; it keeps far more than a vehicle's 100 triangles a car
because it is the bridge's silhouette - its arches, towers and truss outline - not a box.

The cap holds on every fixture of `test/bridgeBudget.test.ts`: straight crossings of 60, 160 and
400 studs 30 studs over flat ground (single track, and a road deck on the longest), and a
160-stud arc of radius 120 with a vertex every 4 studs. A bend costs more, because every ribbon
gets a joint at every vertex. The budget is a ceiling, not a target: spend it on what reads from
the game's camera (silhouette, depth, shadow lines) and keep a margin for curves.

Current counts (single track; the 400-stud road deck costs at most a fifth more):

| Type | 60 | 160 | 400 | 160 curved |
|---|---:|---:|---:|---:|
| beam | 330 | 562 | 1,142 | 3,370 |
| box_girder | 456 | 1,108 | 2,500 | 3,908 |
| plate_girder | 1,472 | 3,844 | 9,248 | 6,028 |
| truss | 1,364 | 3,484 | 7,988 | 5,044 |
| deck_truss | 1,400 | 3,592 | 9,164 | 7,024 |
| timber_trestle | 2,400 | 5,592 | 13,464 | 7,152 |
| arch | 952 | 2,402 | 5,864 | 4,530 |
| stone_arch, brick_arch | 2,000 | 4,706 | 11,744 | 6,834 |
| cantilever | 1,972 | 4,318 | 10,636 | 6,446 |
| tied_arch | 1,156 | 2,446 | 5,266 | 3,966 |
| network_arch | 1,492 | 3,358 | 7,570 | 4,878 |
| suspension | 888 | 1,872 | 4,278 | 4,024 |
| cable_stayed | 632 | 1,208 | 2,836 | 2,768 |
| cable_stayed_y | 704 | 1,280 | 2,980 | 2,840 |

The distant level is held to the previews' 500 triangles ([previews.md](previews.md)).

## The site preview

`previews/bridges.ts` builds each type over a straight crossing of flat ground, raised until
nothing dips below it, with three preview parameters: the span (60 or 160 studs), what the deck
carries and its wires. The decks follow the game: n tracks 8 apart on a deck 8n + 1 wide, the
path along the first track and the deck recentred over them (`shiftAmount` 4(n - 1)); a narrow
or wide road (8 or 16 studs, the road types' widths) plus 2, centred. Tracks are drawn by the
ways' kit (`wayKit.ts`) with the ballast on the deck top; a road gets its carriageway, raised
shoulders and centre line, and with wires the tram type's embedded tracks. The wires - a contact
and messenger wire per track for a railway, a trolley wire for a tram - are fixed as the game's
planner fixes them: a drop from each `point` member, a cross-span wire between each `span`
member's verticals, and where a type has no members, railway masts (a portal over more than one
track) or tram poles on the deck inside the parapets, every 30 studs. The distant level draws
the bridge only (`lowDetailBoxes`). The fixture's clearance is the game's: the railhead 1.528
over the path, the messenger wire 10.6 over it and 1.3 of margin, deck-local about 13.16.

## Checks

- `test/bridgeBudget.test.ts` - every type within its tier on every fixture, and every type has
  a tier.
- `test/bridgeSet.test.ts` - the curve sampler, `ground` tags, the arch crown under the deck,
  the masonry vault, twin columns and footings, cutwaters on intermediate piers only, the cable
  types' shared towers (back spans, main span limit, members and piers at the towers), and level
  members sampled at the path's vertices only.
- `test/previews.test.ts` - a recentred deck drawn over its own piers and girders.
- the catalog sweep on every bridge page (`proc-preview-bridge-*`): no coplanar faces of two
  materials, grounded, LOD within budget.
- the pins ([sets.md](sets.md)): every type's boxes over a curved valley and its overhead members
  at three lengths. A redrawn type moves its pins (`pnpm sets:pins`) and redraws every island
  that has it, so make that change on purpose.
