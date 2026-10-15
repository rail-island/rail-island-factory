# Eas open wagon source references

**Covers** - provenance, coordinate conversion and reconstruction choices.
**Code** - `generator/wagons.ts`, `generator/wagonParts.ts`, `generator/wagonTransfers.ts`, `native/*/landmarks.json`.
**See also** - [comparison (empty)](COMPARISON-empty.md), [comparison (wood)](COMPARISON-wood.md), [comparison (coal)](COMPARISON-coal.md), [freight wagons](../../docs/models/wagons.md).

## Original evidence

All native files come from `janproch/vlakosimdb` revision `b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`, directory `db/train/truck/`. Each `native/<key>/` holds the unchanged `vehicle.xml` (the folder's metadata, Windows-1250), the model `index.xml` (the `simplemodel`), its BMPs and any inline sub-model folder. No `_4x` texture was used or copied.

| native folder | vlakosimdb folder | metadata | `cargo` |
|---|---|---|---|
| `native/n_eas/` | `n_eas` | N_Eas, "Eas", 23.5 t, 90 km/h, author Bozek Hudak | `empty` |
| `native/n_eas-drevo/` | `n_eas-drevo` | "Eas-drevo" (wood), 65.5 t | `wood` |
| `native/n_eas-uhlo/` | `n_eas-uhlo` | "Eas-uhli" (coal), 65.5 t | `coal` |

`veh-eas-open-wagon` uses procedural surfaces and solid-colour materials; nothing reads a database checkout or a texture at run time.

## Coordinates and reconstruction

Source `(x, y, z)` is Factory `(x - centre, y, z)` in metres; `z_dec` (or `z_both`) paints the right (+Z) side, `x_both` both ends; the side canvas starts at source x = 0, 0.1 m a pixel. See [wagons.md](../../docs/models/wagons.md) for the shared builder and deviations.

- Centre 6.95 m (buffer heads 0 and 13.9 m); bogies at 2.35 and 11.45 m, 2.0 m wheelbase.
- Body 0.3..13.6 m, 0.9..3.3 m, walls 1.3..1.4 m, the 13 XML `bok` stanchions 1.4..1.5 m at 0.3, 1.4 ... 13.5 m, top rail 0.2..13.7 m; doors framed by the stanchions at 2.5/3.6/4.7 and 9.1/10.2/11.3 m (grey in z_dec/z_inc); end posts and rails from the XML `side` shape. `z_dec` puts the data panel near x = 0, `z_inc` near x = 13.9 m.
- Wood: the native load reaches 0.3..13.6 m and 3.8..3.9 m in a wave of transverse bundles: fifteen bundles of five logs. Coal: the native polygons' heights (3.15 m surface, mounds to 3.5 m).

## Running number

`21 54 5927 504-0`: read from z_dec.bmp ("21 RIV / 54 CD / 592 7 504-1"); the printed check digit 1 does not verify and was corrected to 0.

## Photographs

None. The session's network policy refused Wikimedia Commons (HTTP 403), so no reference photographs were downloaded; the model follows the native XML and BMPs only. Suitable additions: a side view of a CD wagon of the class and a Y25 bogie photograph from Wikimedia Commons, recorded here with author and licence.

## Measurement record

Each `native/<key>/landmarks.json` holds the native pixel-edge boxes with their model scopes, tolerances and uncertainty; `baseline.json` is the first authored geometry's measurement. The `COMPARISON*.md` files list the normalized errors and the signed residual of every box with the model revision.
