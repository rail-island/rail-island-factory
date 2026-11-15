# India's trains

**Covers** - the twenty Indian designs of the eight-country plan: the Vande Bharat, the Namo Bharat (RRTS), the Mumbai suburban EMU and the MEMU, the Delhi Metro RS1; the WDM-2, WDP-4D and WDG-4G diesels; the WAM-4, WAP-4, WAP-7 / WAG-9, WAP-5 and WAG-12B electrics; the WP, WG, Fairy Queen and Darjeeling B class steam engines; the LHB and ICF coaches; the BOXN / BCNA wagons. Their kits, figures, deviations and tests.
**Code** - `generator/inUnits.ts` (`IN_UNITS`), `generator/inLocos.ts` (`IN_LOCOS`), `generator/inWag12b.ts`,  `generator/inWap4.ts`,  `generator/inDelhiMetro.ts`,  `generator/inWdm2.ts`, `generator/inWap7.ts`, `generator/inWap5.ts`, `generator/worldSteamLocos.ts`, `generator/worldCoaches.ts`, `generator/worldWagons.ts`, `test/worldTrains.test.ts`, `assets/ir-*/`, `assets/eir-fairy-queen/`, `assets/dhr-b-class/`, `assets/ncrtc-namo-bharat/`, `assets/dmrc-rs1/`
**See also** - [us-diesels.md](us-diesels.md) (the hood specs the diesels ride on), [world-locos.md](world-locos.md), [world-steam.md](world-steam.md), [world-coaches.md](world-coaches.md), [world-wagons.md](world-wagons.md), [loading-gauge.md](loading-gauge.md)

The catalog had no Indian train before. Every design is filed under India.

## The designs

| id | title | kit | parameters | figures (game) |
|---|---|---|---|---|
| `proc-vehicle-ir-vande-bharat` | Vande Bharat | series, cab face (`inVandeBharat.ts`) | `unit`, `cars` 4, 8, `livery` (`whiteBlue`, `saffron`) | 23 m cars, 3.24 m wide; 180 km/h |
| `proc-vehicle-ncrtc-namo-bharat` | Namo Bharat | series, cab face (`inNamoBharat.ts`) | `unit`, `cars` 3 - 6 | 22.5 m end and 22.0 m cars, 3.2 m wide, three doors a side; 180 km/h |
| `proc-vehicle-ir-mumbai-emu` | Mumbai suburban EMU | series, cab face (`generator/inMumbaiEmu.ts`) | `unit`, `cars` 3 - 6, `livery` (`std`, `alt`) | 20.75 m cars, four wide doorways a side; 100 km/h |
| `proc-vehicle-ir-memu` | IR MEMU | series, flat cab | `unit`, `cars` 4 - 8, `livery` (`std`, `alt`) | 110 km/h |
| `proc-vehicle-dmrc-rs1` | Delhi Metro RS1 | series, cab face | `unit`, `cars` 4 - 8 | broad gauge; 21.84 / 21.34 m cars, 3.2 m wide, four double doors a side; 80 km/h |
| `proc-vehicle-ir-wdm2` | IR WDM-2 | own builder (`inWdm2.ts`) on the hood kit's sweeps | `livery` (`maroon`, `blue`) | Co-Co, 17.12 m, 1,940 kW, 120 km/h |
| `proc-vehicle-ir-wdp4d` | IR WDP-4D | hood unit, the SD70ACe's body | - | 3,300 kW, 160 km/h |
| `proc-vehicle-ir-wdg4g` | IR WDG-4G | own module (`inWdg4g.ts`), twin cab | - | Co-Co, 22.57 m, 3,400 kW, 100 km/h |
| `proc-vehicle-ir-wam4` | IR WAM-4 | box locomotive, flat | `livery` (`blue`, `maroon`) | Co-Co, 18.79 m, 2,700 kW |
| `proc-vehicle-ir-wap4` | IR WAP-4 | box locomotive kit, its own tables (`inWap4.ts`) | `livery` (`rajdhani`, `shatabdi`) | Co-Co, 18.79 m, 3.18 m wide, bogie centres 11.0 m, 3,800 kW, 140 km/h |
| `proc-vehicle-ir-wap7` | IR WAP-7 / WAG-9 | box locomotive kit, its own tables (`inWap7.ts`) | `livery` (`redWhite`, `blue`, `wag9`) | Co-Co, 20.56 m, 3.15 m wide, bogie centres 11.5 m, 4,500 kW |
| `proc-vehicle-ir-wap5` | IR WAP-5 | own asymmetric body (`generator/inWap5.ts`): aerodynamic cab 1, flat cab 2 | `livery` (`whiteRed`, `gatimaan`) | Bo-Bo, 18.16 m, 3.14 m wide, bogies 10.2 m apart, 4,000 kW, 160 km/h |
| `proc-vehicle-ir-wag12b` | IR WAG-12B | its own (inWag12b.ts) on the Czech electric kit's pieces, two articulated sections | - | 38.4 m over couplers, eight axles, 9,000 kW |
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
- **Delhi Metro RS1** (`generator/inDelhiMetro.ts`, re-exported by `inUnits.ts`). Measured on three
  photographs (`assets/dmrc-rs1/SOURCES.md`): the grey face nearly upright, its corners and top
  rounded, the emergency door in the middle with the DMRC emblem and the line number, a tall black
  field either side holding the windscreen, the destination display and the red lamp housing; the
  bumper band under the door, the coupler below. The sides follow the Red Line photograph: four
  1.8 m double doors with a window in each leaf, a wide window between them, a narrow one at each
  car end, the red stripe at 1.6 - 1.74 m, two air conditioners on every roof. The front photographs
  show Blue and Yellow Line units (the same face); which cars carry the pantograph is not
  photographed (the motor cars next to the driving trailers are assumed). The real stock is broad
  gauge (1,676 mm), drawn like the IR stock below.
