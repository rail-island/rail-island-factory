# Japanese conventional-line electric units

**Covers** - the seven Japanese narrow-gauge-line units (`proc-vehicle-jr-e235`, `-jnr-103`, `-odakyu-gse`, `-kintetsu-hinotori`, `-jr-e259`, `-jnr-485`, `-hankyu-9000`): their series specs on the Shinkansen series kit, the commuter doors and flat cabs, liveries, the gauge and tests.
**Code** - `generator/jpEmus.ts` (`JP_EMUS`, `JP_EMU_SERIES`), `generator/shinkansen.ts` (`ShinkansenSeries`, `buildSeries`, `seriesDesign`), `generator/usTransit.ts` (`drawCar`), `test/jpEmus.test.ts`, `assets/jr-e235/`, `assets/jnr-103/`, `assets/odakyu-gse/`, `assets/kintetsu-hinotori/`, `assets/jr-e259/`, `assets/jnr-485/`, `assets/hankyu-9000/`
**See also** - [shinkansen.md](shinkansen.md), [jnr-locos.md](jnr-locos.md), [jr-kiha40.md](jr-kiha40.md), [us-transit.md](us-transit.md)

## The designs

| id | title | `livery` (default first) | car (end / middle) | front |
|---|---|---|---|---|
| `proc-vehicle-jr-e235` | JR E235 | `yamanote`, `yokosuka` | 20.0 / 20.0 m, 4 doors a side | flat cab |
| `proc-vehicle-jnr-103` | JNR 103 series | `chuo`, `yamanote` | 20.0 / 20.0 m, 4 doors | flat cab, diamond pantograph |
| `proc-vehicle-odakyu-gse` | Odakyu Romancecar GSE | `rose`, `lse` | 19.6 / 16.0 m | the observation nose |
| `proc-vehicle-kintetsu-hinotori` | Kintetsu Hinotori | `hinotori`, `ace` | 21.0 / 20.5 m | the curved-windscreen nose |
| `proc-vehicle-jr-e259` | JR E259 Narita Express | `nex`, `original` | 20.5 / 20.0 m | the raked nose |
| `proc-vehicle-jnr-485` | JNR 485 series | `jnr`, `kyushu` | 21.0 / 20.5 m | the bonnet, diamond pantograph |
| `proc-vehicle-hankyu-9000` | Hankyu 9000 series | `maroon`, `allMaroon` | 19.0 / 19.0 m, 3 doors | cab face (`HK_FACE`) |

Each is a `ShinkansenSeries` ([shinkansen.md](shinkansen.md)) built by the same code: the end
car (the default), the middle car raising its pantograph and the articulated train of 3 - 8
cars. The series kit's options used here: `doorCount` (commuter doors evenly along the car,
windows in the piers between them), `flatCab` (a flat cab end's windscreen panes, mask and
lamps in place of the nose; the end car's body is 7 cm short of its length so its lamps stand
at it), `pantograph: "diamond"`. The bodies keep their real 2.75 - 2.95 m widths and run on the
game's standard-gauge wheelsets (the prototypes' track is 1,067 mm; [jr-kiha40.md](jr-kiha40.md),
"Gauge"), inside the UIC gauge.

## Hankyu 9000 series

Rebuilt from four photographs (assets/hankyu-9000/SOURCES.md) on a `cabFace` (`HK_FACE`), its
own layout (`HK_LAYOUT`) and fittings (`hkFittings`) in place of the generic flat cab:

- **Face** (head-on photo of 9002, 197 px/m upright, 190 px/m across): upright at the lamps,
  leaning back 8 cm up the windscreens and rounding over into the roof (join 0.45 m behind the
  tip); plan corners 0.22 m, swept 0.3 m back, bowed 5 cm. Two windscreens (lat 0.49 - 1.24 m,
  1.93 - 3.38 m) in white frames with the destination and type boards behind their heads; the
  gangway door between them (leaf +-0.37 m, 1.17 - 3.03 m, its window 1.76 - 2.92 m) in a
  stainless frame (+-0.44 m) running from 1.08 m up into the headlight box (+-0.31 m,
  3.3 - 3.56 m, four LED lamps); tail and marker lamp boxes (0.64 - 1.08 m, 1.37 - 1.56 m), the
  number "9000" over the left one, thin bright strips under the windscreens, chrome strips at
  1.1 m; the pale grey skirt (0.28 - 1.0 m) in a bar under the coupler and two cheeks turning back
  round the corners; the coupler at 0.88 m.
- **Sides** (projective fit over the side of 9000): doors 1.3 m wide every 5.75 m (end car
  tip-d 3.65, 9.4, 15.15 m; intermediate car 3.5, 9.25, 15.0 m from its end), each with two
  narrow windows; one 2.8 m window between doors and a 1.5 m one at each plain end, a 0.55 m one
  behind the end car's crew door (tip-d 0.65 - 1.3 m, its grab rails beside it); windows
  1.94 - 2.91 m in bright frames; two LED boards under the eaves.
- **Paint**: maroon all over, the roof ivory from the shoulder (3.22 m) up - the band over the
  eaves; `allMaroon` the same face with a grey roof.
- **Roof and running gear**: a long low cover over the air conditioning along the crown; bogies
  13.0 m apart centred on the body.

## Deviations

- The GSE's and the Hinotori's real cars are articulated or on their own bogies in ways the kit
  approximates with two bogies a car; the GSE's raised driver's cab over the saloon is the
  nose's crown.
- The E235's and E259's wrap-round windows and the 103's later variants are simplified.
- The Hankyu 9000's end cars (9000, 9100) carry the set's single-arm pantographs on the
  prototype; the kit raises one on the intermediate car instead and draws none on the end car.
  The skirt's facets and the underfloor equipment are simplified.

## Checking

`pnpm exec vitest run test/jpEmus.test.ts` (ids, parameters and two liveries each; the end and
middle cars at their lengths and real widths inside the UIC gauge, in budget, without coplanar
faces, on two bogies, the middle car's pantograph raised; the commuter cars' four doors).
