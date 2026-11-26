# Austria's trains

**Covers** - twenty Austrian designs: the OBB Railjet, Talent 4024, Cityjet 4744, 4020, Transalpin 4010, 5047, Desiro 5022, the WESTbahn KISS, the Mariazellerbahn's Himmelstreppe, the CityShuttle double-deck coach and the Nightjet; the 1116 Taurus, 1144, 1142, 1110, 1189 Krokodil, 2016 Hercules, 2043, the Mariazellerbahn's 1099 and the BBO 214 steam engine. Their modules, figures, the detail pass that matched each to its photographs, deviations and tests.
**Code** - `generator/atUnits.ts` (`AT_UNITS`, the units' registry), `generator/atLocos.ts` (`AT_LOCOS`, the locomotives' registry), one module per vehicle (`generator/at*.ts`), `test/worldTrains.test.ts`, `assets/obb-*/`
**See also** - [germany-trains.md](germany-trains.md) (the same pass for Germany), [switzerland-trains.md](switzerland-trains.md), [shinkansen.md](shinkansen.md) (the series kit), [world-locos.md](world-locos.md), [world-steam.md](world-steam.md), [world-coaches.md](world-coaches.md), [mainline-electrics.md](mainline-electrics.md) (the OBB 1012 and 1040)

The catalog already had the OBB 1012 and 1040 and the Vectron; none is repeated here.
Every design is filed under Austria (`generator/factTable.ts`). Each starts as a draft
(docs/site/workshop.md).

## The designs

<!-- design:obb-railjet -->

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

<!-- design:obb-4744 -->

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
