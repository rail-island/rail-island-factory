# CSD Bam source references

**Covers** - provenance, coordinate conversion and reconstruction choices.
**Code** - `generator/csdCoaches.ts`, `generator/csdCoachParts.ts`, `native/landmarks.json`.
**See also** - [comparison](COMPARISON.md), [CSD coaches](../../docs/models/csd-coaches.md).

## Original evidence

All native files come from `janproch/vlakosimdb` revision `b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`, directory `db/train/coach/csd_bam/`:

- `native/vehicle.xml`: unchanged metadata (`CSD_Bam`, "CSD Bam"): 30 t, 100 km/h, author Vojtech Vohlidka (the original spelling is kept in the Windows-1250 file).
- `native/index.xml`: the unchanged simplemodel: `alongx`/`alongy`/`alongz` clip polygons, colorizes and baked polygons.
- `native/x_both.bmp`, `native/y_dec.bmp`, `native/z_both.bmp`: the unchanged original BMPs (0.1 m a pixel). No 4x texture was used or shipped.

The model is the trailer coach, red with a cream window band. It uses procedural surfaces and solid-colour materials; nothing reads a database checkout or a texture at run time.

## Coordinates and reconstruction

Source `(x, y, z)` is Factory `(x - centre, y, z)`, metres, with `centre` the midpoint between the buffer heads; `z_dec` paints the right (+Z) side, `z_inc` the left. Side canvases keep increasing source x, so the left elevation is mirrored relative to an outside observer. See [csd-coaches.md](../../docs/models/csd-coaches.md) for the mapping, the builder and the choices every coach shares (1.75 m buffers, round lamps, wheel radii).

- Section `alongx` with a lower tumblehome to 0.4 m; the body is 0.9 to 3.8 m high. Plan `alongy`: half widths 1.1, 1.3, 1.4, 1.5 m at x 0.7, 0.8, 1.0, 2.1 (mirrored at 20.2..21.6). Elevation `alongz`: roof from 3.4 m at the ends to 3.8 m by x 1.6.
- Twelve windows from column 24 at a 15-pixel pitch, rows 10..19; doors at columns 12..20 and 203..211. Short end gangways from the XML `box` shape (x 0.3..0.7, |z| 0.4..0.45, y 1.2..2.4).
- Axles at source x 2.35, 5.15, 17.15, 19.95 m; buffer heads at x 0.05 and 22.25.

## Measurement record

`native/landmarks.json` holds 48 native pixel-edge boxes with their model scopes, tolerances and uncertainty; `native/baseline.json` is the first authored geometry's measurement. [COMPARISON.md](COMPARISON.md) lists the normalized errors, the signed residual of every box and the model revision.
