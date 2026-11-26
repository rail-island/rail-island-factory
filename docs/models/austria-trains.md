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

<!-- design:obb-4744 -->

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

<!-- design:obb-5022 -->

<!-- design:westbahn-kiss -->

<!-- design:noevog-himmelstreppe -->

<!-- design:obb-cityshuttle-dd -->

<!-- design:obb-nightjet -->

<!-- design:obb-1116 -->

<!-- design:obb-1144 -->

<!-- design:obb-1142 -->

<!-- design:obb-1110 -->

<!-- design:obb-1189 -->

<!-- design:obb-2016 -->

<!-- design:obb-2043 -->

<!-- design:obb-1099 -->

<!-- design:bbo-214 -->
