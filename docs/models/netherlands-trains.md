# The Netherlands' trains

**Covers** - the twenty Dutch designs of the eight-country plan: the Mat '46 and Mat '54 "Hondekop", the Plan V, the DE-I "Blauwe Engel", the ICM "Koploper", the VIRM and DDZ, the SGM, SLT, SNG and ICNG, NS's FLIRT and the Fyra V250; the 1600 / 1700, 1100, 1300, 1200 and 2200 locomotives; the 3700 steam engine; the ICR coach. Their kits, figures, deviations and tests.
**Code** - `generator/nlUnits.ts` (`NL_UNITS`, `nsLivery`), `generator/nlLocos.ts` (`NL_LOCOS`), `generator/frLocos.ts` (the shared bodies), `generator/seriesHelpers.ts` (`flirt`), `generator/worldSteamLocos.ts`, `generator/worldCoaches.ts`, `test/worldTrains.test.ts`, `assets/ns-*/`
**See also** - [france-trains.md](france-trains.md), [shinkansen.md](shinkansen.md), [world-locos.md](world-locos.md), [world-steam.md](world-steam.md), [world-coaches.md](world-coaches.md)

The catalog had no Dutch train before. Every design is filed under the Netherlands.

## The designs

| id | title | kit | parameters | figures (game) |
|---|---|---|---|---|
| `proc-vehicle-ns-mat46` | NS Mat '46 | series, cab face, centre coupler | `unit`, `livery` (`green`, `yellowGrey`) | two cars of 25.9 m; 120 km/h |
| `proc-vehicle-ns-mat54` | NS Mat '54 Hondekop | series | `unit`, `cars` 2 - 4, `livery` (`green`, `yellowGrey`) | the bonnet nose; 140 km/h |
| `proc-vehicle-ns-plan-v` | NS Plan V | series, flat cab | `unit`, `livery` (`yellowGrey`, `yellowBlue`) | two cars of 26.0 m; 140 km/h |
| `proc-vehicle-ns-de1` | NS DE-I Blauwe Engel | series, diesel, single | - | 26.0 m; 120 km/h |
| `proc-vehicle-ns-icm` | NS ICM Koploper | series | `unit`, `cars` 3 - 4, `livery` (`yellowBlue`, `yellowGrey`) | the raised cab over the nose door; 160 km/h |
| `proc-vehicle-ns-virm` | NS VIRM | series, double-deck | `unit`, `cars` 4 - 6, `livery` | 27.0 / 26.4 m; 160 km/h |
| `proc-vehicle-ns-ddz` | NS DDZ | series, double-deck, flat cab | `unit`, `cars` 4 - 6, `livery` | 140 km/h |
| `proc-vehicle-ns-sgm` | NS SGM Sprinter | series, flat cab | `unit`, `cars` 2 - 3, `livery` (`yellowGrey`, `sprinter`) | 26.1 m cars; 125 km/h |
| `proc-vehicle-ns-slt` | NS SLT | series | `unit`, `cars` 4 - 6 | 160 km/h |
| `proc-vehicle-ns-sng` | NS SNG | series | `unit`, `cars` 3 - 4 | 160 km/h |
| `proc-vehicle-ns-icng` | NS ICNG | series | `unit`, `cars` 5 - 8 | the long nose, its lower front rounded to a small tip, the black band round the windscreen; 200 km/h |
| `proc-vehicle-ns-flirt` | NS Flirt | series, Stadler FLIRT | `unit`, `cars` 3 - 4 | 160 km/h |
| `proc-vehicle-ns-v250` | Fyra V250 | series | `unit`, `cars` 3 - 8 | 27.15 / 26.0 m; 250 km/h |
| `proc-vehicle-ns-1700` | NS 1600 / 1700 | box locomotive, BB 22200 body | `livery` (`yellowGrey`, `railion`) | B-B, 17.48 m, 4,540 kW, 160 km/h |
| `proc-vehicle-ns-1100` | NS 1100 | box locomotive, short BB 9200 body | `livery` (`blue`, `yellowGrey`) | B-B, 12.93 m, 2,350 kW, 135 km/h |
| `proc-vehicle-ns-1300` | NS 1300 | box locomotive, CC 7100 body | `livery` (`blue`, `yellowGrey`) | Co-Co, 18.95 m, 2,340 kW, 135 km/h |
| `proc-vehicle-ns-1200` | NS 1200 | box locomotive, streamlined | `livery` (`blue`, `yellowGrey`) | Co-Co, 18.08 m, 2,360 kW, 150 km/h |
| `proc-vehicle-ns-2200` | NS 2200 | box locomotive, hoods, diesel | `livery` (`brown`, `yellowGrey`) | Bo-Bo, 14.1 m, 670 kW, 100 km/h |
| `proc-vehicle-ns-3700` | NS 3700 | steam | `unit` | 2'C, 1.85 m drivers; 920 kW, 100 km/h |
| `proc-vehicle-ns-icr-coach` | NS ICR coach | coach | `unit` (`a`, `b`), `livery` (`yellowGrey`, `yellowBlue`) | 26.4 m; 160 km/h |

`nsLivery` holds NS's schemes (yellow and blue, yellow and grey, the 1950s green, the
Sprinter white, the Fyra) for the units; the locomotives' are in `nlLocos.ts`.

## Deviations

- **Mat '46.** The "Muizenneus" end is a cab face (the series kit's `cabFace`, after the
  photographs in `assets/ns-mat46/`): half-round in plan, the band of five windows in silver
  frames wrapping round it under the red band and the silver dome, the marker lamp in the band,
  two lamps low, the Scharfenberg centre coupler (no buffers). The green scheme is the museum
  unit 273's: the silver skirt, the red waist and cantrail bands, the silver roof.

- **2200.** A centre cab between hoods, drawn at the cab's width; the real cab stands
  off centre between narrow hoods with walkways.
- **ICNG.** The nose is drawn from tables, not measured drawings; no reference photographs
  are stored yet (Wikimedia refused the downloads when the nose was reworked).
- **1100.** The original flat-fronted body; the "hondekop" noses some received in the
  1970s are not drawn.
- **Units.** Articulated Jacobs bogies (the SLT, SNG, ICNG, FLIRT) are drawn as each
  car's own pair of bogies, as the series kit draws every car.

## Tests

`test/worldTrains.test.ts` and the catalog sweep.
