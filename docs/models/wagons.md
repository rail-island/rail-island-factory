# Freight wagons

**Covers** - the five freight wagons transferred from vlakosimdb (Nas, Ua, Eas, Raj, Rah), the `cargo` parameter of the first three, the shared wagon parts, the native-raster comparison and the tests.
**Code** - `generator/wagons.ts`, `generator/wagonParts.ts`, `generator/wagonTransfers.ts`, `generator/coachTransfers.ts` (`ALL_TRANSFERS`), `generator/csdCoachComparison.ts`, `generator/csdCoachReport.ts`, `generator/strokeFont.ts`, `test/wagons.test.ts`
**See also** - [freight-wagons.md](freight-wagons.md) (the container, flat, sliding-wall and hopper wagons that build on these parts), [vehicles.md](vehicles.md), [parameters.md](parameters.md), [csd-coaches.md](csd-coaches.md) (the comparison method), the sources under `assets/wagon-<name>/` (`SOURCES.md`, `COMPARISON*.md`)

## The designs

Thirteen vlakosimdb wagons (`db/train/truck/`) become five designs. A vehicle
that differs from another only by its load is a value of the `cargo` parameter
(default `empty`), not a separate model ([parameters.md](parameters.md)).

| id | vlakosimdb | `cargo` | over buffers | triangles |
|---|---|---|---|---|
| `veh-nas-flat-wagon` | `n_nas`, `n_nas-full#1..#3` | `empty`, `wood` (logs), `tubes`, `reels` (cable reels) | 20.9 m | 4,300 to 6,400 |
| `veh-ua-open-wagon` | `n_ua-empty`, `n_ua#1` (coal), `n_ua#2` (wood), `n_ua#3` (sand) | `empty`, `coal`, `wood`, `sand` | 13.5 m | 4,000 to 5,300 |
| `veh-eas-open-wagon` | `n_eas`, `n_eas-drevo` (wood), `n_eas-uhlo` (coal) | `empty`, `wood`, `coal` | 13.9 m | 4,000 to 10,300 |
| `veh-raj-hopper-wagon` | `n_raj` | - | 14.4 m | 4,200 |
| `veh-rah-tank-wagon` | `n_rah#1` | - | 12.6 m | 4,400 |

The webapp shows these vlakosimdb vehicles as `train-truck-n-nas-2`,
`-n-nas-full-1..3`, `-n-ua-1..3`, `-n-ua-empty`, `-n-eas`, `-n-eas-drevo`,
`-n-eas-uhlo`, `-n-raj-2` and `-n-rah-1-2`: the underscore folders, not the
older hyphenated duplicates (`n-nas`, `n-raj`, `n-rah#1`). `n_nas-full#4` (a
CKD T6 tram as the load) and `n_uaaikk` were not transferred.

All are rigid, one GLB node, `category: "Rail vehicles"`, `group: "wagon"`
(`WAGON_CATALOG`). They fit the 3.1 m by 4.7 m envelope; the Raj's hopper lids
are the highest point at 4.56 m.

## Source and coordinates

Every wagon is a JT7 `simplemodel`: the body is the intersection of `alongx`
(section), `alongy` (plan) and `alongz` (elevation) clip polygons, and the
colorizes map the BMPs at 0.1 m a pixel with the side canvas starting at source
x = 0 (`z_both` 21 x 3 m for the Nas, 14 x 4 m for the Ua, `z_dec`/`z_inc`
14.2 x 4 m for the Eas, 15 x 5 m for the Raj and the Rah; ends 3 m wide).
`z_dec` paints the +z (right) side. The model is (source x - centre, y, z), the
centre midway between the buffer heads. Loads are XML too: Nas inlines
(`wood`, `tube`, `reel` sub-models placed by `tx/ty/tz` and scales), Ua `load`
clip shapes, Eas extra polygons; the Raj hoppers and the Rah tank are `rotate`
shapes (a profile turned 10 and 15 times).

## Builders

