# The Netherlands' trains

**Covers** - the twenty Dutch designs of the eight-country plan: the Mat '46 and Mat '54 "Hondekop", the Plan V, the DE-I "Blauwe Engel", the ICM "Koploper", the VIRM and DDZ, the SGM, SLT, SNG and ICNG, NS's FLIRT and the Fyra V250; the 1600 / 1700, 1100, 1300, 1200 and 2200 locomotives; the 3700 steam engine; the ICR coach. Their modules, figures, the detail pass that matched each to its photographs, deviations and tests.
**Code** - `generator/nlUnits.ts` (`NL_UNITS`, `nsLivery`, the units' registry), `generator/nlLocos.ts` (`NL_LOCOS`, the locomotives' registry), one module per vehicle: `generator/nlMat46.ts`, `nlMat54.ts`, `nlPlanV.ts`, `nlDe1.ts`, `nlIcm.ts`, `nlVirm.ts`, `nlDdz.ts`, `nlSgm.ts`, `nlSlt.ts`, `nlSng.ts`, `nlIcng.ts`, `nlFlirt.ts`, `nlV250.ts`, `nl1700.ts`, `nl1100.ts`, `nl1300.ts`, `nl1200.ts`, `nl2200.ts`, `nl3700.ts`, `nlIcrCoach.ts`; `generator/worldSteamLocos.ts`, `generator/worldCoaches.ts`, `test/worldTrains.test.ts`, `test/loneJacobsCars.test.ts`, `test/seriesCabFace.test.ts`, `assets/ns-*/`
**See also** - [shinkansen.md](shinkansen.md) (the series kit), [germany-trains.md](germany-trains.md) (the same pass for Germany), [world-locos.md](world-locos.md), [world-steam.md](world-steam.md), [world-coaches.md](world-coaches.md)

Every design is filed under the Netherlands (`generator/countryTable.ts`).

## The designs

