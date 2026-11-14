# Germany's trains

**Covers** - the twenty German designs of the eight-country plan: the ICE 3, ICE 4, ICE T and ICE 2, the S-Bahn BR 423, the Desiro 642, the RegioShuttle 650, the Uerdingen railbus VT 98 and the Fliegender Hamburger; the BR 103, 101, 120, E 18, E 94, V 200 and 218 locomotives; the 01, 52 and Prussian P 8 steam engines; the Intercity coaches. Their modules, figures, the detail pass that matched each to its photographs, deviations and tests.
**Code** - `generator/deUnits.ts` (`DE_UNITS`, the units' registry), `generator/deLocos.ts` (`DE_LOCOS`, the locomotives' registry), one module per vehicle: `generator/deIce3.ts`, `deIce4.ts`, `deIceT.ts`, `deBr423.ts`, `deBr642.ts`, `deBr650.ts`, `deVt98.ts`, `deSvt877.ts`, `deIce2.ts`, `deBr103.ts`, `deBr101.ts`, `deBr120.ts`, `deE18.ts`, `deE94.ts`, `deV200.ts`, `deBr218.ts`, `deSteam01.ts`, `deSteam52.ts`, `deSteamP8.ts`, `deIcCoach.ts`; `generator/worldSteamLocos.ts`, `generator/worldCoaches.ts`, `test/worldTrains.test.ts`, `test/deE18.test.ts`, `assets/db-*/`, `assets/drg-*/`, `assets/dr-52/`, `assets/kpev-p8/`
**See also** - [shinkansen.md](shinkansen.md) (the series kit), [world-locos.md](world-locos.md), [world-steam.md](world-steam.md), [steam-locomotives.md](steam-locomotives.md), [world-coaches.md](world-coaches.md), [foreign-units.md](foreign-units.md) (the ICE 1), [mainline-electrics.md](mainline-electrics.md)

The catalog already had the DB 111, 212 and 628, the Dosto, the ICE 1, the DR 243,
the Berlin S-Bahn coach, the VT 18.16 and the Vectron; none is repeated here. Every
design is filed under Germany (`generator/countryTable.ts`).

## The designs

