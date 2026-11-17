# Foreign multiple units

**Covers** - the parametric `veh-db-628` (DB 628: the motor car, the set's three n-Wagen coaches and the full train, one 628 unit of two cars; two liveries), `veh-mav-mdmot` (MAV MDmot, four cars and the full train of 2 to 8 cars), `veh-ice-1` (ICE 1, three cars and the full train of 3 to 8 vehicles) and `veh-tgv` (TGV: the power car, the articulated trailer set of 1 to 6 cars and the full train of 3 to 8 vehicles, in two liveries) from vlakosimdb: what each parameter value builds, how the cars couple (the TGV set's Jacobs bogies), the scales from the XML to the published dimensions, the shared parts, the measured comparison and the tests.
**Code** - `generator/db628.ts`, `generator/dbNWagen.ts` (the 628's coach cars), `generator/mavMdmot.ts`, `generator/ice1.ts` (and the ICE trains' shared builder), `generator/tgv.ts`, `generator/unitParts.ts`, `generator/unitComparison.ts`, `generator/unitReport.ts`, `generator/unitViews.ts`, `generator/csdCoachParts.ts` (the body builder), `generator/emuParts.ts` (pantograph, centre coupler, sloped panels), `test/foreignUnits.test.ts`, `test/db628MdmotTrains.test.ts`, `test/iceTrains.test.ts`, `assets/db-628/`, `assets/mav-mdmot/`, `assets/ice-1/`, `assets/tgv/`
**See also** - [czech-emus.md](czech-emus.md) (the same method for the CD 471 and CD 680), [vehicles.md](vehicles.md), [parameters.md](parameters.md), [csd-coaches.md](csd-coaches.md) (the coach builder and the comparison method), [DB 628 sources](../../assets/db-628/SOURCES.md), [MDmot sources](../../assets/mav-mdmot/SOURCES.md), [ICE 1 sources](../../assets/ice-1/SOURCES.md), [TGV sources](../../assets/tgv/SOURCES.md)

## The designs

As for the Czech units, a multiple unit is one design per body and its cars are
the values of `unit`; paint schemes of one body are a `livery`. Each car is built
on its own, facing +X - a cab car with its cab at +X - centred between its
coupling faces (buffer faces, coupler faces or joint planes), so the game can
couple the cars of a set in any order and turn a car to face the other way.

| design | parameter | value | vlakosimdb | car |
|---|---|---|---|---|
| `veh-db-628` "DB 628" | `unit` | `motorCar` (default) | dmu/db_628, db_628vr | the 628.2 motor car: cab at +X, the short coupling at -X |
| | | `bn` | coach/db_bnvriv, db_bnvr | n-Wagen Bn, 2nd class ([german-coaches.md](german-coaches.md)) |
| | | `abn` | coach/db_abnvriv, db_abnvr | n-Wagen ABn, 1st and 2nd class |
| | | `bdnrf` | coach/db_bdnrfiv, db_bdnrf | n-Wagen BDnrf driving trailer, the Karlsruher Kopf at -X |
| | | `train` | db_628, db_628vr | the full train (`db628Train`): one 628 unit of two motor cars joined by a gangway, the second turned; one articulated vehicle |
| | `livery` | `mint` (default) | db_628, db_*iv | mint turquoise, pale blue and light grey (DB, 1990s); the motor car 628 289-1 |
| | | `red` | db_628vr, db_*vr | DB Regio traffic red; the motor car 628 305-5 with the first-class line |
| `veh-mav-mdmot` "MAV MDmot" | `unit` | `motorCar` (default) | dmu/mav_mdmot | the short twin-cab baggage motor car MDmot, radiator hump, machine-room windows and grilles |
| | | `trailerAx` | dmu/mav_ax | first-class trailer Ax |
| | | `trailerBx` | dmu/mav_bx | second-class trailer Bx (its first window frosted) |
| | | `drivingTrailer` | dmu/mav_btx | driving trailer Btx: second class, a baggage room with a double door, the cab at +X |
| | | `train` | all of the above | the full train (`mdmotTrain`): MDmot, Bx trailers, Ax, Btx turned; one articulated vehicle |
| | `cars` (with `train` only) | `2` .. `8`, `4` (default) | | the train's cars; four is the published set |
| `veh-ice-1` "ICE 1" | `unit` | `powerCar` (default) | emu/ice/ice loco | power car 401: nose at +X, one raised pantograph |
| | | `coach` | emu/ice/ice car | intermediate coach 802: the dark window band |
| | | `restaurant` | emu/ice/ice restaurant | restaurant car 804: the raised roof with clerestory lights, the kitchen door |
| | | `train` | all of the above | the full train (`ice1Train`): power car, coaches (the restaurant car mid-train from five cars), power car turned; one articulated vehicle |
| | `cars` (with `train` only) | `3` .. `8`, `4` (default) | | the train's vehicles, both power cars included |
| `veh-tgv` "TGV" | `unit` | `powerCar` (default) | emu/tgv/tgv_loco, tgv_at_loco | power car: nose at +X, one raised pantograph |
| | | `set` | emu/tgv/tgv_vag#1, tgv_vag#2, tgv_at_ch1, tgv_at_ch2 | the articulated trailer set: end coach (R1: its own bogie and coupler at the power car, the vestibule's doors, the louvred fairing), intermediate coaches, the end coach turned; a Jacobs bogie under each joint |
| | | `train` | all of the above | the full train (`tgvTrain`): power car, trailer set of `trainCars - 2` cars, power car turned; one articulated vehicle |
| | `cars` (with `set` only) | `1` (default) .. `6` | | the set's car count; one car is an end coach on its own bogie and coupler at both ends |
| | `trainCars` (with `train` only) | `3` .. `8`, `4` (default) | | the train's vehicles, power cars included; three is a one-trailer set between the power cars |
| | `livery` | `pse` (default) | tgv_loco, tgv_vag#1, tgv_vag#2 | TGV Sud-Est: orange, white and the grey band; the machine room's vertical louvres |
| | | `atlantique` | tgv_at_loco, tgv_at_ch1, tgv_at_ch2 | TGV Atlantique: silver and blue, the longer raised roof |