| id | title | built on | parameters (default first) | figures (game) |
|---|---|---|---|---|
| `proc-vehicle-ns-mat46` | NS Mat '46 | series, cab face, Jacobs (`nlMat46.ts`) | `unit`, `livery` (`green`, `yellowGrey`) | Bo'2'Bo', two cars, 44.7 m; 89 t, 796 kW, 140 km/h |
| `proc-vehicle-ns-mat54` | NS Mat '54 Hondekop | series, cab face (`nlMat54.ts`) | `unit`, `cars` 2 - 4, `livery` (`green`, `yellowGrey`) | 25.56 / 24.07 m (51.12 / 99.26 m); 140 km/h |
| `proc-vehicle-ns-plan-v` | NS Plan V | series, cab face, centre coupler (`nlPlanV.ts`) | `unit`, `livery` (`yellowGrey`, `yellowBlue`) | two cars of 26.05 m; 140 km/h |
| `proc-vehicle-ns-de1` | NS DE-I Blauwe Engel | series, diesel, single, cab face at the front only (`nlDe1.ts`) | - | 27.05 m; 57 t, 120 km/h |
| `proc-vehicle-ns-icm` | NS ICM Koploper | series, cab face, raised cab (`nlIcm.ts`) | `unit`, `cars` 3 - 4, `livery` (`yellowBlue`, `yellowGrey`) | 27.05 / 26.5 m (80.6 / 107.1 m); 160 km/h |
| `proc-vehicle-ns-virm` | NS VIRM | series, double-deck, cab face, roof wells (`nlVirm.ts`) | `unit`, `cars` 4 - 6, `livery` (`yellowBlue`, `yellowGrey`) | 27.28 / 27.0 m, 4.67 m high; 1,608 / 2,412 kW, 160 km/h |
| `proc-vehicle-ns-ddz` | NS DDZ | series, double-deck well, cab face, own lead car (`nlDdz.ts`) | `unit`, `cars` 4 - 6, `livery` (`yellowBlue`, `yellowGrey`) | mBk 21.39 m Bo'Bo'Bo', coaches 26.4 m, ABvk 26.9 m; 140 km/h |
| `proc-vehicle-ns-sgm` | NS SGM Sprinter | series, cab face, centre coupler (`nlSgm.ts`) | `unit`, `cars` 2 - 3, `livery` (`yellowGrey`, `sprinter`) | 26.1 / 26.5 m cars; 1,280 kW a unit; 125 km/h |
| `proc-vehicle-ns-slt` | NS SLT | series, cab face, Jacobs (`nlSlt.ts`) | `unit`, `cars` 4 - 6 | end car 19.09 m, intermediate 15.59 m (69.36 / 100.54 m); 160 km/h |
| `proc-vehicle-ns-sng` | NS SNG | series, cab face, Jacobs (`nlSng.ts`) | `unit`, `cars` 3 - 4 | end 21.68 m, middle 16.2 m (59.56 / 75.76 m); 160 km/h |
| `proc-vehicle-ns-icng` | NS ICNG | series, cab face, Jacobs (`nlIcng.ts`) | `unit`, `cars` 5 - 8 | end 24.45 m, intermediate 19.85 m, 4.2 m high; 200 km/h |
| `proc-vehicle-ns-flirt` | NS Flirt | series, own cab face, Jacobs (`nlFlirt.ts`) | `unit`, `cars` 3 - 4, `livery` (`sprinter`) | Bo'(2)'(2)'Bo', end 22.85 m, middle 17.5 m (63.2 / 80.7 m); 160 km/h |
| `proc-vehicle-ns-v250` | Fyra V250 | series, own cab face (`nlV250.ts`) | `unit`, `cars` 3 - 8 | 26.95 / 24.5 m (200.9 m for eight); 250 km/h |
| `proc-vehicle-ns-1700` | NS 1600 / 1700 | box locomotive, own profile (`nl1700.ts`) | `livery` (`yellowGrey`, `railion`) | B'B', 17.64 m, bogies 9.694 m apart, 4,540 kW, 160 km/h |
| `proc-vehicle-ns-1100` | NS 1100 | box locomotive (`nl1100.ts`) | `livery` (`blue`, `yellowGrey`) | B-B, 12.98 m (14.18 m with the nose), 2,030 kW, 135 km/h |
| `proc-vehicle-ns-1300` | NS 1300 | box locomotive, own profile (`nl1300.ts`) | `livery` (`blue`, `yellowGrey`) | Co-Co, 18.95 m, 3,159 kW, 130 km/h |
| `proc-vehicle-ns-1200` | NS 1200 | box locomotive, bulldog noses (`nl1200.ts`) | `livery` (`blue`, `yellowGrey`) | Co'Co', 18.086 m, 2,360 kW, 150 km/h |
| `proc-vehicle-ns-2200` | NS 2200 | end cab and hood on the Czech kit's shells (`nl2200.ts`), diesel | `livery` (`brown`, `yellowGrey`) | Bo-Bo, 14.01 m, 662 kW, 100 km/h |
| `proc-vehicle-ns-3700` | NS 3700 | steam, own spec (`nl3700.ts`) | `unit` | 2'C, 1.85 m drivers, three-axle tender, 18.48 m; 990 kW, 110 km/h |
| `proc-vehicle-ns-icr-coach` | NS ICR coach | coach, own layout (`nlIcrCoach.ts`) | `unit` (`a`, `b`), `livery` (`yellowGrey`, `yellowBlue`) | 26.4 m; 160 km/h |

`nsLivery` holds NS's generic schemes; since the detail pass every design states its own
paint in its module.

## The detail pass (2026-11)

Every design was reshaped from photographs with the detailed-vehicle skill
(`.agents/skills/detailed-vehicle/`), one agent per vehicle, each reviewed against the
photographs before it was merged: at least three photographs of the class and livery
(stored in `assets/ns-*/` with their `SOURCES.md`), measured in px/m with projective fits
along the side, published figures overriding photo estimates, and a render-and-compare
loop. Each vehicle moved to its own module; the registries only list them. Published
figures that contradicted the draft were corrected in `game` (and the OpenTTD capacities
where noted). The kits were only extended with optional fields whose defaults keep every
other design byte-identical (hash-checked): the series kit's `windowCornerR`,
`rearEnd.rearPantographD`, `leadEnd`, `endMiddleBogies`, `lowWell`, the livery's
`lodSides` and `sideFields`, `lodEndPatches`, `roofWells` and `cabFaceFrontOnly`
([shinkansen.md](shinkansen.md)).

