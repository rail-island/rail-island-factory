# Bridges

**Covers** - the bridge set's types: what each one builds over the path the game hands in, the
shared kit (deck section, piers, abutments, the lateral frame), structural spans and the cable
types' tower plan, where the supports stand (planned off taken ground, around the player's pylons
and blocked spans), the members an overhead line hangs from, part tags, triangle budgets, and the
checks.
**Code** - `generator/sets/bridge.ts`, `generator/previews/bridges.ts`, `test/bridgeSet.test.ts`,
`test/bridgeSupports.test.ts`, `test/bridgeBudget.test.ts`
**See also** - [sets.md](sets.md) (the registry, landed sets, pins), [previews.md](previews.md),
[lod.md](lod.md), [surfaces.md](surfaces.md), the `bridge` skill (`.agents/skills/bridge/`)

## What the game hands in, what the module returns

The game plans where a bridge stands - its path, grade profile and the lanes its deck carries -
and calls `buildBridge(type, path, heightAt, waterAt?, options?)` with the path as plain points (`pathFromPoints`:
points, deck width, the lane recentring `shiftAmount`, the deck support height `supportY` and the
overhead clearance `clearanceY`), a terrain height function (the bed, under water) and, optionally,
the water surface's height (`WaterLevelFn`: undefined where it is dry), and the support options
(what ground is taken, the player's pylons and blocked spans - see Where the supports stand; a
`SupportPlan` from `planSupports` is accepted in their place). The module returns a list of
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

**Colours.** Every box carries its own `color` (`Rgb`, sRGB 0-255), which the game draws it with;
its `material` still picks the surface (photo) and the part's kind. The palette is the module's
`COLORS` (one colour per material) as the type's parameters recolour it (below: the steel's
paint, the concrete's shade, the masonry, the timber, the cables). Some parts take a tone of
their material instead: the deck's cornice (its fascia) and the parapet coping are lighter than
the slab, a concrete pier's cap or hammerhead is the light band at its head (1.45 of the way to
white less one), its footing darker, a masonry pier's impost and an arch's ring and keystone
lighter, and the masonry vault dark (0.62), so the opening under an arch reads as depth. The
game drew the material's colour before; a game build that ignores `color` still draws every
box, in its material's colour.

**The lateral frame.** A lateral offset is taken along the mitre at each path vertex, blended
along each segment (`pathRightAt`), so a constant offset is a straight line on every segment that
meets its neighbours exactly - where the renderer's mitred sweep puts the deck. The curve sampler
(`adaptiveCurvePoints`) then adds no points to a level member along a bend.

## Types

| Type | Tier | Span limit | Superstructure | Piers |
|---|---|---|---|---|
| `beam` | plain (framed on steel plate girders or steel piers) | - / 65 / 60 | the `girders` parameter: `concrete`, a slab with two concrete girders underneath (piers every ~25 studs, no span limit); `box`, trapezoidal concrete box under the slab, haunched: a parabolic soffit from 3.4 studs deep over the piers to 1.8 at mid-span (structural spans of 65); `plate`, steel through-girders span / 11 deep (2.6 to 5 studs) along the deck edges - the railing too, no parapet or cornice - a quarter of their depth below the slab, top flanges rounding down at the ends, stiffeners on both faces of the web, cross girders under the slab (spans of 60) | concrete every ~25 studs; at span boundaries for the box and the plate girders |
| `truss` | framed | 64 | Pratt through truss: inclined end posts with portal frames, verticals, diagonals sloping down toward mid-span, a polygonal (Parker) top chord rising up to 4 studs on spans over 40, a crossbeam at every top node with X bracing between | at span boundaries only; dressed stone by default (`piers`) |
| `deck_truss` | framed | 65 | Warren truss with verticals under the deck, a cross frame between the trusses at every other panel point and X bracing in the bottom plane | concrete under the truss |
| `timber_trestle` | framed | - | plank deck on two stringers and a post-and-rail guard; a bent every ~8 studs of two plumb and two battered posts on footings under a cap, X braced in stories of 10 studs with girts at the story lines and along the bridge at the first one | the bents |
| `arch` | framed | 80 | concrete deck arch: two ribs thickening toward the springings, pairs of spandrel columns every ~5 studs with a cap beam under the slab, struts between the ribs | a concrete block under each rib, the two tied by a cap beam (`PierSpec.columns`) |
| `stone_arch` | framed (signature with statues or gate towers) | 28 | masonry arches of stone or brick (`masonry`, each with its own photo), statues on the piers (`statues`), gate towers at one or both ends (`gates`): spandrel walls, arch bands with a keystone, barrel vault | masonry, with cutwaters and pilasters between arches |
| `cantilever` | signature | 90 | Forth-fashion: towers at the quarters (two splayed legs a side, X braced, a crossbeam with knee braces on top), anchor arms back to the span's ends and cantilever arms out to 0.4 of the span, deepest at the towers (a straight top chord, a bottom chord curving up from the tower foot), N webs, a Warren suspended span under the slab between the arm tips | under the towers only: the anchor arms rest on the abutments or meet the next span's arms, with no pier at a span boundary |
| `tied_arch` | signature | 100 | box-section steel arches springing from knuckles on tie girders along the deck edges, vertical or crossing (network) hangers (`hangers`), a hanger about every 4 studs, transverse struts above the wires with X bracing between them | concrete at span boundaries |
| `suspension` | signature | 140 (main span) | towers, main cables, hangers, stiffening girders, anchor blocks | under the towers |
| `cable_stayed` | signature | 120 (main span) | H-frame or inverted-Y towers (`towers`). H: two tapering legs beside the deck, a crossbeam on top), a fan of stays from each leg every 4 studs, edge girders; Y: inverted-Y towers: the legs upright beside the deck to a knee 2 studs over the wire envelope (a strut there), leaning in above it to one mast over the deck's centre, whose stays fan down to both deck edges in two inclined planes; edge girders | under the towers |