| id | title | built on | parameters (default first) | figures (game) |
|---|---|---|---|---|
| `proc-vehicle-db-ice3` | ICE 3 | series, own cab face (`deIce3.ts`) | `unit`, `cars` 3 - 8, `livery` (`dbIce`, `nsInternational`) | end 25.675 m, middle 24.775 m, 3.89 m high; 330 km/h |
| `proc-vehicle-db-ice4` | ICE 4 | series, cab face (`deIce4.ts`) | `unit`, `cars`, `livery` (`dbIce`, `greenStripe`) | 29.106 / 28.75 m; 250 km/h |
| `proc-vehicle-db-ice-t` | ICE T | series, cab face, tilting section (`deIceT.ts`) | `unit`, `cars`, `livery` (`dbIce`, `obb`) | 27.45 / 25.9 m, bogie centres 19.0 m; the end cars' pantographs; 230 km/h |
| `proc-vehicle-db-ice2` | ICE 2 | ICE 1 builder (`ice2` option) + series cab face (`deIce2.ts`) | `unit` (`powerCar`, `coach`, `drivingTrailer`) | power car and coaches in the ICE 2's paint, a 26.40 m driving trailer with the 402's face; 280 km/h |
| `proc-vehicle-db-423` | DB 423 | series, cab face, Jacobs (`deBr423.ts`) | `unit`, `cars` 4, `livery` (`sBahn`) | Bo'(Bo')(2')(Bo')Bo', end cars 18.24 m to the joint, middle cars 15.46 m, 67.4 m; one pantograph; 140 km/h |
| `proc-vehicle-db-642` | DB 642 Desiro | series, diesel, cab face, Jacobs (`deBr642.ts`) | `unit` (`endCar`, `train`), `cars` 2, `livery` (`dbRegio`, `erzgebirgsbahn`) | B'2'B', two cars, 41.7 m, 2 x 275 kW; 120 km/h |
| `proc-vehicle-db-650` | RegioShuttle RS1 | series, diesel, single, cab face (`deBr650.ts`) | `livery` (`dbRegio`, `odeg`) | 25.5 m over buffers, 2.9 m wide; 120 km/h |
| `proc-vehicle-db-vt98` | Uerdingen railbus VT 98 | series, diesel, single, cab face (`deVt98.ts`) | `livery` (`dbRed`, `orientRed`) | 13.95 m over buffers, 2.92 m wide, two axles 6 m apart; 90 km/h |
| `proc-vehicle-drg-svt877` | Fliegender Hamburger | series, diesel, cab face, Jacobs (`deSvt877.ts`) | `unit`, `cars` 2, `livery` (`drg`, `dbVt04`) | 2'Bo'2', two cars on three bogies, 41.92 m; 2 x 302 kW, 160 km/h |
| `proc-vehicle-db-103` | DB 103 | box locomotive, own profile (`deBr103.ts`) | `livery` (`tee`, `orientRed`, `trafficRed`) | Co'Co', 20.2 m (103 216 - 245), 7,440 kW, 200 km/h |
| `proc-vehicle-db-101` | DB 101 | box locomotive, own profile (`deBr101.ts`) | `livery` (`trafficRed`, `intercity`) | Bo'Bo', 19.1 m, 6,400 kW, 220 km/h |
| `proc-vehicle-db-120` | DB 120 | box locomotive, own profile (`deBr120.ts`) | `livery` (`orientRed`, `trafficRed`) | Bo'Bo', 19.2 m, bogies 10.2 m apart, 5,600 kW, 200 km/h |
| `proc-vehicle-drg-e18` | DRG E 18 | box locomotive, own profile and running gear (`deE18.ts`) | - | 1'Do1', 16.92 m, 1.6 m drivers, 3,040 kW, 150 km/h |
| `proc-vehicle-drg-e94` | DRG E 94 | box locomotive centre body + own hood shells (`deE94.ts`) | - | Co'Co' crocodile, 18.6 m, 3,300 kW, 90 km/h |
| `proc-vehicle-db-v200` | DB V 200 | box locomotive, own profile (`deV200.ts`), diesel | `livery` (`dbRed`, `orientRed`) | B'B', 18.53 m, 4.16 m high, bogies 11.5 m apart, 2 x 810 kW, 140 km/h |
| `proc-vehicle-db-218` | DB 218 | box locomotive, own profile (`deBr218.ts`), diesel | `livery` (`purpleRed`, `orientRed`, `trafficRed`) | B'B', 16.4 m, bogies 8.6 m apart, 1,840 kW, 140 km/h |
| `proc-vehicle-drg-01` | DRG 01 | steam, own spec (`deSteam01.ts`) | `unit` | 2'C1' h2, 2.0 m drivers, Wagner deflectors, 2'2' T 32 tender, 23.94 m; 1,670 kW, 130 km/h |
| `proc-vehicle-dr-52` | DR 52 | steam, own spec (`deSteam52.ts`) | `unit` | 1'E, 1.4 m drivers, the 52.80 rebuild with the T 30 tub tender, 22.975 m; 1,192 kW, 80 km/h |
| `proc-vehicle-kpev-p8` | Prussian P 8 | steam, own spec (`deSteamP8.ts`) | `unit`, `livery` (`kpev`, `drBlack`) | 2'C, 1.75 m drivers, T 21.5 tender, 18.585 m; 868 kW, 100 km/h |
| `proc-vehicle-db-ic-coach` | DB Intercity coach | coach kit (`deIcCoach.ts`) | `unit` (`avmz`, `bpmz`), `livery` (`tee`, `oceanBlue`, `intercity`) | 26.4 m over buffers, bogies 19.0 m, 200 km/h |

The figures are the published ones (each `assets/<name>/SOURCES.md`): Wikipedia's
articles on each class, cited there, and the works drawings where one was found.
Seats and introduction years are in `generator/openttdTable.ts` and
[openttd-figures.md](openttd-figures.md).

## The detail pass (2026-11)

