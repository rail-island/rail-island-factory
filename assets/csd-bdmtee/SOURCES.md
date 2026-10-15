# CSD Bdmtee source references

**Covers** - provenance, coordinate conversion and reconstruction choices.
**Code** - `generator/csdCoaches.ts`, `generator/csdCoachParts.ts`, `native/landmarks.json`.
**See also** - [comparison](COMPARISON.md), [CSD coaches](../../docs/models/csd-coaches.md).

## Original evidence

All native files come from `janproch/vlakosimdb` revision `b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`, directory `db/train/coach/csd_bdmtee/`:

- `native/vehicle.xml`: unchanged metadata (`CSD_Bdmtee`, "CSD Bdmtee"): 46 t, 160 km/h, author Vojtech Vohlidka (the original spelling is kept in the Windows-1250 file).
- `native/index.xml`: the unchanged simplemodel: `alongx`/`alongy`/`alongz` clip polygons, colorizes and baked polygons.
- `native/x_both.bmp`, `native/y_dec.bmp`, `native/z_dec.bmp`, `native/z_inc.bmp`: the unchanged original BMPs (0.1 m a pixel). No 4x texture was used or shipped.

The model is the commuter coach with two pairs of double doors. It uses procedural surfaces and solid-colour materials; nothing reads a database checkout or a texture at run time.

## Coordinates and reconstruction

Source `(x, y, z)` is Factory `(x - centre, y, z)`, metres, with `centre` the midpoint between the buffer heads; `z_dec` paints the right (+Z) side, `z_inc` the left. Side canvases keep increasing source x, so the left elevation is mirrored relative to an outside observer. See [csd-coaches.md](../../docs/models/csd-coaches.md) for the mapping, the builder and the choices every coach shares (1.75 m buffers, round lamps, wheel radii).

- Section `alongx`: 3.0 m wide from 0.9 to 3.2 m, roof to 4.0 m. Plan `alongy`: 2.8 m at x 0.2 and 26.2, 3.0 m from 0.3 to 26.1.
- `z_dec` and `z_inc` are byte-identical. Fourteen windows (one frosted) rows 20..30; double doors at columns 63..83 and 181..201 reaching 0.6 m (XML `door2` steps at 6.3..8.3 and 18.1..20.1 m). Seven roof ventilators from the XML `roof` polygons.
- Axles at source x 2.45, 4.95, 21.45, 23.95 m.

## Measurement record

`native/landmarks.json` holds 56 native pixel-edge boxes with their model scopes, tolerances and uncertainty; `native/baseline.json` is the first authored geometry's measurement. [COMPARISON.md](COMPARISON.md) lists the normalized errors, the signed residual of every box and the model revision.
