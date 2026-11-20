# France's trains

**Covers** - the twenty French designs of the eight-country plan: the TGV M, the Z 20500, the RER MI 09, the Regio 2N and the Regiolis, the X 3800 "Picasso" and X 73500 railcars; Paul Arzens's "nez casse" CC 6500, CC 40100, BB 22200 and CC 72000, the CC 7100 and BB 9200, the BB 27000 Prima and the BB 67400; the 241 P and 141 R steam engines; the Corail, Grand Confort and Wagons-Lits coaches. Their modules, figures, the detail pass that matched each to its photographs, deviations and tests.
**Code** - `generator/frUnits.ts` (`FR_UNITS`, the units' registry), `generator/frLocos.ts` (`FR_LOCOS`, the locomotives' registry, `locoGame`), one module per vehicle: `generator/frTgvM.ts`, `frZ20500.ts`, `frMi09.ts`, `frRegio2n.ts`, `frRegiolis.ts`, `frX3800.ts`, `frX73500.ts`, `frCc6500.ts`, `frCc40100.ts`, `frBb22200.ts`, `frCc7100.ts`, `frBb9200.ts`, `frBb27000.ts`, `frBb67400.ts`, `frCc72000.ts`, `fr241p.ts`, `fr141r.ts`, `frCorail.ts`, `frGrandConfort.ts`, `frCiwl.ts`; `generator/worldSteamLocos.ts`, `generator/worldCoaches.ts`, `test/worldTrains.test.ts`, `test/seriesCabFace.test.ts`, `test/shinkansen.test.ts`, `assets/sncf-*/`, `assets/ratp-mi09/`, `assets/ciwl-car/`
**See also** - [shinkansen.md](shinkansen.md) (the series kit), [spain-trains.md](spain-trains.md) (the same pass for Spain), [world-locos.md](world-locos.md), [world-steam.md](world-steam.md), [world-coaches.md](world-coaches.md), [netherlands-trains.md](netherlands-trains.md), [tgv-duplex.md](tgv-duplex.md)

The catalog already had the TGV (PSE, Atlantique) and the TGV Duplex; neither is
repeated. Every design is filed under France (`generator/factTable.ts`).

## The designs

