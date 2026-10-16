# Freight wagons: container, flat, sliding-wall and hopper

**Covers** - the seven freight wagons transferred from vlakosimdb after the first five (Sqns, Pao, Habis, Hadgs, Faccs, Falls, Wap), their `cargo` and `livery` parameters, the JT7 clip solid, the shared parts, the native-raster comparison and the tests.
**Code** - `generator/freightWagons.ts`, `generator/hopperWagons.ts`, `generator/freightWagonParts.ts`, `generator/freightTransfers.ts`, `generator/coachTransfers.ts` (`ALL_TRANSFERS`), `generator/strokeFont.ts`, `test/freightWagons.test.ts`
**See also** - [wagons.md](wagons.md) (the first five wagons, the `Wagon` builder and the comparison method), [vehicles.md](vehicles.md), [parameters.md](parameters.md), the sources under `assets/wagon-<name>/` (`SOURCES.md`, `PHOTOS.md`, `COMPARISON*.md`)

## The designs

Twelve vlakosimdb wagons (`db/train/truck/`) become seven designs. A wagon that
differs from another only by its load is a value of `cargo`; one that differs
only by its paint is a value of `livery` ([parameters.md](parameters.md)).
The vlakosimdb wagons the game has archived are not transferred (below).

| id | vlakosimdb | parameter | over buffers | triangles |
|---|---|---|---|---|
| `veh-sqns-container-wagon` | `n_sqns`, `n_sqns-full#1` | `cargo`: `empty` (default), `maersk` (a Maersk 40 ft box) | 19.8 m | 3,500 / 5,100 |
| `veh-pao-flat-wagon` | `n_pao-full#1`, `n_pao-full#2` | `cargo`: `tubes` (default), `karosaB951` (a Karosa B 951 bus) | 15.3 m | 5,100 / 4,800 |
| `veh-habis-sliding-wall-wagon` | `n_habis_tw1`, `n_habis_tw2` | `livery`: `tw1` (default, grey), `tw2` (weathered brown) | 23.2 m | 4,100 |
| `veh-hadgs-hopper-wagon` | `n_hadgs` | - | 16.8 m | 4,000 |
| `veh-faccs-hopper-wagon` | `n_faccs`, `viamont_faccs` | `livery`: `cd` (default), `viamont` | 12.8 m | 3,900 / 4,000 |
| `veh-falls-hopper-wagon` | `n_falls`, `sd_falls`, `viamont_falls` | `livery`: `cd` (default), `sd`, `viamont` | 13.5 m | 3,700 to 3,900 |
| `veh-wap-hopper-wagon` | `n_wap-full#2` | - (loaded) | 13.5 m | 3,800 |

The Sqns and the Pao keep their load variants as `cargo` (the Sqns in its own
two vlakosimdb folders; the Pao's empty folder is archived, so its default is the
tube load). The Habis, Faccs and Falls variants repaint one geometry (the XML
files of each family are identical but for their colorizes), hence `livery`.
The Wap is the older CSD name of the Falls type, but vlakosimdb models it as a
different body, so it stays its own design.

All are rigid, one GLB node, `category: "Rail vehicles"`, `group: "wagon"`
(`WAGON_CATALOG`, wagons.ts), registered by one `FAMILIES` line in
`generate.ts` (source `freightWagons.ts`, which re-exports the hopper builders
for the JS models). They fit the 3.1 m by 4.7 m envelope; the Pao's bus roof box
is the highest point at 4.56 m.

### Not transferred

The game's `db/archived.json` (rail-island-webapp) lists vlakosimdb wagons it no
longer offers; they are left out: `n-sqs` and `n_sqs-full#1..#7`, `n-pao` and
`n_pao` (both are `train-truck-n-pao`), `n-ra#1..#3`, `n-zaz`, `n_zaz`, `n_zts`,
`n_zts_orlen`, `n_ztsc`, `n_ztsc_post`, `n_wap`, `n_wap-full#1`,
`n_wap-full#3`, `n-wap` and `n_habbilns`.

## Source and coordinates

Every wagon is a JT7 `simplemodel`: each shape is the intersection of an `alongx`
section, an `alongy` plan and an `alongz` elevation clip polygon, and the
colorizes map the BMPs at 0.1 m a pixel with the side canvas from source x = 0.
The model is (source x - centre, y, z), the centre midway between the buffer
heads. The six colorize directions are -x, +x, -y, +y, -z, +z: the BMP on the
sixth paints the +z (right) side, which is `z_dec` in most folders but `z_inc`
in the two Viamont ones (their side BMPs are swapped, so VIAMONT still reads
correctly); `x_dec` paints the x = 0 end, `x_inc` the other.

## Builders

`freightWagonParts.ts` holds what the seven share, on the wagons' `Wagon`
(wagonParts.ts: boxes in source coordinates, the Y25-style `freightBogie`,
`drawGear` with standard buffers and screw coupling, `letters`, `heap`):

