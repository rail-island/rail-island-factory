# CSD Be31 source references

**Covers** - provenance, coordinate conversion and reconstruction choices.
**Code** - `generator/csdCoaches.ts`, `generator/csdCoachParts.ts`, `native/landmarks.json`.
**See also** - [comparison](COMPARISON.md), [CSD coaches](../../docs/models/csd-coaches.md).

## Original evidence

All native files come from `janproch/vlakosimdb` revision `b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`, directory `db/train/coach/csd_be31/`:

- `native/vehicle.xml`: unchanged metadata (`CSD_Be31`, "CSD Be31"): 20 t, 80 km/h, author Vojtech Vohlidka (the original spelling is kept in the Windows-1250 file).
- `native/index.xml`: the unchanged simplemodel: `alongx`/`alongy`/`alongz` clip polygons, colorizes and baked polygons.
- `native/x_both.bmp`, `native/y_dec.bmp`, `native/z_both.bmp`: the unchanged original BMPs (0.1 m a pixel). No 4x texture was used or shipped.

The model is the two-axle coach with enclosed end vestibules. It uses procedural surfaces and solid-colour materials; nothing reads a database checkout or a texture at run time.

## Coordinates and reconstruction

Source `(x, y, z)` is Factory `(x - centre, y, z)`, metres, with `centre` the midpoint between the buffer heads; `z_dec` paints the right (+Z) side, `z_inc` the left. Side canvases keep increasing source x, so the left elevation is mirrored relative to an outside observer. See [csd-coaches.md](../../docs/models/csd-coaches.md) for the mapping, the builder and the choices every coach shares (1.75 m buffers, round lamps, wheel radii).

- Three XML volumes: the main body (x 1.4..14.2, 3.0 m wide, 1.1..3.3 m), the vestibules (x 0.4..1.4 and 14.2..15.2, 2.4 m wide) and a roof shape over 0.4..15.2 with rounded plan corners rising to 3.8 m.
- Seven windows from column 26 at a 17-pixel pitch and a frosted toilet window at 15..21, rows 9..18; vestibule side doors at columns 5..14 and 142..151 (their edges are shaded, +/- two pixels).
- Axles at source x 3.1 and 12.5 m; buffer heads at 0.05 and 15.55; a cross tank from the XML `frame` octagon at x 10.2..10.8.

## Measurement record

`native/landmarks.json` holds 36 native pixel-edge boxes with their model scopes, tolerances and uncertainty; `native/baseline.json` is the first authored geometry's measurement. [COMPARISON.md](COMPARISON.md) lists the normalized errors, the signed residual of every box and the model revision.