| id | title | built on | parameters (default first) | figures (game) |
|---|---|---|---|---|
| `proc-vehicle-sncf-tgv-m` | TGV M | series, double-deck, own cab face, power cars and Jacobs trailers (`frTgvM.ts`) | `unit`, `cars` 3 - 8, `livery` (`inoui`, `ouigo`) | power cars 18.25 m, trailers 17.7 m; 62 / 32 t, 7,760 kW, 320 km/h |
| `proc-vehicle-sncf-z20500` | SNCF Z 20500 | series, double-deck, cab face (`frZ20500.ts`) | `unit`, `cars` 2 - 5, `livery` (`transilien`, `ileDeFrance`) | 25.10 / 26.40 m (103.0 m for four); 70 / 44.5 t, 140 km/h |
| `proc-vehicle-ratp-mi09` | RER MI 09 | series, double-deck, cab face (`frMi09.ts`) | `unit`, `cars` 2 - 5 | 24.5 / 21.0 m (112.0 m for five); 288 t, 3,900 kW, 120 km/h |
| `proc-vehicle-sncf-regio2n` | Regio 2N | four kinds of series car on Jacobs bogies (`frRegio2n.ts`) | `unit` (`endCar`, `middleCar`, `singleDeckCar`, `singleDeckEnd`, `train`), `cars` 2 - 8, `livery` (`ter`, `transilien`) | 19.215 / 15.445 / 10.02 / 14.3 m (109.9 m for eight); 160 km/h |
| `proc-vehicle-sncf-regiolis` | Regiolis | series, cab face, Jacobs (`frRegiolis.ts`) | `unit`, `cars` 2 - 6, `livery` (`ter`, `grandEst`) | 20.1 / 15.8 m (71.8 m for four); 160 km/h |
| `proc-vehicle-sncf-x3800` | SNCF X 3800 Picasso | series, diesel, single, cab faces, roof turret (`frX3800.ts`) | - | 21.85 m over buffers; 31.5 t, 120 km/h |
| `proc-vehicle-sncf-x73500` | SNCF X 73500 | series, diesel, single, cab faces (`frX73500.ts`) | `livery` (`ter`, `alsace`) | 28.9 m; 50 t, 140 km/h |
| `proc-vehicle-sncf-cc6500` | SNCF CC 6500 | box locomotive, nez casse (`frCc6500.ts`) | `livery` (`capitole`, `maurienne`, `beton`) | C-C, 20.19 m, 5,900 kW, 200 km/h |
| `proc-vehicle-sncf-cc40100` | SNCF CC 40100 | box locomotive, nez casse (`frCc40100.ts`) | - | C-C, 22.03 m, 4,480 kW, 160 km/h |
| `proc-vehicle-sncf-bb22200` | SNCF BB 22200 | box locomotive, nez casse (`frBb22200.ts`) | `livery` (`beton`, `enVoyage`, `fret`) | B-B, 17.48 m, 90 t, 4,360 kW, 160 km/h |
| `proc-vehicle-sncf-cc7100` | SNCF CC 7100 | box locomotive, raked (`frCc7100.ts`) | `livery` (`blue`, `green`) | Co-Co, 18.92 m, 3,490 kW, 150 km/h |
| `proc-vehicle-sncf-bb9200` | SNCF BB 9200 | box locomotive, own profile (`frBb9200.ts`) | `livery` (`blue`, `capitole`) | B-B, 16.2 m, 83 t, 3,850 kW, 160 km/h (`capitole` 4,240 kW, 200 km/h) |
| `proc-vehicle-sncf-bb27000` | SNCF BB 27000 Prima | box locomotive, raked (`frBb27000.ts`) | - | Bo-Bo, 19.52 m, 90 t, 4,200 kW, 140 km/h |
| `proc-vehicle-sncf-bb67400` | SNCF BB 67400 | box locomotive, diesel (`frBb67400.ts`) | `livery` (`blueWhite`, `fret`) | B-B, 17.09 m, 1,765 kW, 140 km/h |
| `proc-vehicle-sncf-cc72000` | SNCF CC 72000 | box locomotive, nez casse, diesel (`frCc72000.ts`) | `livery` (`blueWhite`, `multiservice`) | C-C, 20.19 m, 2,650 kW, 160 km/h |
| `proc-vehicle-sncf-241p` | SNCF 241 P | steam, own spec (`fr241p.ts`) | `unit` | 2'D1', 2.02 m drivers; 131.4 + 84.8 t, 2,940 kW, 120 km/h |
| `proc-vehicle-sncf-141r` | SNCF 141 R | steam, own spec (`fr141r.ts`) | `unit` | 1'D1', 1.651 m drivers, 24.13 m with tender; 116 + 75 t, 2,150 kW, 100 km/h |
| `proc-vehicle-sncf-corail-coach` | SNCF Corail coach | coach, own layout (`frCorail.ts`) | `unit` (`a10tu`, `b11tu`), `livery` (`corail`, `teoz`) | 26.4 m, bogie centres 18.306 m; 200 km/h |
| `proc-vehicle-sncf-grand-confort` | SNCF Grand Confort | coach, own layout (`frGrandConfort.ts`) | `unit` (`a8u`, `a7d`), `livery` (`capitole`, `tee`) | 25.5 m, bogie centres 18.2 m; 200 km/h |
| `proc-vehicle-ciwl-car` | Wagons-Lits car | coach, own layout (`frCiwl.ts`) | `unit` (`pullman`, `sleeping`), `livery` (`pullman`, `ciwlBlue`) | 23.45 m, bogie centres 15.7 m; 140 km/h |

The figures are the published ones (each `assets/<name>/SOURCES.md`). The locomotives' bodies
are no longer exported or shared: each module draws its own, and the Dutch 1600 / 1700, 1100
and 1300 have their own profiles ([netherlands-trains.md](netherlands-trains.md)).