Every design was reshaped from photographs with the detailed-vehicle skill
(`.agents/skills/detailed-vehicle/`): at least three photographs of the class and
livery, measured in px/m (or a works drawing), published figures overriding photo
estimates, and a render-and-compare loop. Each vehicle moved to its own module so
its geometry is stated in one place; the registries only list them. The kits were
only extended with optional fields whose defaults keep every other design
byte-identical (hash-checked): the series kit's `endCrownStep`,
`pantographsBesideEnds`, `tiltSection`, `doorGlassR`, `exhaustAt`, `bufferBeam`,
`rearEnd` and `exhaustInFittings` ([shinkansen.md](shinkansen.md)), the steam
kit's `bogieFrameMat` and `drawOnTruckFrame`
([steam-locomotives.md](steam-locomotives.md)), the car kit's single rounded door
window, `bufferBeam`, a window row's `glass` and the doors' `glassInward`
([us-transit.md](us-transit.md)).

### Units

- **ICE 3** (`deIce3.ts`). Its own cab face; the CRH3C and the AVE S-103 keep the shared
  `velaro()` body. The round snout with the coupler cover's front 1.24 m up rises steeply
  past the louvred, slanted lamp clusters and the upper lamp to the tinted canopy
  (2.4 - 3.65 m) that wraps onto the sides; the face joins the body 7 m back. The red stripe
  crosses the coupler cover and sweeps up the nose to the body stripe, broken by the grey
  "ICE". The lounge's raked window band runs behind the cab; each intermediate car has one
  door a side at its front end. Single-arm pantographs on low fairings on cars 2 and 7.
- **ICE 4** (`deIce4.ts`). Measured on DB Fernverkehr's 7-car data sheet drawing. The bumper
  upright from 0.85 to 1.4 m, the face raked to the windscreen's foot, the windscreen about
  27 degrees to 3.45 m; the end car's 3.87 m roof rising to the middle cars' 4.1 m over its
  rear third. The black mask between grey side bands, the leaning LED clusters, the DB logo;
  the stripe round the bumper sweeping up to the grey "ICE", then at 1.45 - 1.68 m along
  every car; windows in an anthracite band; the middle car is the pantograph car.
- **ICE T** (`deIceT.ts`). The section tucked in under the belly and drawn in over a flatter
  roof (`tiltSection`); the cab face with the round bumper, slanted lamp clusters and the
  big raked windscreen; the lounge's black glass pointing toward the nose; one door a side
  about a third along each car; the end cars (the transformer cars) carry the pantographs.
  The OBB units' stripe is broken by the red OBB lettering too.
- **BR 423** (`deBr423.ts`). Matched to the DB works drawing. A blunt face (bumper at
  1.33 m, about 20 degrees of lean) with the big grey mask holding the windscreen and the
  display, running over the top onto the grey cab cap; the oval lamps on the corners. Four
  cars on five bogies (Jacobs bogies under the joints); three double plug doors a side on
  every car; S-Bahn red with the light grey band, light grey doors; the unit's single
  pantograph on the second car beside the middle joint; air conditioning on every car.
- **Desiro 642** (`deBr642.ts`). The grey cap rolling down to the windscreen, which leans
  back and wraps round deep corners as one lens with the display; the protruding lower
  bumper with the coupler recess, the light grey stripe wrapping round it. Four high-floor
  windows, one double door a side and five taller low-floor windows; the two cars share a
  Jacobs bogie (`jacobsInset`). The Erzgebirgsbahn's units wear DB Regio red with their name.
- **RegioShuttle RS1** (`deBr650.ts`). The same cab face at both ends: upright to the lamps,
  leaning back past the windscreen in its black surround and rounding into the roof 1.2 m
  back; round headlights, buffers and screw coupling. Two 1.6 m double doors a side, the
  window bands with the slanting pillars measured on a side-on photograph, bogies 17.1 m
  apart. DB Regio 650 322 and ODEG VT 650.62 (yellow face and ends, silver body, green
  stripes, yellow door bays).
- **VT 98** (`deVt98.ts`). Each end a cab face measured head-on: upright, corners rounded
  0.42 m, the roof dome rounding back 0.55 m to the crown with the roof lamp; two big front
  windows and corner windows wrapping onto the cab sides; headlamps in chrome rings; buffers
  standing out of the bodywork with no beam (`bufferBeam: false`). A folding door behind each
  corner window, seven side windows; the aluminium strip at 1.80 - 1.90 m (not a cream
  band); the side walls hide the wheel tops; two single axles 6.0 m apart on leaf springs.