### Units

- **Mat '46** (`nlMat46.ts`). Museum unit 273 (head-on, both ends, side-on at the Jacobs
  bogie) and an NS archive photograph of a yellow unit side-on. Two cars of 22.35 m on three
  bogies, Bo'2'Bo': a motor bogie 3.9 m behind each tip and a Jacobs bogie under the joint.
  The Muizenneus is an upright rounded face under the silver dome: the five front panes each
  in their own rounded silver frame with 0.1 m green pillars, the outer ones leaning; the
  headlamps in wide silver rings, two small lamps in the red band, the tall silver apron with
  the Scharfenberg head in front of it. The ABDk leads (luggage double door, toilet window),
  the Bk trails; rounded silver-framed windows (`windowCornerR`). A diamond pantograph over
  each cab, the leading one raised. `yellowGrey` was carried only by 279, 281, 295 and 299.
  Deviations: no drop-light bars, and in yellow the luggage door is grey (one paint for all doors).
- **Mat '54 Hondekop** (`nlMat54.ts`). Measured on the side-on works photograph of BDk 790 and
  386 head-on: the closed round bonnet upright to 1.75 m, its top rising to the windscreen's
  foot 1.67 m behind the tip, the raked three-pane windscreen to 3.41 m, the dark cap with two
  marker lamps, the headlights either side of the number plate, the black chin round the
  coupler. End cars 25.56 m, middle cars 24.07 m. The leading baggage car raises its diamond
  pantograph behind the cab; the rear Bk's, folded, stands over its inner end
  (`rearEnd.rearPantographD`). Museum green with the cream moustache; NS yellow with the grey
  band. Deviations: one layout for the A and B trailers, one wheelbase for all bogies.
- **Plan V** (`nlPlanV.ts`). The Mat '64 "Apekop" after 441, 454, 844 and 876: the bulbous
  lower nose with the dark lamp band wrapping round its corners, the head lamp in its oval
  housing on the long rounded hood, the steep three-pane windscreen (foot 1.0 m and head
  1.38 m behind the tip, 3.55 m up) with the D-shaped corner window as tall as the panes, the
  dark chin with the Scharfenberg head. The V4 - V6 side from projective fits on two side
  photographs: corner window at 3.3 m, cab door at 4.3 m, 2 windows, door, 5 + a narrow one,
  door, 3; three slanted stripes. One single-arm pantograph over the leading car's motor bogie.
  `yellowGrey` is the 1968 house style, `yellowBlue` the late look (light stripes, corner
  windows painted over). Heights and bogie centres are estimated from photographs.
- **DE-I** (`nlDe1.ts`). Nine photographs of museum unit 41 (and 21 as built) and the published
  27.05 m, 2.78 m, 3.45 m and 18.35 m bogie centres. Its own face: deep elliptic corners and a
  0.09 m bow, the centre pane and raked side panes in a white surround, the winged emblem
  1.04 m across with its raised hub, the red beak rising to it between the dark ringed
  headlights, the silver apron's arch with the red Scharfenberg coupler. The rear end is
  square with the gangway (`cabFaceFrontOnly`), as 41 coupled to DE2 186 shows; its face is
  not photographed. The side's asymmetric luggage room from a projective fit. 57 t, 73 seats.
- **ICM** (`nlIcm.ts`). ICMm 4011, 4012, 4013 and 4237, prototype 4002 and an unmodernised
  unit; 80.6 / 107.1 m, 2.844 m, 4.65 m. The upright yellow front is the gangway door (two
  leaves in a rubber frame as built, a closed seam on the ICMm), the lamp housings
  0.24 x 0.32 m at 1.9 m wrapping the corners, the grilles, the Scharfenberg head in the chin's
  recess. The cab stands on the roof as a narrow hump with a raked windscreen under a visor.
  End cars 27.05 m and intermediate cars 26.5 m, two doors a side on each. The ICMm's blue
  band ends in a half round 2 m behind the front (`lodEndPatches` keeps it in the distant
  model). The single-arm pantograph is on the second car. The windscreen's rake is estimated.
