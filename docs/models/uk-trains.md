# The United Kingdom's trains

**Covers** - the twenty British designs of the eight-country plan, at their real size on the W6a gauge (`uk`): the InterCity 125 and 225, the Class 800 IET and the Class 390 Pendolino, the Eurostar e300, the Class 158 and the Class 142 Pacer, London's 1938 tube stock; the Class 55 Deltic, 37, 47, 66 and 86; the LNER A4 and A3, the GWR Castle, the LMS Black Five, the BR 9F and Stephenson's Rocket; the BR Mk1 coach. Their kits, figures, deviations and tests.
**Code** - `generator/ukUnits.ts` (`UK_UNITS`), `generator/lu1938Parts.ts`, `generator/ukLocos.ts` (`UK_LOCOS`), `generator/loadingGauge.ts` (`uk`), `generator/worldLocoKit.ts` (the `bonnets` nose), `generator/worldSteamLocos.ts`, `generator/rocket.ts`, `generator/worldCoaches.ts`, `test/worldTrains.test.ts`, `test/lu1938.test.ts`, `test/rocket.test.ts`, `assets/br-*/`, `assets/lner-*/`, `assets/gwr-castle/`, `assets/lms-black-five/`, `assets/lu-1938-stock/`, `assets/eurostar-373/`, `assets/rocket/`
**See also** - [loading-gauge.md](loading-gauge.md), [shinkansen.md](shinkansen.md), [world-locos.md](world-locos.md), [world-steam.md](world-steam.md), [world-coaches.md](world-coaches.md)

The catalog had no British train before; the archived webapp Eurostar is now the
`eurostar-373` design. Every design is filed under the United Kingdom.

## The designs

| id | title | kit | parameters | figures (game) |
|---|---|---|---|---|
| `proc-vehicle-br-hst` | InterCity 125 | series, diesel, Mk3 cars | `unit`, `cars` 4 - 8, `livery` (`swallow`, `blueGrey`) | power car 17.79 m, Mk3 23.0 m; 200 km/h |
| `proc-vehicle-br-ic225` | InterCity 225 | series, Mk4 cars | `unit`, `cars` 4 - 8, `livery` (`intercity`, `lner`) | the Class 91's end; 225 km/h |
| `proc-vehicle-br-class-800` | Class 800 IET | series | `unit`, `cars` 5 - 8, `livery` (`gwr`, `azuma`) | 26 m cars; 200 km/h |
| `proc-vehicle-br-class-390` | Class 390 Pendolino | series | `unit`, `cars` 4 - 8, `livery` (`virgin`, `avanti`) | tilting; 225 km/h |
| `proc-vehicle-eurostar-373` | Eurostar e300 | series | `unit`, `cars` 4 - 8, `livery` (`eurostar`, `eurostar2011`) | 300 km/h |
| `proc-vehicle-br-class-158` | Class 158 | series, diesel | `unit`, `livery` (`regional`, `northern`) | two cars of 22.57 m; 145 km/h |
| `proc-vehicle-br-class-142` | Class 142 Pacer | series, diesel, single axles | `unit`, `livery` (`provincial`, `northern`) | two cars of 15.45 m; 120 km/h |
| `proc-vehicle-lu-1938-stock` | London 1938 Stock | series, metro, flat domed cab | `unit`, `cars` 3 - 7 | tube profile, 2.62 m by 2.88 m; 72 km/h |
| `proc-vehicle-br-class-55` | Class 55 Deltic | box locomotive, bonnets | `livery` (`twoToneGreen`, `brBlue`) | Co-Co, 21.18 m, 2,460 kW, 160 km/h |
| `proc-vehicle-br-class-37` | Class 37 | box locomotive, bonnets | `livery` (`green`, `brBlue`, `railfreight`) | Co-Co, 18.75 m, 1,300 kW, 145 km/h |
| `proc-vehicle-br-class-47` | Class 47 | box locomotive, raked | `livery` (`twoToneGreen`, `brBlue`, `intercity`) | Co-Co, 19.38 m, 1,925 kW, 153 km/h |
| `proc-vehicle-br-class-66` | Class 66 | box locomotive, raked | `livery` (`ews`, `freightliner`, `gbrf`) | Co-Co, 21.35 m, 2,385 kW, 120 km/h |
| `proc-vehicle-br-class-86` | Class 86 | box locomotive, flat | `livery` (`brBlue`, `intercity`) | Bo-Bo, 17.83 m, 3,010 kW, 160 km/h |
| `proc-vehicle-lner-a4` | LNER A4 | steam | `unit`, `livery` (`garterBlue`, `brGreen`) | 4-6-2, 2.03 m drivers |
| `proc-vehicle-lner-a3` | LNER A3 | steam | `unit`, `livery` (`appleGreen`, `brGreen`) | 4-6-2, 2.03 m drivers, small deflectors |
| `proc-vehicle-gwr-castle` | GWR Castle | steam | `unit` | 4-6-0, 2.04 m drivers, Belpaire firebox |
| `proc-vehicle-lms-black-five` | LMS Black Five | steam | `unit` | 4-6-0, 1.83 m drivers |
| `proc-vehicle-br-9f` | BR 9F | steam | `unit`, `livery` (`brBlack`, `eveningStar`) | 2-10-0, 1.52 m drivers |
| `proc-vehicle-rocket` | Stephenson's Rocket | steam, no cab, no valve gear | `unit`, `version` (`rainhill`, `rebuilt`) | 0-2-2, 1.435 m drivers; 47 km/h |
| `proc-vehicle-br-mk1-coach` | BR Mk1 coach | coach | `unit` (`tso`, `bsk`), `livery` (`crimsonCream`, `maroon`, `southernGreen`) | 19.66 m; 145 km/h |

