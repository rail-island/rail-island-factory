# CD 471 CityElefant source references

**Covers** - provenance, coordinate conversion, the three cars and the CD 675 variant, dimensions and reconstruction choices.
**Code** - `generator/emu471.ts`, `generator/emuParts.ts`, `generator/csdCoachParts.ts`, `generator/emuComparison.ts`, `native/cd_471/landmarks.json`.
**See also** - [comparison (471 motor car)](COMPARISON.md), [photos](PHOTOS.md), [Czech electric units](../../docs/models/czech-emus.md).

## Original evidence

All native files come from `janproch/vlakosimdb` revision `b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`, directories `db/train/emu/cd 471/` and `db/train/emu/cd 675/`, one folder each under `native/`:

| folder | vlakosimdb | author (index.xml) | model `unit`, `variant` |
|---|---|---|---|
| `native/cd_471/` | cd 471/cd_471 (CD 471, 70 t, 140 km/h) | Vojtech Vohlidka | motorCar, cd471 (the default) |
| `native/cd_071/` | cd 471/cd_071 (CD 071, 50 t) | Jan Prochazka | trailer, cd471 |
| `native/cd_971/` | cd 471/cd_971 (CD 971) | Jan Prochazka | drivingTrailer, cd471 |
| `native/cd_675/` | cd 675/cd_675 (CD 675, 160 km/h), with its `pant1` inline | Vojtech Vohlidka | motorCar, cd675 |
| `native/cd_075/` | cd 675/cd_075 | Vojtech Vohlidka | trailer, cd675 |
| `native/cd_975/` | cd 675/cd_975 ("CD 975*") | Vojtech Vohlidka | drivingTrailer, cd675 |

Each holds `vehicle.xml` (the unchanged Windows-1250 metadata), `index.xml` (the unchanged simplemodel: `alongx`/`alongy`/`alongz` clips, colorizes, polygons) and the original BMPs (0.1 m a pixel). No 4x texture was used or shipped. Nothing reads a database checkout or a texture at run time; the model is procedural with solid-colour materials.

## Why the CD 675 is a variant, not a design

Real CD never ran a class 675; the number belongs to the Ukrainian EJ675, a later Skoda double-deck unit with a different, restyled body. vlakosimdb's "CD 675 / 075 / 975" is the 471 body in another paint: its side BMPs repeat the 471/071/971 window, door and band layout pixel for pixel, three columns to the right (the 675 XML starts the nose 0.3 m later and traces the upper wall a little lower, a tracing difference, not a body). So it is one more value of the 471 design: `variant` cd675 keeps every dimension and changes the paint (red band, dark green stripe, red doors, dark red door canopies, ochre apron edge), the class numbers (675, 075, 975) and the running number. A test checks both variants have the same bounds.

## Coordinates and reconstruction

- Body metres `b` run from the inner end wall (0) to the cab tip (25.1 m) or the far end wall (trailer: 25.3 m). The 471's BMP has its cab at column 0: `b = 25.1 - u / 10`. The 071: `b = u / 10 - 0.2`. The 971's XML body is 24.4 m against the 471's 25.1 m (the two authors traced it differently; the real cars are equal): its columns are stretched by 25.1 / 24.4, `b = (u / 10 - 0.2) * 1.0287`.
- Factory `X = b - centre`, the centre midway between the coupling faces: the inner gangway bellows (0.2 m beyond the wall) and the cab's centre coupler (0.75 m ahead of the nose tip) or the far bellows. Cab cars 26.05 m, the trailer 25.7 m over them; the set 77.8 m against the published 79.2 m, the vlakosimdb bodies being about 1.4 m short in all.
- Heights: the XML roof is 4.8 m, the published height 4.635 m: every source height is scaled by `K_Y = 4.635 / 4.8 = 0.9656` (`y = K_Y * (6 - v / 10)`). Widths: the XML section is 3.0 m, the published width 2.82 m: `K_Z = 0.94`. The comparison reports both the physical residual and the residual with these scales undone.
- Section (`alongx`): vertical walls from 0.4 to 3.8 m, the upper wall leaning in to 1.2 m at 4.4 m, roof 1.4 m wide at 4.8 m, floor chamfer to 0.2 m.
- Elevation (`alongz`): the single-level ends stand on 0.9 m; between the bogies the floor drops to 0.2 m (the 471 from body 5.4 to 19.5 m with 0.4 m slopes, the 071 5.3 to 20.0 m, the 971 5.6 to 19.3 m). The cab nose leans back 0.6 m from 1.6 m to 4.1 m and rounds to the roof at 1.6 m back; an undercut runs down to 0.9 m 0.3 m back, over an apron 0.2 to 0.9 m. The motor car's pantograph stands in a roof well 4.2 m high between body 2.2 and 5.0 m (XML x 20.1 to 22.9).
- Bogies: pivots 19.0 m apart (published) centred on the source bogie midpoint, body 3.15 and 22.15 m; 2.6 m wheelbase under the motor car (with traction motors), 2.4 m under the trailers; 920 mm wheels.
- Windows, doors, the canopies, the yellow line, the red stripes, the trim line, the louvres, the emblem and the running number are native pixel boxes from each car's own `z_both.bmp`; the cab front from the 471's `x_inc.bmp`, the inner ends from `x_dec.bmp`.

## Deliberate choices

- The front stripe is held to the 2.26 m wide nose tip; the BMP paints it across its full 3 m canvas.
- The pantograph is a single-arm one on four insulators, raised (one per motor car), hinged toward the inner end with the knee toward the cab, as the BMP draws it; its head stands 5.73 m above the rail.
- The upper windows over the doors have a transom bar at native row 21, the opening top light the BMP shows.
- The blue band runs onto the nose's sides (the BMP's front corners are white): the band is one painted volume band.

## Running numbers

`elefantNumber()`: the 471 set carries 471 014-1, 071 014-5 and 971 014-6 (the motor car's number is legible on `photo-471-014-front-three-quarter-srbsko-2010.jpg`, a unit in the modelled livery; the trailer's and driving trailer's share the set's serial). The cd675 variant carries the illustrative 675 001-2, 075 001-8 and 975 001-9. All check digits are valid (`tractionCheckDigit`).

## Measurement record

`native/cd_471/landmarks.json` holds 34 native pixel-edge boxes (23 side, 8 cab front, 3 inner end) with their model scopes, tolerances and uncertainty; `baseline.json` is the geometry's measurement when the annotations were fixed. [COMPARISON.md](COMPARISON.md) lists the normalized errors and the signed residual of every box at the model revision.
