# CD 470 source references

**Covers** - provenance, coordinate conversion, the two cars, dimensions and reconstruction choices.
**Code** - `generator/emu470.ts`, `generator/emuClassicKit.ts`, `generator/emuParts.ts` (`pantograph`), `generator/czElectricKit.ts` (`buffers`), `generator/csdCoachParts.ts`, `generator/emuComparison.ts`, `native/cd_470/landmarks.json`.
**See also** - [comparison (470 motor car)](COMPARISON.md), [photos](PHOTOS.md), [older Czech electric units](../../docs/models/czech-emus-classic.md).

## Original evidence

All native files come from `janproch/vlakosimdb` revision `b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`, directory `db/train/emu/cd 470/`, one folder each under `native/`:

| folder | vlakosimdb | author (index.xml) | model `unit` |
|---|---|---|---|
| `native/cd_470/` | cd 470/cd_470 (CD 470, 70 t, 1000 kW, 120 km/h), its `pant1` inline as `pant1_*` | Vojtech Vohlidka | motorCar (the default) |
| `native/cd_070/` | cd 470/cd_070 (CD 070, 55 t) | Vojtech Vohlidka | trailer |

Each holds `vehicle.xml` (the unchanged Windows-1250 metadata), `index.xml` (the unchanged simplemodel) and the original BMPs (0.1 m a pixel). `downx_inc.bmp` is the motor car's lower front under the condition `+d`; no 4x texture exists or was used.

## Coordinates and reconstruction

- Both cars have the cab (or the first end) at low source x; `x_inc` paints the cab front. Body metres `b = K_X * (24.3 - x)`.
- Length: the published 132 m of the five-car set over the buffers (cs.wikipedia) against the XML's five cars of 24.5 m (buffers at x 0 and 24.5, walls at 0.2 and 24.3): `K_X = 132 / 122.5 = 1.0776`, so every car is 26.4 m. Heights and widths are the XML's: 3.0 m wide, the motor car's roof at 4.1 m, the double-deck trailer's at 4.7 m (the repository's fixed-equipment limit).
- Motor car section (`alongx`): walls 0.5 .. 3.3 m, the roof's curve to 4.1 m; trailer: the upper wall leaning in from 3.8 m to the 4.7 m roof, 1.2 m wide at the top. Both floors drop to 0.3 m between the bogies (motor car 6.0 .. 18.4 m, trailer 5.6 .. 18.9 m), the strip below 0.9 m painted the BMPs' grey.
- The cab (`alongz` `base` and `front`): the windscreen face rakes back from x 0.2 at 1.8 m to x 0.5 at 3.6 m and rounds into the roof by x 1.0; below 1.8 m the lower face leans forward from x 0.4 at 0.9 m. The cab section is two volumes from x 0.2 to 1.7 m in the front's bands (`x_inc`: green, yellow 1.4 .. 2.1 m, green), to the cab door where the side BMP starts its yellow band at 2.7 .. 3.3 m. Windscreen frame and panes, the top lamp, a white lamp over a red one each side, the running number, the parted plough plates and the rectangular buffers with the screw coupling.
- The raised roof at the motor car's inner end, where the car meets the double-deck trailer: the trailer's roof profile to 4.7 m from source x 21.4 m as `z_both` draws it (the XML clips it from 22.6 m).
- Pantographs: single-arm, the `pant1` inline, two per motor car, placed where `z_both` draws them (centres 2.8 and 20.4 m; the XML inlines stand at their ends): the cab one folded, the inner one raised (the XML's sy 0.3 and 1.3), the knee toward the cab.
- Bogies at the XML's centres (motor car 3.55 and 20.95 m, trailer 3.05 and 21.45 m, scaled), 2.4 m wheelbase, 1000 mm wheels and traction motors under the motor car, 900 mm under the trailer. Rectangular buffers and a gangway at every inner end, as the XML `frame` clips have them.
- Windows, doors, louvres and the cab door are native pixel boxes from each car's `z_both.bmp`; the upper deck's nine windows sit on the leaning upper wall.

## Running numbers

`NUMBERS_470`: the motor car carries 470 001-9, the green set's first car, legible on `photo-470-001-ostrava-svinov-1991.jpg`; the trailer the illustrative 070 001-3. Both check digits are valid (`tractionCheckDigit`).

## Measurement record

`native/cd_470/landmarks.json` holds 22 native pixel-edge boxes (14 side, 7 cab front, 1 inner end) with their model scopes, tolerances and uncertainty; `baseline.json` is the geometry's measurement when the annotations were fixed. [COMPARISON.md](COMPARISON.md) lists the normalized errors and the signed residual of every box at the model revision.
