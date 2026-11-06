# India's trains

**Covers** - the twenty Indian designs of the eight-country plan: the Vande Bharat, the Namo Bharat (RRTS), the Mumbai suburban EMU and the MEMU, the Delhi Metro RS1; the WDM-2, WDP-4D and WDG-4G diesels; the WAM-4, WAP-4, WAP-7 / WAG-9, WAP-5 and WAG-12B electrics; the WP, WG, Fairy Queen and Darjeeling B class steam engines; the LHB and ICF coaches; the BOXN / BCNA wagons. Their kits, figures, deviations and tests.
**Code** - `generator/inUnits.ts` (`IN_UNITS`), `generator/inLocos.ts` (`IN_LOCOS`), `generator/worldSteamLocos.ts`, `generator/worldCoaches.ts`, `generator/worldWagons.ts`, `test/worldTrains.test.ts`, `assets/ir-*/`, `assets/eir-fairy-queen/`, `assets/dhr-b-class/`, `assets/ncrtc-namo-bharat/`, `assets/dmrc-rs1/`
**See also** - [us-diesels.md](us-diesels.md) (the hood specs the diesels ride on), [world-locos.md](world-locos.md), [world-steam.md](world-steam.md), [world-coaches.md](world-coaches.md), [world-wagons.md](world-wagons.md), [loading-gauge.md](loading-gauge.md)

The catalog had no Indian train before. Every design is filed under India.

## The designs

| id | title | kit | parameters | figures (game) |
|---|---|---|---|---|
| `proc-vehicle-ir-vande-bharat` | Vande Bharat | series | `unit`, `cars` 4 - 8, `livery` (`whiteBlue`, `saffron`) | 23 m cars; 180 km/h |
| `proc-vehicle-ncrtc-namo-bharat` | Namo Bharat | series | `unit`, `cars` 3 - 6 | 180 km/h |
| `proc-vehicle-ir-mumbai-emu` | Mumbai suburban EMU | series, flat cab | `unit`, `cars` 3 - 6, `livery` (`std`, `alt`) | three wide doors a side; 100 km/h |
| `proc-vehicle-ir-memu` | IR MEMU | series, flat cab | `unit`, `cars` 4 - 8, `livery` (`std`, `alt`) | 110 km/h |
| `proc-vehicle-dmrc-rs1` | Delhi Metro RS1 | series, cab face | `unit`, `cars` 4 - 8 | standard gauge, four doors a side; 80 km/h |
| `proc-vehicle-ir-wdm2` | IR WDM-2 | hood unit, the GP9's body on six-wheel trucks | `livery` (`maroon`, `blue`) | Co-Co, 1,940 kW, 120 km/h |
| `proc-vehicle-ir-wdp4d` | IR WDP-4D | hood unit, the SD70ACe's body | - | 3,300 kW, 160 km/h |
| `proc-vehicle-ir-wdg4g` | IR WDG-4G | hood unit, the ES44AC's body | - | 3,400 kW, 100 km/h |
| `proc-vehicle-ir-wam4` | IR WAM-4 | box locomotive, flat | `livery` (`blue`, `maroon`) | Co-Co, 18.79 m, 2,700 kW |
| `proc-vehicle-ir-wap4` | IR WAP-4 | box locomotive, raked | `livery` (`rajdhani`, `shatabdi`) | Co-Co, 18.79 m, 3,800 kW, 140 km/h |
| `proc-vehicle-ir-wap7` | IR WAP-7 / WAG-9 | box locomotive, raked | `livery` (`redWhite`, `blue`, `wag9`) | Co-Co, 20.56 m, 4,500 kW |
| `proc-vehicle-ir-wap5` | IR WAP-5 | box locomotive, streamlined | `livery` (`whiteRed`, `gatimaan`) | Bo-Bo, 18.16 m, 4,000 kW, 160 km/h |
| `proc-vehicle-ir-wag12b` | IR WAG-12B | box locomotive, the Prima body | - | 35.0 m, eight axles, 9,000 kW |
| `proc-vehicle-ir-wp` | IR WP | steam | `unit`, `livery` (`black`, `greenYellow`) | 4-6-2, 1.7 m drivers |
| `proc-vehicle-ir-wg` | IR WG | steam | `unit` | 2-8-2, 1.56 m drivers |
| `proc-vehicle-eir-fairy-queen` | Fairy Queen | steam, no valve gear | `unit` | 2-2-2 of 1855 |
| `proc-vehicle-dhr-b-class` | DHR B class | steam, 610 mm gauge | `unit` | 0-4-0, 0.66 m drivers |
| `proc-vehicle-ir-lhb-coach` | IR LHB coach | coach, knuckle couplers | `unit` (`ac3`, `chairCar`), `livery` (`rajdhani`, `shatabdi`, `humsafar`, `tejas`) | 24.0 m; 160 km/h |
| `proc-vehicle-ir-icf-coach` | IR ICF coach | coach | `unit` (`sleeper`, `general`), `livery` (`blue`, `maroon`) | 22.3 m; 110 km/h |
| `proc-vehicle-ir-boxn-wagon` | IR BOXN / BCNA wagon | wagon | `unit` (`open`, `covered`) | 10.71 m and 15.43 m |

## Deviations

- **Delhi Metro RS1.** The cab is a cab face (the series kit's `cabFace`): flat and raked back over
  the windscreens, its corners rounded, the black glazed field across its top with the two
  windscreens and the emergency door's light, the door's outline below, the red stripe carried
  across, the lamps low at the corners. No free photograph of the front was found
  (`assets/dmrc-rs1/SOURCES.md`): the face follows the type's layout, not measurements. The body
  is the photographed stainless steel with the red stripe under the windows.

- **Broad gauge.** The 1,676 mm stock keeps its bodies (up to 3.25 m wide; the EMUs'
  3.66 m narrowed) on the 3.3 m gauge and the game's standard-gauge wheelsets.
- **Diesels.** The WDM-2, WDP-4D and WDG-4G are drawn on their American relatives'
  bodies (GP9 re-trucked, SD70ACe, ES44AC) in IR paint; the WDP-4D's second cab is left out.
- **WAG-12B.** One 35 m body on eight axles; its two sections' joint is not drawn.
- **WP.** The bullet-nosed smokebox front is the generator's plain one.
- **DHR B class.** The saddle-tank engine is drawn with the generator's small tender.

## Tests

`test/worldTrains.test.ts` and, for each module's first design, the catalog sweep.
