# CSD Bi20 source references

**Covers** - provenance, coordinate conversion and reconstruction choices.
**Code** - `generator/csdCoaches.ts`, `generator/csdCoachParts.ts`, `native/landmarks.json`.
**See also** - [comparison](COMPARISON.md), [CSD coaches](../../docs/models/csd-coaches.md).

## Original evidence

All native files come from `janproch/vlakosimdb` revision `b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`, directory `db/train/coach/csd_bi20/`:

- `native/vehicle.xml`: unchanged metadata (`CSD_Bi20`, "CSD Bi20"): 10 t, 80 km/h, author Jan Prochazka (the original spelling is kept in the Windows-1250 file).
- `native/index.xml`: the unchanged simplemodel: `alongx`/`alongy`/`alongz` clip polygons, colorizes and baked polygons.
- `native/x_both.bmp`, `native/y_dec.bmp`, `native/y_dec_2.bmp`, `native/z_both.bmp`: the unchanged original BMPs (0.1 m a pixel). No 4x texture was used or shipped.

The model is the two-axle compartment coach with open end platforms. It uses procedural surfaces and solid-colour materials; nothing reads a database checkout or a texture at run time.

## Coordinates and reconstruction

Source `(x, y, z)` is Factory `(x - centre, y, z)`, metres, with `centre` the midpoint between the buffer heads; `z_dec` paints the right (+Z) side, `z_inc` the left. Side canvases keep increasing source x, so the left elevation is mirrored relative to an outside observer. See [csd-coaches.md](../../docs/models/csd-coaches.md) for the mapping, the builder and the choices every coach shares (1.75 m buffers, round lamps, wheel radii).

- Volumes: compartments x 1.1..11.5 (2.8 m wide, 0.8..3.3 m), a roof over 0.3..12.3 (3.0 m wide, to 3.8 m), platforms 0.3..1.1 and 11.5..12.3. The XML roof crown is asymmetric (-0.4 / +0.5 m); the model centres it at +/-0.45 m.
- Six compartment doors from column 16 at a 17-pixel pitch with brass-framed drop windows; class numerals "2" on the end doors. Platform railings from the XML `gear` shape.
- Author Jan Prochazka (vehicle.xml). The XML has no buffers; the model adds standard buffers 0.3 m beyond the platforms (12.6 m over buffers).

## Measurement record

`native/landmarks.json` holds 32 native pixel-edge boxes with their model scopes, tolerances and uncertainty; `native/baseline.json` is the first authored geometry's measurement. [COMPARISON.md](COMPARISON.md) lists the normalized errors, the signed residual of every box and the model revision.
