# Czech electric units

**Covers** - the parametric `veh-cd-471` (CD 471 CityElefant: three cars and the full train of 2 to 8, three variants, CD's current blue from a photograph) and `veh-cd-680` (CD 680 Pendolino: four cars and the full train of 3 to 8) from vlakosimdb: what each parameter value builds, the shared EMU parts, the scales from the XML to the published dimensions, the measured comparison and the tests.
**Code** - `generator/emu471.ts`, `generator/emu680.ts`, `generator/emuParts.ts`, `generator/letters.ts` (the blue's wordmark), `generator/emuComparison.ts`, `generator/emuReport.ts`, `generator/csdCoachParts.ts` (the body builder), `test/czechEmus.test.ts`, `test/cd471Train.test.ts`, `assets/cd-471/`, `assets/cd-680/`
**See also** - [czech-emus-classic.md](czech-emus-classic.md) (the CD 451, 460 and 470), [vehicles.md](vehicles.md), [parameters.md](parameters.md), [csd-coaches.md](csd-coaches.md) (the coach builder and the comparison method), [bmo-double-deck.md](bmo-double-deck.md), [CD 471 sources](../../assets/cd-471/SOURCES.md), [CD 680 sources](../../assets/cd-680/SOURCES.md)

## The designs

A multiple unit is one design per body; its cars are the values of `unit`, as a
steam locomotive's tender is ([steam-locomotives.md](steam-locomotives.md)). Each car is
built on its own, facing +X - a cab car with its cab at +X - centred between its
coupling faces, so the game can couple the cars of a set in any order.

| design | parameter | value | vlakosimdb | car |
|---|---|---|---|---|
| `veh-cd-471` "CD 471 CityElefant" | `unit` | `motorCar` (default) | cd 471/cd_471 | motor car 471: cab, pantograph, two motor bogies |
| | | `trailer` | cd 471/cd_071 | trailer 071 |
| | | `drivingTrailer` | cd 471/cd_971 | driving trailer 971: cab |
| | | `train` | - | the full train, `cars` long (see [the CityElefant full train](#the-cityelefant-full-train)) |
| | `cars` (only with `train`) | `2` .. `8`, `3` (default) | - | the train's cars, both cab cars included |
| | `variant` | `cd471` (default) | cd 471 | the CityElefant livery: light grey, blue band, red stripe, red doors |
| | | `cd675` | cd 675/cd_675, cd_075, cd_975 | vlakosimdb's "CD 675": the same body, red band, dark green stripe |
| | | `cdBlue` | - (photograph) | CD's current blue (Najbrt), 471 079, see [CD 471 blue](#cd-471-blue-najbrt) |
| `veh-cd-680` "CD 680 Pendolino" | `unit` | `endCar` (default) | cd 680/cd_681 | end car 681: cab, pantograph |
| | | `car683` | cd 680/cd_683 | intermediate car with the blind kitchen section and a second roof cover |
| | | `car685` | cd 680/cd_685 | intermediate car with a pantograph |
| | | `car686` | cd 680/cd_686 | plain intermediate car |
| | | `train` | - | the full train, `cars` long (see [the full train](#the-full-train)) |
| | `cars` (only with `train`) | `3` .. `8`, `4` (default) | - | the train's cars, both end cars included |

The CD 675 is a `variant`, not a design: real CD never had a class 675 (the
number is the Ukrainian EJ675, a restyled Skoda body), and vlakosimdb's 675, 075
and 975 repeat the 471 set's layout pixel for pixel in another paint. The variant
keeps every dimension and changes the paint, the class numbers and the running
number ([sources](../../assets/cd-471/SOURCES.md)).

| design, car | length over couplers | triangles |
|---|---|---|
| CD 471 motor car, driving trailer | 26.05 m | about 7,300 to 8,400 and 6,600 to 7,700 |
| CD 471 trailer | 25.70 m | about 5,900 to 6,450 |
| CD 680 end car | 27.70 m | about 8,100 |
| CD 680 intermediate cars | 25.90 m | about 6,600 to 7,500 |
| CD 680 full train of 3 / 4 / 8 cars | 81.30 / 107.20 / 210.80 m | about 24,200 / 30,800 / 58,800 |

## CD 471 CityElefant

The double-deck body is lofted by the coach builder (`Coach.volume`) from the
XML section - vertical walls to 3.8 m, the upper wall leaning in to the roof - and
the elevation: the single-level ends over the bogies stand on 0.9 m and the floor
between the bogies drops to 0.2 m, the low centre whose two decks carry the
upper and lower windows. The ends' windows sit between the decks, in the blue
band. Paint is horizontal bands (skirt, white, blue, white) with the stripes,
the yellow line, the door canopies and the trim laid on as panels.

The cab nose leans back from the tip at 1.6 m to 4.1 m and rounds into the roof;
its windscreen, top lamp, lamp housings and front stripe are panels on that
plane (`slopePanel`), the undercut and the apron below it black over a yellow
edge, with a centre coupler. The elevation carries extra stations where the
slope crosses the paint bands' edges, so every band's clamped ring stays on the
one plane. The motor car's pantograph stands in the roof well over its inner
bogie, raised; the louvres of the well and of the roof over the cab are panels.

Heights are scaled to the published 4.635 m (the XML roof is 4.8 m) and widths
to 2.82 m; bogie pivots 19.0 m apart, 2.6 m wheelbase under the motor car, 2.4 m
under the trailers. Running numbers 471 014-1, 071 014-5, 971 014-6 (the 675
variant 675 001-2, 075 001-8, 975 001-9).

### CD 471 blue (Najbrt)

`cdBlue` is CD's current blue (Studio Najbrt, from 2008) on the same body, read
from `assets/cd-471/photo-471-079-cd-blue-2024.jpg` (471 079-4): a navy foot to
1.0 m, white to the navy line under the end windows (2.15 - 2.32 m, source
heights), light blue to the white line at 3.3 - 3.42 m, navy above and over the
roof; the yellow line under the upper windows lowered 0.12 m, under the white
line; navy doors and dark navy canopies; no red stripes or grey trim lines. The
white CD emblem stands behind the cab of each cab car, "City Elefant" (the stroke
font's capitals, [lettering.md](lettering.md)) in white on the navy upper wall
over the cab end. The nose is light blue round the windscreen (panels on its
slope, as wide as the nose tip, over 1.78 - 2.15 m and 3.42 - 4.1 m) with the
number "471 079-4" and the emblem in white under the windscreen, white round the
lamps and a bright yellow apron edge. Colours: navy #1f3a7a, light blue #3c97de,
white #eef0f2. Numbers 471 079-4, 071 079 and 971 079 (the set's serial).

Simplified: the trailer and the driving trailer are painted as the motor car (the
photo shows the motor car); the wordmark is in capitals without the logo's
elephant trunk; the motor car's window behind the cab (on the photo) is not in the
vlakosimdb layout and is not drawn; the inner end walls and end doors stay white.

### The CityElefant full train

`unit` `train` builds the set in any variant, `cars` 2 to 8 vehicles long, the
three-car set by default. `cd471Train(n)` lays it out front to back: the 471 motor
car with its cab ahead, n - 2 trailers 071, the driving trailer 971 turned at the
rear (its cab facing -X); 2 cars are the motor car and the driving trailer. A
longer train adds trailers to the one set rather than coupling a second set (the
prototype runs two sets cab to cab for six cars): it keeps every length from 2 to
8, odd ones included, with one pantograph and a cab at each end. Each car is a
section (`articulate`, `tramKit.ts`) hinged at the coupling plane ahead of it at the
coupler bar's height (0.72 m), drawn by the lone car's builder into the train's
(`elefantCar(unit, variant, m)`), on its own two bogies; a bellows joint covers each
gap between the end walls (the gangway frame's outline), and inside the train the
cars leave out their gangway frames but keep their coupler bars. The train is
centred on x = 0. The distant model is the cars' (`elefantLodCar`) placed and turned
the same way, the inner ends hidden, 100 triangles a car and 500 at most
(`lodTriangles: 500`). The game's figures add the cars up in every variant: 70 t and
1,000 kW the motor car, 50 t a trailer and (an estimate) 50 t the driving trailer,
so the three-car set 170 t and 1,000 kW; the CD 675's trains keep its 160 km/h. The
OpenTTD presets and the "3 cars" formation stay as they were.

## CD 680 Pendolino

The body follows the XML section with the tilting train's tumblehome (the wall
leans in from 1.9 m) and its low roof edge, in the CD livery's bands: teal skirt,
light grey, the yellow line, the black window band with the glass panels on it,
a light line, teal and the dark roof edge. The skirts drop to 0.2 m between the
bogies and beyond the inner one. The end car's nose and the cab section behind
it are two more volumes with their own bands (the dark cap over the yellow
line); the windscreen and lamps lie on the nose slope, the plough under it.
Roof covers, the fairing behind the cab and, on the 681 and the 685, a raised
single-arm pantograph near the inner end, as a photograph shows it. The bogies
are tilting bogies: 2.7 m wheelbase, long side frames, a tilting bolster with
actuators, secondary springs and yaw dampers.

vlakosimdb's cars are 25 m long; the model stretches them along x to the
published 27.7 m and 25.9 m and narrows them to 2.8 m. Heights are the XML's.

### The full train

`unit` `train` builds the whole train of `cars` (3 to 8, default 4), the end
cars included. `pendolinoTrain(n)` lays the cars out front to back, the train
centred on x = 0, the rear end car turned (its cab at -X). The prototype's
seven cars - end car, 683, 686, 685, 683, 686, end car (the 7-car formation in
`generator/openttdTable.ts`) - are the reference; the 685, the pantograph car,
is in every train. Between the end cars:

| cars | intermediate cars |
|---|---|
| 3 | 685 |
| 4 | 683, 685 |
| 5 | 683, 686, 685 |
| 6 | 683, 686, 685, 686 |
| 7 | 683, 686, 685, 683, 686 (the prototype) |
| 8 | 683, 686, 685, 683, 686, 686 |

That is: ahead of the 685 the 683 with its kitchen (from four cars) and the
686 (from five); behind it a 686 (from six), the second 683 (seven) and a
further 686 (eight). The train is one articulated vehicle: each car a section
(`articulate`, tramKit.ts) hinged at the coupling plane ahead of it, bellows
over each gap between the end walls, every car on its own two tilting bogies
(the supports of its section). The cars are the lone cars' drawing; inside the
train their rubber gangways are left to the bellows and only the 685's
pantograph is raised (the end cars' fold down). The distant model has the same
sections and joints, 100 triangles a car and 500 at most (`lodTriangles`), and
shows the 685's raised pantograph alone. Game properties: 40 t a car, 1,500 kW
for each end car and the 685, so every train has 4,500 kW; 230 km/h. OpenTTD
presets never include the train.

## Shared parts (`emuParts.ts`)

- `pantograph()`: a single-arm pantograph on insulators whose raised linkage is
  unfolded by intersecting circles about the hinge and the head (no arm
  stretches), with the hinge end and the rise as parameters.
- `centreCoupler()`: a Scharfenberg-type coupler head on its draw bar.
- `slopePanel()`: a flat panel on a sloped cab front given as a plane in the side view.
- `tractionNumber()` / `tractionCheckDigit()`: the CSD/CD running number and its check digit.
- `enumParam()`, `EMU_CATALOG` (rail vehicles, group `unit`, traction `electric`).

## Measured comparison

`emuComparison.ts` measures the default car of each design against native
pixel boxes in `assets/<folder>/native/<key>/landmarks.json` (34 boxes for the
471 motor car, 23 for the 681 end car), orthographically from the GLB's
vertices, on the physical canvas and with the documented scales undone (the
471's height and width, the 680's length and width). `pnpm exec tsx
generator/emuReport.ts` writes `COMPARISON.md` in each folder and review views
to `export/review/<key>/`. At the current revision: the 471 motor car 1.28 pp
physical, 0.42 pp with the scales undone; the 681 1.80 and 0.59 pp.

## Tests

`test/czechEmus.test.ts`: every combination stands on the rail, centred, within
3.1 m, 16,000 triangles and the 4.7 m fixed envelope; the 471's lengths over the
couplers, height, width, 19.0 m pivots and both wheelbases, its low floor and the
two decks' windows, the motor car's single raised pantograph over the inner
bogie, the cabs facing +X, the CD 675 and the CD blue sharing the 471's bounds, the blue's "City Elefant" on the cab cars' upper wall and its lettered nose; the running
numbers' check digits; the 680's lengths, width, tumblehome, roof, 2.7 m
wheelbase and which cars carry a pantograph; the full train's formation of
every length (the prototype's seven), its sections, hinges, joints and two
supports a car, its length and budget, the turned rear end car, the raised
685 pantograph, deterministic bytes, the distant model and the trains' game
properties; and both default cars within their
landmarks' pixel tolerances. `test/cd471Train.test.ts`: the CityElefant's
formation of every length, the 2-, 3- and 8-car trains' sections, hinges, joints and
supports, length and budget in three variants, the turned driving trailer, the one
pantograph, no gangway frames inside the train (the lone cars keep theirs),
deterministic bytes, the distant model of every length and the game figures of
every length and variant. The catalog sweep (`test/catalogSweep.ts`)
covers every design generically.
