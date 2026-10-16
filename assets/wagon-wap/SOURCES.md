# Wap hopper wagon source references

**Covers** - provenance, coordinate conversion and reconstruction choices.
**Code** - `generator/freightWagons.ts`, `generator/hopperWagons.ts`, `generator/freightWagonParts.ts`, `generator/freightTransfers.ts`, `native/*/landmarks.json`.
**See also** - [photos](PHOTOS.md), [comparison](COMPARISON.md), [freight wagons](../../docs/models/freight-wagons.md).

## Original evidence

All native files come from `janproch/vlakosimdb` revision `b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`, directory `db/train/truck/`. Each `native/<key>/` holds the unchanged `vehicle.xml` (the folder's metadata, Windows-1250), the model `index.xml` (the `simplemodel`), its BMPs and any inline sub-model folder. No `_4x` texture was used or copied.

| native folder | vlakosimdb folder | metadata | parameter |
|---|---|---|---|
| `native/n_wap-full_2/` | `n_wap-full#2` | N_Wap-full#2, "Wap - full#2", 60 t, 90 km/h, author Vojtech Vohlidka; `load` clip shapes up to 4.5 m and y2_dec (gravel) | fixed (loaded) |

`veh-wap-hopper-wagon` uses procedural surfaces and solid-colour materials; nothing reads a database checkout or a texture at run time.

## Coordinates and reconstruction

Source `(x, y, z)` is Factory `(x - centre, y, z)` in metres; the BMP painted by the sixth colorize direction (z_dec, or z_both) is the right (+Z) side, the fifth the left; the side canvas starts at source x = 0, 0.1 m a pixel. See [freight-wagons.md](../../docs/models/freight-wagons.md) for the shared builder and deviations.

- Centre 6.75 m (buffer heads 0 and 13.5 m); the body 0.9..13.3 m with the brake platform 0.5..1.4 m at the -x end; bogies at 3.55 and 10.65 m with a 2.0 m wheelbase (axles 2.55, 4.55, 9.65, 11.65 m).
- The lower body (XML `base` 1.4..12.8 m, 0.8..3.0 m) with its side flaps (`door`, 0.1 m proud) and the centre post 6.8..7.4 m; the upper bulge 3.0..4.1 m overhanging to 0.9..13.3 m; the gravel heaped to 4.5 m (the XML `load` hulls).
- Only n_wap-full#2 is transferred: n_wap, n_wap-full#1, n_wap-full#3 and n-wap are archived in the game. The loaded wagon is the design's single look, without a `cargo` parameter.
- The Wap and the Falls are one prototype; vlakosimdb models them as two different bodies (by different authors and in different eras' paint), and so does the Factory.

## Running number

`31 54 6650 213-7`: illustrative: the native lettering is not legible; UIC format of a CSD Falls (ex Wap).

## Photographs

Prototype: the CSD Wap self-discharging hopper (later UIC Falls group 11), in its older grey-green paint. Confidence: medium (the vlakosimdb paint is the older CSD one; the photograph shows a later brown Falls of the type). See [PHOTOS.md](PHOTOS.md).

## Measurement record

Each compared `native/<key>/landmarks.json` holds the native pixel-edge boxes with their model scopes, tolerances and uncertainty; `baseline.json` is the measurement of the geometry the boxes were first checked against. The annotations were measured after the geometry had been laid out from the XML and the BMP columns, so baseline and final coincide. The `COMPARISON*.md` files list the normalized errors and the signed residual of every box with the model revision. Liveries that share the default's geometry are not measured apart.
