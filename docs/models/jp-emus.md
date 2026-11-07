# Japanese conventional-line electric units

**Covers** - the seven Japanese narrow-gauge-line units (`proc-vehicle-jr-e235`, `-jnr-103`, `-odakyu-gse`, `-kintetsu-hinotori`, `-jr-e259`, `-jnr-485`, `-hankyu-9000`): their series specs on the Shinkansen series kit, the commuter doors and flat cabs, liveries, the gauge and tests.
**Code** - `generator/jpEmus.ts` (`JP_EMUS`, `JP_EMU_SERIES`), `generator/shinkansen.ts` (`ShinkansenSeries`, `buildSeries`, `seriesDesign`), `generator/usTransit.ts` (`drawCar`), `test/jpEmus.test.ts`, `assets/jr-e235/`, `assets/jnr-103/`, `assets/odakyu-gse/`, `assets/kintetsu-hinotori/`, `assets/jr-e259/`, `assets/jnr-485/`, `assets/hankyu-9000/`
**See also** - [shinkansen.md](shinkansen.md), [jnr-locos.md](jnr-locos.md), [jr-kiha40.md](jr-kiha40.md), [us-transit.md](us-transit.md)

## The designs

| id | title | `livery` (default first) | car (end / middle) | front |
|---|---|---|---|---|
| `proc-vehicle-jr-e235` | JR E235 | `yamanote`, `yokosuka` | 20.0 / 20.0 m, 4 doors a side | flat cab |
| `proc-vehicle-jnr-103` | JNR 103 series | `chuo`, `yamanote` | 20.0 / 20.0 m, 4 doors | flat cab, diamond pantograph |
| `proc-vehicle-odakyu-gse` | Odakyu Romancecar GSE | `rose`, `lse` | 21.3 / 20.0 m | the observation end and raised cab dome (cab face) |
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

## The GSE

`proc-vehicle-odakyu-gse` is Odakyu's 70000 series (2018), measured on five photographs
(assets/odakyu-gse/SOURCES.md: a near side view at 81.8 px/m, a head-on view at 211 px/m and three
three-quarter views) against the published figures: end cars 21.3 m and intermediate cars 20.0 m over
the couplers, 2,878 mm wide, roof 3.70 m, 4.057 m over the cab, floor 1.15 m. Unlike the earlier
observation Romancecars it is **not articulated**: every car rides on its own two bogies (13.8 m
apart; the end car's leading bogie 5.0 m behind the tip, under the saloon), so the kit's ordinary
coupled train is the prototype's formation.

- **The observation end** is a `cabFace` (`GSE_FACE`, joined to the body 3.9 m behind the tip): a
  blunt bumper whose most forward point is 1.11 m up, raked back to 0.45 m and to its top at 1.64 m;
  the saloon's windscreen raked about 42 degrees from 1.74 m (0.5 m behind the tip) to 3.03 m (1.7 m
  behind), 2.34 m wide and wrapping round the corners; the silver pillars running from the bumper's
  top up and back to the cab (cab-face paint, continued on the body as `endSweeps`); the red band
  over the windscreen with the square headlights at +-0.99 m; the coupler cover and the tail lamps
  (+-0.71 m, 0.63 m) in the bumper. The face's top stays level at 3.42 m back to 3.4 m and rises to
  the roof's crown only inside the dome, so the dome stands clear of it seen from ahead.
- **The raised cab** (`gseFittings`, lofted with `loftHalves`): a glass dome 2.4 m wide rising from
  the band (2.5 m behind the tip, 3.36 m) to 4.05 m at 3.67 m, the cab's two side windows
  (3.75 - 5.05 m, 3.52 - 3.87 m up) behind a red pillar, the cab roof level to 6.2 m and faired down
  into the car's roof by 9.4 m (`lodRoof` in the distant model).
- **Sides**: 1.0 m windows (1.84 - 2.86 m) in a black band, about 1.18 m panes 1.36 m apart; the
  saloon's first window behind the pillar (to 4.36 m) and a second one (4.77 - 6.51 m) ahead of the
  door; narrow doors 0.6 m by 1.82 m with a small window, behind the saloon (6.8 m) and at the inner
  end of the end car, and at the joint end of each middle car; the red valance down to 0.45 m along
  the nose's sides to 6.65 m, the silver underframe covers (0.2 - 0.86 m) behind it; "ROMANCECAR GSE"
  under the windows. The roof is rouge bordeaux from the shoulder (3.45 m), with two air-conditioner
  fairings with black louvres on every car.
- **Liveries**: `rose` (the body and the vermilion-orange line under the windows sampled from the
  sunlit photographs, the published rouge-bordeaux roof and moonlight-silver covers) and `lse`
  (the LSE's vermilion orange, grey window band and two white lines; a livery the GSE never carried).
- **Game properties**: 35 t an end car and 40 t a middle car (268.7 t a 7-car set), 435 kW a car
  (four motor cars of 4 x 190 kW over seven cars), 110 km/h; OpenTTD capacities 56 and 60 seats.

## Deviations

- The Hinotori's real cars ride on their bogies in ways the kit approximates with two bogies a car.
- The GSE (see "The GSE" above): its pantographs stand where the kit puts them (the middle cars'
  rear ends, two in a train), not on cars 2, 4 and 6; the dome's wipers, the emblems and the end
  car's interior ladder to the cab are left out; the cab roof's fairing into the car's roof (6.2 -
  9.4 m behind the tip) and the roof fairings' sizes are read from three-quarter views only.
- The E235's and E259's wrap-round windows and the 103's later variants are simplified.

## Checking

`pnpm exec vitest run test/jpEmus.test.ts` (ids, parameters and two liveries each; the end and
middle cars at their lengths and real widths inside the UIC gauge, in budget, without coplanar
faces, on two bogies, the middle car's pantograph raised; the commuter cars' four doors).
