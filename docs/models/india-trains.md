# India's trains

**Covers** - the twenty Indian designs of the eight-country plan: the Vande Bharat, the Namo Bharat (RRTS), the Mumbai suburban EMU and the MEMU, the Delhi Metro RS1; the WDM-2, WDP-4D and WDG-4G diesels; the WAM-4, WAP-4, WAP-7 / WAG-9, WAP-5 and WAG-12B electrics; the WP, WG, Fairy Queen and Darjeeling B class steam engines; the LHB and ICF coaches; the BOXN / BCNA wagons. Their kits, figures, deviations and tests.
**Code** - `generator/inUnits.ts` (`IN_UNITS`), `generator/inLocos.ts` (`IN_LOCOS`), `generator/inWdm2.ts`, `generator/inWag12b.ts`, `generator/worldSteamLocos.ts`, `generator/worldCoaches.ts`, `generator/worldWagons.ts`, `test/worldTrains.test.ts`, `assets/ir-*/`, `assets/eir-fairy-queen/`, `assets/dhr-b-class/`, `assets/ncrtc-namo-bharat/`, `assets/dmrc-rs1/`
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
| `proc-vehicle-ir-wdm2` | IR WDM-2 | own builder (`inWdm2.ts`) on the hood kit's sweeps | `livery` (`maroon`, `blue`) | Co-Co, 17.12 m, 1,940 kW, 120 km/h |
| `proc-vehicle-ir-wdp4d` | IR WDP-4D | hood unit, the SD70ACe's body | - | 3,300 kW, 160 km/h |
| `proc-vehicle-ir-wdg4g` | IR WDG-4G | hood unit, the ES44AC's body | - | 3,400 kW, 100 km/h |
| `proc-vehicle-ir-wam4` | IR WAM-4 | box locomotive, flat | `livery` (`blue`, `maroon`) | Co-Co, 18.79 m, 2,700 kW |
| `proc-vehicle-ir-wap4` | IR WAP-4 | box locomotive, raked | `livery` (`rajdhani`, `shatabdi`) | Co-Co, 18.79 m, 3,800 kW, 140 km/h |
| `proc-vehicle-ir-wap7` | IR WAP-7 / WAG-9 | box locomotive, raked | `livery` (`redWhite`, `blue`, `wag9`) | Co-Co, 20.56 m, 4,500 kW |
| `proc-vehicle-ir-wap5` | IR WAP-5 | box locomotive, streamlined | `livery` (`whiteRed`, `gatimaan`) | Bo-Bo, 18.16 m, 4,000 kW, 160 km/h |
| `proc-vehicle-ir-wag12b` | IR WAG-12B | its own (inWag12b.ts) on the Czech electric kit's pieces, two articulated sections | - | 38.4 m over couplers, eight axles, 9,000 kW |
| `proc-vehicle-ir-wp` | IR WP | steam | `unit`, `livery` (`black`, `greenYellow`) | 4-6-2, 1.702 m drivers, bullet nose; 13.75 + 9.85 m (`generator/inWp.ts`) |
| `proc-vehicle-ir-wg` | IR WG | steam | `unit` | 2-8-2, 1.56 m drivers |
| `proc-vehicle-eir-fairy-queen` | Fairy Queen | steam, no valve gear | `unit` | 2-2-2 of 1855 |
| `proc-vehicle-dhr-b-class` | DHR B class | steam, 610 mm gauge | `unit` | 0-4-0, 0.66 m drivers |
| `proc-vehicle-ir-lhb-coach` | IR LHB coach | coach (`generator/inLhbCoach.ts`), knuckle couplers | `unit` (`ac3`, `chairCar`), `livery` (`rajdhani`, `shatabdi`, `humsafar`, `tejas`) | 23.54 m body, 24.0 m over couplers, 3.24 m wide; 160 km/h |
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
- **Diesels.** The WDP-4D and WDG-4G are drawn on their American relatives'
  bodies (SD70ACe, ES44AC) in IR paint; the WDP-4D's second cab is left out.
- **WDM-2.** Drawn on its own from photographs (`generator/inWdm2.ts`, `assets/ir-wdm2/`):
  17.12 m over the buffers, the high short hood (1.9 m wide, 1.4 m long) narrower than the
  full-width cab with a door each side of it, the long hood with the dynamic brake vents, the
  exhaust and the radiator grilles, side buffers, screw couplings and bar cattle guards, and
  the ALCO asymmetric trimount trucks (axles 1.88 m and 2.15 m apart, 12.834 m between the
  outer ones). No exactly side-on photograph was found, so the lengths come from a
  projective fit on a three-quarter view; the sand boxes and the number's lozenge outline
  are not drawn. The `blue` scheme follows a WDM-3A of the same body.
- **WAG-12B** (`generator/inWag12b.ts`, assets/ir-wag12b/). Drawn from photographs of 60051, 60185, 60222 and 60227: two single-cab Bo-Bo sections back to back, each a section of an articulated vehicle (`articulate`, tramKit.ts) hinged at the coupling plane, the 1.0 m gap between the flat light-blue inner ends covered by the narrow black duct the photographs show, the roof jumper over it; 38.4 m over couplers, 3.2 m wide, bogie pivots 10.2 m per section, wheels 1,250 mm, a single-arm pantograph per section 4.5 m from the joint (the rear section's raised). The cab: the face raked 0.42 m to the windscreens' head, its corners chamfered, the black mask with its vee-shaped lower edge, two guarded windscreens, the light-blue nose block with the twin headlamps, the lamp pods, buffers and centre coupler, the light-blue plough raked back under the buffer beam, the air-conditioning unit with headlamp and horn on the cab roof. Every photographed unit is blue (mid-blue body, light-blue face and chevrons), so the single livery keeps its key `greyRed` but is painted blue and titled "IR blue". The Hindi lettering is drawn as a Devanagari-like headline with stems, not real glyphs; the machine-room roof is one hatch box.
- **WP.** Drawn from its own spec (`generator/inWp.ts`) on the steam kit: the bullet nose with its star and headlamp, the running board's S sweep and the cab are measured from three-quarter photographs (no side-on photo on Commons). The front S is a 0.45 m fender plate under a tread each side, open over the frames, with a bar pilot; 7161 carries its AKBAR board. The tender is a plain high box.
- **DHR B class.** The saddle-tank engine is drawn with the generator's small tender.
- **LHB coach.** Measured on photographs (`assets/ir-lhb-coach/SOURCES.md`; Tejas 3A side fitted
  projectively, 1.87 m window pitch): the 3A has nine 1.2 m by 0.86 m windows (round-cornered) and its louvred toilet window in
  the end panel beyond the door; the chair car eight 1.38 m windows and a shallow toilet window inside
  the door. The grey lower band reaches 1.75 m; the red and blue liveries' end panels are grey below a diagonal from the door's foot to
  the roof; two roof AC packages, sealed gangways, folding steps. Still simplified: the bogies are the
  kit's generic two-axle bogie (not the FIAT frame), the Humsafar's wave graphics are straight bands
  and the Tejas's yellow-to-orange fade is three bands.

## Tests

`test/worldTrains.test.ts` and, for each module's first design, the catalog sweep.
