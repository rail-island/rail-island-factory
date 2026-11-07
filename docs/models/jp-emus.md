# Japanese conventional-line electric units

**Covers** - the seven Japanese narrow-gauge-line units (`proc-vehicle-jr-e235`, `-jnr-103`, `-odakyu-gse`, `-kintetsu-hinotori`, `-jr-e259`, `-jnr-485`, `-hankyu-9000`): their series specs on the Shinkansen series kit, the commuter doors and flat cabs, liveries, the gauge and tests.
**Code** - `generator/jpEmus.ts` (`JP_EMUS`, `JP_EMU_SERIES`), `generator/jnr485.ts`, `generator/shinkansen.ts` (`ShinkansenSeries`, `buildSeries`, `seriesDesign`), `generator/usTransit.ts` (`drawCar`), `test/jpEmus.test.ts`, `assets/jr-e235/`, `assets/jnr-103/`, `assets/odakyu-gse/`, `assets/kintetsu-hinotori/`, `assets/jr-e259/`, `assets/jnr-485/`, `assets/hankyu-9000/`
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
| `proc-vehicle-hankyu-9000` | Hankyu 9000 series | `maroon`, `allMaroon` | 19.0 / 19.0 m, 3 doors | flat cab |

Each is a `ShinkansenSeries` ([shinkansen.md](shinkansen.md)) built by the same code: the end
car (the default), the middle car raising its pantograph and the articulated train of 3 - 8
cars. The series kit's options used here: `doorCount` (commuter doors evenly along the car,
windows in the piers between them), `flatCab` (a flat cab end's windscreen panes, mask and
lamps in place of the nose; the end car's body is 7 cm short of its length so its lamps stand
at it), `pantograph: "diamond"`. The bodies keep their real 2.75 - 2.95 m widths and run on the
game's standard-gauge wheelsets (the prototypes' track is 1,067 mm; [jr-kiha40.md](jr-kiha40.md),
"Gauge"), inside the UIC gauge.

## The 485 series

`generator/jnr485.ts` (`S485`): the KuHa 481 in its early bonnet form (0 and 100 numbers), measured
on the photographs in `assets/jnr-485/` (SOURCES.md) against the published heights (floor 1.23 m, the
cab's top 3.88 m).

- **Body** - bottom 0.91 m, gutter 3.13 m, crown 3.45 m; windows 2.03 - 2.69 m, 1.45 m wide at a 1.8 m
  pitch (two seat rows each): seven on the end car from 5.64 m behind the tip, nine on the intermediate
  car; folding doors 0.7 m, behind the cab (4.47 m) and at the rear. Bogie centres 14.15 m, the end car's
  leading bogie under the cab 3.0 m behind the tip.
- **Bonnet** - a cab face joined to the body 4.2 m behind the tip: upright from the bumper band to the
  crease at 2.43 m, then the hood rounding back to the windscreens' foot at 3.13 m (2.65 m behind the
  tip), its top falling to the sides (`bulge`) so that its shoulder climbs along the side. On it the
  red lamp boxes (head lamp 1.77 m over the tail lamp, at +-1.1 m) as pods, the eyebrows, the JNR wing
  emblem, the framed headboard; along the sides the whiskers (the red block with three cream lines, to
  3.7 m); under it the skirt to 0.44 m and the red coupler cover (`reach` 0.24 m).
- **Cab** - a second painted surface (cabNose.ts) standing above the gutter, its sides leaning in to
  2.16 m across the roof: two windscreens 3.13 - 3.6 m raked 0.32 m back, the raked side windows, the
  grey roof from 3.66 m, a rear wall at 4.35 m and the headlight pod on top (to 4.24 m). The distant
  model draws it as a box (`lodRoof`).
- **Roof** - AU13 air conditioners, four on the end car and five on the intermediate car clear of the
  diamond pantograph; grey.
- **Liveries** - `jnr`: cream and red (red to 1.17 m, the window band 1.94 - 2.83 m stopping at the door
  behind the cab, cream skirt), KuHa 481-26. `kyushu`: JR Kyushu's "Red Express" all red with white
  lines and "RED EXPRESS" on the end car's sides, black headboard, KuHa 481-33.

## Deviations

- The 485: the Kyushu livery shares the JNR face's geometry, so its white lines sit where the JNR
  whiskers are (the real ones run above the lamp boxes beside "RED EXPRESS", which is not drawn on
  the face); one diamond pantograph per motor pair where the MoHa 484 has two; the cab's small rear
  window and the bonnet's side grilles are left out; the distant model's window band runs on to the cab.

- The GSE's and the Hinotori's real cars are articulated or on their own bogies in ways the kit
  approximates with two bogies a car; the GSE's raised driver's cab over the saloon is the
  nose's crown.
- The E235's and E259's wrap-round windows and the 103's later variants are simplified.

## Checking

`pnpm exec vitest run test/jpEmus.test.ts` (ids, parameters and two liveries each; the end and
middle cars at their lengths and real widths inside the UIC gauge, in budget, without coplanar
faces, on two bogies, the middle car's pantograph raised; the commuter cars' four doors).
