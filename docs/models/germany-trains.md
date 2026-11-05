# Germany's trains

**Covers** - the twenty German designs of the eight-country plan: the ICE 3, ICE 4, ICE T and ICE 2, the S-Bahn BR 423, the Desiro 642, the RegioShuttle 650, the Uerdingen railbus VT 98 and the Fliegender Hamburger; the BR 103, 101, 120, E 18, E 94, V 200 and 218 locomotives; the 01, 52 and Prussian P 8 steam engines; the Intercity coaches. Their kits, figures, deviations and tests.
**Code** - `generator/deUnits.ts` (`DE_UNITS`), `generator/deLocos.ts` (`DE_LOCOS`), `generator/worldSteamLocos.ts`, `generator/worldCoaches.ts`, `generator/seriesHelpers.ts`, `test/worldTrains.test.ts`, `assets/db-*/`, `assets/drg-*/`, `assets/dr-52/`, `assets/kpev-p8/`
**See also** - [shinkansen.md](shinkansen.md) (the series kit), [world-locos.md](world-locos.md), [world-steam.md](world-steam.md), [world-coaches.md](world-coaches.md), [foreign-units.md](foreign-units.md) (the ICE 1), [mainline-electrics.md](mainline-electrics.md)

The catalog already had the DB 111, 212 and 628, the Dosto, the ICE 1, the DR 243,
the Berlin S-Bahn coach, the VT 18.16 and the Vectron; none is repeated here. Every
design is filed under Germany (`generator/countryTable.ts`).

## The designs

| id | title | kit | parameters (default first) | figures (game) |
|---|---|---|---|---|
| `proc-vehicle-db-ice3` | ICE 3 | series, Velaro body | `unit`, `cars` 3 - 8, `livery` (`dbIce`, `nsInternational`) | end 25.675 m, middle 24.775 m; 330 km/h |
| `proc-vehicle-db-ice4` | ICE 4 | series | `unit`, `cars`, `livery` (`dbIce`, `greenStripe`) | 28.75 / 27.9 m; 250 km/h |
| `proc-vehicle-db-ice-t` | ICE T | series | `unit`, `cars`, `livery` (`dbIce`, `obb`) | 27.45 / 25.9 m, the tilting body tucked in; 230 km/h |
| `proc-vehicle-db-ice2` | ICE 2 | ICE 1 builder + series | `unit` (`powerCar`, `coach`, `drivingTrailer`) | the ICE 1's power car and coach, a driving trailer of 26.58 m; 280 km/h |
| `proc-vehicle-db-423` | DB 423 | series | `unit`, `cars` 4, `livery` | four cars, 67.4 m, the end cars' pantographs; 140 km/h |
| `proc-vehicle-db-642` | DB 642 Desiro | series, diesel | `unit` (`endCar`, `train`), `cars` 2, `livery` (`dbRegio`, `erzgebirgsbahn`) | two cars, 41.7 m; 120 km/h |
| `proc-vehicle-db-650` | RegioShuttle RS1 | series, diesel, single | `livery` (`dbRegio`, `odeg`) | 25.5 m, flat cabs; 120 km/h |
| `proc-vehicle-db-vt98` | Uerdingen railbus VT 98 | series, diesel, single | `livery` (`dbRed`, `orientRed`) | 13.95 m over buffers, two axles 6 m apart; 90 km/h |
| `proc-vehicle-drg-svt877` | Fliegender Hamburger | series, diesel | `unit`, `cars` 2, `livery` (`drg`, `dbVt04`) | two cars, 41.9 m; 160 km/h |
| `proc-vehicle-db-103` | DB 103 | box locomotive, streamlined | `livery` (`tee`, `orientRed`, `trafficRed`) | Co'Co', 20.2 m, 7,440 kW, 200 km/h |
| `proc-vehicle-db-101` | DB 101 | box locomotive, raked | `livery` (`trafficRed`, `intercity`) | Bo'Bo', 19.1 m, 6,400 kW, 220 km/h |
| `proc-vehicle-db-120` | DB 120 | box locomotive, raked | `livery` (`orientRed`, `trafficRed`) | Bo'Bo', 19.2 m, 5,600 kW, 200 km/h |
| `proc-vehicle-drg-e18` | DRG E 18 | box locomotive, raked | - | 1'Do1', 16.92 m, 1.6 m drivers, 3,040 kW, 150 km/h |
| `proc-vehicle-drg-e94` | DRG E 94 | box locomotive, hoods | - | Co'Co' crocodile, 18.6 m, 3,300 kW, 90 km/h |
| `proc-vehicle-db-v200` | DB V 200 | box locomotive, streamlined, diesel | `livery` (`dbRed`, `orientRed`) | B'B', 18.53 m, 2 x 810 kW, 140 km/h |
| `proc-vehicle-db-218` | DB 218 | box locomotive, hoods, diesel | `livery` (`purpleRed`, `orientRed`, `trafficRed`) | B'B', 16.4 m, 1,840 kW, 140 km/h |
| `proc-vehicle-drg-01` | DRG 01 | steam | `unit` | 2'C1', 2.0 m drivers, Wagner deflectors; 1,670 kW, 130 km/h |
| `proc-vehicle-dr-52` | DR 52 | steam | `unit` | 1'E, 1.4 m drivers; 1,192 kW, 80 km/h |
| `proc-vehicle-kpev-p8` | Prussian P 8 | steam | `unit`, `livery` (`kpev`, `drBlack`) | 2'C, 1.75 m drivers, no deflectors; 868 kW, 100 km/h |
| `proc-vehicle-db-ic-coach` | DB Intercity coach | coach | `unit` (`avmz`, `bpmz`), `livery` (`tee`, `oceanBlue`, `intercity`) | 26.4 m over buffers, 200 km/h |

The figures are the published ones (each `assets/<name>/SOURCES.md`): Wikipedia's
articles on each class, cited there. Seats and introduction years are in
`generator/openttdTable.ts` and [openttd-figures.md](openttd-figures.md).

## Deviations

- **ICE 3 and Velaro.** The ICE 3 is the shared Velaro body (`velaro()` in
  `seriesHelpers.ts`), which the CRH3C and the AVE S-103 reuse; the differences
  between the classes (BR 403 / 406 / 407) are only the livery's title.
- **Articulation.** The 642's and the SVT 877's two cars share a Jacobs bogie in
  reality; the series kit gives each car its own two bogies.
- **ICE 2.** The power car and the coach are the ICE 1's (`ice1.ts`, its pixel-map
  paint: the ICE 1's band, not the ICE 2's); only the driving trailer is new.
- **Hoods.** The E 94's and the 218's hoods are drawn at the cab's width (the box
  locomotive kit's shell has one half width per height); the real hoods are
  narrower. The windscreens sit on the cab's front above the hoods.
- **E 18.** The four coupled drivers sit in one frame of the kit's multi-axle bogie,
  without coupling rods.
- **Steam.** The generator's layout (boiler, cab, domes from the wheel arrangement and
  wheel sizes) is the class's in proportion, not to the centimetre; the 52's tub
  tender and the P 8's Prussian tender are the generator's four-axle tender.

## Tests

`test/worldTrains.test.ts` holds every new design to its country, to its loading
gauge's width, to the triangle budget and to its published length; the catalog
sweep (`test/catalogSweep.ts`) runs every per-design check on the defaults and a
sampled combination.
