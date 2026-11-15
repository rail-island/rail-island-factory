# China's locomotives, coach and wagons: bodies

**Covers** - how each of China's locomotives, its coach and its wagons is drawn, measured from photographs and drawings: the HXN5, HXD1, HXD3D, SS1, SS8, DF4 and DF11, the QJ, SY and JS steam engines, the 25-series coach and the C70 / P70 wagons.
**Code** - `generator/cnHxn5.ts`, `generator/cnHxd1.ts`, `generator/cnHxd3d.ts`, `generator/cnSs1.ts`, `generator/cnSs8.ts`, `generator/cnDf4.ts`, `generator/cnDf11.ts`, `generator/cnLocos.ts` (`CN_LOCOS`), `generator/cnQj.ts`, `generator/cnSy.ts`, `generator/cnJs.ts`, `generator/worldSteamLocos.ts`, `generator/cnCoach25.ts`, `generator/worldCoaches.ts`, `generator/cnC70.ts`, `generator/worldWagons.ts`, `test/cnJs.test.ts`, `test/cnSs1.test.ts`, `assets/cr-*/`
**See also** - [china-trains.md](china-trains.md) (the designs, deviations, tests), [china-units.md](china-units.md) (the multiple units), [world-locos.md](world-locos.md), [world-steam.md](world-steam.md), [world-coaches.md](world-coaches.md), [world-wagons.md](world-wagons.md)

## The CR HXN5's body

`generator/cnHxn5.ts`, measured from the photographs in `assets/cr-hxn5/` (SOURCES.md; the number is
HXN5 0433's) and the published figures: 22.295 m over the couplers, 3.119 m wide, 4.775 m high over the
roof lamps, Co-Co on the GE Evolution's 50 ft 4 in truck centres. It is no longer the ES44AC's body: the
HXN5 (GE ES59ACi) has the Evolution's frame, hood and radiator but **one full-width Chinese cab** and no
short hood. The kit's helpers (`usHoodKit.ts`) draw it; no kit or other design changed.

- **Cab.** 2.7 m long (7.9 - 10.62 m), full width: a flat face upright to the waist at 3.35 m, the
  windscreens' plane raked 0.2 m back to 4.38 m while the sides lean in to 1.36 m, a deep chamfer to the
  flat roof at 4.62 m; the face's vertical corners cut 0.1 m. Two rounded windscreens (3.40 - 4.35 m) with
  a broad post and light frames, the four-lamp box on the roof's front edge, a headlight and an amber
  marker in a dark housing each side at 3.0 m, the CR emblem between. The sliding side window high on
  the leaning side (8.7 - 10.4 m), a small low window at 9.0 - 9.3 m, doors in the rear wall onto the
  walkways, the horn on the roof behind.
- **Front end.** No walkway in front: a ribbed anticlimber under the face (1.18 - 1.65 m) and the deep
  pilot plate below it with the coupler (an AAR knuckle, as China's type 13 automatic coupler, at
  0.88 m), hoses, a red marker and yellow grabs.
- **Hood.** An equipment box (1.6 - 7.9 m, 4.6 m high) with three screened grilles high on each side and a
  small window ahead of them; the engine hood (to -5.2 m) with its exhaust and door seams; the radiator
  with its wings flaring to the full width over the rear face, the rear face's four lamps under them,
  the radiator compartment's louvred doors. Walkways with handrails from the cab's rear wall to the rear
  platform, side ladders at 5.4 - 5.9 m, corner steps at the rear.
- **Running gear.** Coil-sprung three-axle trucks, a fuel tank with a louvred cabinet of four doors on
  its side, two pairs of air reservoirs ahead of the rear truck.
- **Livery** (`orange` key kept for saved maps, titled "CR green"; one value, not a parameter). CR dark
  green (sampled `#235843`); a light grey band at 2.10 - 2.65 m across the face, wrapping 0.4 - 0.55 m
  round the cab's corners with a leaning end, carrying the red "Hexie" characters (simplified strokes)
  and the number on a white plate; the hood's lower sides (to 4.08 m, from 5.3 m back to the radiator)
  silver-grey with the characters 0.7 m high and the number in red; the rear face lettered the same,
  the emblem below. Dark olive-grey frame and pilots, handrails dark with yellow end posts.

## The HXD1's body

`generator/cnHxd1.ts`, measured from the photographs in `assets/cr-hxd1/` (SOURCES.md; units
0016, 0026, 0151, 0290 in the original livery, 1454 and 1912 for the cab's shape and the right
side) and the published figures.

- **Two sections.** Two identical single-cab Bo'Bo' sections of 17.611 m over the couplers
  (35.222 m), coupled back to back: one articulated vehicle of two sections hinged at the coupler
  plane between them, a grey gangway bellows over the 0.61 m between their flat inner ends, a
  knuckle coupler at each cab (the automatic coupler, no buffers). Each section stands on its own
  two bogies, 9.0 m apart, 2.8 m wheelbase, 1.25 m wheels.
- **Cab.** The EuroSprinter (ES64F4) cab: the face upright to the waist (2.78 m) with rounded
  corners, the two-pane windscreen raked back 0.46 m to 3.66 m, chamfers beside it narrowing the
  face toward the roof, the roof cap sloping back to the 4.15 m roof over the rectangular top
  headlight. The silver lamp band (1.54 - 2.22 m) holds two housings (head lamp outboard, tail
  lamp inboard), the red "Hexie" characters and the number; the CR emblem above it; dark grey
  round the windscreens and on the roof cap, the corners blue; a grey skirt with yellow and black
  stripes below.
- **Sides.** A small cab side window and the cab door behind it, handrails beside the door and on
  the cab corner; otherwise plain machine-room walls, the louvres (two pairs a side) on the roof's
  sloped shoulders (3.38 - 3.92 m). The body is drawn 2.96 m wide so the handrails stay in the
  3.1 m gauge.
- **Livery.** Dark blue, a dark grey band along the bottom (1.0 - 1.38 m); on each side a silver
  trapezoid narrower at the top (its ends leaning in 1.05 m), from 5.3 m behind the cab's coupler
  to 1.25 m before the inner end (at the foot), holding the red characters and the running number HXD1 0016 - read
  from the cab rearward on the left side, toward the cab on the right.
- **Roof.** A cooler box with two fan grilles behind the middle, a single-arm pantograph 1.5 m
  from each section's inner end (the rear section's raised, as in most photographs), its
  roof line and the main breaker.
