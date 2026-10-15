# Nas flat wagon source references

**Covers** - provenance, coordinate conversion and reconstruction choices.
**Code** - `generator/wagons.ts`, `generator/wagonParts.ts`, `generator/wagonTransfers.ts`, `native/*/landmarks.json`.
**See also** - [comparison (empty)](COMPARISON-empty.md), [comparison (wood)](COMPARISON-wood.md), [comparison (tubes)](COMPARISON-tubes.md), [comparison (reels)](COMPARISON-reels.md), [freight wagons](../../docs/models/wagons.md).

## Original evidence

All native files come from `janproch/vlakosimdb` revision `b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`, directory `db/train/truck/`. Each `native/<key>/` holds the unchanged `vehicle.xml` (the folder's metadata, Windows-1250), the model `index.xml` (the `simplemodel`), its BMPs and any inline sub-model folder. No `_4x` texture was used or copied.

| native folder | vlakosimdb folder | metadata | `cargo` |
|---|---|---|---|
| `native/n_nas/` | `n_nas` | N_Nas, "Nas", 25 t, 120 km/h, author Vojtech Vohladka | `empty` |
| `native/n_nas-full_1/` | `n_nas-full#1` | "Nas + Wood", 50 t; inline `wood` (logs) five times | `wood` |
| `native/n_nas-full_2/` | `n_nas-full#2` | "Nas + Tubes", 35 t; inline `tube` five times | `tubes` |
| `native/n_nas-full_3/` | `n_nas-full#3` | "Nas + Reels", 33 t; inline `reel` six times | `reels` |

`veh-nas-flat-wagon` uses procedural surfaces and solid-colour materials; nothing reads a database checkout or a texture at run time.

## Coordinates and reconstruction

Source `(x, y, z)` is Factory `(x - centre, y, z)` in metres; `z_dec` (or `z_both`) paints the right (+Z) side, `x_both` both ends; the side canvas starts at source x = 0, 0.1 m a pixel. See [wagons.md](../../docs/models/wagons.md) for the shared builder and deviations.

- Centre 10.45 m (buffer heads 0 and 20.9 m); bogies at 2.65 and 18.35 m, 2.0 m wheelbase (axles at the XML wheel contacts).
- Deck 0.6..20.3 m at 1.1..1.2 m, drop sides 1.2..1.7 m (XML `zside`), solebar 0.8..1.2 m with the fishbelly 4.8..16.4 m down to 0.4 m, stakes 0.1 m square at 2.7, 4.9 ... 18.1 m from 0.7 to 2.9 m, end walls 0.5..0.6 and 20.3..20.4 m up to 2.0 m with corner posts to 2.7 m.
- Loads from the inline placements: logs x 2.8..18.2 m up to 3.1 m (the model pile tops out at 2.99 m: seven 0.4 m logs fit between the stakes), tubes 0.9 m across x 2.8..18.3 m, reels 2 m across at 2.9, 5.8, 9.0, 11.9, 15.1 and 18.0 m.

## Running number

`31 54 4870 116-1`: illustrative: the native lettering is not legible.

## Photographs

None. The session's network policy refused Wikimedia Commons (HTTP 403), so no reference photographs were downloaded; the model follows the native XML and BMPs only. Suitable additions: a side view of a CD wagon of the class and a Y25 bogie photograph from Wikimedia Commons, recorded here with author and licence.

## Measurement record

Each `native/<key>/landmarks.json` holds the native pixel-edge boxes with their model scopes, tolerances and uncertainty; `baseline.json` is the first authored geometry's measurement. The `COMPARISON*.md` files list the normalized errors and the signed residual of every box with the model revision.
