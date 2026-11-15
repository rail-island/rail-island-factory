# China's trains

**Covers** - the twenty Chinese designs of the eight-country plan: the Fuxing CR400AF and CR400BF, the CRH380A, CRH2A, CRH3C (on the Velaro body), CRH5A, the CR200J "Green Giant" and the CRH6A; the HXN5, HXD1, HXD3D, SS1 and SS8, DF4 and DF11; the QJ, SY and JS steam engines; the 25-series coaches; the C70 / P70 wagons. Their kits, figures, deviations and tests.
**Code** - `generator/cnUnits.ts` (`CN_UNITS`), `generator/cnLocos.ts` (`CN_LOCOS`), `generator/seriesHelpers.ts` (`velaro`), `generator/worldSteamLocos.ts`, `generator/worldCoaches.ts`, `generator/worldWagons.ts`, `test/worldTrains.test.ts`, `assets/cr-*/`
**See also** - [shinkansen.md](shinkansen.md) (the series kit, the Shinkansen gauge), [world-locos.md](world-locos.md), [world-steam.md](world-steam.md), [world-coaches.md](world-coaches.md), [world-wagons.md](world-wagons.md), [germany-trains.md](germany-trains.md) (the Velaro)

The catalog had the Hong Kong MTR M-Train (filed under Hong Kong); none of China
Railway's trains. Every design here is filed under China.

## The designs

| id | title | kit | parameters | figures (game) |
|---|---|---|---|---|
| `proc-vehicle-cr-cr400af` | Fuxing CR400AF | series, Shinkansen gauge | `unit`, `cars` 3 - 8, `livery` (`red`, `smart`) | 350 km/h |
| `proc-vehicle-cr-cr400bf` | Fuxing CR400BF | series, Shinkansen gauge | `unit`, `cars` 3 - 8, `livery` (`gold`, `red`) | 350 km/h |
| `proc-vehicle-cr-crh380a` | CRH380A | series, its own cab face (`generator/cnCrh380a.ts`), Shinkansen gauge | `unit`, `cars` 3 - 8 | the 12 m nose; 26.5 m + 25.0 m cars; 350 km/h |
| `proc-vehicle-cr-crh2a` | CRH2A | series, Shinkansen gauge | `unit`, `cars` 3 - 8 | the E2-derived nose; 250 km/h |
| `proc-vehicle-cr-crh3c` | CRH3C | series, Velaro body | `unit`, `cars` 3 - 8 | 350 km/h |
| `proc-vehicle-cr-crh5a` | CRH5A | series, Shinkansen gauge | `unit`, `cars` 3 - 8 | 250 km/h |
| `proc-vehicle-cr-cr200j` | Fuxing CR200J | series, its power cars' pantographs | `unit`, `cars` 4 - 8, `livery` (`green`, `whiteRed`) | 160 km/h |
| `proc-vehicle-cr-crh6a` | CRH6A | series | `unit`, `cars` 4 - 8 | 200 km/h |
| `proc-vehicle-cr-hxn5` | CR HXN5 | hood unit, the ES44AC's body | - | 4,660 kW, 120 km/h |
| `proc-vehicle-cr-hxd1` | CR HXD1 | box locomotive | - | 35.2 m, eight axles, 9,600 kW |
| `proc-vehicle-cr-hxd3d` | CR HXD3D | box locomotive, raked | - | Co-Co, 20.85 m, 7,200 kW, 160 km/h |
| `proc-vehicle-cr-ss1` | CR SS1 Shaoshan | box locomotive, flat | - | Co-Co, 20.4 m, 3,780 kW |
| `proc-vehicle-cr-ss8` | CR SS8 Shaoshan | box locomotive, streamlined | - | Bo-Bo, 17.5 m, 3,600 kW, 170 km/h |
| `proc-vehicle-cr-df4` | CR DF4 Dongfeng | box locomotive, diesel | `livery` (`orangeWhite`, `green`) | Co-Co, 20.5 m, 1,985 kW |
| `proc-vehicle-cr-df11` | CR DF11 Dongfeng | box locomotive, streamlined, diesel | - | Co-Co, 21.25 m, 3,040 kW, 170 km/h |
| `proc-vehicle-cr-qj` | CR QJ | steam, knuckle couplers | `unit` | 2-10-2, 1.5 m drivers |
| `proc-vehicle-cr-sy` | CR SY | steam, knuckle couplers | `unit` | 2-8-2, 1.37 m drivers |
| `proc-vehicle-cr-js` | CR JS | steam, knuckle couplers | `unit` | 2-8-2, 1.37 m drivers |
| `proc-vehicle-cr-25t-coach` | CR 25-series coach | coach, knuckle couplers | `unit` (`softSleeper`, `hardSeat`), `livery` (`z25t`, `green25b`) | 26.6 m; 160 km/h |
| `proc-vehicle-cr-c70-wagon` | CR C70 / P70 wagon | wagon | `unit` (`open`, `covered`) | 13.98 m and 17.0 m |