- **Distant model.** Both sections with their noses, the silver trapezoid as a band, the bogies,
  frame, transformer, cooler boxes and pantographs, 196 triangles of 200.

## The HXD3D's body

`generator/cnHxd3d.ts`, its own profile tables on the box locomotive kit, matched to the photographs in
`assets/cr-hxd3d/` (unit HXD3D 0080, the "red orangutan" production livery every photograph shows).

- **Size.** 22.989 m over the automatic couplers (the model's own centre coupler at 0.88 m, not the
  kit's buffers), 21.9 m over the faces, 4.1 m high. The body is drawn 3.0 m wide, not the real 3.1 m,
  so the cab doors' handrails stay inside the UIC gauge. Bogie pivots 11.4 m apart (measured; no
  published figure found), each bogie's wheelbase 2.0 + 2.35 m with the longer pair inboard, 1.25 m wheels.
- **Cab.** The TRAXX-derived face: upright to the grey skirt's top (1.5 m), leaning back 0.12 m to the
  waist (2.37 m) and 0.45 m to the windscreen's head (3.44 m), the roof rounding down 1.75 m to it; the
  corners chamfered 0.38 m back from 1.19 m out. Two windscreen panes (2.62 - 3.44 m, 2.14 m across) with
  wipers; on the red waist band a stacked pair of round headlights in a silver housing at each side and
  between them a dark red panel with the CR emblem, "Hexie" and the number; the double top headlight in a
  dark housing on the roof's slope and two yellow horns behind it. Under the face the grey lower cab,
  its rear edge slanting from 1.5 m to 1.0 m behind the face, red air-hose cocks, and a yellow plough
  with black chevrons.
- **Sides.** Smooth, no machine-room openings: the cab window (8.85 - 9.27 m from the centre, 2.62 -
  3.22 m) ahead of the cab door (7.95 - 8.7 m); sixteen louvres along the cantrail's slope (3.6 - 3.95 m).
- **Paint.** Red body and roof, a dark grey skirt to 1.5 m (the lower face too), the face maroon from
  the waist to the roof's slope; on each side a maroon wedge behind each cab, its foot at the waist 1.9 m
  behind the face, its head at the cantrail 5.6 m behind it. The large white "Hexie" (0.76 m, drawn as
  simplified brush strokes) and "HXD3D0080" stand a little behind the middle of each side, read left
  to right from either side.
