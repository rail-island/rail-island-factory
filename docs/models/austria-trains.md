# Austria's trains

**Covers** - twenty Austrian designs: the OBB Railjet, Talent 4024, Cityjet 4744, 4020, Transalpin 4010, 5047, Desiro 5022, the WESTbahn KISS, the Mariazellerbahn's Himmelstreppe, the CityShuttle double-deck coach and the Nightjet; the 1116 Taurus, 1144, 1142, 1110, 1189 Krokodil, 2016 Hercules, 2043, the Mariazellerbahn's 1099 and the BBO 214 steam engine. Their modules, figures, the detail pass that matched each to its photographs, deviations and tests.
**Code** - `generator/atUnits.ts` (`AT_UNITS`, the units' registry), `generator/atLocos.ts` (`AT_LOCOS`, the locomotives' registry), one module per vehicle (`generator/at*.ts`), `test/worldTrains.test.ts`, `assets/obb-*/`
**See also** - [germany-trains.md](germany-trains.md) (the same pass for Germany), [switzerland-trains.md](switzerland-trains.md), [shinkansen.md](shinkansen.md) (the series kit), [world-locos.md](world-locos.md), [world-steam.md](world-steam.md), [world-coaches.md](world-coaches.md), [mainline-electrics.md](mainline-electrics.md) (the OBB 1012 and 1040)

The catalog already had the OBB 1012 and 1040 and the Vectron; none is repeated here.
Every design is filed under Austria (`generator/factTable.ts`). Each starts as a draft
(docs/site/workshop.md).

## The designs

### OBB Railjet (`proc-vehicle-obb-railjet`)

- **Built on** the series kit (`generator/atRailjet.ts`; shinkansen.ts, seriesCab.ts), unwired
  (`traction: "none"`): the driving trailer Afmpz is the series' end car with a cab face, the
  economy coach Bmpz its intermediate car, the restaurant car ARbmpz a copy of the series with its
  own layout. The 1116 Taurus is its own design (`proc-vehicle-obb-1116`), not drawn here.
- **Parameters**: `unit` `endCar` (driving trailer, default), `middleCar` (coach), `restaurant`,
  `train`; `cars` 3 .. 7 (default 4) with `train`; `livery` `obb` (default), `cd`.
- **Figures** (de.wikipedia "Railjet 1. Generation"): driving trailer 26.85 m, coaches 26.50 m
  (the seven-car set 185.80 m; the model 185.85 m), 2.825 m wide, 4.05 m high, bogie centres 19.0 m,
  2.5 m wheelbase, 920 mm wheels, 230 km/h; weights 61 / 59 / 60 t (417.2 t the set); seats 27 /
  80 / 10, the set 404.
- **The train** (`railjetTrain`): the driving trailer leading, then the first-class Ampz (drawn as a
  coach), the restaurant car and coaches to the rear, where the locomotive couples (the 7-car set
  Afmpz, Ampz, ARbmpz, 3 x Bmpz, Bmpvz); three cars: driving trailer, restaurant car, coach. One
  articulated vehicle, each car on its own bogies, hinged at the coupling planes; the last coach's
  rear coupler drawn.
