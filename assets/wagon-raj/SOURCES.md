# Raj hopper wagon source references

**Covers** - provenance, coordinate conversion and reconstruction choices.
**Code** - `generator/wagons.ts`, `generator/wagonParts.ts`, `generator/wagonTransfers.ts`, `native/*/landmarks.json`.
**See also** - [comparison](COMPARISON.md), [freight wagons](../../docs/models/wagons.md).

## Original evidence

All native files come from `janproch/vlakosimdb` revision `b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`, directory `db/train/truck/`. Each `native/<key>/` holds the unchanged `vehicle.xml` (the folder's metadata, Windows-1250), the model `index.xml` (the `simplemodel`), its BMPs and any inline sub-model folder. No `_4x` texture was used or copied.

| native folder | vlakosimdb folder | metadata | `cargo` |
|---|---|---|---|
| `native/n_raj/` | `n_raj` | N_Raj, "Raj", 50 t, 90 km/h, author Jan Prochazka | - |

`veh-raj-hopper-wagon` uses procedural surfaces and solid-colour materials; nothing reads a database checkout or a texture at run time.

## Coordinates and reconstruction

Source `(x, y, z)` is Factory `(x - centre, y, z)` in metres; `z_dec` (or `z_both`) paints the right (+Z) side, `x_both` both ends; the side canvas starts at source x = 0, 0.1 m a pixel. See [wagons.md](../../docs/models/wagons.md) for the shared builder and deviations.

- Centre 7.2 m (buffer heads 0 and 14.4 m); bogies at 3.5 and 11.6 m, 1.9 m wheelbase.
- Red frame: the frustum from 1.3..13.8 m and 2.8 m wide at 1.2 m to 1.9..13.1 m and 2.0 m wide at 2.0 m (XML alongz/alongx). Hoppers: the `r1`..`r4` rotation profile (radius 0.8 at 2.0 m, 1.4 from 2.8 to 3.6 m, 1.3 at 3.8 m, 0.3 at 4.5 m) about x = 3.0, 6.0, 8.9 and 11.9 m, ten sides.
- Platforms 3.0..6.0 and 8.9..11.9 m at 3.95..4.0 m, ladders 4.2..4.8 and 10.1..10.7 m, handrails at 4.35..4.45 m (native rows 5..6, the XML says 4.3..4.4 m); the brake platform at x 0.5..1.2 m.

## Running number

`31 54 0835 102-3`: illustrative: the native lettering is not legible.

## Photographs

None. The session's network policy refused Wikimedia Commons (HTTP 403), so no reference photographs were downloaded; the model follows the native XML and BMPs only. Suitable additions: a side view of a CD wagon of the class and a Y25 bogie photograph from Wikimedia Commons, recorded here with author and licence.

## Measurement record

Each `native/<key>/landmarks.json` holds the native pixel-edge boxes with their model scopes, tolerances and uncertainty; `baseline.json` is the first authored geometry's measurement. The `COMPARISON*.md` files list the normalized errors and the signed residual of every box with the model revision.
