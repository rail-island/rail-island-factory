# CSD M 240.0 source references

**Covers** - provenance, coordinate conversion, dimensions and reconstruction choices of `veh-csd-m240`.
**Code** - `generator/dmuM240.ts`, `generator/dmuKit.ts`, `generator/dmuComparison.ts`, `native/csd_m240/landmarks.json`.
**See also** - [comparison](COMPARISON.md), [photos](PHOTOS.md), [Czech diesel railcars](../../docs/models/czech-dmus.md).

## Original evidence

`native/csd_m240/`: `janproch/vlakosimdb` revision `b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`, db/train/dmu/csd_m240 ("CSD M 240", 37 t, 250 kW, 70 km/h), author Vojtech Vohlidka: `vehicle.xml`, `index.xml` (unchanged) and the original BMPs (0.1 m a pixel).

## Dimensions

CSD M 240.0 "Singrovka" (later 820; Vagonka Tatra Studenka, 1959-64, 122 built, 2' B'): 18,500 mm over the buffers (cs.wikipedia "Motorovy vuz 820").

## Coordinates and reconstruction

- z_both 191 x 40 px on 19.1 x 4 m, x_both 30 x 40 px. Source x = column / 10, y = 4 - row / 10. The XML runs 0.05 to 19.05 m over the buffers: x is scaled by 18.5 / 19.0 = 0.97368 (`K240`) about 9.55 m.
- Section, plan (both ends rounding in to 1.2 m) and the roof elevation as the XML clips them; the XML's 0.1 m rake of the ends above 1.9 m is left out so the end windows lie on the end's plan. The central skirt (XML 5.0 to 14.1 m) reaches 0.4 m.
- Paint: red 0.9 to 1.85 m between cream (the BMP's skirt row and the photographs), cream upper body and roof.
- The cab side windows wrap round the rounded ends in the BMP; the model keeps them on the side from column 7 (row S04 of the comparison).
- Bogies at the XML's pivots, 3.2 and 15.9 m (12.4 m apart scaled), 2.0 and 2.1 m wheelbase, 900 mm wheels; the powered bogie (B') at +X.

## Running number

M 240.0113 (preserved in running order, PHOTOS.md), in the pre-1988 Kryspin designation.