- **The nose**, measured on 80-90 728 (Wien Hbf), 80-90 721 (Landeck) and the set near
  Pfarrwerfen: the dark grey buffer beam upright to 1.42 m with the dark rectangular buffers (0.35 m out)
  and the beam's grey carried round the cab's lower corners; the red face set back 0.22 m and leaning
  back about 12 degrees past the tall dark lamp housings (head lamp over tail lamp, 1.56 - 2.2 m) and
  the grab rail; the wide windscreen in its dark frame, 2.47 - 3.45 m, raked about 45 degrees; the
  dark grey cap with the roof lamp and the number, carried back over the cab roof. The cab side is one
  black glass field (front following the windscreen's curve, rear raked, bottom falling forward) and
  the small raked window behind it; the WC's small square window, then the door 6.45 - 7.45 m behind
  the buffers.
- **Sides**: single-leaf plug doors at both ends of every car with the narrow round-ended window;
  ten 1.5 m panes 1.88 m apart in a black band (1.95 - 2.77 m) on the coach (projective fit along the
  St. Valentin Bmpz), nine on the driving trailer, the reservation display beside the coach's first
  door, each leaf in a dark frame with the class sign (1 or 2) beside it. OBB paint: red above the windows, a brighter red line
  under them (1.84 - 1.95 m), the umbra grey band below to the floor with the big outlined
  "railjet", the light grey skirt between the bogies, a light grey roof; on the driving trailer the
  grey band ends in a rounded point 1.45 m up ahead of the door. CD paint: sky blue with the white
  cant-rail line and the navy line under the band, light grey below, a navy roof, door leaves and
  front, the front's back edge a white line from the cant rail down to the face's corners and a navy
  sweep low along the flanks.
- **References**: `assets/obb-railjet/` (eight Commons photographs, SOURCES.md).
- **Deviations**: the restaurant car's windows (first-class panes, the wheelchair space, the
  restaurant's wider-spaced panes, the kitchen's blank wall) are laid out from two distant views only;
  the Ampz and the Bmpvz are drawn as the coach (the Bmpvz's buffered, gangway-less loco end is a
  centre coupler); the brief's 27.3 m driving trailer is the German table's 26.85 m, which adds up to
  the published set length.
- **Triangles**: driving trailer 13,391 (CD 15,515), coach 8,846 (CD 9,012), restaurant car 8,678; the
  distant model 78 - 100 a car, at most 500 a train. Text: the title verbatim; the lowercase `j` added to the
  stroke font (strokeFont.ts) for "railjet".

### OBB 4024 Talent (`proc-vehicle-obb-4024`)

| | |
|---|---|
| Built on | the series kit (`generator/shinkansen.ts`) with its own cab face (`seriesCab.ts`), `generator/atObb4024.ts`; no kit change |
| Parameters | `unit` endCar / middleCar / train; `cars` 4 (default) or 3 (the 4023's length); `livery` obb (the delivery paint, default) / cityjet |
| Figures | 66.87 m over the couplers (end cars 18.685 m coupler to joint, intermediate cars 14.75 m joint to joint, from the 4023's 52.12 m), 2.925 m wide, crown 3.85 m (the cab roof's hump 4.02 m); Bo'2'2'2'Bo', Jacobs bogies at the joints; 116 t, 1,520 kW, 140 km/h; 199 seats + 252 standing |

- **Running gear**: the motor bogie 4.05 m behind the face's tip (Ennstal photograph), 760 mm wheels.
- **Window bands** (Ennstal photograph, 28 px/m up the side at the door): over the low floor 1.36 - 2.64 m,
  over the end car's high floor from the cab side window to the door 1.96 - 3.25 m. Doors (projective fit
  over the three joints): the end car's 11.4 - 12.9 m behind the tip; an intermediate car's centred 4.5 and
  10.25 m behind its front joint. Windows: four ahead of the end car's door, two behind it; one between
  joint and door, two between the doors on an intermediate car.
- **Face** (the Ennstal photograph's silhouette, 251 px/m up and 208 px/m along at the tip): foremost at
  the coupler (0.85 m), leaning back ever more steeply - 0.1 m behind the tip at the mask's foot (1.6 m),
  0.3 m at 2.35 m, 0.74 m at 3.05 m, 1.3 m at the display's head (3.58 m) - and rounding over into the cab
  roof's hump (4.02 m) 2.4 m behind the tip, about 2.75 m from the coupling plane; bowed up to 0.16 m, the
  corners swept back 1.0 - 1.45 m. The black mask wraps round the corners; the black plough.
- **Cab cap**: part of the roof, not a box - the end car's crown (`endCrown`) rises to a 4.02 m hump over
  the cab and falls back to 3.85 m 5.3 m behind the tip; the dark grey cap is paint, on the face from the
  display's head up and over the hump, with the lamp slot over the display and grilles on its flanks.
- **Roof**: the single-arm pantograph 7.6 m behind the leading end car's tip (the "Triebwagen", Graz and
  MAV photographs) with the high-voltage module behind it; the rear end car (`rearEnd`, the
  "Steuerwagen") and every intermediate car an air-conditioning unit (`endPantograph: "lead"`, so the
  shortest train is three cars).