`db_628vr` is not the 928 driving trailer: its XML and BMPs repeat the 628 motor
car's cab, doors and windows in the red paint (its plan runs to 25 m but its
elevation stops at the same 22.1 m), so it is a `livery`. vlakosimdb has no 928;
the set's other half is not built. The game instead runs each 628 with three
n-Wagen coaches in its paint (the webapp's packages: the mint 628 with the iv Bn,
ABn and BDnrf, the 628vr with the vr ones), so those coaches are the design's other
`unit` values: `db628()` hands them to `nWagen()` (dbNWagen.ts), the 628's `mint`
painting them iv and `red` vr. Their geometry, sources and comparison are in
[german-coaches.md](german-coaches.md); the design's references are both
`assets/db-628/` and `assets/db-n-wagen/`. The MDmot class name is MAV's own (the cars
were delivered as MDa); the trailers keep their MAV class letters as values.

The archived Eurostar (`train-emu-eurostar-*` in the webapp's
`db/archived.json`) is not built; the archived Shinkansen cars
(`train-emu-shinkansen-*`) map onto the procedural 0 series
([shinkansen-0.md](shinkansen-0.md)). The double-deck TGV Duplex is its own design
([tgv-duplex.md](tgv-duplex.md)).

| design, car | length | triangles |
|---|---|---|
| DB 628 motor car (both liveries) | 22.70 m, cab buffers to the short coupling | about 5,900 |
| MDmot motor car | 15.52 m over buffers | about 7,700 |
| MDmot Ax, Bx | 22.40 m over buffers | about 5,900 to 6,000 |
| MDmot Btx | 22.06 m over buffers | about 6,900 |
| ICE 1 power car | 20.56 m over couplers | about 6,400 |
| ICE 1 coach, restaurant | 26.40 m over couplers | about 4,700 and 5,100 |
| TGV power car (PSE, Atlantique) | 22.15 m over couplers | about 7,900 and 6,100 |
| TGV trailer set, 1 car | 21.845 m over couplers | about 5,400 to 5,600 |
| TGV trailer set, n cars | 2 x 21.845 m + (n - 2) x 18.70 m | about 9,000 (2 cars) to 20,300 (6 cars) |
| TGV full train, n vehicles | 2 x 22.15 m + the set of n - 2 (88.0 m for 4) | about 21,700 (3) to 37,300 (8) |

## How the cars couple

- **DB 628**: the cab end carries buffers and a screw coupling 22.70 m ahead of
  the inner end's coupling plane, half the 628.2 set's 45.40 m over buffers. The
  inner end has the gangway and a short centre coupler whose face is the plane.
