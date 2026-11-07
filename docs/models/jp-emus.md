# Japanese conventional-line electric units

**Covers** - the seven Japanese narrow-gauge-line units (`proc-vehicle-jr-e235`, `-jnr-103`, `-odakyu-gse`, `-kintetsu-hinotori`, `-jr-e259`, `-jnr-485`, `-hankyu-9000`): their series specs on the Shinkansen series kit, the commuter doors and flat cabs, liveries, the gauge and tests.
**Code** - `generator/jpEmus.ts` (`JP_EMUS`, `JP_EMU_SERIES`), `generator/jrE259.ts` (the E259), `generator/shinkansen.ts` (`ShinkansenSeries`, `buildSeries`, `seriesDesign`), `generator/usTransit.ts` (`drawCar`), `test/jpEmus.test.ts`, `assets/jr-e235/`, `assets/jnr-103/`, `assets/odakyu-gse/`, `assets/kintetsu-hinotori/`, `assets/jr-e259/`, `assets/jnr-485/`, `assets/hankyu-9000/`
**See also** - [shinkansen.md](shinkansen.md), [jnr-locos.md](jnr-locos.md), [jr-kiha40.md](jr-kiha40.md), [us-transit.md](us-transit.md)

## The designs

| id | title | `livery` (default first) | car (end / middle) | front |
|---|---|---|---|---|
| `proc-vehicle-jr-e235` | JR E235 | `yamanote`, `yokosuka` | 20.0 / 20.0 m, 4 doors a side | cab face (`cabFace`) |
| `proc-vehicle-jnr-103` | JNR 103 series | `chuo`, `yamanote` | 20.0 / 20.0 m, 4 doors | the low cab (`cabFace`), diamond pantograph |
| `proc-vehicle-odakyu-gse` | Odakyu Romancecar GSE | `rose`, `lse` | 19.6 / 16.0 m | the observation nose |
| `proc-vehicle-kintetsu-hinotori` | Kintetsu Hinotori | `hinotori`, `ace` | 21.6 / 20.5 m | cab face: raked windscreen, upper glass, LED bar, red frame |
| `proc-vehicle-jr-e259` | JR E259 Narita Express | `nex`, `original` | 21.43 / 20.5 m | cab face with gangway door |
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

## The E235

Built from five photographs and the published figures (assets/jr-e235/SOURCES.md, with the
measurements). The body is upright from the waist knuckle at 1.8 m (`lean: 1`, as the real
"sustina" body with its gutter built into the side) and tucked in below it to 0.9 m.

- **Face** - a `cabFace` (`E235_FACE`) as wide as the body: upright, plan corners rounded 0.25 m,
  the lower lip curving back under it and the crown over to the roof. The livery's frame colour
  (`frame`) covers it and wraps 0.7 m back along the cab sides (`wrap`, `dJoin: 0.7`). One black
  field 1.96 - 3.51 m (half width 1.37 m, top corners rounded) holds the destination board, the LED
  head and tail lamps at its top corners and the big windscreen (2.17 - 3.19 m, its own lighter
  `screen` glass). Under it the halftone: square decals of `dotBottom` growing downward over a
  `dotTop` ground (Yamanote green dots on black, Yokosuka blue dots on cream). No gangway door.
- **Sides** - `layout` from JR East's door pitch (centres 4.82 m apart, the outer ones 2.52 m from
  the body's ends; the cab car's first door 3.6 m ahead of its second), each door as two leaves
  sliding apart with a narrow window each; one 1.9 m window between doors, 0.8 m ones at the ends;
  the cab window and the crew door's outline and window; the JR emblem.
- **Liveries** - `yamanote`: plain stainless, green door leaves and green panels over them under the
  eaves (`overDoors`); `yokosuka` (E235-1000): cream-over-blue stripes under the windows and under
  the eaves, stainless doors, the blue face.
- **Fittings** (`e235Fittings`) - the roof's air conditioner, two antennas on the cab roof, the
  skirt under the face with its cheeks, the coupler under the face (the kit draws none at a cab
  face), the underfloor boxes. The bogies sit at the real positions on the 19.57 m body
  (`endBogies`), the single-arm pantograph over the middle car's rear bogie (`pantographAt`).

## The 103 series

The low-cab Kuha 103 with the twin sealed-beam headlight and the AU75 air conditioner (1970s - 2000s;
Kuha 103-1, -149, -188, -178 in `assets/jnr-103/`), built on a `cabFace` (`S103_FACE`) measured on the
head-on photo of Kuha 103-188 at 235 px/m:

