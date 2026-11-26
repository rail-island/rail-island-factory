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

<!-- design:obb-4020 -->

<!-- design:obb-4010 -->

<!-- design:obb-5047 -->

<!-- design:obb-5022 -->

<!-- design:westbahn-kiss -->

<!-- design:noevog-himmelstreppe -->

<!-- design:obb-cityshuttle-dd -->

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

<!-- design:obb-1144 -->

<!-- design:obb-1142 -->

<!-- design:obb-1110 -->

<!-- design:obb-1189 -->

<!-- design:obb-2016 -->

<!-- design:obb-2043 -->

<!-- design:obb-1099 -->

<!-- design:bbo-214 -->
