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