- **Face** - upright from the body's foot (1.0 m) to 3.3 m, then rounding over into the roof by 0.35 m
  (`dJoin`); plan corners 0.13 m. No gangway door (the 103 front is non-gangway). Three windscreens of one
  height (2.12 - 2.82 m, pillars at lat +-0.41) in a recessed frame (2.03 - 2.89 m, painted a darker
  shade, the grey sash inside it); the train-number box (lat -1.10 - -0.54) and the destination box
  (0.48 - 1.16) over it in silver frames; the twin sealed beams in a housing on the forehead
  (centre 3.445 m, 0.56 x 0.30 m); the tail lights in round housings at lat +-1.11, 1.23 m; two footsteps
  and the step plate over the coupler; wipers.
- **Sides** - by a projective fit over Kuha 103-178's four doors: door pitch 4.78 m, the Kuha's door
  centres 2.52 m behind the face, the intermediate car's 2.58 m behind its end; a door-pocket window beside
  each door (0.43 m), the two-pane window pair between (two 0.92 m sashes with their aluminium frames and
  meeting rail), one window and its pocket at the plain end; windows 1.97 - 2.78 m, doors 1.17 - 2.97 m with
  a 0.40 m window on each leaf. The crew door 0.45 - 1.03 m behind the face with its window and grab rail.
- **Roof and running gear** - the AU75 across the car's middle (4.6 m), flat ventilators, the rain gutters;
  the PS16 diamond pantograph over the Moha's rear bogie, one in the 4-car Kuha-Moha-Moha-Kuha set
  (`onePantograph`); bogies 13.8 m apart centred on the 19.5 m body; the equipment boxes underneath.

## JR E259

`generator/jrE259.ts`, from the photographs and figures in `assets/jr-e259/SOURCES.md`. The end car
is the Kuro E259 (the Green car): 21.43 m over the couplers (body 21.0 m), the intermediate car the
Moha E259, 20.5 m (body 20.0 m); 2.946 m wide, roof 3.655 m.

- **Cab face** (`cabFace`, joined 3.6 m behind the tip): flat and white across the gangway door
  (1.4 m wide, 0.95 - 3.13 m) and leaning back 0.15 m; corners rounding back 0.9 m with the black
  lamp housings on them (lat +-0.97 m, 1.96 - 2.62 m); the windscreen 3.16 - 3.61 m in a black
  surround, raked back to 1.75 m behind the tip; the white pillars beside it; the black cap over the
  cab (the face's band above the 3.2 m shoulder, `endRoofEdge` to 5.2 m), then the white cab roof up
  to the carmine roof's slanted edge (`capSlope`: 8.4 m at the shoulder, 6.8 m at the crown).
- **Cab side window**: a wedge on the face's sides (`endSweeps`, glass in a white surround) from
  0.8 m behind the tip to its point at 3.4 m, 2.86 - 3.44 m high.
- **Skirt** (`fittings`): white corner fairings over a black lip, the dark coupler pocket between
  them and the coupler reaching the coupling plane.
- **Sides** (`layout`): the end car's crew door (a seam and its window, 4.05 - 4.75 m behind the
  tip), the passenger door (5.0 - 5.95 m), the Green saloon's window 8.7 - 16.0 m and a small one
  near the rear; the intermediate car's doors 0.55 m from each end and the continuous window
  3.5 - 17.6 m. Window glass and the black over it up to the shoulder are one dark frame
  (1.84 - 3.17 m), the carmine roof coming down the curved upper side to the 3.2 m shoulder just
  over it (0.45 m seen side-on, as in the side photographs). The carmine is `#d4325c`, the crimson
  the sunlit photographs show, not the published #e30304, which renders orange-red. Bogies 13.8 m apart, the end car's leading one under its doors; the single-arm
  pantograph over the Moha's rear bogie.
- **Liveries**: `nex` is the renewed livery of 2023 (the door silver with "SERIES E259", the
  same at the end car's rear); `original` the 2009 one (the door black with the vertical white
  N'EX, its red diamond and the grey aeroplane; the red NEX over the cab's doors). Both faces carry
  both markings, the unused one in the door's own paint.
- **Distant model**: the face's white and black, the black cap over the cab as a block (`lodRoof`,
  to 5.2 m behind the tip); the white strip behind it is left to the full model.
