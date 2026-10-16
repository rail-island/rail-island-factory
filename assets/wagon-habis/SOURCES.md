# Habis sliding-wall wagon source references

**Covers** - provenance, coordinate conversion and reconstruction choices.
**Code** - `generator/freightWagons.ts`, `generator/hopperWagons.ts`, `generator/freightWagonParts.ts`, `generator/freightTransfers.ts`, `native/*/landmarks.json`.
**See also** - [photos](PHOTOS.md), [comparison (tw1)](COMPARISON.md), [freight wagons](../../docs/models/freight-wagons.md).

## Original evidence

All native files come from `janproch/vlakosimdb` revision `b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`, directory `db/train/truck/`. Each `native/<key>/` holds the unchanged `vehicle.xml` (the folder's metadata, Windows-1250), the model `index.xml` (the `simplemodel`), its BMPs and any inline sub-model folder. No `_4x` texture was used or copied.

| native folder | vlakosimdb folder | metadata | parameter |
|---|---|---|---|
| `native/n_habis_tw1/` | `n_habis_tw1` | N_Habis_TW1, "Habis Transwaggon 1", 50 t, 160 km/h, author Vojtech Vohlidka | `livery=tw1` (default) |
| `native/n_habis_tw2/` | `n_habis_tw2` | N_Habis_TW2, "Habis Transwaggon 2", the same geometry with weathered brown BMPs | `livery=tw2` |

`veh-habis-sliding-wall-wagon` uses procedural surfaces and solid-colour materials; nothing reads a database checkout or a texture at run time.

## Coordinates and reconstruction

Source `(x, y, z)` is Factory `(x - centre, y, z)` in metres; the BMP painted by the sixth colorize direction (z_dec, or z_both) is the right (+Z) side, the fifth the left; the side canvas starts at source x = 0, 0.1 m a pixel. See [freight-wagons.md](../../docs/models/freight-wagons.md) for the shared builder and deviations.

- Centre 11.6 m (buffer heads 0 and 23.2 m); bogies at 2.85 and 20.45 m with a 1.8 m wheelbase (the XML wheel contacts 1.95, 3.75, 19.55, 21.35 m).
- The body is the XML `base2` section: walls at |z| 1.5 from 1.1 to 3.2 m, the roof to 4.1 m, in two sliding walls 0.5..11.5 and 11.7..22.7 m with the centre post between; posts every 1.1 m (XML bars), the light top rail and the bottom rail; the end frames (`front`) narrowing to 0.8 m and the ridge up to 4.3 m.
- The TRANSWAGGON plate, label board and black data panel follow the native z_dec / z_inc boxes (plate 8.7..14.6 m, 2.0..2.7 m on +z).
- The x_both (rear) and 2x_both (front) end BMPs differ only in paint; the ends are modelled alike.

## Running number

`31 55 2763 185-9`: the Transwaggon Habis on the photograph habis-kecskemet.jpg (keeper painted MAV).

## Photographs

Prototype: a Transwaggon Habis four-axle sliding-wall wagon, 23.2 m over buffers, two sliding walls per side. Confidence: high. See [PHOTOS.md](PHOTOS.md).

## Measurement record

Each compared `native/<key>/landmarks.json` holds the native pixel-edge boxes with their model scopes, tolerances and uncertainty; `baseline.json` is the measurement of the geometry the boxes were first checked against. The annotations were measured after the geometry had been laid out from the XML and the BMP columns, so baseline and final coincide. The `COMPARISON*.md` files list the normalized errors and the signed residual of every box with the model revision. Liveries that share the default's geometry are not measured apart.