## Deviations

- **Width.** The high-speed trains' 3.36 - 3.38 m bodies are narrowed to the Shinkansen
  gauge's 3.3 m, as the Shinkansen are.
- **Couplers.** The box locomotives carry the kit's buffers; China's are automatic couplers.
- **HXD1.** One 35.2 m body on eight axles; its two sections' joint is not drawn.
- **CR200J.** The power cars are the series kit's end cars, with windows.

## Tests

`test/worldTrains.test.ts` (all 160 plan designs) and, for each module's first design,
the catalog sweep.

## The CRH380A's body

`generator/cnCrh380a.ts`, measured on the photographs in `assets/cr-crh380a/` (SOURCES.md) and set
to the published figures: a 26.5 m end car with the 12.0 m nose, 25.0 m intermediate cars, 3.7 m high,
the 3.38 m body drawn 3.26 m wide; 17.5 m bogie centres, 2.5 m wheelbase, 860 mm wheels, the end car's
leading bogie 5.35 m behind the tip.

- **The nose** is a cab face (seriesCab.ts) whose depth is a solid of the module's own (`a380Depth`):
  a silver coupler dome on the tip (a blunt superellipsoid 1.5 m long, 1.7 m wide, 0.4 - 1.6 m high,
  a dark seam round it), the nose flaring out of the dome's widest section and rising in a long line
  (2.1 m 3 m back, 2.5 m at 5.5 m, the roof's 3.7 m at the join), its section the body's scaled and
  rounded over its top. The lower flank is narrow (0.55 m half width below 0.95 m) over the leading
  bogie and flares to the skirt behind it, so the bogie shows under the nose as on the train.
- **The canopy** stands out of the nose's top from 4.2 m behind the tip, 1.7 - 1.9 m wide, its crown
  3.26 m at 7.3 m and merging into the roof at the join. Its black oval holds the windscreen (one wide
  pane with rounded corners, a single wiper) and a side window each side; the black is cut to the
  canopy's own walls where they rise from the nose. The almond headlights lie on the nose beside the
  canopy's foot.
- **The livery** (unit 2670): white, the dark window band 1.97 - 2.95 m holding the windows, the blue
  stripe 1.72 - 1.85 m under a white gap, a light grey skirt. On the end car the band's foot rises
  toward the nose and ends in a rounded point 9.7 m behind the tip; the stripe rises with it to a crest
  9.3 m back and sweeps down the flank to a point 6 m behind the tip. White doors carry the stripe only.
- **Windows and doors**: one window a seat row (0.8 m on a 1.04 m pitch). The end car has its door
  only at the front, 14.0 m behind the tip, two sightseeing windows in the band's point ahead of it with
  the "CRH" mark, and ten windows behind it; the intermediate car has one door, at its rear end, and
  21 windows.
- **Pantographs**: single arms on cars 4 and 6 of eight (in shorter trains the third car from the end
  and the one two ahead of it), only the rear one raised; each stands between four raked side shields
  on the roof's edges.
- **Distant model**: the nose from five rows (dome, rising top, canopy) with the windscreen as glass.

