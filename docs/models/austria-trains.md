# Austria's trains

**Covers** - twenty Austrian designs: the OBB Railjet, Talent 4024, Cityjet 4744, 4020, Transalpin 4010, 5047, Desiro 5022, the WESTbahn KISS, the Mariazellerbahn's Himmelstreppe, the CityShuttle double-deck coach and the Nightjet; the 1116 Taurus, 1144, 1142, 1110, 1189 Krokodil, 2016 Hercules, 2043, the Mariazellerbahn's 1099 and the BBO 214 steam engine. Their modules, figures, the detail pass that matched each to its photographs, deviations and tests.
**Code** - `generator/atUnits.ts` (`AT_UNITS`, the units' registry), `generator/atLocos.ts` (`AT_LOCOS`, the locomotives' registry), one module per vehicle (`generator/at*.ts`), `test/worldTrains.test.ts`, `assets/obb-*/`
**See also** - [germany-trains.md](germany-trains.md) (the same pass for Germany), [switzerland-trains.md](switzerland-trains.md), [shinkansen.md](shinkansen.md) (the series kit), [world-locos.md](world-locos.md), [world-steam.md](world-steam.md), [world-coaches.md](world-coaches.md), [mainline-electrics.md](mainline-electrics.md) (the OBB 1012 and 1040)

The catalog already had the OBB 1012 and 1040 and the Vectron; none is repeated here.
Every design is filed under Austria (`generator/factTable.ts`). Each starts as a draft
(docs/site/workshop.md).

## The designs

<!-- design:obb-railjet -->

<!-- design:obb-4024 -->

### OBB 4744 Cityjet (`proc-vehicle-obb-4744`)

| | |
|---|---|
| Built on | series kit with its own cab face (`atObb4744.ts`: `OBB4744`, `OBB4744_FACE`), conventional bogies (no Jacobs) |
| Parameters | `unit` (`endCar`, `middleCar`, `train`); one livery (Cityjet), so no `livery` or `cars` choice |
| Figures | Siemens Desiro ML, Bo'Bo' + 2'2' + Bo'Bo', 75.152 m over the couplers (end cars 25.18 m tip to coupler, middle car 24.79 m), 2.82 m wide, bogie centres 16.24 m, wheelbase 2.3 m, wheels 850 / 760 mm; 2,600 kW, 160 km/h, 145 t (end 52 t, middle 41 t); 254 seats |
| Number | 4744 036 (the photographed pantograph car) |

- **Face** (head-on photo at 125 px/m, side-on photo at about 56 px/m at the nose): the red bumper upright
  from 1.0 to 2.05 m with the plough 0.2 m back at the bottom, the white band leaning back to the windscreen's
  foot at 2.45 m, then the windscreen and its black surround raked about 50 degrees back to the roof, which
  reaches full height 2.7 m behind the tip. The bumper is 2.35 m wide, its corners rounding 0.5 m back.
  A red frame (a bar under the windscreen, strips up its sides), the black surround with the 1.64 m glass and
  the destination display, the OBB logo on the white band (2.08 - 2.43 m), two lamp pods (0.5 x 0.31 m, two
  LEDs each) at 1.78 m, 0.62 m either side, the black buffer blocks and the coupler recess below.
- **Side** (projective/log fits of the photos): the end car (d behind the tip) has the cab side window
  (2.0 - 4.44 m, its front edge rounding up and back), a high window 5.6 - 8.1 m under the OBB lettering,
  its only door 9.3 - 11.1 m, four low panes 12.0 - 19.7 m (wide and narrow by turns) and a high pair over
  the rear bogie 20.9 - 24.2 m. The middle car mirrors it: high windows over both bogies, a door behind each,
  four low panes between. Two window rows: over the bogies 1.66 - 2.72 m, the low-floor section 1.17 - 2.27 m.
  Four doors a side in all (the 4746 has six); dark grey double plug doors (0.58 - 2.95 m), a tall window in
  each leaf and white stripes at the meeting edges.
- **Paint**: dark grey to 0.98 m, red to 1.36 m, a brighter red-orange band to 1.89 m, red to the low
  windows' heads at 2.27 m, white above; ahead of the cab the red's top drops to the face's white band.
  The distant model paints the three reds as one band.
- **Roof**: the end cars carry the cab cooling unit, the converter and the transformer cooler; one single-arm
  pantograph on the 4744.0 end car over its rear bogie (`endPantograph: "lead"`); the middle car one
  air-conditioning unit.