- **DB 628 full train** (`unit: train`, no `cars`): `db628Train()` lays out one
  628 unit, its two cars joined by a gangway, the second turned so the pair meets
  at the inner ends' short coupling with a cab at each end. A full train holds only
  cars joined by gangways: coupling 628 units in multiple, or the n-Wagen coaches
  (ordinary coaches), is left to the player. vlakosimdb has no 928 driving trailer
  (its body is the motor car's), so both cars are the motor car. The train is one
  articulated vehicle (`coupledTrain`, unitParts.ts): each car a section hinged on
  the coupling plane ahead of it on its own two bogies, a 0.70 m gangway bellows
  where the inner ends meet (their gangway frames left out). Game figures: 112 t
  and 846 kW in both liveries (56 t and 423 kW a car). The distant model is the
  motor car's moved to each car's place, 100 triangles a car (`lodTriangles: 200`).
- **MDmot**: buffers and screw couplings at both ends of every car (the published
  lengths over buffers); trailers and the Btx have gangway bellows at their inner
  ends. A four-car set is MDmot, Bx, Ax, Btx (82.38 m, the published length).
- **MDmot full train** (`unit: train`, `cars` 2 .. 8, default 4): `mdmotTrain(n)`
  lays out the motor car, n - 3 Bx trailers, the Ax and the Btx turned at the rear
  (a two-car train is MDmot and Btx, a three-car one adds the Ax), centred on
  x = 0. One articulated vehicle like the 628's: a 1.40 m bellows between two
  gangway ends (the cars' gangway frames left out), a small one round the
  couplings at the motor car's rear cab. Game figures: a variant per length, 41 t a
  car and the motor car's 590 kW; the distant model as the 628's.
- **ICE 1**: centre couplers. The power car's nose has none (its coupler hides
  behind a cover); its rear coupler face is 20.56 m behind the nose. The coaches'
  bellows and couplers reach their 26.40 m ends. The full train (`unit: train`,
  `cars` 3 .. 8, default 4) is `ice1Train(n)`: a power car at each end, the rear one
  turned, `n - 2` cars between them, the restaurant car the middle one of them from
  five cars (`floor((n - 2) / 2)`, as the prototype runs it mid-train), otherwise
  coaches; three cars is the shortest train with both power cars. One articulated
  vehicle (`iceArticulated`, shared with the ICE 2's train, germany-trains.md): each
  car drawn by its lone builder centred on x = 0 and moved to its place, a section
  hinged on the coupling plane ahead of it at 1.0 m, its own two bogies, a bellows
  over the gangway between the walls (the coaches' gangway frames left out, their
  couplers kept); a four-car train is 93.92 m. Game figures: a variant per length,
  the cars' weights added up and the power cars' power. The distant model keeps the
  sections and bellows, 100 triangles a car, 500 at most (`lodTriangles: 500`), the
  coaches' bogies given up first.
- **TGV**: a train is power car, trailer set, power car turned; the power cars'
  rears and the set's ends meet at centre couplers. The trailer set (`unit: set`)
  is one articulated vehicle: end coach, `cars - 2` intermediate coaches and the
  end coach turned (drawn turned about its centre, `MeshCore.turned`), each car a
  section (`section0` at +X, `articulate()` from the tram kit), bellows between
  the cars' walls, the hinges on the joint planes. Under each joint one **Jacobs
  bogie** - a wheelset 1.5 m either side, the side frames, the bolster and the air
  springs, 3.0 m wheelbase on 920 mm wheels - is a turning node carrying the cars on
  both sides; each end coach has its own full bogie (the motor bogie of the PSE's
  R1) 3.05 m (source) from its coupler. A one-car set is an end coach with a
  coupler, gangway and its own bogie at both ends. The old single-car values
  `endCoach` and `coach` are gone: the game reads a stored one as a one-car set,
  and the legacy vlakosimdb coaches map to it.
- **TGV full train** (`unit: train`, `trainCars` 3 .. 8, default 4): `tgvTrain(n)`
  lays out power car, the trailer set of n - 2 cars (the set's own layout, its
  one-car form included) and the power car turned, end to end and centred on
  x = 0. It is one articulated vehicle: the set's sections with the power cars as
  the first and last, hinged on the coupling planes by the power cars and on the
  Jacobs joints inside the set, the set's bellows over every gap; the power cars
  keep their two bogies, the end coaches their own, the Jacobs bogies carry the
  cars either side. Inside the train the end coaches' gangways are left out (the
  bellows close the joint); their couplers stay. Every car is drawn by the same
  builder as alone, so the lone values are byte for byte as before.
  **Why `trainCars` and not `cars`**: `cars` counts a trailer set's cars with the
  default 1, and a saved map names a one-car set as `{ unit: "set" }` (defaults
  are left out of a selection). A shared `cars` counting the whole train would
  need the default 4 (one default for both values, never conditional), turning
  every saved one-car set into a four-car one; so the train's length, every
  vehicle counted, is a parameter of its own. Game figures: a variant per length
  and livery, the power cars' and the set's 40 t added up and the two power cars'
  6,480 kW. The distant model is the set's (100 triangles a vehicle, 500 at most - `lodTriangles: 500`;
  a lone set keeps its 300, `TGV_SET_LOD`),
  the power cars as its first and last sections; the trailers' skirts and Jacobs
  bogies give way first. OpenTTD presets and the formation leave the train out.