- **Delivery paint**: white, the red front back to 6.7 m behind the tip, red joint panels 1.5 m each side
  of a joint above and below the black window band, white doors, the number and the red OBB letters on the
  end car. **Cityjet**: white, a red band 0.62 - 1.36 m rising to 1.75 m under the high band, the face's
  red lower front, white above it and a red line round the mask, black doors.
- References: `assets/obb-4024/` (six Commons photographs, the Ennstal one the side reference; the MAV 425
  for the shared body only). 13,698 triangles (end car; Cityjet 15,178), 5,496 (intermediate car).
- Deviations: the side heights rest on one near side-on photograph's scale (no works drawing found); the
  regional liveries and adverts are not drawn; a lone end car always raises its pantograph.

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

### OBB 4020 (`proc-vehicle-obb-4020`)

- **Built on** the series kit with its own cab face (`generator/atObb4020.ts`, after the Renfe 440's
  module): the 6020 driving trailer and the 7020 trailer are the series, the 4020 motor car its
  `leadEnd` (own layout, cab-face number, 950 mm wheels on 2.5 m bogies, roof fittings, pantograph).
- **Parameters**: `unit` (`endCar` = the 4020 motor car, `middleCar` = the 7020, `train` = 4020 +
  7020 + 6020, the driving trailer at the rear), `cars` (`3`, `2` with `train`), `livery`
  (`original`, `trafficRed`). The driving trailer is built only in the train.
- **Figures** (de.wikipedia): Bo'Bo' + 2'2' + 2'2', 69.4 m over the couplers (23.3 / 22.8 / 23.3 m),
  2.872 m wide, 3.75 m high, bogie centres 16.0 m; 62.4 / 32 / 33 t, 1,200 kW, 0.7 m/s2, 120 km/h;
  56 / 64 / 64 seats, 600 places in a unit.
- **Shape** (6020 304 side-on by a projective fit, 4020 254, both cab sides side-on at about
  240 px/m, 4020 246 head-on): the face upright to the lamp band (1.79 m), leaning back about
  15 degrees to the roof lamp, the dome reaching the crown 0.78 m behind the tip; the windscreen
  (2.06 - 3.0 m) and the display in a trapezoid frame 2.38 m wide at its foot, 2.08 m at its head;
  head lamps at the corners, tail lamps inboard, the Scharfenberg coupler in its yellow frame.
  Doors (1.75 m between frames, a narrow window in each leaf) at 6.3 and 15.25 m behind the tip of
  both end cars; the driving trailer has two windows behind the cab, the motor car the crew door
  and one window; four windows between the doors and three behind; the 7020 three, door, four,
  door, three; windows 1.15 m at a 1.6 m pitch, 2.03 - 2.9 m. The cab window high (2.45 - 3.2 m)
  1.42 - 1.96 m behind the tip with the handle panel ahead of it. The motor car's roof: the
  resistors' mesh cage behind the cab, three louvred housings, the single arm 13.4 m behind the
  tip, its knee trailing; the trailers' roof ventilators.
