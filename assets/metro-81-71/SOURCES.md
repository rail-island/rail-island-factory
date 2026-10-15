# Metro 81-71 source references

**Covers** - provenance, coordinate mapping, dimensions and reconstruction choices of `veh-metro-81-71`.
**Code** - `generator/metro.ts` (`metro8171`, `METRO_MAP`), `generator/tramKit.ts`, `native/m_mmz_81-71l/landmarks.json`.
**See also** - [comparison](COMPARISON.md), [photos](PHOTOS.md), [trams and metro](../../docs/models/trams.md).

## Original evidence

From `janproch/vlakosimdb` revision `b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`, unchanged:

| folder | vlakosimdb | title | author | model value |
|---|---|---|---|---|
| `native/m_mmz_81-71l/` | `db/train/metro/mmz/m_mmz_81-71l` | MMZ_81-71 pred. | Borek Hudak | `unit` headCar (default) |
| `native/m_mmz_81-71v/` | `db/train/metro/mmz/m_mmz_81-71v` | MMZ_81-71 stred | Borek Hudak | `unit` middleCar |

Each holds `vehicle.xml`, the simplemodel `index.xml`, the native BMPs (`x_inc`, `x_dec`, `y_dec`, `z_both`) and `image.bmp`. No `_4x` texture was used.

## Coordinates and mapping

`z_both` maps 200 x 60 px to x 0..20 m, y 0..6 m and paints both sides alike; `x_inc` / `x_dec` 30 x 60 px to z -1.5..1.5 m, y 0..6 m. `x_inc` (the cab) is the x = 0 end, the model's front.

X = (c - x) * 19.21 / 20, Y = y * 3.65 / 3.7, Z = -z * 2.7 / 3.0

c is the couplers' midpoint (10.0 m for the head car, 9.9 m for the middle car). The drawing's cars are 20 m over the couplers and 3.0 m wide; the published 81-71 (Metrovagonmash; cs.wikipedia "81-71") is 19.21 m over the couplers, 2.7 m wide and 3.65 m high, with 780 mm wheels, a 2.1 m bogie wheelbase and 12.6 m between the bogie pivots. Prague ran it on standard gauge (1.435 m); the bogie pivots are placed the published 12.6 m apart about the drawing's own bogie midpoint.

## Reconstruction

- Body: the `alongx` section (sides to 3.1 m, the roof rounding to a 3.7 m crown), the plan's rounded corners, the elevation (the head car's cab apron reaching down to 0.7 m, the floor line at 1.0 m elsewhere).
- Paint: a silver body over a ribbed lower side (light ribs between the doors, z_both rows 41..48), a grey roof; four red sliding doors a side with a yellow band (rows 39..40) and two lights each; the head car's cab door and dark front mask with two windscreens and four lamps; intercar ends with a gangway door and two windows.
- Underframe: the equipment boxes from the XML between the bogies; third-rail current collector shoes on both bogies, each side (`photo-81-71-third-rail-shoe.jpg`). No pantograph.

## Fleet numbers

`3072` (head car) and `3172` (middle car), painted on the sides: illustrative Prague numbers in the fleet's four-digit format; no number is legible on the photographs.

## Measurement record

`native/m_mmz_81-71l/landmarks.json` holds 15 native boxes (z_both, x_inc) of the head car; `baseline.json` the first authored geometry's (before the published bogie pivot distance was adopted). See [COMPARISON.md](COMPARISON.md).
