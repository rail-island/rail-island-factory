# Switzerland's trains

**Covers** - the twenty Swiss designs of the eight-country plan: the RAe TEE II, the Roter Pfeil, the ICN, the Giruno, the FV-Dosto, SBB's FLIRT and KISS and the Rhaetian Railway's Allegra; the Re 460, Re 4/4 II, Re 6/6, Ae 6/6, Ce 6/8 II Krokodil and Ae 8/14 Landi; on the metre gauge the RhB Ge 4/4 III and Ge 6/6 I Krokodil and the MGB HGe 4/4 II; the EW IV, IC 2000 and Glacier Express coaches. Their kits, figures, deviations and tests.
**Code** - `generator/chUnits.ts` (`CH_UNITS`, `chLivery`), `generator/roterPfeil.ts`, `generator/chLocos.ts` (`CH_LOCOS`), `generator/seriesHelpers.ts` (`flirt`, `kiss`), `generator/worldCoaches.ts`, `test/worldTrains.test.ts`, `assets/sbb-*/`, `assets/rhb-*/`, `assets/mgb-hge442/`, `assets/glacier-express/`
**See also** - [shinkansen.md](shinkansen.md), [world-locos.md](world-locos.md), [world-coaches.md](world-coaches.md), [netherlands-trains.md](netherlands-trains.md) (the FLIRT's Dutch sister)

The catalog had no Swiss train before. Every design is filed under Switzerland.

## The designs

| id | title | kit | parameters | figures (game) |
|---|---|---|---|---|
| `proc-vehicle-sbb-rae-tee` | SBB RAe TEE II | series | `unit`, `cars` 4 - 6, `livery` (`tee`, `gottardo`) | 160 km/h |
| `proc-vehicle-sbb-roter-pfeil` | SBB Roter Pfeil | series, single, pantograph on the car | - | 22.4 m; 125 km/h |
| `proc-vehicle-sbb-icn` | SBB ICN | series | `unit` (seven cars) | tilting; 200 km/h |
| `proc-vehicle-sbb-giruno` | SBB Giruno | series | `unit`, `cars` 4 - 8 | 250 km/h |
| `proc-vehicle-sbb-fv-dosto` | SBB FV-Dosto | series, double-deck | `unit`, `cars` 4 - 8 | 200 km/h |
| `proc-vehicle-sbb-flirt` | SBB FLIRT | series, Stadler FLIRT | `unit`, `cars` 3 - 4 | 160 km/h |
| `proc-vehicle-sbb-kiss` | SBB KISS | series, Stadler KISS | `unit`, `cars` 4 - 6 | double-deck; 160 km/h |
| `proc-vehicle-rhb-allegra` | RhB Allegra | series, metre gauge | `unit` (three cars) | 2.65 m wide; 120 km/h |
| `proc-vehicle-sbb-re460` | SBB Re 460 | box locomotive, streamlined | - | Bo-Bo, 18.5 m, 6,100 kW, 230 km/h |
| `proc-vehicle-sbb-re420` | SBB Re 4/4 II | box locomotive, flat | `livery` (`green`, `red`) | Bo-Bo, 15.41 m, 4,700 kW, 140 km/h |
| `proc-vehicle-sbb-re620` | SBB Re 6/6 | box locomotive, flat | `livery` (`green`, `red`) | Bo-Bo-Bo, 19.31 m, 7,850 kW, 140 km/h |
| `proc-vehicle-sbb-ae66` | SBB Ae 6/6 | box locomotive, raked | `livery` (`green`, `red`) | Co-Co, 18.4 m, 4,300 kW, 125 km/h |
| `proc-vehicle-sbb-ce68` | SBB Ce 6/8 II Krokodil | box locomotive, hoods | `livery` (`brown`, `green`) | 19.46 m, 2,700 kW, 65 km/h |
| `proc-vehicle-sbb-ae814` | SBB Ae 8/14 Landi | box locomotive, raked | - | 34.0 m, 8,160 kW, 110 km/h |
| `proc-vehicle-rhb-ge443` | RhB Ge 4/4 III | box locomotive, metre gauge | - | Bo-Bo, 16.0 m, 2,400 kW, 100 km/h |
| `proc-vehicle-rhb-ge66` | RhB Ge 6/6 I Krokodil | box locomotive, hoods, metre gauge | `livery` (`brown`, `green`) | 13.3 m, 794 kW, 55 km/h |
| `proc-vehicle-mgb-hge442` | MGB HGe 4/4 II | box locomotive, metre gauge | - | Bo-Bo rack, 14.8 m, 1,932 kW, 90 km/h |
| `proc-vehicle-sbb-ew4-coach` | SBB EW IV coach | coach | `unit` (`a`, `b`), `livery` (`redGrey`, `sbb`) | 26.4 m; 200 km/h |
| `proc-vehicle-sbb-ic2000` | SBB IC 2000 coach | coach, double-deck | `unit` (`a`, `b`) | 26.8 m; 200 km/h |
| `proc-vehicle-glacier-express` | Glacier Express coach | coach, metre gauge | `unit` (`first`, `second`) | 18.4 m, the panorama car: glass over the roof's curve; 90 km/h |

## Deviations

- **Metre gauge.** The RhB and MGB stock keeps its real 2.65 m bodies on the game's
  standard-gauge wheelsets, as the KiHa 40 does; the HGe 4/4 II's rack pinions are
  not drawn.
- **Crocodiles.** The Ce 6/8 II's and the Ge 6/6 I's hoods are drawn at the cab's width
  (the `hoods` nose type) on two three-axle groups; the side rods are not drawn.
- **Ae 8/14.** One 34 m body on its eight driving axles in four groups; the articulation
  between its two halves and the six idle guiding axles are left out.
- **Glacier Express.** The Stadler panorama car (datasheet: body 17.7 m, 2.68 m wide, 3.695 m
  high, pivots 12.83 m, 685 mm wheels) on the coach kit's `adapt` hook (`glacierCar`): the side glass
  from the 1.8 m sill to the 3.0 m shoulder and the roof glass as real panes over the roof's curve
  (`shapedCrownPane`) up to a white crown strip 0.84 m wide, one pane per side pane with dark pillars
  (six bays first class, seven second); red ends whose edge is one slanted line from the belly over
  the roof (side wedges and crown panes), the roof glass's ends slanted with it; a white body over a red lower
  band; one white entrance a side at one end with its narrow window, the white flags and the class
  digit. The photographs show one side; the other side is drawn the same (mirrored), not verified.
  The bogie wheelbase stays at the kit's 2.05 m minimum (real 1.8 m); 90 km/h (the datasheet's
  100 km/h adhesion speed is not taken over). The distant model has the red ends and a glazed roof
  band under the white crown (`lodBody`).
