# CSD Balm source references

**Covers** - provenance, coordinate conversion and reconstruction choices.
**Code** - `generator/csdCoaches.ts`, `generator/csdCoachParts.ts`, `native/landmarks.json`.
**See also** - [comparison](COMPARISON.md), [CSD coaches](../../docs/models/csd-coaches.md).

## Original evidence

All native files come from `janproch/vlakosimdb` revision `b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`, directory `db/train/coach/csd_balm/`:

- `native/vehicle.xml`: unchanged metadata (`CSD_Balm`, "CSD Balm"): 29 t, 120 km/h, author Vojtech Vohlidka (the original spelling is kept in the Windows-1250 file).
- `native/index.xml`: the unchanged simplemodel: `alongx`/`alongy`/`alongz` clip polygons, colorizes and baked polygons.
- `native/x_both.bmp`, `native/y_dec.bmp`, `native/z_both.bmp`: the unchanged original BMPs (0.1 m a pixel). No 4x texture was used or shipped.

The model is the railcar trailer with rounded ends. It uses procedural surfaces and solid-colour materials; nothing reads a database checkout or a texture at run time.

## Coordinates and reconstruction

Source `(x, y, z)` is Factory `(x - centre, y, z)`, metres, with `centre` the midpoint between the buffer heads; `z_dec` paints the right (+Z) side, `z_inc` the left. Side canvases keep increasing source x, so the left elevation is mirrored relative to an outside observer. See [csd-coaches.md](../../docs/models/csd-coaches.md) for the mapping, the builder and the choices every coach shares (1.75 m buffers, round lamps, wheel radii).

- Section `alongx`: 3.0 m wide from 0.8 to 3.2 m, roof to 3.7 m. Plan `alongy` rounds the ends: half widths 0.6, 1.1, 1.4, 1.5 m at x 0.4, 0.5, 0.7, 1.2 (and the mirror at 17.9..18.7). Elevation `alongz` slopes the nose from 1.9 m at x 0.4 to 3.2 m at 0.5 and the roof down from 3.7 m.
- `z_both` paints both sides; `x_both` both ends. Bands: cream over 1.8 m, a grey moulding 1.7..1.8 m, red 0.9..1.7 m, a cream lining and a cream skirt (x 5.0..14.1, down to 0.4 m) between the bogies.
- Axles at source x 2.15, 4.25, 14.85, 16.95 m; buffers at y 0.9 m (XML frame octagons).

## Measurement record

`native/landmarks.json` holds 44 native pixel-edge boxes with their model scopes, tolerances and uncertainty; `native/baseline.json` is the first authored geometry's measurement. [COMPARISON.md](COMPARISON.md) lists the normalized errors, the signed residual of every box and the model revision.