- **Liveries**: `original` (4020 095-8 / 6020 095-3; 6020 095 in 1988): ivory, the blue window band
  (1.9 - 3.1 m), stripe (1.24 - 1.4 m) and eaves line, the blue cab panel with its leaning edge and
  the even ivory gap behind it, the blue lower front with the white S-Bahn "S", the blue frame.
  `trafficRed` (4020 310-1 / 6020 314-8, the repaints from 2004): light grey between the doors,
  red ends (the cab end to an edge leaning before the first door, square behind the second door
  and outside the 7020's doors), the grey front over the red lamp band with "OBB".
- **Deviations**: the face numbers and the lettering are ASCII ("OBB" with two dots for the
  umlaut); the 1993 - 2004 grey-white repaint with the white "smile" is not offered (same pattern
  as `original`); the half-drop windows' sashes are not drawn; the 2-car train (motor car and
  driving trailer, as 4020 056 ran in 1991) is offered as the shortest train. Motor car 15,481
  triangles, the three-car train 39,646; the distant model 94 a car.
- **References**: `assets/obb-4020/` (ten Commons photographs, SOURCES.md).

### OBB 4010 Transalpin (`proc-vehicle-obb-4010`)

- **Built on**: the series kit (`generator/shinkansen.ts`) with its own cab face (`generator/seriesCab.ts`),
  `generator/atObb4010.ts`: the 6010 driving trailer as the end car, the 7010 as the intermediate car and
  the 4010 power car leading through `leadEnd` (its own length, layout, grilles, bogies, pantograph and
  roof); the design maps its own `unit` values onto the kit's. No kit change.
- **Parameters**: `unit` - `powerCar` (default, 4010), `middleCar` (7010 open second), `endCar` (6010
  driving trailer), `train`; `cars` 3 - 6 (default 4) with `train`: the power car, 7010s, the driving
  trailer turned at the rear. `livery` - `blueIvory` (default; ultramarine and ivory with the Pflatsch,
  4010 027-3 / 6010 012-0) and `trafficRed` (the 1990s Valousek scheme, 4010 008-3 / 6010 008-8).
- **Figures** (German Wikipedia "OBB 4010"): 149.12 m in six cars - power car 16.82 m, intermediate cars
  26.4 m, driving trailer 26.7 m (buffers at the cab ends, centre couplers between the cars); `game` 64 t
  power car, 44 t intermediate car, 43 t driving trailer (283 t in six), 2,500 kW, 150 km/h. Width
  2.83 m and crown 3.85 m are estimates from the head-on photographs (not published).
- **Face** (head-on 4010 021, about 200 px/m from the buffer spacing; 4010 027 three-quarter): upright to
  the windscreens' foot (2.34 m), the two windscreens leaning back about 9 degrees to 3.2 m, the dome
  rounding back 1.0 m to the crown; corners rounded 0.42 m in plan; the corner windows wrapping round onto
  the cab sides to 0.98 m behind the tip; the round head lamps (1.9 m) over the tail lamps (1.6 m) on
  their rings at lat 1.0; the top lamp's round housing standing forward off the dome with the red marker
  under it; rectangular buffers.
- **Sides** (projective fits on 4010 008 and 6010 008, the Leoben photograph): power car - cab door and
  its high window, two louvred grilles, the luggage door and window, two grilles, two narrow windows by
  the gangway; the unpainted brake resistor housing on the roof from 2.4 to 8.6 m behind the tip, 0.22 m high, the single-arm
  pantograph at 11 m (knee to the inner end), Bo'Bo' 9.0 m apart. Driving trailer - cab door, luggage
  window, door at 6.6 m, seven saloon windows at a 2.3 m pitch, rear door. 7010 - a door at each end,
  eleven windows 1.22 m wide at 1.95 m. Bogies 19.0 m apart on the coaches.
- **Paint**: blueIvory - ivory with the blue window band (2.08 - 3.23 m), an ivory and a blue line under
  it and a blue line at 1.19 - 1.3 m; the face blue under the ivory dome with an ivory and a blue line
  over the windscreens, the lamps on red fields framed in ivory, the white Pflatsch and number; the face's
  blue sweeping back onto the cab side down to the low line. trafficRed - red, the grey-white band
  1.33 - 1.77 m (across the face under the lamps), red, the umbra grey window band 2.0 - 3.11 m starting
  behind the cab window, umbra grey round the windscreens and corner windows.