A type the module does not know builds as `beam`.

## Parameters

A player picks a bridge's look as they pick a building's. `TYPE_PARAMS[type]` lists each type's
own parameters - a name, an English title, values with titles, a default - and the game passes
the chosen values to `buildBridge(type, path, heightAt, waterAt, options, params)`, and to
`planSupports` and `supportFootprint` (the piers' footprint follows their material). A value
missing or unknown builds as the default, and every type's defaults draw it as it was drawn
before it had parameters. Their titles are exported text, `set.bridge.<type>.param.<name>` and
`.<value>` ([text.md](text.md)). No two types offer the same choices.

| Type | Parameters (first value the default) |
|---|---|
| `beam` | `girders`: concrete, box, plate; `concrete`: warm, light, weathered; `paint`: grey, green, oxideRed, black, blue (the plate girders, the bearings, steel piers); `piers`: concrete, stone, brick, steel |
| `truss` | `paint`: oxideRed, green, black, silver; `piers`: stone, brick, concrete |
| `deck_truss` | `paint`: grey, oxideRed, green; `piers`: concrete, stone, brick |
| `cantilever` | `paint`: oxideRed, grey, black; `piers`: concrete, stone |
| `arch` | `concrete`: warm, light, weathered; `piers`: concrete, stone, brick |
| `stone_arch` | `masonry`: sandstone, granite, limestone, redBrick, yellowBrick, blueBrick (the material and the photo too); `statues`: none, piers; `gates`: none, one, both |
| `tied_arch` | `hangers`: vertical, network; `paint`: blue, silver, oxideRed, green; `piers`: concrete, stone, brick |
| `suspension` | `paint`: orange, green, grey (the girders); `cables`: black, white; `piers`: concrete, stone |
| `cable_stayed` | `towers`: h, y; `concrete`: warm, light, weathered; `cables`: black, white, orange |
| `timber_trestle` | `timber`: natural, weathered, creosote |

**Structures.** A type builds as one structure, with its builder, piers and span policy; the
beam bridge's `girders` picks one of three (`structureOf`: `beam`, `box_girder`, `plate_girder`,
which were types of their own; `STRUCTURE_META` holds their spans). Every public function maps
a type and its parameters to the structure (`getStructuralSpanRanges` and `overheadMembers` take
the parameters too).

