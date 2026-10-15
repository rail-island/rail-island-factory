# CSD Bmo source references

**Covers** - provenance, coordinate conversion and reconstruction choices.
**Code** - `generator/csdCoaches.ts`, `generator/csdCoachParts.ts`, `native/landmarks.json`.
**See also** - [comparison](COMPARISON.md), [CSD coaches](../../docs/models/csd-coaches.md).

## Original evidence

All native files come from `janproch/vlakosimdb` revision `b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`, directory `db/train/coach/csd_bmo/`:

- `native/vehicle.xml`: unchanged metadata (`CSD_Bmo`, "CSD Bmo"): 80 t, 120 km/h, author Vojtech Vohlidka (the original spelling is kept in the Windows-1250 file).
- `native/index.xml`: the unchanged simplemodel: `alongx`/`alongy`/`alongz` clip polygons, colorizes and baked polygons.
- `native/x_both.bmp`, `native/y_dec.bmp`, `native/z_both.bmp`: the unchanged original BMPs (0.1 m a pixel). No 4x texture was used or shipped.

The model is the double-deck coach. It uses procedural surfaces and solid-colour materials; nothing reads a database checkout or a texture at run time.

## Coordinates and reconstruction

Source `(x, y, z)` is Factory `(x - centre, y, z)`, metres, with `centre` the midpoint between the buffer heads; `z_dec` paints the right (+Z) side, `z_inc` the left. Side canvases keep increasing source x, so the left elevation is mirrored relative to an outside observer. See [csd-coaches.md](../../docs/models/csd-coaches.md) for the mapping, the builder and the choices every coach shares (1.75 m buffers, round lamps, wheel radii).

- Section `alongx`: 3.0 m wide from 0.4 to 3.2 m, the upper deck wall sloping in to 1.1 m at 4.0 m, roof to 4.6 m; floor at 0.2 m. Elevation `alongz`: the ends are single-level from 0.9 m, the floor drops to 0.2 m between x 6.0 and 20.8.
- Six upper (rows 10..18, on the sloped wall) and six lower windows (rows 31..40) at columns 85..183; end windows; double doors at columns 64..81 and 187..204; a hatch outline at 24..35. The yellow wing lines of the side emblem (rows 21, 23, 25) are modelled; the CSD monogram is not.
- Axles at source x 2.25, 4.75, 22.05, 24.55 m.

## Measurement record

`native/landmarks.json` holds 60 native pixel-edge boxes with their model scopes, tolerances and uncertainty; `native/baseline.json` is the first authored geometry's measurement. [COMPARISON.md](COMPARISON.md) lists the normalized errors, the signed residual of every box and the model revision.