## The detail pass (2026-11)

Every design was reshaped from photographs with the detailed-vehicle skill, as the Spanish
ones were ([spain-trains.md](spain-trains.md)): one agent per vehicle, at least three
photographs in `assets/<name>/`, measured in px/m with projective fits, published figures over
photo estimates, a render-and-compare loop, a review against the photographs before the merge.
Each vehicle moved to its own module. Published figures that contradicted the draft were
corrected in `game` and the OpenTTD capacities (the TGV M's power cars carry no seats, the
MI 09's, Regio 2N's and X 73500's seats; [openttd-figures.md](openttd-figures.md)); several
liveries' running numbers and colours changed to the photographed engines. The kits were only
extended with optional fields whose defaults keep every other design byte-identical
(hash-checked): the series kit's `endCarDoors`, `endSection` with the exported
`drawSeriesCar`, `drawSeriesJointBogie`, `seriesCarLod` and `seriesCarPalette`,
`roofWells.endCarOnly`, `leafEdgeStripe`, `lodRoof.centreZ` and `railcarUnderside`
([shinkansen.md](shinkansen.md)); the car builder's `leafEdgeStripe` ([us-transit.md](us-transit.md)).
The Regio 2N adds two `unit` values, `singleDeckCar` and `singleDeckEnd`, with their OpenTTD ids.

### Units

- **TGV M** (`frTgvM.ts`). The Avelia Horizon's power cars, 18.25 m over the coupler, with their
  own cab face: the white snout standing out (upright 0.65 - 1.35 m), the black mask a band from a
  thin lip on the snout narrowing up the centre and widening round the narrow-footed windscreen
  to the roof lamp; flanks white with dark oval lamps rising rearward; the grey skirt rising to
  the cab door; the D-shaped cab window and the tall white cab door (`endCarDoors`); louvred roof
  fairings with two single arms in their gap. Trailers 17.7 m, as high as the power cars (4.318 m),
  on Jacobs bogies: five big upper windows, four lower, one carmine door low at the rear end. inOui
  has a pale-grey facet on the power car's rear half. The 20.8 m end trailers are drawn at 17.7 m;
  `ouigo` follows the Duplex (it never ran on the M); the lamps are slimmer than the photographs'.
- **Z 20500** (`frZ20500.ts`). The Z 2N of 1988 - 98 on the RER C and D and Transilien: two motor
  cars of 25.10 m on Bo'Bo' bogies with two or three 26.40 m trailers. The flat MBD face: upright at
  the lamp band, leaning about 10 degrees over the two-pane windscreen to the destination box, 45
  degree corner chamfers. Motor car: cab side window, equipment panel with its grille, crew door,
  doors at 7.1 and 17.8 m, five windows a deck (the lower deck in a well), and the end section
  with the lowered roof holding the single arm (`roofWells.endCarOnly`). Trailer: a double door
  over each bogie, ten windows a deck. `ileDeFrance` (grey, navy band and cab panel, red doors) and
  `transilien` (Paris-Est blue, white band, a red fruit round every door). All fruits are red (one
  door colour); the short trailers are not drawn.
- **MI 09** (`frMi09.ts`). R+M+M+M+R, 112.0 m: end cars 24.5 m, motor cars 21.0 m, 2.90 m wide,
  4.32 m high (eleven photographs; Ile Corbiere side-on, 1622 head-on at 140 px/m). Three 2.45 m
  doors a side per car, two big rounded windows per deck between them. STIF: the vif-argent grey
  band across the door leaves and a jade stripe down each leaf's meeting edge (`leafEdgeStripe`)
  rising to the roof (the draft's turquoise leaves were wrong). The face: the dark grey mask round
  the big windscreen widening below into a trapezoid with the RATP emblem, white cheeks with oval
  tail-lamp housings, the bumper grilles and coupler. A single arm over each end car's inner door.
  474 seats. The distant model has one window band and no jade.
- **Regio 2N** (`frRegio2n.ts`). Bombardier's Omneo from four kinds of car (the maker's data sheet):
  the double-deck end car (19.215 m), the double-deck intermediate (15.445 m), the single-deck access
  car (10.02 m, two double doors round the toilet, a lower roof under fairings and the pantograph)
  and the single-deck end car (14.3 m, its cab as tall as the double-deck's: `endSection`).
  `regio2nTrain` alternates them on Jacobs bogies at every joint with the series kit's
  `drawSeriesCar` and `drawSeriesJointBogie`; even trains are led by the double-deck end car and
  closed by the single-deck one, odd trains have single-deck end cars at both ends. The cab face:
  the windscreen raked about 37 degrees wrapping round the corners, teardrop headlamps with silver
  rims, the dark grey chin round the open coupler recess. `ter` (Hauts-de-France 003XL) and
  `transilien` (IDFM). The sides are mirror-symmetric (the real ones turn about); the TER art is
  simplified.
- **Regiolis** (`frRegiolis.ts`). The Coradia Polyvalent: end car 20.1 m, intermediates 15.8 m on
  Jacobs bogies, the end car's motor bogie under its 4.3 m cab section. The cab face: a white chin
  box round the open coupler recess, headlights in black teardrop housings, the black-framed
  windscreen leaning about 43 degrees under a black eyebrow into the black helmet. Every car: raised
  windows over the bogies at its ends, one 1.3 m door a side; the pantograph on car 2. `ter` (Pays
  de la Loire, B 84549: silver, magenta doors, cyan round the windscreen) and `grandEst` (Fluo, B
  83559: white over a navy band, lime blocks beside blue doors). The six-car splitting cars are
  drawn as ordinary intermediates (103.5 vs 109.98 m).
- **X 3800 Picasso** (`frX3800.ts`). Matched to X 3817 and X 3853 (both sides), X 3998, X 4039, X 4042
  and a drawing of X 3896. The low wide body: crown 3.05 m, 3.04 m wide, the red sides down to
  0.5 m over the wheels' upper halves, bogies 14.2 m apart. The early cars' side: cab window,
  luggage door, louvred engine-room window, four windows, the central double door, the rear saloon.
  Cab faces at both ends: the flat centre panel with two big windows, the outer panels set back
  with the narrow ones, lamps in housings at the corners, the cream V 1.62 m down to 1.2 m,
  rectangular buffer heads without a beam. The turret 1.6 - 4.1 m from the engine end, right of
  the crown, with arched windscreens both ways; the distant model's turret off-centre
  (`lodRoof.centreZ`). The late cars' cab door and grilles are not drawn.
- **X 73500** (`frX73500.ts`). One diesel railcar of 28.9 m over the couplers, a cab face at both
  ends from a side-on 1:87 model and head-on photographs: the face raked about 45 degrees from the
  black lamp band to the windscreen's head at 3.41 m, the grey number strip, the grey bumper. The
  blue cap sweeps back over each cab side to the seam 3.15 m behind the tip, over the anthracite
  panel and the grey engine housing with grilles. The body high over the bogies (17.5 m apart) and
  low between them (`railcarUnderside`); four tall low-floor windows and a 1.3 m door a side at
  each end of the low floor. `ter` (silver, blue face and cap) and `alsace` (TER Alsace stripes
  either side of each seam); the draft's grey and blue were wrong. 61 seats.

### Locomotives

- **CC 6500** (`frCc6500.ts`). The C'C' of 1969 with its own nez casse profile, measured on 6530 and
  6558 side-on and 6549 head-on: the face upright to 2.45 m rounding into the bonnet, the windscreens
  leaning forward 0.54 m back, bogie centres 11.99 m, monomotor bogies with 1.14 m wheels. Grilles by
  livery: `capitole` (6530, long louvres; red field between orange lines rising behind each door),
  `maurienne` (6558, plastic panels, third-rail shoes; blue-green and white bands), `beton` (6568,
  grey with an orange line, after the BB 22200: no CC photograph). AM 18 single arms knees inward,
  the plough.
- **CC 40100** (`frCc40100.ts`). The first nez casse, measured on 40101 at Mulhouse (271 px/m), 40110
  and 40109: the bonnet only 0.31 m ahead of windscreens leaning out to a visor almost over the face.
  The face: a red field with orange wings and the disc, white and red lamps, the roof headlight.
  Metallic grey over the fluted stainless panel and the red band (the draft's blue was wrong). The
  ends differ: at end A the door is set back 1.4 m and the band sweeps round the panel in a red "D";
  at end B it runs on into the 13-panel red grille. Four single arms, two over each end.
- **BB 22200** (`frBb22200.ts`). The BB 7200 body, 17.48 m, the broken nose 0.6 m ahead of the cab
  front, the mesh band, the headstock with rectangular buffers, the plough; the stainless grille,
  two AM 18 pantographs (DC raised over cab 2, AC folded). `beton` (122342: the orange band dropping
  under the plate and turning up behind each door), `enVoyage` (522266: silver, sky-blue nose, the sky
  and clouds band; the draft's blue band was wrong) and `fret` (422369: grey, green nose and sweep,
  white FRET panel). The markings turn with the side.
- **CC 7100** (`frCc7100.ts`). Alsthom's Co'Co' of 1952 - 55, the NS 1300's sister: 17.62 m over the end
  faces, 18.92 m over buffers (fitted on CC 7121), with the French face from CC 7107 head-on: leaning
  back 0.22 m, two big windscreens, the handrail round the cab, the aluminium band with the stripe
  cut by the plate and the headlamps' rings, the SNCF roundel, marker pods, rectangular buffers.
  Sides: cab window, door, four aluminium-rimmed portholes, raised number. `blue` is CC 7107's
  blue-green, `green` CC 7102; the late two-tone is not drawn.
- **BB 9200** (`frBb9200.ts`). The B-B of 1957 - 64 with its own profile, measured on 9233 and 9291
  head-on and 9274 side-on: the cab end upright to an aluminium sill at 3.0 m, curved in plan, the
  window band set back and leaning to a visor at 3.62 m, two windscreens and curved corner windows,
  the aluminium moustache with the plate curving down to the SNCF disc. `blue` (titled "SNCF green") is the 1957 blue-green
  "vert" (BB 9274) with diamonds; `capitole` the red with the gris dauphin band and single arms (BB
  9291, 4,240 kW, 200 km/h).
- **BB 27000 Prima** (`frBb27000.ts`). Alstom's dual-voltage Bo'Bo' of 2001 - 06, 19.52 m, bogie
  centres 10.06 m: the upright bowed green nose with a small top headlight, perforated grilles, one
  trapezoid windscreen raked back in a grey surround. The sides differ (machine-room doors). `fret`
  turns about the vertical axis: metallic grey, green faces, one whole cab green to a leaning edge
  on each side, the white band with green italic FRET (the draft's stripes were wrong). 427020.
- **BB 67400** (`frBb67400.ts`). The two-cab B'B' measured on 67587, 67579, 67628 and 67517: 17.09 m,
  4.14 m high, bogie centres 9.8 m; the face upright to a sill at 2.62 m, the windscreen frame
  leaning back under a visor, the roof headlight box; the full-length skirt; the radiator grille
  at the +x end on both sides. `blueWhite` (67401: steel blue, the white bands, the white-edged navy
  arrow round the grille) and `fret` (467579).
- **CC 72000** (`frCc72000.ts`). Measured mainly on 72163 side-on: the nez casse face upright to
  2.45 m rounding into the 0.63 m bonnet, the windscreens leaning forward to a visor at 3.42 m, the
  long cab roof rising to the 4.29 m crown, the radiator louvres and the L-shaped ribbed grille
  behind cab 2, monomotor bogies 11.99 m apart. `blueWhite` is the 1967 "bleue diesel" (72084),
  `multiservice` (72068) follows the BB 22200's scheme (no CC photograph).

### Steam

- **241 P** (`fr241p.ts`). The de Glehn compound Mountain as preserved, 241 P 17 at Le Creusot: dark
  green with red lining, black smokebox, deflectors and wheels. Fitted along the coupled wheels
  (2.10 m pitch) to the published wheelbases (13.46 m engine, 23.50 m with tender): tall deflectors
  with folded tops, the stepped valance with round headlamps and the Le Creusot crest, the studded
  smokebox ring, the double chimney's oblong casing, the ACFI drum, outside LP cylinders over the
  bogie's rear axle driving the second coupled axle, the red beam "241.P" "17".
- **141 R** (`fr141r.ts`). 141 R 1199 as preserved (Baldwin 1947, oil-fired), green with red lining;
  photographs of 1199, 568, 840, 1108 and 1244: 14.64 m engine, 24.13 m with the 30 R tender, Boxpok
  drivers. The boiler on 2.97 m with the conical course, sand and steam domes, the Kylchap chimney
  and Worthington heater; large deflectors folding in at 3.2 m; the long deck with the air pump; the
  red beam "141 R 1199"; the American cab; the tender's bunker dropping in a round shoulder.

### Coaches

- **Corail** (`frCorail.ts`). The VTU 75 A10tu and B11tu share one shell (projective fits over four
  photographs): from each end a 1.56 m toilet bay, the 0.9 m swing-plug door, then ten 1.40 m windows
  on a 1.90 m pitch; point-symmetric sides; the skirt cut over Y 32 bogies 18.306 m apart. `corail`
  (1975: light grey, anthracite window band, orange doors, the class line at the eaves) and `teoz`
  (2003: metallic grey, blue or yellow window band, lime end bays with the class numeral).
- **Grand Confort** (`frGrandConfort.ts`). De Dietrich's 200 km/h TEE coaches of 1969 - 74, 25.5 m over
  buffers, the upper body leaning in 7 %. `a8u`: eight compartments, eight 1.83 m windows on 2.6 m.
  `a7d` is the A3rtu bar car (no "A7D" type exists): two windows stacked and a plug door at each
  end, eight 1.65 m windows, the BAR plate. Arzens's paint by height (red foot, grey, the orange line,
  the rouge Capitole window band, the slate roof); `capitole` (inox grey) and `tee` (1980s gris
  beton, the gold TRANS EUROP EXPRESS cartouche). The corridor side is drawn like the compartment side.
- **Wagons-Lits car** (`frCiwl.ts`). The 1920s steel body, 23.45 m over buffers, from Pullmans 4141,
  4018 and 4164, sleeping car 3552 and dining car 3348 (bogie centres 15.7 m): the blue vestibule at
  each end with doors both sides, the high elliptical roof rolling down over the end walls,
  torpedo vents. `pullman`: seven saloon windows with three-light top lights and an oval toilet
  window; `sleeping`: ten compartment windows one side, two blank panels the other. The letterboard
  "COMPAGNIE INTERNATIONALE DES WAGONS-LITS ET DES GRANDS EXPRESS EUROPEENS", the crest, the car's
  name and number. The sleeping car's type is uncertain (it may be a type S).

## Deviations

- **Nez casse.** Each nez casse locomotive has its own measured end profile; the plan curves of
  the real ends are still simplified to the box kit's end plan.
- **Ends and lengths.** The TGV M's 20.8 m end trailers, the Z 20500's short trailers and the
  Regiolis's splitting cars are drawn as their ordinary trailers; the Regio 2N's sides are
  mirror-symmetric.
- **Liveries.** The CC 6500's `beton` and the CC 72000's `multiservice` follow the BB 22200's scheme
  (no photograph of a CC in it); the TGV M's `ouigo` was never run.
- **CIWL.** One body for the Pullman and the sleeping car; the liveries are separate from the
  type of car, so a sleeping car can wear the Pullman's cream.

## Tests

`test/worldTrains.test.ts` (gauge, budget, published length, country, button titles),
`test/seriesCabFace.test.ts` (the MI 09's and X 3800's cab faces and the X 3800's turret),
`test/shinkansen.test.ts` (the TGV M's series) and the catalog sweep.