**Masonry photos.** A `masonry` swatch picks the material (stone or brick), its honest colour
and the surface its boxes draw with (`BridgeBox.surface`): `bridge-sandstone`,
`bridge-limestone`, `bridge-granite` (the cobblestone photo, grey), `bridge-brick`,
`bridge-brick-yellow`, `bridge-brick-blue` - each a photo with a `balance` that corrects it
toward that colour ([surfaces.md](surfaces.md)), so a tone of the colour (a keystone, the vault,
a gate tower's darker walls) still scales the photo, and a yellow or blue brick is not the red
photo under a tint.

**Statues** (`statues: piers`, `pushStatue`): on every intermediate pier of a masonry arch, on
each side, a pedestal on the pilaster's top and a robed figure of blackened sandstone (a
tapering robe, the head, a cross held on the deck's side) - the Charles Bridge in Prague.

**Gate towers** (`gates: one` / `both`, `pushGateTower`): a tower just inside the bridge's
end, over its abutment (the Old Town Bridge Tower): two side walls 1.2 studs beyond the deck's
edges standing on the ground (tagged `ground`), the passage between the parapets clear up to
the overhead clearance with a pointed arch over it (a wall across the deck whose underside
traces the arch), 5.5 studs of wall over the crown, a cornice band, a steep pyramid roof 9
studs tall, four corner turrets with spires and three dark windows on each face. The
passage clears the wires, so the catenary runs through on its deck masts.

A colour parameter recolours materials (`paint` the steel, `concrete` the deck, parapet, pier and
tower, `masonry` the stone or brick and picks which, `timber`, `cables`). `piers` changes what a
concrete pier spec builds (`choosePier`): `stone` or `brick` - a masonry block as wide as what it
carries plus 0.6, at least 3 deep, under a lighter impost band just below the slab; `steel` - a
steel trestle tower (`pushSteelTower`): four legs battered 0.08 across and 0.05 along per stud of
height (at most 2.6 and 1.6) from concrete pedestals (tagged `ground`, risen above any water) up to
a cap girder under the bearings, X braced across the bridge in stories of about 8 studs with a
strut across at the top and the foot. A masonry arch's own piers and a trestle's bents are not
concrete and stay. The style a build draws with is resolved once per public call (`withStyle`).

**Retired types.** Types that differed from another only in what is now a parameter were merged
into it; their ids are stored in saved maps, so the registry keeps a retired alias and
`RETIRED_TYPES` gives the parameters each stands for:

| Retired id | Reads as |
|---|---|
| `brick_arch` | `stone_arch` with `masonry: redBrick` |
| `network_arch` | `tied_arch` with `hangers: network`, `paint: silver` |
| `cable_stayed_y` | `cable_stayed` with `towers: y` |
| `box_girder` | `beam` with `girders: box` |
| `plate_girder` | `beam` with `girders: plate`, `paint: green` |

`storedBridge(storedType, own)` reads a stored bridge: its type, and the retired values under its
own. Every public function accepts a retired id and draws it exactly as its type with those values
(`test/bridgeSet.test.ts`). The pins hold `TYPE_PARAMS` and `RETIRED_TYPES` (`bridge.params`,
`bridge.retired`).

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

## Where the supports stand

`planSupports(type, path, options?)` returns a bridge's `SupportPlan`: its structural spans, every
ground support's distance along the path (span-boundary piers, a beam bridge's piers, a trestle's
bents, a cantilever's tower piers, a cable type's towers - with the ends where the type stands on
them), the cable towers, and the supports that found nowhere free (`blocked`). `buildBridge` and
`overheadMembers` build from the same plan, so the catenary's fixings follow the drawn structure.

With no options, or nothing in the way, the plan is the default layout above: equal spans, equal
pier and bent spacing, the even tower plan - bit for bit, so the pins do not move. The options:

| Option | What it means |
|---|---|
| `groundBlocked(footprint)` | the game's answer to "is the ground under this rectangle taken" (a track, a road, a building); `footprint` is the support's centre on the path, its yaw and its size across and along (`supportFootprint`) - the widest it can be drawn: a concrete shaft at its full flare (1.6) on its footing |
| `pylons` | distances where the player put a support: each is kept, even on taken ground |
| `blockedSpans` | `{ from, to }` stretches of the path where no support may stand |

