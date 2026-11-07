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
| `proc-vehicle-kintetsu-hinotori` | Kintetsu Hinotori | `hinotori`, `ace` | 21.6 / 20.5 m | cab face: raked windscreen, upper glass, LED bar, red frame |
| `proc-vehicle-jr-e259` | JR E259 Narita Express | `nex`, `original` | 20.5 / 20.0 m | the raked nose |
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

## Kintetsu Hinotori

Measured from the photographs in `assets/kintetsu-hinotori/` (SOURCES.md: a near side view at
about 145 px/m, overlaid on the model's side view to check it, and three front three-quarter
views) and the published figures: 21.6 m end cars and 20.5 m intermediate cars over the couplers,
2.79 m wide, roof 3.74 m.

- **Front** - a cab face (`HINO_FACE`, `cabFace`), the body square 3.0 m behind the tip. The
  profile: the face foremost at 0.95 m, the LED headlight bar (two rows of twenty, 1.5 - 1.66 m)
  0.28 m back, the windscreen from 1.98 m (0.64 m back) to 3.05 m (1.68 m back), about 45 degrees,
  the upper glass the premium passengers look through over it to 3.6 m, the roof at full height
  3.0 m behind the tip. A dark grey panel (half width 1.0 m) holds them; the red frame round it
  runs up the corners and back along the roof's edge as the red line (3.12 - 3.38 m) under the
  dark roof. Under the face a red bumper (`hinotoriFittings`) down to 0.2 m and 2.3 - 2.5 m deep,
  the coupler's black recess (1.12 m wide) in it, the coupler retracted there.
- **Sides** - the semi-transparent black window band 1.93 - 3.12 m with fine dark lines under it,
  the gold line at 1.36 - 1.395 m; on the cab sides (`endSweeps`) the frame's red, the dark field
  down to 1.55 m and the raked cab side window. The end car (the premium car): the narrow crew door
  3.2 - 3.78 m behind the tip with its grab rails, seven windows at the 1.3 m seat pitch
  (2.12 - 3.08 m, the high-decker's), the passengers' door at the rear deck, the gold phoenix logo
  and "HINOTORI" beside both doors. The intermediate car: one door at its +X end, seven long
  windows. The leading bogie 3.9 m behind the tip, under the crew door; 14.15 m bogie centres.
- **Liveries** - `hinotori` (metallic red #ad2320, gold #c29d3b); `ace` puts the Kintetsu
  limited express colours of the 22600 "Ace" (orange over navy with a white line, a grey roof) on
  the same body, without the phoenix (drawn there in the band's own orange).
- **Gauge** - unlike the other units here the prototype runs on 1,435 mm track (Kintetsu's Osaka and
  Nagoya lines), so the wheelsets are real.
- **Deviations** - the roof reaches full height 3.0 m behind the tip, about 0.8 m sooner than on the
  prototype (the cab face must meet the body before the crew door); the end car's windows are the
  same height as the intermediate car's (the distant model draws one window row); the premium
  car's real rear layout (lockers, toilet) behind the passengers' door is a plain dark band; the
  pantograph stands at the kit's default place on each intermediate car.

## Deviations

- The GSE's and the Hinotori's real cars are articulated or on their own bogies in ways the kit
  approximates with two bogies a car; the GSE's raised driver's cab over the saloon is the
  nose's crown.
- The E235's and E259's wrap-round windows and the 103's later variants are simplified.

## Checking

`pnpm exec vitest run test/jpEmus.test.ts` (ids, parameters and two liveries each; the end and
middle cars at their lengths and real widths inside the UIC gauge, in budget, without coplanar
faces, on two bogies, the middle car's pantograph raised; the commuter cars' four doors).
