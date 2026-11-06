# The United Kingdom's trains

**Covers** - the twenty British designs of the eight-country plan, at their real size on the W6a gauge (`uk`): the InterCity 125 and 225, the Class 800 IET and the Class 390 Pendolino, the Eurostar e300, the Class 158 and the Class 142 Pacer, London's 1938 tube stock; the Class 55 Deltic, 37, 47, 66 and 86; the LNER A4 and A3, the GWR Castle, the LMS Black Five, the BR 9F and Stephenson's Rocket; the BR Mk1 coach. Their kits, figures, deviations and tests.
**Code** - `generator/ukUnits.ts` (`UK_UNITS`), `generator/brClass142.ts` (the Pacer's cars), `generator/ukLocos.ts` (`UK_LOCOS`), `generator/loadingGauge.ts` (`uk`), `generator/worldLocoKit.ts` (the `bonnets` nose), `generator/worldSteamLocos.ts`, `generator/worldCoaches.ts`, `test/worldTrains.test.ts`, `assets/br-*/`, `assets/lner-*/`, `assets/gwr-castle/`, `assets/lms-black-five/`, `assets/lu-1938-stock/`, `assets/eurostar-373/`, `assets/rocket/`
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
| `proc-vehicle-br-class-142` | Class 142 Pacer | its own two-axle cars (`brClass142.ts`) | `unit`, `livery` (`provincial`, `northern`, `walesTeal`) | two cars of 15.45 m; 120 km/h |
| `proc-vehicle-lu-1938-stock` | London 1938 Stock | series, metro | `unit`, `cars` 3 - 7 | tube profile, 2.88 m high; 72 km/h |
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
| `proc-vehicle-rocket` | Stephenson's Rocket | steam, no cab, no valve gear | `unit` | 0-2-2, 1.435 m drivers; 47 km/h |
| `proc-vehicle-br-mk1-coach` | BR Mk1 coach | coach | `unit` (`tso`, `bsk`), `livery` (`crimsonCream`, `maroon`, `southernGreen`) | 19.66 m; 145 km/h |

## Deviations

- **Power cars.** The HST's Class 43, the IC225's Class 91 and the Eurostar's power cars
  are the series kit's end cars, with passenger windows; the IC225's driving van
  trailer is the end car turned, its pantograph raised too.
- **A4.** The streamlined casing is not drawn: the generator's boiler, cab and running
  boards in garter blue (a follow-up for the steam kit's streamlined volumes).
- **Rocket.** An open footplate on the generator's frame, its boiler level (the real one
  is tilted) and its cylinders driving the wheels without valve gear.
- **1938 Stock.** A metro on the series kit: no collector is drawn (the tube's conductor
  rails are not modelled).

## The Class 142 Pacer

The Pacer keeps the series kit's parameters and figures (the `C142` spec in `ukUnits.ts`), but
its cars are drawn by `brClass142.ts` on the two-axle railcar kit the CD 810 uses (`dmuKit.ts`,
`cabNose.ts`; docs/models/czech-dmus.md), after the photographs in `assets/br-class-142/`:

- **Body.** The Leyland National bus body: straight sides tucked in at the foot, the shallow roof on
  small shoulders, 14.65 m from the inner end wall to the cab face, 2.74 m wide (the real 2.80 m
  narrowed so the window frames stay within the W6a gauge's 2.82 m). One cab-side window, the
  double plug door behind it, seven saloon windows with their hoppers.
- **Cab.** A flat face, upright to the windscreens' sill and leaning back over the blind into the
  roof, its corners rounded: the yellow end wrapping round them, the black surround over the two
  windscreens and the destination blind, the lamp clusters (head, marker, tail) low either side,
  the horn grille, the number, the wipers; the buffer beam with buffers and a screw coupling, the
  life guards and hoses.
- **Running gear.** Two single axles 9.0 m apart in axle guards with leaf springs (no bogies: the
  rig's two supports carry one axle each), the solebars, the engine, gearbox, cooler, batteries
  and tanks between them; the roof pod, its vents and the exhaust at the inner end.
- **Unit.** `train` couples two cars, the rear one turned, as two sections hinged at the coupling
  plane between them under a bellows; a lone car keeps its gangway and coupling bar.
- **Liveries.** `provincial` (chocolate and cream, the default), `northern` (navy and silver) and
  `walesTeal` (Arriva Trains Wales: teal, the yellow line, the white panel from the door to the cab
  stepping down toward it, pale door leaves). Every scheme has the full yellow cab end.

`test/brClass142.test.ts` checks the parameters, each livery's car (length over the buffers, the
gauge, the budget, no coplanar faces), the two axles, the coupled unit's sections and supports and
the distant models' budgets.

## Tests

`test/worldTrains.test.ts` (with the `uk` gauge: every British design within 2.82 m by
4.0 m) and, for each module's first design, the catalog sweep.