## DB 628

The body is the XML's box section with the roof's edges rounded after the
photographs (vertical walls to 3.45 m, the roof at 3.8 m), lofted by the coach
builder over the XML's elevation: the cab front leans back from the tip at
1.7 m to 3.4 m and on into the roof's slope, its lower front leans back to
0.9 m, and the skirts hang to 0.55 m beyond the bogies. The nose is a volume of
its own with the front's paint (the end BMPs' 60 rows map onto 5 m, so a row is
1/12 m), with stations where the slopes cross the paint edges so every band lies
on its plane; windscreen, top lamp, logo and lamps are panels on those planes.
Doors (with the 628.2's lower door windows), windows, class numerals, the logo,
the running number and the fuel filler are native pixel boxes, 0.1 m a pixel.
Bogies at the BMP's wheel columns (15.1 m pivots, 1.9 m wheelbase) on the
published 770 mm wheels; the inner bogie is the powered one. Engine, fuel tank
and batteries under the floor, the air-conditioning and radiator on the roof.

## MAV MDmot

Heights are scaled by 1.07 (`MDMOT_K_Y`): vlakosimdb's roofs (3.5 m on the motor
car, 3.6 m on the trailers) are low against the photographs, where the motor
car's roof stands about 3.7 m high and its lamp band at 1.3 to 1.9 m (scaled from
the buffers' 1.75 m spacing). Buffers, bogies and the underframe keep their
mechanical heights. Widths are the published 2.85 m; vlakosimdb's sections are
drawn 0.1 m off the centre line and are centred. The published height of 4.32 m
is not reached by the body: it counts roof equipment.

The cab fronts (both ends of the motor car, the Btx's +X end) follow the XML:
vertical to 1.2 m, leaning 0.1 m forward to 1.9 m, back to the windscreens' top
at 2.9 m and to the roof, the plan's corners rounded. Their paint is the front
BMP's: the dark buffer beam, the cream lamp band with the headlights, red lights
and number plate, an orange line, red, the grey roof; the roof headlight's red
housing stands at the windscreens' top. The motor car's radiator hump (XML 4.6 to
6.3 m), its louvres and fans, the exhaust stacks and horns are on the roof. The
coaches' windows are drop lights with a sash bar; doors carry handrails and steps.
Bogie pivots: 8.05 m on the motor car (published, 2.4 m wheelbase, 920 mm wheels),
15.5 m on the trailers (2.5 m wheelbase).

## ICE 1

The body is the XML section (3.8 m roof; the restaurant's roof rises to 4.3 m,
the published 4.295 m, between 2.0 and 24.4 m) at the published 3.02 m width.
The power car's nose follows the XML: the rounded plan, the undercut to 0.3 m,
the vertical face from 0.9 to 1.4 m, the windscreen's slope to 3.6 m. The paint
is bands - grey skirts, white, the pale pink line and the red stripe, which wraps
round the nose as on the photographs (the BMP stops it short of the tip). Grilles,
the side door, the cab window, the logo and the "ICE" lettering (fitted to its
native box) are native boxes; the headlights and the grille between them are on
the nose's lower slope at the front BMP's rows. One single-arm pantograph,
raised, over the rear bogie (XML x 17.4 m); vlakosimdb gives the power car one.

The power car's bogies are 11.46 m apart (published; vlakosimdb's are 12.6 m),
3.0 m wheelbase, 1040 mm wheels; the coaches' 19.0 m apart, 2.5 m wheelbase,
920 mm wheels. The coaches' skirts reach 0.1 m between and beyond the bogies.

