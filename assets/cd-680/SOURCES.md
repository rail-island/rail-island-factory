# CD 680 Pendolino source references

**Covers** - provenance, coordinate conversion, the four cars, dimensions and reconstruction choices.
**Code** - `generator/emu680.ts`, `generator/emuParts.ts`, `generator/csdCoachParts.ts`, `generator/emuComparison.ts`, `native/cd_681/landmarks.json`.
**See also** - [comparison (681 end car)](COMPARISON.md), [photos](PHOTOS.md), [Czech electric units](../../docs/models/czech-emus.md).

## Original evidence

All native files come from `janproch/vlakosimdb` revision `b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`, directory `db/train/emu/cd 680/`, all four by Borek Hudak:

| folder | vlakosimdb | title (index.xml) | model `unit` |
|---|---|---|---|
| `native/cd_681/` | cd_681 | "CD 681 1. a 7*. vuz" (cars 1 and 7), 1500 kW | endCar (the default) |
| `native/cd_683/` | cd_683 | "CD 683 3.vuz" (car 3) | car683 |
| `native/cd_685/` | cd_685 | "CD 685 2*. a 6. vuz" (cars 2 and 6), 1500 kW | car685 |
| `native/cd_686/` | cd_686 | "CD 686 4-5. vuz" (cars 4 and 5) | car686 |

Each holds `vehicle.xml` (the unchanged Windows-1250 metadata), `index.xml` (the unchanged simplemodel) and the original BMPs (0.1 m a pixel). Only `z_inc.bmp` paints the sides (both of them); `z_dec.bmp` is an unused leftover (a red coach) kept as found. The class numbers 683, 685 and 686 are vlakosimdb's own: the real set is 681, 081, 683, 084, 684, 082, 682. The 685 and 686 share their BMPs except the 685's pantograph; the 683 has a blind section with a hatch where the 686 has its first five windows, and a second roof cover.

## Coordinates and reconstruction

- Source x runs from the BMP's left edge (the 681's cab tip) to 25.0 m (the gangway face). Body metres `b = (25.0 - x) * k`, so every car faces +X (the 681's cab at the +X end); `k` stretches vlakosimdb's 25.0 m cars to the published lengths: 27.7 / 25.0 = 1.108 for the end car, 25.9 / 25.0 = 1.036 for the intermediate cars. Factory `X = b - length / 2`.
- Widths: the XML section is 3.0 m, the published width 2.8 m: `K_Z = 0.9333`. Heights are the XML's (roof 3.6 m, roof covers 4.0 m); no published height was found.
- Section (`alongx`): a chamfer from 0.2 to 0.9 m, the vertical wall to 1.9 m, the tilting train's tumblehome in to 1.4 m at 3.3 m, a steep roof edge to 1.3 m at 3.4 m and the roof 1.2 m wide at 3.6 m.
- Elevation (`alongz`): the body stands on 0.8 m over the bogies and drops to 0.2 m in the skirts between the bogies (x 5.7/6.0 to 19.3/19.6) and beyond the inner bogie (from 23.4/23.7); the intermediate cars also beyond the first bogie (to 1.4/1.7). The 681's nose: a pointed plan (half widths 1.1 at 0.1 m, 1.3 at 0.3 m, 1.4 at 0.9 m, 1.5 from 1.8 m), the tip at 0.9 to 1.1 m, the windscreen slope from 1.7 m (0.2 m back) to 3.4 m (1.8 m back), the roof from 2.4 m; under it the bottom from 0.9 m down to 0.5 m and the plough to 0.2 m (the "nar" clip).
- Paint (native rows at a window column): teal 0.2 to 1.0 m, light grey to 1.8 m, a yellow line to 1.9 m, the black window band to 3.0 m, a light grey line, teal to 3.4 m and the dark grey roof edge. The nose and the cab section behind it (columns 0 to 50) have their own bands: the dark cap over the yellow line, light grey up to the roof's teal.
- Windows (glass boxes on the black band), doors (outline, a teal-and-dark leaf, window), the signs, the skirt panels, the emblem, the 683's hatch: native pixel boxes on each car's `z_inc.bmp`. Cab front from the 681's `x_inc.bmp`, gangway ends from `x_dec.bmp`.
- Bogies: the source positions (681 x 3.8 and 21.5 m, intermediate cars 3.6 and 21.5 m) stretched with the car; a tilting bogie with a 2.7 m wheelbase on 890 mm wheels (the Fiat bogie of the ETR 460 family), long side frames, a tilting bolster with actuators, secondary springs and yaw dampers.

## Deliberate choices

- Pantographs: one, raised, on the 681 and the 685 at XML x 21.8 m (each car's `/pant` inline and its BMP), on the roof 3.6 m high; the head stands 5.42 m above the rail. `photo-680-side-pantograph-chocen-2006.jpg` shows the raised pantograph near the end car's inner end.
- The roof fairing behind the cab follows the XML's "light" clip (3.8 m); the cab front BMP's dark band at 3.5 to 4.0 m is the roof cover seen from ahead, and is compared as such.
- The cab's side windows (the BMP's columns 11 to 20) lie on the nose slope above the XML's elevation and are not modelled; the windscreen is.

## Measurement record

`native/cd_681/landmarks.json` holds 23 native pixel-edge boxes (15 side, 5 cab front, 3 gangway end) with their model scopes, tolerances and uncertainty; `baseline.json` is the geometry's measurement when the annotations were fixed. [COMPARISON.md](COMPARISON.md) lists the normalized errors and the signed residual of every box at the model revision; with the documented length and width scales undone the residual is the transfer itself.