- **VIRM** (`nlVirm.ts`). NS's side drawings of the cars (20.85 px/m) and 9553, 8632, 9585 and
  a unit at Culemborg. End car 27.28 m, intermediate cars 27.0 m, 3.02 m wide, 4.67 m high.
  The yellow front upright to the four lamps, the coupler's black recess, the dark grey hood
  with the one-piece windscreen raked about 32 degrees. Double decks between end sections over
  the bogies; the three window rows and blue bands from the drawing (`sideFields`); lowered
  roof wells over the inner end sections (`roofWells`), one single-arm pantograph in the second
  car's front well. `yellowGrey` is the refurbished VIRMm, titled "NS VIRMm" (the VIRM never
  ran in yellow and grey). Not drawn: the mBv7's layout, the folded second pantograph.
- **DDZ** (`nlDdz.ts`). The rebuilt DD-AR set: the mBk motor car (21.39 m on three bogies,
  Bo'Bo'Bo', one high passenger level, the pantograph) leads (`leadEnd`, `endMiddleBogies`),
  the Bv/ABv coaches (26.4 m) and the ABvk driving trailer (26.896 m) follow, their lower deck
  in a well between the bogies (`lowWell`). The cab face measured head-on on 7618. The blue
  bands follow the decks (`lodSides` in the distant model). `yellowGrey` is the DD-AR scheme.
  The game's power is per car (400 kW); the real set's 2,340 kW is all in the mBk.
- **SGM** (`nlSgm.ts`). Eight photographs (2873, 2133, 2983, 2140, an aerial view, a bare cab)
  and nl.wikipedia: 26.1 / 26.5 m, 2.80 m wide. The upright front bowed 8 cm, three
  windscreen panes in black frames, the crease over the lamp band, two lamp housings and the
  grille, no gangway door. Three 1.3 m swing-plug doors a side on an end car, two on the
  middle car (three on the SGMm). `sprinter` is the modernised SGMm, drawn as its own series
  (air conditioning, windows in blue bands). The middle car is unpowered (1,280 kW a unit).
- **SLT** (`nlSlt.ts`). 2463, an SLT-VI head-on, 2401 and 2632 (a projective fit on its five
  joints). End car 19.09 m, intermediate 15.59 m on Jacobs bogies. The dark bumper round the
  Scharfenberg recess, the white lamp panel inside the blue U, the windscreen raked about 27
  degrees under the light grey cap; the blue sweeping over the cab roof; the band starting in
  a point behind the cab door over the leading bogie. One single-arm pantograph on car 2 (the
  SLT-VI may carry a second). Jacobs bogies share the end bogies' 2.3 m wheelbase.
- **SNG** (`nlSng.ts`). The CAF Civity front after 2302, 2324, 2340, 2348, 2710 and a Lelystad
  unit: the grey bumper round the open recess, the slanted lamp housings, the windscreen raked
  about 35 degrees, the big raked cab side window from the pillar to the white swoosh, the
  yellow front worn since 2022. End cars 21.68 m, intermediate cars 16.2 m on Jacobs bogies;
  two 1.3 m doors a side on every car; NS blue #2340a0 with the logo on every car's white band;
  a pantograph over each end car's inner end. Not drawn: the yellow line's rise over the bogie.
- **ICNG** (`nlIcng.ts`). Measured on 3146 side-on: the lower front upright round the rounded
  coupler opening, the black teardrop lamp housings on its corners, the windscreen raked about
  45 degrees in a thin black frame, the yellow cap reaching the crown 2.4 m back. The blue
  window band (#2340a0) rising and fading to black over the cab door, the NS logo on the nose
  sides. End cars 24.45 m, intermediate 19.85 m on Jacobs bogies. Deviations: the coupled
  joint with two bogies is drawn as a Jacobs joint, and every intermediate car takes the
  two-door layout (eight doors a side over five cars, six on the real unit).
- **NS FLIRT** (`nlFlirt.ts`). Its own series and cab face (the Swiss FLIRTs keep `flirt()`).
  End cars 22.85 m, middle cars 17.5 m, on Jacobs bogies. The FLIRT 3 front measured head-on
  and on 2220: the grey apron with the coupler and louvred boxes, the white band with the
  0.55 m lamp housings wrapping the corners, the yellow front of 2023 running up the
  windscreen's pillars, the black cap with the display. The sides from fits on 2504 and 2218.
  One single-arm pantograph on the middle car (its place along the car is uncertain); the
  four-car units wear the yellow front too.
- **Fyra V250** (`nlV250.ts`). Nine photographs of 4806 and its sisters: the blunt nose cone
  (tip 1.65 m up) with the black coupler opening, four lamps in pale scoops, the bonnet rising
  to the raked windscreen, the dark "eye" round the small cab side window. End cars 26.95 m,
  intermediate 24.5 m, each on its own two bogies. The Fyra scheme is white with the red sweep
  from the nose cone to the roof, magenta and pink fields; every intermediate car shares one
  pattern. Single-arm pantographs on cars 2 and 7; bogie positions estimated.

### Locomotives, steam and coach

- **1600 / 1700** (`nl1700.ts`). Its own profile, measured on the side-on 1616 and the head-on
  1752: the broken nose 0.6 m ahead of the cab front, the cab front leaning out 14 degrees, the
  lamps, the grey headstock and anti-climber, the 9.1 m filter grille, monomotor bogies
  9.694 m apart, single-arm pantographs. `railion` is DB Cargo Nederland's red of 2012 (the
  Railion-era 1600s stayed yellow). The body is 3.0 m wide (3.047 published) for the gauge.
- **1100** (`nl1100.ts`). 1110, 1122/1125, 1120, 1142, 1147, 1153: the flat front with rounded
  corners, two windscreens, four portholes a side, the buffers on headstocks below the body
  (the class carried them on its bogies), diamond pantographs. `yellowGrey` carries the 0.6 m
  collision nose every loco received in 1978 - 81.
- **1300** (`nl1300.ts`). Its own profile instead of the CC 7100 body, after 1307 side-on and
  1302 head-on: the flat face with rounded corners, the ledge and the set-back window band,
  four portholes, Co'Co' bogies 9.4 m apart. The 1952 turquoise (lining over the headlamps,
  winged emblem, diamond pantographs) and the 1980s yellow. The lining's colour comes from a
  black-and-white photograph; the Berlin blue scheme is not drawn. 3,159 kW, 130 km/h.
- **1200** (`nl1200.ts`). The "bulldog" noses (1.8 m, flat face, rounded corners, the deep
  buffer beam), cast Co bogies with equalizers (pivots 9.2 m apart, estimated). The 1951
  turquoise of the museum's 1201 (a navy line ringing the headlights) and NS yellow and grey
  on 1220. The "N°" on the beam is left out.
- **2200** (`nl2200.ts`). After 2208 of 1955, 2225 / 2299 and 2205 / 2207 / 2278: the cab at one
  end, full width, and one long hood 1.8 m wide with walkways and handrails (not a centre cab).
  `brown` with the cream vees and the winged emblem, `yellowGrey` with beacons. The bogie is
  the kit's plate-frame bogie, not the equalizer bogie.
- **3700** (`nl3700.ts`). After the side-on works photograph of 3767 and 3737 in the museum:
  the bogie and drivers placed from the photo, the outside cylinders between the bogie wheels,
  the tall chimney with its copper cap, the brass dome, the Belpaire firebox, the splashers,
  the cab with arched windows and the oval plate, the three-axle tender (18.48 m together).
  NS green. Positions come from perspective photographs.
- **ICR coach** (`nlIcrCoach.ts`). ICRm B 61 84 20-70 208-5 and an A before refurbishment, by
  projective fits over the ten equal windows: the wide double door at one end, ten 1.57 m
  windows, the narrow door and the toilet window at the other, step wells under the doors.
  `yellowBlue` is the ICRm; `yellowGrey` (as delivered) follows the article, no free
  photograph of it was found.

## Tests

`test/worldTrains.test.ts` (and its quarters), `test/loneJacobsCars.test.ts` (the Jacobs
units' lone cars), `test/seriesCabFace.test.ts` (the cab faces and the DE-I's square rear),
`test/vehicleEnds.test.ts` and the catalog sweep.
