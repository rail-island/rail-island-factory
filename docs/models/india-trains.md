# India's trains

**Covers** - the twenty Indian designs of the eight-country plan: the Vande Bharat, the Namo Bharat (RRTS), the Mumbai suburban EMU and the MEMU, the Delhi Metro RS1; the WDM-2, WDP-4D and WDG-4G diesels; the WAM-4, WAP-4, WAP-7 / WAG-9, WAP-5 and WAG-12B electrics; the WP, WG, Fairy Queen and Darjeeling B class steam engines; the LHB and ICF coaches; the BOXN / BCNA wagons. Their kits, figures, deviations and tests.
**Code** - `generator/inUnits.ts` (`IN_UNITS`), `generator/inLocos.ts` (`IN_LOCOS`), `generator/inWdm2.ts`, `generator/inWap7.ts`, `generator/inWap5.ts`, `generator/worldSteamLocos.ts`, `generator/worldCoaches.ts`, `generator/worldWagons.ts`, `test/worldTrains.test.ts`, `assets/ir-*/`, `assets/eir-fairy-queen/`, `assets/dhr-b-class/`, `assets/ncrtc-namo-bharat/`, `assets/dmrc-rs1/`
**See also** - [us-diesels.md](us-diesels.md) (the hood specs the diesels ride on), [world-locos.md](world-locos.md), [world-steam.md](world-steam.md), [world-coaches.md](world-coaches.md), [world-wagons.md](world-wagons.md), [loading-gauge.md](loading-gauge.md)

The catalog had no Indian train before. Every design is filed under India.

## The designs

| id | title | kit | parameters | figures (game) |
|---|---|---|---|---|
| `proc-vehicle-ir-vande-bharat` | Vande Bharat | series, cab face (`inVandeBharat.ts`) | `unit`, `cars` 4, 8, `livery` (`whiteBlue`, `saffron`) | 23 m cars, 3.24 m wide; 180 km/h |
| `proc-vehicle-ncrtc-namo-bharat` | Namo Bharat | series, cab face (`inNamoBharat.ts`) | `unit`, `cars` 3 - 6 | 22.5 m end and 22.0 m cars, 3.2 m wide, three doors a side; 180 km/h |
| `proc-vehicle-ir-mumbai-emu` | Mumbai suburban EMU | series, flat cab | `unit`, `cars` 3 - 6, `livery` (`std`, `alt`) | three wide doors a side; 100 km/h |
| `proc-vehicle-ir-memu` | IR MEMU | series, flat cab | `unit`, `cars` 4 - 8, `livery` (`std`, `alt`) | 110 km/h |
| `proc-vehicle-dmrc-rs1` | Delhi Metro RS1 | series, cab face | `unit`, `cars` 4 - 8 | standard gauge, four doors a side; 80 km/h |
| `proc-vehicle-ir-wdm2` | IR WDM-2 | own builder (`inWdm2.ts`) on the hood kit's sweeps | `livery` (`maroon`, `blue`) | Co-Co, 17.12 m, 1,940 kW, 120 km/h |
| `proc-vehicle-ir-wdp4d` | IR WDP-4D | hood unit, the SD70ACe's body | - | 3,300 kW, 160 km/h |
| `proc-vehicle-ir-wdg4g` | IR WDG-4G | hood unit, the ES44AC's body | - | 3,400 kW, 100 km/h |
| `proc-vehicle-ir-wam4` | IR WAM-4 | box locomotive, flat | `livery` (`blue`, `maroon`) | Co-Co, 18.79 m, 2,700 kW |
| `proc-vehicle-ir-wap4` | IR WAP-4 | box locomotive, raked | `livery` (`rajdhani`, `shatabdi`) | Co-Co, 18.79 m, 3,800 kW, 140 km/h |
| `proc-vehicle-ir-wap7` | IR WAP-7 / WAG-9 | box locomotive kit, its own tables (`inWap7.ts`) | `livery` (`redWhite`, `blue`, `wag9`) | Co-Co, 20.56 m, 3.15 m wide, bogie centres 11.5 m, 4,500 kW |
| `proc-vehicle-ir-wap5` | IR WAP-5 | own asymmetric body (`generator/inWap5.ts`): aerodynamic cab 1, flat cab 2 | `livery` (`whiteRed`, `gatimaan`) | Bo-Bo, 18.16 m, 3.14 m wide, bogies 10.2 m apart, 4,000 kW, 160 km/h |
| `proc-vehicle-ir-wag12b` | IR WAG-12B | box locomotive, the Prima body | - | 35.0 m, eight axles, 9,000 kW |
| `proc-vehicle-ir-wp` | IR WP | steam | `unit`, `livery` (`black`, `greenYellow`) | 4-6-2, 1.702 m drivers, bullet nose; 13.75 + 9.85 m (`generator/inWp.ts`) |
| `proc-vehicle-ir-wg` | IR WG | steam | `unit` | 2-8-2, 1.56 m drivers |
| `proc-vehicle-eir-fairy-queen` | Fairy Queen | steam, no valve gear | `unit` | 2-2-2 of 1855 |
| `proc-vehicle-dhr-b-class` | DHR B class | steam, 610 mm gauge | `unit` | 0-4-0, 0.66 m drivers |
| `proc-vehicle-ir-lhb-coach` | IR LHB coach | coach (`generator/inLhbCoach.ts`), knuckle couplers | `unit` (`ac3`, `chairCar`), `livery` (`rajdhani`, `shatabdi`, `humsafar`, `tejas`) | 23.54 m body, 24.0 m over couplers, 3.24 m wide; 160 km/h |
| `proc-vehicle-ir-icf-coach` | IR ICF coach | coach | `unit` (`sleeper`, `general`), `livery` (`blue`, `maroon`) | 22.3 m; 110 km/h |
| `proc-vehicle-ir-boxn-wagon` | IR BOXN / BCNA wagon | wagon | `unit` (`open`, `covered`) | 10.71 m and 15.43 m |

