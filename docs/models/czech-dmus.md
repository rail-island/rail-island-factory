# Czech diesel railcars

**Covers** - the five Czech diesel railcar designs transferred from vlakosimdb: `veh-cd-810` (CD 810 / 812 / 912), `veh-cd-843` (CD 843 / 943 / 043), `veh-csd-m131` (CSD M 131.1 Hurvinek and its trailer), `veh-csd-m240` (CSD M 240.0) and `veh-csd-m296` (CSD M 296.1 / CD 853 / 854): what each parameter value builds, the railcar kit, the scales to the published dimensions, the measured comparison and the tests.
**Code** - `generator/czDmus.ts` (the family), `generator/dmuKit.ts`, `generator/dmu810.ts`, `generator/dmu843.ts`, `generator/dmuM131.ts`, `generator/dmuM240.ts`, `generator/dmuM296.ts`, `generator/dmuComparison.ts`, `generator/dmuReport.ts`, `generator/csdCoachParts.ts` (the coach builder), `test/czechDmus.test.ts`, `assets/cd-810/`, `assets/cd-843/`, `assets/csd-m131/`, `assets/csd-m240/`, `assets/csd-m296/`
**See also** - [vehicles.md](vehicles.md), [parameters.md](parameters.md), [czech-emus.md](czech-emus.md) (the electric units and the same body builder), [csd-coaches.md](csd-coaches.md) (the coach builder and the comparison method), the source notes of [CD 810](../../assets/cd-810/SOURCES.md), [CD 843](../../assets/cd-843/SOURCES.md), [M 131.1](../../assets/csd-m131/SOURCES.md), [M 240.0](../../assets/csd-m240/SOURCES.md), [M 296.1](../../assets/csd-m296/SOURCES.md)

## The designs

One design per body; the vehicles that share a body are values of a parameter.
Every car is built on its own, facing +X - a single-cab car with its cab at +X -
centred between its buffer faces, so the cars of a set couple in any order.

| design | parameter | value | vlakosimdb (db/train/dmu/...) | vehicle |
|---|---|---|---|---|
| `veh-cd-810` "CD 810 / 812 / 912" | `variant` | `cd810` (default) | cd_810#1..#4 | the two-axle railcar (CSD M 152.0) |
| | | `cd812` | 812/cd_812.613 | the 812 "Esmeralda", the one 810 rebuilt in 2001 with new ends |
| | | `cd912` | 812/cd_912.001 | its driving trailer (Bfbdtanx 792), with the low centre door |
| | `livery` | `red` (default) | cd_810#1 | red with a cream window band |
| | | `yellowBand` | cd_810#2 | red with the yellow band (810 225-3) |
| | | `blueWhite` | cd_810#3 | blue and white, yellow end corners |
| | | `ivoryBand` | cd_810#4 | red with an ivory band |
| `veh-cd-843` "CD 843 / 943 / 043" | `unit` | `motorCar` (default) | cd_843 | the 843 motor car, a cab at each end |
| | | `drivingTrailer` | 843/cd_943 | the 943 driving trailer, cab at +X, gangway at -X |
| | | `trailer` | 843/cd_btn753-043 | the 043 trailer, gangways at both ends |
| `veh-csd-m131` "CSD M 131.1 Hurvinek" | `unit` | `motorCar` (default) | m131/csd_m131 | the Tatra two-axle railcar |
| | | `trailer` | m131/csd_m031 | vlakosimdb's "M 031" trailer, the same body without the engine, radiator and exhausts |
| `veh-csd-m240` "CSD M 240.0 Singrovka" | - | - | csd_m240 | the bogie railcar with a cab at each end |
| `veh-csd-m296` "CSD M 296.1 / CD 853 / 854" | `variant` | `m296` (default) | csd_m296 | the express railcar in its CSD paint |
| | | `cd853` | csd_853 | the same car renumbered 853 (vlakosimdb paints it in the same scheme) |
| | | `cd854` | cd_854 | the rebuilt 854: its own window layout and the CD red and cream |

Choices:

- **810, 812 and 912 are one design.** vlakosimdb's 812 and 912 share one XML
  (rounded ends, 14 m body) and the 812 is a rebuilt 810; the variant changes the
  body and keeps the running gear. `livery` names the four vlakosimdb 810 paints
  and is ignored by the 812 and 912, which have one paint. The title is not
  "Regionova": that is the 814 / 914, which vlakosimdb does not carry here.
  db/train/dmu/810/* (the archived 810 and its trailers) is out of scope.
- **The 843 family is one design**, its cars the `unit` values. The motor car
  comes from cd_843 (24.1 m, the only motor car in the database; dmu/843 holds just
  the 943 and the 043). The 943 and the 043 are drawn only 19.3 and 19.4 m long in
  vlakosimdb; their layouts are stretched along x to the 843's 24.1 m body, the
  real cars' common length. All three take the 943's detailed XML section (the
  843's own is a plain chamfered box), its roof raised to the 4.0 m roof line every
  native side view draws.
- **The M 296.1, 853 and 854 are one design.** The 853 is the renumbered M 296.1:
  vlakosimdb's side BMP repeats the M 296's layout six columns to the left, so
  `cd853` changes only the shades and the number. The 854 is the same body with
  its own windows and paint. vlakosimdb's 853 and 854 XML is a plain box of the
  same size; all three take the M 296's XML shapes.
- **The M 031 is a `unit` of the Hurvinek,** as the steam locomotives' tenders are.

| design, car | over the buffers | triangles |
|---|---|---|
| CD 810 (each livery) | 13.97 m | about 4,000 to 4,300 |
| CD 812, 912 | 14.47 m | about 4,700 and 4,500 |
| CD 843, 943, 043 | 25.20 m | about 6,300, 5,600 and 5,100 |
| CSD M 131.1, M 031 | 12.10 m | about 4,000 and 3,900 |
| CSD M 240.0 | 18.50 m | about 6,400 |
| CSD M 296.1, 853, 854 | 24.79 m | about 6,100 to 6,300 |

## The railcar kit (`dmuKit.ts`)

- `Car`: the coach builder (`Coach`, csdCoachParts.ts) with a frame: scales from
  the XML's metres to the model (`kx` along, `ky` up, `kz` across), the source x of
  the car's centre and the heights of the side and front canvases (all 0.1 m a
  pixel). `side()` and `front()` turn native pixel boxes into coach boxes,
  `project()` turns model points back into native pixels for the comparison.
- `loft()`: `Coach.volume` with one change - where the elevation clips a paint
  band away at a station (a band above a sloping nose), the band's 2 mm sliver
  stays inside the body instead of floating at the band's own height. The coach
  builder itself is unchanged, so no existing GLB changes.
- `sideItems()` / `endItems()`: windows, doors, flat panels and lamps from pixel
  boxes, each a named scope; end items are laid shallow enough that no face meets
  the end cap's own slab.
- `sideEmblem()`, `sideNumber()`, `buffersBoth()`, `underBoxes()`, `tankX()`,
  `exhaust()` and the catalog fields `DMU_CATALOG` (rail vehicles, group `unit`, traction `diesel`).
  The single-arm pantograph and the centre coupler of the electric units are not
  needed; `tractionNumber()` and `enumParam()` are re-exported from `emuParts.ts`.

## CD 810 / 812 / 912

The 810's body is the XML section (walls to 3.0 m, roof to 3.3 m), the plan's
end chamfers (eased from 1.0 to 1.25 m half width so the windscreens stay on the
body) and the elevation: the floor at 0.8 m drops to 0.45 m at the door steps,
the windscreens rake back 0.1 m from 2.0 to 2.9 m under a separate visor in the
window band's colour, as the XML's second roof clip draws it. The windscreen
panes lie on the raked plane (`slopePanel`); the twin lamps on the front band,
the top lamp on the visor. Lengths are scaled by 13.103 / 12.5 to the published
body (13.97 m over the buffers); the axles stand 8.0 m apart (published) on
840 mm wheels with leaf springs. Paint is horizontal bands per livery, the red
livery's yellow front band and the blue-white's yellow end corners as panels.

The 812 / 912 body follows its XML: the rounded nose (half width 0.5 m at the
tip, 1.3 m 0.1 m back), the roof rounding into the nose from 2.6 m and the aprons
down to 0.25 m; lengths scaled to the published 14.47 m over the buffers. The
windscreen lies on two planes up the nose; the light grey mask, the lamps and the
yellow apron edge are end panels; the green sweeps down over the white band at
the ends in steps. The 912 has the low windows and the double centre door its BMP
draws, and no roof equipment.

## CD 843 / 943 / 043

The 943's section with the raised roof, the plan's 0.1 m corner chamfers and, at
a cab end, the roof rounding down to 3.55 m over the last 0.6 m (the 843 XML
rounds 0.8 m from 3.5 m). Bands: red, the cream band 1.0 to 1.6 m, red, the grey
roof from 3.2 m. The cab front (843_x_both; the 943's x_inc is the same 10 rows
lower) carries the two windows, the door with its window, the dark red lines and
the lamps; the gangway end (943 x_dec) its door with two windows. The cab ends
get the deep apron with a yellow edge the photographs show. Bogies 17.2 m apart,
2.4 m wheelbase, 920 mm wheels with traction motors under the motor car, 840 mm
under the trailers; the motor car carries two power packs, the rectifier, the
fuel tank and two exhausts.

## CSD M 131.1 Hurvinek

The XML section and the plan that rounds both ends in to 1.8 m (the right end's
full-width station moved from 9.4 to 9.85 m so the +X door does not straddle a
plan station), the roof rounding into the ends, the end doors standing 0.1 m
proud (XML `dve`, carried up to 2.75 m as the BMP frames them). Lengths scaled to
the published 12.1 m over the buffers; the axles where the XML has them (7.05 m
apart, 0.35 m off centre). The motor car's roof radiator (to 9.5 m, as the BMP
draws it), two exhausts at the roof edge, engine and gearbox; the number is the
Kryspin designation M 131.1238.

## CSD M 240.0

The XML section, the plan rounding both ends in to 1.2 m, the roof rounding and
the central skirt down to 0.4 m; the XML's 0.1 m rake of the ends above 1.9 m is
left out, so the end windows lie on the end's own plan. Cream over red with the
cream skirt and roof, eight roof ventilators, the headlamp on each roof dome.
Lengths scaled to the published 18.5 m; bogies at the XML's pivots (12.4 m apart),
the powered one (B') at +X.

## CSD M 296.1 / CD 853 / 854

The XML section, the plan rounding the ends in to 1.6 m, the roof rounding down
to 3.2 m at the ends; the radiator grille on the roof's side slope over the -X
bogie (XML `roof` clip) under a low roof hump, the exhaust, the underfloor
engine, transmission, tank and boxes. Lengths scaled to the published 24.79 m;
bogies at the published 17.2 m pivots and 2.4 m wheelbase, the powered one under
the radiator end. The fronts (x_dec) carry the side panes, the gangway door pair,
the lamps and the headlamp in the roof dome.

## Measured comparison

`dmuComparison.ts` measures the default car of each design against native pixel
boxes in `assets/<folder>/native/<key>/landmarks.json` (12 to 17 boxes each, side
and front), orthographically from the GLB's vertices with the documented scales
undone. `pnpm exec tsx generator/dmuReport.ts` writes `COMPARISON.md` in each
folder (the first run recorded `baseline.json`); `--views <id> <dir> [k=v ...]`
writes orthographic and three-quarter review views and prints the triangle count
and any coplanar overlap. At the current revision: 810 0.99 -> 0.60 pp, 843 0.21
-> 0.01, M 131 0.59 -> 0.22, M 240 0.66 -> 0.33, M 296 0.35 pp. The rows left
outside their tolerance are deliberate and named in each table.

## Tests

`test/czechDmus.test.ts`: the five designs and their parameters; every
combination within 16,000 triangles, on the rail, centred, within 3.1 m and
4.7 m, its length over the buffers and its axles' positions, gauge and wheel
radii; the 843's three cars sharing the 24.1 m body and which carry cabs; the
trailers without engines and roof equipment; the 810 liveries sharing the body
and the 812 / 912 their longer one; the running numbers' check digits; every
default car within its landmarks' pixel tolerances and MAE limit. `test/params.test.ts`
and `test/models.test.ts` cover every design generically.
