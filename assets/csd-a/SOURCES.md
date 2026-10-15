# CSD A source references

**Covers** - provenance, coordinate conversion and reconstruction choices.
**Code** - `generator/csdCoaches.ts`, `generator/csdCoachParts.ts`, `native/landmarks.json`.
**See also** - [comparison](COMPARISON.md), [CSD coaches](../../docs/models/csd-coaches.md).

## Original evidence

All native files come from `janproch/vlakosimdb` revision `b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`, directory `db/train/coach/csd_a/`:

- `native/vehicle.xml`: unchanged metadata (`CSD_A`, "CSD A"): 40 t, 140 km/h, author Vojtech Vohlidka (the original spelling is kept in the Windows-1250 file).
- `native/index.xml`: the unchanged simplemodel: `alongx`/`alongy`/`alongz` clip polygons, colorizes and baked polygons.
- `native/x_both.bmp`, `native/y_dec.bmp`, `native/z_dec.bmp`, `native/z_inc.bmp`: the unchanged original BMPs (0.1 m a pixel). No 4x texture was used or shipped.

The model is the Y-type 1st class corridor coach. It uses procedural surfaces and solid-colour materials; nothing reads a database checkout or a texture at run time.

## Coordinates and reconstruction

Source `(x, y, z)` is Factory `(x - centre, y, z)`, metres, with `centre` the midpoint between the buffer heads; `z_dec` paints the right (+Z) side, `z_inc` the left. Side canvases keep increasing source x, so the left elevation is mirrored relative to an outside observer. See [csd-coaches.md](../../docs/models/csd-coaches.md) for the mapping, the builder and the choices every coach shares (1.75 m buffers, round lamps, wheel radii).

- Body section from `alongx`: 3.0 m wide from 0.9 to 3.2 m, a curved roof to 4.2 m. Plan `alongy`: 2.8 m at the ends (x 0.2, 24.3) widening to 3.0 m by x 1.6 and 22.9. Elevation `alongz`: the roof drops 0.2 m over the last 0.2 m.
- `z_dec` (right, +Z) and `z_inc` (left) share one layout; they differ only in glass shading and inscriptions. Windows: toilet 18..26, nine compartments from column 32 at a 21-pixel pitch, toilet 219..227, rows 19..30; drop-light sash bar at 2.5 m (row 24).
- Bogies from the `alongz` wheel polygons: axles at source x 2.45, 4.95, 19.55, 22.05 m.
- Class numeral "1" (native columns 28..29 and 213..214). The 4x remastered texture paints "2" there; it was not used.

## Measurement record

`native/landmarks.json` holds 46 native pixel-edge boxes with their model scopes, tolerances and uncertainty; `native/baseline.json` is the first authored geometry's measurement. [COMPARISON.md](COMPARISON.md) lists the normalized errors, the signed residual of every box and the model revision.
