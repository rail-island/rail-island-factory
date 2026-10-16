# DB 628 source references

**Covers** - provenance, coordinate conversion, dimensions and reconstruction choices of `veh-db-628`.
**Code** - `generator/db628.ts`, `generator/unitParts.ts`, `generator/csdCoachParts.ts`, `generator/unitComparison.ts`, `native/db_628/landmarks.json`.
**See also** - [comparison (mint motor car)](COMPARISON.md), [photos](PHOTOS.md), [foreign multiple units](../../docs/models/foreign-units.md).

## Original evidence

All native files come from `janproch/vlakosimdb` revision `b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`, directory `db/train/dmu/`, both by Karola Meyer:

| folder | vlakosimdb | title (index.xml) | model |
|---|---|---|---|
| `native/db_628/` | db_628 | "DB 628", 423 kW, 100 km/h | `livery` mint (the default) |
| `native/db_628vr/` | db_628vr | "DB 628 VR" | `livery` red |

Each holds `vehicle.xml` (the unchanged Windows-1250 metadata), `index.xml` (the unchanged simplemodel, named "843" after the model it was derived from), `image.bmp` and the original BMPs: `843_z_both.bmp` (250 x 50, both sides, 0.1 m a pixel), `843_x_both.bmp` (the cab front), `843_x_a.bmp` (the inner end with the gangway; both 30 x 60 pixels mapped onto 3 x 5 m, so a row is 1/12 m) and `843_y_dec.bmp` (the roof). `db_628vr` repeats the motor car's layout in the red paint; it is not the 928 driving trailer.

## Dimensions

- Length: 45.40 m over the buffers of the 628.2 / 928.2 set (de.wikipedia "DB-Baureihe 628"): the model is 22.70 m from the cab's buffer faces to the middle of the short coupling.
- Wheels 770 mm (628.2 and later, de.wikipedia); floor 1.21 m.
- Width 3.0 m and roof 3.8 m are the XML's; no published width or height was found.
- Bogies: the BMP's wheel columns (31 / 50 and 182 / 201): centres 15.1 m apart, 1.9 m wheelbase. The inner bogie is powered (the 628's engine drives the bogie at the short-coupled end).
- Running numbers: 628 289-1 (photographed in mint, 1993) and 628 305-5 (photographed in red, 2012), with the DB/UIC check digit; the scheme is checked against the CFL's 628 505-0 / 928 505-7 and 628 207-3, legible on a photograph.

## Coordinates and reconstruction

- Source x runs from the BMP's left edge (the cab) to the inner end wall at 22.1 m and the gangway at 22.4 m. Body metres `b = 22.45 - x`, so the cab faces +X; Factory `X = b - 11.35`.
- Section (`alongx`): a box 3.0 m wide to 3.8 m; the roof's edges are rounded after the photographs (vertical walls to 3.45 m, the roof's curve to 3.8 m).
- Elevation (`alongz`): the cab front from the tip at 1.7 m (0.2 m back) up to 3.4 m (0.9 m back) and on into the roof at 2.2 m; the lower front back to 0.4 m at 0.9 m; the skirts at 0.5 m before the first bogie and beyond the second. vlakosimdb runs the sides down to the rail and paints the bogies; the model's body stops at 0.8 m over and between the bogies, which are built.
- Paint (side, native rows): white to 1.5 m, pale blue to 1.8 m, mint to 3.1 m, white to 3.45 m, the grey roof; red: grey to 1.1 m, white to 1.3 m, red to 3.0 m, a white line, red to 3.45 m. The cab front's paint from `843_x_both.bmp` (1/12 m rows): the windscreen from 2.08 to 3.17 m, mint, pale blue and light grey below.
- Windows, doors with their upper and lower windows, the cab side window, class numerals, the DB logo, the fuel filler and the running number: native pixel boxes on `843_z_both.bmp`. The gangway frame and its door from `843_x_a.bmp`.

## Deliberate choices

- Lamps: two headlights with the tail lights inside them low on the lower front, the round centre lamp under the windscreen and the DB logo between the headlights, after the photographs; the BMP shows none.
- The screw coupling, buffers and hoses at the cab; a short centre coupler at the inner end (the real set is short-coupled).

## Measurement record

`native/db_628/landmarks.json` holds 20 native pixel-edge boxes (15 side, 3 cab front, 2 inner end) with their model scopes, tolerances and uncertainty; `baseline.json` is the geometry's measurement when the annotations were fixed. [COMPARISON.md](COMPARISON.md) lists the normalized errors at the model revision.
