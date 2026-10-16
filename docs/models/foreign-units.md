# Foreign multiple units

**Covers** - the parametric `veh-db-628` (DB 628: the motor car and the set's three n-Wagen coaches, two liveries), `veh-mav-mdmot` (MAV MDmot, four cars), `veh-ice-1` (ICE 1, three cars) and `veh-tgv` (TGV: the power car and the articulated trailer set of 1 to 6 cars, in two liveries) from vlakosimdb: what each parameter value builds, how the cars couple (the TGV set's Jacobs bogies), the scales from the XML to the published dimensions, the shared parts, the measured comparison and the tests.
**Code** - `generator/db628.ts`, `generator/dbNWagen.ts` (the 628's coach cars), `generator/mavMdmot.ts`, `generator/ice1.ts`, `generator/tgv.ts`, `generator/unitParts.ts`, `generator/unitComparison.ts`, `generator/unitReport.ts`, `generator/unitViews.ts`, `generator/csdCoachParts.ts` (the body builder), `generator/emuParts.ts` (pantograph, centre coupler, sloped panels), `test/foreignUnits.test.ts`, `assets/db-628/`, `assets/mav-mdmot/`, `assets/ice-1/`, `assets/tgv/`
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
| | `livery` | `mint` (default) | db_628, db_*iv | mint turquoise, pale blue and light grey (DB, 1990s); the motor car 628 289-1 |
| | | `red` | db_628vr, db_*vr | DB Regio traffic red; the motor car 628 305-5 with the first-class line |
| `veh-mav-mdmot` "MAV MDmot" | `unit` | `motorCar` (default) | dmu/mav_mdmot | the short twin-cab baggage motor car MDmot, radiator hump, machine-room windows and grilles |
| | | `trailerAx` | dmu/mav_ax | first-class trailer Ax |
| | | `trailerBx` | dmu/mav_bx | second-class trailer Bx (its first window frosted) |
| | | `drivingTrailer` | dmu/mav_btx | driving trailer Btx: second class, a baggage room with a double door, the cab at +X |
| `veh-ice-1` "ICE 1" | `unit` | `powerCar` (default) | emu/ice/ice loco | power car 401: nose at +X, one raised pantograph |
| | | `coach` | emu/ice/ice car | intermediate coach 802: the dark window band |
| | | `restaurant` | emu/ice/ice restaurant | restaurant car 804: the raised roof with clerestory lights, the kitchen door |
| `veh-tgv` "TGV" | `unit` | `powerCar` (default) | emu/tgv/tgv_loco, tgv_at_loco | power car: nose at +X, one raised pantograph |
| | | `set` | emu/tgv/tgv_vag#1, tgv_vag#2, tgv_at_ch1, tgv_at_ch2 | the articulated trailer set: end coach (R1: its own bogie and coupler at the power car, the vestibule's doors, the louvred fairing), intermediate coaches, the end coach turned; a Jacobs bogie under each joint |
| | `cars` (with `set` only) | `1` (default) .. `6` | | the set's car count; one car is an end coach on its own bogie and coupler at both ends |
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

The archived Eurostar and Shinkansen (`train-emu-eurostar-*`,
`train-emu-shinkansen-*` in the webapp's `db/archived.json`) are not built.

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

## How the cars couple

- **DB 628**: the cab end carries buffers and a screw coupling 22.70 m ahead of
  the inner end's coupling plane, half the 628.2 set's 45.40 m over buffers. The
  inner end has the gangway and a short centre coupler whose face is the plane.
- **MDmot**: buffers and screw couplings at both ends of every car (the published
  lengths over buffers); trailers and the Btx have gangway bellows at their inner
  ends. A four-car set is MDmot, Bx, Ax, Btx (82.38 m, the published length).
- **ICE 1**: centre couplers. The power car's nose has none (its coupler hides
  behind a cover); its rear coupler face is 20.56 m behind the nose. The coaches'
  bellows and couplers reach their 26.40 m ends.
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
roofs and clerestory; the TGV's lengths, widths, heights, pivots, pantograph and
the Atlantique's longer raised roof; the trailer set's sections, joints and Jacobs
bogies (each carrying its two cars, its hinge on the joint plane), the turned last
end coach and the one-car set's bogies and couplers at both ends (a set is held to
4,000 triangles a car, at least 16,000); and each default car within its landmarks' tolerances once
the documented scales are undone.