When the default layout has a support on taken ground or in a blocked span, or the player put a
pylon, the whole layout is re-planned. Between two fixed stations (the ends and the pylons) every
candidate station half a stud apart is weighed and the cheapest chain of spans wins: a span costs
its squared deviation from the type's even spacing, more once it passes the type's limit
(`maxSpan`; 50 studs between beam piers, 10 between trestle bents) and prohibitively past the hard
cap (half as long again; 24 studs - three bents' spacing - for a trestle, enough to clear a track or a
road); a support on taken ground costs more than any
span within the cap, and one in a blocked span more than anything else. So a support with nowhere
free to go is dropped and its neighbours span over, and stands on taken ground only when dropping
it would stretch a span past the cap. Spans may come out unequal; the superstructure is built over
each span's own length, and a boundary pier is styled for the longer span it carries. A
cantilever plans its span boundaries with its tower piers at their quarters; a pylon on a
cantilever becomes a span boundary with a plain pier. A cable type's pylons are its towers;
otherwise each default tower slides to the nearest free station within a quarter of its main span,
or stays - a tower is never dropped. The cables follow: a suspension main span sags in proportion
to its length, a cable-stayed tower fans to half way to each neighbour. A trestle's plan also
lists its `openings`: neighbouring bents with blocked ground (taken, or in a blocked span) anywhere
between them, tested every stud - whether the bents were moved there or not. The trestle draws no
longitudinal ties across an opening, so nothing runs low over the track or road under it. The plan
is deterministic.

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
  under its own footprint, so a pier on a slope never hangs off it. **In water** (`waterAt` above
  the bed by more than 0.2 at the pier's centre) the surface is the flat ground, whatever the bed
  does under it: the footing becomes a caisson from the bed up to 0.3 above the waterline. The column standing on the terrain is the box tagged
  `ground` - what the game charts for ships - so a river still takes a hull beside a slim pier
  (the game samples a cell's corners against the charted rect; a wide footing blocked four). A deck 14 or more studs wide (two tracks, a road) stands on twin columns. The
  cap is as wide as what stands on it (`capWidth`): the girders, the truss, both tower legs. The
  bearings sit under the members (`bearings`). `under` stops the pier below a superstructure
  hanging under the slab (girders, box, deck truss, cantilever towers). A single shaft under a
  cap at least 1.2 wider carries it as a **hammerhead**: a wall across the deck whose underside
  rises from the shaft (up to 1.4 deeper there, `HAMMER_HAUNCH`) out to the tips; twin columns
  and a narrow cap keep the box cap. The cap is lighter than the shaft, the footing darker.
- masonry (`stone`, `brick`): one block 0.4 wider than the deck. An intermediate pier gets a
  cutwater at each face (a square column turned 45 degrees, up to the arch springing) and a
  pilaster above it up to the coping; the two abutments get neither. A pier with an `impost`
  (the masonry arches at their springing; the through truss just under the slab) wears a band
  of lighter stone there, 0.4 tall and 0.15 proud all round. In water an intermediate
  pier stands on a starling: the block and its cutwaters again, 0.5 wider all round, from the
  bed up to 0.8 above the waterline, stopping 0.3 short of the springing (none when the water
  reaches within 0.5 of it).
  Footings, caissons and starlings are not tagged `ground`: ships are charted against the slim
  pier, not the ledge round it.

**Abutments** (`buildAbutments`): what each end stands on, where the deck meets the bank. Over a
bank - the lowest ground under the abutment's footprint within 8 studs (`ABUTMENT_MAX_DROP`) of
its seat - each end gets:

- a **breast wall** under the types that bear on a seat at their ends (`SEATED_TYPES`: beam,
  box girder, plate girder, deck truss, truss, tied and network arch, cantilever) and the cable
  types: as wide as the deck and 0.4 more each side, from 0.6 under the deck to 2 studs back into
  the bank, from the seat (`under` below the slab, as the type's end pier would bear: under the
  beam's girders, the box, the deck truss) down to the ground, tagged `ground`, with a lighter
  coping along its front edge. The seated types' end piers give way to it (`endOnAbutment`);
- a **backwall** behind the deck's end from inside the breast wall up to just under the deck top,
  wherever the deck's underside stands more than 0.3 over the ground (under a deep deck truss the
  seat may lie on the bank while the backwall still closes the joint); where the deck lies on the
  ground neither wall stands, so nothing there is charted as a pier;
- a **wing wall** each side, running 6 studs back along the bank from inside the parapet's end,
  its top falling from just under the parapet's coping to 0.5 over the ground, sunk 0.3 into it,
  with a lighter coping. These are walls through stations beyond the path's end (`endPoint`,
  straight on along the end's level tangent).

The concrete arch and the masonry arches spring from their own end blocks and keep them (no
breast wall), with the wing walls in their own material. The trestle, and any end over a deeper
drop, keep the short wing wall at each corner beside the end pier, reaching the local ground or
cut short 3.5 studs down.

**Ground.** Every box standing on the terrain is tagged `ground`; the game charts those for
ships. `test/bridgeSet.test.ts` holds the tag to exactly the boxes whose foot is on the terrain.

## Overhead members

`overheadMembers(type, length, deckWidth, clearanceY, plan?)` lists where the superstructure crosses
over the track, as fractions of the whole path, for the game's catenary planner:
`point` members (each on a real crossbeam over the wires, `test/bridgeSet.test.ts`: the truss top crossbeams at every other inner node and both portals, at the top chord's height there, the cantilever tower portals, the tied arch struts above
the wire envelope) a wire is taken up to, and `span` members (the cable types' tower legs) a
perpendicular wire is strung between. Types with nothing over the deck return none, which tells
the planner to use deck masts. `overheadMemberEndpoints` gives a member's world endpoints in the
same lateral frame as the mesh. Given the bridge's `SupportPlan`, the members follow its spans and
towers.

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

A type's parameters can move it up a tier: a beam bridge on steel plate girders or steel
trestle piers is framed, a masonry arch with statues or gate towers (a landmark) signature
(`test/bridgeBudget.test.ts`, `tierOf`).

For scale: a 160-stud (107 m) bridge stays within one row house (10,000) for the plain and
framed tiers and about one rail vehicle (15,000) for a signature bridge. The distant level is
also held to 65% of the full level; it keeps far more than a vehicle's 100 triangles a car
because it is the bridge's silhouette - its arches, towers and truss outline - not a box.

The cap holds on every fixture of `test/bridgeBudget.test.ts`: straight crossings of 60, 160 and
400 studs 30 studs over flat ground (single track, and a road deck on the longest), and a
160-stud arc of radius 120 with a vertex every 4 studs. A bend costs more, because every ribbon
gets a joint at every vertex. The budget is a ceiling, not a target: spend it on what reads from
the game's camera (silhouette, depth, shadow lines) and keep a margin for curves.

Counts at the parameters' defaults, measured before the abutments and the parameters (single track; the 400-stud road deck costs at most a fifth more; `test/bridgeBudget.test.ts` holds every pier, hanger and tower choice to its tier):

| Type | 60 | 160 | 400 | 160 curved |
|---|---:|---:|---:|---:|
| beam, concrete beams | 330 | 562 | 1,142 | 3,370 |
| beam, box girder | 456 | 1,108 | 2,500 | 3,908 |
| beam, steel plate girders | 1,472 | 3,844 | 9,248 | 6,028 |
| truss | 1,364 | 3,484 | 7,988 | 5,044 |
| deck_truss | 1,400 | 3,592 | 9,164 | 7,024 |
| timber_trestle | 2,400 | 5,592 | 13,464 | 7,152 |
| arch | 952 | 2,402 | 5,864 | 4,530 |
| stone_arch (stone or brick) | 2,000 | 4,706 | 11,744 | 6,834 |
| cantilever | 1,972 | 4,318 | 10,636 | 6,446 |
| tied_arch, vertical hangers | 1,156 | 2,446 | 5,266 | 3,966 |
| tied_arch, network hangers | 1,492 | 3,358 | 7,570 | 4,878 |
| suspension | 888 | 1,872 | 4,278 | 4,024 |
| cable_stayed, H towers | 632 | 1,208 | 2,836 | 2,768 |
| cable_stayed, Y towers | 704 | 1,280 | 2,980 | 2,840 |

The distant level is held to the previews' 500 triangles ([previews.md](previews.md)).

## The site preview

`previews/bridges.ts` builds each type over a straight crossing of a valley - two banks level with
the track bed behind the ends (0.6 under the deck top), each falling 6 studs under its abutment
and then sloping 1:1.1 to a flat floor - raised until nothing dips below the floor, and draws
that ground as a block 4 studs wider than the deck each side; what stands on it is sunk 0.1 into
it. It has three preview parameters: the span (60 or 160 studs), what the deck
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
- the pins ([sets.md](sets.md)): every type's boxes over a curved valley, dry and with a river in
  its floor (`.river`), and its overhead members at three lengths. A redrawn type moves its pins (`pnpm sets:pins`) and redraws every island
  that has it, so make that change on purpose.