- **SVT 877** (`deSvt877.ts`). The rounded nose (silver skirt rounding under it, the bumper
  standing proud, the violet front almost upright, the dome falling from the crown) with
  corner panes wrapping back; full silver skirts open below over every bogie; two cars on a
  Jacobs bogie, the rear car with its own layout (`rearEnd`); the stack on the dome
  (`exhaustInFittings`). DRG violet and ivory with gold lines and "DEUTSCHE REICHSBAHN".

- **ICE 2** (`deIce2.ts`). The power car and the coach are the ICE 1's builders with
  `ice2`: the traffic-red stripe without the pink line, raised under the coaches' windows
  (1.62 - 1.86 m) and on the power car swept down to the nose's crossing, the 402's split
  coupler flap with the guide horn, the DB logo in the stripe. The driving trailer (808) is
  a series end car with a cab face from the photographs: the two-pane windscreen
  (2.56 - 3.34 m), upper lamp, paired head and tail lamps with the slatted grille, the
  bulging split flap with the stripe across it sweeping up the flanks, the raked cab side
  window, the grey ICE, one door and nine 1.5 m panes; 26.40 m from the published 205.36 m
  half train.

### Locomotives

- **BR 103** (`deBr103.ts`). Upright below the waist, the lower face leaning only 6 - 8
  degrees to the windscreen sill, the windscreen about 30 degrees, the roof reached 1.4 m
  behind the sill (after the user's side view of 103 113). Elliptic corners so the windscreen
  wraps; the large raked cab window; lower headlights in teardrop housings standing out of
  the face; buffers out of the red front, no beam. Five bays of tall grey louvred panes; a
  grey hood with louvres; red single-arm pantographs near the cabs. TEE: beige over purple
  red down to the skirt's edge, the cream line in the red; orient red with the light grey
  bib; traffic red with the white front band and grey skirt. Only the long-cab locomotives
  (103 216 - 245) are drawn.
- **BR 101** (`deBr101.ts`). The nearly flat face leaning about 15 degrees below the
  windscreen and 27 degrees across it; the black-framed windscreen widening as it wraps;
  below 1.3 m the open headstock between red corner fairings; rectangular twin-lens lamps.
  The smooth side with the cab door and window; grey roof slopes in three sections with
  filter windows; the module draws the pantographs (knees inward). Traffic red and the light
  grey "50 years of IC" scheme of 101 013.
- **BR 120** (`deBr120.ts`). Upright to 2.0 m, then about 12 and 18 degrees of rake; the
  upper side walls chamfered the whole length, holding the filter grilles, a louvre and a
  silver panel (no machine-room windows); orient red with the light grey bib, traffic red
  with the white front bars and the grey foot band; single-arm pantographs over the cab ends.
- **E 18** (`deE18.ts`). Measured on the DR works drawing of E 218 019. Rounded cab ends with
  three front windows over the black ledge; the window and louvre row; the raised roof over
  the machine room; two red diamond pantographs. Four 1.6 m spoked drivers and two 1.0 m
  pony wheels as four turning units (pony, driver pair, driver pair, pony) so every wheel
  stays on the rails in a curve (`test/deE18.test.ts`); the wheels roll. DR green after
  E 18 31.
- **E 94** (`deE94.ts`). The full-width centre body is the box kit's shell (flat cab fronts
  with three windows); the hoods are their own shells, 2.6 m wide against the body's 3.0 m,
  low with tops rounded across and at the front. The fish-belly frame with its lightening
  holes, the off-centre roof ventilator, two red diamond pantographs; the bogies at the
  published 10.0 m and 2.45 + 2.15 m. Green after E 94 088.
- **V 200** (`deV200.ts`). The dark grey skirt down to 0.62 m, the red lower body between the
  silver trims and the grey upper body above, its sides leaning in; the rounded nose with the
  upper trim sweeping down to a V at the nose door; the raked windscreen with corner panes;
  oval headlights; per side the cab door, a louvred window and two large windows, the cab
  windows and radiator louvres above the waist; roof fans and silencers.
