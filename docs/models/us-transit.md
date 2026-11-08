# North American passenger cars and urban rail

**Covers** - the Budd RDC (`proc-vehicle-budd-rdc`), the New York subway's R160 (`proc-vehicle-nyc-r160`) and the Chicago 'L' 5000-series (`proc-vehicle-cta-5000`): the car builder they share (also drawing the Pioneer Zephyr's coach and observation car), measures, variants, deviations and tests.
**Code** - `generator/usTransit.ts` (`US_TRANSIT`, `drawCar`, `CarDef`), `generator/carbodyKit.ts`, `test/usTransit.test.ts`, `assets/budd-rdc/`, `assets/nyc-r160/`, `assets/cta-5000/`
**See also** - [pioneer-zephyr.md](pioneer-zephyr.md), [us-carbodies.md](us-carbodies.md), [us-freight.md](us-freight.md), [loading-gauge.md](loading-gauge.md), [doors.md](doors.md), [interiors.md](interiors.md)

## The designs

| id | title | parameters (default first) | over couplers | triangles |
|---|---|---|---|---|
| `proc-vehicle-budd-rdc` | Budd RDC | `variant`: `rdc1` (all coach), `rdc2` (a baggage section) | 25.91 m | 13,350 - 13,850 |
| `proc-vehicle-nyc-r160` | NYC Subway R160 | `unit`: `cabCar`, `trailer` | 18.35 m | 6,900 - 7,300 |
| `proc-vehicle-cta-5000` | Chicago 'L' 5000-series | fixed | 14.63 m | about 9,300 |

All on the US loading gauge ([loading-gauge.md](loading-gauge.md)): the RDC is a
diesel unit (group `unit`), the subway cars electric metro cars (`METRO_CATALOG`), the R160's
third-rail current collection not drawn (the 5000-series draws its shoes).

## The car builder (`drawCar`)

A `CarDef` is a carbody spec ([us-carbodies.md](us-carbodies.md), `carbodyKit.ts`) and its
fittings: side paint bands, window rows (sill, head, spans; `onSide` a row on one side only, `cornerR` rounded corners), passenger doors (spans, sill,
head, the leaf's window; `spanSides` a span on one side only, `glassCornerR` the leaf windows' rounded corners) - plug doors that open onto the car's generic cabin (`openable`,
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
  grab irons beside it. The Budd trucks (`rdcTruck`, drawn with the extras): a deep cast outside frame (0.74 - 0.91 m top member, legs to 0.22 m)
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
- **5000-series** - a married-pair car measured on the photographs in `assets/cta-5000/` (SOURCES.md:
  the face at 211 px/m, the sides by projective fits over the doors and the car's ends). Bare stainless,
  no stripes: fluted panels under the windows (1.08 - 1.88 m, plain beside the doors and at the ends), a
  ribbed roof, a gutter at the eave. The cab (+X) end is the fibreglass bonnet, painted lighter, a little
  narrower than the body (`ctaCabEnd`: its corners swept 0.2 m back, its top rolling into the roof):
  two big rounded windscreens (the operator's wider) with a slot and bar under each and a parked wiper,
  the end door with its window in a raised frame, grab posts and the safety chains, the LED destination
  sign over it, four marker lamps a side in the roof line (white, blue, amber, red outward), head and
  tail lamps, the number on the door, the anticlimber, the crew's stirrup steps under the corners. The other end is the plain end the car couples
  to its mate with: the end door with a tall window, grab posts, chains and curved grab handles by the
  corners. The two sides differ: behind the cab window (a tall framed window with its sash) the left
  side has a wide framed window, the right side a narrow dark one and a slot; each side then has two
  double doors 3.15 m either side of the middle (leaf windows with rounded corners), three framed
  windows between them (transom bars, the side sign in the middle one's upper light) and a framed and
  a narrow dark window at the plain end. The CTA roundel under the cab window, the number (5636) and
  the amber door lamps by the doors at the forward side on the left, the rear side on the right. The
  trucks (`ctaTruck`, 33 ft 6 in centres, 7 ft wheelbase, 28 in wheels): an outside frame over
  chevron springs, the traction motors, disc brakes, and on each side the shoe beam with its
  third-rail collector shoe beyond the outer axle; under the floor the propulsion and auxiliary
  inverters, the braking resistor's grille box, batteries, compressor and air reservoirs. The distant
  model is a flat-ended box with one glass band.

## Deviations

- The R160's trucks are the diesel toolkit's generic two-axle truck; its third-rail shoes,
  its destination signs and the cars' interiors beyond the generic cabin are not drawn.
- 5000-series: the truck centres are estimated from one photograph (33 ft 6 in); the roof's
  equipment is not drawn (none shows on the photographs, taken from platforms); the destination
  texts are fixed (HOWARD on the face, a plain lit panel on the sides).

## Checking

`pnpm exec vitest run test/usTransit.test.ts` (ids, groups, references, value titles; every
combination inside its gauge and the budget, without coplanar faces, at its length on two
supports; the distant models; the Zephyr's three sections on four supports with the two
Jacobs bogies, which the same test file checks with the other US cars; the 5000-series' plain
stainless sides, its face's sign and the two sides' own windows behind the cab). The doors, cabins and rail supports are also checked by the generic suites.
