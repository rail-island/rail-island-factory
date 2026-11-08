# North American carbody locomotives and the Acela

**Covers** - the streamlined North American designs (`proc-vehicle-emd-f7`, `proc-vehicle-emd-f40ph`, `proc-vehicle-ge-p42dc`, `proc-vehicle-siemens-alc42`, `proc-vehicle-prr-gg1`, `proc-vehicle-amtrak-superliner`, `proc-vehicle-amtrak-acela`): measures, liveries, the carbody kit they are lofted with, the Acela's cars and train, deviations and tests.
**Code** - `generator/usCarbodies.ts` (`US_CARBODIES`), `generator/carbodyKit.ts`, `generator/sliceBody.ts`, `test/usCarbodies.test.ts`, `assets/emd-f7/`, `assets/emd-f40ph/`, `assets/ge-p42dc/`, `assets/siemens-alc42/`, `assets/prr-gg1/`, `assets/amtrak-superliner/`, `assets/amtrak-acela/`
**See also** - [us-diesels.md](us-diesels.md), [loading-gauge.md](loading-gauge.md), [shinkansen-0.md](shinkansen-0.md), [vehicles.md](vehicles.md), [openttd-figures.md](openttd-figures.md)

## The designs

| id | title | parameters (default first) | over couplers | triangles |
|---|---|---|---|---|
| `proc-vehicle-emd-f7` | EMD F7 | `livery`: `santaFe` (red warbonnet), `unionPacific`, `southernPacific` (Daylight); `unit`: `aUnit` (cab), `bUnit` (booster), `train` (`cars` 2 A-B, 3 A-B-A, 4 A-B-B-A) | 15.44 m A, 15.24 m B | about 11,000 - 13,000 a unit |
| `proc-vehicle-emd-f40ph` | EMD F40PH (draft) | `livery`: `phaseIII`, `phaseII` | 17.12 m | about 11,000 |
| `proc-vehicle-ge-p42dc` | GE P42DC Genesis | `livery`: `phaseV`, `phaseIII`, `via` | 21.03 m | 8,400 - 8,800 |
| `proc-vehicle-siemens-alc42` | Siemens ALC-42 Charger | `livery`: `phaseVII`, `midwest` (the SC-44's Amtrak Midwest scheme) | 21.79 m | about 13,800 |
| `proc-vehicle-prr-gg1` | PRR GG1 | `livery`: `brunswick`, `tuscan`, `pennCentral` | 24.23 m | 13,300 - 14,400 |
| `proc-vehicle-amtrak-superliner` | Amtrak Superliner | `unit`: `coach`, `sleeper` | 25.91 m | 8,500 - 8,700 |
| `proc-vehicle-amtrak-acela` | Acela Express | `unit`: `powerCar`, `businessClass`, `firstClass`, `cafe`, `train` (`cars` 3 - 8, default 4) | 21.22 m power car, 26.64 m coach | 7,200 - 10,200 a car |

All are drawn at their real size to the US loading gauge ([loading-gauge.md](loading-gauge.md)),
3.04 - 3.24 m wide. The F7, F40PH, P42DC and ALC-42 are diesel locomotives (`DIESEL_LOCO_CATALOG`),
the GG1 an electric locomotive (`ELECTRIC_LOCO_CATALOG`), the Superliner a coach (`COACH_CATALOG`), the Acela an electric trainset
(`EMU_CATALOG`). All have AAR knuckle couplers (`knuckleCoupler`, usHoodKit.ts) and US trucks
(the diesel toolkit's bogie); the GG1 has its own 2-C+C-2 running gear.

## The carbody kit (`carbodyKit.ts`)

A body is a `CarbodySpec`: the flat body's section (belly, shoulder, crown, the skirt and the
lower body's foot, the side's lean) and, at either end, a `NoseShape`: a plan that rounds from
a blunt tip to the full width over `len` (a superellipse of `power`), and tables over d (metres
from the tip) of the crown, shoulder, belly, skirt top and skirt bottom; past a table's last row
the body's own value holds. A double-ended body (the GG1) has a nose at both ends; a flat end
is a wall. `cuts` lift the skirt over the trucks; with `cutRadius` the skirt's edge rounds up
into an arch at each end of a cut that lies on the body (a quarter ellipse over that length,
four stations round it; default 0, a square drop); `stations` adds stations (a painted field's
edges). `carbody(spec)` turns it into a `SliceBody`
(sliceBody.ts) with stations dense in the noses, and `carbodyShell` lofts it with every face
painted by a `Painter` - a function of the face's d, its height and its region - so a livery is
horizontal bands (`bandPainter`), a nose field and decals laid on the lofted surface
(`sideDecal`, `stripDecal`: the warbonnet's band, the GG1's pinstripes). Windscreens are
`crownPane`s, or shaped ones (`shapedCrownPane` over a `roundedPane` outline: the pane's inner
and outer edge as functions of d, its corners rounded, its outer edge tapering toward the roof),
cab windows and grilles `sidePanel`s, portholes `surfaceDisc`s; nose lamps stand where the centre
line reaches their height (`noseLamps`), on the nose's flank (`flankLamp`) or on its crown,
turned from the surface toward the front (`crownLamp`); a number board stands out of the
nose along the surface's chord (`chordBox`).

## The models

- **EMD F7** - the A unit: the bulldog nose rising to the low raked windscreen under the cab
  roof's brow: two wide, low panes either side of the centre post (about 1.1 m wide and 0.48 m
  up the rake, 3.96 - 4.3 m at the centre post, under a thin brow), their outer edge slanting in toward the roof
  and its corners rounded, each in a rubber gasket and a frame of the cab's paint;
  the headlight in its hood on top of the nose, the second light in the nose door,
  red class lights on the nose's corners and the number boards standing out of its flanks; the
  cab roof over the carbody's; along the top of the side a band of filter grilles (framed
  vents of vertical slats in the metal's grey, not windows) and under it the round portholes
  (two on the A unit, three on the B); three radiator fans, the dynamic brake fan and exhaust,
  the pilot, a rear diaphragm. The B unit (`bUnit`, 50 ft) is the same engine room between
  two flat ends with diaphragms, no cab and no lamps. `train` is a set of units (`f7Set`):
  the A unit leading, B units behind, and with three or more units a second A unit turned at
  the rear; drawn as an articulated vehicle (`articulate`, tramKit.ts) hinged at the coupling
  planes with a diaphragm over each gap, each unit on its own two trucks.
  **Santa Fe's warbonnet**: the red cab, its roof too; the red bonnet carried back under the
  shoulder to its rounded tail, the silver tongue reaching forward into it over the red stripe
  that runs the whole length (on the B unit too), every edge against the silver outlined in
  yellow; on the nose the yellow stripe down its middle from the yellow headlight hood with
  black pinstripes between the lamps, the yellow oval herald outlined in black and lettered
  SANTA FE, and the yellow whiskers with black pinstripes running back along both flanks
  (`santaFeNose`: decals laid on the lofted nose seen from the front, `frontDecal`, in one
  layer of pieces side by side - the stripe cut round the herald, its black ring round its
  yellow field - so none sinks into another where the blunt tip meets the rounded nose).