- **References**: `assets/obb-4010/` - eleven Commons photographs (SOURCES.md), 1970 to 2008.
- **Deviations**: the brief's `bloodOrange` is not modelled: the class never wore it (de.wikipedia lists
  sapphire/ultramarine and ivory, then the Valousek traffic red, as do all photographs); `trafficRed` is
  the later scheme. The 1965 sapphire scheme with the wing emblem is folded into `blueIvory`. The
  compartment cars (7110, corridor and compartment sides differ) and the dining car (7310) are drawn as
  7010s: no photograph of their sides was found. Both sides of each car are the same. The corner windows
  stay glazed in both liveries (the rebuilt units had them closed). The distant model's 100-triangle
  budget drops the pantograph and the resistor housing.
- **Budget**: power car 15,498 (blueIvory) / 12,267 (trafficRed), driving trailer 15,662 / 12,179,
  intermediate car 9,412 / 9,120; six cars 66,164; distant model 100 a car, 496 for six.

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

### OBB 5022 Desiro (`proc-vehicle-obb-5022`)

| | |
|---|---|
| Built on | the series kit, spreading the DB 642's data (`generator/atObb5022.ts` on `BR642` from `deBr642.ts`): its body, face shape, Jacobs running gear, windows and doors; own face fields, liveries and fittings (the low window band split for the Cityjet); no kit change, DB 642 byte-identical |
| Parameters | `unit` endCar / train; `livery` obb (the delivery "Schraegdesign", default) / cityjet (the repaint every unit wears since 2017) |
| Figures | 41.7 m over the couplers, 2.83 m wide, B'2'B'; 70.3 t, 2 x 315 kW (5022 021 - 060 2 x 335 kW), 120 km/h; 117 seats (10 tip-up) |
| Number | 5022 007-8 (delivery paint), 5022 051-6 (Cityjet) |

- **Shape**: the DB 642's, unchanged (docs/models/germany-trains.md); the photographs show no difference
  in body, face, windows, doors or roof equipment.
- **Delivery paint** (Uebersbach photograph, scaled on the door 11.3 m behind the tip; Graz Hbf photograph):
  silver sides over a dark grey skirt (0.82 m), no light stripe; the red front's rear edge leaning forward
  from 6.45 m behind the tip at the skirt to 5.9 m at the window band's foot and 5.2 m at the roof (over the
  first high-floor window's middle); the dark grey window bands (2.05 - 3.3 m over the high floor, 1.28 -
  3.3 m over the low floor), light grey doors, the light grey cap; the red OBB letters (0.33 m) on the
  silver ahead of the door.
- **Face** (Graz Hbf and Graz Ostbahnhof photographs, about 230 px/m up the face): the white OBB letters
  centred in the lamp panel (1.81 - 1.98 m) between the headlights, the display over them, the number on
  the grey strip, the coupler's black recess across most of the face.
- **Cityjet** (Pachern photograph): white over a red band to 2.02 m, the
  low-floor windows reaching into it with red posts below 2.02 m; the red rising from 1.55 m at the face's
  corners to the band's head behind the cab side window; no dark window band; the black cap, a red line
  round the mask with white inside it, the white lamp panel under a red line with black lamp boxes and the
  red OBB letters (the mask reaching down round the lamps as their boxes), the white number strip; dark
  grey doors, a darker grey roof.
