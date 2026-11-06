# The later Shinkansen series

**Covers** - the seven later Shinkansen designs (`proc-vehicle-shinkansen-n700s`, `-e5`, `-500`, `-700`, `-e6`, `-100`, `-e4`): the series specs, their cars and trains, liveries, the gauge, deviations and tests.
**Code** - `generator/seriesHelpers.ts`, `generator/shinkansen.ts` (`SHINKANSEN_DESIGNS`, `SHINKANSEN_SERIES`, `shinkansenTrain`), `generator/usTransit.ts` (`drawCar`), `generator/carbodyKit.ts`, `test/shinkansen.test.ts`, `assets/shinkansen-*/`
**See also** - [shinkansen-0.md](shinkansen-0.md), [us-transit.md](us-transit.md), [us-carbodies.md](us-carbodies.md), [loading-gauge.md](loading-gauge.md)

## The designs

| id | title | `livery` (default first) | end car / middle car | nose |
|---|---|---|---|---|
| `proc-vehicle-shinkansen-n700s` | Shinkansen N700S | `jrCentral`, `jrKyushu` | 27.35 / 25.0 m | 10.7 m "dual supreme wing" |
| `proc-vehicle-shinkansen-e5` | Shinkansen E5 / H5 | `hayabusa` (E5), `h5` | 26.5 / 25.0 m | 15 m, the canopy cab |
| `proc-vehicle-shinkansen-500` | Shinkansen 500 series | `original` (Nozomi), `kodama` | 27.0 / 25.0 m | 15 m needle, round body |
| `proc-vehicle-shinkansen-700` | Shinkansen 700 / 923 | `jrCentral`, `doctorYellow` (the 923) | 27.35 / 25.0 m | 9.2 m "duck bill" |
| `proc-vehicle-shinkansen-e6` | Shinkansen E6 | `komachi`, `akita` | 23.075 / 20.5 m | 13 m, a mini-shinkansen 2.945 m wide |
| `proc-vehicle-shinkansen-100` | Shinkansen 100 series | `jnr`, `jrWest` | 26.05 / 25.0 m | 5 m, after the 0 series |
| `proc-vehicle-shinkansen-e4` | Shinkansen E4 Max | `max`, `toki` | 25.7 / 25.0 m | 11.5 m, double-deck, 4.485 m high |

Each design's `unit` is the end car (the default: the car with the nose, a motor car),
`middleCar` (raising its single-arm pantograph to the game's wire) or `train` with `cars`
3 - 8 (default 4): an end car at each end, the rear one turned, the second and next-to-last
cars raising their pantographs (the middle one of three; `shinkansenTrain`); each car a section
of an articulated set (`articulate`), bellows between them. All are electric units
(`EMU_CATALOG`) on the Shinkansen gauge ([loading-gauge.md](loading-gauge.md)): narrowed from
their real 3.35 - 3.38 m to 3.24 - 3.28 m; the E6 keeps its 2.945 m.

## The series spec (`ShinkansenSeries`)

A series is its car lengths, the section (belly, shoulder, crown, skirt), its nose as a
`NoseShape` (the carbody kit's tables of crown, shoulder, belly and apron over the distance
from the tip, and the plan's superellipse), the windscreen's span on the nose's crown and the
headlights on its sides, the window rows (two on the E4's double-deck cars), the doors and the
bogies, its liveries (side bands by height, roof and skirt) and game figures. `carDef` turns a
series into a `CarDef` for the shared car builder (`drawCar`, [us-transit.md](us-transit.md)):
the lofted body, windows, plug doors onto the cabin (behind the cab on the end car), the
skirts cut over the bogies, centre couplers inside the train (the end car's covered by its
nose), the pantograph on its base, the underfloor equipment. The distant model is the body
section with its nose's centre line, the window band, the bogies and the pantograph, 100
triangles a car, 500 at most.

### The series kit beyond the Shinkansen

The series spec also draws the conventional units of the eight-country plan
([germany-trains.md](germany-trains.md)). Each option is off by default, so the
Shinkansen's and the Japanese units' bytes are unchanged (all 271 series and car-builder
combinations hashed before and after):

- `traction: "diesel"` - no pantograph, a roof exhaust over each car's middle, filed with
  the DMUs;
- `cars` - the train lengths offered (default 3 - 8); a unit of two cars has no middle car;
- `single` - one double-ended railcar, its nose (or flat cab) at both ends, no car choice;
- `endPantograph` - the end cars raise the pantographs (a short unit without middle motor cars);
  `"lead"` only the leading end car (a locomotive and its driving trailer, the IC225),
  `"trail"` only the rear one (a power-car train fed from one collector, the Eurostar);
- `endBogies`, `endSides` - a locomotive end car: its bogies at given d behind the nose
  (centred under its body, not the coaches' rule) and its own side windows and doors in
  place of the passenger layout (the IC225's Class 91, the HST's Class 43, the Eurostar's power cars); `endGrilles` -
  its side grilles with vertical slats (the Class 43's radiator);
- `faceLamps`, `faceGrille` - a blunt nose's headlights and grille on its front face, in
  place of the side lamps; `cabPanel` - a warning panel painted over the bands at the
  nose (`cabPanel` paint, the car builder's `field`);
- `endCoupler: "buffers"` - buffers and a screw coupling on a beam at the cab ends (the car
  builder's `buffers` coupler), the coupling plane 0.65 m out;
- `wheelbase: 0` - a single axle at each truck position (a two-axle railbus, a Talgo car);
- `traction: "none"` - an unpowered set of coaches (the Talgo III), filed with the coaches.
- `windscreenMask` - a black band (`cabMask`) round a nose's windscreen, under its rubber,
  reaching this far past the panes and joined over the centre pillar (the ICNG).

A nose end never carries a gangway frame, buffered or not. A short car's leading bogie comes in so that its wheels stay under the body. The kit
refuses a wheelbase under 2.05 m (the bogie's brake cylinders would lie on its
transoms) and a skirt bottom on the centre coupler's draft gear or on the transoms.

`seriesHelpers.ts` holds the paint, nose and flat-cab helpers, the one-colour `striped`
livery and `velaro()`, the Siemens Velaro body the ICE 3, the CRH3C and the AVE S-103 share.

## Deviations

- The bodies' widths (above); the noses are drawn from tables, not measured drawings, and
  their cab windscreens are panes laid on the crown's own facets ([vehicles.md](vehicles.md), "Closed ends"), and the nose below the body's shoulder takes the side's colour under the shoulder; the E5's and E6's pointed lower noses and the
  N700S's wing edges are approximations.
- The 700's two liveries share the 700's body: the 923 Doctor Yellow's own detail (its
  measurement dome, the observation windows) is not drawn.
- The E4's double-deck cars have the doors at the lower deck's level and the standard cabin.

## Checking

`pnpm exec vitest run test/shinkansen.test.ts` (ids, parameters and two liveries each; the end
and middle cars at their lengths, inside the gauge and 16,000 triangles, without coplanar
faces, on two bogies, the pantograph raised to the wire; the sampled trains at their
formation's length, one section a car; the formation's pantographs and the turned rear car).