- `clipSolid` / `clipSolidFaces` - the JT7 clip solid: a box cut by the half
  planes of each convex view polygon, faces as outward loops; a `keep` filter
  drops faces another part covers (the open top over a load, the seam between
  two pieces). A concave view throws: the caller splits it into convex pieces
  (the Faccs elevation flares outward and is two pieces split at 2.1 m; the
  Habis end frame is a trapezoid under a rectangle).
- `surfaceStrip` - a painted strip laid on the facets of a section (the Faccs
  stiffeners on its sloped hopper); `boldText` - stroke-font capitals with a
  chosen stroke, reading from outside; `maerskStar` - the light blue square with
  a seven-pointed star; `container40` - an ISO 40 ft box with corrugated sides,
  corner posts and castings, end ribs and the door end's locking bars;
  `karosaB951` - the low-poly bus.
- `FREIGHT_NUMBERS` - the running numbers, 12-digit UIC numbers with valid check
  digits (from photographs where legible), and `numberLines`.

`freightWagons.ts` builds the Sqns (side beams, fishbelly, cross members, the
yellow container pins and handbrake wheel), the Pao (planked deck, fishbelly
frame, stake pockets; tubes on two timber bolsters, or the bus chocked on the
deck), the Habis (two sliding walls per side with posts and rails, the light
roof, the end frames, the TRANSWAGGON plate, label board and data panel) and the
Hadgs (body and curved roof, the two sliding doors with stiffeners and inverted-V
braces on their rails, posts, X-braced ends, roof hatches). `hopperWagons.ts`
builds the Faccs (the hopper over the frame, discharge chutes, end frames,
braces and steps, a ballast top), the Falls (two lower halves, the centre post,
the overhanging upper bulge, the brake platform with ladder and railing, a coal
top) and the Wap (lower body with side flaps, upper bulge, the platform at the
-x end, gravel heaped to the XML `load` hull).

A bulk load fills an open top: the body is drawn without its top face and a
height field spans the top opening, its edges on the rim.

## Deliberate deviations

- The Maersk box is an ISO 40 ft container (12.192 x 2.438 x 2.591 m) on the
  pins at 1.3 m, not the XML clip (11.9 x 2.6 x 2.6 m).
- The Hadgs is 3.09 m over its doors, not the XML 3.2 m: the rail envelope is 3.1 m.
- Buffers use the standard 1.75 m spacing and heads, wheels are 920 mm, bogies
  the generic Y25 shapes at the XML axle positions ([wagons.md](wagons.md)).
- Stroke-font capitals stand in for mixed-case painted words (Viamont) and the
  bold painted MAERSK; logos are simplified (the SD triangle, the Maersk star).
- Load and paint colours are chosen from the native BMPs; the material bitmaps
  the XML names (`metal005`, ...) do not ship with vlakosimdb.

## Measured comparison

`FREIGHT_TRANSFERS` (freightTransfers.ts) lists the compared vehicles - the
default of every design and both Sqns and Pao loads - and `ALL_TRANSFERS` in
`coachTransfers.ts` adds them to the coaches' and wagons' comparison, so
`pnpm exec tsx generator/csdCoachReport.ts n_sqns n_pao-full_2` (any keys)
rewrites the `COMPARISON*.md` beside each wagon's sources and the review views
under `export/review/<key>/`. The other liveries share their default's geometry
and are not measured apart. The bus's boxes come from its inline BMPs moved by
the inline placement onto the wagon canvas (rows above the canvas are negative).

| vehicle | boxes | final MAE (pp) |
|---|---:|---:|
| Sqns / Sqns + Maersk | 20 / 13 | 0.292 / 0.653 |
| Pao + Tubes / Pao + Karosa B951 | 12 / 22 | 0.476 / 0.647 |
| Habis Transwaggon 1 | 12 | 0.042 |
| Hadgs | 16 | 0.306 |
| N_Faccs | 18 | 0.086 |
| N_Falls | 10 | 0.017 |
| Wap - full#2 | 8 | 0.067 |

The annotations were measured once the geometry had been laid out from the XML
and the BMP columns, so each `baseline.json` equals the final measurement. The
largest residuals are the deliberate ones: the ISO container (up to 3.5 px),
the bus's 11.8 m body against the painted 11.9 m and its 1 m wheels against
1.1 m.

## Tests

`test/freightWagons.test.ts` checks the registration (ids, `WAGON_CATALOG`, the
JS source module, the reference folders, parameter values and defaults), every
landmark within its pixel tolerance, every parameter combination inside the
rail envelope, under 8,000 triangles and free of coplanar faces, length over
buffers, axle positions and wheels on the rail for every combination, the loads
(the empty Sqns carries nothing, the ISO box sits on the pins, the tubes stay
under the XML hull, the bus stands on the deck where the inline puts it), that
a livery changes only paint, the running numbers' check digits on both sides,
MAERSK and TRANSWAGGON reading from outside, and that the clip solid refuses a
concave view. `test/models.test.ts` and `test/params.test.ts` cover every
design's determinism, source tree, JS model and parameters.
