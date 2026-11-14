# The later Shinkansen series

**Covers** - the seven later Shinkansen designs (`proc-vehicle-shinkansen-n700s`, `-e5`, `-500`, `-700`, `-e6`, `-100`, `-e4`): the series specs, their cars and trains, liveries, the gauge, deviations and tests.
**Code** - `generator/seriesCab.ts`, `generator/seriesHelpers.ts`, `generator/shinkansen.ts` (`SHINKANSEN_DESIGNS`, `SHINKANSEN_SERIES`, `shinkansenTrain`), `generator/usTransit.ts` (`drawCar`), `generator/carbodyKit.ts`, `test/shinkansen.test.ts`, `assets/shinkansen-*/`
**See also** - [shinkansen-0.md](shinkansen-0.md), [us-transit.md](us-transit.md), [us-carbodies.md](us-carbodies.md), [loading-gauge.md](loading-gauge.md)

## The designs

| id | title | `livery` (default first) | end car / middle car | nose |
|---|---|---|---|---|
| `proc-vehicle-shinkansen-n700s` | Shinkansen N700S | `jrCentral`, `jrKyushu` | 27.35 / 25.0 m | 10.7 m "dual supreme wing", a cab face (below) |
| `proc-vehicle-shinkansen-e5` | Shinkansen E5 / H5 | `hayabusa` (E5), `h5` | 26.5 / 25.0 m | 15 m, the canopy cab |
| `proc-vehicle-shinkansen-500` | Shinkansen 500 series | `original` (Nozomi), `kodama` | 27.0 / 25.0 m | 15 m needle as a cab face, the domed canopy, round body |
| `proc-vehicle-shinkansen-700` | Shinkansen 700 / 923 | `jrCentral`, `doctorYellow` (the 923) | 27.35 / 25.0 m | 9.2 m "duck bill", a cab face (below) |
| `proc-vehicle-shinkansen-e6` | Shinkansen E6 | `komachi`, `akita` | 23.075 / 20.5 m | 13 m cab face ([The E6](#the-e6)), a mini-shinkansen 2.945 m wide |
| `proc-vehicle-shinkansen-100` | Shinkansen 100 series | `jnr`, `jrWest` | 26.05 / 25.0 m | the "shark" cab face, 5.9 m to the join |
| `proc-vehicle-shinkansen-e4` | Shinkansen E4 Max | `max`, `toki` | 25.7 / 25.0 m | 11.5 m cab face: beak, eye windscreen, double-deck, 4.485 m high |

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

### Cab face build time

A cab face (`cabFace`, `drawCabFace` in `generator/seriesCab.ts`) scans every paint layer at a
few hundred heights in every column, so a measured face with many fields costs 100 - 700 ms to work
out. Its skin depends only on the face spec, its end, tip, body section and paint, so
`drawCabFace` records it once per process and replays the same `scope`/`facets` calls into later
builds with the same end and tip: the bytes are the same (test/seriesCabFace.test.ts, "cab face skin
replay"). Which layer covers which heights in each column (`NoseScan`, cabNose.ts `shared`) depends on
neither the end nor the tip, so a face drawn at another place along a train (every train length) reuses
that scan and only maps its points afresh. Both caches keep their 48 most recent entries, and a scan drops
its sample points once its first skin is drawn, so a build of every combination stays in memory. A face
spec copied or made per build misses the caches and is worked out afresh. The scan's queries carry no
model point (only drawing needs one), and the N700S's `reshape` caches its height lookups by (lat, y).

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
  `onePantograph` - one pantograph only, on the second car; `pantographsBesideEnds` - the two
  pantographs on the second and the next-to-last car, not the third and third from last (the ICE 3's
  transformer cars, `generator/deIce3.ts`);
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
  distant model its own profile, plan and rows (and corner depths, the E4's), and `glass: false` leaves its panes out, for a
  face with a bonnet drawn ahead of it in the series' `fittings`
  ([switzerland-trains.md](switzerland-trains.md)). Its `cornerDepth` makes the corner arcs
  elliptic by stating their depth back from the face ([y, depth]: a face tapering in plan, the
  Allegra's and the ICN's), `cornerRatio` by stating the depth over the radius ([y, k]: a nose
  rounded to a point in plan, the Giruno's); its `paint` lays colour fields over the whole
  surface, face and cab sides alike, between front and back edges in [y, d] (a field that runs
  from the front round the corners and back along a long nose: the Giruno's red and black);
  its `planInset` ([y, inset], cabNose.ts) stands the face and its corners that far inside the
  body's half width, the straight run behind them flaring out to the body's side by `dSide`: a
  cab hump narrower than the beak under it (the 700's); unset, the face is as before; a `paint`
  entry's `lat` keeps it within that lateral distance of the centre line: glass on a canopy
  narrower than the nose round it, its front and side windows drawn by one pair of edges (the E6's);

  `lodGlass` gives the distant model's windscreen (half width, heights) where the windscreen is
  `paint`, not a pane (the E6);

- a cab face's `reshape` - its depth reshaped across the face (`cabNose.ts`; the distant model keeps the
  plain slices): the N700S's canopy, valleys and wing crests, the E6's canopy cab; a livery sweep's `face` paints it on the face's
  front and corners too, not only its cab sides (the N700S's black canopy for JR Kyushu);
  `pantographCover` - a streamlined cover round the pantograph's base, the arm standing on its top;
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
- `endCrown` - with a cab face, the end car's crown still rising behind the join ([d behind the body's
  front, height], a crown-only nose of the body's full plan): the 500's roof reaching full height behind its
  first door; a livery's `roofStripe` - its own paint along every car's crown out to a half width on the
  roof's arc (the distant model's roof takes it), and `pantograph` - the livery's sets' own pantograph in
  place of the series' (`"wing"`: the 500 W sets' T-shaped wing, a post hinged at its foot carrying a level
  wing and its carbon, on a low shroud; drawn in `shinkansen.ts`);
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
livery and `velaro()`, the Siemens Velaro body the CRH3C and the AVE S-103 share (the ICE 3 has its own cab face in `deIce3.ts`).

## The 500 series

Matched to five photographs (assets/shinkansen-500/SOURCES.md; the side-on V5 end car at Himeji at
84 px/m gives the profile). The end is a cab face (`S500_FACE`, d behind the tip): the tip 0.79 m up, the
top rising at a third to the canopy's foot 2.75 m back at 1.92 m, the canopy (glass to about 6.7 m, a
dark hood to 8.6 m) domed on top, the join 9.65 m back at a 3.49 m crown that `endCrown` lifts to the full
3.69 m 14 m behind the tip. In plan the snout is a blunt spatula: elliptic corners, the lower half at
full width 6.5 m behind its centre line, the top at the join. Its underside comes down to 0.3 m (the
chin), the side skirt and the bogie fairings (three capsules each side, 3.25 - 7.5 m) to 0.3 m too. The
paint: a tongue over the top from the tip round the canopy into the roof's stripe (lavender-grey on the
`original` W sets, blue on the `kodama` V sets, whose roof stripe is a greyer blue), silver sides, a
crease round the snout at 1.0 m, the dark window band (2.14 - 2.77 m) with the blue band under it
(1.83 - 2.14 m) from 10.86 m behind the tip, silver round the first door (9.8 - 10.45 m). Windows 0.69 m
wide, 1.01 m apart (`layout`); narrow doors with a narrow window. The headlights and tail lamps sit in
the canopy's dark foot. The W sets raise T-shaped wing pantographs, the V sets single arms.


## The E5's nose and canopy

The E5 (`E5_FACE`, `e5Canopy` in `shinkansen.ts`) is drawn from six photographs and measured on
the near side-on one (`assets/shinkansen-e5/SOURCES.md`): its nose is a cab face (`cabFace`) 15 m
long, not the lofted nose tables, and the canopy cab its own bubble in the series' `fittings`.

- **Nose** - the tip at the coupler (1.05 - 1.15 m) under the coupler hatch, its seam an ellipse
  1.96 m wide across the front centred 1.25 m up, the white lower jaw below its middle down to the
  skirt (0.5 m, the series' skirt bottom): about two thirds of the tip's height, as in the head-on
  photograph U15. The top rises 1.72 m at 1 m, 2.03 m at 3.2 m, 2.27 m at 6 m, then low under the
  canopy (2.6 m at 9.9 m) and up to the roof (3.62 m at 13.8 m). In plan the white jaw is a broad,
  blunt spatula reaching full width 2.2 - 3.1 m back, and the green hood over it narrower, its
  corners (`cornerDepth`) reaching full width 5 - 8 m back, so the jaw shows round its cheeks.
- **Canopy** - a green bubble 1.7 - 1.9 m wide, its front a quarter ellipsoid rising out of the
  nose 6 m back (round in plan over its first metre, 3.06 m high 7.4 m back), its crown 3.14 m at
  8.4 m and 3.25 m at 10.1 m, sinking under the roof by 13 m; rounded flanks, sunk into the nose.
  Its windscreen is one very dark navy, glossy glass (`e5Glass`, #141c28) on the canopy's front,
  seen head-on a wide trapezoid: a level top edge (2.94 m on the centre line, falling 0.1 m a metre
  to the rear so that it reads level from slightly above) under the green crown, a level foot
  (2.5 m), the sides the canopy's flanks narrowing to the top. It wraps round the front corners
  into the side windows (a thin pillar 7.6 m back), their foot rising to meet the top 9.7 m back.
  A thin black seal (`rubber`) rings it; the four headlights stand in a row inside it under its top
  edge. Every edge is a height line laid on fixed section angles, with a section wherever an edge
  crosses the crown or the side window closes, so the boundaries run smooth, without stepped facets.
- **Paint** - the nose's `paint` fields: white round the lower nose, the tokiwa green from the
  roof down over the whole nose to the hatch's middle (1.27 m), its edge level back to 4.5 m and
  then climbing over the white cheek to the stripe's top at the join; the stripe (pink, the H5's
  purple: the livery material `stripe`) 2.08 - 2.22 m on the body, dying out on the green's edge
  9 m back.
- **Sides** - the windows standing on the stripe (2.25 - 2.72 m, 0.66 m wide, 1.04 m pitch); a
  crew door's seam and window 15.3 - 16.25 m and the passenger door 16.4 - 17.4 m behind the tip;
  the doors' narrow windows high in the leaf. The leading bogie under the nose, 5.25 m behind the
  tip (17.5 m bogie centres).
- **Distant model** - the face's profile and plan with its two bands, the canopy's windscreen a dark glass block (`lodRoof`, 6.0 - 9.4 m back, up to the glass's top edge).


## The 100 series

Measured on the near side-on photograph of set X1 (`assets/shinkansen-100/`, a projective fit
along the car from the tip, the rear body end and the vertical scale at six columns, 35 - 80 px/m,
which returns the 1.04 m window pitch) and checked against the three-quarter and head-on
photographs of 123-1 and G49. Drawn as a cab face (`S100_FACE`, `cabFace`), d behind the tip:

- **Nose**: an oval cap, its tip at 1.67 m, a seam round it 0.62 m half wide; the top line rising
  nearly straight to the windscreen's foot (3.24 m at d 2.54); the flat windscreen raked about 42
  degrees to the cab roof (3.91 m at d 3.29); in plan a wedge reaching the body's width about 4.4 m
  back. The slit headlights (chrome rim, lamp ahead, dark glass behind) at d 1.1 - 2.0, 1.63 - 1.87
  m. The cab side window back to d 5.0 - 5.45; the radio fin on the cab roof.
- **Skirt** (`s100Fittings`): from 0.3 m up to the face's foot at 1.04 m, its front upright under
  the cap (d 0.6 - 0.66), boxier toward the bottom, its rear edge slanted from d 3.2 to 2.4 ahead of
  the leading bogie (centre d 4.73), two boxes on its front corners; the dark underside over the
  bogie; the distant model draws it as a block (`lodRoof`). The apron (the skirt's colour, from the
  body's bottom at 0.72 m to 1.04 m) runs under every car, cut over the bogies, and on the end car
  carries on over the leading bogie to the skirt (blue, JR West grey as in the K55 photograph).
- **Body**: 3.24 m wide (real 3.38), a high shoulder (3.6 m) under a flat roof, 4.0 m. The face's
  grid is fine (rows every 6 - 8 cm where it curves, 16 columns round each corner) so the glossy nose
  shows no facets; the end car stays under 15,300 triangles.
- **End car**: the crew door (a seam, d 6.08 - 6.68), the passenger door 6.84 - 7.62, 13 windows
  0.78 m wide at 1.04 m from d 8.42 (the 65 seats' rows), the rear door 21.95 - 22.7 over the rear
  bogie as photographed, the toilets behind it blank. **Middle car**: a door at each end, 20 windows.
  Doors 0.78 m, 1.35 - 3.15 m, a narrow window. **Pantograph**: a PS202 diamond near the car's rear.
- **Liveries**: JNR ivory, the blue window band 2.14 - 2.95 m and a blue line 1.98 - 2.06 m; JR
  West's renewal light grey, a dark grey band 2.11 - 2.95 m over a yellow-green stripe 1.88 - 2.11 m;
  both end on the end car in one edge slanted forward at its foot (d 4.4 - 5.33, `endSweeps`),
  the skirts blue or grey. Numbers 123-1 and 121-5055.
- **Deviations**: the cab canopy is not inset from the nose's sides (the face's rows are horizontal,
  so the canopy's side panes sit on the nose's corners); the pantograph's shroud, the end car's small
  toilet windows and the JR West Grand Hikari sets' own scheme are not drawn; the middle car's
  layout is the 100-seat ordinary car's for every intermediate car.


## The 700

The 700 (and the 923 on its body) is drawn with a `cabFace` (`S700_FACE`), measured from the
photographs in `assets/shinkansen-700/` (the side of 724-54 by a projective fit over its fifteen
windows at 1.04 m pitch, the camera at the sill's height; the fronts of C1 and C37 for widths):

- **Nose** - 9.5 m to the full section (published 9.2 m), its tip on the coupling plane. The
  beak's tip at 1.05 - 1.25 m, over a
  grey lip rising back to the skirt's top; its top climbs gently to the slit headlights
  (2.12 - 2.23 m, lat 0.13 - 0.82 m, two lamps each), 1.2 - 1.5 m behind the tip; the windscreen
  from 2.47 to 2.95 m, its front pane 1.48 m wide 2.0 - 3.15 m behind the tip and its side panes
  wrapped round the corners to 3.9 - 5.0 m, in one dark surround. The plan: tight corners on the
  broad beak, elliptic corners up to 4.5 m deep at the windscreen; over the beak's cheeks the cab
  hump stands up to 0.32 m inside the body's sides (`planInset`, from the C1 head-on at 229 px/m:
  2.79 m wide at the lamps, 2.69 m at the windscreen's foot, the beak 3.38 m), the waist flaring
  out to the sides by 9.1 m. The face's 32 rows keep its faceting below a thumbnail's notice.
- **Bands** - the thick blue band under the windows (1.64 - 1.93 m) and the thin one under it
  (1.47 - 1.56 m), over the doors on every car; on the nose the thick band ends in a point 7.24 m
  behind the tip (its top corner 7.8 m, bottom 8.43 m), the thin band in a slanted cut at
  8.97 - 9.45 m. Both liveries (the 923 yellow with the same blue bands, a grey skirt and its
  black hatch on the beak's top; the hatch is in the body's colour on the 700).
- **Sides** - windows 0.68 m wide, 2.0 - 2.55 m, 1.04 m pitch; doors 0.78 m wide with a 0.32 m
  window (2.36 - 2.88 m); on the end car the crew door with its narrow window (9.52 - 10.02 m)
  ahead of the passenger door (10.2 - 10.98 m).
- **Bogies** - the leading bogie under the nose, 6.1 m behind the tip, 17.5 m ahead of the rear one.


## The E6

The E6 is drawn with a `cabFace` (in place of the lofted nose tables), measured on
`assets/shinkansen-e6/`: `photo-e6-z8.jpg` rectified to true scale by a projective fit along the side
(the tip at d = 0, seven windows 0.89 m apart, the car's end 22.85 m back; heights from the rail and
the 3.65 m roof), the head-on and three-quarter photographs for widths.

- **Nose** - joined to the body's section 11.95 m behind the tip (the door follows at once, 12.2 -
  13.05 m). A round snout 0.42 - 1.55 m high, upright from 0.8 to 1.1 m, the coupler cover's seam
  under it and the red over white split at 1.0 m; behind it the nose rises to the windscreen's foot
  (about 3.9 m back, 2.1 m) and the canopy (3.0 m high from 6 to 7.5 m back), the roof reaching full height
  at the join. The canopy cab (`e6Reshape`) stands out of the nose from about 2 m up: its front 1.4 m
  wide (0.7 m half width to 2.9 m, rounded over its crown), the profile's depth across it, then an
  upright side wall 0.08 m across (one column of the corner arc, the corner's radius set so the face
  ends there) running straight back to 6.6 - 7.6 m, the nose beside it falling back to a valley
  behind the wall; blended in over 1.93 - 2.12 m and out into the roof over 3.0 - 3.1 m.
- **Paint** - edges in [y, d] (`paint`): the red over the snout and nose, its lower sweep rising from
  1.03 m (2 m back) to a point 10.9 m back at 2.0 m; the white wedge from a point at the headlights
  (4.4 m, 1.43 m) up to the roof's edge, the silver arrow line along its top; the grey line under the
  windows (2.02 - 2.09 m) along the body; the red roof over a silver band (3.1 - 3.2 m). The canopy's glass
  (`e6Glass`, a dark blue-grey, reflective) is `paint` in side elevation, kept to the canopy by `lat`:
  its foot level at 2.19 m from the front back to 6.9 m, its rear end rounding up into the crown, so
  the windscreen wraps from the front into the side windows in one piece, in a thin black frame
  (`cabMask`, from 2.13 m) round it; two wipers on the front. The headlights' long dark lens (4.5 - 6.5 m, 1.48 - 2.05 m)
  with two lamps at its front. A low white pilot under the nose (0.2 m high, 1.9 - 5.2 m back) and beige
  equipment covers from 5.3 m back, down to 0.42 m (`B`).
- **Sides** - windows 0.55 m wide, 2.16 - 2.66 m, 0.9 m apart: seven on the end car (E621), sixteen on
  an intermediate car; doors 0.85 m wide with a 0.3 m window high in the leaf, behind the nose and at the
  end car's rear, at the front of an intermediate car (its toilets at the rear); the LED destination
  display beside each. Bogies 6.7 m and 20.85 m behind the tip; centred on the intermediate cars.
- **Liveries** - `komachi` as above; `akita` keeps its white roof and red lines, with the same red nose.
- About 15,500 triangles the end car, 8,400 an intermediate car.


## The N700S

Measured from the photographs in `assets/shinkansen-n700s/` (SOURCES.md lists the measurements). The end is
a cab face joined to the body 9.0 m behind the tip, where the canopy reaches the roof; its depth is
`n7Reshape`: the farther of a broad, rounded snout (the tip 1.0 m high, a deep U in plan, the chin curving
under to 0.3 m) and the top surface, the higher of the wing body - a shallow valley on the centre line, the
two crests at 1.1 - 1.5 m from it rising from the headlights (1.56 m high 0.6 m behind the tip) to the body's
shoulder at the join - and the canopy, a narrow spine out of the valley that widens into the cab's bubble
(the windscreen's foot 2.3 m high 3.9 m behind the tip, 2.9 m at 5 m, 3.3 m at 7 m), blended by a smooth
maximum. The windscreen (J30, J22; 1.6 m across, 2.29 - 2.98 m high) is painted on the bubble as
outlines seen head-on, so they stay smooth on the curved canopy: a grey frame (`screenFrame`; black on the
JR Kyushu canopy), its top nearly level under the crown and its ends rounded, holding a wide centre pane
of lighter blue-green glass (`n7Glass`, no centre pillar, one wiper parked up it from a pivot near the
bottom) and, behind a pillar each side, a dark D-shaped side pane wrapping round the canopy's corner, its
outer edge leaning in toward the top; the almond headlights
(clear covers, black rims) fields on the snout's upper corners. The leading bogie stands under the canopy
6.1 m behind the tip, 17.5 m ahead of the rear one; the skirts hang to 0.3 m (no underfloor box), the skirt
colour to 0.9 m. Side: the crew door 9.15 - 9.75 m behind the tip, the front passenger door, 13 windows
0.5 m wide at the 1.04 m seat pitch, the rear door; an intermediate car a door at each end and 20 windows.
JR Central: the wide blue line (1.80 - 2.0 m) and the thin one (1.62 - 1.70 m) under the windows, the wide
one ending in a point just ahead of the crew door, and the blade ahead of it (from 5.45 m up to 2.14 m at
8.1 m); silver-grey skirts. JR Kyushu ("Kamome", 2022): red below 0.9 m, a thin red line dipping along the
nose, the canopy black: one oval round the windscreen, a livery's `faceFields` (polygons on the cab face
seen head-on, under the face's own fields). The pantograph stands on a streamlined cover.

## The E4 Max

Drawn from photographs (assets/shinkansen-e4/SOURCES.md, with the measurements): the end car's 11.5 m
nose is a cab face (`E4_FACE`, `dJoin` 11.5, its coupling plane at the tip): a rounded beak 2.1 m wide
standing out at the bottom (tip 1.18 m, a bow of 1.1 m in plan, its outline a light crease painted head on),
the shelf over it at 2.0 - 2.3 m with the oval lamp housings on its broad corners, the eye-shaped
windscreen high on the head (2.6 - 3.1 m, 4.0 - 5.1 m behind the tip), the dome to the roof. The line
(yellow on `max`, pink on `toki`: one place, only the colour changed in 2014) runs at 2.08 - 2.37 m and
falls along the nose's sides to the beak's rim (`paint` edges `E4_LINE_TOP`/`E4_LINE_BOTTOM`). Two windows
rows on every car, by photo (`layout`): the end car's four a deck behind the nose and its one door near the
rear, two narrow crew doors on the nose's sides (`e4Fittings`; the small window first on the left side, the
tall one first on the right); the intermediate car's toilet windows across the line, two doors, six windows
a deck and the two-leaf hatch at its rear end (`sidePanels`). The leading bogie stands under the nose
(`endBogies` -6.64 m behind the body), 17.5 m ahead of the rear one. The distant model has its own coarse
nose (`lod` with `cornerDepth`) without the face's glass, so that the line stays within its 100 triangles.
Deviations: the hollow beside the head is shallower than the real one (the nose's doors need the flat side
from 8 m back); every intermediate car is the E455 type; the roof's raised covers are not drawn.

## Deviations

Every design's nose is a cab face measured from photographs (its section above, its
`assets/shinkansen-*/SOURCES.md`). The bodies' widths are narrowed to the gauge (above). What each still
leaves out:

- **N700S** - no projective fit was possible on its side-on photograph (lengths along the nose stretched to
  the crew door's place); the windscreen is paint, flush with the canopy (the real frame is a shallow
  recess); the JR Kyushu canopy's thin gold edging, its emblems and lettering and the pantograph's two roof
  fins are not drawn; the windows have square ends.
- **E5** - the sculpted white cheek is painted, not shaped; the hatch seam kinks where the white jaw meets
  the green hood; the pantographs lack their noise shields; the doors' green edge lines are not drawn.
- **500** - the canopy is paint on the nose's own surface, not a separate bubble; the lower snout's lip under
  the crease does not stand proud; the "JR500 WEST JAPAN" lettering is not drawn; the W sets' pantograph
  shroud is two low walls, not the full noise screen; the bogies show through the kit's skirt cuts on the
  rear bogie and the middle cars, where the real cars carry bogie covers.
- **700 / 923** - the beak is no wider than the body, and the hump's waist is one straight flare at each
  height; the distant model ignores `planInset` and carries the side bands on to the nose's tip; the 923's
  measurement dome and observation windows are not drawn; the middle cars' pantograph has no fairing.
- **E6** - the crown reaches full height at 11.95 m instead of about 13 m (the door's position); the upper
  arc of the coupler-cover seam is not drawn; the pilot is a flat-sided slab; the pantograph has no noise
  shields; the `akita` livery has no photographed prototype.
- **100** - the cab canopy's side panes sit on the nose's corners (the real canopy is set in from the sides);
  the blue apron along the cars is shallower than the real one; the pantograph shroud, the small toilet
  windows and the Grand Hikari scheme are not drawn (`jrWest` is the Kodama renewal).
- **E4** - see its section above (the hollow beside the head, the intermediate cars, the roof covers).

## Checking

`pnpm exec vitest run test/shinkansen.test.ts` (ids, parameters and two liveries each; the end
and middle cars at their lengths, inside the gauge and 16,000 triangles, without coplanar
faces, on two bogies, the pantograph raised to the wire; the sampled trains at their
formation's length, one section a car; the formation's pantographs and the turned rear car).
