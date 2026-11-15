# India's trains

**Covers** - the twenty Indian designs of the eight-country plan: the Vande Bharat, the Namo Bharat (RRTS), the Mumbai suburban EMU and the MEMU, the Delhi Metro RS1; the WDM-2, WDP-4D and WDG-4G diesels; the WAM-4, WAP-4, WAP-7 / WAG-9, WAP-5 and WAG-12B electrics; the WP, WG, Fairy Queen and Darjeeling B class steam engines; the LHB and ICF coaches; the BOXN / BCNA wagons. Their kits, figures, deviations and tests.
**Code** - `generator/inUnits.ts` (`IN_UNITS`), `generator/inLocos.ts` (`IN_LOCOS`), the designs' own modules `generator/in*.ts` (`inVandeBharat`, `inNamoBharat`, `inMumbaiEmu`, `inMemu`, `inDelhiMetro`, `inWdm2`, `inWdp4d`, `inWdg4g`, `inWam4`, `inWap4`, `inWap7`, `inWap5`, `inWag12b`, `inWp`, `inWg`, `inFairyQueen`, `inDhrB`, `inLhbCoach`, `inIcfCoach`, `inBoxnWagon`), `generator/worldSteamLocos.ts`, `generator/worldCoaches.ts`, `generator/worldWagons.ts`, `test/worldTrains.test.ts`, `assets/ir-*/`, `assets/eir-fairy-queen/`, `assets/dhr-b-class/`, `assets/ncrtc-namo-bharat/`, `assets/dmrc-rs1/`
**See also** - [us-diesels.md](us-diesels.md) (the hood kit whose parts the diesels borrow), [world-locos.md](world-locos.md), [world-steam.md](world-steam.md), [world-coaches.md](world-coaches.md), [world-wagons.md](world-wagons.md), [loading-gauge.md](loading-gauge.md)

The catalog had no Indian train before. Every design is filed under India.

## The designs

| id | title | kit | parameters | figures (game) |
|---|---|---|---|---|
| `proc-vehicle-ir-vande-bharat` | Vande Bharat | series, cab face (`inVandeBharat.ts`) | `unit`, `cars` 4, 8, `livery` (`whiteBlue`, `saffron`) | 23 m cars, 3.24 m wide; 180 km/h |
| `proc-vehicle-ncrtc-namo-bharat` | Namo Bharat | series, cab face (`inNamoBharat.ts`) | `unit`, `cars` 3 - 6 | 22.5 m end and 22.0 m cars, 3.2 m wide, three doors a side; 180 km/h |
| `proc-vehicle-ir-mumbai-emu` | Mumbai suburban EMU | series, cab face (`generator/inMumbaiEmu.ts`) | `unit`, `cars` 3 - 6, `livery` (`std`, `alt`) | 20.75 m cars, four wide doorways a side; 100 km/h |
| `proc-vehicle-ir-memu` | IR MEMU | series, cab face (`generator/inMemu.ts`) | `unit`, `cars` 4 - 8, `livery` (`std`, `alt`) | 21.3 m cars, buffers; pantograph on the motor coaches; 110 km/h |
| `proc-vehicle-dmrc-rs1` | Delhi Metro RS1 | series, cab face | `unit`, `cars` 4 - 8 | broad gauge; 21.84 / 21.34 m cars, 3.2 m wide, four double doors a side; 80 km/h |
| `proc-vehicle-ir-wdm2` | IR WDM-2 | own builder (`inWdm2.ts`) on the hood kit's sweeps | `livery` (`maroon`, `blue`) | Co-Co, 17.12 m, 1,940 kW, 120 km/h |
| `proc-vehicle-ir-wdp4d` | IR WDP-4D | own module (`inWdp4d.ts`), twin cab | - | Co-Co, 21.24 m over buffers, 3,300 kW, 135 km/h |
| `proc-vehicle-ir-wdg4g` | IR WDG-4G | own module (`inWdg4g.ts`), twin cab | - | Co-Co, 22.57 m, 3,400 kW, 100 km/h |
| `proc-vehicle-ir-wam4` | IR WAM-4 | box locomotive kit, its own tables (`inWam4.ts`) | `livery` (`blue`, `maroon`) | Co-Co, 18.79 m, 3.18 m wide, bogie centres 10.0 m, 2,700 kW |
| `proc-vehicle-ir-wap4` | IR WAP-4 | box locomotive kit, its own tables (`inWap4.ts`) | `livery` (`rajdhani`, `shatabdi`) | Co-Co, 18.79 m, 3.18 m wide, bogie centres 11.0 m, 3,800 kW, 140 km/h |
| `proc-vehicle-ir-wap7` | IR WAP-7 / WAG-9 | box locomotive kit, its own tables (`inWap7.ts`) | `livery` (`redWhite`, `blue`, `wag9`) | Co-Co, 20.56 m, 3.15 m wide, bogie centres 11.5 m, 4,500 kW |
| `proc-vehicle-ir-wap5` | IR WAP-5 | own asymmetric body (`generator/inWap5.ts`): aerodynamic cab 1, flat cab 2 | `livery` (`whiteRed`, `gatimaan`) | Bo-Bo, 18.16 m, 3.14 m wide, bogies 10.2 m apart, 4,000 kW, 160 km/h |
| `proc-vehicle-ir-wag12b` | IR WAG-12B | its own (inWag12b.ts) on the Czech electric kit's pieces, two articulated sections | - | 38.4 m over couplers, eight axles, 9,000 kW |
| `proc-vehicle-ir-wp` | IR WP | steam | `unit`, `livery` (`black`, `greenYellow`) | 4-6-2, 1.702 m drivers, bullet nose; 13.75 + 9.85 m (`generator/inWp.ts`) |
| `proc-vehicle-ir-wg` | IR WG | steam | `unit` | 2-8-2, 1.562 m drivers; 15.05 + 8.8 m (`generator/inWg.ts`) |
| `proc-vehicle-eir-fairy-queen` | Fairy Queen | steam kit, own parts (`generator/inFairyQueen.ts`) | `unit` | 2-2-2WT of 1855, 1.83 m driver, outside cylinders; 7.7 m + 4.7 m four-wheeled tender |
| `proc-vehicle-dhr-b-class` | DHR B class | steam, 610 mm gauge | `unit` (both the engine) | 0-4-0ST, 0.66 m drivers, 1.68 m wheelbase, 5.75 m over couplers |
| `proc-vehicle-ir-lhb-coach` | IR LHB coach | coach (`generator/inLhbCoach.ts`), knuckle couplers | `unit` (`ac3`, `chairCar`), `livery` (`rajdhani`, `shatabdi`, `humsafar`, `tejas`) | 23.54 m body, 24.0 m over couplers, 3.24 m wide; 160 km/h |
| `proc-vehicle-ir-icf-coach` | IR ICF coach | coach (`generator/inIcfCoach.ts`), side buffers and screw coupling | `unit` (`sleeper`, `general`), `livery` (`blue`, `maroon`) | 21.337 m body, 22.3 m over buffers, 3.21 m wide; 110 km/h |
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


