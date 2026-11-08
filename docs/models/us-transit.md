# North American passenger cars and urban rail

**Covers** - the Budd RDC (`proc-vehicle-budd-rdc`), the New York subway's R160 (`proc-vehicle-nyc-r160`) and the Chicago 'L' 5000-series (`proc-vehicle-cta-5000`): the car builder they share (also drawing the Pioneer Zephyr's coach and observation car), measures, variants, deviations and tests.
**Code** - `generator/usTransit.ts` (`US_TRANSIT`, `drawCar`, `CarDef`), `generator/carbodyKit.ts`, `test/usTransit.test.ts`, `assets/budd-rdc/`, `assets/nyc-r160/`, `assets/cta-5000/`
**See also** - [pioneer-zephyr.md](pioneer-zephyr.md), [us-carbodies.md](us-carbodies.md), [us-freight.md](us-freight.md), [loading-gauge.md](loading-gauge.md), [doors.md](doors.md), [interiors.md](interiors.md)

## The designs

| id | title | parameters (default first) | over couplers | triangles |
|---|---|---|---|---|
| `proc-vehicle-budd-rdc` | Budd RDC | `variant`: `rdc1` (all coach), `rdc2` (a baggage section) | 25.91 m | 13,000 - 13,300 |
| `proc-vehicle-nyc-r160` | NYC Subway R160 | `unit`: `cabCar`, `trailer` | 18.35 m | 6,900 - 7,300 |
| `proc-vehicle-cta-5000` | Chicago 'L' 5000-series | fixed | 14.63 m | about 6,900 |

All on the US loading gauge ([loading-gauge.md](loading-gauge.md)): the RDC is a
diesel unit (group `unit`), the subway cars electric metro cars (`METRO_CATALOG`), the R160's
third-rail current collection not drawn.

## The car builder (`drawCar`)

A `CarDef` is a carbody spec ([us-carbodies.md](us-carbodies.md), `carbodyKit.ts`) and its
fittings: side paint bands, window rows (sill, head, spans; `onSide` a row on one side only, `cornerR` rounded corners), passenger doors (spans, sill,
head, the leaf's window; `spanSides` a span on one side only) - plug doors that open onto the car's generic cabin (`openable`,
`plugMove`, `sliceCabin`; doors.md, interiors.md) - stainless fluting (one band or several) broken over windows and
doors, painted `strips` over the bands (d spans between two heights, down over the skirt: a
double-deck coach's door strips), a flat cab end's windscreen panes, front mask and lamps, both ends painted
apart (`ends`: their bands up to d from each end and the end walls' paint), the
diaphragm (`diaphragmW` its half width, default 0.5), trucks at d
(the diesel toolkit's bogie geometry), knuckle or centre couplers, lettering and extras.
`drawCar` takes the ends inside an articulated set (no coupler or diaphragm there) and the
trucks a Jacobs bogie replaces.

- **Budd RDC** - the stainless railcar with a cab at each rounded end, measured on the CB
  drawing (48.9 px/m) and the photographs in `assets/budd-rdc/` (SOURCES.md): end walls 0.25 m
  inside the coupling planes, side 1.0 - 3.3 m, roof 3.98 m, the end's corners swept 0.3 m back
  in plan and its top rolling back into the roof as a dome. The engineer sits on the right at
  each end, so the two sides differ (`onSide` rows, `spanSides` doors): each side has his
  window, a fluted pier and a door at one end and a door at the corner, with the toilet's
  narrow window behind it, at the other. Eleven 1.52 m saloon windows a side (sill 2.06 m,
  head 2.81 m, a wider pier after the fifth from the engineer's end) on the RDC-1; the RDC-2
  keeps the eight nearest its passenger end behind the baggage room - a 1.4 m sliding baggage
  door with its window and track, a blank section and a narrow window - and on the baggage
  end's engineer side has no passenger door. Ten flutes under the windows (1.16 - 2.0 m), a
  plain letterboard, flutes along the roof, bare stainless all over; the windows have rounded
  corners (`cornerR`). On the roof the
  radiator canopy (8.6 - 14.9 m from the front, 4.43 m high, ramped ends) with its radiator
  grilles, the engine air intake and the two exhausts (smoke emitters) on top, louvred vents
  near each end and two horns behind each dome. Under the floor an engine with its louvred
  casing and torque converter by each truck, its cardan shaft to the inner axle, the fuel
  tank, batteries and air reservoirs; step wells with two treads under each side door and
  grab irons beside it. The Budd trucks (`rdcTruck`, drawn with the extras): an outside frame
  with rounded ends over SKF roller-bearing boxes, a drop equalizer sagging between the axles
  with its springs, swing hangers, bolster springs and disc brakes on the axles. Each cab end
  (`rdcEndFace`) carries the end door's seams down to the floor with grab irons both sides,
  three tall end windows with rounded corners, red class lamps in the top corners, a rain
  gutter, and the headlight housing over the door: a rounded oblong set into the dome with a
  black bezel and twin headlights, under a brow rising from the end wall's top corners. Under
  the floor the end sheet comes down to 0.52 m with the coupler in its pocket, the anticlimber
  and step plate over it, MU sockets, air hoses and corner steps.
- **Pioneer Zephyr** - its own module ([pioneer-zephyr.md](pioneer-zephyr.md)): the power
  car's nose is a hull of its own; the coach and the observation car are `CarDef`s drawn here.
- **R160** - four doors a side, window pairs between them, fluting, the black front mask with
  three panes and its lamps on the cab car; the trailer has diaphragms at both ends.
- **5000-series** - two doors a side, the blue and red stripes, the cab end's mask.

## Deviations

- Trucks are the diesel toolkit's generic two-axle truck; the subway cars' third-rail shoes,
  the R160's destination signs and the cars' interiors beyond the generic cabin are not drawn.

## Checking

`pnpm exec vitest run test/usTransit.test.ts` (ids, groups, references, value titles; every
combination inside its gauge and the budget, without coplanar faces, at its length on two
supports; the distant models; the Zephyr's three sections on four supports with the two
Jacobs bogies, which the same test file checks with the other US cars). The doors, cabins and rail supports are also checked by the generic suites.
