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

<!-- design:obb-1116 -->

<!-- design:obb-1144 -->

<!-- design:obb-1142 -->

<!-- design:obb-1110 -->

<!-- design:obb-1189 -->

<!-- design:obb-2016 -->

<!-- design:obb-2043 -->

<!-- design:obb-1099 -->

<!-- design:bbo-214 -->
