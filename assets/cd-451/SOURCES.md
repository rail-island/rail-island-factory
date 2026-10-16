# CD 451 source references

**Covers** - provenance, coordinate conversion, the two cars, dimensions and reconstruction choices.
**Code** - `generator/emu451.ts`, `generator/emuClassicKit.ts`, `generator/emuParts.ts`, `generator/csdCoachParts.ts`, `generator/emuComparison.ts`, `native/cd_451/landmarks.json`.
**See also** - [comparison (451 motor car)](COMPARISON.md), [photos](PHOTOS.md), [older Czech electric units](../../docs/models/czech-emus-classic.md).

## Original evidence

All native files come from `janproch/vlakosimdb` revision `b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`, directory `db/train/emu/cd 451/`, one folder each under `native/`:

| folder | vlakosimdb | author (index.xml) | model `unit` |
|---|---|---|---|
| `native/cd_451/` | cd 451/cd_451 (CD 451, 59 t, 660 kW, 100 km/h) | Jan Prochazka | motorCar (the default) |
| `native/cd_051/` | cd 451/cd_051 (CD 051, 40 t) | Jan Prochazka | trailer |

Each holds `vehicle.xml` (the unchanged Windows-1250 metadata), `index.xml` (the unchanged simplemodel: `alongx`/`alongy`/`alongz` clips, colorizes and, for the 451, the baked polygons) and the original BMPs (0.1 m a pixel; the 051's 60-row `x_both.bmp` is stretched over 5 m). No 4x texture was used or shipped. Nothing reads a database checkout or a texture at run time; the model is procedural with solid-colour materials.

## Coordinates and reconstruction

- vlakosimdb draws both cars with the cab (or the first end) at low source x; the colorize `em475_x_inc` paints the faces looking toward -x, the cab front. Body metres run from the inner end wall: `b = K_X * (srcEnd - x)` with `srcEnd` 24.8 m (451) and 24.3 m (051); the Factory frame centres the car between its coupling faces and puts the cab at +X.
- Length: the published 95.29 m of the four-car set over the couplers (cs.wikipedia) against the XML's 98.8 m (two motor cars of 24.3 m body plus the coupler 0.55 m ahead of the nose and the bellows 0.15 m, two trailers of 24.1 m plus two bellows): `K_X = 95.29 / 98.8 = 0.9645` scales every length. The motor car is 24.11 m, the trailer 23.53 m over the coupling faces. Heights and widths are the XML's (3.0 m wide; the published height is not known to us).
- Motor car section (`alongx`): vertical walls to 3.3 m, the roof curving in to 1.6 m wide at 3.8 m. Elevation (`alongz`): the floor at 0.8 m over the bogies drops to 0.4 m between source x 6.6 and 20.4 m; the nose face runs straight from the tip at 1.2 m (x 0.5) back to 3.3 m (x 1.1) and rounds into the roof by x 1.6; under the tip it falls back to 0.8 m at x 0.6. Plan (`alongy`): the nose rounds from 0.4 m half-width at the tip to the full 1.5 m at x 2.0 (the XML's tip is a point; the model keeps 0.4 m so the loft has a ring there).
- The nose is its own volume (source x 0.5 .. 2.4) painted in the front's bands from `em475_x_inc`: blue to 1.2 m, light grey, blue 2.2 .. 2.5 m, the windscreen as a glass band 2.5 .. 3.25 m that wraps round to the cab side windows, blue, roof grey. The body behind it is blue to 1.2 m, light grey to 2.2 m, blue to 3.3 m, then the roof; a light grey panel 2.2 .. 2.7 m from the first door to the inner end gives the passenger part its narrower band, as the side BMP paints it.
- The lamp pods are the XML `light` sections (z 0.95 .. 1.5 m, 1.0 .. 1.8 m) swept from source x 0.7 back into the nose, with a white and a red lens each as `em475_x_inc` shows; the roof lamp housing is the XML `light` polygon over the cab (x 1.1 .. 2.35 m), kept at 3.82 m instead of the XML's 3.9 m.
- Roof: the ventilator housing over the saloon is the XML roof box (x 9.3 .. 18.1 m, to 4.2 m) with the louvres of `em475_z_both` row 19; the diamond pantograph (the XML's `/pantdbl` inline at x 22.64 m) stands raised over the inner bogie, its head at 5.75 m.
- Bogies at the XML's centres (motor car 4.4 and 22.6 m, trailer 2.4 and 22.1 m, scaled), 2.5 m wheelbase with traction motors and 1000 mm wheels under the motor car, 2.4 m and 920 mm under the trailer.
- Windows, doors, louvres, the machine-room and luggage doors are native pixel boxes from each car's own side BMP; the cab front from `em475_x_inc`, the inner end from `em475_x_dec` (the 051's `x_both`). The Scharfenberg coupler head keeps its 0.34 m size (`emuParts.centreCoupler`) where the BMP paints the whole draw gear dark.

## Running numbers

`NUMBERS_451`: the motor car carries 451 032-7, legible on `photo-451-032-front-ricany-2007.jpg` (a car in the modelled livery), on its nose and sides; the trailer the illustrative 051 032-1 of the same technical unit. Both check digits are valid (`tractionCheckDigit`).

## Measurement record

`native/cd_451/landmarks.json` holds 24 native pixel-edge boxes (15 side, 7 cab front, 2 inner end) with their model scopes, tolerances and uncertainty; `baseline.json` is the geometry's measurement when the annotations were fixed. [COMPARISON.md](COMPARISON.md) lists the normalized errors and the signed residual of every box at the model revision.
