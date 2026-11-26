# Austria's locomotives

**Covers** - the nine Austrian electric, diesel and steam locomotives: what each is built on, its liveries, the measurements that matched it to its photographs, its references and what still differs.
**Code** - `generator/atLocos.ts` (`AT_LOCOS`), `generator/atObb1116.ts`, `generator/atObb1144.ts`, `generator/atObb1142.ts`, `generator/atObb1110.ts`, `generator/atObb1189.ts`, `generator/atObb2016.ts`, `generator/atObb2043.ts`, `generator/atObb1099.ts`, `generator/atBbo214.ts`; `assets/obb-1116/`, `assets/obb-1144/`, `assets/obb-1142/`, `assets/obb-1110/`, `assets/obb-1189/`, `assets/obb-2016/`, `assets/obb-2043/`, `assets/obb-1099/`, `assets/bbo-214/`
**See also** - [austria-trains.md](austria-trains.md) (the overview), [austria-units.md](austria-units.md), [world-locos.md](world-locos.md), [world-steam.md](world-steam.md), [mainline-electrics.md](mainline-electrics.md) (the OBB 1012 and 1040)

## OBB 1116 Taurus (`proc-vehicle-obb-1116`)

`generator/atObb1116.ts` on the box locomotive kit (`boxLocoKit.ts`) with its own profile, like the DB 101
(`deBr101.ts`); no kit change. References in `assets/obb-1116/` (five Commons photographs).

- **Parameters**: `livery` - `obbRed` "Traffic red" (default; 1116 038-9, the red body with the dark grey
  sill), `railjet` "Railjet" (1116 233-6: the darker red, a bright red stripe over a dark grey field that
  rises from under the cab toward the train end on both sides, black cab roofs, the number over the windscreen).
- **Figures** (German Wikipedia): 19.28 m over buffers, 3.0 m wide, bogie centres 9.9 m, wheelbase 3.0 m,
  wheels 1,150 mm; 86 t, 6,400 kW, 230 km/h. 12,578 triangles (Railjet 13,178), distant model 100.
- **Measured** on the side-on photograph of 1116 005 (Penzing; about 60 px/m, the scale running 63 to 58 px/m
  along the body, so lengths near the ends are the mean of both ends) and the head-on view of 1116 141:
  the face's centre line leans back from the lip (1.5 m, |x| 9.25) 0.3 m by the windscreen's foot (2.5 m),
  0.8 m by the eaves (3.5 m) and 1.55 m at the machine room's roof (4.1 m); the cab roofs rise 0.14 m higher
  (4.24 m), back to |x| 6.05. In plan the face is one superellipse (exponent 2.4) from the centre line to
  the side wall, reaching 0.7 m back at the lip, 0.82 - 0.85 m at the windscreen and 0.75 m at the roof: no
  flat middle, the corners rolling into the sides. The black windscreen field 2.47 - 3.78 m, +-1.1 m wide at
  its foot and +-1.08 m at its head (about 0.73 of the face width on 1116 141, wrapping onto the corners), the
  two panes 2.85 - 3.72 m either side of a 0.05 m pillar, the top headlight below them, the wiper rail along
  the foot; the lamp clusters in round-topped black surrounds at +-0.8 - 1.3 m, 1.55 - 2.12 m, on the
  corners' roll (a tall headlight over the tail lamp). The cab side window 7.15 m to the nose module's
  joint (raked, 0.5 m further forward at the sill than at the head), 2.8 - 3.47 m; the joint runs on down to
  the lamp. The grey sill 0.98 - 1.5 m; the grey corner blocks under the lip carry the buffers.
- **Side**: the machine-room door at x 1.53 - 2.47 m and the dark filter grilles in the roof's slopes
  (3.62 - 4.0 m) - two (2.4 - 3.16, 3.27 - 4.44 m) at the door's end, one long one (5.35 - 6.6 m) at the
  other - drawn turned about on the other side (the photographs of both sides agree).
