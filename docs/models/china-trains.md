# China's trains

**Covers** - the twenty Chinese designs of the eight-country plan: the Fuxing CR400AF and CR400BF, the CRH380A, CRH2A, CRH3C (the ICE 3's Velaro face), CRH5A, the CR200J "Green Giant" and the CRH6A; the HXN5, HXD1, HXD3D, SS1 and SS8, DF4 and DF11; the QJ, SY and JS steam engines; the 25-series coaches; the C70 / P70 wagons - and twenty more: the Fuxing CR300AF, CR300BF, CR450AF and CR450BF, the CRH380B, CRH380CL and CRH380D, the CRH1A, CRH1E, CRH2E, CRH2G, CRH3A, CRH5G and CRH6F, the DJJ1 "Blue Arrow" and DJJ2 "China Star"; the HXD2, HXD3C, SS4 and DF8B. Their kits, figures, deviations and tests; each body is described in [china-units.md](china-units.md), [china-units-2.md](china-units-2.md), [china-units-3.md](china-units-3.md) or [china-locos.md](china-locos.md).
**Code** - `generator/cnUnits.ts` (`CN_UNITS`), `generator/cnLocos.ts` (`CN_LOCOS`), the vehicles' own modules `generator/cn*.ts` (among them the twenty new ones: `cnCr300af.ts`, `cnCr300bf.ts`, `cnCr450af.ts`, `cnCr450bf.ts`, `cnCrh380b.ts`, `cnCrh380cl.ts`, `cnCrh380d.ts`, `cnCrh1a.ts`, `cnCrh1e.ts`, `cnCrh2e.ts`, `cnCrh2g.ts`, `cnCrh3a.ts`, `cnCrh5g.ts`, `cnCrh6f.ts`, `cnBlueArrow.ts`, `cnChinaStar.ts`, `cnHxd2.ts`, `cnHxd3c.ts`, `cnSs4.ts`, `cnDf8b.ts`), `generator/boxLocoKit.ts`, `generator/worldSteamLocos.ts`, `generator/worldCoaches.ts`, `generator/worldWagons.ts`, `test/worldTrains.test.ts`, `test/cnJs.test.ts`, the nose tests `test/*Nose.test.ts`, `assets/cr-*/`
**See also** - [china-units.md](china-units.md), [china-units-2.md](china-units-2.md), [china-units-3.md](china-units-3.md), [china-locos.md](china-locos.md), [shinkansen.md](shinkansen.md) (the series kit, the Shinkansen gauge), [world-locos.md](world-locos.md), [world-steam.md](world-steam.md), [world-coaches.md](world-coaches.md), [world-wagons.md](world-wagons.md), [germany-trains.md](germany-trains.md) (the Velaro)

The catalog had the Hong Kong MTR M-Train (filed under Hong Kong); none of China
Railway's trains. Every design here is filed under China.

## The designs

| id | title | kit | parameters | figures (game) |
|---|---|---|---|---|
| `proc-vehicle-cr-cr400af` | Fuxing CR400AF | series, its own cab face (`generator/cnCr400af.ts`), Shinkansen gauge | `unit`, `cars` 2 - 8, `livery` (`red`, `smart`) | 27.6 m and 25.65 m cars, 209 m for eight; 350 km/h |
| `proc-vehicle-cr-cr400bf` | Fuxing CR400BF | series, its own cab face (`generator/cnCr400bf.ts`), Shinkansen gauge | `unit`, `cars` 2 - 8, `livery` (`gold`, `red`) | 27.35 / 25.7 m cars, 8 cars 208.9 m; 350 km/h |
| `proc-vehicle-cr-crh380a` | CRH380A | series, its own cab face (`generator/cnCrh380a.ts`), Shinkansen gauge | `unit`, `cars` 2 - 8 | the 12 m nose; 26.5 m + 25.0 m cars; 350 km/h |
| `proc-vehicle-cr-crh2a` | CRH2A | series, Shinkansen gauge, its own E2 cab face (`generator/cnCrh2a.ts`) | `unit`, `cars` 2 - 8 | 25.7 / 25 m cars, 9.2 m E2 nose; 250 km/h |
| `proc-vehicle-cr-crh3c` | CRH3C | series, the ICE 3's Velaro cab face (`cnCrh3c.ts`) | `unit`, `cars` 2 - 8 | end 25.675 m, middle 24.775 m, 3.1 m wide (real 3.265 m), 3.89 m high; 350 km/h |
| `proc-vehicle-cr-crh5a` | CRH5A | series, its own cab face (`cnCrh5a.ts`), Shinkansen gauge | `unit`, `cars` 2 - 8 | the Pendolino snout; 27.6 / 25.0 m, 3.2 m wide; 250 km/h |
| `proc-vehicle-cr-cr200j` | Fuxing CR200J | series: the power car as the coaches' lead car (`leadCar`), one cab face for it and the driving trailer (`cnCr200j.ts`) | `unit` (`endCar` power car, `middleCar` coach, `drivingTrailer`, `train`), `cars` 3 - 8, `livery` (`green`, `whiteRed`) | power car 20.0 m, coach 25.5 m, driving trailer 27.955 m; 5,600 kW, 160 km/h |
| `proc-vehicle-cr-crh6a` | CRH6A | series, its own cab face (`cnCrh6a.ts`), Shinkansen gauge | `unit`, `cars` 2 - 8 | the short intercity nose; 25.7 / 25.0 m, 3.86 m high; 5,520 kW, 200 km/h |
| `proc-vehicle-cr-cr300af` | Fuxing CR300AF | series, its own cab face (`generator/cnCr300af.ts`), Shinkansen gauge | `unit`, `cars` 2 - 8 | the CR400AF's look, blunter; 27.525 / 25.65 m cars, 8 cars 208.8 m; sky blue; 700 kW a car (estimated), 250 km/h |
| `proc-vehicle-cr-cr300bf` | Fuxing CR300BF | series, its own cab face on the CR400BF's shell (`generator/cnCr300bf.ts`), Shinkansen gauge | `unit`, `cars` 2 - 8 | 27.35 / 25.7 m cars, 8 cars 208.9 m; sky blue; 5,440 kW (estimated), 250 km/h |
| `proc-vehicle-cr-cr450af` | Fuxing CR450AF | series, its own cab face (`generator/cnCr450af.ts`), enclosed bogies, Shinkansen gauge | `unit`, `cars` 2 - 8 | prototype CR450AF-0201; 28.725 / 25.65 m cars, 8 cars 211.35 m, 3.85 m high; 12,000 kW, 400 km/h |
| `proc-vehicle-cr-cr450bf` | Fuxing CR450BF | series, its own cab face on a solid of its own (`generator/cnCr450bf.ts`), Shinkansen gauge | `unit`, `cars` 2 - 8 | prototype CR450BF-0501; 28.75 / 25.65 m cars, 8 cars 211.4 m, 3.85 m high; 400 km/h |
| `proc-vehicle-cr-crh380b` | CRH380B | series, the CRH3C's body and face with its own slanted lamp lenses (`cnCrh380b.ts`) | `unit`, `cars` 2 - 8 | end 25.675 m, middle 24.775 m, 3.1 m wide (real 3.265 m); 9,200 kW, 350 km/h |
| `proc-vehicle-cr-crh380cl` | CRH380CL | series, the CRH3C's body (`cnCrh3c.ts`) and its own long, low cab face (`generator/cnCrh380cl.ts`), UIC gauge | `unit`, `cars` 2 - 8 (real 16) | end 27.525 m (8.85 m face), middle 24.775 m, 3.1 m wide (real 3.265 m), 3.89 m high; 350 km/h |
| `proc-vehicle-cr-crh380d` | CRH380D | series, its own cab face (`cnCrh380d.ts`), Shinkansen gauge | `unit`, `cars` 2 - 8 | the Zefiro 380's 10.5 m duck-bill nose; 27.85 / 26.6 m cars, 215.3 m for eight; 10,080 kW, 350 km/h |
| `proc-vehicle-cr-crh1a` | CRH1A | series, its own cab face (`cnCrh1a.ts`), Shinkansen gauge | `unit`, `cars` 2 - 8 | the Regina-derived blunt nose; 26.95 / 26.6 m, 4.04 m high; 5,300 kW, 200 km/h |
| `proc-vehicle-cr-crh1e` | CRH1E | series, the CRH1A's body section with its own long cab face (`generator/cnCrh1e.ts`), Shinkansen gauge | `unit` (`endCar`, `middleCar` soft sleeper, `train`), `cars` 2 - 8 (real 16) | 28.25 m and 26.6 m cars, 428.9 m for sixteen; 11,000 kW (16 cars), 250 km/h |
| `proc-vehicle-cr-crh2e` | CRH2E | series, the CRH2A's E2 cab face with its own eye lamps and crew door (`generator/cnCrh2e.ts`), Shinkansen gauge | `unit` (`middleCar` soft sleeper), `cars` 2 - 8 (real 16) | 25.7 / 25 m cars; 9,600 kW (16 cars), 250 km/h |
| `proc-vehicle-cr-crh2g` | CRH2G | series, its own long cab face (`generator/cnCrh2g.ts`) on the CRH2A body, Shinkansen gauge | `unit`, `cars` 2 - 8 | 25.7 m and 25 m cars, 201.4 m for eight; 6M2T 7,200 kW (assumed); 250 km/h |
| `proc-vehicle-cr-crh3a` | CRH3A | series, its own Chinese cab face (`generator/cnCrh3a.ts`), Shinkansen gauge | `unit`, `cars` 2 - 8 | the Changchun sets (5253); 27.35 / 25.7 m cars, 3.3 m wide (real 3.36 m); 5,120 kW, 250 km/h |
| `proc-vehicle-cr-crh5g` | CRH5G | series, the CRH5A's body with its own cab face (`cnCrh5g.ts`), Shinkansen gauge | `unit`, `cars` 2 - 8 | the enhanced sets' new nose and dark window band; 27.6 / 25.0 m, 3.2 m wide; 5,500 kW, 250 km/h |
| `proc-vehicle-cr-crh6f` | CRH6F | series, its own cab face (`cnCrh6f.ts`), Shinkansen gauge | `unit`, `cars` 2 - 8 | the short suburban nose; 25.7 / 25.0 m, 3.86 m high, three bi-parting doors a side; 5,152 kW, 160 km/h |
| `proc-vehicle-cr-blue-arrow` | DJJ1 Blue Arrow | series: the power car as the coaches' lead car (`leadCar`), one cab face for it and the driving trailer (`cnBlueArrow.ts`), US gauge | `unit` (`endCar` power car, `middleCar` coach, `drivingTrailer`, `train`), `cars` 3 - 7 | power car 20.5 m, coach 25.5 m, driving trailer 25.325 m; 78 t, 4,800 kW, 200 km/h |
| `proc-vehicle-cr-china-star` | DJJ2 China Star | series: the power car as the end car at both ends (`endSides`, `endPantograph`), its own "platypus" cab face (`cnChinaStar.ts`), Shinkansen gauge | `unit` (`endCar` power car, `middleCar` coach, `train`), `cars` 3 - 8 | power car 21.7 m, trailer 26.6 m; 78 t, 4,800 kW each, 270 km/h |
| `proc-vehicle-cr-hxn5` | CR HXN5 | its own (`cnHxn5.ts`): GE Evolution hood, full-width Chinese cab | - | 22.295 m, Co-Co, 150 t, 4,660 kW, 120 km/h |
| `proc-vehicle-cr-hxd1` | CR HXD1 | its own twin-section body (`generator/cnHxd1.ts`), two articulated sections | - | 2 x 17.611 m Bo'Bo', 3.1 m wide (real 3.247 m), 9,600 kW, 120 km/h |
| `proc-vehicle-cr-hxd3d` | CR HXD3D | box locomotive, its own cab and livery (`generator/cnHxd3d.ts`) | - | Co-Co, 22.99 m, 126 t, 7,200 kW, 160 km/h |
| `proc-vehicle-cr-ss1` | CR SS1 Shaoshan | box locomotive, its own profile tables (`generator/cnSs1.ts`) | - | Co-Co, 20.368 m, 3,780 kW, 90 km/h |
| `proc-vehicle-cr-ss8` | CR SS8 Shaoshan | box locomotive, its own profile tables (`cnSs8.ts`) | - | Bo-Bo, 17.516 m, 88 t, 3,600 kW, 170 km/h |
| `proc-vehicle-cr-df4` | CR DF4 Dongfeng | its own (`cnDf4.ts`) on the box locomotive kit: the DF4B, US gauge | `livery` (`orangeWhite` "Orange", `green`) | Co-Co, 21.1 m, 138 t, 2,430 kW, 100 km/h |
| `proc-vehicle-cr-df11` | CR DF11 Dongfeng | its own double-ended body (`generator/cnDf11.ts`), blue and cream | - | Co-Co, 21.25 m, 3.0 m wide (real 3.304 m), bogie centres 11.8 m, 138 t, 3,040 kW, 170 km/h |
| `proc-vehicle-cr-hxd2` | CR HXD2 | its own twin-section body (`generator/cnHxd2.ts`), two articulated sections, the Alstom Prima cab | - | 2 x 19.025 m Bo'Bo', 2.86 m wide, 200 t, 10,000 kW, 120 km/h; blue and silver |
| `proc-vehicle-cr-hxd3c` | CR HXD3C | box locomotive, its own profile tables (`generator/cnHxd3c.ts`), knees-in pantographs (`kneeIn`) | - | Co-Co, 20.846 m, 3.0 m wide (real 3.1 m), 138 t, 7,200 kW, 120 km/h; blue "Hexie" livery |
| `proc-vehicle-cr-ss4` | CR SS4 Shaoshan | its own twin-section body (`generator/cnSs4.ts`), two articulated sections | - | the SS4G; 2 x 16.416 m Bo-Bo, 184 t, 6,400 kW, 100 km/h; light blue and cream |
| `proc-vehicle-cr-df8b` | CR DF8B Dongfeng | its own spec on the box locomotive kit (`generator/cnDf8b.ts`), the kit's `knuckle` coupler, US gauge | - | Co-Co, 22.0 m, 3.2 m wide (real 3.304 m), 138 t, 3,100 kW, 100 km/h; blue and cream |
| `proc-vehicle-cr-qj` | CR QJ | steam, knuckle couplers (`generator/cnQj.ts`) | `unit` | 2-10-2, 1.5 m drivers; six-axle tender |
| `proc-vehicle-cr-sy` | CR SY | steam, its own spec (`generator/cnSy.ts`), knuckle couplers | `unit` | 1'D1', 1.37 m drivers, 21.643 m with the tender, 84 + 54.5 t, 1,100 kW, 80 km/h |
| `proc-vehicle-cr-js` | CR JS | steam, its own spec on the steam kit (`generator/cnJs.ts`), knuckle couplers | `unit` | 2-8-2, 1.37 m drivers, 23.37 m with the tender; 104 t, 1,690 kW, 85 km/h |
| `proc-vehicle-cr-25t-coach` | CR 25-series coach | coach, its own layout on the coach kit (`generator/cnCoach25.ts`), knuckle couplers, US gauge | `unit` (`softSleeper`, `hardSeat`), `livery` (`z25t`, `green25b`) | 25.5 m body, 26.6 m over the couplers, 3.105 m wide; RW 54.5 t, YZ 48 t; 160 km/h |
| `proc-vehicle-cr-c70-wagon` | CR C70 / P70 wagon | its own (`generator/cnC70.ts`): measured C70 and P70 bodies on K6 bogies, US gauge (3.3 m) for the C70's 3.242 m | `unit` (`open`, `covered`) | 13.976 m and 17.0 m; C70 bogie centres 9.21 m, 3.143 m high |

## Deviations

- **Width.** The high-speed trains' 3.36 - 3.38 m bodies are narrowed to the Shinkansen
  gauge's 3.3 m, as the Shinkansen are.
- **Couplers.** Every Chinese locomotive, coach and wagon carries a knuckle (automatic) coupler, no buffers.
- **HXD1.** Drawn in its original blue and silver livery under the plan's `red` livery key (the class never ran in red); the model has one livery and no parameter.
- **Livery keys.** Where the photographs show another livery than the plan guessed, the key stays and the paint follows the photographs: the HXN5's `orange` is CR green, the SS8's `redWhite` and the DF11's `redWhite` are blue and cream, the HXD3D's `redGrey` is red with maroon cabs, the DF4's `orangeWhite` (retitled "Orange") has no white, the CR400AF's `smart` (retitled "Smart Fuxing") is silver with a ribbon.
- **Sixteen-car sets.** The series kit caps a train at 8 cars, so the 16-car CRH2E, CRH1E and CRH380CL are
  offered with 2 - 8 cars; their power is stated per car, so a shorter train has its share.
- **Noses.** A coupler hatch or cover is drawn as a flush seam in one smooth nose surface, never as a
  protruding bulb, knob or lip (the user's feedback that fixed the CR400BF, CRH380A and CRH5A noses); every
  new unit follows it, and the nose tests below hold the profiles to one convex curve.
- **CR200J.** Only the short sets' formation (power car, coaches, driving trailer) is drawn; the long sets have a power car at each end.

## Tests

`test/worldTrains.test.ts` (the plan's 160 designs and those added after it, the Chinese twenty among them: gauge, budget, length, coplanar faces, LOD) and, for each module's
first design, the catalog sweep; `test/cnJs.test.ts` pins the JS's length, wheelbase and bogie tender.
The nose regression tests hold each unit's centre line to one smooth convex curve, with no knob, step or lip at the
coupler hatch: `test/cnCr400bfNose.test.ts` (its tip at the hatch), `test/cnCrh380aNose.test.ts`,
`test/crh5aNose.test.ts`, `test/cnCrh1aNose.test.ts`, `test/cnCrh1eNose.test.ts` (also the nose's length),
`test/cnCr300bfNose.test.ts` (its tip on the snout), `test/cnCr450bfNose.test.ts` (silver at the tip),
`test/cnCrh2gNose.test.ts`, `test/cnCrh380dNose.test.ts` (its tip at the coupler cover),
`test/cnCrh3aNose.test.ts` (its tip on the snout, 0.75 - 1.3 m up) and `test/crh5gNose.test.ts`.
