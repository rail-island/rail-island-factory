# The United Kingdom's trains

**Covers** - the twenty British designs of the eight-country plan and London Overground's Class 378 Capitalstar (a draft), at their real size on the W6a gauge (`uk`): the InterCity 125 and 225, the Class 800 IET and the Class 390 Pendolino, the Eurostar e300, the Class 158 and the Class 142 Pacer, London's 1938 tube stock; the Class 55 Deltic, 37, 47, 66 and 86; the LNER A4 and A3, the GWR Castle, the LMS Black Five, the BR 9F and Stephenson's Rocket; the BR Mk1 coach. Their kits, figures, deviations and tests.
**Code** - `generator/ukUnits.ts` (`UK_UNITS`), `generator/brClass142.ts` (the Pacer's cars), `generator/brClass158.ts` (the Class 158's cars), `generator/lu1938Parts.ts`, `generator/ukLocos.ts` (`UK_LOCOS`), `generator/loadingGauge.ts` (`uk`), `generator/worldLocoKit.ts` (the `bonnets` nose), `generator/worldSteamLocos.ts`, `generator/rocket.ts`, `generator/worldCoaches.ts`, `test/worldTrains.test.ts`, `test/lu1938.test.ts`, `test/ukPowerCars.test.ts`, `test/rocket.test.ts`, `test/brClass142.test.ts`, `test/brClass158.test.ts`, `test/brClass378.test.ts`, `assets/br-*/`, `assets/lner-*/`, `assets/gwr-castle/`, `assets/lms-black-five/`, `assets/lu-1938-stock/`, `assets/eurostar-373/`, `assets/rocket/`, `assets/br-class-378/`
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
| `proc-vehicle-br-class-158` | Class 158 | its own cars on bogies (`brClass158.ts`) | `unit`, `livery` (`regional`, `northern`) | two cars of 22.57 m, 2.70 m wide; 145 km/h |
| `proc-vehicle-br-class-142` | Class 142 Pacer | its own two-axle cars (`brClass142.ts`) | `unit`, `livery` (`provincial`, `northern`, `walesTeal`, `provincialBlue`, `metro`, `walesWrap`) | two cars of 15.45 m; 120 km/h |
| `proc-vehicle-br-class-378` | Class 378 Capitalstar | series, two doors a side | `unit`, `cars` 3 - 5 (4 default) | Electrostar, 2.80 m wide, end car 20.4 m, middle 20.1 m; 2,400 kW a five-car unit; 121 km/h |
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

