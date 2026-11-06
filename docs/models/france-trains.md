# France's trains

**Covers** - the twenty French designs of the eight-country plan: the TGV M, the Z 20500, the RER MI 09, the Regio 2N and the Regiolis, the X 3800 "Picasso" and X 73500 railcars; Paul Arzens's "nez casse" CC 6500, CC 40100, BB 22200 and CC 72000, the CC 7100 and BB 9200, the BB 27000 Prima and the BB 67400; the 241 P and 141 R steam engines; the Corail, Grand Confort and Wagons-Lits coaches. Their kits, figures, deviations and tests.
**Code** - `generator/frUnits.ts` (`FR_UNITS`), `generator/frLocos.ts` (`FR_LOCOS`, the shared bodies), `generator/worldSteamLocos.ts`, `generator/worldCoaches.ts`, `test/worldTrains.test.ts`, `assets/sncf-*/`, `assets/ratp-mi09/`, `assets/ciwl-car/`
**See also** - [shinkansen.md](shinkansen.md) (the series kit), [world-locos.md](world-locos.md), [world-steam.md](world-steam.md), [world-coaches.md](world-coaches.md), [netherlands-trains.md](netherlands-trains.md) (the bodies' Dutch sisters), [tgv-duplex.md](tgv-duplex.md)

The catalog already had the TGV (PSE, Atlantique) and the TGV Duplex; neither is
repeated. Every design is filed under France (`generator/countryTable.ts`).

## The designs

| id | title | kit | parameters | figures (game) |
|---|---|---|---|---|
| `proc-vehicle-sncf-tgv-m` | TGV M | series, double-deck | `unit`, `cars` 3 - 8, `livery` (`inoui`, `ouigo`) | end 22.15 m, middle 20.6 m; 320 km/h |
| `proc-vehicle-sncf-z20500` | SNCF Z 20500 | series, double-deck, flat cab | `unit`, `cars` 4 - 5, `livery` (`transilien`, `ileDeFrance`) | 26.4 / 24.28 m; 140 km/h |
| `proc-vehicle-ratp-mi09` | RER MI 09 | series, double-deck | `unit` (five cars) | 23.6 / 21.0 m, three wide doors a side; 120 km/h |
| `proc-vehicle-sncf-regio2n` | Regio 2N | series, double-deck | `unit`, `cars` 4 - 6, `livery` (`ter`, `transilien`) | 17.9 / 16.0 m; 160 km/h |
| `proc-vehicle-sncf-regiolis` | Regiolis | series | `unit`, `cars` 3 - 6, `livery` (`ter`, `grandEst`) | 19.0 / 15.5 m; 160 km/h |
| `proc-vehicle-sncf-x3800` | SNCF X 3800 Picasso | series, diesel, single, cab face, roof turret | - | 21.85 m over buffers; 120 km/h |
| `proc-vehicle-sncf-x73500` | SNCF X 73500 | series, diesel, single | `livery` (`ter`, `alsace`) | 28.9 m; 140 km/h |
| `proc-vehicle-sncf-cc6500` | SNCF CC 6500 | box locomotive, nez casse | `livery` (`capitole`, `maurienne`, `beton`) | C-C, 20.19 m, 5,900 kW, 200 km/h |
| `proc-vehicle-sncf-cc40100` | SNCF CC 40100 | box locomotive, nez casse | - | C-C, 22.03 m, 4,480 kW, 160 km/h |
| `proc-vehicle-sncf-bb22200` | SNCF BB 22200 | box locomotive, nez casse | `livery` (`beton`, `enVoyage`, `fret`) | B-B, 17.48 m, 4,360 kW, 160 km/h |
| `proc-vehicle-sncf-cc7100` | SNCF CC 7100 | box locomotive, raked | `livery` (`blue`, `green`) | Co-Co, 18.92 m, 3,490 kW, 150 km/h |
| `proc-vehicle-sncf-bb9200` | SNCF BB 9200 | box locomotive, flat | `livery` (`blue`, `capitole`) | B-B, 16.2 m, 3,850 kW, 160 km/h |
| `proc-vehicle-sncf-bb27000` | SNCF BB 27000 Prima | box locomotive, raked | - | Bo-Bo, 19.52 m, 4,200 kW, 140 km/h |
| `proc-vehicle-sncf-bb67400` | SNCF BB 67400 | box locomotive, diesel | `livery` (`blueWhite`, `fret`) | B-B, 17.09 m, 1,765 kW, 140 km/h |
| `proc-vehicle-sncf-cc72000` | SNCF CC 72000 | box locomotive, nez casse, diesel | `livery` (`blueWhite`, `multiservice`) | C-C, 20.19 m, 2,650 kW, 160 km/h |
| `proc-vehicle-sncf-241p` | SNCF 241 P | steam | `unit` | 2'D1', 2.02 m drivers; 2,980 kW, 120 km/h |
| `proc-vehicle-sncf-141r` | SNCF 141 R | steam | `unit` | 1'D1', 1.65 m drivers; 1,840 kW, 100 km/h |
| `proc-vehicle-sncf-corail-coach` | SNCF Corail coach | coach | `unit` (`a10tu`, `b11tu`), `livery` (`corail`, `teoz`) | 26.4 m; 200 km/h |
| `proc-vehicle-sncf-grand-confort` | SNCF Grand Confort | coach | `unit` (`a8u`, `a7d`), `livery` (`capitole`, `tee`) | 24.5 m; 200 km/h |
| `proc-vehicle-ciwl-car` | Wagons-Lits car | coach | `unit` (`pullman`, `sleeping`), `livery` (`pullman`, `ciwlBlue`) | 23.45 m; 140 km/h |

The figures are the published ones (each `assets/<name>/SOURCES.md`).

## Shared bodies

`frLocos.ts` exports its bodies: `CC6500_BODY`, `CC40100_BODY`, `BB22200_BODY`,
`CC72000_BODY` (the "nez casse" family), `CC7100_BODY` and `BB9200_BODY` (Alsthom's
1950s body) and `PRIMA_BODY`. The Dutch 1600 / 1700 ride on the BB 22200's, the 1300
on the CC 7100's and the 1100 on a shortened BB 9200's ([netherlands-trains.md](netherlands-trains.md)).

## Deviations

- **Nez casse.** The broken nose is the kit's `nezCasse` end profile: the lower nose,
  the break, the windscreen leaning out to a visor; the real ends' plan curves are
  simplified to the kit's end plan.
- **X 3800.** After the photographs in `assets/sncf-x3800/`: the driver's turret on the roof
  near one end and off to one side (the series' `fittings`; a roof block in the distant model),
  its windscreens looking both ways and two windows a side, its top rounded. Both ends are cab
  faces (the series kit's `cabFace`): upright with rounded corners, two big and two narrow windows
  in rubber, the big lamps at the corners, the red rising from a V in the middle to them, the
  number, buffers and a screw coupling. Red below the windows, cream above and on the roof. The
  turret's curved windscreen tops and the engine compartment's grilles are not drawn.
- **TGV M.** The ends are drawn as passenger cars with a nose (the series kit); the
  real Avelia Horizon's ends are power cars with no seats.
- **CIWL.** One body for the Pullman and the sleeping car; the liveries are separate
  from the type of car, so a sleeping car can wear the Pullman's cream.

## Tests

`test/worldTrains.test.ts` (gauge, budget, published length, country, button
titles) and the catalog sweep.