## Deviations

- **Vande Bharat.** The end car's cab is a cab face (`generator/inVandeBharat.ts`) measured from the
  photographs in `assets/ir-vande-bharat/`: the bulbous coupler cover (about 45 % of the face over the
  skirt) with its centre seam, the emblem plate, long slanted lamp slots along the cover's edges (tail
  and head lamp), the windscreen raked about 64 degrees in a black surround, the display in a narrower
  black band over it, the dome lamp; the blue (or saffron) swoosh up the corners into the roof band,
  also on the distant model's face (`lodPaint`; dropped from the 8-car train's 500 triangles); the
  dark skirt under the cover, curving with it. Plug doors at both ends of every car, the crew door, big
  panes; pantographs on the third and third-from-last cars (the transformer trailers). The nose's lengths
  come from a slightly oblique photo (about 10 % uncertain); the IR roundel is a plain two-colour disc.
- **Namo Bharat.** Its own module, `generator/inNamoBharat.ts`, the cab a cab face read from three
  front three-quarter photographs (`assets/ncrtc-namo-bharat/SOURCES.md`): the rounded bumper standing
  out at the bottom with the NCRTC lettering, the black windscreen from the lamps at 2.2 m to the crown,
  narrowing upward, the round headlights in black pockets at its lower corners, the amber destination
  display; the plan tapers in deep elliptic corners. Silver body, the windows in a dark band over a thin
  red line, the red triangle on each cab side from the crew door down to a point behind the lamps
  (`test/namoBharat.test.ts`). No free side-on photograph exists (the NCRTC/PIB ones are GODL-India):
  the nose length (4.3 m) and window heights are estimated, every car has three doors a side (the
  premium car's two are not drawn), the pantograph's car follows the kit's rule, the roof equipment
  is not drawn and the distant model leaves the red triangle out.
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
- **WAP-7 / WAG-9.** Drawn on the box locomotive kit from its own profile tables and items
  (`generator/inWap7.ts`), measured on the photographs of `assets/ir-wap7/` (SOURCES.md): the
  face leaning 0.4 m back to the windscreens' head under a hipped cab roof, two windscreens behind
  stone guards with a centre pillar, the twin headlamp and the white-over-red marker lamps on the
  waist stripe inside the lamp handrail, the headlight pod and horns on the cab roof, the open-bar
  plough, one large cab side window ahead of the door, the louvre panels and the painted
  "INDIAN RAILWAYS" of the photographed side (the other side drawn point-symmetric - not checked
  against a photograph), single-arm pantographs about 4.8 m from the middle with the roof bar, the
  body colour down to the dark frame. `redWhite` is the white body with the red stripe of the
  photographs; `blue` and `wag9` keep the earlier dark blue / brown bodies with a cream / yellow
  stripe and lettering on the same layout (no photograph of them was found; the WAG-9's green
  scheme is not drawn, and the WAG-9 is otherwise the same body). The front number is a plate,
  not painted.
- **WAG-12B.** One 35 m body on eight axles; its two sections' joint is not drawn.
- **WAP-5.** Drawn as the later CLW units run (30164): the aerodynamic cab 1 at +x (the lower nose bulging 0.25 m ahead of the headstock and rounded in plan, windscreens raked about 50 degrees behind wire guards, a raked cab side window) and the flat cab 2 at -x, both over an open-bar cowcatcher; the ABB and early CLW units with two flat cabs are not drawn. One machine-room window a side, diagonally opposite; side positions follow the 2.434 m cab length, not a side-on photograph (none is free). The Gatimaan scheme (30086) has no free photograph: the white-red stripes in blue with a yellow line. Lettering (WAP5, Bharatiya Rail, the shed) and the centre buffer coupler are left out; the distant model merges the two stripes. References: `assets/ir-wap5/SOURCES.md`.
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
