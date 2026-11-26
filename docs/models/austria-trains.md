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
  the gangway; the brake resistor housing on the roof from 2.0 to 8.6 m behind the tip, the single-arm
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

<!-- design:obb-5047 -->

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