- References: `assets/obb-5022/` (four Commons photographs). 14,784 triangles (end car, delivery paint;
  Cityjet 15,966: the face's paint-edge tolerance 0.08 m), 27,052 the two-car train; distant model 100 a car.
- Deviations: the S-Bahn Steiermark and other advertising paints are not drawn; the side's class figure
  "2" and small markings are left out; the Cityjet's red shades are drawn as one, the white gap inside its
  red line round the mask is left out and the red line runs under the lamp boxes (the face's budget).

### WESTbahn KISS (`proc-vehicle-westbahn-kiss`)

| | |
|---|---|
| Built on | the series kit from Stadler's KISS base (`seriesHelpers.ts` `kiss()`, unchanged) with its own cab face, layout and paint (`atWestbahnKiss.ts`: `WESTBAHN_KISS`); one additive kit field, `endCarDoorsEach` (shinkansen.ts) and `doorBandsEach` (usTransit.ts): an end car's door leaves painted one by one |
| Parameters | `unit` endCar (default) / middleCar / train; `cars` 2 - 6 (default 4; the class 4010's six cars the longest); one livery (WESTbahn) |
| Figures | Stadler KISS class 4010, Bo'Bo' + 2'2' + ... + Bo'Bo', 150.0 m over the couplers as six cars and 100.36 m as four (end cars 25.36 m tip to coupling plane, middle cars 24.82 m), 2.8 m wide, 4.595 m high, wheels 920 mm, wheelbase 2.5 m; 6,000 kW (1,000 kW a car for the game, as the SBB KISS), 200 km/h, 296 t (end 62 t, middle 43 t); 501 seats (end car 70, middle car 90) |
| Number | 4010 008 (the Melk photograph's six-car set) |

- **Face** (head-on photo at about 189 px/m at the lamps): the KISS's face (the SBB KISS's profile and plan),
  painted white: the light blue apron to 1.58 m with two big black grilles beside the coupler and a plate over
  it, the white band with two silver-rimmed lamp pods (0.68 x 0.27 m, a round lamp inboard and an LED bar
  outboard, 0.87 m either side) and the WESTbahn mark between them; the dark dome from 2.05 m (2.0 m wide at
  its foot, widening to 2.36 m) to the roof with white wedges at the corners, the KISS 2's smaller
  rectangular windscreen (1.36 x 1.1 m) and the roof lamp.
- **Side** (a projective fit along the near side-on Wien photo, the Melk photo for the middle cars): the end
  car's raked cab window in a dark surround, a tall cab-section window 4.0 - 4.8 m behind the tip and a
  mid-floor one at 6.45 - 7.05 m, the first door 8.7 - 10.2 m, four lower-deck windows 11.0 - 17.7 m, six
  upper ones 8.9 - 19.5 m, the second door 18.2 - 19.7 m, a mid-floor and a tall window over the rear bogie.
  The middle car: a narrow window over each bogie, doors 5.5 - 7.0 and 17.3 - 18.8 m behind its end, five
  lower and seven upper windows. Lower deck 1.36 - 2.15 m, upper 3.2 - 4.0 m, doors 0.68 - 2.8 m with a narrow
  window (the KISS 2's single leaf). Bogies 5.5 m and 22.5 m behind the tip, the middle cars' 18.7 m apart.
- **Paint** (the KISS 2 scheme of 2017, which the 4010 and the third series carry): light blue below 1.5 m on
  every car; on the end car a light blue sweep rising from behind the cab to the upper deck, which stays blue
  to the end, white ahead of it, a dark wedge under the cab's roof fairing, a white wedge over the lower
  windows, lime behind them; a blue first door and a lime second one. The middle cars: a lime band at the
  lower windows, white above, a lime and a blue diagonal behind the first door. Dark window bands round each
  deck, orange door frames, a light roof. The distant end car is blue behind the white cab section.
- **Roof**: one single-arm pantograph on each end car (the leading one raised), as the SBB KISS.
- **References**: `assets/westbahn-kiss/` (six Commons photographs: 4010 003, 008, 023, a 4110 and the third
  series head on; SOURCES.md). 14,424 triangles (end car), 9,078 (middle car); the six-car train 64,480.
- **Deviations**: the windows are square (the KISS 2's rounded corners cost 1,800 triangles); the
  "westbahn.at" name is a blue bar (the stroke font has no lower case); the roof fairings, the small slot
  windows between the decks, the "First" lettering and the middle cars' varying diagonals (car 2 has none)
  are not drawn; the 2011 delivery paint (white with a narrower blue sweep) is not offered.

### Himmelstreppe (`proc-vehicle-noevog-himmelstreppe`)

- **Built on** the series kit (`generator/atHimmelstreppe.ts`; shinkansen.ts, seriesCab.ts) with its own
  cab face, like the RhB Allegra (`chUnits.ts`); no kit change. The NOVOG ET 1 - ET 9 of the
  Mariazellerbahn (Stadler 2012 - 2013, 760 mm gauge, 6.5 kV 25 Hz).
- **Parameters**: `unit` `endCar` (default), `middleCar`, `train` (always three cars); one livery
  (`novog`, ET 5).
- **Figures** (de.wikipedia "NOVOG ET1-ET9"): 50.74 m over the couplers (end cars 17.07 m, middle car
  16.6 m, the three bodies alike on the side photograph), 2.65 m wide, crown 3.45 m (3.55 m over the roof
  equipment), 770 mm wheels, Bo'2'2'Bo'; 75 t (end car 26 t with 600 kW, middle car 23 t), 1,200 kW,
  80 km/h, 0.9 m/s2; 116 seats (36 / 44 / 36).
- **Measured** on the whole unit side-on (Himmelstreppe1.JPG, 19.41 px/m over its 49.84 m of body): the
  end car's cab window 0.64 - 1.62 m behind the tip, the emblem, a narrow and two wide windows in the
  high-floor section (sill 1.66 m), the double door 8.6 - 10.1 m, a blank stretch and two tall
  low-floor windows (sill 1.2 m) to the joint; the middle car's three windows, door at 6.0 - 7.5 m and
  four windows; the grey band 1.08 - 2.75 m, from 1.6 m between the cab and the door. The face head-on
  (St. Poelten, about 190 px/m): nearly body-wide, corners rounded 0.3 m (0.5 m at the cap), leaning
  back 0.3 m by 2.6 m and rounding into the roof 1 m behind the tip; the grey shield round the windscreen
  (1.75 - 3.14 m, +-0.96 m, its upper corners cut along the A-pillars) with the display, the round lamps
  at +-0.68 m, 1.36 m, the "Die Himmelstreppe" plate; the gold bumper bulging forward, the dark foot,
  the ribbed crash boxes and the Scharfenberg coupler at 0.42 m.
- **Roof**: the two single-arm pantographs on the middle car 3.1 m inside its ends, the one at the
  +X end raised (knee toward the car's middle, as photographed), the other folded; gold housings
  with dark grilles. The emblem (gold drop with the white crescent and steps) behind the cab window,
  "Die Himmelstreppe" in white under the high-floor windows (the stroke font's new `p`).
- **References**: `assets/noevog-himmelstreppe/` (five Commons photographs, SOURCES.md).
- **Deviations**: the middle car's trailer bogies are drawn under the joints, carrying both cars
  (`jacobsInset` 2.0 m: a lone car stands on its own bogie 2.0 m inside its inner end); on the
  prototype they stand under the middle car and the end cars hang on it, hidden by the skirts either
  way. The kit's 2.2 m bogies everywhere (trailers 1.9 m) on the game's one track gauge; the script
  lettering and the station names over the windows are drawn as upright stroke letters / left out.
- **Triangles**: end car 15,890, middle car 8,870, train 35,618; distant model 92 / 86 / 292.

<!-- design:obb-cityshuttle-dd -->

### OBB Nightjet (`proc-vehicle-obb-nightjet`)

| | |
|---|---|
| Built on | the series kit (`generator/atNightjet.ts`; shinkansen.ts, seriesCab.ts) on the Railjet's section, bogies and doors (`...RAILJET`, atRailjet.ts unchanged), unwired (`traction: "none"`); the couchette and sleeping cars copies of the series with their own layouts |
| Parameters | `unit` `endCar` (the control car Bfmpz, default), `middleCar` (the multi-purpose car ABbmpvz), `couchette` (Bcmz), `sleeper` (WLAmz), `train`; `cars` 3 .. 7 (default 4) with `train` |
| Figures | de.wikipedia "Nightjet": coaches 26.5 m, the control car taken as the Railjet's 26.85 m (the set 185.85 m), 2.825 m wide, 4.05 m high, bogie centres 19.0 m, 230 km/h; 70 / 30 / 40 / 20 places, 260 the set; 57 t the couchette car (its plate), the others estimated on the Railjet's |

- **The set is push-pull**: the new Nightjet has a control car with a cab (not a coach train), so the
  default unit is that control car (railroad-vehicle skill: the car leading the train). `nightjetTrain`:
  the control car, the multi-purpose car (from four cars), couchette cars, the sleeping cars at the rear
  where the locomotive couples (seven: Bfmpz, ABbmpvz, 3 x Bcmz, 2 x WLAmz; three: control car, couchette,
  sleeper).
- **The face** (80-91 721 side-on at Wien Hbf, 120 px/m; 80-91 713 head-on at Hamburg): the Vectron-like
  face of the second Railjet generation. The dark grey beam upright to 1.38 m with the buffers 0.33 m out;
  the blue face set back 0.38 m over it, leaning slightly forward to 2.3 m (0.31 m back), then back ever
  more steeply to the cap (3.55 m, 0.93 m back) and rounding into the roof 2.3 m behind the tip. Head-on:
  the black louvred panel (1.47 - 2.04 m) between the tall lamp housings (head lamp over tail lamp), the
  blue band with "nightjet" to 2.39 m, then the black band, the two-pane windscreen (2.72 - 3.54 m) and
  the black cap with "OBB", the roof lamp and the number, all between blue corner pillars.
- **The control car's side**: the cab side window in a black field following the face's corner; the red
  swoosh ahead of the door, its top falling from the side's red band (2.23 m at the door) to a point
  1.5 m behind the tip low over the bogie, with the dark grey wedge in it (to 3.45 m behind the tip);
  "OBB nightjet" at 3.05 m; the door 6.25 - 7.25 m behind the tip, nine panes from 8.1 m.
- **Sides**: navy, the dark grey line 1.71 - 1.86 m, the red band 1.86 - 2.23 m reaching into the panes'
  lower part, navy above, the light grey skirt between the bogies, a light grey roof; every door in a
  light grey frame, its leaf's window as tall as the panes. Seats and sleeping cars: one black window
  band; the big outlined "nightjet" low on the seats' cars. Couchette car: a narrow pane and the three
  four-berth compartments' panes in their own frames behind the door, then seven columns of mini cabins,
  each an upper (2.45 - 3.33 m) and a lower (1.5 - 2.29 m) black frame of two panes, the big "nightjet"
  high near the door end. Sleeping car: a narrow pane and ten cabins' panes, two small low windows.
- **References**: `assets/obb-nightjet/` (eight Commons photographs, SOURCES.md).
- **Deviations**: no moon or star motif - the new generation's photographs show none; the multi-purpose
  car's layout (seats, bicycle room, barrier-free compartment) is laid out from one close photograph and
  the published figures; the sleeping car's panes from one oblique photograph; the control car's length
  and the cars' order are not published (Railjet's 26.85 m; sleeping cars at the locomotive's end as
  photographed); the lettering is the stroke font (c, g, h and p added to strokeFont.ts).
- **Triangles**: control car 15,099, coach 9,296, couchette 10,040, sleeper 9,456; the distant model 90 - 94 a
  car (the couchette's mini cabins do not fit its 100), at most 500 a train. Text: the title verbatim, "Couchette car" translated.

### OBB 1116 Taurus (`proc-vehicle-obb-1116`)

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

### OBB 1142 (`proc-vehicle-obb-1142`)

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

<!-- design:obb-1110 -->

<!-- design:obb-1189 -->

<!-- design:obb-2016 -->

### OBB 2043 (`proc-vehicle-obb-2043`)

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
  0.945 m pitch from -4.34 m to the "1" end's door (2.86 - 3.55 m); under the row's start at the "2"
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

<!-- design:obb-1099 -->

<!-- design:bbo-214 -->