- **Roof.** Two single-arm pantographs 10 m apart (the DSA-200 drawn as the kit's), the trailing one
  raised, the roof line between them, the main breaker's base and a hatch.
- **Distant model.** The kit's, with the maroon wedges painted on its sides.
- **Not drawn.** The small cab-side number and depot lettering, the face panel's grille, the brake
  hoses and sockets.

## The SS1's body

`generator/cnSs1.ts`, its own profile tables on the box locomotive kit, matched to the photographs
in `assets/cr-ss1/` (SOURCES.md): SS1 008 at the China Railway Museum in the green and yellow livery,
measured on a near side-on photograph of SS1 0681 (heights about 103 px/m, positions along the side
by a projective fit over its six equally spaced portholes).

- **Size.** 20.368 m over the couplers, 19.4 m over the frame, the roof 4.14 m above the rail; the
  body is drawn 3.0 m wide with a 3.08 m rim (published 3.106 m), so its handrails stay in the UIC
  gauge. Two three-axle bogies 10.9 m apart (not published; read from the photograph), 2.3 m between
  the axles, 1.25 m wheels. 90 km/h, as the Chinese article states (the English one says 95).
- **Cab front.** Upright to the waist and leaning back 0.16 m to the windscreens' head, the lower
  body tucking in under the lower stripe, the face slightly bowed with its corners rounded 0.42 m
  back into the sides; the roof's rim stands 4 cm out over the face and the sides, the cab roof
  rounds down from 4.14 m. Two windscreens 2.84 - 3.6 m, a red handrail under each, the roof
  headlight's drum on the roof's front edge, two lamp housings standing 0.13 m out of the face at
  1.78 - 2.1 m (headlight outboard, tail lamp inboard), the number plate on the lower stripe, an
  automatic coupler (no side buffers) over a red pilot (`SS1_PILOT`): three bent tubes (0.38, 0.55, 0.72 m) under the body (their plan
  4 cm inside the face's at its foot, the coupler standing ahead of them) hung from the body's foot on posts that run from a deep bottom plate (0.1 - 0.3 m) up into the frame, as on SS1 008
  (`test/cnSs1.test.ts`).
- **Livery.** Light green upper body (sampled `#8fc48e`), dark green lower body (`#1f4a36`), yellow
  (`#f0a828`) stripes at 1.36 - 1.46 m and 2.45 - 2.57 m round the body. On the face the waist stripe
  becomes a vee from the corners to a point at 1.72 m, light green inside it, holding the red CR
  emblem (0.28 m radius, white ring) at 2.32 m.
- **Sides.** At each end the narrow corner window, the cab window (2.74 - 3.5 m, divided) and the
  plain cab door (7.0 - 7.6 m from the middle, 1.62 - 3.46 m high) with its handrails, the step
  recess and the steps below. The machine room between the doors has twelve louvre columns in the
  body's colour: two tiers of louvres in three columns at each end, a louvre over a window in the
  first, the last and the four middle columns, as on the louvre side of SS1 008 and 202 (later units
  had one long louvre panel under a row of portholes, not drawn). Two pressed ribs along the lower
  body, the side number plate ahead of each door. Both sides alike.
- **Roof.** The braking-resistor housing behind each cab (6.0 - 8.0 m from the middle, up to 4.5 m),
  sloping down toward the middle with louvres on the slope and the sides; the walkway's railings
  between them; the single-arm pantographs over the bogies at 4.75 m from the middle, the rear one
  raised; the main circuit breaker and the roof line in the middle.
- **Running gear.** The module's own lighter three-axle bogies (the skirt hides all but the wheels'
  bottoms, the axle boxes and the springs) and the main reservoirs between the bogies.
- **Distant model.** The same profiles without the rim, the waist stripe kept and the lower one
  left out, the resistor housings, the bogie blocks and the raised pantograph (100 triangles).

## The SS8's body

`generator/cnSs8.ts`, its own profile tables on the box locomotive kit (no generic world-locomotive nose),
measured from the photographs in `assets/cr-ss8/` (SOURCES.md) and the published figures: 17.516 m over the
couplers, a 16.3 m body, 3.1 m wide, 88 t, 1.25 m wheels. Drawn as SS8 0228 (Guangzhou depot).

- **Ends.** Both alike: the face upright below a crease at 2.4 m, raked 0.45 m back to the roof's
  shoulder at 3.75 m and rounding to the 4.08 m roof, slightly bowed in plan, its corners swept 0.45 m back.
  Two separate windscreens in white rims (0.2 - 1.26 m from the middle, 2.70 - 3.46 m high), the round
  headlight in a light blue pod on the face's top edge, the lamp housings low in the face (headlight outboard,
  red lamp inboard, 1.64 - 1.96 m), the CR emblem on the chevron, the number on the steel blue lower face, the train supply
  sockets beside the coupler.
