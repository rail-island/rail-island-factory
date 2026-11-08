# North American carbody locomotives and the Acela

**Covers** - the streamlined North American designs (`proc-vehicle-emd-f7`, `proc-vehicle-emd-f40ph`, `proc-vehicle-ge-p42dc`, `proc-vehicle-siemens-alc42`, `proc-vehicle-prr-gg1`, `proc-vehicle-amtrak-superliner`, `proc-vehicle-amtrak-acela`): measures, liveries, the carbody kit they are lofted with, the Acela's cars and train, deviations and tests.
**Code** - `generator/usCarbodies.ts` (`US_CARBODIES`), `generator/carbodyKit.ts`, `generator/sliceBody.ts`, `generator/seriesCab.ts` (the Acela's cab face), `test/usCarbodies.test.ts`, `assets/emd-f7/`, `assets/emd-f40ph/`, `assets/ge-p42dc/`, `assets/siemens-alc42/`, `assets/prr-gg1/`, `assets/amtrak-superliner/`, `assets/amtrak-acela/`
**See also** - [us-diesels.md](us-diesels.md), [loading-gauge.md](loading-gauge.md), [shinkansen-0.md](shinkansen-0.md), [vehicles.md](vehicles.md), [openttd-figures.md](openttd-figures.md)

## The designs

| id | title | parameters (default first) | over couplers | triangles |
|---|---|---|---|---|
| `proc-vehicle-emd-f7` | EMD F7 | `livery`: `santaFe` (red warbonnet), `unionPacific`, `southernPacific` (Daylight); `unit`: `aUnit` (cab), `bUnit` (booster), `train` (`cars` 2 A-B, 3 A-B-A, 4 A-B-B-A) | 15.44 m A, 15.24 m B | about 11,000 - 13,000 a unit |
| `proc-vehicle-emd-f40ph` | EMD F40PH (draft) | `livery`: `phaseIII`, `phaseII` | 17.12 m | about 11,000 |
| `proc-vehicle-ge-p42dc` | GE P42DC Genesis | `livery`: `phaseV`, `phaseIII`, `via` | 21.03 m | 12,400 - 13,600 |
| `proc-vehicle-siemens-alc42` | Siemens ALC-42 Charger | `livery`: `phaseVII`, `midwest` (the SC-44's Amtrak Midwest scheme) | 21.79 m | about 13,800 |
| `proc-vehicle-prr-gg1` | PRR GG1 | `livery`: `brunswick`, `tuscan`, `pennCentral` | 24.23 m | 12,700 - 13,700 |
| `proc-vehicle-amtrak-superliner` | Amtrak Superliner | `unit`: `coach`, `sleeper` | 25.91 m | 11,500 - 11,600 |
| `proc-vehicle-amtrak-acela` | Acela Express | `unit`: `powerCar`, `businessClass`, `firstClass`, `cafe`, `train` (`cars` 3 - 8, default 4) | 21.22 m power car, 26.64 m coach | about 15,300 the power car, 6,800 - 7,200 a coach |

All are drawn at their real size to the US loading gauge ([loading-gauge.md](loading-gauge.md)),
3.04 - 3.24 m wide. The F7, F40PH, P42DC and ALC-42 are diesel locomotives (`DIESEL_LOCO_CATALOG`),
the GG1 an electric locomotive (`ELECTRIC_LOCO_CATALOG`), the Superliner a coach (`COACH_CATALOG`), the Acela an electric trainset
(`EMU_CATALOG`). All have AAR knuckle couplers (`knuckleCoupler`, usHoodKit.ts) and US trucks
(the diesel toolkit's bogie); the GG1 has its own 2-C+C-2 running gear.

## The carbody kit (`carbodyKit.ts`)

A body is a `CarbodySpec`: the flat body's section (belly, shoulder, crown, the skirt and the
lower body's foot, the side's lean; with `roofPower` the roof arc is a superellipse, flatter with
tighter corners, instead of a quarter ellipse) and, at either end, a `NoseShape`: a plan that rounds from
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
- **GE P42DC** - measured from photographs (assets/ge-p42dc/SOURCES.md: 167's near-orthographic
  side at 51 px/m, 27 head-on at 136 px/m). Its own slice body (`p42Body`) on the slice kit with
  the section's top drawn by `arcProfile`: the side vertical from the frame to the crease at
  3.30 m, the upper band leaning in to 4.02 m (it holds the cab windows and the louvres), the
  roof's rounded edge to the 4.37 m crown. The face: vertical up to the knee at 2.15 m, then
  raked at 58.6 degrees (1.64 m up per metre back) to the roof 1.4 m behind the apex; in plan a
  shallow V (the corners 0.27 m behind the apex at 1.27 m half width) with 45-degree corner
  chamfers to the full width. On the face's planes: two windscreen panes (3.53 - 3.97 m, 1.13 m
  wide) with wipers, the number board standing out of the V, the twin headlights in their
  pocket, red markers; on the knee's V the ditch lights and the lamp boxes; the plow following
  the V. The sides (the left and right differ in the louvres behind the cab: two framed filters
  on the left, one fine grille on the right): the two-pane cab window with its mirror plate,
  the narrow cab door up through the band with its window, step well, handrails and ladder, the
  cabinet with its grille and the hatch by the nose, the engine room's louvres along the band
  (4.15 - 8.79 m), its hatch, the band louvre at 14.15 m, the four radiator intakes over the
  rear truck, the rear side door; the fairing between the trucks down to 0.72 m with the
  reservoirs and battery box under its tail. The rear end: the door left of centre, twin
  headlights above it, markers, the painted number. The roof: horn and antennas on the cab, the
  exhaust, the radiator hatch with two fans. The GE (Krupp-design) trucks: fish-belly side
  frames, coil springs either side of each axle box, dampers, traction rods. Liveries: **Phase V**
  (unit 78) silver over a thin red stripe and grey skirt, the blue face above a V under the
  headlights, the blue running down the cab side to the door and over the roof, the swoosh
  coming down the rear band, the side's AMTRAK and travel mark; **Phase III** (the 2011 heritage
  unit 145) the blue, white and red stripes round the face, the black cab, roof and underbody;
  **VIA** (915) teal over the cab and roof and along the top, the yellow wedge from the nose
  tapering back over the grey. Fields that cross the lofted facets are panes and decals laid on
  the shell (`p42Strip`, `shapedCrownPane`, the face planes' panels).
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
- **PRR GG1** - Loewy's welded body on its own slice body (`gg1Body`, the carbody kit's shell and
  painter with the GG1's own section, no kit change): the lower body upright and full width (10 ft 4 in)
  from its foot (1.22 m) to the shelf (2.85 m) along both hoods; over the shelf each hood's upper part
  leans in and narrows from nearly the body's width at the end to 2.0 m at the cab, its crown at 3.86 m,
  so the crew look forward past it through the rounded windows in the cab's front corners; the shelf
  sweeps up 0.45 m into those corners over the last 2.2 m; the raised centre cab (4.15 m, its front
  wall 5.9 m from each end, raked and rounded over at the top). The ends stand nearly upright, blunt and
  rounding to the full width over 1.15 m, the crown rounding over at the top; on each the door in its
  gaps, the arched opening with the headlight, the keystone (PRR schemes, with the number), grab irons
  and ladder rungs, and the marker housings on the hood's top corners (red and white lamps, a number
  board with its numerals). Ahead of each end the deck and the cast pilot with the MU sockets, corner
  steps and handrails, 0.75 m to the coupler face. On each side the crew window (red-framed on 4935),
  the doors (gaps, a narrow window, a grab iron, the ladder under them), the louvres, the keystone at the
  middle, and the long four-panel grille low on one hood (diagonally opposite). Two diamond pantographs
  on the hoods 3.4 m from the ends (the rear raised, the front folded, 4.5 m folded over the rail). The
  running gear: on each half three 57 in drivers (1.48, 3.56, 5.64 m from the centre) in the frame's
  side plates with pedestals and axle-box covers, one bogie node, and the two-axle guiding truck
  (8.05, 10.52 m) under its cast side frame, a bogie node of its own. **Brunswick green** (4935) and
  **Tuscan red** (4913): the five gold pinstripes (2.24 - 2.56 m) leave the level 1.8 - 2.7 m from each
  end and sweep down in quarter ellipses to meet at the end's lower corner (`gg1StripePath`), a fine
  line along the foot round both ends, the teardrops behind the marker housings, the spaced
  PENNSYLVANIA across the cab and the number on each hood. **Penn Central** (4879): black, the white
  logo on the cab with PENN CENTRAL under it and the large numbers on the hoods, no stripes.
  Measurements in assets/prr-gg1/SOURCES.md.
