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
| `proc-vehicle-siemens-alc42` | Siemens ALC-42 Charger | `livery`: `phaseVII`, `midwest` (the SC-44's Amtrak Midwest scheme) | 21.79 m | about 10,300 |
| `proc-vehicle-prr-gg1` | PRR GG1 | `livery`: `brunswick`, `tuscan`, `pennCentral` | 24.23 m | 13,300 - 14,400 |
| `proc-vehicle-amtrak-superliner` | Amtrak Superliner | `unit`: `coach`, `sleeper` | 25.91 m | 11,500 - 11,600 |
| `proc-vehicle-amtrak-acela` | Acela Express | `unit`: `powerCar`, `businessClass`, `firstClass`, `cafe`, `train` (`cars` 3 - 8, default 4) | 21.22 m power car, 26.64 m coach | 7,200 - 10,200 a car |

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
- **GE P42DC** - the Genesis's angular nose with its chamfered corners and long raked
  windscreen, the side grilles, three roof fans, the skirt cut over the trucks.
- **Siemens ALC-42** - the Charger's beaked nose, its windscreen, grilles and two radiator
  fans; Phase VII dark blue over a low red stripe.
- **PRR GG1** - the welded streamlined body, the hoods falling from the centre cab to both
  rounded noses, two diamond pantographs over the cab's ends (the rear one raised to the
  game's wire, the front one folded), and the running gear: on each half three 57 in drivers
  and the two-axle guiding truck under one frame, a bogie node each. The five gold
  pinstripes gather into the "cat whiskers" at both noses.
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

- The trucks are the diesel toolkit's generic cast truck (the Acela's, the Charger's and the
  Superliner's are not modelled in detail); the Acela's tilt is not drawn.
- The Superliner's left sides were not photographed side-on: their layout follows the right sides
  and the sleeper's corridor windows are assumed. Places along the car are good to about 0.3 m.
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
