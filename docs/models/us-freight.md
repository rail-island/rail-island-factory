# North American freight cars and the San Francisco cable car

**Covers** - the cupola caboose (`proc-vehicle-us-caboose`), the 50 ft boxcar (`proc-vehicle-us-boxcar`), the double-stack well car (`proc-vehicle-us-well-car`) and the San Francisco cable car (`proc-vehicle-sf-cable-car`): measures, parameters, the double-stack gauge, deviations and tests.
**Code** - `generator/usFreight.ts` (`US_FREIGHT`), `generator/usHoodKit.ts` (`paintedSweep`, `knuckleCoupler`), `test/usTransit.test.ts`, `assets/us-caboose/`, `assets/us-boxcar/`, `assets/us-well-car/`, `assets/sf-cable-car/`
**See also** - [us-transit.md](us-transit.md), [loading-gauge.md](loading-gauge.md), [wagons.md](wagons.md), [trams.md](trams.md)

## The designs

| id | title | parameters (default first) | over couplers | triangles |
|---|---|---|---|---|
| `proc-vehicle-us-caboose` | Cupola caboose | `livery`: `santaFe` (red), `unionPacific` (yellow) | 10.97 m | about 4,600 |
| `proc-vehicle-us-boxcar` | 50 ft boxcar | `livery`: `boxcarRed`, `railbox` | 16.87 m | about 5,000 |
| `proc-vehicle-us-well-car` | Double-stack well car | `cargo`: `single` (default), `empty`, `double` | 19.35 m | 3,700 - 4,000 |
| `proc-vehicle-sf-cable-car` | San Francisco cable car | `livery`: `powell`, `california` | 8.38 m | about 4,200 |

The freight cars are wagons (`WAGON_CATALOG`) on two freight trucks with knuckle couplers; the
liveries only recolour (`finishParams`). The cable car is a tram (`TRAM_CATALOG`) with no
doors: its grip sections are open (`NO_DOORS` in test/doors.test.ts).

- **Caboose** - the body with its cupola and windows, the roof walk, end platforms with their
  railings and door, ladders to the roof, marker lamps (white ahead, red behind) and the stove
  pipe (a smoke emitter); the railroad's name along the sides.
- **Boxcar** - the steel body with its exterior posts, the 10 ft sliding door on its track,
  the corrugated ends and their ladders, lettering.
- **Well car** - the end platforms over the trucks, the deep side girders round the well and
  its floor; a 40 ft high-cube container (12.19 by 2.44 by 2.9 m, corrugated, its doors at the
  rear) in the well (`single`, the default), a second stacked on it (`double`), or none. The
  double stack reaches 6.18 m: this design is held to the `usDoubleStack` gauge (3.3 by 6.2 m;
  [loading-gauge.md](loading-gauge.md)).
- **Cable car** - the closed centre cabin with its windows, the open grip sections with
  outward-facing benches, brass poles and end dash panels with a headlamp, running boards,
  the clerestory roof with the line's name, the grip lever, two small trucks.

## Deviations

- The freight trucks' wheelbase is 1.45 m (a 70-ton truck's 5 ft 8 in is 1.73 m), so the
  shared truck geometry keeps its brake cylinders clear of the transoms.
- The cable car's grip into the slot and its track brakes are a lever and a shank.

## Checking

`test/usTransit.test.ts` (with the passenger cars): every combination inside its gauge, the
budget, without coplanar faces, at its length on two supports; the well car's stacks against
the US and double-stack gauges, single by default.
