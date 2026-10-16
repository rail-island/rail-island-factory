# Hadgs covered hopper wagon source references

**Covers** - provenance, coordinate conversion and reconstruction choices.
**Code** - `generator/freightWagons.ts`, `generator/hopperWagons.ts`, `generator/freightWagonParts.ts`, `generator/freightTransfers.ts`, `native/*/landmarks.json`.
**See also** - [photos](PHOTOS.md), [comparison](COMPARISON.md), [freight wagons](../../docs/models/freight-wagons.md).

## Original evidence

All native files come from `janproch/vlakosimdb` revision `b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`, directory `db/train/truck/`. Each `native/<key>/` holds the unchanged `vehicle.xml` (the folder's metadata, Windows-1250), the model `index.xml` (the `simplemodel`), its BMPs and any inline sub-model folder. No `_4x` texture was used or copied.

| native folder | vlakosimdb folder | metadata | parameter |
|---|---|---|---|
| `native/n_hadgs/` | `n_hadgs` | N_Hadgs, "Hadgs", 25 t, 120 km/h, author Borek Hudak | fixed |

`veh-hadgs-hopper-wagon` uses procedural surfaces and solid-colour materials; nothing reads a database checkout or a texture at run time.

## Coordinates and reconstruction

Source `(x, y, z)` is Factory `(x - centre, y, z)` in metres; the BMP painted by the sixth colorize direction (z_dec, or z_both) is the right (+Z) side, the fifth the left; the side canvas starts at source x = 0, 0.1 m a pixel. See [freight-wagons.md](../../docs/models/freight-wagons.md) for the shared builder and deviations.

- Centre 8.4 m (buffer heads 0 and 16.8 m, XML `nar`); bogies at 2.9 and 13.8 m with a 1.8 m wheelbase (axles 2.0, 3.8, 12.9, 14.7 m).
- The body is the XML `base` section (its notch under the sills given to separate sill boxes) over 0.3..16.5 m, 1.0..4.3 m; body colour up to the roof shoulder at 3.9 m, the roof colour above it over 0.5..16.4 m (native rows 1..3).
- The doors (XML `door` 3.0..6.0 and 10.8..13.8 m, 1.1..3.6 m) on their rails, each with five stiffeners every 0.7 m and two inverted-V braces (native columns 31..59, 109..137); posts at the native columns outside the doors; X braces on the ends.
- Width: the XML body is 3.0 m and its doors 3.2 m; the model keeps the 3.1 m rail envelope (body 2.9 m, doors and handles to 3.09 m).

## Running number

`31 54 2604 769-4`: read from the photograph hadgs-praha-01.jpg (its Commons description misprints 796-4).

## Photographs

Prototype: the CD Hadgs covered grain hopper wagon (Commons files it under transport of grain), 16.8 m over buffers, two sliding doors per side, a curved roof with hatches. Confidence: high. See [PHOTOS.md](PHOTOS.md).

## Measurement record

Each compared `native/<key>/landmarks.json` holds the native pixel-edge boxes with their model scopes, tolerances and uncertainty; `baseline.json` is the measurement of the geometry the boxes were first checked against. The annotations were measured after the geometry had been laid out from the XML and the BMP columns, so baseline and final coincide. The `COMPARISON*.md` files list the normalized errors and the signed residual of every box with the model revision. Liveries that share the default's geometry are not measured apart.
