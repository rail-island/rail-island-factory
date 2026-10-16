# Pao flat wagon source references

**Covers** - provenance, coordinate conversion and reconstruction choices.
**Code** - `generator/freightWagons.ts`, `generator/hopperWagons.ts`, `generator/freightWagonParts.ts`, `generator/freightTransfers.ts`, `native/*/landmarks.json`.
**See also** - [photos](PHOTOS.md), [comparison (tubes)](COMPARISON-tubes.md), [comparison (karosaB951)](COMPARISON-karosaB951.md), [freight wagons](../../docs/models/freight-wagons.md).

## Original evidence

All native files come from `janproch/vlakosimdb` revision `b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`, directory `db/train/truck/`. Each `native/<key>/` holds the unchanged `vehicle.xml` (the folder's metadata, Windows-1250), the model `index.xml` (the `simplemodel`), its BMPs and any inline sub-model folder. No `_4x` texture was used or copied.

| native folder | vlakosimdb folder | metadata | parameter |
|---|---|---|---|
| `native/n_pao-full_1/` | `n_pao-full#1` | N_Pao-full#1, "Pao + Tubes", 22 t, 120 km/h, author Vojtech Vohlidka; `load` clip shapes (two bolsters, the tube bundle) | `cargo=tubes` (default) |
| `native/n_pao-full_2/` | `n_pao-full#2` | N_Pao-full#2, "Pao + Karosa B951", 28 t; inline `bus` (its own simplemodel and BMPs in `bus/`) at tx 1.9, ty 1.2 | `cargo=karosaB951` |

`veh-pao-flat-wagon` uses procedural surfaces and solid-colour materials; nothing reads a database checkout or a texture at run time.

## Coordinates and reconstruction

Source `(x, y, z)` is Factory `(x - centre, y, z)` in metres; the BMP painted by the sixth colorize direction (z_dec, or z_both) is the right (+Z) side, the fifth the left; the side canvas starts at source x = 0, 0.1 m a pixel. See [freight-wagons.md](../../docs/models/freight-wagons.md) for the shared builder and deviations.

- Centre 7.65 m (buffer heads 0 and 15.3 m, XML `bumper`); bogies at 2.6 and 12.7 m with a 1.9 m wheelbase (axles 1.65, 3.55, 11.75, 13.65 m).
- Frame 0.5..14.8 m at 0.7..1.2 m, full 3.0 m width (XML `base`); the fishbelly 3.8..11.5 m down to 0.5 m; a deck of transverse planks with gaps every 0.4 m (native y_dec).
- Tubes: two timber bolsters 3.8..4.8 and 10.5..11.5 m up to 1.4 m and a bundle of 21 tubes of 0.12 m (8, 7 and 6 in three layers) 2.8..12.5 m up to 1.72 m (XML `load` to 1.7 m).
- The bus: a low-poly Karosa B 951 from the inline's XML -- its section, the windscreen raked over 0.1..0.6 m, the rear at 11.7 m and the bumper to 11.8 m -- in the red and white livery: skirt 0.3..0.8 m and waist band 1.4..1.7 m red, six side windows 1.8..2.7 m, three doors on the -z side, 1 m wheels in open arches at 2.55 and 8.25 m (all bus heights over the deck at 1.2 m). The bus faces -x as the inline does. Chocks hold its wheels.
- The vlakosimdb empty Pao (n_pao, and the older n-pao) is archived in the game and not transferred; the default is the tube load.

## Running number

`84 54 4606 400-6`: the Smm (ex Pao) on the photograph smm-paov-flat-wagon.jpg.

## Photographs

Prototype: the CSD Pao(v), later UIC class Smm: a four-axle flat wagon with a fishbelly frame, 15.3 m over buffers. Confidence: medium; only one free photograph of the class (with later sideboards) was found. See [PHOTOS.md](PHOTOS.md).

## Measurement record

Each compared `native/<key>/landmarks.json` holds the native pixel-edge boxes with their model scopes, tolerances and uncertainty; `baseline.json` is the measurement of the geometry the boxes were first checked against. The annotations were measured after the geometry had been laid out from the XML and the BMP columns, so baseline and final coincide. The `COMPARISON*.md` files list the normalized errors and the signed residual of every box with the model revision. Liveries that share the default's geometry are not measured apart.