- **MEMU** (`generator/inMemu.ts`, `assets/ir-memu/SOURCES.md`). Its own spec and cab face: the flat
  ICF front rounding into the roof, the twin headlights' housing on the dome, the spot lamp, two
  windscreens behind bar grilles with the destination boxes over them, hood box, flasher, horns, side
  buffers and cattle guard. The blue livery is the Southern Railway's photographed face (red V on the
  blue lower front); the maroon one, of which no photograph was found, is the same scheme in maroon on
  the Northern Railway's face (cream V). The motor coaches at both ends raise a single-arm pantograph
  4 m from their inner ends; the trailers' two doors a side and the motor coach's second door are
  placed by rule, not measured (no side-on photograph of a whole car).

- **Broad gauge.** The 1,676 mm stock keeps its bodies (up to 3.25 m wide; the EMUs'
  3.66 m narrowed) on the 3.3 m gauge and the game's standard-gauge wheelsets.
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
- **WAM-4.** Drawn on the box locomotive kit from its own profile tables and items
  (`generator/inWam4.ts`, `assets/ir-wam4/`): the upright flat face with rounded corners and a
  rounded head into the silver cab roof, two windscreens behind vertical guard bars, the
  headlight pod (twin lamps under a visor) and two horns on the cab roof, the marker lamp boxes,
  jumper cables, the lattice cowcatcher; on the sides the narrow cab window, the cab door, a
  tall louvre, a porthole, a double louvre and a porthole from each end (mirror-symmetric); two
  single-arm pantographs (the units' Faiveley type, not diamonds) with resistor boxes inboard; the
  trimount bogies. Liveries: `maroon` the red-maroon and cream scheme with the red lightning bolts
  and the shed roundel (21219, SR AJJ), `blue` the Bhilai scheme (21206): blue lower body with an
  off-white vee on the face. The side layout comes from a projective fit on a perspective view (no
  side-on photograph is free); the bogie centres and axle gaps are estimates, and the roof's
  many post insulators are reduced to a few. Hindi lettering and the tricolour are not drawn.
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
- **WDP-4D.** Drawn on its own (`generator/inWdp4d.ts`, borrowing the hood kit's sweeps and decals) from
  five photographs (`assets/ir-wdp4d/`): a full-width cab at each end (cab 1 2.19 m, cab 2 1.95 m), the
  face upright to 2.9 m and raked 0.22 m over the barred screens, the roof arched from the 3.86 m eaves to the
  4.12 m crown, the twin headlight, marker lamps and the crown lamp under the horn box; the hood flared to the
  cabs' width over the radiator behind cab 2 (its side grilles under the overhang) and over the equipment
  section behind cab 1 (two round hatches); side buffers and the centre coupler on deep headstocks; HTSC Co-Co (cast side frames, a pair of coils on each journal box)
  bogies at +-6.35 m (axles 2.06 m apart), measured by a projective fit along 40086's side. 19.964 m over the
  headstocks, 21.244 m over the buffers, 3.127 m over the walkways. Paint: the yellow-band scheme (blue hood
  with yellow and white bands, white cabs, the band narrowing to a point on the face, the blue foot band);
  the face's upright corners rounded (0.16 m), a wiper on each screen; the flags, the roof air conditioner and the GSM-R aerial are not drawn, and the buffer heads are the shared 0.4 m ones (IR's are about 0.45 m).
- **WAP-5.** Drawn as the later CLW units run (30164): the aerodynamic cab 1 at +x (the lower nose bulging 0.25 m ahead of the headstock and rounded in plan, windscreens raked about 50 degrees behind wire guards, a raked cab side window) and the flat cab 2 at -x, both over an open-bar cowcatcher; the ABB and early CLW units with two flat cabs are not drawn. One machine-room window a side, diagonally opposite; side positions follow the 2.434 m cab length, not a side-on photograph (none is free). The Gatimaan scheme (30086) has no free photograph: the white-red stripes in blue with a yellow line. Lettering (WAP5, Bharatiya Rail, the shed) and the centre buffer coupler are left out; the distant model merges the two stripes. References: `assets/ir-wap5/SOURCES.md`.
- **WAG-12B** (`generator/inWag12b.ts`, assets/ir-wag12b/). Drawn from photographs of 60051, 60185, 60222 and 60227: two single-cab Bo-Bo sections back to back, each a section of an articulated vehicle (`articulate`, tramKit.ts) hinged at the coupling plane, the 1.0 m gap between the flat light-blue inner ends covered by the narrow black duct the photographs show, the roof jumper over it; 38.4 m over couplers, 3.2 m wide, bogie pivots 10.2 m per section, wheels 1,250 mm, a single-arm pantograph per section 4.5 m from the joint (the rear section's raised). The cab: the face raked 0.42 m to the windscreens' head, its corners chamfered, the black mask with its vee-shaped lower edge, two guarded windscreens, the light-blue nose block with the twin headlamps, the lamp pods, buffers and centre coupler, the light-blue plough raked back under the buffer beam, the air-conditioning unit with headlamp and horn on the cab roof. Every photographed unit is blue (mid-blue body, light-blue face and chevrons), so the single livery keeps its key `greyRed` but is painted blue and titled "IR blue". The Hindi lettering is drawn as a Devanagari-like headline with stems, not real glyphs; the machine-room roof is one hatch box.
- **WP.** Drawn from its own spec (`generator/inWp.ts`) on the steam kit: the bullet nose with its star and headlamp, the running board's S sweep and the cab are measured from three-quarter photographs (no side-on photo on Commons). The front S is a 0.45 m fender plate under a tread each side, open over the frames, with a bar pilot; 7161 carries its AKBAR board. The tender is a plain high box.
- **WG.** Drawn from its own spec (`generator/inWg.ts`) on the steam kit, measured on the NBL works side photograph of 8301 (51.6 px/m) against the published 23.85 m: the long plain smokebox with its flat door and white ring, the headlamp on a bracket at its top front, the stovepipe chimney, a 1.85 m dome casing, three pop valves, the high running board (2.2 m) sloping down to a full-width front deck over the apron and red beam, a grid cowcatcher, the short cab (12.62 - 14.72 m) with side sheets chamfered down below the board, one window and a louvred shutter, the bogie tender with its crew cowl sloping back, the coal pusher and the lower stepped back. Painted as 10491 in black with white bands and tyres and yellow-lined cab and tender panels (8082's maroon panels are not drawn). The carrying wheels are 0.98 m as measured, not the German article's 1,092 mm; the cylinders, pipes and bogie castings are simplified.
- **Fairy Queen.** Drawn with its own parts on the steam kit (`generator/inFairyQueen.ts`), as the Rocket is, from three three-quarter and head-on photographs of the preserved engine in the museum's running livery (no side-on photograph is free): outside plate frames with horn guides and a low footboard, the single driver under its lettered splasher, outside cylinders inclined about 5 degrees in a green casing swept up to the smokebox top, the starred smokebox door, the tall chimney with its copper crown and the headlamp before it, the copper dome, the arched canopy on four pillars and the bar guard under the EIR 22 beam. The wheelbase, carrying wheels and length over buffers are estimated from the photographs (not published); Stephenson valve gear between the frames is not drawn. The four-wheeled tender is the small water tender of the 2 t the article gives, drawn plain (none is photographed).
- **DHR B class.** Drawn from its own spec (`generator/inDhrB.ts`) on the steam kit as the 0-4-0 saddle tank it is, without a tender: both `unit` values draw the engine (the OpenTTD `unit=tender` preset and the "with tender" formation are retired). Measured on three-quarter photographs of 785, 787, 788, 792, 795 and a near side-on one of 19B (`assets/dhr-b-class/SOURCES.md`; no true side-on photograph), scaled to the 26 in drivers and 5 ft 6 in wheelbase: the sanding platform with its sand box and corner rails over the deep front beam, the big headlamp ahead of the tall chimney, the saddle tank, the dome with its valves, the coal bunker round the firebox (its sheets cut away over the motion), the spectacle plate, the open cab under a long roof with the rear headlamp, Walschaerts gear driving the rear axle, central buffer-couplers. The body is drawn at its real 2.16 m width on the game's standard-gauge wheelsets, so the kit's motion stands about 0.15 m outside the side sheets. The NF blue with white lines, the brass-figured number plate and "N F"; no name boards.
- **LHB coach.** Measured on photographs (`assets/ir-lhb-coach/SOURCES.md`; Tejas 3A side fitted
  projectively, 1.87 m window pitch): the 3A has nine 1.2 m by 0.86 m windows (round-cornered) and its louvred toilet window in
  the end panel beyond the door; the chair car eight 1.38 m windows and a shallow toilet window inside
  the door. The grey lower band reaches 1.75 m; the red and blue liveries' end panels are grey below a diagonal from the door's foot to
  the roof; two roof AC packages, sealed gangways, folding steps. Still simplified: the bogies are the
  kit's generic two-axle bogie (not the FIAT frame), the Humsafar's wave graphics are straight bands
  and the Tejas's yellow-to-orange fade is three bands.
- **BOXN / BCNA wagons** (`generator/inBoxnWagon.ts`, re-exported by `worldWagons.ts`; assets/ir-boxn-wagon/).
  Drawn from photographs and the published figures. The BOXN: 10.713 m over couplers, 9.84 m body, 3.16 m over
  the stanchions, 3.233 m high, bogie centres 6.524 m; the side in six panels between seven hat-section
  stanchions (corner posts wrapping the ends), three pressed ribs a panel, two hinged ladder frames a side
  (panels 3 and 5 from the left, as photographed), the top chord, the end wall's ribs and two stiffeners, a
  low coal heap. The BCNA: 15.429 m over couplers, 14.5 m body, the circular-arc roof (eaves 3.72 m, 4.27 m
  high) over a cant rail, two 2.1 m sliding doors a side centred 3.6 m from the middle (fitted projectively on
  the Malkajgiri photograph), each with its pressed panel, lock bar and a top track running out toward the end,
  stanchions only between the doors. Both on CASNUB-22 three-piece bogies (1,000 mm wheels, 2.0 m wheelbase)
  with centre buffer couplers, in IR wagon brown with white stencils (illustrative numbers ER 82153 and SR
  70154), yellow plates and the white-red striped upper corners of the ends. Not drawn: the hand brake, the
  Devanagari stencils, the yellow band some BOXN rakes carry; the stanchions and ribs are painted a shade
  darker so they read in flat light.
- **ICF coach.** Measured on photographs (`assets/ir-icf-coach/SOURCES.md`; SL NR 05281 fitted
  projectively, 0.91 m window pitch, about 200 px/m on the Saurashtra Mail side): 18 round-cornered
  0.66 m by 0.61 m windows a side, the first centred 2.93 m from each end, with horizontal bars (five on
  the sleeper, six on the general coach) and louvred aluminium shutters let down in most of the
  sleeper's windows (stowed in the head of the general coach's open ones); the frosted, vertically barred
  toilet window 0.18-0.86 m from each end, the door 1.52-2.28 m with grab rails and three hanging steps.
  The blue livery's pale band runs 2.0-2.82 m over the windows, the toilet windows and the doors; the
  maroon is one colour; both carry the silver roof with a water-tank hatch on each slope over the doors,
  the yellow stripe down each end's corner, a route board, the running number and class name, the IR
  roundel. The ICF bogies (14.783 m apart, 2.896 m wheelbase, 915 mm wheels) are the kit's generic coil
  bogie; the body is 3.21 m wide (published 3.25 m) so the door grab rails stay in the 3.3 m gauge. The
  door window is plain glass (the photographs show a louvred shutter in it), the lettering is English
  only, and the later CBC-fitted coaches are not drawn.

## Tests

`test/worldTrains.test.ts` and, for each module's first design, the catalog sweep.