- **EMD F40PH** - Amtrak's cowl unit of 1976: the tall short nose with chamfered corners and
  the twin headlight, the raked two-pane windscreen under the number boards and red markers,
  the cab's two side windows and door, the full-width body with vertical sides, the inertial
  filter and dynamic brake grilles behind the cab, the long radiator grille along the rear,
  the dynamic brake blister and its fan, the exhaust and two large radiator fans, the pilots,
  fuel tank and two Blomberg trucks. Phase III: silver, the blue, white and red stripes, the
  black nose top, cab front and cab roof (anti-glare, as on Kato's model), black frame and
  pilots, the lower-case "Amtrak" wordmark drawn as bold bars (`wordmark`) on the side and the
  nose; on the roof the dynamic brake blister with its louvres and fan, the exhaust, two
  radiator fans under barred guards, a five-chime horn, the bell and an antenna; Phase II (as delivered) the same with narrower stripes set higher.
  A draft in the workshop.
- **GE P42DC** - the Genesis's angular nose with its chamfered corners and long raked
  windscreen, the side grilles, three roof fans, the skirt cut over the trucks.
- **Siemens ALC-42** - measured from 304 (a side from above, 59 px/m), 363, 315, 331 and SC-44
  4610 (assets/siemens-alc42/). The body behind the cab is the kit's flat section (upright sides
  to the crease at 3.68 m, the upper panel and roof as a three-facet arc to 4.39 m); the whole
  cab, 4.6 m back from the tip, is one painted cab face (seriesCab.ts `drawCabFace`): the lower
  face upright and bowed at the ditch lights, the windscreen raked 38 degrees in a shallow vee,
  wide shallow corners as the pillars leaning in (the face about 0.35 m narrower each side at
  the windscreen's head than at the lamps, 331; `planInset`), the raked cab side window, door, handrails and mirror.
  Phase VII: midnight blue, the red cab top over the white sweep from the face's vee to the roof
  behind the door, the white swoosh (foot at 9.4 m, top at 11.6 m) ahead of the lighter blue
  rear, the red and white foot stripe; the black windscreen surround down to the vee, the
  headlights in a black housing and each ditch light pair in an almond housing standing out of
  the face (red inward, white outward), the red-striped anticlimber over the MU sockets (blue
  and red), hoses, the end sill either side of the coupler pocket and the plough; the logo on the
  face and sides. Midwest: silver over a dark grey foot and red stripe, the blue cab under its
  white sweep, the black surround over the roof, the dots fading back from the cab, two white
  lines. The red and white rear chevron of photo 304 is Phase VI (301 - 308), not drawn; Phase
  VII units (309 on, 363) end in the plain lighter blue. Sides differ as photographed: the left one has the louvred radiator intake (6.1 - 7.4
  m) and the eight-pane filter panel behind the X intake (11.75 - 15.15 m), the right one
  neither. Roof: cab hatch, horns, hatches, exhaust at 8.15 m, the radiator mesh with two fans
  over the X intakes.
- **PRR GG1** - the welded streamlined body, the hoods falling from the centre cab to both
  rounded noses, two diamond pantographs over the cab's ends (the rear one raised to the
  game's wire, the front one folded), and the running gear: on each half three 57 in drivers
  and the two-axle guiding truck under one frame, a bogie node each. The five gold
  pinstripes gather into the "cat whiskers" at both noses.
- **Amtrak Superliner** - the bi-level long-distance car (built from the user's reference and
  photographs): 85 ft long and 16 ft 2 in high, its fluted lower body (thin dark lines on the
  stainless steel, broken by the door and the lower windows), the Phase IV stripes - a red
  line low, two red lines over the blue band under the upper deck's windows - and the low centre
  door on each side, a plug door opening onto the car's cabin (`plugDoor`, shared with the
  Acela's coaches). The coach has 12 large upper windows a side and four on the lower deck,
  the sleeper 14 smaller upper and six lower ones. Diaphragms at the upper deck's height.
- **Acela Express** - the power car's long sloping nose, blunt and rounded at its tip; the
  black mask sweeping across it and over the shoulders with the two-pane windscreen inside
  it, a teardrop cab window on each side behind the mask's pillar, and under the windscreen
  the blue band, its lower edge a smile, holding the four round headlights in a row; the
  power car's sides silver (the coaches' dark window band left out), its single-arm
  pantograph (raised) and grilles; the coaches' window bands (business class 13 windows a
  side, first class 11 wider ones, the cafe 8) and end doors. `train` is an articulated set
  (`articulate`, tramKit.ts): a power car at each end, the rear one turned, first class behind
  the leading power car, the cafe in the middle of five or more cars (`acelaTrain`), bellows
  between the cars, each car on its own two trucks.

## Liveries

Simplified schemes: colour fields, stripes and plain stroke letters, no heralds or logos
(but the F40PH's Amtrak wordmark and the F7's Santa Fe nose herald).
Running numbers are illustrative, but for the GG1's preserved 4935 and 4800.

## Deviations

- The trucks are the diesel toolkit's generic cast truck (the Acela's and the Charger's are
  not modelled in detail); the Acela's tilt is not drawn.
- The P42DC's and ALC-42's interiors and the Acela's cabins are not drawn. The F7 set's units
  are hinged as one articulated vehicle, not coupled loose.
- The GG1's quill drive and its frames are simplified; its wheels have six spokes.

## Checking

`pnpm exec vitest run test/usCarbodies.test.ts` (ids, references, short value titles; every
livery at its published length, inside the US gauge and 16,000 triangles, without coplanar
faces, its axles and two supports, the fixed parts under the gauge's height; the GG1's two
pantographs; the F7's low windscreen, grilles over the portholes, Santa Fe herald, B unit and sets (formations, lengths, sections, joints, supports, distant models); the Acela's formations, train lengths and sections, each car on two trucks;
deterministic bytes and the distant models). The pantographs are also in
`test/pantographs.test.ts`.
