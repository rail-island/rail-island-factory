# Spain's trains

**Covers** - the twenty Spanish designs of the eight-country plan: the AVE S-100 and S-103, the Talgo S-102 "Pato", S-106 Avril and S-130 Alvia and the Talgo III coaches, the S-120, the Civia, the 446, 440 and 592, Iryo's Frecciarossa 1000; the 354 "Virgen", 252, 269, 277, 319 and 333 locomotives; the 141F and 242F steam engines. Their modules, figures, the detail pass that matched each to its photographs, deviations and tests.
**Code** - `generator/esUnits.ts` (`ES_UNITS`, the units' registry), `generator/esLocos.ts` (`ES_LOCOS`, the locomotives' registry), one module per vehicle: `generator/esS100.ts`, `esS103.ts`, `esS102.ts`, `esS106.ts`, `esS130.ts`, `esTalgoIii.ts`, `esS120.ts`, `esCivia.ts`, `es446.ts`, `es440.ts`, `es592.ts`, `esIryoS109.ts`, `es354.ts`, `es252.ts`, `es269.ts`, `es277.ts`, `es319.ts`, `es333.ts`, `es141f.ts`, `es242f.ts`; `generator/worldSteamLocos.ts`, `generator/strokeFont.ts` (the f, l and v of "renfe" and "avlo"), `test/worldTrains.test.ts`, `test/loneJacobsCars.test.ts`, `test/seriesCabFace.test.ts`, `assets/renfe-*/`, `assets/talgo-iii/`, `assets/iryo-s109/`
**See also** - [shinkansen.md](shinkansen.md) (the series kit), [france-trains.md](france-trains.md) (the same pass for France), [netherlands-trains.md](netherlands-trains.md), [world-locos.md](world-locos.md), [world-steam.md](world-steam.md), [germany-trains.md](germany-trains.md) (the ICE 3's cab face)

The catalog had no Spanish train before. Every design is filed under Spain.

## The designs

| id | title | built on | parameters (default first) | figures (game) |
|---|---|---|---|---|
| `proc-vehicle-renfe-s100` | AVE S-100 | series, own cab face, power cars and Jacobs trailers (`esS100.ts`) | `unit`, `cars` 3 - 8, `livery` (`ave`, `avlo`) | power cars 22.15 m, trailers 18.7 m; 68 / 32 t, 300 km/h |
| `proc-vehicle-renfe-s103` | AVE S-103 | series, the ICE 3's cab face (`esS103.ts`) | `unit`, `cars` 2 - 8 | 200.32 m for eight; 425 t, 8,800 kW, 350 km/h |
| `proc-vehicle-renfe-s102` | AVE S-102 Pato | series, own duck-bill face, Talgo coaches (`esS102.ts`) | `unit`, `cars` 3 - 8, `livery` (`ave`, `avlo`) | power cars 20.0 m, coaches 13.14 m; 72 / 15 t, 330 km/h |
| `proc-vehicle-renfe-s106` | Talgo Avril S-106 | series, own cab face, Talgo cars (`esS106.ts`) | `unit`, `cars` 3 - 8, `livery` (`avlo`, `ave`) | power cars 19.37 m, cars 13.21 m; 68 / 16 t, 330 km/h |
| `proc-vehicle-renfe-s130` | Alvia S-130 | series, own cab face, Talgo coaches (`esS130.ts`) | `unit`, `cars` 3 - 8 | power cars 20.0 m; 72 / 18 t, 250 km/h |
| `proc-vehicle-talgo-iii` | Talgo III | series, unpowered, tail face, single axles at the joints (`esTalgoIii.ts`) | `unit`, `cars` 3 - 8 | 11.1 m boxes on an 11.6 m pitch; 160 km/h |
| `proc-vehicle-renfe-s120` | Renfe S-120 | series, own cab face (`esS120.ts`) | `unit`, `cars` 2 - 4, `livery` (`alvia`, `mediaDistancia`) | 27.35 / 26.13 m (106.96 m for four); 1,000 kW a car, 250 km/h |
| `proc-vehicle-renfe-civia` | Renfe Civia | series, cab face, Jacobs (`esCivia.ts`) | `unit`, `cars` 2 - 5 | end 22.4 m, middle 17.75 m (98.05 m for five); 440 kW a car, 120 km/h |
| `proc-vehicle-renfe-446` | Renfe 446 | series, cab face (`es446.ts`) | `unit`, `cars` 2 - 3 | M-R-M 75.99 m; 59 / 48.6 t, 2,400 kW, 100 km/h |
| `proc-vehicle-renfe-440` | Renfe 440 | series, cab face (`es440.ts`) | `unit`, `cars` 2 - 3, `livery` (`regional`, `cercanias`) | 80.16 m; 150.4 t, 1,160 kW, 140 km/h |
| `proc-vehicle-renfe-592` | Renfe 592 | series, cab face, diesel (`es592.ts`) | `unit`, `cars` 2 - 3, `livery` (`regional`, `mediaDistancia`) | 23.66 / 22.9 m (70.22 m); 47 / 36 t, 120 km/h |
| `proc-vehicle-iryo-s109` | Iryo Frecciarossa 1000 | series, own cab face (`esIryoS109.ts`) | `unit`, `cars` 2 - 8 | 27.6 / 24.47 m (202 m for eight); 9,800 kW, 360 km/h |
| `proc-vehicle-renfe-354` | Renfe 354 Virgen | own lofted body, diesel (`es354.ts`) | - | B'B', 19.92 m, 80 t, 3,070 kW, 200 km/h |
| `proc-vehicle-renfe-252` | Renfe 252 | box locomotive, own profile (`es252.ts`) | `livery` (`ave`, `mercancias`) | Bo'Bo', 20.38 m, 5,600 kW, 220 km/h |
| `proc-vehicle-renfe-269` | Renfe 269 | box locomotive, own profile (`es269.ts`) | `livery` (`taxi`, `estrella`) | B'B', 17.27 m, 3,100 kW, 140 km/h |
| `proc-vehicle-renfe-277` | Renfe 277 | own shell, double-ended (`es277.ts`) | `livery` (`green`, `blue`) | Co'Co', 20.567 m, 120 t, 2,208 kW, 110 km/h |
| `proc-vehicle-renfe-319` | Renfe 319 | box locomotive, hood, diesel (`es319.ts`) | `livery` (`estrella`, `mercancias`) | Co'Co', 19.50 m, 116 t, 1,500 kW, 120 km/h |
| `proc-vehicle-renfe-333` | Renfe 333 | box locomotive, own profile, diesel (`es333.ts`) | `livery` (`mercancias`, `talgo`, `operadora`) | Co'Co', 22.33 m, 120 t, 2,460 kW, 120 km/h (160 in `talgo`) |
| `proc-vehicle-renfe-141f` | Renfe 141F Mikado | steam, own spec (`es141f.ts`) | `unit` | 1'D1', 1.56 m drivers, 19.57 m with tender; 103 + 63.5 t, 1,460 kW, 90 km/h |
| `proc-vehicle-renfe-242f` | Renfe 242F | steam, own spec (`es242f.ts`) | `unit` | 2'D1', 1.9 m drivers; 142.5 + 70.2 t, 1,990 kW, 135 km/h |

The figures are the published ones (each `assets/<name>/SOURCES.md`). A power-car train's
game power is the kit's power a vehicle times its vehicles, unpowered coaches included (the
S-102's, S-106's and S-130's trains state more than the real ones).

## The detail pass (2026-11)

Every design was reshaped from photographs with the detailed-vehicle skill
(`.agents/skills/detailed-vehicle/`), one agent per vehicle, each reviewed against the
photographs before it was merged: at least three photographs of the class and livery (stored
in `assets/<name>/` with their `SOURCES.md`), measured in px/m with projective fits along the
side, published figures overriding photo estimates, and a render-and-compare loop. Each
vehicle moved to its own module; the registries only list them, and the shared `velaro()` and
`talgo()` bodies are gone. Published figures that contradicted the draft were corrected in
`game`, `factTable.ts` (the 354's year, 1983) and the OpenTTD capacities (seats of the S-100,
S-102, S-106, S-120, Civia, 446, 440, 592 and S-109; [openttd-figures.md](openttd-figures.md)).
The kits were only extended with optional fields whose defaults keep every other design
byte-identical (hash-checked, `.agents/skills/detailed-vehicle/scripts/hash.mts`): the series
kit's `endCarBogie`, `endCarRunningGear`, `jacobsEndTrailerLayout`, `loneJointAxleInset`,
`jointShroudProfile`, `bufferHeadShape`, `windowFrameMat`, `bufferGap`, `pantographKneeForward`,
the fittings' `rearEndCar`, `lodMiddleRoofBlocks` and `endLettering`'s `letterStroke`
([shinkansen.md](shinkansen.md)); the car builder's `bufferHeadShape` and `letterStroke`
([us-transit.md](us-transit.md)); `sideLettering`'s stroke width (`sliceBody.ts`); the stroke
font's f, l and v. The French designs added more ([france-trains.md](france-trains.md)).

### Units

- **S-100** (`esS100.ts`). The TGV Atlantique's sister with its own cab face: the big white
  bumper with a centre seam over the graphite plough, the dark lamp slot wrapping round the
  corners with a perforated grille between the lamps, the long bonnet with "renfe" and the AVE
  logo, the slatted visor, the two-pane windscreen in a graphite canopy, the roof lamp. Power
  cars 22.15 m: raked nose hatch, cab door with an oval window, machine-room door, raised roof
  6.2 - 18.5 m, louvred; one single arm over the rear bogie; bogies 14 m apart. The 3.42 m low
  trailers ride on Jacobs bogies; the end trailers have their own bogie by the power car and the
  vestibule's two doors (`jacobsEndTrailerLayout`), the intermediates a door at the front and
  seven windows. `avlo` is the S-112's paint on the S-100 (never run). All trailers are 18.7 m
  (the end trailers are 21.845 m).
- **S-103** (`esS103.ts`). The Velaro E on the ICE 3's cab face (`ICE3_FACE`, `deIce3.ts`) with
  its own paint: the silver lip under the canopy holding the upper lamp and framing the glass,
  the slanted lamp clusters, the grey roof; white with the purple band (1.36 - 1.60 m) and a grey
  line, both diving down the nose across the coupler cover. End car: raked three-pane window,
  door at 8.45 m with a tall oval window, one band of wide and narrow panes, "renfe" over "AVE"
  on the blank rear section; intermediates: door at the front end. Pantographs on the second and
  next-to-last cars. 103 019. The canopy glass is near-black; no cafeteria layout; the car lengths
  and bogies are the ICE 3's.
- **S-102 Pato** (`esS102.ts`). Two 20.0 m power cars and 13.14 m Talgo coaches. The duck-bill
  cab face on its own depth function (`patoDepth`, the CRH380A's technique): the long flat bill
  rounded in plan with a 1.02 m lip, rising to the windscreen's foot 3.0 m back; lamp eyes in
  pointed lenses on the bill's upper corners; the narrower silver canopy with raked windscreen
  and side windows reaching the 4.0 m roof 7 m back; panel seams. Power cars on Bo'Bo' bogies
  10.8 m apart (`endCarBogie`); coaches on single axles shared at the joints (`jacobsTrailers`);
  the coach next to each power car carries a roof fairing at power-car height for 4.4 m. The AVE
  scheme (grey line over a purple stripe wrapping the lip) and Avlo (magenta, lilac canopy,
  falling orange, white and blue stripes). The crew door uses the coaches' door heights; Avlo
  coaches keep the S-102 window layout; the lettering is upright, not italic.
- **S-106 Avril** (`esS106.ts`). Two 19.37 m power cars without passengers (a luggage room,
  so their doors do not open), on two-axle bogies 8.9 m apart (`endCarRunningGear`); 13.21 m
  cars with a lower roof (3.55 vs 4.0 m) on single axles at the joints, one door at the front
  and five windows. The short tall nose on its own depth solid (`avrilDepth`): the bumper bulb
  upright 0.5 - 1.76 m, the grille and lamp window upright to 2.3 m, the hood rising at about 40
  then 27 degrees to the roof 7.5 m back; the dark mask only round the windscreen; almond
  headlights at the bumper's shoulder. Avlo (magenta, broad orange, white and turquoise sweeps
  over the cab door, orange doors on the cars) and AVE (pearl white, aubergine line, the big AVE
  and V). 3.02 m wide for the UIC gauge (3.2 m real); the 14.94 m end trailers are drawn like
  the others.
- **S-130 Alvia** (`esS130.ts`). The Talgo 250 "Patito": a cab face on its own depth solid
  (`s130Depth`) - the coupler-cover bill 0.55 - 1.45 m high under a short bonnet with a louvred
  grille, wedge headlights round its corners, the grey canopy with a near-upright windscreen
  2.8 - 3.62 m under a three-lamp strip, cab side windows sweeping 3.6 m back. Power cars 20.0 m,
  4.0 m high, on two-axle bogies at 8.4 and 17.4 m (`endCarBogie`), two single arms mid-roof;
  coaches 3.36 m high (`trailerSection`) on single axles shared at the joints, one door at the
  front and five windows. White, grey canopy and power-car roof, two purple stripes dipping
  toward the nose. The crew door has the coaches' door heights; the end coaches' ramped roof is
  not drawn.
- **Talgo III** (`esTalgoIii.ts`). The riveted aluminium set of 1964 - 2010: 11.1 m boxes on an
  11.6 m pitch, 3.4 m high on a 0.4 m skirt, one wheel pair per joint shared (Jacobs on single
  axles) and the tail car's own pair; a lone car stands on its own axles 0.85 m inside its ends
  (`loneJointAxleInset`). Silver, ribbed above and below the smooth red window band between dark
  lines. Intermediate car: the louvred A/C hatch, four 1.5 m windows in silver frames
  (`windowFrameMat`), a door with a 0.72 m round window. The tail: a flattened half ellipse in
  plan, the riveted dome with seams, the red porthole door with its bright ring, high markers,
  low lamps, flat rectangular buffer plates 0.3 m out of the apron (`bufferHeadShape`,
  `bufferGap`), no beam; a dark rubber shroud at each joint (`jointShroudProfile`). 160 km/h.
  The car ends at the joints are square; the tail car stands at both ends in place of the
  baggage van.
- **S-120** (`esS120.ts`). CAF and Alstom's dual-gauge 120/121 with its own cab face: the rounded
  white pillow bumper (corner radius 1.0 m) with a coupler hatch and the renfe logo, the black face
  behind with two headlight housings low at the corners and the big windscreen raked about 47
  degrees under a grey cap with a lamp strip. The black window band from the raked cab-side
  triangle; one 1.0 m plug door a side on every car; black fairings over every joint; a single arm
  over each end car's inner end. Cars 27.35 and 26.13 m, 2.92 m wide, the leading bogie 6 m behind
  the tip. Alvia (white, two purple stripes ending at the bumper) and Media Distancia (orange over
  purple across the bumper). No "Alvia" on the bumper.
- **Civia** (`esCivia.ts`). Two to five cars (A1, A5, A3, A4, A2): end cars 22.4 m, intermediates
  17.75 m on Jacobs bogies, a trailer bogie under each cab. The face raked about 45 degrees: a dark
  shield round a big windscreen holding the cap with "076 M", the headlight, markers and display;
  the red frame drops round the corner lamps to the coupler cover between white cheeks. Cercanias
  sides: a red line over the purple band sweeping into the red wedge; white double doors, two a
  side per car (the Commons side drawing). Light grey roof with dark louvred fairings; both single
  arms on the A3's ends. One intermediate layout (no low-floor A3); no renfe lettering.
- **446** (`es446.ts`). The three-car Cercanias unit M-R-M of 1989, 75.99 m, 2.94 m wide, with its
  own cab face: the flat front slightly raked, the one-pane windscreen in a black surround, the red
  cap with number, display, twin headlight and markers, the white lower face with the C emblem,
  lamp boxes over the dark bumper, the Scharfenberg coupler in its recess. Three 1.3 m double
  doors a side per car. The current scheme: red line under the roof, red over purple low,
  sweeping to the skirt behind the cab, red cab sides. Motor cars: the louvred resistor fairing;
  the trailer carries both single arms near its ends. 240 seats. No renfe lettering; the car
  lengths are estimated within the published total.
- **440** (`es440.ts`). The unrebuilt 440 of the 1990s with its own cab face: the flat front leaning
  back 0.12 m over the low windscreens, the gangway door between them, the double headlamp and the
  markers on the roof dome, the buffers out of the bodywork. Two 1.6 m double doors a side per car.
  The motor car leads (cab window, the former luggage-room door, resistor grids, two single arms,
  knees inward: `pantographKneeForward`); the driving trailer has the cab door and three windows
  (the fittings' `rearEndCar`). `regional` is the Regionales R2 white and orange (the draft's green
  was wrong), `cercanias` white over navy with the red front, roof and cab end. 80.164 m, 260
  seats. The side number 125M stands on every car; the original blue and yellow is not drawn.
- **592** (`es592.ts`). MAN and Macosa's three-car diesel-hydraulic M-R-M "camello" (motor cars
  23.66 m, trailer 22.9 m, 2.86 m wide). Its own cab face measured head-on (121 px/m): three
  windscreens with the gangway door between, the twin top headlight between markers,
  asymmetric lower lamps, the automatic coupler between grey anticlimbers. The camel humps: two
  A/C boxes a car (flat top 3.86 m), each ending in a louvred slope over a door, in the distant
  model too (`lodMiddleRoofBlocks`). Three saloons a car between two single-leaf doors a side;
  two engines under each motor car, a generator set under the trailer. `regional` (the 1990s
  Regionales slate band and red stripe, 592 015) and `mediaDistancia` (white with orange and
  purple lines, dark grey roof and cab cap). One face (the as-built lamps) for both liveries.
