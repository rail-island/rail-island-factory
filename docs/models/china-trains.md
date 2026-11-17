# China's trains

**Covers** - the twenty Chinese designs of the eight-country plan: the Fuxing CR400AF and CR400BF, the CRH380A, CRH2A, CRH3C (the ICE 3's Velaro face), CRH5A, the CR200J "Green Giant" and the CRH6A; the HXN5, HXD1, HXD3D, SS1 and SS8, DF4 and DF11; the QJ, SY and JS steam engines; the 25-series coaches; the C70 / P70 wagons. Their kits, figures, deviations and tests; each body is described in [china-units.md](china-units.md) or [china-locos.md](china-locos.md).
**Code** - `generator/cnUnits.ts` (`CN_UNITS`), `generator/cnLocos.ts` (`CN_LOCOS`), the vehicles' own modules `generator/cn*.ts`, `generator/worldSteamLocos.ts`, `generator/worldCoaches.ts`, `generator/worldWagons.ts`, `test/worldTrains.test.ts`, `test/cnJs.test.ts`, `assets/cr-*/`
**See also** - [china-units.md](china-units.md), [china-locos.md](china-locos.md), [shinkansen.md](shinkansen.md) (the series kit, the Shinkansen gauge), [world-locos.md](world-locos.md), [world-steam.md](world-steam.md), [world-coaches.md](world-coaches.md), [world-wagons.md](world-wagons.md), [germany-trains.md](germany-trains.md) (the Velaro)

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
| `proc-vehicle-cr-hxn5` | CR HXN5 | its own (`cnHxn5.ts`): GE Evolution hood, full-width Chinese cab | - | 22.295 m, Co-Co, 150 t, 4,660 kW, 120 km/h |
| `proc-vehicle-cr-hxd1` | CR HXD1 | its own twin-section body (`generator/cnHxd1.ts`), two articulated sections | - | 2 x 17.611 m Bo'Bo', 3.1 m wide (real 3.247 m), 9,600 kW, 120 km/h |
| `proc-vehicle-cr-hxd3d` | CR HXD3D | box locomotive, its own cab and livery (`generator/cnHxd3d.ts`) | - | Co-Co, 22.99 m, 126 t, 7,200 kW, 160 km/h |
| `proc-vehicle-cr-ss1` | CR SS1 Shaoshan | box locomotive, its own profile tables (`generator/cnSs1.ts`) | - | Co-Co, 20.368 m, 3,780 kW, 90 km/h |
| `proc-vehicle-cr-ss8` | CR SS8 Shaoshan | box locomotive, its own profile tables (`cnSs8.ts`) | - | Bo-Bo, 17.516 m, 88 t, 3,600 kW, 170 km/h |
| `proc-vehicle-cr-df4` | CR DF4 Dongfeng | its own (`cnDf4.ts`) on the box locomotive kit: the DF4B, US gauge | `livery` (`orangeWhite` "Orange", `green`) | Co-Co, 21.1 m, 138 t, 2,430 kW, 100 km/h |
| `proc-vehicle-cr-df11` | CR DF11 Dongfeng | its own double-ended body (`generator/cnDf11.ts`), blue and cream | - | Co-Co, 21.25 m, 3.0 m wide (real 3.304 m), bogie centres 11.8 m, 138 t, 3,040 kW, 170 km/h |
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
- **CR200J.** Only the short sets' formation (power car, coaches, driving trailer) is drawn; the long sets have a power car at each end.

## Tests

`test/worldTrains.test.ts` (all 160 plan designs: gauge, budget, length, coplanar faces, LOD) and, for each module's
first design, the catalog sweep; `test/cnJs.test.ts` pins the JS's length, wheelbase and bogie tender.
