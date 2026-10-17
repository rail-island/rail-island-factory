# Small and shunting diesels from vlakosimdb

**Covers** - `veh-cd-704` (CD 704 / CSD T 234.0), `veh-cd-710` (CD 710 Rosnicka), `veh-cd-714` (CD 714), `veh-cd-742` (CD 740 / 742 / 743), `veh-db-212` (DB V 100 / 212) and `veh-muv-69` (MUV 69): what each design covers, the shared kit (boxes with tables by height, windows, grilles, railings, striped beams, rigid axles with rods), the native comparison, the deviations, what was left out and the tests.
**Code** - `generator/smallDiesels.ts` (`SMALL_DIESELS`), `generator/smallDieselKit.ts`, `generator/cd704.ts`, `generator/cd710.ts`, `generator/cd714.ts`, `generator/cd742.ts`, `generator/db212.ts`, `generator/muv69.ts`, `generator/smallDieselComparison.ts`, `generator/smallDieselReport.ts`, `test/smallDiesels.test.ts`, `assets/cd-704/`, `assets/cd-710/`, `assets/cd-714/`, `assets/cd-742/`, `assets/db-212/`, `assets/muv-69/`
**See also** - [vehicles.md](vehicles.md), [parameters.md](parameters.md), [cz-electrics.md](cz-electrics.md) (the shell and panel kit these build on), [the railroad-vehicle skill](../../.agents/skills/railroad-vehicle/SKILL.md), [the vlakosimdb-transfer skill](../../.agents/skills/vlakosimdb-transfer/SKILL.md)

## The designs

All six are rigid rail vehicles in `RAIL_CATALOG` (group `loco`), registered as
one family in `generate.ts` (`smallDiesels.ts`, which also exports their build
functions for the JS models).

| id | parameter value | vlakosimdb model | number | look |
|---|---|---|---|---|
| `veh-cd-704` | `livery` `cd704` (default) | `cd_704` | 704 014-0 | dark blue, yellow band, grey frame |
| | `t2380` | `csd_t238_0` | 704 518-0 | the same paint: the folder shares every BMP with cd_704 (the industrial T 238.0, later 704.5) |
| `veh-cd-710` | - | `cd_710.620-6` | 710 620-6 | red, yellow band, red and white striped buffer beams, rods |
| `veh-cd-714` | - | `cd_714` | 714 017-1 | blue hood, red cab, red hood ends with the white V |
| `veh-cd-742` | `variant` `viamont742` (default) | `viamont_742.507` | 742 507-7 | Viamont yellow and black |
| | `viamont740` | `viamont_740.627` | 740 627-5 | the same, with the 740's low, 2.3 m wide short hood |
| | `cd743` | `cd_743_002` | 743 002-8 | dark and light blue over white, the red line, a white diagonal stripe |
| `veh-db-212` | `livery` `oldRed` (default) | `db_212` | 212 325-5 | old red, cream lines |
| | `oceanBlue` | `db_212bb` | 212 364-4 | ocean blue, beige lines |
| | `trafficRed` | `db_212nr` | 212 376-8 | traffic red, white lines |
| `veh-muv-69` | - | `muv_69` | none | red and cream cab, black frame, empty deck |

| id | over buffers | running gear | wheels | height | triangles |
|---|---|---|---|---|---|
| `veh-cd-704` | 7.50 m | two axles, 3.20 m | 1.00 m | 3.72 m (horn) | 5,300 to 5,400 |
| `veh-cd-710` | 9.44 m | three rod-coupled axles, 2.2 + 2.0 m | 1.00 m | 3.78 m | 6,500 |
| `veh-cd-714` | 14.24 m | Bo'Bo', pivots 7.60 m, bogies 2.40 m | 1.00 m | 4.40 m (stack) | 8,900 |
| `veh-cd-742` | 13.60 m | Bo'Bo', pivots 6.70 m, bogies 2.40 m | 1.00 m | 4.48 m | 9,500 to 9,700 |
| `veh-db-212` | 12.30 m | B'B', pivots 6.00 m, bogies 2.20 m | 0.95 m | 4.30 m | 8,800 to 8,900 |
| `veh-muv-69` | 6.76 m (couplers) | two axles, 3.73 m | 0.56 m | 3.10 m (beacon) | 3,700 |

