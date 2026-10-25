# Cable car stations

**Covers** - the four cable car station types of the `cableCarStation` set: the whole station
each draws for the game (hall, head, bull wheel, boarding platform, stairs), the view the game
passes, the per-type platforms and heads, the two levels of detail, the clearances, the triangle
budget, the pylon, the site preview and the pins.
**Code** - `generator/sets/cableCarStation.ts`, `generator/previews/structures.ts`
(`cableCarStationPreview`), `generator/previews/props.ts` (`pylonPreview`),
`generator/sets/pinCases.ts`, `test/cableCarStation.test.ts`
**See also** - [sets.md](sets.md), [previews.md](previews.md), [cable-cabins.md](cable-cabins.md),
the game's `docs/gameplay/cable-cars.md`, the spec
`../specs/2026-10-25-cable-car-station-structure.md`

## What the module draws

A station type is a footprint, a rope-head height and the whole station drawn round the head.
`TYPE_META` holds the size the game places a type with:

| Type | Footprint (w x d) | Rope head above the station's level |
|---|---|---|
| `open_gantry` | 14 x 18 | 16 |
| `alpine_chalet` | 18 x 24 | 15 |
| `glass_modern` | 18 x 26 | 17 |
| `concrete_drive` | 22 x 30 | 19 |

`buildStation(type, view)` returns everything the station is drawn from, in the station-local
frame (+Z toward the first support, +X the station's right, y = 0 the station's terrain level):

- `boxes` - `StationBox`: a box at a centre with a size, tilted about Z then X (three.js's Euler
  order with no Y) or a gable prism, a `CableCarMaterial` (`steel`, `timber`, `glass`,
  `concrete`, `stone`, `deck`, `wheel`), a `part` and a `level`;
- `sectors` - `StationSector`: a flat annular sector about a centre, its middle toward
  `apexX, apexZ` and opening `halfAngle` each side (PI is a whole ring): the curved platform,
  its railing, the wheel's rim and spokes;
- `headY`, `headZ` - the wheel axis, `headZ = d / 2 + 7` in front of the footprint's centre;
- `deckY` - the platform's walking surface, or null when the view leaves no room for one.

An unknown type draws as `open_gantry`. Only the footprint is levelled by the game, so what
stands outside it (a pedestal, the platform's legs) reaches `COLUMN_SINK` (16 studs) below the
station's level.

| `part` | What | The game |
|---|---|---|
| `hall` | the station hall and the roof it carries forward over the platform and the back half of the wheel | merges it |
| `head` | the pedestal or the hung drive shaft holding the wheel, the bearing cap | merges it |
| `wheel` | the bull wheel: rim, spokes, hub | puts it in its own node and turns it about (0, `headY`, `headZ`) |
| `platform` | the deck, its edge beams, railing and legs | merges it; the `deck` material is the structure's platform |
| `stairs` | the flight from the platform down to the hall | merges it |

## The view

`StationView` is what the line through the station needs; the game derives it from the line's
cabin and cabin count each time and stores none of it:

| Field | Meaning |
|---|---|
| `circulating` | three or more cabins go round the wheel: a curved platform; otherwise a rectangular U |
| `sillDrop` | studs from the rope down to the cabin's door sill: the deck stands 0.25 below it |
| `halfWidth` | half the cabin's width: the deck's inner edge stands `5 + halfWidth + 0.5` from the wheel axis, never inside the cabins' ring (7.8) |

`DEFAULT_VIEW` (`sillDrop` 8.3, `halfWidth` 2.0, a rectangular platform) is what a station is
drawn with before its line has a cabin: the middle of the catalog's range (gondola-cabin 8.13,
cabin-classic 8.54, cablecar-cabin 8.22).

Both plans use the same radial band about the wheel axis, 4.5 studs wide (`platformBand`):

- **curved** - one deck sector wrapping 100 degrees each side of its apex behind the wheel, edge
  beams under both rims, the railing round the outer rim with a gap at the apex where the stairs
  leave, a short railing closing each end, five legs;
- **rectangular** - a back deck across behind the wheel and an arm forward along each strand as
  far as the curve's ends reach, edge beams round every edge, the railing on the back edge
  either side of the stairs and along each arm's outboard edge and front end (the inboard edge
  is where passengers board), three legs under each arm and three under the back deck.

The stairs drop from the deck's back edge straight toward the hall in treads 0.9 deep and about
0.55 high, the first one level with the deck; every hall leaves them a door 4.7 studs wide.

## The types

Each type draws its platform, head and wheel in the hall's own materials, so the station reads as
one building:

