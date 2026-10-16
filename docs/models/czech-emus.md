# Czech electric units

**Covers** - the parametric `veh-cd-471` (CD 471 CityElefant: three cars, two variants) and `veh-cd-680` (CD 680 Pendolino: four cars) from vlakosimdb: what each parameter value builds, the shared EMU parts, the scales from the XML to the published dimensions, the measured comparison and the tests.
**Code** - `generator/emu471.ts`, `generator/emu680.ts`, `generator/emuParts.ts`, `generator/emuComparison.ts`, `generator/emuReport.ts`, `generator/csdCoachParts.ts` (the body builder), `test/czechEmus.test.ts`, `assets/cd-471/`, `assets/cd-680/`
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
| | `variant` | `cd471` (default) | cd 471 | the CityElefant livery: light grey, blue band, red stripe, red doors |
| | | `cd675` | cd 675/cd_675, cd_075, cd_975 | vlakosimdb's "CD 675": the same body, red band, dark green stripe |
| `veh-cd-680` "CD 680 Pendolino" | `unit` | `endCar` (default) | cd 680/cd_681 | end car 681: cab, pantograph |
| | | `car683` | cd 680/cd_683 | intermediate car with the blind kitchen section and a second roof cover |
| | | `car685` | cd 680/cd_685 | intermediate car with a pantograph |
| | | `car686` | cd 680/cd_686 | plain intermediate car |

The CD 675 is a `variant`, not a design: real CD never had a class 675 (the
number is the Ukrainian EJ675, a restyled Skoda body), and vlakosimdb's 675, 075
and 975 repeat the 471 set's layout pixel for pixel in another paint. The variant
keeps every dimension and changes the paint, the class numbers and the running
number ([sources](../../assets/cd-471/SOURCES.md)).

| design, car | length over couplers | triangles |
|---|---|---|
| CD 471 motor car, driving trailer | 26.05 m | about 7,300 and 6,600 |
| CD 471 trailer | 25.70 m | about 5,900 |
| CD 680 end car | 27.70 m | about 8,100 |
| CD 680 intermediate cars | 25.90 m | about 6,600 to 7,500 |

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
bogie, the cabs facing +X, the CD 675 sharing the 471's bounds; the running
numbers' check digits; the 680's lengths, width, tumblehome, roof, 2.7 m
wheelbase and which cars carry a pantograph; and both default cars within their
landmarks' pixel tolerances. `test/params.test.ts` and `test/models.test.ts`
cover every design generically.
