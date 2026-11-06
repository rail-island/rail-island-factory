# North American passenger cars and urban rail

**Covers** - the Budd RDC (`proc-vehicle-budd-rdc`), the New York subway's R160 (`proc-vehicle-nyc-r160`) and the Chicago 'L' 5000-series (`proc-vehicle-cta-5000`): the car builder they share (also drawing the Pioneer Zephyr's coach and observation car), measures, variants, deviations and tests.
**Code** - `generator/usTransit.ts` (`US_TRANSIT`, `drawCar`, `CarDef`), `generator/carbodyKit.ts`, `test/usTransit.test.ts`, `assets/budd-rdc/`, `assets/nyc-r160/`, `assets/cta-5000/`
**See also** - [pioneer-zephyr.md](pioneer-zephyr.md), [us-carbodies.md](us-carbodies.md), [us-freight.md](us-freight.md), [loading-gauge.md](loading-gauge.md), [doors.md](doors.md), [interiors.md](interiors.md)

## The designs

| id | title | parameters (default first) | over couplers | triangles |
|---|---|---|---|---|
| `proc-vehicle-budd-rdc` | Budd RDC | `variant`: `rdc1` (all coach), `rdc2` (a baggage section) | 25.91 m | 8,800 - 9,000 |
| `proc-vehicle-nyc-r160` | NYC Subway R160 | `unit`: `cabCar`, `trailer` | 18.35 m | 6,900 - 7,300 |
| `proc-vehicle-cta-5000` | Chicago 'L' 5000-series | fixed | 14.63 m | about 6,900 |

All on the US loading gauge ([loading-gauge.md](loading-gauge.md)): the RDC is a
diesel unit (group `unit`), the subway cars electric metro cars (`METRO_CATALOG`), the R160's
third-rail current collection not drawn.

## The car builder (`drawCar`)

A `CarDef` is a carbody spec ([us-carbodies.md](us-carbodies.md), `carbodyKit.ts`) and its
fittings: side paint bands, window rows (sill, head, spans), passenger doors (spans, sill,
head, the leaf's window) - plug doors that open onto the car's generic cabin (`openable`,
`plugMove`, `sliceCabin`; doors.md, interiors.md) - stainless fluting broken over windows and
doors, a flat cab end's windscreen panes, front mask and lamps, the diaphragm, trucks at d
(the diesel toolkit's bogie geometry), knuckle or centre couplers, lettering and extras.
`drawCar` takes the ends inside an articulated set (no coupler or diaphragm there) and the
trucks a Jacobs bogie replaces.

- **Budd RDC** - the stainless railcar with a cab at each rounded end: 14 windows a side on the
  RDC-1, ten behind a baggage section and its door on the RDC-2; fluting under the windows,
  a red line along the skirt, side doors at both ends, two roof radiators, two exhausts (smoke
  emitters), underfloor engines and horns. Each cab end (`rdcEndFace`) carries the end door's
  seams around the middle windscreen pane, down to the floor, with a grab handle beside it,
  and over the door the headlight hood: a rounded darker-stainless oblong standing 16 cm out
  of the end under the roof line, with twin headlights on its front (the drawing and the
  Farina photograph in `assets/budd-rdc/`).
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
