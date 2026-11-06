# The later Shinkansen series

**Covers** - the seven later Shinkansen designs (`proc-vehicle-shinkansen-n700s`, `-e5`, `-500`, `-700`, `-e6`, `-100`, `-e4`): the series specs, their cars and trains, liveries, the gauge, deviations and tests.
**Code** - `generator/seriesCab.ts`, `generator/seriesHelpers.ts`, `generator/shinkansen.ts` (`SHINKANSEN_DESIGNS`, `SHINKANSEN_SERIES`, `shinkansenTrain`), `generator/usTransit.ts` (`drawCar`), `generator/carbodyKit.ts`, `test/shinkansen.test.ts`, `assets/shinkansen-*/`
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
  nose (`cabPanel` paint, the car builder's `field`); `lampPair` - twin headlights side by
  side across a steep nose front at one d, in one black surround (`crownDisc` in
  `sliceBody.ts` sets each on the crown by half width, where a height does not single out
  a point), and `noseGrille` - a black grille with slats across the front on the crown (the
  Class 43);
- a livery's `endBands` - the end car's own side bands (a power car painted apart from its
  coaches); `frontD` and `frontRoof` - how far behind the tip the livery's `front` bands
  reach and the roof paint there (the original InterCity 125's yellow cab roof);
  `capSlope` - that colour carried on back over the cab roof to a slanted edge, drawn over
  the bands (columns on the sides, narrow strips across the arc); `endLettering` - the end
  car's own markings on both sides (the InterCity 125's double arrow and name);
- `endCoupler: "buffers"` - buffers and a screw coupling on a beam at the cab ends (the car
  builder's `buffers` coupler), the coupling plane 0.65 m out;
- `wheelbase: 0` - a single axle at each truck position (a two-axle railbus, a Talgo car);
- `traction: "none"` - an unpowered set of coaches (the Talgo III), filed with the coaches.
- `windscreenMask` - a black band (`cabMask`) round a nose's windscreen, under its rubber,
  reaching this far past the panes and joined over the centre pillar (the ICNG).
- `arc` - the roof arc's segments (default 8); `couplerY` - the centre coupler's height
  (default 1.0 m, the tube's under its low floor);
- `cabNose` - with `flatCab`, a short nose under the cab's decals: the end's corners rounded
  in plan and its roof domed down to the front (the 1938 Stock);
- `centredBogies` - every car's two bogies centred on its body, `bogieCentres` apart;
- `layout` - the end and middle car's own door leaves (each with the way it slides, so a
  double door parts in the middle: `CarDef.doors.slides` in `usTransit.ts`) and windows, in
  place of the generated ones; `numberAt` - the side number's place;
- `fittings` - the series' own fittings (a cab front, underfloor equipment), drawn in place
  of the plain underfloor box.
- `noseCab` - an upright cab on the nose's flat front face: its panes and lamps drawn there
  as a flat cab's are, in place of the crown's windscreen and headlights, and a gangway
  door's outline (the Class 378);
- `cabFace` - the end drawn as one painted cab surface (`seriesCab.ts` on `cabNose.ts`) in place
  of the lofted nose: its centre-line profile (upright, raked or domed), the plan's corner radius
  and bow, the face's bands (the livery's `front`, else its sides), black surrounds and glass
  panes as paint over them, lamps, a gangway door's frame and leaf standing off the face, the
  number, the wipers and a roof lamp; painted polygon `fields` (each refines the face's grid)
  and cheaper `decals` laid on the surface; `wrap` carries the face's bands round onto the cab
  sides; `cols` and `tolerance` set the grid's resolution; the body ends square `dJoin` behind the tip and the face's
  slices meet the body's own section there (both ends of a `single` railcar). The distant model
  takes its profile, plan, bands and the panes as glass (the VT 98 and the other short-nosed
  regional and metro units, [germany-trains.md](germany-trains.md)). Its `bulge` may vary by
  height ([y, b]), its `cornerDepth` makes the corner arcs elliptic ([y, k], the depth over the radius: a nose rounded to a point in plan, the Giruno's), and
  its `paint` lays colour fields over the whole surface, face and cab sides alike, between front
  and back edges in [y, d] (a field that runs from the front round the corners and back along a
  long nose: the Giruno's red and black);
- `jacobs` - the set rides on Jacobs bogies: in the train one bogie under each joint carries both
  cars (its rig support names both sections) and the cars' skirts are cut open at their inner
  ends; a lone car stands on its own bogie `jacobs` inside each inner end (the Giruno);
- `fluting` - bands of horizontal ribs on every car's sides, round the windows and doors (the car
  builder's `fluting`, which takes several bands); `roofRibs` - ribs along the roof either side of
  the crown (the Talgo III's stainless body);
- `endGrilles` take `"h"` as a sixth element for horizontal louvres pressed in the side's own
  paint (the X 3800's engine room) instead of vertical slats on black;
- `lodRoof` - a block on the end car's roof in the distant model (the X 3800's turret);
- `wheelbase: 0` cars hang each axle in horn guides reaching up into the body over the skirt's
  cut, on leaf springs.
- a livery's `doors` and `front` - the door leaves' own bands, and the cab front's bands over
  the nose (the Class 378's orange doors and yellow front); the front's band heights become
  paint edges of the car's slices.

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