- **Mumbai suburban EMU.** Measured from five photographs of the Siemens and Medha rakes
  (`assets/ir-mumbai-emu/SOURCES.md`): its own spec in `generator/inMumbaiEmu.ts` with a cab face -
  upright to the headlamps, raked back 0.34 m to the windscreens' head - two equal windscreens, the
  twin headlamps in black housings, the twin roof lamp, horns, the driver's roof unit, buffers and a
  cattle guard; four doorways 1.25 m wide at a 4.75 m pitch on every car (the photographs show four,
  not three), barred windows in pairs between them, the crew door behind the face, ICF bogies 14.6 m
  apart and a single arm on the car next to the cab car. The doorways stand open in service: their
  leaves are painted the dark doorway with a grab pole (`std`), because a model's doors rest shut
  (docs/models/doors.md); the Medha's (`alt`) are its closed magenta leaves. `std` is the Siemens
  rakes' silver with the lavender band sweeping down to the yellow face, `alt` Western Railway's
  Medha white and magenta; the Medha's own face (smaller windscreens, lamps at the band's ends,
  destination windows) is drawn with the Siemens face.


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
- **WAP-4.** Drawn on the box locomotive kit from its own profile tables and items
  (`generator/inWap4.ts`), measured on the photographs of `assets/ir-wap4/` (SOURCES.md): the face
  upright to the lamps and leaning 0.3 m back to the windscreens' head, its corners rounded 0.3 m
  back, the cab roof rounding back to 0.75 m; two windscreens behind stone guards, the twin
  headlight pod and horns on the face's top, white-over-red marker lamps in dark housings, the
  shed emblem between the yellow lightning bolts, the flag, the hoses, the beam lip and the mesh
  plough; eleven bays of small rounded windows over louvres a side, the cab door near each end (a
  small window ahead of it at one end, the other side point-symmetric - not checked against a
  photograph), the grey roof cants over the machine room with the cabs' sides rising to the cab
  roof, two single-arm pantographs 4.2 m from the middle with the roof line on post insulators.
  `rajdhani` is the red body with the yellow waist stripe (Arakkonam 22829); `shatabdi` is
  Arakkonam's dark blue with the pale yellow upper part (22726, photographed only at the face: the
  sides follow the face's boundary at 2.95 m). The bogies are hidden in the side photograph:
  centres 11.0 m and axles 1.9 m apart are estimates. The room windows are glass laid on the skin
  and the side and front numbers painted; "WAP-4", the shed letters and "INDIAN RAILWAYS" are not
  drawn; the distant model leaves out the roof hatches to keep the stripe.
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
- **WDG-4G.** Drawn by its own module (`generator/inWdg4g.ts`) from photographs (`assets/ir-wdg4g/`):
  two full-width box cabs (2.45 m) with raked, mesh-guarded windscreens and a horn box, the
  narrow hood between them (louvres behind cab 2, the raised engine room and dynamic brake,
  three radiator intakes ahead of cab 1), side buffers and a centre buffer coupler, the red and
  orange diagonal stripes (mirror-symmetric) and the faces' orange lower corners. The livery key
  `redGrey` is the earlier drawing's (saved maps store it); its title is now "Red, orange". The trucks
  have their own deep side frames with journal boxes and coil springs; the cab roofs stand 0.2 m over the hood.
  Bogie centres 13.8 m (13.4 m on the side photograph, 14.48 m published); the Devanagari
  lettering of the right side is not drawn, the left side's "Indian Railways" is in capitals.
- **WAG-12B.** One 35 m body on eight axles; its two sections' joint is not drawn.
- **WAP-5.** Drawn as the later CLW units run (30164): the aerodynamic cab 1 at +x (the lower nose bulging 0.25 m ahead of the headstock and rounded in plan, windscreens raked about 50 degrees behind wire guards, a raked cab side window) and the flat cab 2 at -x, both over an open-bar cowcatcher; the ABB and early CLW units with two flat cabs are not drawn. One machine-room window a side, diagonally opposite; side positions follow the 2.434 m cab length, not a side-on photograph (none is free). The Gatimaan scheme (30086) has no free photograph: the white-red stripes in blue with a yellow line. Lettering (WAP5, Bharatiya Rail, the shed) and the centre buffer coupler are left out; the distant model merges the two stripes. References: `assets/ir-wap5/SOURCES.md`.
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