- **References**: `assets/obb-4744/` (six Commons photos of 4744 036, 053, 065, 503, 536; SOURCES.md).
- **Deviations**: the side "cityjet" lettering is left out (the stroke font has no lower case), and the
  running number is on the sides only (on the raked face it cost 740 triangles). Car lengths are a fit to
  perspective photos (no drawing found); the 4748's 26.1 m fourth car is not this unit's middle car.

<!-- design:obb-4020 -->

<!-- design:obb-4010 -->

### OBB 5047 (`proc-vehicle-obb-5047`)

| | |
|---|---|
| Built on | series kit, a `single` railcar with its own cab face at both ends (`atObb5047.ts`: `OBB5047`), `railcarUnderside` for the body low under the cabs and between the bogies, high over them; no kit change |
| Parameters | `livery`: `trafficRed` (default, OBB red with the dark grey windscreen band, light grey body), `valousek` (the 1987 delivery paint: ivory, ultramarine and blood orange, the old emblem) |
| Figures | Jenbacher Werke 1987 - 1995, 2'B', 25.42 m over the buffers (24.18 m tip to tip, buffers 0.62 m out), 2.9 m wide, 3.83 m high; bogies 4.1 m inside the tips, 2.2 m wheelbase, 840 mm wheels; 419 kW, 120 km/h, 43.7 t, 62 seats |
| Number | 5047 011-1 (traffic red), 5047 001-2 (Valousek) |

- **Face** (head-on photographs at about 142 and 180 px/m from the buffers): flat and upright to the lamps,
  leaning back 0.1 m over the two windscreens (2.33 - 3.18 m, 1.02 m each either side of a 0.2 m pillar),
  rounding into the roof from 3.45 m, the crown 0.75 m behind the tip; bevelled corners (0.25 m low, 0.12 m
  beside the windscreens). Headlight and red tail lamp each side at 1.66 m, the roof lamp between two small
  lamps at 3.62 m, the two grilles under the logo, the buffers out of the bodywork (no beam) over the plough.
- **Side** (projective fits over the body ends and the windows' 2.0 m pitch on the 5047 011 and 5047 001
  photographs, residuals 0.2 - 0.3 px): leading cab: the small cab window 0.34 - 0.65 m and the cab door's
  window 0.8 - 1.25 m behind the tip, the passenger door 1.43 - 2.46 m; windows (2.02 - 2.87 m, alu frames
  with a transom) 3.37 - 4.28, a narrow one 5.1 - 5.71, six on the pitch from 6.27, a narrow one at 17.6, two
  more to 21.51 m; the rear door 22.2 - 23.25 m, next to the rear cab (no cab window there on this side).
- **Paint**: traffic red - the red ends back to an edge slanting from 5.45 m at the foot to 3.55 m at the roof,
  carried up the roof's edges, the dark grey band (1.95 - 3.27 m) from the face along the cab side to the door,
  white doors. Valousek - ivory, a blood-orange stripe at 1.27 - 1.43 m, the ultramarine window band
  (1.93 - 3.05 m) dropping to the stripe behind the orange door zone at each end, a blue roof edge; on the
  face blue round the windscreens over the orange number band, the emblem on the ivory, the blue beam and
  orange plough.
- **Roof and gear**: the exhaust housing on the crown near the rear end (the engine is under the floor);
  engine, cooler and tanks under the middle.
- **Distant model**: the red (orange) end zones as side fields, the face's own bands.
- **References**: `assets/obb-5047/` (eight Commons photographs, SOURCES.md).
- **Deviations**: both sides carry the photographed side's layout (the cars differ side to side); the
  delivery livery key is `valousek` (the photographs show ivory with blue and orange, not an all-orange
  "blood orange" paint); width and height are estimates (no drawing found); the face's "OBB" is without
  the umlaut; the Valousek face's blue band runs to the face's edges (an ivory rim on the prototype). Triangles: 15,764 (traffic red), 15,541 (Valousek); distant model 94 / 100.

<!-- design:obb-5022 -->

<!-- design:westbahn-kiss -->

<!-- design:noevog-himmelstreppe -->

<!-- design:obb-cityshuttle-dd -->

<!-- design:obb-nightjet -->

<!-- design:obb-1116 -->

### OBB 1144 (`proc-vehicle-obb-1144`)

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

<!-- design:obb-1142 -->

<!-- design:obb-1110 -->

<!-- design:obb-1189 -->

<!-- design:obb-2016 -->

<!-- design:obb-2043 -->

<!-- design:obb-1099 -->

<!-- design:bbo-214 -->