- **BR 218** (`deBr218.ts`). A one-piece body with a cab at each end (the old model's centre
  cab between two hoods was wrong). The skirt sweeping up to the beam, the lamp housing
  standing proud, the grey apron, the raked two-pane windscreen; the side's cab window and
  door, machine-room windows and grilles; two exhaust stacks. Purple red (218 209), orient
  red with the pebble grey band (218 137), traffic red with the face band (218 400).

### Steam

- **DRG 01** (`deSteam01.ts`). Measured on the DEWAG side drawing of 01 005: the axle pitch
  (wheelbase 12.4 m), the boiler on 3.1 m with the feed-water heater across the smokebox,
  three low domes, the large Wagner plates down the sloping running board, red frames,
  wheels and reservoirs, and the T 32 tender with its narrower coal box.
- **DR 52** (`deSteam52.ts`). The DR's rebuilt 52.80 as 52 8154 runs today: the 50E boiler
  with the curved deflectors standing off the smokebox, the preheater box ahead of the
  chimney, plate frames with red top edges, the plain cab with oval front windows, and the
  round-bottomed T 30 tub tender with pressed truck side frames.
- **Prussian P 8** (`deSteamP8.ts`). The pointed "Windschneide" cab, the long smokebox and
  tall chimney, the domes and sand box, the feed-water heater drums on the running board,
  and the T 21.5 tender with flared coal rails. KPEV green after 2455 Posen and 38 3199; DR
  black after 38 1772 with the small Wagner plates.

### Coaches

- **Intercity coaches** (`deIcCoach.ts`). Laid out side by side from photographs: the Avmz
  111's compartment side with nine 1.4 m windows on 2.3 m between frosted toilet windows,
  its corridor side with nine on 2.2 m between 0.8 m vestibule windows and top lights,
  folding doors with the window in the inner leaf; the Bpmz with swing-plug doors, a toilet
  window, a narrow window and nine 1.42 m windows on 1.81 m. A dark solebar the length, the
  skirt to 0.5 m between the bogies, rounded roof ends. TEE is the AKE coach's early scheme
  (beige to the eaves, purple red belly, beige line, black-grey skirt); ocean blue is ivory
  over blue; Intercity is light grey with the traffic-red band broken by the DB logo at
  each end. Not modelled: the MD 36 bogie's own details, the folding door's seam, the later
  straight-ended roof.

## Deviations

- **Units.** The series kit has one wheel size and one wheelbase per series: the Jacobs
  bogies of the 423, the SVT 877 and the RS1 use the end bogies' (the 423's 2.2 m instead of
  2.7 m, the RS1's 2.2 m instead of 1.8 m); the ICE 4 runs on its trailer bogies everywhere.
  Lettering uses the stroke font (capitals, thin). A 4-car ICE 4 raises both middle cars'
  pantographs.
- **ICE 2.** The power car keeps the ICE 1's sloped nose and the coach the ICE 1's layout
  (the confirmed `ice1.ts` builders, now with the `ice2` paint option; the ICE 1 is
  byte-identical). The driving trailer's nose length and rake are estimated from oblique
  photographs: no free side-on photograph of an 808 was found. The door window is the
  pre-redesign narrow slot.
- **Locomotives.** The DB emblems are frames without letters on the 218 and V 200; the V 200's
  nose number lacks its V (the plate font draws digits only). The E 94's hoods are part of
  the body (the real ones ride on the bogie frames). The E 18's quill-drive spring cups are
  not drawn.
- **Steam.** Each engine's own spec places boiler, domes and cab from its drawing or photos;
  pipework, air pumps and smokebox door dogs are simplified. The P 8 has one dome layout for
  both eras and keeps the Prussian tender in DR black.
- **MeshCore.emit** does not apply a turned car's frame; the 642 and the SVT 877 map their
  off-centre stacks themselves. The other diesel series' turned cars keep a slightly
  misplaced emitter until the kit is fixed on its own.

## Tests

`test/worldTrains.test.ts` holds every new design to its country, to its loading
gauge's width, to the triangle budget and to its published length; the catalog
sweep (`test/catalogSweep.ts`) runs every per-design check on the defaults and a
sampled combination. `test/deE18.test.ts` holds the E 18's turning units on a curve.