- **Roof**: the kit's single-arm pantographs at |x| 4.45, knees toward the cabs, the rear one raised; the
  roof line between them; the machine room's flat roof dark grey.
- **Deviations**: the "railjet" wordmark on the sides is left out (the stroke font has capitals only); the
  OBB mark is drawn as "OBB" with a stroke through the O; the bogies are the kit's generic two-axle bogie;
  the distant model has no Railjet stripe or field (the kit's distant shell paints the sides in bands).

## OBB 1144 (`proc-vehicle-obb-1144`)

- **Built on**: the box locomotive kit (`generator/boxLocoKit.ts`) with its own profile tables,
  `generator/atObb1144.ts`; no kit change.
- **Parameters**: `livery` - `trafficRed` (default; 1144 259, the grey cab cap, the light grey band and
  the OBB lettering), `bloodOrange` (1044.20 as in 1985: the ivory lines under the windscreens, at the
  skirt and round the cab roof, the Pflatsch emblem, the number plate).
- **Figures** (German Wikipedia "ÖBB 1044"): 16.1 m over buffers, 2.95 m wide, bogie centres 8.0 m,
  wheelbase 2.9 m, wheels 1.3 m; `game` 84 t, 5,280 kW (one-hour rating), 140 km/h (the 1144 after
  its push-pull rebuild).
- **Shape facts**: the cab front an arrow in elevation - foremost at the windscreens' sill (2.85 m),
  the windscreen band leaning back 0.22 m to the eave (3.68 m) and rounding 0.36 m more into the roof
  (crown 4.0 m), the lower front receding 0.3 m to the skirt (0.95 m); in plan a flat face with 0.28 m
  chamfered corners 0.3 m deep. Two windscreens 1.13 m wide either side of a 0.26 m pillar.
  Side, measured on 1144 052 by a 1-D projective fit over the symmetric ends, doors and portholes:
  the cab side window at |x| 6.15-6.65 (2.88-3.5 m) with its mirror box ahead of it, the door at
  4.45-5.05, portholes 0.55 m at |x| 1.3 and 3.75 (centre 3.15 m), the ribbed panel from door to door
  (|x| <= 4.32) from the band's foot to 2.56 m, red ribs above the band and aluminium ones in it; the
  roof grilles along the shoulder, the roof hatches between the pantographs. Single-arm pantographs
  at |x| 5.3, the rear raised; the roof line on insulators with the main breaker in the middle.
- **Paint** (trafficRed): dark grey skirt to 1.45 m, light grey band to 2.0 m (1.49-2.04 on the front,
  the lamps in it), red to the eave; on the front the grey cap from 2.77 m, sweeping back onto the side
  to 0.98 m behind the tip at the eave. "OBB" on the front's left, the number on its right; on each side
  near one cab, diagonally (near cab 2 on the right side, cab 1 on the left), as photographed.
- **References**: `assets/obb-1144/` - 1144 052 (side), 1144 259 and 268 (traffic red three-quarter),
  1144 092 (front corner), 1044.20 in 1985 and 1144.40 (blood orange).
- **Deviations**: the blood orange livery keeps the later body (portholes); the first series' side
  windows and the cream-band 1144 variant are not modelled. The top headlight lies on the face rather
  than in its own housing on the roof edge; the pantograph positions are estimated from oblique photos.
- **Budget**: 14,924 triangles (traffic red), 14,592 (blood orange); distant model 100.

## OBB 1142 (`proc-vehicle-obb-1142`)

| | |
|---|---|
| Built on | the box locomotive kit (`boxLocoKit.ts`) with its own profile, `generator/atObb1142.ts`; no kit change |
| Parameters | `livery` trafficRed (the 1987 scheme with the Pflatsch, default) / bloodOrange (the delivery paint) |
| Figures | 16.22 m over the buffers, 2.98 m wide, eave 3.30 m, cab roofs 3.75 m, the raised machine-room roof 4.0 m; Bo'Bo', bogies 7.7 m apart, 2.95 m wheelbase, 1.25 m wheels; 83.5 t, 4,000 kW, 150 km/h (de.wikipedia "OBB 1042", the 1142 figures) |

- **Side** (projective fit over the eleven machine-room openings of 1142 668 at Graz, pitch 0.914 m,
  anchored on the buffer faces at +-8.11 m): at each end the cab side window (5.85 - 6.38 m from the
  middle, with the red mirror box) and the cab door (5.02 - 5.75 m, its window, the handrails either
  side); between them eleven openings 0.76 m wide, nine vertical-slat grilles (2.64 - 3.16 m) and two
  windows (2.58 - 3.16 m), the 5th and 7th, one with a bar. Heights from the near-orthographic Passau
  photograph (324 px/m): light grey band 1.45 - 1.84 m, window heads 0.14 m under the 3.30 m eave.
- **Front**: nearly upright, 7.40 m from the middle at the band, leaning back to 7.16 m at the eave
  and rounding into the cab roof; a 5 cm bow in plan and 0.32 m round corners (head-on StB photograph).
  Two windscreens 1.06 m wide side by side (2.48 - 3.25 m), the top headlight's round housing on the
  roof edge, the headlights in the band (1.71 m, +-1.08 m), the tail lamps above them in the red
  (2.19 m), a grab rail under the windscreens, rectangular buffers, the plough.
- **Roof**: the cab roofs round over from the eave; between them the machine room's raised roof
  (|x| < 5.45 m) with its side grilles and four fan hatches; the single-arm pantographs at +-3.5 m
  on it (the rear raised), the busbar and the main breaker between them.
- **Paint**: traffic red, the light grey band, umbra grey below, grey roof; the grey cab cap round
  the windscreens down to 2.41 m, swept back onto the side ahead of the cab window; the white Pflatsch
  on the front and behind one door on each side (diagonally symmetric) with the white running number
  1142 668-1, red on the front's band. Blood orange: ivory lines at 1.45 and 2.36 m the whole way round,
  dark grey below, ivory Pflatsch and number 1142 679-8.
- **References**: `assets/obb-1142/` (eight Commons photographs: 1142 668, 621, 602, 694, 679, 578,
  579 and the 1042.517; SOURCES.md).
- **Deviations**: the bogie arches in the skirt are not cut; the width, bogie centres, wheelbase and
  wheel size are photo estimates (no published drawing found); the side of 1142 621 (one window at the
  cab, no separate cab window) is a variant not drawn.
- **Triangles**: 14,524 (blood orange 14,532); the distant model a coarser profile with only the raised
  roof, within 100.

## OBB 1110 (`proc-vehicle-obb-1110`)

- **Built on**: the box locomotive kit (`generator/boxLocoKit.ts`) with its own profile tables and its
  three-axle `bogie3`, `generator/atObb1110.ts`; no kit change. The registry re-exports `obb1110` and
  `obb1110Lod`.
- **Parameters**: `livery` - `firGreen` (default; 1110.21 as delivered and photographed in 1964: fir green,
  aluminium lines, silver roof, two scissor pantographs), `bloodOrange` (the preserved 1110.505, a 1110.500:
  cream lines, black skirt, the rheostatic brake's resistor boxes over the cabs, single-arm pantographs).
  The roof equipment follows the livery: the ten 1110.500 were rebuilt in 1974-75, in the blood orange era.
- **Figures** (German Wikipedia "ÖBB 1110", "ÖBB 1010"): 17.86 m over buffers, 3.09 m wide (over the
  handrails; the walls 3.0 m), 4.26 m high, bogie centres 8.6 m, bogie wheelbase 4.1 m, wheels 1.3 m;
  `game` 106 t, 4,000 kW, 110 km/h.
- **Shape facts**: head-on (1110 028, 226 px/m over the 3.09 m body): roof crown 4.2 m, eave 3.81 m on the face (3.88 m on the side),
  windscreens 2.88-3.62 m at |z| 0.17-1.11, the line under them 2.67-2.8 m all round, headlights at
  |z| 0.94, 2.14 m in pods 0.5 m across, one red tail lamp under the right-hand headlight, the top light on
  the roof dome. The front upright to the line, the windscreen band leaning back 0.13 m to the eave, the
  roof doming 0.72 m back to the crown; in plan a flat face with 0.38 m round corners. The skirt from
  1.0 m, the lower line 1.46-1.51 m.
- **Side** (1-D projective fits on 1110 003 and 1110 023, the doors taken as symmetric): a door behind
  each cab at |x| 6.55-7.2 with its window and handrails; between them on the left side, from +x, three
  grilles (4.36-5.2, 3.42-4.26, 2.48-3.32), two windows (0.17-1.02, -1.83 to -0.98), a grille (-3.76 to
  -2.92), a window (-4.81 to -3.96), a grille (-5.88 to -5.04); the right side the same turned about, as
  the photos of both sides show. Windows, grilles and the door window 2.84-3.74 m (0.9 m tall, about 0.85 m wide, from just
  over the line to 0.14 m under the eave, as on 1110 003), the grilles' louvres in the body colour.
- **Roof**: the pantographs at |x| 4.7 (scissor) or 4.55 (single arm), the rear raised; the roof line
  on post insulators with the main breaker in the middle; on the 1110.500 the resistor boxes |x| 5.5-7.5,
  0.6 m high, louvred along the sides and across the front.
- **Front paint**: the winged wheel (ring, feathers, B and B, the Umlaut dots) and the number in white.
- **References**: `assets/obb-1110/` - 1110.505 (three-quarter), 1110 003 and 023 (both sides), 1110 028
  (head-on), 1110.21 in 1964 (green, roof), the 1010 sisters 1010.10 (green) and 1010 003.
- **Deviations**: the side positions come from oblique photos (no side-on view or drawing was available);
  the 1990s "Pflatsch" emblem and the rebuilt 1110.500 fronts are not modelled; the 1010 (130 km/h) is not
  a separate parameter; the bogies are the kit's generic three-axle bogie.
- **Budget**: 13,790 triangles (fir green), 14,454 (blood orange); distant model within 100.

## OBB 1189 Krokodil (`proc-vehicle-obb-1189`)

- **Built on**: the box locomotive kit (`generator/boxLocoKit.ts`) for the centre body, with the hoods'
  own shells and its own rod running gear, `generator/atObb1189.ts`; no kit change.
- **Parameters**: `livery` - `green` (default; 1189.05 in OBB fir green, RAL 6009, 1955-1979, red
  coupling rods), `brown` (1189.08 in the OBB brown of 1953-55), `bloodOrange` (1189.02 from 1971, a
  light line under the windows).
- **Figures** (German Wikipedia "BBÖ 1100", the 1100.1 series): (1'C)(C1'), 20.4 m over buffers,
  wheelbase 17.7 m, drivers 1,350 mm, carrying wheels 870 mm; `game` 116 t, 1,740 kW (continuous;
  1,900 kW one-hour), 75 km/h. Built 1926/27 by Floridsdorf with Austrian Brown Boveri equipment.
- **Running gear**, measured side-on on 1100.102 (60.3 px/m over the published wheelbase): per half
  the pony at |x| 8.85, the drivers at 6.86, 3.01 and 1.30 m, the jackshaft at 4.6 m and 1.1 m up with
  the gear cases of its wheel and a motor pinion between the frame and the wheels. Each half's three
  drivers, jackshaft, inner frame and rods are one turning unit; the pony (an Adams axle) is its own.
  The coupling rod runs on the drivers' crank pins (0.3 m cranks, the left side 90 degrees ahead); the
  jackshaft's crank drives it through a vertical link, as photographed. Static: no running animation.
- **Shape facts**: the centre body 6.84 m long and 3.0 m wide, eave 3.62 m, roof 3.85 m, the roof
  running out 0.4 m over each end as a visor; the cab ends' corners chamfered 0.45 m with a narrow
  window on each chamfer, two front windows 0.62 m wide (2.88-3.55 m) and the headlight between them.
  Per side: the cab doors at |x| 1.92-2.58 with tall windows and handrails, windows at 0.85-1.45
  (2.9-3.52 m) over grilles and low vents, the number plate and the OBB lettering in the middle, on the
  right side the vertical louvre over them (photographed on 1189.09), the white slatted box with its Y
  stays under the body (|x| < 1.97). The hoods 2.5 m wide and 2.72 m high to |x| 8.75, the top falling
  0.3 m over the last 1.4 m into the front; three louvres a side (3.68-4.2, 6.15-6.7 tall, 7.4-8.3 low)
  and the round cover low ahead of the first driver; the black frame band along the hood's foot
  (1.28-1.72 m), the skirt arching over the first driver and down to 1.1 m; the headlights in housings
  on the front's top corners, the number plate between them, the dark step box and buffer beam below.
  Two red diamond pantographs at |x| 2.95, the rear raised, the roof line and the main switch.
- **References**: `assets/obb-1189/` - 1100.102 (ex 1189.02) side-on and front three-quarter (1998),
  1189.09 at Ampflwang (2012; 2013 with a hood off, the running gear bare), 1189.02 in blood orange,
  E 89 002 in 1947.
- **Deviations**: the brown livery has no photograph (the article's text only); the hood's top-edge
  details and pipework, the brake rigging, sandboxes and the front hoses are not modelled; the hoods
  are fixed to the body (on the prototype they ride on the frames), so on curves the running gear
  turns under them. The jackshaft's exact position differs a little between the two sides' photos.
- **Budget**: 15,454 triangles (green), 15,512 (brown), 15,462 (blood orange); distant model 100.

## OBB 2016 Hercules (`proc-vehicle-obb-2016`)

| | |
|---|---|
| Built on | the box locomotive kit (`boxLocoKit.ts`) with its own profile, `generator/atObb2016.ts`; no kit change |
| Parameters | none: OBB traffic red with the dark grey skirt (no second OBB scheme found on the photographs) |
| Figures | 19.275 m over the buffers, 2.87 m wide, 4.27 m high (photo), Bo'Bo', bogie centres 10.362 m, 2.7 m wheelbase, 1.1 m wheels; 80 t, 2,000 kW, 140 km/h (de.wikipedia "OBB 2016") |

- **Side** (the near-square side of ER 20-006, a 1-D projective fit over both buffers and both bogie
  centres, about 46 px/m): the cab side window 7.56 - 8.36 m from the middle in a black field whose
  front edge rakes back along the cab corner, the mirror housing at its front; the cab door 6.80 -
  7.52 m between two handrails; the front module's crease round the corner at the window's foot
  (2.55 m) and its seam down ahead of the door. Side wall upright to 3.31 m, a narrow chamfer to
  3.61 m, then the broad sloping roof to 4.27 m; the skirt reaches down to 0.63 m over the wheels' tops.
- **The two sides differ** (2016 061, 100, 038, RTS 2016 905, ER 20-006): the left side (-z) has two
  tall grilles behind the front cab door (3.57 - 6.53 m) and a pair ahead of the rear one (-5.32 to
  -2.42 m); the right side one grille in two halves behind the front cab door (5.09 - 6.53 m) and plain
  panels. Panel joints at 2.09, 0.55 and -0.97 m. Grilles painted red, vertical slats.
- **Front** (head-on of ER 20-014 at about 145 px/m, side profile): upright over the lamps (9.28 m from
  the middle), leaning back about 28 degrees over the windscreen (2.55 - 3.45 m, one pane 2.04 m wide)
  and rounding into the roof 2.1 m behind the lamps. The face flat across, its corners rounded 0.33 m
  below the windscreen, 0.41 m wide and 0.6 m deep round it. The top headlight's box under the
  windscreen between the two halves of the grab rail, the tall handrails on the corners, the lamp boxes
  low on the face (1.40 - 1.76 m, headlight outboard of the red tail lamp), the red face's lip at 1.30 m
  over the recessed grey buffer beam, rectangular buffers, the plough.
- **Roof**: five vents in each slope over the rear half, the engine room's grey hatch on the crown
  between them with two low exhaust outlets (smoke emitters).
- **Paint**: traffic red, dark grey below 1.30 m round the whole body; the white OBB mark (the open O
  with its stroke) on the face over the number and big on each side (left side mid-body, right side
  toward the rear cab); the running number 2016 038-8 on the face and the skirt.
- **References**: `assets/obb-2016/` (three OBB photographs: 2016 061, 100, 038; four ER20 sisters for
  the body only; SOURCES.md).
- **Deviations**: the roof over the front half is drawn plain (no photograph from above); the exhaust
  outlets' exact shape is a guess; the bogie arches are not cut in the skirt; the grey buffer beam is
  the shell's set-back lower face rather than a separate headstock.
- **Triangles**: 14,354; the distant model 100.

## OBB 2043 (`proc-vehicle-obb-2043`)

| | |
|---|---|
| Built on | the box locomotive kit (`boxLocoKit.ts`) with its own profile, `generator/atObb2043.ts`; no kit change |
| Parameters | `livery` bloodOrange (ivory lines and roof, the Pflatsch, 2043 005-4; default) / trafficRed (light grey band, dark grey cab cap, 2043 043-5) |
| Figures | the series 2043.05 - 77: 15.76 m over the buffers, 3.0 m wide, eave 3.66 m, crown 4.08 m; B'B', bogies 8.0 m apart, 2.5 m wheelbase, 950 mm wheels; 70 t, 1,104 kW, 110 km/h (de.wikipedia "OBB 2043"; the four pre-series locomotives were 14.76 m long) |

- **Front** (head-on 2043 005 at Kritzendorf, 206 px/m from the buffers 1.75 m apart; 2043.54,
  220 px/m): flat and upright to the line under the windscreens (2.74 - 2.80 m), leaning back 0.17 m
  above it to the eave and rounding over into the roof; corners rounded 0.26 m in plan below the line,
  0.42 m above it, the cab narrowing to about 2.8 m at the windscreen head. Two windscreens side by side
  (z 0.13 - 1.10 m, 2.84 - 3.50 m), the round headlights (1.55 m, z +-0.86 m) with the tail lamps over
  them (1.85 m) in a stadium-shaped pod, the top headlight between two small lamps in a housing on the
  roof edge (body colour; cap grey in traffic red), a grab rail over the line, upright handrails at the
  corners, the Pflatsch at 2.24 m and the running number under it, side buffers and the plough.
- **Side** (2043 005-4's +z side, a projective fit over both body ends with the end heights 1.87:1):
  at each end the cab side window (5.98 - 6.52 m from the middle) ahead of the cab door (5.19 -
  5.85 m, its narrow window, handrails either side); ten machine-room windows 0.86 m wide at a
  0.945 m pitch from -4.34 m to the "1" end's door, nearly square in light frames (2.83 - 3.61 m); under the row's start at the "2"
  end (-x) the radiator grille (-4.34 to -3.27 m) and the red louvre beside it; the same on both sides
  (2043.54 shows the grilles at the same end on its other side). The side Pflatsch under each cab window,
  the running number amidships.
- **Roof**: the engine room hatch (-3.1 to 0.15 m), a small hatch and a fan cover; the exhaust stack,
  a roof-coloured cylinder, behind the "2" end's cab off the centre line (-5.55 m, z -0.5 m).
- **Paint**: blood orange, ivory lines at 1.36 and 2.74 m the whole way round, the ivory roof, a
  dark grey frame below. Traffic red: the light grey band 1.36 - 1.80 m round the lamps, the dark grey
  cab cap from the line to the red line at 3.57 - 3.64 m, swept back onto the cab side to behind the
  door, the grey roof and frame.
- **References**: `assets/obb-2043/` (eight Commons photographs: 2043 005, 035, 043, 034, 2043.54 and
  2043.70; SOURCES.md).
- **Deviations**: all ten machine-room openings are glazed as delivered (2043 005 later had five of them
  replaced by grilles); the 1979 winged-wheel emblem is not drawn (both liveries carry the Pflatsch);
  width and heights are photo estimates; the bogie arches and the underframe's small boxes are simplified.
- **Triangles**: 13,052 (traffic red 13,288); the distant model the coarser profile, the window row as
  one band and the ivory lines left out, within 100.

## OBB 1099 (`proc-vehicle-obb-1099`)

- **Built on**: the box locomotive kit (`generator/boxLocoKit.ts`) for the body, with its own headlight
  housings, lettering, one diamond pantograph and its own 760 mm rod running gear,
  `generator/atObb1099.ts`; no kit change, no shared gauge type (the game lays one track).
- **Parameters**: `livery` - `bloodOrange` (default; 1099.011 in OBB blood orange and ivory, 2004: the
  orange eave line, the ivory line and orange pinstripe under the windows, the ivory foot line, the OBB
  emblem and number on the face, the Puchenstuben arms on the side), `brown` (E 10 in the NOVOG gold and
  brown of 2021, the light grey roof, silver louvres, the Oetscherbaer's bear and "E 10" on the face).
- **Figures** (German Wikipedia "NÖLB E"): C'C', 760 mm, 11.02 m over the Bosna couplers, 2.48 m wide,
  3.4 m high, wheels 800 mm, bogie wheelbase 2.4 m, pivots 6.1 m apart; `game` 49.8 t, 420 kW (one-hour;
  320 kW continuous), 50 km/h. Built 1909-14 by Krauss Linz with Austrian Siemens-Schuckert equipment;
  the body modelled is the one of the 1959-62 rebuild.
- **Measured** on 1099.011 side-on three-quarter: a projective fit over the two equal cab doors (the
  vertical scale 100-114 px/m along the side, the horizontal one falling with its square) gives the
  side from cab 1 (-x; the left side point-symmetric): cab door 3.7-4.28 m from the middle (0.58 m, its
  window 2.18-2.89 m), the dark louvre -2.68 to -1.53, the long ribbed louvre -1.14 to 0.28, the short one
  0.69-1.45, the window 1.88-3.03 (2.33-2.88 m high), the low grille under the first louvre, the low
  hatch under the window, the number at -0.35 and the arms at 1.2. Bands: body 1.15 m, ivory foot to
  1.21, orange to 2.06, ivory line, orange pinstripe 2.12-2.16, ivory to 3.07, orange eave line to 3.12.
- **Shape facts**: the body 10.1 m over the end walls and 2.4 m wide, the roof an arc from the eave
  (3.12 m) to 3.4 m, falling over both end walls in a 0.55 m curve with the top lamp on it; the end walls
  upright, bowed 4 cm, their corners rounded 0.22 m; two equal front windows (|z| 0.07-1.0, 2.2-2.97 m);
  the round headlights in housings standing 7 cm off the wall at |z| 0.72, 1.78 m; the vacuum hoses; the
  black frame under the body, the bogies' headstocks with the centre coupler at 0.6 m and red tail lamps.
- **Running gear**: two bogies at |x| 3.05 (the pivots), axles 1.2 m apart, each a turning unit: outside
  frame plates, the motor high in the middle, the jackshaft between the inner and the middle axle at
  0.66 m with its large Hall crank disc, Hall cranks on the axles, the coupling rod over all three, the
  triangular link from the jackshaft's crank to the rod's slot, and the long brace from the bogie's outer
  end down to the middle (0.5 m), as photographed. One red diamond pantograph at x -1.6 (raised, arm
  1.5 m for its long reach), the roof line to an insulator over the machine room.
- **References**: `assets/obb-1099/` - 1099.011 (2004, side), 1099.02 (2002, cab three-quarter),
  1099.004 (front three-quarter at speed), 1099.06 (face close-up, 2018; three-quarter, 2020), E 10
  (gold and brown, 2021).
- **Deviations**: the total wheelbase is drawn 8.5 m (the pivots at the bogie centres; the article's
  7.9 m does not fit its own 6.1 m + 2.4 m, and the side photo puts the outer axle 0.8 m inside the end
  wall); only the right side was photographed side-on, the left side is drawn point-symmetric; the OBB
  emblem is simplified; brake rigging, sandboxes, the step ladders' detail and the roof horn are not
  modelled; the rods are static.
- **Budget**: 11,785 triangles (blood orange), 11,404 (gold and brown); distant model 94.

## BBO 214 (`proc-vehicle-bbo-214`)

- **Built on** the steam kit (`generator/atBbo214.ts`; steamLoco.ts `buildLoco`, the distant model
  `steamLocoLod`), its own spec module like the DRG 01 (deSteam01.ts), registered in atLocos.ts.
- **Parameters**: `unit` `locomotive` (default), `tender` (the steam kit's `UNIT_PARAM`); one
  paint, the preserved 12.10 as restored (no photograph shows another).
- **Figures** (de.wikipedia "BBÖ 214"): 1'D2' h2, 22.58 m over the buffers with the tender (the
  model: engine 16.13 m, tender 6.45 m), 3.15 m wide (the model 3.09 m, the test gauge's 3.1 m), 4.65 m high (the model 4.60 m), drivers
  1,940 mm, carrying wheels 1,034 mm, cylinders 650 x 720 mm, 123.5 t (1936 batch) plus the 60 t
  tender, 2,162 kW indicated, 120 km/h (game: 123.5 t, 2,162 kW, 120 km/h; tender 60 t).
- **Measured** on the 2007 side photograph of 12.10 at 18.6 px/m (22.58 m over 418 px; the drivers'
  19.5 px diameter agrees): the leading axle 1.41 m behind the buffer heads, the drivers at 4.41,
  6.56, 8.71, 10.86 m (2.15 m apart), the trailing truck's axles at 12.55 and 14.6 m (the first
  moved 0.1 m back from the photo's 12.45 to clear the last driver), the cab from 13.44 to 15.7 m;
  the running board 2.3 m up, the deflectors from 1.5 to 3.95 m and up to 4.15 m (their front 0.2 m behind the smokebox front, as the 1980 and 2002 photographs show), the smokebox from 1.3 m with the door dished 0.18 m further forward; the tender's
  four axles 1.45 m apart, its tall front part (to 4.0 m) 3.4 m long over the low rear tank (3.1 m).
- **Shape facts**: the short wide chimney close behind the smokebox door, dished to a flat centre with two hinge straps and the handle (number 12.10
  painted on it), the long flat-topped casing over the domes (1.24 m wide, 6.5 m long, to 4.5 m),
  the round-topped firebox over the trailing truck; the large flat deflectors standing clear of the smokebox (open space between plate and drum) at the running
  board's edge with the step plates under their front, the running board falling steeply to the
  black buffer beam, the two lamps on the beam with their bright hand loops; the feed-water
  heater drum and the box behind the deflector on the +z side (the side the 1980 photograph shows),
  the two air pumps on the other; the cab with its small front and larger rear side window. The
  outside cylinders behind the leading axle, the 4.25 m main rods driving the third coupled axle;
  rods red, wheels black with bright tyres. The tender's outside plate frames with axle boxes and
  springs, the lid on the tall part, the rear handrail.
- **References**: `assets/bbo-214/` - 12.10 side-on (Strasshof 2007), front three-quarter (2002),
  left three-quarter (1980), restored tender rear (2020), the CFR 142.050 works photo (shared
  running gear only).
- **Deviations**: no works drawing was found, so the wheelbase is measured on a 500 px photograph
  (about +-0.15 m); the cylinders are horizontal and the Lentz valve gear is drawn as the kit's
  Walschaerts motion; pipes, sand boxes, brake rigging, ladders and the tender's hatch detail are
  omitted; the boiler-top casing has chamfered plan ends where the real one has a sloping front.
- **Budget**: engine 13,830 triangles, tender 3,684; distant model 98 and 44.