- **Class 378.** A draft (not in `catalogModels.json`). The London Overground scheme is one
  livery, so no `livery` parameter: blue skirt, a thin orange stripe, white sides and a black
  window band, the door leaves orange (the livery's `doors`) and the cab front yellow under
  the black windscreen field (its `front`, the series kit's colour field over the nose; the
  orange outline round the cab is not drawn). The cab is upright: its flat front face carries
  the two windscreens, the gangway door's outline and its window between them, and the lamps
  (the series kit's `noseCab`); the door has no handle or steps. The three- and five-car trains raise one pantograph, on the middle car as on the
  378/2; the four-car train raises two (the series kit's formation rule). The 750 V
  third-rail shoes are not drawn. The seats (272 a
  five-car unit, tip-ups included) and the 2,400 kW are shared evenly over the cars.

- **Power cars.** The Eurostar's power cars are drawn as locomotives: bogies 14 m apart
  under the middle, the cab door and a porthole behind the cab, the machine room's long
  louvre band, and the pantograph on the power car - raised on the trailing one in a train,
  none on the trailers (photographs in `assets/eurostar-373/`); the leading power car's
  folded pantograph is not drawn. The HST's Class 43 is drawn as a locomotive: its wedge nose yellow below the
  windscreen, the yellow valance low ahead of the bogie, bogies 10.29 m apart under the
  middle of the body, plain sides with the cab door, the radiator grille and the van's
  door and window at the inner end (photographs in `assets/br-hst/`); the nose's lamp
  clusters are one lamp a side and its intake grille is not drawn. The IC225's Class 91 is drawn as a locomotive: its
  short wedge No. 1 end with the yellow panel, lamps and grille on the front, buffers,
  bogies 10.5 m apart under the middle of the body, plain sides with the cab doors and
  four small windows (photographs in `assets/br-ic225/`). The driving van trailer is that
  end car turned, its pantograph folded away (only the leading Class 91 raises one); its
  own blunt van body is not drawn.
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

## The Class 142 Pacer

The Pacer keeps the series kit's parameters and figures (the `C142` spec in `ukUnits.ts`), but
its cars are drawn by `brClass142.ts` on the two-axle railcar kit the CD 810 uses (`dmuKit.ts`,
`cabNose.ts`; docs/models/czech-dmus.md), after the photographs in `assets/br-class-142/`:

- **Body.** The Leyland National bus body: straight sides tucked in at the foot, the shallow roof on
  small shoulders, 14.65 m from the inner end wall to the cab face, 2.74 m wide (the real 2.80 m
  narrowed so the window frames stay within the W6a gauge's 2.82 m). One cab-side window, the
  double plug door behind it, seven saloon windows with their hoppers.
- **Cab.** A flat face, upright to the windscreens' sill and leaning back over the blind into the
  roof, its corners rounded: the yellow end wrapping round them, the black surround over the three
  windscreens (the driver's, the centre one, the second man's) and the destination blind, the lamp clusters (head, marker, tail) low either side,
  the horn grille, the number, the wipers; the buffer beam with buffers and a screw coupling, the
  life guards and hoses.
- **Running gear.** Two single axles 9.0 m apart (no bogies: the rig's two supports carry one
  axle each), each axle box between horn guides with a coil spring up to the solebar, a damper
  leaning in from the solebar and brake blocks on hangers either side of each wheel; the solebars,
  cable conduits, the engine, gearbox, silencer, cooler, batteries, fuel and air tanks and brake
  cylinders between the axles; the roof pod, its vents and the exhaust at the inner end.
- **Unit.** `train` couples two cars, the rear one turned, as two sections hinged at the coupling
  plane between them under a bellows; a lone car keeps its gangway and coupling bar.
- **Liveries.** `provincial` (chocolate and cream, the default), `northern` (navy and silver),
  `walesTeal` (Arriva Trains Wales: teal, the yellow line, the white panel from the door to the cab,
  its foot sweeping down toward the cab, pale door leaves), `provincialBlue` (BR Provincial: light
  blue at the windows, a white line, dark blue below), `metro` (West Yorkshire Metro: teal with lime
  and leaf-green triangles along the saloon) and `walesWrap` (Transport for Wales: the teal with a
  navy wrap under the saloon windows). A livery's panels, sweeps and triangles are convex polygons
  laid on the flat of the sides (`Paint.shapes`). Every scheme has the full yellow cab end; the
  three new ones have no OpenTTD preset yet.

`test/brClass142.test.ts` checks the parameters, each livery's car (length over the buffers, the
gauge, the budget, no coplanar faces), the three panes, the panel and each axle's spring, damper
and brakes, the two axles, the coupled unit's sections and supports and
the distant models' budgets.

## The Class 158

The Express Sprinter keeps the series kit's parameters and figures (the `C158` spec in
`ukUnits.ts`), but its cars are drawn by `brClass158.ts` on the railcar kit the Class 142 uses
(`dmuKit.ts`, `cabNose.ts`), after the photographs and the diagram in `assets/br-class-158/`.

- **Body.** 21.9 m from the inner end wall to the cab front's foot, 22.57 m over the couplers,
  2.70 m wide: the sides tucked in at the foot, upright to the cantrail, the roof's wide radius to
  the 3.81 m crown. The cab-side window, a double plug door at each end of each side and nine
  saloon windows between them (the diagram's layout); the side number at the inner end.
- **Cab.** A flat face upright at the valance, then raked back as one plane from the lamps to the
  top (0.2 m over 1.95 m) and rounding into the roof, its corners rounded in plan: the gangway
  door in its black frame standing off the face, its leaf recessed (with a light in the Regional
  Railways scheme); either side one black surround holding the windscreen, the running number
  under the right one and the head, marker and tail lamps; the wipers; the valance sloping back
  under the face with the coupler pocket and the BSI coupler at 0.9 m.
- **Running gear.** Two air-sprung bogies 16.0 m apart about the car's centre (`unitBogie`),
  2.6 m wheelbase on 0.84 m wheels; the engine, transmission, silencer, cooler, fuel and air tanks,
  batteries and the air-conditioning plant between them; the air-conditioning unit with its grille
  on the roof behind the cab, three vents and the exhaust stack at the inner end.
- **Unit.** `train` couples two cars, the rear one turned, as two sections hinged at the coupling
  plane under a bellows; a lone car keeps its gangway.
- **Liveries.** `regional` (Regional Railways Express, 158 819, the default): light grey, the navy
  window band and the navy and light blue lines under it, grey door leaves, the yellow end down to
  the valance. `northern` (158 784): white, the blue panel over the cab end of each side back past
  the first saloon window, its rear edge leaning, white door leaves, the yellow front over a dark
  grey valance. Northern's emblem and circles are not drawn; the panel's curved edge is a straight,
  leaning one.

`test/brClass158.test.ts` checks the parameters, each livery's car (length over the couplers, the
gauge, the budget, no coplanar faces), the raked face with the two windscreens and the gangway
door, the doors and windows, the two bogies, the coupled unit's sections and supports and the
distant models' budgets.

## Tests

`test/ukPowerCars.test.ts` (the Class 91's, the Class 43's and the Eurostar's bogies, their noses without
a gangway frame, the warning panels, the Class 43's radiator grille, the IC225's leading
and the Eurostar's trailing pantograph),
`test/rocket.test.ts` (the Rocket's inclined cylinders, its chimney in the gauge, every
parametric tender's wheels apart), `test/worldTrains.test.ts` (with the `uk` gauge: every British design within 2.82 m by
4.0 m) and, for each module's first design, the catalog sweep.