- **Roter Pfeil.** The RCe 2/4 604 of 1947 - 1956, measured on the SBB works drawing of the CLe
  2/4 203 - 206 (`assets/sbb-roter-pfeil/`): 21.5 m over the bonnets, 22.4 m over the buffers
  added in 1944, 16.3 m bogie centres. Its low bonnet is drawn apart from the cab face
  (`generator/roterPfeil.ts`, through the series' `fittings`): a half ellipse in plan 2.0 m long,
  the crease at 1.56 m, the dome above it rising to 2.14 m under the windscreens, the lamps
  under the crease, a grille on each side and the buffers' long red housings out of its lower
  front. The cab face behind it is a vee in plan (a `bulge` by height): two centre panes and a
  wide pane on each arm, the roof's brow jutting over them with the top lamp. One cab side
  window, as on the drawing; the lengthened RAe 2/4 1001 of the photographs has a second and
  is 25.2 m long. The roof carries the three resistor grids of the electric brake and the two
  fairings beside the diamond pantograph over cab I. The distant model keeps the bonnet's
  step in its profile (the face's `lod`) and gives up the cab's glass for the pantograph.
- **Glacier Express.** The panorama roof is drawn as the dark roof band over tall windows.
- **KISS (RABe 511).** Its own layout (`layout` with per-row `rows`) from the photographs, the
  RABe 512 profile corrected for perspective: on every car the double deck lies between the two
  doors (end car 9.0 - 10.6 and 18.95 - 20.55 m behind the tip), five lower windows between them
  (six on a middle car), the upper row from over the first door to over the second, and one narrow
  mid-floor window over each bogie section; the end car's locker, the SBB emblem and a dark roof
  fairing behind the cab. The red runs up each door to the upper window (`overDoors`, a navy class
  panel in it); the inter-deck stripe starts behind the locker. One single-arm pantograph on each
  end car's rear (both drawn raised); the bogies under the cab section and the cars' mid-floor ends.
  The face (head on from 511 120): a windscreen narrower at its foot, white wedges over the black
  lamp pods, the grilles in the navy apron. The locker is on both sides (the real one only on the
  left); the windscreen's rake (about 37 degrees) is estimated from three-quarter views, no true
  profile of a 511 being at hand.
- **IC 2000.** Its own layout on the coach kit (`ic2000Layout`, docs/models/world-coaches.md),
  measured on the four photographs in `assets/sbb-ic2000/`: the body's bottom (0.45 m between
  the bogies) steps up to 1.15 m over the 5.4 m end sections; the doors stand in the lower
  deck where it meets them, 7.0 m from the coupling planes, each in a coral strip from the
  bottom to the roof's edge with the lounge window over the door and three dashes across the
  roof, and a blue strip with the class numeral toward the middle. Upper deck: three windows
  over each end section, five (first class, 2.0 m pitch, 13 a side) or six (second class,
  1.75 m, 14 a side) between the doors; lower deck five windows between the doors and two
  stair slits in each end section. Paint: anthracite lower body to 1.43 m, a dark line between
  the decks (2.5-2.7 m), the roof's grey from 3.73 m over the upper windows' heads; the first
  class car's yellow length of that line across its door strips is read from the Siegershausen
  photograph. The ends have rounded corners, the gangway's seal round the outline and the upper
  deck's gangway door. Left out: the first class car's one side with four lower windows, the
  Bt control car, AD and dining cars, the windows' rounded corners. Numbers: A 50 85 16-94 073-3,
  B 50 85 26-94 101-0 (check digits per UIC).
- **FV-Dosto.** Measured from a near side view of the cab end and the upper windows' 1.5 m pitch: the
  black sweep's back edge one straight line from the white's point 1.4 m behind the tip to the shoulder
  at 6.75 m, the red over the roof's edge (livery `endRoofEdge`) to 7.7 m; on the cab's sides the dark
  band and the white's point are painted forward to the red. The doors stand at the low floor's ends
  inside the bogies (series `layout`): the end car's at 9.35 m and 17.6 m behind the tip with three lower
  windows between, the intermediate car's 5.2 m in from each end with seven; white service doors over the
  bogies, and behind the cab the destination display and the service door with its window and grille
  (series `sidePanels`). The pantograph stands on each end car's roof 5 m behind the tip (`pantographD`),
  the trailing one folded (`trailingLowered`). The sides are white up to the upper deck's window tops,
  the dark grey roof band starting at the shoulder just above them, as the photographs show. The distant model draws only the lower window
  row's span, now short on the end car.
- **Allegra.** Its own cab face (`ALLEGRA_FACE`) and livery (`ALLEGRA_RHB`, key `rhb`; the
  shared `chLivery("rhb")` is unchanged), read from four photographs (assets/rhb-allegra/):
  the upright glass-fibre front under the silver hood, tapering in plan (a flat face about
  1.35 m wide; elliptic corners 0.62 - 0.68 m across reach the full 2.65 m about 1.0 m behind
  the tip low down and 1.45 m at the windscreen's top, the kit's `cornerDepth`), the black
  mask (1.72 m wide) with the 1.2 m tall windscreen and destination display between the
  broad red corner panels, the lamps low in black pods on the corners, the
  Graubuenden arms, the camera box, sockets, coupler and snowplough; the white line low on
  the sides (12 cm lower on the face, a step at the corner where the real one ramps down);
  the cab side window behind the pillar, the cab door, the first class's yellow line, white
  door leaves; silver roof fairings over a dark equipment well. End cars 17.75 m and the
  middle car 14.0 m (49.5 m); the layout of each car comes from a projective fit along the
  photographed sides. Of the three pantographs each end car raises its DC one over the cab
  (the Bernina line, as photographed) and the middle car's AC one lies folded. The middle
  car's bogies stand near its ends with no underfloor box between them (the lowered floor),
  its low-floor bay has a double door and one window reaching down to the white line. The
  number 3502 stands under the cab door's window, lower than on the real car, because the
  kit puts it on every car at one height. The kit's single wheel radius (0.4 m) serves the
  middle car's smaller trailer wheels too.
- **ICN.** A cab face (`ICN_FACE`, four photographs in `assets/sbb-icn/`) in place of the lofted
  nose, tapering strongly in plan: its corners are elliptical (the cab face's `cornerDepth`, a kit
  option: 0.7 - 0.9 m across, up to 2.5 m deep), so the white cab sides curve in to a face much
  narrower than the body. A narrow, rounded black chin protruding under the face (`icnFittings`,
  drawn under the face's 0.95 m bottom so the leading bogie, 4.6 m behind the tip under the cab's
  side window, clears it); the white bumper wrapping the corners, the red lip and red lamp face with
  two upright lamp housings and the emblem, the black windscreen field (a rounded U over the
  lamps) raked about 40 degrees, the roof at full height 3.6 m behind the tip,
  running on as the roof cap, the red frame round it running on as the red lines along the roof's
  edges (face fields; sweeps over the cab roof, the kit's sweep `top` carrying paint above the
  shoulder on the face's sides). Its own livery (`ICN_SBB`, key `sbb`): white over a dark band below
  1.12 m, a thin red line at the roof's edge, the red flag beside every door (the livery's
  `doorFlags`). The narrow, strongly tucked-in tilting body (lean 0.85), tall single-leaf doors with
  a narrow window high in the leaf, a dark window band of wide windows. The lamp housings are
  rounded rectangles (slanted wedges on the real face), the cab side's vent grille and the
  pictograms are not drawn; the running number on the photographs is not legible, 500 001 is
  illustrative.

## Tests

`test/worldTrains.test.ts` and, for each module's first design, the catalog sweep.
