# CSD Dsk source references

**Covers** - provenance, coordinate conversion and reconstruction choices.
**Code** - `generator/csdCoaches.ts`, `generator/csdCoachParts.ts`, `native/landmarks.json`.
**See also** - [comparison](COMPARISON.md), [photos](PHOTOS.md), [CSD coaches](../../docs/models/csd-coaches.md).

## Original evidence

All native files come from `janproch/vlakosimdb` revision `b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`, directory `db/train/coach/csd_dsk/`:

- `native/vehicle.xml`: unchanged metadata (`CSD_Dsk`, "CSD Dsk"): 10 t, 80 km/h, author Vojtech Vohlidka (the original spelling is kept in the Windows-1250 file).
- `native/index.xml`: the unchanged simplemodel: `alongx`/`alongy`/`alongz` clip polygons, colorizes and baked polygons.
- `native/x_dec.bmp`, `native/x_inc.bmp`, `native/y_dec.bmp`, `native/z_both.bmp`: the unchanged original BMPs (0.1 m a pixel). No 4x texture was used or shipped.

The model is the two-axle luggage van. It uses procedural surfaces and solid-colour materials; nothing reads a database checkout or a texture at run time.

## Coordinates and reconstruction

Source `(x, y, z)` is Factory `(x - centre, y, z)`, metres, with `centre` the midpoint between the buffer heads; `z_dec` paints the right (+Z) side, `z_inc` the left. Side canvases keep increasing source x, so the left elevation is mirrored relative to an outside observer. See [csd-coaches.md](../../docs/models/csd-coaches.md) for the mapping, the builder and the choices every coach shares (1.75 m buffers, round lamps, wheel radii).

- Volumes: the van x 0.6..9.1 (2.8 m wide, 0.8..3.3 m), a roof over 0.6..10.0 and a platform floor 9.1..10.0. `x_dec` paints the plain x = 0 end (Factory rear), `x_inc` the platform end wall with its door (Factory front).
- Three small windows, a sliding door at columns 39..57, framing posts and two diagonal braces per side from `z_both`; diagonals on both ends from the end BMPs. Lookout duckets from the XML (x 8.0..9.1 at the body, 8.3..8.8 at the face).
- Axles at source x 1.9 and 8.1 m; buffer heads at 0 and 10.5.

## Running number

`Dsk 4-1210`, "ČSD" above it. Illustrative: the class and numbering format follow the photographed CSD luggage van `Ddk 6-3777` (`photo-luggage-van-two-axle-luzna-2006.jpg`), but the serial is not a verified unit.

## Photo check

The only photograph is a similar preserved two-axle wooden CSD luggage van (`Ddk 6-3777`): it confirms the planked green body, the framing, the end platform with railings and the "ČSD" lettering over the number on the lower side; its exact class differs, so it was not used to refit the model. See [PHOTOS.md](PHOTOS.md) for every photograph's source, author and licence.

## Measurement record

`native/landmarks.json` holds 22 native pixel-edge boxes with their model scopes, tolerances and uncertainty; `native/baseline.json` is the first authored geometry's measurement. [COMPARISON.md](COMPARISON.md) lists the normalized errors, the signed residual of every box and the model revision.