- **Skirt and couplers.** The side's foot is at 0.9 m (over the upper half of the wheels); over the last
  2.45 m of each end the skirt drops to 0.45 m at the face, the red and white striped plough below it. The
  automatic couplers are drawn as the kit's centre coupler at 0.88 m; there are no side buffers.
- **Livery.** The class's blue livery (no red and white SS8 was found), sampled from SS8 0077 and 0228 (the
  median of clean patches, lifted for the shade): steel blue `#466881` to 1.45 m, light blue `#91c3d2` to
  2.0 m with a dark steel blue stripe `#345a7a` at 1.66 - 1.78 m, cream `#ece8df` above, a light grey roof. The face: light blue above a cream
  chevron (2.48 m at the corners, a V down to 2.12 m) that runs down between the light blue lamp pockets to
  1.47 m. The cab sides light blue above 2.5 m with the red number on the cream below; a light blue band slants
  back from the roof's shoulder over the door to the lower bands.
- **Sides.** The raked cab side window (its front edge following the face), the cab door 1.85 - 2.45 m behind
  the tip, the steel blue louvre panel (`#3e6784`, 2.0 - 3.17 m, its ends slanting back toward the top) with vertical
  louvres, six oval windows above it, not evenly spaced (-4.45, -2.4, -0.5, 0.55, 2.4, 4.25 m, the other side
  turned), grey equipment boxes between the bogies.
- **Roof.** An air conditioner over each cab (1.55 - 2.95 m behind the tip, its louvred end toward the cab), a
  single-arm pantograph behind each at 4.4 m from the middle (the rear raised), the roof cable and the main
  breaker between them. Bogie centres 8.2 m and a 2.8 m wheelbase (measured; not published).
- **Distant model.** The kit's: the same profile and bands, the louvre panel as a band along the side.

## The CR DF4 Dongfeng's body

