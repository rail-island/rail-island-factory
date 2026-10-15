# Bmo Double-Deck Coach source references

**Covers** - provenance, coordinate conversion, the four liveries and reconstruction choices.
**Code** - `generator/bmoCoach.ts`, `generator/csdCoachParts.ts`, `native/<key>/landmarks.json`.
**See also** - [comparison (CSD livery)](COMPARISON-csd.md), [photos](PHOTOS.md), [Bmo double-deck coach](../../docs/models/bmo-double-deck.md), [CSD coaches](../../docs/models/csd-coaches.md).

## Original evidence

All native files come from `janproch/vlakosimdb` revision `b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`, directories `db/train/coach/csd_bmo/` (in `native/csd_bmo/`) and `cd_bmo#1`, `cd_bmo#2`, `cd_bmo#3` (in `native/cd_bmo_1/` .. `cd_bmo_3/`; the `#` is not used in the folder names). The four `index.xml` describe the same geometry (they differ only in editor view settings); the BMPs differ in paint. For each:

- `vehicle.xml`: unchanged metadata (`CSD_Bmo`, `CD_Bmo#1..3`): 80 t, 120 km/h, authors Vojtech Vohlidka (CSD, #1, #2) and Jan Prochazka (#3); the original spelling is kept in the Windows-1250 files.
- `index.xml`: the unchanged simplemodel: `alongx`/`alongy`/`alongz` clip polygons, colorizes and baked polygons.
- `x_both.bmp`, `y_dec.bmp`, `z_both.bmp`: the unchanged original BMPs (0.1 m a pixel). No 4x texture was used or shipped.

The model is the double-deck coach, one parametric design `veh-bmo-double-deck-coach` with `livery` = `csd` (default), `cdBlue`, `cdBlueGrey` or `cdRedDoors`. It replaces the earlier `veh-csd-bmo` (never published to the game). It uses procedural surfaces and solid-colour materials; nothing reads a database checkout or a texture at run time.

## Coordinates and reconstruction

Source `(x, y, z)` is Factory `(x - centre, y, z)`, metres, with `centre` the midpoint between the buffer heads; `z_dec` paints the right (+Z) side, `z_inc` the left. Side canvases keep increasing source x, so the left elevation is mirrored relative to an outside observer. See [csd-coaches.md](../../docs/models/csd-coaches.md) for the mapping, the builder and the choices every coach shares (1.75 m buffers, round lamps, wheel radii).

- Section `alongx`: 3.0 m wide from 0.4 to 3.2 m, the upper deck wall sloping in to 1.1 m at 4.0 m, roof to 4.6 m; floor at 0.2 m. Elevation `alongz`: the ends are single-level from 0.9 m, the floor drops to 0.2 m between x 6.0 and 20.8.
- Six upper (rows 10..18, on the sloped wall) and six lower windows (rows 31..40) at columns 85..183; end windows; double doors at columns 64..81 and 187..204; a hatch outline at 24..35. The yellow wing lines of the side emblem (rows 21, 23, 25) are modelled; the CSD monogram is not.
- Axles at source x 2.25, 4.75, 22.05, 24.55 m.

## Liveries (native z_both and x_both colours)

- `csd`: beige roof from 3.2 m, a yellow line at 3.1..3.2 m, dark blue body and ends, yellow emblem wings and "ČSD".
- `cdBlue` (Bmo#1): grey roof, blue (32, 80, 191) body and ends, grey doors, bright blue door canopies.
- `cdBlueGrey` (Bmo#2): grey roof; blue 2.5..3.2 m; light grey from 0.8 m (dropped centre) or 1.8 m (single-level ends) to 2.5 m; blue below, the end sections' blue meeting the centre's 0.8 m band down a slope at the door (rows 32..41, columns 58..62 and 205..209); a violet trim line at 1.0..1.1 m on the ends; blue doors.
- `cdRedDoors` (Bmo#3): as Bmo#2 with red doors, the livery of the 2014 photographs.
- The CD liveries carry a white CD emblem on the x = 0 end section (columns 43..50, rows 34..38) and the running number between the decks.

## Shape changes in this transfer

- The bolted seams of the removable roof panels over the single-level ends: `y_dec` columns 18, 44, 223, 249 and the photographed end roof.
- The hatch under the end window is its own scope (`hatch`), no longer a third door.

## Running number

`BMO_NUMBERS`: `csd` and `cdRedDoors` carry `50 54 26-18 134-1`, legible on `photo-bmto-side-praha-2014.jpg` (the coach, now ČD Bmto292, in the red-door livery; the CSD livery has a large "ČSD" between the yellow emblem wings above it). `cdBlue` `50 54 26-18 118-4` and `cdBlueGrey` `50 54 26-18 127-5` are illustrative numbers in the series 101 to 150. All check digits are valid.

## Photo check

The photographs (later liveries) confirm the dropped centre section with six upper and six lower windows, the single-level ends with one window, the double doors at the ends of the low section and the sloped upper wall. The two 2014 photographs show the red-door livery (Bmo#3) and confirm its blue/grey bands, the slope of the lower blue band at the doors and the CD emblem on the end section. No free photograph of the original blue and beige or the all-blue livery was found; they follow the native BMPs. New photographs could not be downloaded for this transfer (the network policy blocks Wikimedia Commons). See [PHOTOS.md](PHOTOS.md) for every photograph's source, author and licence.

## Measurement record

Each `native/<key>/landmarks.json` holds 60 native pixel-edge boxes with their model scopes, tolerances and uncertainty (the CD liveries' windows re-detected on their own BMPs where the paint allows); `baseline.json` is the first authored geometry's measurement. `COMPARISON-<livery>.md` lists the normalized errors, the signed residual of every box and the model revision.
