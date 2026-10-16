# Sqns container wagon source references

**Covers** - provenance, coordinate conversion and reconstruction choices.
**Code** - `generator/freightWagons.ts`, `generator/hopperWagons.ts`, `generator/freightWagonParts.ts`, `generator/freightTransfers.ts`, `native/*/landmarks.json`.
**See also** - [photos](PHOTOS.md), [comparison (empty)](COMPARISON-empty.md), [comparison (maersk)](COMPARISON-maersk.md), [freight wagons](../../docs/models/freight-wagons.md).

## Original evidence

All native files come from `janproch/vlakosimdb` revision `b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`, directory `db/train/truck/`. Each `native/<key>/` holds the unchanged `vehicle.xml` (the folder's metadata, Windows-1250), the model `index.xml` (the `simplemodel`), its BMPs and any inline sub-model folder. No `_4x` texture was used or copied.

| native folder | vlakosimdb folder | metadata | parameter |
|---|---|---|---|
| `native/n_sqns/` | `n_sqns` | N_Sqns, "Sqns", 25 t, 120 km/h, author Vojtech Vohlidka | `cargo=empty` |
| `native/n_sqns-full_1/` | `n_sqns-full#1` | N_Sqns-full#1, "Sqns + Maersk", 50 t; a `container` clip shape 3.9..15.8 m up to 3.8 m | `cargo=maersk` |

`veh-sqns-container-wagon` uses procedural surfaces and solid-colour materials; nothing reads a database checkout or a texture at run time.

## Coordinates and reconstruction

Source `(x, y, z)` is Factory `(x - centre, y, z)` in metres; the BMP painted by the sixth colorize direction (z_dec, or z_both) is the right (+Z) side, the fifth the left; the side canvas starts at source x = 0, 0.1 m a pixel. See [freight-wagons.md](../../docs/models/freight-wagons.md) for the shared builder and deviations.

- Centre 9.9 m (buffer heads 0 and 19.8 m, XML `frame`); bogies at 2.75 and 17.05 m with a 1.8 m wheelbase (axles at the XML wheel contacts 1.85, 3.65, 16.15, 17.95 m).
- Side beams 0.7..19.1 m at 0.9..1.2 m, |z| 1.3..1.5 (XML `base`/`base2`); the fishbelly 4.7..15.1 m down to 0.5 m; end beams 0.5..0.7 and 19.1..19.3 m; cross members and the centre sill from the XML `alongy` plan.
- Container pins 0.2 m wide at 0.5, 3.6, 6.7, 9.8, 12.9, 16.0 and 19.1 m, 1.2..1.3 m (XML `base2`, native row 27).
- The Maersk load is an ISO 40 ft box (12.192 x 2.438 x 2.591 m) centred on the wagon on the pins, not the XML clip (11.9 x 2.6 x 2.6 m): a deliberate correction to the published container size. Its star square (1.45 m) and MAERSK (0.97 m capitals) follow the native z_dec / z_inc columns: the square at the -x end of the +z side and the +x end of the -z side, the word beside it.

## Running number

`31 54 4571 018-1`: illustrative: the native lettering is not legible; UIC format of a CD container wagon.

## Photographs

Prototype: a 60 ft four-axle container wagon of the Sgns type (vlakosimdb calls it Sqns), 19.7 to 19.8 m over buffers, Y25 bogies, a fishbelly frame with container spigots. Confidence: medium (the class letters are the vlakosimdb title). See [PHOTOS.md](PHOTOS.md).

## Measurement record

Each compared `native/<key>/landmarks.json` holds the native pixel-edge boxes with their model scopes, tolerances and uncertainty; `baseline.json` is the measurement of the geometry the boxes were first checked against. The annotations were measured after the geometry had been laid out from the XML and the BMP columns, so baseline and final coincide. The `COMPARISON*.md` files list the normalized errors and the signed residual of every box with the model revision. Liveries that share the default's geometry are not measured apart.
