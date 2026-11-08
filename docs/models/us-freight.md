# North American freight cars and the San Francisco cable car

**Covers** - the cupola caboose (`proc-vehicle-us-caboose`), the 50 ft boxcar (`proc-vehicle-us-boxcar`), the double-stack well car (`proc-vehicle-us-well-car`) and the San Francisco cable car (`proc-vehicle-sf-cable-car`): measures, parameters, the double-stack gauge, deviations and tests.
**Code** - `generator/usFreight.ts` (`US_FREIGHT`), `generator/usHoodKit.ts` (`paintedSweep`, `knuckleCoupler`), `test/usTransit.test.ts`, `assets/us-caboose/`, `assets/us-boxcar/`, `assets/us-well-car/`, `assets/sf-cable-car/`
**See also** - [us-transit.md](us-transit.md), [loading-gauge.md](loading-gauge.md), [wagons.md](wagons.md), [trams.md](trams.md)

## The designs

| id | title | parameters (default first) | over couplers | triangles |
|---|---|---|---|---|
| `proc-vehicle-us-caboose` | Cupola caboose | `livery`: `santaFe` (red), `unionPacific` (yellow) | 10.97 m | about 4,600 |
| `proc-vehicle-us-boxcar` | 50 ft boxcar | `livery`: `boxcarRed`, `railbox` | 16.87 m | 9,300 / 8,200 |
| `proc-vehicle-us-well-car` | Double-stack well car | `cargo`: `single` (default), `empty`, `double` | 19.35 m | 3,700 - 4,000 |
| `proc-vehicle-sf-cable-car` | San Francisco cable car | `livery`: `powell`, `california` | 8.38 m | about 4,200 |

The freight cars are wagons (`WAGON_CATALOG`) on two freight trucks with knuckle couplers; the
liveries are `finishParams` and change no extent (the boxcar's also pick its doors and post pitch). The cable car is a tram (`TRAM_CATALOG`) with no
doors: its grip sections are open (`NO_DOORS` in test/doors.test.ts).

- **Caboose** - the body with its cupola and windows, the roof walk, end platforms with their
  railings and door, ladders to the roof, marker lamps (white ahead, red behind) and the stove
  pipe (a smoke emitter); the railroad's name along the sides.
- **Boxcar** - a 1970s 70-ton Plate C car measured from photographs (assets/us-boxcar/SOURCES.md):
  the body 15.7 m long, its eave at 4.42 m and the shallow roof ridge at 15 ft 1 in; seven exterior
  hat-section posts (11 cm out, sloping flanks) each side of the door and the side sill; the diagonal-panel roof (ten panels, seam caps
  across and a raised diagonal in each, chevrons seen from above); improved Dreadnaught ends with six
  broad ribs, the end sill and striker; short side and end ladders at the corners with the sill
  steps; on the B end (-x) the vertical brake wheel, its housing, the brake step and the chain; the
  underframe's centre sill, bolsters, reservoir, AB valve and brake cylinder; its own three-piece
  70-ton trucks (33 in wheels, 5 ft 8 in wheelbase, cast side frames with spring nests, roller
  bearings, bolster and friction wedges). The livery chooses the car as photographed:
  `boxcarRed` is Southern Pacific's Hydra-Cushion car SP 245516 - a 16 ft double sliding door
  (two ribbed leaves locking in the middle, the track reaching both ways), posts 0.775 m apart,
  "SOUTHERN PACIFIC" right of the door, "HYDRA-CUSHION" in yellow, the reporting marks and the
  conspicuity reflectors; `railbox` is RBOX 33646 - a 10 ft single door painted black opening
  toward the right end, posts 0.87 m apart, "rail box" lettering with its outline logo, "next load",
  the red and blue X and "any road". The lettering reads alike on both sides (u from the viewer's
  left) and is repeated on the faces of the posts it crosses. Both liveries keep the same extent.
- **Well car** - the end platforms over the trucks, the deep side girders round the well and
  its floor; a 40 ft high-cube container (12.19 by 2.44 by 2.9 m, corrugated, its doors at the
  rear) in the well (`single`, the default), a second stacked on it (`double`), or none. The
  double stack reaches 6.18 m: this design is held to the `usDoubleStack` gauge (3.3 by 6.2 m;
  [loading-gauge.md](loading-gauge.md)).
- **Cable car** - the closed centre cabin with its windows, the open grip sections with
  outward-facing benches, brass poles and end dash panels with a headlamp, running boards,
  the clerestory roof with the line's name, the grip lever, two small trucks.

## Deviations

- The caboose's and well car's freight trucks' wheelbase is 1.45 m (a 70-ton truck's 5 ft 8 in is 1.73 m), so the
  shared truck geometry keeps its brake cylinders clear of the transoms.
- The cable car's grip into the slot and its track brakes are a lever and a shank.

## Checking

`test/usTransit.test.ts` (with the passenger cars): every combination inside its gauge, the
budget, without coplanar faces, at its length on two supports; the well car's stacks against
the US and double-stack gauges, single by default.
