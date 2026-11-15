# China's trains

**Covers** - the twenty Chinese designs of the eight-country plan: the Fuxing CR400AF and CR400BF, the CRH380A, CRH2A, CRH3C (on the Velaro body), CRH5A, the CR200J "Green Giant" and the CRH6A; the HXN5, HXD1, HXD3D, SS1 and SS8, DF4 and DF11; the QJ, SY and JS steam engines; the 25-series coaches; the C70 / P70 wagons. Their kits, figures, deviations and tests.
**Code** - `generator/cnUnits.ts` (`CN_UNITS`), `generator/cnLocos.ts` (`CN_LOCOS`), `generator/seriesHelpers.ts` (`velaro`), `generator/worldSteamLocos.ts`, `generator/worldCoaches.ts`, `generator/worldWagons.ts`, `test/worldTrains.test.ts`, `assets/cr-*/`
**See also** - [shinkansen.md](shinkansen.md) (the series kit, the Shinkansen gauge), [world-locos.md](world-locos.md), [world-steam.md](world-steam.md), [world-coaches.md](world-coaches.md), [world-wagons.md](world-wagons.md), [germany-trains.md](germany-trains.md) (the Velaro)

The catalog had the Hong Kong MTR M-Train (filed under Hong Kong); none of China
Railway's trains. Every design here is filed under China.

## The designs

| id | title | kit | parameters | figures (game) |
|---|---|---|---|---|
| `proc-vehicle-cr-cr400af` | Fuxing CR400AF | series, its own cab face (`generator/cnCr400af.ts`), Shinkansen gauge | `unit`, `cars` 3 - 8, `livery` (`red`, `smart`) | 27.6 m and 25.65 m cars, 209 m for eight; 350 km/h |
| `proc-vehicle-cr-cr400bf` | Fuxing CR400BF | series, Shinkansen gauge | `unit`, `cars` 3 - 8, `livery` (`gold`, `red`) | 350 km/h |
| `proc-vehicle-cr-crh380a` | CRH380A | series, Shinkansen gauge | `unit`, `cars` 3 - 8 | the long nose; 350 km/h |
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

## The CR400AF's body

`generator/cnCr400af.ts`, measured on the line-scan side photograph (a true side view, 22.6 px/m
both ways) and the three-quarter photographs in `assets/cr-cr400af/` (SOURCES.md). The other
Chinese units keep the shared `hsr()` nose.

- **Lengths.** The end car 27.6 m from the nose's tip to its coupling plane, the intermediate cars
  25.65 m: eight cars 209.0 m. Body 4.05 m high, narrowed from 3.36 m to the gauge's 3.27 m.
- **Nose** (a cab face, `CR400AF_FACE`, joining the body 9.4 m behind the tip). The bullet coupler
  cover's round front 1.0 m up, its seam (a dark ring 1.56 m wide) 0.62 m back; the nose rising at
  about 25 degrees to the roof's full height 9 m back. Round in plan low down (full width about
  5 m behind the centre line); over it a broad, gently bowed top under the gunmetal visor.
- **Visor.** Gunmetal from a U across the face 1.95 m up over the windscreen and back over the cab
  to a point on the roof 8.4 m back, edged in red on the `red` livery; China Railway's orange emblem
  ahead of the windscreen. The windscreen one rounded pane 1.64 m wide, 2.36 - 3.0 m up.
- **Lamps and cab side window.** The headlamp a long pointed lens 2.9 - 5.6 m back over the
  dragon's arm; the cab side window a dark sliver from 4.0 m back, its head rising to 3.33 m.
- **Livery (`red`).** Silver; the black window band 1.85 - 2.88 m over a white line and the red
  stripe 1.64 - 1.77 m, both falling toward the nose, the band ending in a point 3.85 m back; the red
  "dragon" from its point on the nose's cheek (1.55 m back, 1.17 m up) up along the band's front to
  its tip 6.9 m back. "CR" on the band near the end car's inner end; the number CR400AF-2146.
- **Livery (`smart`, "Smart Fuxing").** The CR400AF-C-2214's: the same band and stripe, no dragon;
  a red, orange and yellow ribbon along the visor's edge from the U, leaving it to run back over the
  band (2.93 - 3.24 m) along the whole end car. The intermediate cars carry only the band and stripe
  (the real ribbon dips under the band on the second car); the C's door near the cab is not drawn.
- **Sides.** The end car's one door 12.37 - 13.37 m behind the tip; panes 9.95 - 11.3 m and four from
  15.6 m, 2.0 m apart; a destination display over the band at 15.45 m. An intermediate car's doors
  at both ends, nine panes 1.96 m apart from 5.15 m, a display at each end. Plug doors with a narrow,
  round-headed window. Bogies 5.35 m behind the tip and 18.15 m apart on the end car, 17.85 m on the
  others; single-arm pantographs on the third and sixth cars (the kit's rule).
- **Not drawn.** The business saloon's panes in the band on the nose (painted black), the Chinese "Fuxing Hao"
  lettering, the roof's small fittings.