## TGV

The PSE power car's model in vlakosimdb is a baked polygon list (`index.xml`);
its shapes are read from the simplemodel `source.xml` beside it, the
Atlantique's from its own `index.xml`. The two share the section (vertical walls
to 2.6 m, the roof's shoulders to 4.1 m), the pointed nose plan and elevation,
the windscreen's slope and the skirts; they differ on the roof behind the raised
machine-room roof (the PSE drops to its pantograph well at 16.4 m, the
Atlantique keeps its raised roof to 18.5 m and 3.9 m behind it) and in the
pantograph's place (19.0 m and 19.5 m). So **the power car's shape follows the
livery only on the roof**; the nose and body are one. (The real Atlantique's
nose differs in detail; vlakosimdb draws both alike.)

Lengths are stretched along x to the published ones (power car 22.15 m against
the XML's 21.9 m; end coach 21.845 m against 21.6 m; coach 18.7 m against 18.5 m),
widths scaled to 2.814 m (power car) and 2.904 m (coaches). The coaches' heights
are scaled by 0.95 to the published 3.42 m (`TGV_K_Y_COACH`); the end coach keeps
its fairing toward the power car (3.9 m). Bogies: the power car's at the BMP's
columns (14.0 m pivots, published), 3.0 m wheelbase on 920 mm wheels with the
long side frames of the XML's gear clips; the trailers' 3.0 m wheelbase.

## Shared parts (`unitParts.ts`)

- `SideMap`, `bOf()`, `sideBox()`, `toBody()`: the column-to-body mapping of a
  car whose BMP has its cab on the left (or, with `k` negative, on the right),
  with length and height scales.
- `unitBogie()`: a two-axle bogie with side frames dropped between the axles,
  axle boxes on coil springs, a bolster on air springs or coils, brake units and
  traction motors when powered.
- `spacedLetters()`: capitals fitted to a native box ("ICE", "TGV").
- `endLamp()`, `roofBox()`.
- `coupledTrain()`: single cars as one articulated train, like the tram kit's
  `articulate()` but with each joint's own bellows section (a gangway's, or a
  small one round the couplers where a cab is coupled).

`strokeFont.ts` gained the G and T for the TGV's lettering.

## Measured comparison

`unitComparison.ts` measures the default car of each design against native pixel
boxes in `assets/<folder>/native/<key>/landmarks.json` (20 boxes for the 628, 16
for the MDmot motor car, 13 for the ICE power car, 11 for the TGV power car),
orthographically from the GLB's vertices, as `emuComparison.ts` does. A box held
to a published dimension or a photograph carries a `constraint` (the ICE's
published bogie pivots, the 628's 770 mm wheels, the TGV's cab side windows kept
on the vertical wall). `pnpm exec tsx generator/unitReport.ts` writes
`COMPARISON.md` in each folder and review views to `export/review/<key>/`;
`--views <id> <dir> k=v` renders any build. At the current revision, with the
documented scales undone: the 628 0.20 pp, the MDmot 0.28 pp, the ICE 0.78 pp
(most of it the published bogie pivots), the TGV 0.35 pp.

## Tests

`test/foreignUnits.test.ts`: the designs' ids, parameters and defaults; every
combination stands on the rail, centred between its coupling faces, within
3.1 m, 16,000 triangles and the 4.7 m fixed envelope; the 628's length, width,
height, bogies, cab at +X and both liveries sharing one body; the running numbers'
check digits; the MDmot's lengths over buffers, widths, bogie spacings, buffers,
cabs and the Bx's frosted window; the ICE's lengths, pivots, raised pantograph,
roofs and clerestory (the ICE 1's full train in `test/iceTrains.test.ts`); the TGV's lengths, widths, heights, pivots, pantograph and
the Atlantique's longer raised roof; the trailer set's sections, joints and Jacobs
bogies (each carrying its two cars, its hinge on the joint plane), the turned last
end coach and the one-car set's bogies and couplers at both ends (a set is held to
4,000 triangles a car, at least 16,000); the full train's formation of each length,
its sections, hinges, joints and supports, length, the turned rear power car, the
gangways left out, 16,000 triangles a vehicle, deterministic bytes, its distant
model and its game figures; and each default car within its landmarks' tolerances once
the documented scales are undone.
