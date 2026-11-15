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
| `proc-vehicle-cr-crh380a` | CRH380A | series, Shinkansen gauge | `unit`, `cars` 3 - 8 | the long nose; 350 km/h |
| `proc-vehicle-cr-crh2a` | CRH2A | series, Shinkansen gauge | `unit`, `cars` 3 - 8 | the E2-derived nose; 250 km/h |
| `proc-vehicle-cr-crh3c` | CRH3C | series, Velaro body | `unit`, `cars` 3 - 8 | 350 km/h |
| `proc-vehicle-cr-crh5a` | CRH5A | series, its own cab face (`cnCrh5a.ts`), Shinkansen gauge | `unit`, `cars` 3 - 8 | the Pendolino snout; 27.6 / 25.0 m, 3.2 m wide; 250 km/h |
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

## The CRH5A's body

`generator/cnCrh5a.ts`, measured from the photographs in `assets/cr-crh5a/` (SOURCES.md) and the
published figures: end car 27.6 m and intermediate cars 25.0 m over the couplers, 3.2 m wide (inside
the Shinkansen gauge as it is), the crown 4.05 m and the roof hoods 4.27 m up.

- **Section.** The Pendolino's wide body: widest 1.55 m up, the sides leaning in to 0.9 of the half width
  at the 3.2 m shoulder, the white skirt panels (faint light-grey slats between the bogies) tucked in below
  1.15 m down to 0.4 m; the nose's flanks white to the bottom edge.
- **Snout** (a cab face, `CRH5A_FACE`, 7.0 m long): upright from the spoiler to 1.5 m, 0.5 m behind the
  tip, rounding over to the canopy's foot (2.1 m up, 1.3 m back), the glass leaning back at about 25
  degrees to the crown 6.4 m back; in plan one elliptic corner over the whole half width, reaching full
  width 2.6 m back low down and further back over the canopy. The **coupler cover** is half an ellipsoid
  (1.52 m wide, 1.04 m tall, centred 0.93 m up: its foot at the body's bottom, its top at the lamps') standing
  0.48 m forward of the face, its joint a thin grey seam,
  a slot for the coupler on its foot (`coverDome`, drawn with the end car's fittings).
- **Paint on the face**: one dark glass canopy from its foot over the cab roof (its lower edge nearly
  level across the face, then rising along the sides to the crown 6.5 m back), a black rim round it, the
  windscreen proper a lighter pane in its front (2.26 - 2.78 m) with two wipers; the
  "eye" cab side window, a tear 4.0 - 6.3 m back slanting down to the front; two lamp lozenges under the
  canopy's lower corners, rising to the outside (black housing, clear lens, a head and a tail lamp);
  the face is white all round, also below the skirts' top.
- **Livery** `crh`: white, the blue band 1.82 - 1.94 m just under the windows, dipping and thinning to a
  point 3.0 m behind the tip, 1.66 m up; "CRH" ahead of the first door; number CRH5A-5043 (photographed).
- **Sides**: single plug doors 0.85 m wide with a narrow window, one at each end of every car (the end
  car's first 7.35 m behind the tip); windows 1.2 m by 0.76 m (1.98 - 2.74 m), about 1.9 m apart, with a
  narrow pane by the first door: seven on the end car, eight on an intermediate car, whose rear 4.5 m are
  blank (toilets) but for a small square window by each door.
- **Running gear and roof**: bogies 19.0 m apart, 2.7 m wheelbase, 0.89 m wheels, the end car's leading
  one 5.6 m behind the tip; an air-conditioning hood with side grilles near one end of every car; a
  single-arm pantograph on the intermediate (Tp) cars, 17 m behind the car's front, raised on the third car
  and the third from last (the kit's rule, as the Mc M Tp M T Tp M Mc formation).
- **Still differs**: the eight cars come to 205.1 m (the published car lengths), not the quoted 211.5 m;
  the 和谐号 lettering is left out; the distant model's snout is a plain rounded wedge.