- **Iryo S-109** (`esIryoS109.ts`). The Frecciarossa 1000: 27.6 m end cars and 24.47 m
  intermediates (202 m), bogie centres 17.4 m, the leading bogie 5.4 m behind the tip under the
  nose, which meets the body 7.4 m back. The long nose on its own depth solid: the blunt
  coupler cap, the top rising in one convex line to the roof 6.2 m back, the black visor round
  a large windscreen. Silver below, the red band, the black window band between thin silver lines,
  red to the shoulder, dark roof; on the nose the black band narrows to the lamps. The bold "iryo"
  (`letterStroke`). Doors at both ends of each intermediate and the inner end of each end car;
  single arms on cars 2, 4, 5 and 7. The cap is not a separate bumper; the car lengths come from
  photographs.

### Locomotives

- **354 "Virgen"** (`es354.ts`). The Krauss-Maffei B'B' diesel-hydraulic "4000-T" of 1982 - 84,
  354 001 "Virgen de Covadonga" in the Talgo Pendular's dark blue and cream: 19.92 m, a low 3.45 m
  body, bogies 10.4 m apart. Its own lofted shell with a cab at each end (the rear one the front one
  turned; both ends shown by the user's Arnold HN2504 model of 354 003): an upright cream bumper and
  a bowed upper face leaning back over three aluminium-framed windows, a corner window wrapping each
  rounded corner, the roof hump with the twin headlight pod. The side is symmetric about the middle:
  14 upper grilles at 0.94 m between the doors, the big lower grille behind each door and four in
  the middle, a cream bar either side; each cab's cream band wraps to its door. No Talgo script logo.
- **252** (`es252.ts`). Siemens and Krauss-Maffei's Eurosprinter on the box kit, measured on 066
  side-on (75 px/m) and 024 head-on: 20.38 m, 3.0 m wide, bogie centres 10.5 m. The raked face from
  1.38 m to the windscreen (2.74 - 3.58 m, about 25 degrees), the twin top headlight, upright walls
  to 3.44 m under a leaning cant with the machine room's panes, the raked cab side window, single
  arms over the cab ends with the roof line. `ave` (252-003: white, graphite cap, navy line, the
  bird and the AVE wordmark) and `mercancias` (252-024: ivory, the dark cap sweeping under the cab
  window, two purple stripes, green roof plates). The door ports and mirrors are not drawn.
- **269** (`es269.ts`). The Mitsubishi and CAF B'B' on the box kit with its own profile: 17.27 m,
  the face upright with 0.3 m corners, two windscreens wrapping round them under a brow rounding
  back into the 3.80 m roof, the top headlight between two horn covers, four round lamps low. From
  each end: cab window, cab door, narrow window, two louvre grilles, a window in the middle. `taxi`
  (269-038: blue-grey, yellow cab ends and top strip) and `estrella` (269-307: orange, not the
  draft's blue and white). Generic bogies; 160 km/h for the Estrella is not set per livery.
- **277 "Inglesa"** (`es277.ts`). English Electric and Vulcan's 7700 of 1952: a double-ended Co'Co'
  with the rounded nose 2.8 m ahead of the cab at each end (one half the other turned round, as the
  user's side view of 7722 shows), 20.567 m. Its own shell, measured on 7702 (head-on, 107 px/m), 7766 and 277 002 / 026 / 047: the
  headlight on the nose top, lamps in round pods, the nose door, the yellow line round the corners
  into a V, the red beam between black buffer housings, the deep skirt rising over the outer
  wheels; two diamonds at +3.0 m (raised) and -4.0 m; pivots 10.04 m apart. `green` is Renfe's dark green
  (7701); `blue` (277 015) is unverified.
- **319** (`es319.ts`). The GM-EMD Co'Co' as the rebuilt 319.2 / .3 carbody of 1984 - 92 (the draft
  was a streamlined GM nose), measured on 319.254 side-on and 319.310 head-on: 19.50 m, 4.145 m
  high, drawn 3.0 m wide (3.08 real). The flat face with chamfered corners, the brow sloping back
  to the twin headlight box, two windscreens, 2.1 m yellow cabs with raked sliding windows; the
  hood with the intake grille, two rows of louvres and the radiator housing with two fans; GM
  three-axle bogies. `mercancias` is 319.254 (grey, yellow cabs, big number), `estrella` 319.310
  that hauled the Estrella trains (dark hood, yellow "319.3"); no photograph of the brown and
  cream Estrella 319.2 was found.
- **333** (`es333.ts`). The rebuilt 333.3 / .4 (Alstom Valencia 2002 - 06, Prima-family cabs):
  22.33 m, 3.16 m wide (the `us` gauge the broad gauge allows). The flat face leaning back from
  1.95 m, one 2.13 m windscreen in a black frame, hooped handrails, the black beam with square
  buffer housings; the long hood's ribbed panels and the cant's filter grilles; flexicoil bogies
  7.1 m either side of the middle. `mercancias` is the early yellow and silver (333 301), `talgo`
  the Trenhotel ivory and bronze (333 407, 160 km/h), and `operadora` (Renfe Operadora, 333 333)
  today's scheme from 333 333, 352, 353 and 359: ivory cabs, a graphite hood up to the ribs' top
  under the silver-grey band, cant and roof, a purple line low on each cab side, the big ivory
  "renfe" mid-hood and the purple "renfe Mercancias" on the face.

### Steam

- **141F** (`es141f.ts`). 141F 2111 "Galicia" as preserved in Madrid, measured on 2295 (133 px/m),
  2348 and 2111 (a projective fit along the boiler): 1,560 mm drivers, 10.85 m engine wheelbase,
  19.57 m with the tender. The high running board whose red edge drops steeply to the front deck
  and the red beam; tall deflectors; the graphite smokebox with the heater box and big headlamp; the
  stepped boiler with six brass bands; red rods driving the third coupled axle; the closed cab. The
  bogie tender's tall tank with its rounded foot and shoulder. The distant model keeps the
  deflectors and the running board's slope.
- **242F** (`es242f.ts`). The preserved 242F 2009 at Madrid Delicias, a 2'D2' with a two-bogie tender,
  by a projective fit over six axles (70.5 px/m) and head-on (281 px/m): engine 17.48 m, 1.9 m
  drivers. The black lengthened smokebox with its grey front ring and dished door, the brass
  headlamp with the "2009" box behind; big deflectors, green outside and black inside; the red beam
  "RENFE 242F 2009"; the red S-edged running board; red hubs and rods. The green tender's top slopes
  down over its last 2 m. 15,536 triangles. Plain deck, flat deflectors, no monograms.

## Deviations

- **Gauge.** The Iberian broad gauge (1,668 mm) stock keeps its bodies on the game's
  standard-gauge wheelsets; the broad bodies are drawn within the UIC gauge (the S-106 at
  3.02 m, the 319 at 3.0 m), the 333 in the `us` gauge.
- **Talgo.** The S-102, S-106 and S-130 coaches and the Talgo III share one wheel pair at each
  joint as the real trains do; the car ends at the joints are square, and the end coaches'
  special shapes (the S-130's ramped roof, the S-106's shorter end trailers, the Talgo III's
  baggage van) are not drawn.
- **S-100.** Drawn on the series kit with its own cab face, not on the TGV builder (`tgv.ts`);
  every trailer is 18.7 m long.
- **Power.** A power-car train's game power counts its unpowered coaches (above).

## Tests

`test/worldTrains.test.ts` (gauge, budget, published length, country, button titles; the
S-106's power cars keep their doors shut), `test/loneJacobsCars.test.ts` (the Talgo III's lone
cars on their own axles), `test/seriesCabFace.test.ts` (the cab faces) and the catalog sweep.
