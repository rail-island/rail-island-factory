# Rah tank wagon source references

**Covers** - provenance, coordinate conversion and reconstruction choices.
**Code** - `generator/wagons.ts`, `generator/wagonParts.ts`, `generator/wagonTransfers.ts`, `native/*/landmarks.json`.
**See also** - [comparison](COMPARISON.md), [freight wagons](../../docs/models/wagons.md).

## Original evidence

All native files come from `janproch/vlakosimdb` revision `b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`, directory `db/train/truck/`. Each `native/<key>/` holds the unchanged `vehicle.xml` (the folder's metadata, Windows-1250), the model `index.xml` (the `simplemodel`), its BMPs and any inline sub-model folder. No `_4x` texture was used or copied.

| native folder | vlakosimdb folder | metadata | `cargo` |
|---|---|---|---|
| `native/n_rah_1/` | `n_rah#1` | N_Rah#1, "Rah#1", 40 t, 100 km/h, author Vojtech Vohladka | - |

`veh-rah-tank-wagon` uses procedural surfaces and solid-colour materials; nothing reads a database checkout or a texture at run time.

## Coordinates and reconstruction

Source `(x, y, z)` is Factory `(x - centre, y, z)` in metres; `z_dec` (or `z_both`) paints the right (+Z) side, `x_both` both ends; the side canvas starts at source x = 0, 0.1 m a pixel. See [wagons.md](../../docs/models/wagons.md) for the shared builder and deviations.

- Centre 6.35 m (buffer heads 0.05 and 12.65 m); bogies at 2.675 m (1.95 m wheelbase) and 9.6 m (1.9 m), the axle contacts of the source.
- Tank: the XML `tank` rotation, radius 0.95 m about y = 2.45 m from 1.1 to 11.1 m, coned to 0.45 m end discs at 0.9 and 11.3 m; 16 sides (the source has 15) so the two sides are symmetric. Orange band 2.2..2.7 m and "CPAVEX" (C with a caron) from native rows 23..27, columns 50..70. Dome 6.0..6.9 m to 4.0 m, saddles, frame 0.5..12.2 m.
- Data boards from the XML `sign` (1.6..4.1 and 8.2..10.7 m, 1.2..2.0 m); the ladder at 5.2..5.76 m and the walkway handrail at 5.8..7.46 m from the native columns; the brake platform railing at 12.1..12.2 m (XML `rail`).

## Running number

`33 54 7921 779-6`: read from z_dec.bmp ("33 RIV / 54 CPAV / 792 1 779-0"); the printed check digit 0 does not verify and was corrected to 6.

## Photographs

None. The session's network policy refused Wikimedia Commons (HTTP 403), so no reference photographs were downloaded; the model follows the native XML and BMPs only. Suitable additions: a side view of a CD wagon of the class and a Y25 bogie photograph from Wikimedia Commons, recorded here with author and licence.

## Measurement record

Each `native/<key>/landmarks.json` holds the native pixel-edge boxes with their model scopes, tolerances and uncertainty; `baseline.json` is the first authored geometry's measurement. The `COMPARISON*.md` files list the normalized errors and the signed residual of every box with the model revision.