`generator/cnDf4.ts`, its own LocoSpec on the box locomotive kit (unchanged), drawn as the
common DF4B and measured from the works drawing and the photographs in `assets/cr-df4/`
(SOURCES.md; units 1787 and 2480 carry the two liveries' numbers).

- **Size.** 21.1 m over the coupler centres, bogie centres 12.0 m, 2 x 1.8 m bogie
  wheelbase, 1.05 m wheels; the roof's top 4.47 m, the headlight 4.64 m, the radiator's
  railing 4.86 m. The real body is 3.309 m wide; it is drawn 3.2 m wide so the handrails stay
  within the US gauge's 3.3 m (`loadingGauge: "us"`, as the HXN5; the UIC gauge's 4.7 m is
  lower than the DF4's 4.755 m).
- **Cab ends.** A full-width carbody with a cab at each end. The face leans back 6 cm from
  the shell's foot (1.15 m) to the windscreens' sill at 2.95 m, the two big windscreens
  (3.0 - 3.72 m, 1.02 m wide each) 0.24 m more to their head, then the cab roof's brow rises
  back to the roof 1.0 m behind the foot. In plan the face is flat across the windscreens
  and its corners round back 0.36 m to the side. On the brow the round headlight housing
  (0.44 m across) with two horns behind it; a silver twin-lamp box (white outboard, red
  inboard) either side at 2.27 - 2.47 m; a small grille under the emblem; the number plate
  on the broad lower band. Below the body the grey apron, the red plough with three rows of
  slots and the automatic coupler at 0.88 m (drawn as the kit's centre coupler; no buffers).
- **Livery.** The stripe's "V" on both faces: level with the side stripe (3.03 - 3.15 m) at
  the corners, falling to its fork at 2.12 m under the CR emblem (a white ring over the
  rail's section). The broad lower band (1.39 - 1.62 m) wraps round the cab's corners and
  narrows to the side's lower stripe (1.45 - 1.57 m) 1.45 m behind the face. `green`: dark
  green, yellow stripes, grey roof, dark running gear (DF4B 1787). `orangeWhite` (kept as
  the saved key, retitled "Orange": the real livery has no white): orange-red with yellow
  stripes, light grey roof, apron and running gear (DF4B 2480).
- **Sides** (from the No. 2, +x, cab; DF4B 9221 by a projective fit; both sides alike, the
  far side not photographed): the cab's side window (0.55 - 1.2 m behind the face) and door
  (1.45 - 2.05 m); the cooling room's four louvred panels over four tall louvres (2.4 - 7.4 m;
  every louvre painted in the body colour, the gaps between its slats a darker shade);
  two windows over small louvres (8.1 - 10.7 m); the side door (11.05 - 11.6 m); two small
  low windows (12.2 - 13.7 m); two windows over louvres toward the No. 1 cab (15.05 - 17.2 m);
  the cab door and window mirrored at the No. 1 end. The running number painted on the cab
  sides (digits only: the plates' "东风4" characters are not drawn).
- **Roof.** The radiator frame over the cooling room with its two fan discs and a railing,
  the two exhaust stacks over the engine and a low box over the No. 1 end.
- **Distant model.** The kit's box locomotive LOD from the same tables and paint (98
  triangles); the pilots, lamp boxes and headlights are left out.

## The DF11's body

`generator/cnDf11.ts`, measured from the photographs in `assets/cr-df11/` (SOURCES.md): heights
from the head-on view of DF11 0441 (145 px/m), lengths along the side from DF11 0177 by a 1-D
projective fit over the louvre panels. The running number is DF11 0010.

- **Size.** 21.25 m over the knuckle couplers, 20.15 m over the body, 3.0 m wide (real 3.304 m,
  narrowed so the handrails stay inside the UIC gauge's 3.1 m), 4.47 m at the roof's crown and
  4.68 m over the horns (published 4.736 m). Two three-axle bogies on 11.8 m centres (the
  photograph's traction brackets 3.95 m and 15.75 m behind the face), axles 2.0 m apart, 1.05 m
  wheels; the leading axle 2.2 m behind the face, close behind the pilot.
- **Cabs.** One shell lofted from the cab's tables, the same at both ends: the lower face upright
  from the body's foot (1.08 m) to the waist (2.56 m), the windscreen raked 25 degrees back to the
  eave at 3.74 m, the roof cap rounding back 2.3 m to the crown; the face flat across with
  rounded corners 0.25 m wide. Two windscreens 2.86 - 3.66 m with wipers, a handrail across the
  face under them, two dark lamp housings (white head lamp outboard, red tail lamp inboard) with
  the red "DF11 0010" plate between them, a grab bar low on the face, the round headlight in a
  pod on the roof cap and two horns behind it. Below, the grey pilot with the knuckle coupler, the
  hoses and the plough plate leaning forward, its red and white chevrons under a gable whose apex
  sits under the coupler, four slots in its grey shoulders.
- **Livery.** Blue and cream, the scheme every photograph shows (the plan's red and white was not
  found): cream above, royal blue below; at the waist a thin blue line over a cream line
  (2.63 - 2.77 m along the sides) that sweeps down over the last metre behind each cab door to
  the face's level (2.41 - 2.56 m) and runs across it; a cream stripe at 1.66 - 1.73 m all
  round; grey roof, grey pilot and bogies.
- **Sides.** From the +X cab, on both sides alike: the cab window with its front edge raked with
  the windscreen, the cab door with its window, handrails and steps, a window, a louvre panel, a
  large window, a louvre panel, two small brown grilles, the white CR emblem, two windows, three
  louvre panels, a window, the other door and cab window. The louvre panels have slats in the
  cream above the waist lines and in the blue below them. Red number plates on the blue below
  each cab window.
- **Roof.** Radiator louvres on both shoulders 4.2 - 6.6 m behind the +X face, two small vents a
  side, the exhaust silencer box and a second box on the crown, low hatch plates.
- **Underframe.** The ribbed fuel tank between the bogies, two air reservoirs beside each end of
  it, the traction brackets over the bogies.
- **Distant model.** The shell's silhouette with both cab noses, the paint bands, windscreens and
  cab side windows, and the two bogies reaching the rail: 98 triangles of 100 (the fuel tank and
  the exhaust box are optional parts the budget leaves out).

## The QJ's body

`generator/cnQj.ts`, its own engine and tender `LocoSpec` on the steam kit, drawn from the dimensioned
works diagram and the photographs in `assets/cr-qj/` (QJ 2204 in China Railways' service livery).

- **Size.** 16.14 m from the front coupler to the drawbar, 29.18 m with the six-axle tender (13.04 m
  from the drawbar to its rear coupler); axles 1.615 + 2.87 + 4 x 1.6 + 3.05 + 2.205 m as the diagram
  dimensions them, wheels 0.92 / 1.5 / 1.12 m, the tender's 1.0 m. 3.24 m wide (the real 3.375 m held
  to the 3.3 m gauge), 4.79 m to the chimney's lip. The closed cab (14.2 - 16.65 m) overhangs the
  drawbar by half a metre, over the tender's front deck.
- **Boiler and top.** The boiler on 3.02 m (top 4.15 m), its long smokebox to the deflectors' rear
  edge, nine white bands and white handrails. Along its top the casing over the mixing feed-water
  heater, chimney, sand box and steam dome: 0.94 m wide, its top 4.7 m from 1.7 m to 8.7 m, its rear end
  rounded down to the boiler; the chimney's lip stands on it. Dark safety valves, whistle, turbo-generator
  and the steam turret ahead of the cab.
- **Smoke deflectors.** Plates at 1.48 m from the centre line from 0.65 m back to 4.2 m, their foot
  rising from 1.55 m at the front to 2.5 m at 2.1 m; from 4.05 m their tops curl in over the smokebox on a
  0.4 m radius through 130 degrees (top 4.45 m), the curl's front corner rounded in side view. Horizontal
  pressed ribs every 0.2 m, white handrails inside the front edges, in a slightly lighter, glossier sheet.
- **Front.** The smokebox door with its ring, the headlamp at its top and the black "QJ 2204" plate;
  under it the red plate (1.94 x 0.7 m) with "QJ", the railway's emblem and "2204" in white (the real
  plate's "Qianjin" in Chinese characters drawn as QJ: the stroke font has no Chinese characters); the red buffer beam, the knuckle
  coupler at 0.88 m and the red slatted pilot.
- **Running board and cab.** The running board on 2.6 m from the deflectors to the cab with a white edge
  and three pipes under it; the black air reservoir under it over the drivers. The cab's windows as the
  diagram draws them (the front window, a narrow pair, the door's window), round roof, red number plate
  low on the side, ladders under the rear corners.
- **Running gear.** Red spoked drivers and dark disc carrying wheels, all with white tyres; two
  cylinders 650 mm across over the leading truck driving the third coupled axle (a 720 mm stroke drawn
  for the real 800 mm: the kit's largest crank that animates without flicker); black frames, the
  trailing truck's frame and the ash pan rising to the cab.
- **Tender.** A tall slab-sided box 3.1 m wide, the coal space's sides 3.95 m high over its front 62 %,
  sloping down to the water tank's deck at 3.3 m with two fillers; red sole bars, the white emblem on
  each side, white grab rails and a ladder at the rear, a reversing lamp. Two three-axle bogies, axles
  1.55 m apart and centres 6.2 m apart (measured: no published figure found).
- **Distant model.** The kit's, the deflectors as flat plates of their side outline, the casing as a
  long dome; the tender's red sole bars as a red block.
- **Not drawn.** The pipes along the boiler, the feed pump, the mechanical stoker's engine, the air
  horns, the Chinese characters and slogans.

## The SY's body

`generator/cnSy.ts` (`SY_WORLD`, `sySpec`, `syLodSpec`), on the steam kit like the DR 52, from the photographs in
`assets/cr-sy/` (SY 1702 side-on, its tender, SY 1721, SY 1000, SY 1599, SY 0368, SY 0652); the model carries SY 1772,
the last SY built.

- **Layout.** A projective fit of SY 1702's side-on photograph over the drivers' published 4.42 m wheelbase gives
  the pony axle 2.42 m ahead of the first driver and the trailing axle 7.14 m behind it (9.56 m; published 9.55 m).
  From the front coupler face: pony 1.33 m, drivers 3.75 - 8.17 m, trailing axle 10.89 m, engine coupling plane
  13.1 m; the tender 8.54 m, so 21.643 m over both as published. Wheels 0.84 / 1.37 / 1.0 m; tender wheels 0.84 m
  on two bogies of 1.75 m wheelbase, 4.03 m apart.
- **Engine.** Boiler on 2.77 m, radius 0.81 m (barrel top 3.58 m), the smokebox from 1.57 m with the chimney well
  back on it (3.21 m, top 4.45 m, the published 4.446 m height), no smoke deflectors; the small dome with its
  visor at 5.44 m and the big round dome at 6.8 m; the high running board on 2.04 m with its white edge, from the
  smokebox front to the cab; the white step ladders from the red pilot beam up to it and the tall white grab rails
  at its front corners; the slatted red pilot and the knuckle coupler; the headlamp on the smokebox's right
  shoulder; the number plate on the smokebox door and the cab sides; the air pumps on the right running board,
  boxes on the left, outside steam pipes; the cylinders 530 x 710 mm over the pony truck with a red star on each,
  the main rods on the third driver; red Boxpok drivers and red truck wheels, all with white tyres; the long cab
  (10.84 - 12.95 m) with two side windows under a rain strip.
- **Tender.** A tank 3.0 m wide to 3.1 m with round top edges and rear corners, the tall coal box on its middle
  (to 4.2 m) with the coal space ahead of it, white railings, the narrowed rear water tank (2.1 m wide, to 3.3 m)
  that lets the crew see back when shunting, the reversing headlamp on its frame, red sole bars, beam and steps,
  black wheels with white tyres, China Railway's emblem in white.
- **Distant model.** The kit's steam LOD; the tender's rounded tanks as prisms of their middle sections and its
  sole bars as a red band.
- **Differences.** The bar frames are the kit's plates; the trailing truck is the kit's outside frame, not the
  real Delta truck; pipework is reduced to a few runs; the headlamp follows most engines (on the right), though
  some (SY 1599, SY 1504) carry theirs on the left.

## The CR JS's body

`generator/cnJs.ts` states the engine and tender `LocoSpec` on the steam kit (like the DR 52,
[world-steam.md](world-steam.md)), matched to the photographs in `assets/cr-js/` and drawn as
JS 6500 (Datong 1981-86 batch). Its `WORLD_STEAM` row gives only the title and the table's measures.

- **Size.** 23.37 m over the couplers with the tender (engine 14.0 m to its drawbar, tender 9.37 m);
  axles from the front coupler face at 1.55 (pony truck, 0.84 m), 4.25 - 8.669 (four 1.37 m drivers
  1.473 m apart) and 11.742 m (trailing truck, 1.12 m): 10.192 m engine wheelbase, 20.487 m with the
  tender, as published. The pony-to-driver spacing and the tender's bogies (1.85 m wheelbase, 4.75 m
  apart) come from a projective fit over the axles of JS 8010's side-on photograph. 4.71 m high,
  the cab 3.1 m wide.
- **Boiler and casing.** The boiler on 3.0 m, 0.98 m radius; no separate chimney or domes: the
  skyline casing covers them - the Worthington feed-water heater's tall box (0.96 m wide, 4.71 m)
  from the smokebox front to 4.0 m with its louvres and the red star on its front, sloping down to
  the lower casing (4.36 m) over the sand dome, which slopes onto the boiler at 7.9 m; the chimney's
  mouth is a ring in the casing's top. Safety valves behind the casing and before the cab.
- **No smoke deflectors** - the class had none as built (a few engines were fitted with small ones
  later); this is what tells it from the QJ besides its four drivers, and its casing, front board,
  long front steps and bogie tender from the smaller SY.
- **Front.** The red pilot beam with a knuckle coupler and the red slatted pilot under it, the red
  board on the deck with the white CR emblem, the headlamp above the smokebox door's centre with
  its white rim and the red "6500" plate under it, white handrails from the deck up beside the
  smokebox and along the boiler.
- **Running board and gear.** On 2.3 m with a white edge, sloping from the deck at 1.1 m up to 2.05 m;
  cylinders over the pony truck with large round steam chests (the kit's `cylinderDressing`), Boxpok
  drivers in red with white tyres, the main rods on the third driver; the air and feed pumps beside
  the smokebox, red-ringed reservoirs over the drivers, red air pipes along the boiler.
- **Cab.** Three side windows over "JS 6500" in white, the open entrance behind them with white
  grab rails, two front windows outboard of the firebox, a round roof with a vent.
- **Tender.** The tank on red sole bars, 3.0 m wide, its front half raised to 4.3 m round the coal and
  the rear at 4.08 m; the CR emblem on its sides, the rear ladder and headlamp, an open underframe
  (centre sill, bolsters) over two cast two-axle bogies with black disc wheels and white tyres.
- **Distant model.** The casing as two prisms (heater box and lower casing), the tank as two prisms
  and the red sole bars; the engine's LOD uses 96 of its 100 triangles, so the pilot's red is left out.
- **Not drawn.** The bureau characters on the board and tender sides, the builder's plates' text,
  the second headlamp of some 8000-series engines, the mechanical stoker, brake rigging.

## The 25-series coach's body

`generator/cnCoach25.ts` lays out the 25T body on the coach kit (`layout`, `lod`, the kit's optional `gap`),
matched to the photographs in `assets/cr-25t-coach/` (RW25T 553849, 554056, 553745; YZ25T 350662, 351219).
The `z25t` livery is the Z expresses' white and blue, `green25b` the 25B's green with yellow lines, which the
25T cars wear today.

- **Size.** Body 25.5 m, 26.6 m over the couplers (painted on the car), 3.105 m wide, the air-conditioning
  units' top 4.43 m (published 4.433 m), the roof's crown 4.3 m, the eaves 3.5 m, the side's foot 0.8 m; bogies
  18 m apart, 2.4 m wheelbase, 0.915 m wheels; the roof rounds down over each end wall.
- **Soft sleeper (RW25T).** A door at each end. The compartment side (-Z): two narrow windows beside the
  air-conditioned end's door, nine 1.52 m windows on a 2.0 m pitch, a narrow window and a blank panel; the
  corridor side (+Z): a narrow window, ten 1.27 m windows on 2.0 m, a narrow window. One air-conditioning unit
  over the +X end, a roof grille near the eaves over the other.
- **Hard seat (YZ25T).** A door at each end, a blank wall beside one, twelve 1.09 m windows on a 1.62 m pitch,
  two narrow windows by the other door; the other side the same turned end for end (every photograph shows the
  blank end on the left; not confirmed). An air-conditioning unit over each end.
- **Windows.** Frames 1.92 - 2.96 m with rounded corners and a top light's bar 0.34 m under the head; white
  frames on the green, dark frames and grey-blue glass in the white livery's band. The door's tall rounded
  window 0.45 m wide.
- **Green.** Dark green, yellow lines 1.66 - 1.82 m and 3.06 - 3.17 m from door to door, the doors and ends
  plain green, a grey roof, yellow running numbers.
- **White and blue.** White, a dark blue band 1.86 - 3.02 m broken by a white gap behind each end's door group
  (the door leaves blue in the band), a red line at the foot, a light grey roof, dark running numbers.
- **Ends and gear.** A closed bellows round the end door from the wall toward the coupling plane, the knuckle
  coupler at 0.88 m, grab rails beside the doors, underframe boxes between the bogies.
- **Distant model.** The kit's shell with the bands and window strip, the air-conditioning boxes.

## The C70 / P70 wagons' bodies

`generator/cnC70.ts`, matched to the photographs in `assets/cr-c70-wagon/` (C70 1658252 and
1618678, P70 3817696, 3808323 and 0201654). The design no longer uses the few-measures wagon kit
of `worldWagons.ts` (India's BOXN / BCNA keep it); it is drawn to the US loading gauge, 3.3 m,
for the C70's real 3.242 m.

- **C70 size.** 13.976 m over the couplers, a 13.5 m body (13.48 m measured by a projective fit on
  the wheel centres of the square-on photo), 3.242 m over the stakes and top chord, 3.143 m high,
  side sill 0.82 m, floor 1.09 m; K6 bogies 9.21 m apart, 1.83 m wheelbase, 840 mm wheels.
- **C70 side.** Seven bays between slim hat-section stakes at +-0.91, +-2.80 and +-4.67 m (the end
  bays 2.07 m, the others about 1.88 m), the top chord over them (3.03 - 3.143 m), the side sill
  below. The middle bay holds the two side door leaves with their pressed panels, outer hinges
  and the locking bar; every other bay a bottom door 1.33 m wide, 0.93 - 2.0 m, with its rim, the
  two straps hinged at the top, their lugs and latches (the end bays' door next to the inner
  stake), and an A of two pressed braces from beside the door up to the chord. A ladder at each
  side's right-hand corner (the sides are alike turned end for end).
- **C70 ends and load.** Four horizontal ribs over each end, corner posts, the chord across; the
  hand brake wheel on end 1 (+X). The coal heaped to a ridge 0.22 m over the chord.
- **P70 size and body.** 17.0 m over the couplers, a 16.6 m body, the eaves at 4.0 m and an arched
  roof 0.6 m higher (estimates from the inside 16.1 x 2.8 x 2.8 m and 145 m3 of its load marks),
  bogie centres 12.0 m (estimated). Seven bays of 0.95 m each side of the 3.3 m door frame,
  hat-section posts, four pressed ribs in every panel; a top-hinged vent hatch with its oval
  emboss in the second and fifth bays from each end; the sliding door's horizontal corrugations
  between its top and bottom tracks, the lock bars at the leaves' meeting edges; the ladder in the
  end bay.
- **P70 roof and ends.** A transverse rib over every post pitch, four round caps on the ridge (at
  -4.2, -1.25, 5.1 and 7.75 m, as on P70 3817696), the roof handrail over end 1; the arched end
  walls with four vertical posts between the corner posts, the hand brake wheel high on end 1 and
  its step.
- **Paint.** The C70 weathered dark brownish grey, the P70 black, each with white lettering:
  "C70", the CR emblem, the number split "16 58252" around the brace, the load marks (70 t,
  23.6 t, 77 m3, 1.3) and the number on the sill; "P70", the emblem, "3817 696" split by a post,
  the load marks (70 t, 24.6 t, 145 m3, 1.6), the low number, the end numbers 1 and 2. The
  stakes, braces, chord, ribs and door rims take the same paint a shade lighter, as their worn
  edges catch the light; without it the relief vanishes in the game's side light.
- **LOD.** One box per unit with the C70's coal ridge or the P70's arched roof and the two bogies:
  42 and 50 triangles. The full models: about 7,300 (C70) and 10,200 (P70) triangles.