- **Amtrak Superliner** - the bi-level long-distance car, measured on photographs of coach 34515 and
  a sleeper side-on, the end of coach 34122 and the ends of sleepers 32112 and 32038
  (assets/amtrak-superliner/SOURCES.md has the measurements): 85 ft long and 16 ft 2 in high, the
  nearly flat roof with rounded corners (`roofPower` 3.2) and its flutes, the slightly leaning sides,
  the body ending 0.88 m over the trucks and its side carried down to 0.25 m over the low floor
  between them (u -7.8 to 6.6 m from the middle, the drop-centre underframe), the corner steps at
  the ends. Phase IVb paint: the red line under the lower windows, two red pinstripes over the blue
  band (2.40 - 2.60 m) under the upper windows, "SUPERLINER" in the band and the number over it near
  the right-hand end, the travel mark beside the door; the stainless end walls plain. The lower deck
  fluted under the blue band and on the low floor's skirt. Windows with rounded corners, the wide
  ones split by a mullion. The coach: 11 upper windows (1.62 m, 1.97 m pitch); below, a narrow
  window and two pairs under the 3rd to 5th, the plug door 2.1 m on (its narrow window), the big
  air-conditioning grille over the +X truck and six locker doors over the other. The sleeper: five
  roomette windows, the stairwell's narrow window and five bedroom windows upstairs; downstairs
  a narrow window and two pairs, the door, a small window and the grille. The left sides carry the
  windows at the same places (the sleeper's corridor beside the bedrooms narrower windows, assumed)
  and a narrow louvre with lockers at the end instead of the grille. The ends: the diaphragm's
  black face plate over the upper deck with the end door's window, collision posts, red markers,
  a grab iron, the end sill; grab irons beside the door and at the corners. The door opens onto
  the lower deck's cabin over the low floor (`slDoor`).
- **Acela Express** - matched against twelve photographs (assets/amtrak-acela/SOURCES.md). The
  power car's nose is a cab face (`ACELA_FACE`, seriesCab.ts) from the tip to the cab door (6.4 m),
  where the lofted body takes over: one convex curve from the cab roof - the long windscreen raked
  about 18 degrees (its foot at 3.08 m, 1.4 m behind the tip, its head at 3.89 m), the blue band on
  the sloping front, the silver bulb's most forward point at 1.7 m rolling down and under to the red
  line 0.5 m back (measured on the Boston nose-side photograph, 242 px/m up the side) - a broad oval
  in plan (elliptic corners swept back about 1.8 m), narrower at its foot, over a dark air dam set
  back under it. The band's lower edge is a smile (low at the centre, higher round the corners),
  with the four round headlights in a row (0.25 and 0.71 m off the centre); its ends sweep back
  under the mask as the blue line that climbs to the cant at the cab door and runs along the top
  of the side to the rear end, where it widens down the corner. The two-pane windscreen (2.3 m
  wide) in a black rubber surround with two wipers; the dark navy mask over the whole cab roof and
  the cab's upper sides, with a hexagonal cab side window in it, its front edge raked; the nose
  hatch on its side. Behind the cab face the cab door (narrow window, handrails, step), the long
  louvre panel along the machine room (d 7.6 - 15.6 m), the lower panels' seams, AMTRAK and the
  running number 2004 on the lower panels; on the roof the long hatch with its radiator grille and
  two single-arm pantographs with red arms (`armMat`, czElectricKit.ts) over the rear, the trailing
  one raised; the rear end's roof and corners rounded. The dark skirt
  under a thin red line along the whole train. The coaches: the tilt profile (upright foot, the
  sides leaning in from the red line to the roof), stainless silver with the windows framed one by
  one (1.0 m high) - business class 13 a side, first class 11 wider ones, the cafe four at each
  end with the counter between - two narrow windows by the vestibule, one plug door each side at
  the vestibule end (toward the leading power car), roof fairings over the air conditioning at
  both ends. `train` is an articulated set (`articulate`, tramKit.ts): a power car at each end,
  the rear one turned, first class behind the leading power car, the cafe in the middle of five
  or more cars (`acelaTrain`), bellows between the cars, each car on its own two trucks. The
  distant model keeps the cab's mask, band and blue cant line and the coaches' window strip.

## Liveries

Simplified schemes: colour fields, stripes and plain stroke letters, no heralds or logos
(but the F40PH's Amtrak wordmark and the F7's Santa Fe nose herald).
Running numbers are illustrative, but for the GG1's 4935, 4913 and 4879 (photographed units).

## Deviations

- The trucks are the diesel toolkit's generic cast truck (the Acela's, the Charger's and the
  Superliner's are not modelled in detail); the Acela's tilt is not drawn. The pantographs' base and head are the
  kit's grey (only the arms red); the acela logos and the cab roof's number are left out; the cafe car's window layout
  is not confirmed by a photograph.
- The P42DC's front and rear offsets keep the model centred (the photo puts the trucks 0.17 m
  further back); its VIA logo, flags and the heritage unit's dates are not drawn.
- The Superliner's left sides were not photographed side-on: their layout follows the right sides
  and the sleeper's corridor windows are assumed. Places along the car are good to about 0.3 m.
- The P42DC's and ALC-42's interiors and the Acela's cabins are not drawn. The F7 set's units
  are hinged as one articulated vehicle, not coupled loose.
- The GG1's quill drive and cast frames are simplified to plates, pedestals and covers; the hoods' upper side screens on one side are not drawn.

## Checking

`pnpm exec vitest run test/usCarbodies.test.ts` (ids, references, short value titles; every
livery at its published length, inside the US gauge and 16,000 triangles, without coplanar
faces, its axles and two supports, the fixed parts under the gauge's height; the GG1's two
pantographs; the F7's low windscreen, grilles over the portholes, Santa Fe herald, B unit and sets (formations, lengths, sections, joints, supports, distant models); the Acela's formations, train lengths and sections, each car on two trucks;
deterministic bytes and the distant models). The pantographs are also in
`test/pantographs.test.ts`.
