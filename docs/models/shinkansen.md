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
| `proc-vehicle-shinkansen-e6` | Shinkansen E6 | `komachi`, `akita` | 23.075 / 20.5 m | 13 m cab face ([The E6](#the-e6)), a mini-shinkansen 2.945 m wide |
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
  `trailingLowered` with `true` folds the rear end car's down; `pantographD` - the
  pantograph's centre at a given d behind the car's front (the FV-Dosto's behind its cab);
- `sidePanels` - fittings on the end car's and the intermediate car's sides (d behind the
  car's front): a seam (a service door's outline), a framed window, louvres pressed in the
  side's paint, or a framed panel with a screen (a destination display); a livery's
  `endRoofEdge` - paint along the end car's roof edges from the shoulder up to a height,
  its rear end slanted (the FV-Dosto's red);
- `endBogies`, `endSides` - a locomotive end car: its bogies at given d behind the nose
  (centred under its body, not the coaches' rule) and its own side windows and doors in
  place of the passenger layout (the IC225's Class 91, the HST's Class 43, the Eurostar's power cars); `endGrilles` -
  its side grilles with vertical slats (the Class 43's radiator); `midBogies` - an
  intermediate car's bogies at given d behind its +X end (the Allegra's low-floor middle car,
  a bogie near each end); `pantographAt` - where the raised pantograph stands, d behind the
  body's +X end of the car raising it (default 1.5 m ahead of the rear bogie; the Allegra's
  over the cab, the FLIRT's over its leading bogie), in the distant model too;
- `jacobs` - Jacobs bogies: one bogie centred on each joint, carrying both cars (a car shown
  alone stands on its joint bogies, half beyond its body; the cabin stops short of their
  skirt cuts), the end car's leading bogie at `endBogies[0]` (the SBB FLIRT);
  `onePantograph` - one pantograph only, on the second car;
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
  regional and metro units, [germany-trains.md](germany-trains.md)). The `bulge` may be a
  table by height, a vee that deepens or flattens (the Roter Pfeil's cab); `lod` gives the
  distant model its own profile, plan and rows, and `glass: false` leaves its panes out, for a
  face with a bonnet drawn ahead of it in the series' `fittings`
  ([switzerland-trains.md](switzerland-trains.md)). Its `cornerDepth` makes the corner arcs
  elliptic by stating their depth back from the face ([y, depth]: a face tapering in plan, the
  Allegra's and the ICN's), `cornerRatio` by stating the depth over the radius ([y, k]: a nose
  rounded to a point in plan, the Giruno's); its `paint` lays colour fields over the whole
  surface, face and cab sides alike, between front and back edges in [y, d] (a field that runs
  from the front round the corners and back along a long nose: the Giruno's red and black);
  `lodGlass` gives the distant model's windscreen (half width, heights) where the windscreen is
  `paint`, not a pane (the E6);
- `jacobsInset` - the set rides on Jacobs bogies: in the train one bogie under each joint carries both
  cars (its rig support names both sections) and the cars' skirts are cut open at their inner
  ends; a lone car stands on its own bogie `jacobsInset` inside each inner end (the Giruno; the
  FLIRT's `jacobs` stands a lone car on its joint bogies instead);
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
- a cab face's `pods` - flat-fronted rounded housings standing off the face (`level` stands one upright on a sloping face), with lamps on
  their fronts (the RAe TEE II's twin-lamp pods and its coupler cover), and `texts` - lettering
  on the face, its strokes cut finer so they follow a face curving between the grid's rows (the
  TEE emblem);
- `cabWindows` take a fifth element, +1 or -1, for a window on one side only (the TEE's cab
  side window on the right, its destination board ahead of the door on the left, behind it on
  the right);
- `powerCar` - a machine car of its own among the intermediate cars, the unit value `powerCar`
  ("Power car"): its length, centred bogies of any axle count (A1A), one window row and layout,
  diamond pantographs at given d (one raised, the others folded, a folded one's base `lift`
  higher where two interlace), a roof line on insulators between them, louvres on the roof's
  edges, its slot in a train of n cars, its weight and power. It is the train's only pantograph
  car; the other intermediate cars draw none, and the train's power is the power car's.

A nose end never carries a gangway frame, buffered or not. A short car's leading bogie comes in so that its wheels stay under the body. The kit
refuses a wheelbase under 2.05 m (the bogie's brake cylinders would lie on its
transoms) and a skirt bottom on the centre coupler's draft gear or on the transoms.

`seriesHelpers.ts` holds the paint, nose and flat-cab helpers, the one-colour `striped`
livery and `velaro()`, the Siemens Velaro body the ICE 3, the CRH3C and the AVE S-103 share.

## The E6

The E6 is drawn with a `cabFace` (in place of the lofted nose tables), measured on
`assets/shinkansen-e6/`: `photo-e6-z8.jpg` rectified to true scale by a projective fit along the side
(the tip at d = 0, seven windows 0.89 m apart, the car's end 22.85 m back; heights from the rail and
the 3.65 m roof), the head-on and three-quarter photographs for widths.

- **Nose** - joined to the body's section 11.95 m behind the tip (the door follows at once, 12.2 -
  13.05 m). A round snout 0.42 - 1.55 m high, upright from 0.8 to 1.1 m, the coupler cover's seam
  under it and the red over white split at 1.0 m; behind it the nose rises to the windscreen's foot
  (3.6 m back, 1.98 m) and the canopy (3.0 m high from 6 to 7.5 m back), the roof reaching full height
  at the join. The canopy is narrower than the nose under it: the face's bow (up to 2.2 m deep) is the
  canopy's front, 0.65 m half wide; below 2.08 m the corners reach the full width within 2.4 - 5 m.
- **Paint** - edges in [y, d] (`paint`): the red over the snout and nose, its lower sweep rising from
  1.03 m (2 m back) to a point 10.9 m back at 2.0 m; the white wedge from a point at the headlights
  (4.4 m, 1.43 m) up to the roof's edge, the silver arrow line along its top; the grey line under the
  windows (2.02 - 2.09 m) along the body; the red roof over a silver band (3.1 - 3.2 m). The windscreen
  (3.6 - 7.3 m back) a rounded rectangle 1.24 m wide head on (`fields`), in a thin black surround; the headlights' long dark lens (4.5 - 6.5 m, 1.48 - 2.05 m)
  with two lamps at its front. A low white pilot under the nose (0.2 m high, 1.9 - 5.2 m back) and beige
  equipment covers from 5.3 m back, down to 0.42 m (`B`).
- **Sides** - windows 0.55 m wide, 2.16 - 2.66 m, 0.9 m apart: seven on the end car (E621), sixteen on
  an intermediate car; doors 0.85 m wide with a 0.3 m window high in the leaf, behind the nose and at the
  end car's rear, at the front of an intermediate car (its toilets at the rear); the LED destination
  display beside each. Bogies 6.7 m and 20.85 m behind the tip; centred on the intermediate cars.
- **Liveries** - `komachi` as above; `akita` keeps its white roof and red lines, with the same red nose.
- About 14,700 triangles the end car, 8,400 an intermediate car.

## Deviations

- The bodies' widths (above); the noses are drawn from tables, not measured drawings, and
  their cab windscreens are panes laid on the crown's own facets ([vehicles.md](vehicles.md), "Closed ends"), and the nose below the body's shoulder takes the side's colour under the shoulder; the E5's pointed lower nose and the
  N700S's wing edges are approximations.
- The 700's two liveries share the 700's body: the 923 Doctor Yellow's own detail (its
  measurement dome, the observation windows) is not drawn.
- The E4's double-deck cars have the doors at the lower deck's level and the standard cabin.

## Checking

`pnpm exec vitest run test/shinkansen.test.ts` (ids, parameters and two liveries each; the end
and middle cars at their lengths, inside the gauge and 16,000 triangles, without coplanar
faces, on two bogies, the pantograph raised to the wire; the sampled trains at their
formation's length, one section a car; the formation's pantographs and the turned rear car).
