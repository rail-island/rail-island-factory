# Ua open wagon source references

**Covers** - provenance, coordinate conversion and reconstruction choices.
**Code** - `generator/wagons.ts`, `generator/wagonParts.ts`, `generator/wagonTransfers.ts`, `native/*/landmarks.json`.
**See also** - [comparison (empty)](COMPARISON-empty.md), [comparison (coal)](COMPARISON-coal.md), [comparison (wood)](COMPARISON-wood.md), [comparison (sand)](COMPARISON-sand.md), [freight wagons](../../docs/models/wagons.md).

## Original evidence

All native files come from `janproch/vlakosimdb` revision `b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`, directory `db/train/truck/`. Each `native/<key>/` holds the unchanged `vehicle.xml` (the folder's metadata, Windows-1250), the model `index.xml` (the `simplemodel`), its BMPs and any inline sub-model folder. No `_4x` texture was used or copied.

| native folder | vlakosimdb folder | metadata | `cargo` |
|---|---|---|---|
| `native/n_ua-empty/` | `n_ua-empty` | "Ua Empty", 30 t, author Vojtech Vohladka | `empty` |
| `native/n_ua_1/` | `n_ua#1` | "Ua Coal", 60 t; XML `load` clip | `coal` |
| `native/n_ua_2/` | `n_ua#2` | "Ua Wood", 50 t; XML `load` clip, straps painted on z_both | `wood` |
| `native/n_ua_3/` | `n_ua#3` | "Ua + Sand", 60 t; XML `load` clip | `sand` |

`veh-ua-open-wagon` uses procedural surfaces and solid-colour materials; nothing reads a database checkout or a texture at run time.

## Coordinates and reconstruction

Source `(x, y, z)` is Factory `(x - centre, y, z)` in metres; `z_dec` (or `z_both`) paints the right (+Z) side, `x_both` both ends; the side canvas starts at source x = 0, 0.1 m a pixel. See [wagons.md](../../docs/models/wagons.md) for the shared builder and deviations.

- Centre 6.85 m (buffer heads 0.1 and 13.6 m); bogies at 2.35 and 11.35 m, 1.8 m wheelbase.
- Body 0.6..13.1 m, walls 1.3..1.5 m from the centre line, 0.9..3.2 m with the rim to 3.3 m (0.5..13.2 m); stanchions, door seams, locking bars and sills from native z_both columns; the end posts from x_both.
- Coal and sand: the XML `load` visual hull (section and two heaps) above the 3.3 m rim. Wood: two layers of logs to 3.61 m and four straps at 2.3, 5.5, 8.1 and 11.2 m (native columns 23, 55, 81, 112).

## Running number

`21 54 5352 118-3`: illustrative: the native lettering is not legible.

## Photographs

None. The session's network policy refused Wikimedia Commons (HTTP 403), so no reference photographs were downloaded; the model follows the native XML and BMPs only. Suitable additions: a side view of a CD wagon of the class and a Y25 bogie photograph from Wikimedia Commons, recorded here with author and licence.

## Measurement record

Each `native/<key>/landmarks.json` holds the native pixel-edge boxes with their model scopes, tolerances and uncertainty; `baseline.json` is the first authored geometry's measurement. The `COMPARISON*.md` files list the normalized errors and the signed residual of every box with the model revision.