Dimensions are the published ones (atlaslokomotiv.net, cs.wikipedia,
de.wikipedia; each folder's `SOURCES.md`). Where a native body disagrees, the
mapping says how: the 742's heights above the deck are scaled to the published
height, the MUV 69's to the photographs.

## The kit (`smallDieselKit.ts`)

It builds on [cz-electrics.md](cz-electrics.md)'s `shell`, `surfacePanel`,
`bogie` and `buffers`:

- **`boxSpec`** turns a box -- a hood, a cab -- into a lofted shell: a straight
  plan with chamfered corners whose half width (`hw`) and end setback
  (`inset`) follow tables by height. `rolled` gives a hood top rolled in two
  steps; a cab's tables lean its walls in or rake its ends. `ends` drops the
  end hidden in the cab; `corner` decides whether the chamfers take the side's
  or the end's paint.
- **`pane`** (frame and glass), **`plate`**, **`grille`** (a rim, the dark
  louvre and its slats, upright or across) lay outlines on a box's surface
  (`onSide`, `onEnd`) or a flat wall (`wallAt`, `faceAt`), cut where the
  surface kinks; `numberText` writes a running number in any colour.
- **`tubeSeg`**, **`tubeRun`**, **`railing`** (posts, top and middle rails):
  handrails and deck railings; **`steps`**: treads with stringers.
- **`hazardBeam`**: a buffer beam or plough painted with diagonal stripes
  falling to the middle (the 710's red and white, the 742's black and yellow).
- **`headlamp`**: a round lamp, rim and lens, on an end face.
- **`axleGear`**: rigid wheelsets in a plate frame for the two- and three-axle
  shunters: wheels as the bogies draw them (treads at |z| 0.665..0.8 m),
  axle boxes with leaf springs and horn guides, the frame plates dipping
  between the axles; optional cranks and coupling rods outside (the 710).

## The bodies

- **CD 704**: the deck, a 2.0 m hood over the whole frame, the 2.8 m cab with
  its flared, overhanging roof (the XML cab clips), three side windows (the
  middle one the door's), two front and two rear windows, louvred hood doors,
  the hood-end grille with white over red lamps, a buffer beam with the yellow
  stripe, two axles with leaf springs.
- **CD 710**: the hood arched on top with ends leaning back, the arched cab
  with the grey sun roof over it, the tall door window, louvres above the
  band, the big top lamp and two low lamps, the deep striped buffer beams,
  three axles with cranks and coupling rods.
- **CD 714**: the long and short blue hoods with rows of tall grilles, the
  red cab with three windows and the flared roof, the stack beside it, the red
  ends with the white V, the grille and the lamps, the frame plate, the fuel
  tank, two bogies.
- **CD 740 / 742 / 743**: the tall hoods nearly as high as the cab, the cab
  narrowing over the windows, three tall side windows, the big top lamp and the
  corner lamps, the grille, the striped plough, the fuel tank, two bogies. The
  740's short hood is low and wider; the 743 paints its own scheme on the same
  body.
- **DB V 100 / 212**: the centre cab off the middle with the leaning window
  band and the flared roof, hoods with rolled tops and doors with louvres, the
  radiator grille on each hood end, the lamps, the light lines along the hoods
  and the frame, two B'B' bogies, the tanks between them.
- **MUV 69**: the cab with the raked windscreen, red under cream, roof lamps
  and the yellow beacon, the black frame with stake pockets and the loading
  deck, two small axles, buffers.

## Comparison

`smallDieselComparison.ts` measures the default build of each design (actual
GLB vertices of named scopes, orthographically projected) against 11 to 18
boxes per design annotated on the native BMPs
(`assets/<folder>/native/landmarks.json`): the end at +X seen from ahead, and
the side the native side texture is painted on (+Z; -Z for the 742 and the
MUV 69, whose source x is flipped). `pnpm exec tsx
generator/smallDieselReport.ts` writes each folder's `COMPARISON.md` and
review views and overlays into `export/review/<id>/`; `--views <id> <dir>
[k=v]` renders any combination. The first complete run against the final
annotations recorded `native/baseline.json`. Mean absolute errors at this
revision: 704 0.33, 710 0.49, 714 0.31, 742 0.37, 212 0.24, MUV 69 0.47
percentage points; every box is within its stated tolerance.

## Deviations

- Published dimensions over native ones where they differ: wheelbases and
  pivots (704, 710, 714, 742, 212), the 710's longer buffers.
- Not modelled: the 742's large "Viamont" lettering, the ocean blue 212's
  beige hood-end edges, the 212's lower hood-end step (XML), the MUV 69's
  crane, cab interiors, cables and hoses. Each folder's `SOURCES.md` lists its
  own.

## Left out

`cd_704 red` is archived in the game (`rail-island-webapp/db/archived.json`)
and was not converted.

## Tests

`test/smallDiesels.test.ts`: the ids, parameters and defaults; for every
parameter combination the length over the buffers, the axle positions, wheel
contact and gauge, the height, the 3.1 m width and the triangle budget; every
native landmark within its tolerance; valid running numbers; the 740's low,
wide short hood and the 710's coupling rods. The catalog sweep (`test/catalogSweep.ts`)
covers the designs with the others (determinism,
flicker, the JS model).