## Deviations

- **Power cars.** The HST's Class 43, the IC225's Class 91 and the Eurostar's power cars
  are the series kit's end cars, with passenger windows; the IC225's driving van
  trailer is the end car turned, its pantograph raised too.
- **A4.** The streamlined casing is not drawn: the generator's boiler, cab and running
  boards in garter blue (a follow-up for the steam kit's streamlined volumes).
- **Rocket.** Its own parts (`generator/rocket.ts`, on the steam kit's running gear): the
  level 6 ft boiler with its black smokebox, the white chimney with its bands, crown and
  four stays, the firebox at the rear, the bar frame with its springs, and the two
  cylinders inclined at 35 degrees beside the firebox, the crosshead sliding along their
  axis to the front wheels' cranks (`cylinder.incline`, docs/models/animation.md). The
  tender is a four-wheeled wagon on an outside frame, the axles 1.7 m apart, with slatted
  sides, coke and the water barrel lying across. The chimney's crown stops at 3.96 m,
  inside the W6a gauge; the real one stood about 4.4 m high.
  The feed pump on the right side runs along the cylinder: its ram rides on an arm
  from the crosshead (`crossheadParts`, docs/models/animation.md), its pipes go to a
  clack on the boiler and back to the tender. A driver in tailcoat and top hat stands
  on the footplate with a hand on the regulator, a fireman shovels coke on the tender.
  `version`: `rainhill` is the engine of the 1829 trials; `rebuilt` is the 1830
  rebuild, its cylinders lowered to 8 degrees beside the firebox (the pump above
  them), a drum smokebox ahead of the boiler and a plain black chimney on it, 3.88 m
  high. The tender is the same for both.
- **1938 Stock.** A metro on the series kit: no collector is drawn (the tube's conductor
  rails are not modelled), nor the shoe gear on the bogies.

## London 1938 Stock

Measured on the photographs in `assets/lu-1938-stock/` (the South Ealing and Amersham
heritage unit, the London Transport Museum's car 10012). The body is the tube profile:
2.62 m wide, upright sides to the window and door heads at 2.3 m, then a low dome to the
2.88 m crown, painted the roof's oxide red over the body's LT red; the side number (10012)
in gold. The driving motor car (16.0 m over the couplers) and the trailer (15.5 m) stand on
bogies centred 10 m apart. Each side has double doors parting in the middle either side of
a bay of four windows, a single door near each end (the driving car's at its rear) and, on
the driving car, the cab door behind the cab; the leaves open (docs/models/doors.md).

The cab front (`lu1938Parts.ts`) is flat, its corners rounded in plan and its roof domed
down to it with the fan vent on the dome: the centre door between two windscreens, the set
number box (747) on it and the car letter beside it, the destination blind and the marker
and tail lamps on the left seen from ahead, grab handles on stand-offs, the headstock and
step under it and the coupler under the floor at 0.45 m. All the equipment hangs under the
floor between the bogies, as the type introduced. About 9,700 triangles the driving car,
8,900 the trailer. `test/lu1938.test.ts` checks the profile, the domed cab, the layout and
the budget.

## Tests

`test/rocket.test.ts` (the Rocket's inclined cylinders, its chimney in the gauge, every
parametric tender's wheels apart), `test/worldTrains.test.ts` (with the `uk` gauge: every British design within 2.82 m by
4.0 m) and, for each module's first design, the catalog sweep.