| Type | The hall | The platform | The head and wheel |
|---|---|---|---|
| `open_gantry` | a red steel frame of H columns on plinths, lattice girders cantilevered to the wheel, roof trusses, X bracing; a corrugated roof with a ridge lantern and the machine room over the wheel; clad back wall, two booths, the station board | a dark steel grating on red H legs with knee braces on concrete plinths, red three-bar railings, open treads on red stringers with handrails | the wheel hung from the gearbox under the machine room; red spokes |
| `alpine_chalet` | a stone ground floor and two timber storeys, shuttered windows, flower boxes, balconies, a clock; one shingle roof on bracketed eaves carried forward by timber posts, braces and trusses | a timber deck on dark timber posts with braces on stone plinths, a timber rail on posts, open timber treads | a stone pedestal under a timber-clad housing |
| `glass_modern` | a two-storey curtain-wall box under a flat white wing with a skylight and solar panels, carried by tree columns forked above the platform's railing; a lift core with a glass lantern | a light deck with a white edge, slim steel legs, glass balustrades with a dark cap, a solid white flight | a white pedestal with a teal housing; white spokes |
| `concrete_drive` | a concrete hall with deep fins, ribbon windows and a relief, portal frames, a coffered ceiling, the drive room over the wheel | a thick concrete deck on concrete piers, a concrete parapet with a light coping, a solid flight with cheek walls | the wheel hung from the gearbox under the front beam; orange spokes |

The hall's frame follows the view where it meets the platform: the glass type's tree columns
fork 1 stud above the railing, whatever the deck's height.

## Levels of detail

Every box and sector carries a `level`: `full` (the near level), `low` (the distant level) or
`both`. The distant level is the hall's shell (its sides, the back wall and what stands over the
stairs' door), the roof, the columns and beams that carry it, the machine room or tower, the
pedestal, the platform's deck, every fourth block of a solid flight of stairs and a sloping beam
for each open one. It never keeps the wheel: the game's distant level is a merged static mesh.

`test/cableCarStation.test.ts` holds each type, in both plans with the default cabin, to 8,000
triangles at the full level and 500 at the low one, counted as the game meshes them (a box 12,
a gable prism 8, a sector 8 a step at one step per 0.12 radians).

## The clearances

`stationFouls(type, view, item)` says why a box or sector fouls the station's own clearances,
or null:

- `cabin ring` - nothing but the wheel in the ring a cabin sweeps round it (2.5 to 7.5 studs from
  the axis, from the deepest cabin's floor 10 studs below the rope to just below the rope);
- `head` - nothing but the head and the wheel within 7.6 studs of the axis, up to 1.3 above the
  rope (the bearing cap and the grips riding the wheel);
- `lanes` - nothing more than 0.6 studs ahead of the axis above the grips (the rope may leave
  climbing steeply), and nothing in the two lanes the cabins leave along (beside each strand,
  `5 -+ (halfWidth + 0.3)` from the centre line, above the deepest cabin's floor);
- `platform` - nothing but the platform and slender upright columns (which may pass through the
  deck) in the platform's band, from 1 stud below the deck to above its railing;
- `stairs` - nothing over a tread lower than 2.4 studs of head room.

The test asserts every type clear in both plans, at both levels, for the catalog's cabins and a
narrower and a wider one, that no hall box but a column crosses the rectangular deck, and that
each check would catch a box in its place.

## The pylon

`buildPylon(height)` is one design for every line, the shape of a modern ropeway mast: a tubular
mast sunk into the ground (no footing pad), flared in two sleeves toward its foot with a flange
ring at each, a concrete collar straddling grade, a ladder up its back, the cross-head carrying
both strands with end plates and a walkway with a railing under it, a rocker of four sheaves
under each strand (their tops 0.05 below `height`, where the rope rides) and a lightning rod.
The first three boxes are the mast, the collar and the cross-head: the silhouette the distant
level keeps (the site preview draws only those at its low level). A pylon is about 300 triangles.

## Preview and pins

The site draws each type on its own page from `buildStation` with the default cabin, on its
levelled footprint, everything sunk cut off a stud below it; the `platform` preview parameter
picks the rectangular (`shuttle`) or the curved (`ring`) plan. Its low level is the station's
distant level, within the preview pages' 500. The pylon has its own page among
the props, at 12, 24 or 40 studs.

`generator/sets/pinCases.ts` pins `TYPE_META`, every type in both plans with the default cabin
and the pylon at 12, 31.5 and 60 studs (`pnpm sets:pins`, `test/setPins.test.ts`).
