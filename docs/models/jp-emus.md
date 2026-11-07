# Japanese conventional-line electric units

**Covers** - the seven Japanese narrow-gauge-line units (`proc-vehicle-jr-e235`, `-jnr-103`, `-odakyu-gse`, `-kintetsu-hinotori`, `-jr-e259`, `-jnr-485`, `-hankyu-9000`): their series specs on the Shinkansen series kit, the commuter doors and flat cabs, liveries, the gauge and tests.
**Code** - `generator/jpEmus.ts` (`JP_EMUS`, `JP_EMU_SERIES`), `generator/jrE259.ts` (the E259), `generator/shinkansen.ts` (`ShinkansenSeries`, `buildSeries`, `seriesDesign`), `generator/usTransit.ts` (`drawCar`), `test/jpEmus.test.ts`, `assets/jr-e235/`, `assets/jnr-103/`, `assets/odakyu-gse/`, `assets/kintetsu-hinotori/`, `assets/jr-e259/`, `assets/jnr-485/`, `assets/hankyu-9000/`
**See also** - [shinkansen.md](shinkansen.md), [jnr-locos.md](jnr-locos.md), [jr-kiha40.md](jr-kiha40.md), [us-transit.md](us-transit.md)

## The designs

| id | title | `livery` (default first) | car (end / middle) | front |
|---|---|---|---|---|
| `proc-vehicle-jr-e235` | JR E235 | `yamanote`, `yokosuka` | 20.0 / 20.0 m, 4 doors a side | flat cab |
| `proc-vehicle-jnr-103` | JNR 103 series | `chuo`, `yamanote` | 20.0 / 20.0 m, 4 doors | flat cab, diamond pantograph |
| `proc-vehicle-odakyu-gse` | Odakyu Romancecar GSE | `rose`, `lse` | 19.6 / 16.0 m | the observation nose |
| `proc-vehicle-kintetsu-hinotori` | Kintetsu Hinotori | `hinotori`, `ace` | 21.0 / 20.5 m | the curved-windscreen nose |
| `proc-vehicle-jr-e259` | JR E259 Narita Express | `nex`, `original` | 21.43 / 20.5 m | cab face with gangway door |
| `proc-vehicle-jnr-485` | JNR 485 series | `jnr`, `kyushu` | 21.0 / 20.5 m | the bonnet, diamond pantograph |
| `proc-vehicle-hankyu-9000` | Hankyu 9000 series | `maroon`, `allMaroon` | 19.0 / 19.0 m, 3 doors | flat cab |

Each is a `ShinkansenSeries` ([shinkansen.md](shinkansen.md)) built by the same code: the end
car (the default), the middle car raising its pantograph and the articulated train of 3 - 8
cars. The series kit's options used here: `doorCount` (commuter doors evenly along the car,
windows in the piers between them), `flatCab` (a flat cab end's windscreen panes, mask and
lamps in place of the nose; the end car's body is 7 cm short of its length so its lamps stand
at it), `pantograph: "diamond"`. The bodies keep their real 2.75 - 2.95 m widths and run on the
game's standard-gauge wheelsets (the prototypes' track is 1,067 mm; [jr-kiha40.md](jr-kiha40.md),
"Gauge"), inside the UIC gauge.

## JR E259

`generator/jrE259.ts`, from the photographs and figures in `assets/jr-e259/SOURCES.md`. The end car
is the Kuro E259 (the Green car): 21.43 m over the couplers (body 21.0 m), the intermediate car the
Moha E259, 20.5 m (body 20.0 m); 2.946 m wide, roof 3.655 m.

- **Cab face** (`cabFace`, joined 3.6 m behind the tip): flat and white across the gangway door
  (1.4 m wide, 0.95 - 3.13 m) and leaning back 0.15 m; corners rounding back 0.9 m with the black
  lamp housings on them (lat +-0.97 m, 1.96 - 2.62 m); the windscreen 3.16 - 3.61 m in a black
  surround, raked back to 1.75 m behind the tip; the white pillars beside it; the black cap over the
  cab (the face's band above the 3.2 m shoulder, `endRoofEdge` to 5.2 m), then the white cab roof up
  to the carmine roof's slanted edge (`capSlope`: 8.4 m at the shoulder, 6.8 m at the crown).
- **Cab side window**: a wedge on the face's sides (`endSweeps`, glass in a white surround) from
  0.8 m behind the tip to its point at 3.4 m, 2.86 - 3.44 m high.
- **Skirt** (`fittings`): white corner fairings over a black lip, the dark coupler pocket between
  them and the coupler reaching the coupling plane.
- **Sides** (`layout`): the end car's crew door (a seam and its window, 4.05 - 4.75 m behind the
  tip), the passenger door (5.0 - 5.95 m), the Green saloon's window 8.7 - 16.0 m and a small one
  near the rear; the intermediate car's doors 0.55 m from each end and the continuous window
  3.5 - 17.6 m. Window glass and the black over it up to the shoulder are one dark frame
  (1.84 - 3.17 m), the carmine roof coming down the curved upper side to the 3.2 m shoulder just
  over it (0.45 m seen side-on, as in the side photographs). The carmine is `#d4325c`, the crimson
  the sunlit photographs show, not the published #e30304, which renders orange-red. Bogies 13.8 m apart, the end car's leading one under its doors; the single-arm
  pantograph over the Moha's rear bogie.
- **Liveries**: `nex` is the renewed livery of 2023 (the door silver with "SERIES E259", the
  same at the end car's rear); `original` the 2009 one (the door black with the vertical white
  N'EX, its red diamond and the grey aeroplane; the red NEX over the cab's doors). Both faces carry
  both markings, the unused one in the door's own paint.
- **Distant model**: the face's white and black, the black cap over the cab as a block (`lodRoof`,
  to 5.2 m behind the tip); the white strip behind it is left to the full model.
- **Deviations**: the Moha E259 500's second (spare) pantograph is not drawn, the pantographs sit on
  the kit's cars (the 2nd and next-to-last); the apostrophe of N'EX on the side is left out (no
  glyph); the red roof's slanted edge is drawn in 16 strips (a fine step from above); the other end
  car (the Kuha E258) is the Kuro mirrored; the front coupler sits at the kit's 1.0 m (real 0.88 m).

## Deviations

- The GSE's and the Hinotori's real cars are articulated or on their own bogies in ways the kit
  approximates with two bogies a car; the GSE's raised driver's cab over the saloon is the
  nose's crown.
- The E235's wrap-round windows and the 103's later variants are simplified.

## Checking

`pnpm exec vitest run test/jpEmus.test.ts` (ids, parameters and two liveries each; the end and
middle cars at their lengths and real widths inside the UIC gauge, in budget, without coplanar
faces, on two bogies, the middle car's pantograph raised; the commuter cars' four doors).