`wagonParts.ts` holds `Wagon`, a `Coach` (`csdCoachParts.ts`) with the wagon
palette and helpers in source coordinates: `box`/`sideBox`, a Y25-style
`freightBogie` (920 mm wheelsets, axle boxes, side frames, spring nests, bolster,
brake blocks), `drawGear` (buffer beam, the coaches' 1.75 m buffers and screw
coupling), `logX`/`logZ` (logs with light cut ends), `tube` (a hollow tube),
`heap` (a bulk load's height field) and `letters` (stroke-font lettering).
`wagons.ts` builds the five designs:

- **Nas**: deck with plank gaps every 0.4 m (native `y_dec`), 0.5 m drop sides,
  solebar and fishbelly, eight stakes per side and end walls with corner posts.
  `wood` is a five-layer pile of 25 logs, `tubes` five 0.9 m steel tubes, `reels`
  six 2 m cable reels standing across the wagon.
- **Ua**: 0.2 m walls, lighter rim and painted stanchions, two doors per side
  with seams and J-shaped locking bars, end posts, a red handbrake box and
  underframe equipment. `coal` and `sand` are height fields of the XML `load`
  hull above the rim; `wood` two layers of logs under four steel straps.
- **Eas**: the 13 XML side stanchions, grey two-leaf door frames, end posts and
  rails, a black data panel, label and running number at diagonally opposite
  ends. `wood` is fifteen bundles of five logs laid across, `coal` a height field
  with four mounds.
- **Raj**: the red sloped frame (a frustum between the XML alongx and alongz
  trapezoids), four 10-sided hoppers on the XML rotation profile with grey lids,
  two platforms with gratings, ladders and handrails, and the brake platform.
- **Rah**: a 16-sided tank (the XML profile: 0.95 m radius about y = 2.45 m, coned
  ends), the orange band painted on every facet it crosses, "CPAVEX" (C with a
  caron) laid on the shell's facets, dome and walkway handrail, side ladders,
  black data boards and the +x brake platform's railing.

Running numbers are 12-digit UIC numbers with a valid check digit
(`WAGON_NUMBERS`); where the native digits do not verify, the check digit was
corrected, and where they are not legible the number is illustrative (see each
`SOURCES.md`). The stroke font gained the capitals A, E, I, P, R, V and X for
"RIV" and "CPAVEX".

## Deliberate deviations

- Buffers use the standard 1.75 m spacing and 0.44 m heads like the coaches; the
  BMPs paint 0.5 to 0.6 m dark boxes nearer 2 m apart.
- Wheels are 920 mm (`WAGON_WHEEL_R`) at the axle positions of the source
  geometry, and the bogies are generic Y25 shapes, not the low-poly XML clips.
- Where a BMP and the XML disagree, the XML geometry wins (Raj frame ends, Rah
  railing post, Nas drop-side top) and the landmark says so; the Raj handrails
  follow the BMP, 0.05 m above the XML.
- The material bitmaps the loads use (`wood017`, `metal005`, ...) do not ship with
  vlakosimdb, so load colours are chosen: bark browns with light cut ends,
  steel grey tubes, brown reels with dark cable, black coal, grey sand.

## Measured comparison

`WAGON_TRANSFERS` lists the thirteen vehicles; `ALL_TRANSFERS` in
`coachTransfers.ts` adds them to the coaches' comparison, so
`pnpm exec tsx generator/csdCoachReport.ts n_eas` (any keys) rewrites the
`COMPARISON*.md` beside each wagon's sources and the annotated review views
under `export/review/<key>/`. Each `assets/wagon-<name>/native/<key>/` holds the
unchanged `vehicle.xml`, model `index.xml`, BMPs (and inline sub-models), the
`landmarks.json` native pixel boxes and `baseline.json`, the first authored
geometry's measurement. Loads that the base canvas does not paint (Nas inlines,
Ua `load` hulls) are annotated from their XML bounds and marked so.

| vehicle | boxes | baseline MAE (pp) | final MAE (pp) |
|---|---:|---:|---:|
| Nas / + Wood / + Tubes / + Reels | 19 / 20 / 20 / 20 | 0.045 / 0.158 / 0.079 / 0.045 | 0.045 / 0.158 / 0.079 / 0.045 |
| Ua Empty / Coal / Wood / + Sand | 41 / 42 / 46 / 42 | 0.386 / 0.382 / 0.383 / 0.382 | 0.386 / 0.382 / 0.383 / 0.382 |
| Eas / Eas-drevo / Eas-uhli | 40 / 42 / 40 | 0.312 / 0.368 / 0.312 | 0.300 / 0.328 / 0.300 |
| Raj | 18 | 0.484 | 0.484 |
| Rah#1 | 22 | 0.508 | 0.326 |

## Tests

`test/wagons.test.ts` checks the registration, ids and cargo values, every
landmark within its pixel tolerance, length over buffers, axle positions, gauge
and wheels on the rail, that each variant carries exactly its own load up to its
XML height, that the default build is the empty wagon, the running numbers'
check digits, the lettering on both sides (the Rah's caron reads correctly from
outside and its letters lie on the shell), and the Raj hoppers' rotation
profile. `test/params.test.ts` and `test/models.test.ts` cover every cargo's
determinism, flicker, envelope, budget and JS model.
