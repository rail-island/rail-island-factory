# Spain's trains

**Covers** - the twenty Spanish designs of the eight-country plan: the AVE S-100 and S-103, the Talgo S-102 "Pato", S-106 Avril and S-130 Alvia and the Talgo III coaches, the S-120, the Civia, the 446, 440 and 592, Iryo's Frecciarossa 1000; the 354 "Virgen", 252, 269, 277, 319 and 333 locomotives; the 141F and 242F steam engines. Their kits, figures, deviations and tests.
**Code** - `generator/esUnits.ts` (`ES_UNITS`, `esLivery`), `generator/esLocos.ts` (`ES_LOCOS`), `generator/seriesHelpers.ts` (`velaro`, `talgo`), `generator/worldSteamLocos.ts`, `test/worldTrains.test.ts`, `assets/renfe-*/`, `assets/talgo-iii/`, `assets/iryo-s109/`
**See also** - [shinkansen.md](shinkansen.md), [world-locos.md](world-locos.md), [world-steam.md](world-steam.md), [germany-trains.md](germany-trains.md) (the Velaro)

The catalog had no Spanish train before. Every design is filed under Spain.

## The designs

| id | title | kit | parameters | figures (game) |
|---|---|---|---|---|
| `proc-vehicle-renfe-s100` | AVE S-100 | series, TGV-style nose | `unit`, `cars` 3 - 8, `livery` (`ave`, `avlo`) | 300 km/h |
| `proc-vehicle-renfe-s103` | AVE S-103 | series, Velaro body | `unit`, `cars` 3 - 8 | 350 km/h |
| `proc-vehicle-renfe-s102` | AVE S-102 Pato | series, Talgo base | `unit`, `cars` 4 - 8, `livery` (`ave`, `avlo`) | the duck-bill power cars; 330 km/h |
| `proc-vehicle-renfe-s106` | Talgo Avril S-106 | series, Talgo base | `unit`, `cars` 4 - 8, `livery` (`avlo`, `ave`) | 330 km/h |
| `proc-vehicle-renfe-s130` | Alvia S-130 | series, Talgo base | `unit`, `cars` 4 - 8 | 250 km/h |
| `proc-vehicle-talgo-iii` | Talgo III | series, Talgo base, unpowered, tail face | `unit`, `cars` 4 - 8 | short coaches; 140 km/h |
| `proc-vehicle-renfe-s120` | Renfe S-120 | series | `unit` (four cars), `livery` (`alvia`, `mediaDistancia`) | 250 km/h |
| `proc-vehicle-renfe-civia` | Renfe Civia | series | `unit`, `cars` 3 - 5 | 120 km/h |
| `proc-vehicle-renfe-446` | Renfe 446 | series, flat cab | `unit` (three cars) | 100 km/h |
| `proc-vehicle-renfe-440` | Renfe 440 | series, flat cab | `unit`, `livery` (`regional`, `cercanias`) | 140 km/h |
| `proc-vehicle-renfe-592` | Renfe 592 | series, flat cab, diesel | `unit`, `livery` (`regional`, `mediaDistancia`) | 120 km/h |
| `proc-vehicle-iryo-s109` | Iryo Frecciarossa 1000 | series | `unit`, `cars` 4 - 8 | 360 km/h |
| `proc-vehicle-renfe-354` | Renfe 354 Virgen | box locomotive, streamlined, diesel | - | 17.5 m, 1,980 kW, 180 km/h |
| `proc-vehicle-renfe-252` | Renfe 252 | box locomotive, raked | `livery` (`ave`, `mercancias`) | Bo-Bo, 20.38 m, 5,600 kW, 220 km/h |
| `proc-vehicle-renfe-269` | Renfe 269 | box locomotive, flat | `livery` (`taxi`, `estrella`) | Bo-Bo, 17.27 m, 3,100 kW, 140 km/h |
| `proc-vehicle-renfe-277` | Renfe 277 | box locomotive, raked | `livery` (`green`, `blue`) | Co-Co, 20.68 m, 2,700 kW, 110 km/h |
| `proc-vehicle-renfe-319` | Renfe 319 | box locomotive, streamlined, diesel | `livery` (`estrella`, `mercancias`) | Co-Co, 20.0 m, 1,500 kW, 120 km/h |
| `proc-vehicle-renfe-333` | Renfe 333 | box locomotive, raked, diesel | `livery` (`mercancias`, `talgo`) | Co-Co, 20.7 m, 2,300 kW, 160 km/h |
| `proc-vehicle-renfe-141f` | Renfe 141F Mikado | steam | `unit` | 1'D1', 1.56 m drivers; 90 km/h |
| `proc-vehicle-renfe-242f` | Renfe 242F | steam | `unit` | 2'D1', 1.9 m drivers; 135 km/h |

## The Talgo base

`talgo()` in `seriesHelpers.ts`: short cars (13.14 m) on single axles (`wheelbase: 0`),
the end cars raising the pantographs (`endPantograph`), `traction: "none"` for the
unpowered Talgo III set (filed with the coaches).

## Deviations

- **Talgo III.** The end car is the set's tail (after the photographs in `assets/talgo-iii/`): a
  cab face with no windscreen (the series kit's `cabFace`), bowed and upright with rounded corners,
  the red window band between dark lines carried round it over the stainless lower body and under
  the silver roof, the door off to one side with its porthole and outline, the marker lamps high
  and low, the number, buffers at 1.02 m. The roof's ribs and the sides' fluting are not drawn.

- **Gauge.** The Iberian broad gauge (1,668 mm) stock keeps its bodies on the game's
  standard-gauge wheelsets.
- **Talgo.** Each car stands on two single axles of its own, 3.5 m in from its ends;
  the real Talgo shares one wheel pair between two cars at each joint. The S-102's,
  S-106's and S-130's power cars are drawn as the series kit's end cars, with windows.
- **S-100.** Drawn on the series kit with a TGV-style nose, not on the TGV builder
  (`tgv.ts`, the vlakosimdb pixel maps): its trailers ride on their own bogies.

## Tests

`test/worldTrains.test.ts` and, for each module's first design, the catalog sweep.