- **Deviations**: the Moha E259 500's second (spare) pantograph is not drawn, the pantographs sit on
  the kit's cars (the 2nd and next-to-last); the apostrophe of N'EX on the side is left out (no
  glyph); the red roof's slanted edge is drawn in 16 strips (a fine step from above); the other end
  car (the Kuha E258) is the Kuro mirrored; the front coupler sits at the kit's 1.0 m (real 0.88 m).

## Kintetsu Hinotori

Measured from the photographs in `assets/kintetsu-hinotori/` (SOURCES.md: a near side view at
about 145 px/m, overlaid on the model's side view to check it, and three front three-quarter
views) and the published figures: 21.6 m end cars and 20.5 m intermediate cars over the couplers,
2.79 m wide, roof 3.74 m.

- **Front** - a cab face (`HINO_FACE`, `cabFace`), the body square 3.0 m behind the tip. The
  profile: the face foremost at 0.95 m, the LED headlight bar (two rows of twenty, 1.5 - 1.66 m)
  0.28 m back, the windscreen from 1.98 m (0.64 m back) to 3.05 m (1.68 m back), about 45 degrees,
  the upper glass the premium passengers look through over it to 3.6 m, the roof at full height
  3.0 m behind the tip. A dark grey panel (half width 1.0 m) holds them; the red frame round it
  runs up the corners and back along the roof's edge as the red line (3.12 - 3.38 m) under the
  dark roof. Under the face a red bumper (`hinotoriFittings`) down to 0.2 m and 2.3 - 2.5 m deep,
  the coupler's black recess (1.12 m wide) in it, the coupler retracted there.
- **Sides** - the semi-transparent black window band 1.93 - 3.12 m with fine dark lines under it,
  the gold line at 1.36 - 1.395 m; on the cab sides (`endSweeps`) the frame's red, the dark field
  down to 1.55 m and the raked cab side window. The end car (the premium car): the narrow crew door
  3.2 - 3.78 m behind the tip with its grab rails, seven windows at the 1.3 m seat pitch
  (2.12 - 3.08 m, the high-decker's), the passengers' door at the rear deck, the gold phoenix logo
  and "HINOTORI" beside both doors. The intermediate car: one door at its +X end, seven long
  windows. The leading bogie 3.9 m behind the tip, under the crew door; 14.15 m bogie centres.
- **Liveries** - `hinotori` (metallic red #ad2320, gold #c29d3b); `ace` puts the Kintetsu
  limited express colours of the 22600 "Ace" (orange over navy with a white line, a grey roof) on
  the same body, without the phoenix (drawn there in the band's own orange).
- **Gauge** - unlike the other units here the prototype runs on 1,435 mm track (Kintetsu's Osaka and
  Nagoya lines), so the wheelsets are real.
- **Deviations** - the roof reaches full height 3.0 m behind the tip, about 0.8 m sooner than on the
  prototype (the cab face must meet the body before the crew door); the end car's windows are the
  same height as the intermediate car's (the distant model draws one window row); the premium
  car's real rear layout (lockers, toilet) behind the passengers' door is a plain dark band; the
  pantograph stands at the kit's default place on each intermediate car.

## Deviations

- The GSE's and the Hinotori's real cars are articulated or on their own bogies in ways the kit
  approximates with two bogies a car; the GSE's raised driver's cab over the saloon is the
  nose's crown.
- The E259's wrap-round windows and the 103's later variants are simplified.
- The E235: the side windows' rounded corners are square (the kit's windows are rectangles); the
  destination board is unlit; the halftone is coarser than the real one (7 rows of 0.077 m dots);
  the distant model shows no green doors (the series LOD paints only bands); the end car's body is
  0.1 m longer behind the cab than the real one (the face's tip 0.07 m from the coupling plane, the
  kit's length check). The lamps sit at the face's top corners and there is no gangway door, as in
  every photograph of the -0 and -1000 subseries.
- The E235's and E259's wrap-round windows are simplified. The 103 is one version (the low cab, twin
  sealed beams, AU75); its high-cab ATC cars, the single round headlight and the non-cooled roof are not
  drawn. The kit's elliptic roof arc gives its face slightly tighter top corners than the real roof's;
  the coupler plane stands 0.13 m ahead of the face (0.25 m on the real car), so the body is 19.62 m long.
  Longer trains still raise one pantograph.
- The E235's wrap-round windows and the 103's later variants are simplified.

## Checking

`pnpm exec vitest run test/jpEmus.test.ts` (ids, parameters and two liveries each; the end and
middle cars at their lengths and real widths inside the UIC gauge, in budget, without coplanar
faces, on two bogies, the middle car's pantograph raised; the commuter cars' four doors).
