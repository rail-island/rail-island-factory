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

<!-- design:obb-4010 -->

<!-- design:obb-5047 -->

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

<!-- design:westbahn-kiss -->

<!-- design:noevog-himmelstreppe -->

### OBB CityShuttle double-deck coach (`proc-vehicle-obb-cityshuttle-dd`)

- **Built on** the series kit (`generator/atCityShuttle.ts`; shinkansen.ts, seriesCab.ts), unwired
  (`traction: "none"`) like the Railjet: the driving trailer (80-33 / 86-33, "Wiesel" Steuerwagen) is
  the series' end car with a cab face, the coach (26-33) its intermediate car; both double-deck with the
  lower deck in a well between the doors (`lowWell`). One small kit change (below).
- **Parameters**: `unit` `drivingTrailer` (default), `coach`, `train`; `cars` 3 .. 5 (default 4) with
  `train`; `livery` `cityShuttle` (default), `cityjet`.
- **Figures** (de.wikipedia "OBB Nahverkehrs-Doppelstockwagen"): driving trailer 27.1 m, coach 26.8 m
  over the buffers, 4.632 m high, 2.8 m wide, bogie centres 20 m (2.5 m wheelbase, 920 mm wheels),
  140 km/h (the brief's 160 km/h is not in the sources); 49 / 48 t, 86 / 114 seats (the 4-car set 428).
- **The train** (`wieselTrain`): the driving trailer leading, coaches behind it, every second one turned
  so the red halves meet as on the Meidling photographs; the locomotive (its own design) couples at the
  rear. A driving trailer and up to four coaches is the usual set, so 3 .. 5 cars.
- **Sides** (projective fits along the coach at Moedling on its six lower windows, 86-33 033 and 102):
  both decks on one 1.7 m pitch, six lower windows (1.15 - 1.95 m) between the 1.6 m double doors
  5.17 m either side of the well's middle, eight upper windows (3.28 - 4.1 m) with the outer ones over
  the doors; each end section over a bogie has a small upper window over a narrow intermediate-level
  window, a wider one (1.97 - 2.95 m), the tall louvred locker and two intakes under the roof's edge.
  The driving trailer's front section: the cab side window behind the mirror housing in the grey band,
  one tall window, the destination box, the front door 4.6 m behind the face's join; its leading bogie
  under the cab (the face's skirt cut open over it). Door leaves white, one narrow window each.
- **The face** (head-on 86-33 100, 129 px/m; three-quarter 102, 80-33 008): the grey buffer beam to
  1.21 m with the rectangular buffers, the red lower face (two lamp pairs at 1.70 m, the grille between,
  the white OBB letters and number), the grey windscreen band 2.38 - 3.35 m raked about 27 degrees and
  wrapping round onto the cab sides, the red cap raked about 45 degrees with the marker lamp and two
  grilles, its arched top (4.08 m in the middle, 3.73 m at the corners) under the grey roof, the horn on it.
- **CityShuttle** (1997, OBB wordmark): light grey, the rear half red behind a diagonal across the
  well's middle (1.9 m behind it at the belly, 2.2 m ahead at the shoulder), the red OBB letters ahead
  of it, CITYSHUTTLE in white on the red end section. **Cityjet** (2019 - , 86-33 113): white over a
  red band to 2.05 m, black window bands, dark grey doors, the anthracite cap swept back over the cab
  sides behind a red line, the white band with the red OBB under the windscreen.
- **Kit change** (sliceBody.ts `sliceCabin`, additive): the cabin's width is taken only from slices that
  reach down to its floor, so a door in a double-deck well (floor 0.5 m) no longer collapses the cabin to
  nothing over the raised end sections; every other design builds byte-identical (hash diff empty).
- References: `assets/obb-cityshuttle-dd/` (ten Commons photographs). 14,962 triangles (driving
  trailer, CityShuttle; Cityjet 15,684), coach 11,914, the 4-car train 49,204; distant model 100 a car.
- Deviations: lettering in capitals (the kit fonts have no lower case "CityShuttle" / "cityjet"); the
  first series' red front half and raised Pflatsch emblem, the Wiesel and "Wiener Szene" lettering, the
  two blanked lower windows of the rebuilt driving trailers and the Cityjet's darker red line are not
  drawn; the louvred locker is drawn on both sides of every end section; the upper deck has no interior
  (the kit's cabin is the lower deck behind the doors).

<!-- design:obb-nightjet -->

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

<!-- design:obb-1142 -->

<!-- design:obb-1110 -->

<!-- design:obb-1189 -->

<!-- design:obb-2016 -->

<!-- design:obb-2043 -->

<!-- design:obb-1099 -->

<!-- design:bbo-214 -->
