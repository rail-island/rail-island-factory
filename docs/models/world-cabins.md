# World cable car cabins

**Covers** - the ten cable car cabins from around the world (detachable gondolas, a funitel, 3S and bicable cabins, aerial tramways among them a double-decker, a rotating one and an open-top one), the cabin kit they are built on (`CabinSpec`: shell stations, glazing, doors, roof, top deck, the four hanger kinds), their datums and game properties, their LOD, budgets, references and deviations.
**Code** - `generator/cabinKit.ts`, `generator/worldCabins.ts`, `generator/cableCabins.ts` (the shared `shell`, `roundRect`, `bar`, `disc`), `generator/lodAir.ts` (`cabinLod`), `test/worldCabins.test.ts`, `test/worldFleet.test.ts`
**See also** - [cable-cabins.md](cable-cabins.md) (the first three cabins), [world-fleet.md](world-fleet.md) (the fleet's references, data checks and sweep sample), [cable-car-stations.md](cable-car-stations.md), [game-properties.md](game-properties.md), [lod.md](lod.md)

## The designs

All are at their real size (no `scale`), modelled on the photographs in `assets/<references>/`,
whose `SOURCES.md` gives the published figures and marks the estimates. `WORLD_CABINS`
lists them with `CABLE_CABIN_CATALOG` (category `Cable car`, group `cabin`). **The ids are
stored in saved maps: never rename one.** None has an OpenTTD entry (OpenTTD has no cable
cars).

| id | title | size x * y * z (m) | hanger | rope y / ropeFrac | sill y / boardFrac | triangles | LOD |
|---|---|---|---|---|---|---|---|
| `veh-doppelmayr-omega` | Doppelmayr Omega IV | 2.25 x 5.10 x 2.13 | grip | 4.45 / 0.8717 | 0.40 / 0.0784 | 1,044 | 64 |
| `veh-poma-funitel` | Funitel Cabin | 3.10 x 4.20 x 3.63 | funitel | 3.55 / 0.8442 | 0.42 / 0.0999 | 2,168 | 94 |
| `veh-peak-2-peak` | Peak 2 Peak Cabin | 4.16 x 5.95 x 2.72 | carriage | 5.40 / 0.9083 | 0.42 / 0.0706 | 2,308 | 74 |
| `veh-stanserhorn-cabrio` | Stanserhorn Cabrio | 5.66 x 5.14 x 4.94 | side | 4.60 / 0.8941 | 0.45 / 0.0875 | 2,980 | 100 |
| `veh-titlis-rotair` | Titlis Rotair | 6.26 x 7.74 x 6.29 | carriage | 7.20 / 0.9296 | 0.45 / 0.0581 | 3,612 | 92 |
| `veh-vanoise-express` | Vanoise Express | 9.26 x 10.15 x 4.72 | carriage | 9.60 / 0.9463 | 0.50 / 0.0493 | 4,108 | 100 |
| `veh-roosevelt-island-tram` | Roosevelt Island Tramway | 6.86 x 7.95 x 3.52 | carriage | 7.40 / 0.9314 | 0.48 / 0.0604 | 3,704 | 84 |
| `veh-sugarloaf-bondinho` | Sugarloaf Cable Car | 5.46 x 7.14 x 3.42 | carriage | 6.60 / 0.9237 | 0.45 / 0.0630 | 3,584 | 84 |
| `veh-medellin-metrocable` | Medellin Metrocable | 2.15 x 5.00 x 2.08 | grip | 4.35 / 0.8691 | 0.40 / 0.0799 | 1,132 | 80 |
| `veh-ngong-ping-crystal` | Ngong Ping 360 Cabin | 2.66 x 5.45 x 2.49 | carriage (one track rope) | 4.90 / 0.8999 | 0.42 / 0.0771 | 1,604 | 82 |

Parameters (defaults first):

| design | parameter | values |
|---|---|---|
| Doppelmayr Omega IV | `color` (finish) | `red`, `orange` (La Paz), `silver`, `blue`, `green`, `black` |
| Peak 2 Peak Cabin | `variant` | `standard` (red), `glassFloor` (silver, a glass belly: two of the line's 28 cabins) |
| Ngong Ping 360 Cabin | `variant` | `standard`, `crystal` (a glass belly, a lighter blue band) |

The line speed is each design's `maxspeed` in km/h: 22, 25, 27, 29, 36, 43, 29, 36, 18, 25 in
the table's order.

## Axes and datums

As the small gondola's: metres, the rope along **x** (the game's yaw 0), the platform side
**+z**, y up, the cabin's underside at **y 0**. `cabinDatums(spec)` computes the rope and the
sill and the model's top (the grip's running wheels or the carriage's sheave rims, or the top
deck's railing), and the design's `ropeFrac` and `boardFrac` are taken from it, so they cannot
drift from the geometry. `test/worldCabins.test.ts` checks the built model against them: the
underside at 0, the top within 1 cm, a rope piece through the rope height, the sill plates' top
at the sill, the LOD over the same height range, and every variant at the same datums.

## The cabin kit

`buildCabin(spec)` draws three scopes:

- **body** - one lofted shell over rounded-rectangle plan rings (`roundRect`, `hx`, `hz`,
  `corner`; a corner of the full half width makes a round cabin). `stations` give, bottom
  first, the height, the inset from the outer line and the material of the band above; the
  designs build them with `stations()` in `worldCabins.ts`: a rounded belly to the outer line
  at 0.3 m, optional stripes (the rubber bumper, a belt), each glazed deck recessed 3 cm and
  leaning in by `lean`, the body between decks, the roof rounding in by `dome`. A glass
  `bottom` paints the belly glass (the glass-floor variants). The window posts are bars laid on
  the glazing from `glass.y0` to `glass.y1`, following its lean; each door is two jambs, a
  header and the leaves' joint, as bars on the skin, and a steel sill plate whose top is the
  sill, on the platform side (+z) or, with `both`, on both sides.
- **roof** - equipment boxes standing on the roof, and the open top deck (`deck`): posts round
  the edge at `pitch`, a top and a mid rail on every side.
- **hanger** - one of four kinds:

| kind | what it is | ropes |
|---|---|---|
| `grip` | a detachable gondola's plate, arm and collar up to its grip: body, jaws, spring box, carriage, two running wheels | one haul rope at z 0 |
| `funitel` | a frame over the roof, two posts at each rope, two grips on each rope (`gripX` apart) | two haul ropes at z +-`gap`/2 |
| `carriage` | an aerial tramway's, 3S or bicable cabin's: an optional yoke on the roof, a plated arm tapering up to the head, the haul rope clamped under it, a carriage of `sheaves` sheaves on each track rope | two track ropes at z +-`track` (one at z 0 when `track` is 0), the haul rope 0.3 m under them |
| `side` | an open-top cabin's: a bracket on each side at `attach`, a post up beside the cabin to a carriage | one track rope each side, at z +-`track` |

Every rope is drawn as a short piece of rubber cylinder through the grips or sheaves, as on the
first three cabins. Budget: the cabins' 8,000 triangles; the largest, the Vanoise Express, has
about 4,100.

## LOD

`buildCabinLod(spec)` feeds `cabinLod` ([lod.md](lod.md)) from the same spec: the shell as plan
rings at the belly, the belly's top, the glazing's top and the roof (and every band edge),
painted in runs of one material with the glazing in the one LOD glass; the hanger and its
running gear as coarse blocks and bars up to the full model's top; the top deck's railing as an
optional part. It fits the 100-triangle budget by dropping optional parts, then ring detail.

## References and deviations

One folder per design (`assets/<references>/`), two or three Commons photographs each, fetched
with `pnpm refs:fetch` ([world-fleet.md](world-fleet.md)). No cabin's dimensions are published
in its sources, so plans and heights are read off the photographs against doors and passengers
and marked approx. in each `SOURCES.md`; the hanger heights in particular are estimates.

- The Vanoise Express photographs show the cabins only from far: its two-deck layout and size
  follow the published capacity.
- The Sugarloaf cabin follows the photographed current glass cabins (2008, approx.), not the
  1972 generation the list first named.
- The Rotair's turning floor is not a part: the game has no clip for it yet.
- Hangers are drawn straight and centred; several real ones are offset or curved (the Peak 2
  Peak's, the Omega's), and the Roosevelt Island cabins' A-frame is a tapered plate.
- The glass is opaque tinted glass, as everywhere in the factory.

## Checking

`pnpm exec vitest run test/worldCabins.test.ts test/worldFleet.test.ts`, and the catalog sweep
for the sampled cabins (`pnpm exec vitest run catalog -t "omega|funitel|peak-2|cabrio|rotair|vanoise|ngong"`).
Render with `generator/contactSheet.ts` (`--variants` for the parameters).
