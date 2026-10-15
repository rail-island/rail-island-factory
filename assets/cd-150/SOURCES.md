# CD 150 source references

**Covers** - provenance, coordinate conversion and reconstruction choices.
**Code** - `generator/cd150.ts`, `native/landmarks.json`.
**See also** - [comparison](COMPARISON.md), [vehicles](../../docs/models/vehicles.md).

## Original evidence

All native source files come from `janproch/vlakosimdb` revision
`b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`, directory
`db/train/loco/electric/cd_150/`:

- `native/vehicle.xml`: unchanged vehicle metadata, author Borek Hudak (original
  spelling is retained in the Windows-1250 file), 84 t, 4000 kW, 140 km/h.
- `native/index.xml`: unchanged geometry, including editor clipping profiles,
  baked polygons, texture mappings and the two `/pant` instances.
- `native/x_both.bmp`, `z_dec.bmp`, `z_inc.bmp`, `y_dec.bmp`: unchanged original
  BMPs. No 4x textures were used for measurement or shipped in the new model.
- `native/pant.xml`: unchanged root component extracted from
  `jt7_src/out/jt7/objects/pant.zip` at that same revision. This component is not
  local to the locomotive's model folder; it has two linked triangular arms.

The original source attribution is preserved here and in the retained metadata.
The new factory model uses procedural surfaces and solid-colour materials;
there is no runtime reference to a database checkout or external textures.

## Coordinates and profiles

Source `(x, y, z)` maps to Factory `(x - 8.5, y, -z)`, in metres. XML colorize
maps the front 30 x 60 BMP to 3 x 6 m and the side 170 x 60 BMPs to 17 x 6 m:
0.10 m per native pixel. Both side comparison canvases retain increasing source
X; this mirrors the left elevation relative to an outside observer.

The source body plan is 3.0 m wide through x=2.7..14.3 and narrows to 2.8 m
at the cab ends, x=0.5 and 16.5. The upper ends recede to x=1.5 and 15.5 at
y=3.9, with a roof plateau at y=4.2. The two nose breaks differ: y=2.6 at
source x=0.5 and y=2.7 at x=16.5. The Factory preserves that asymmetry, both
slopes and the tapered sides. The lower source apron and upper skin overlap
near y=1.6; a continuous three-band skin joins them. Fitted panels split at
slope changes so they do not cut through the body.

The vent is asymmetric: source positive Z is taller (Factory negative Z).
Its low skirt is at 3.5 m and the source alongz clip limits its top to 4.6 m.
The dark openings on that taller side follow its roof slope. The other side
has a painted cooler apron below the structural roof, matching the BMP rather
than treating the painted boundary as an additional solid roof box.

## Mechanical and display choices

- 16.80 m over buffer heads, 1.75 m buffer spacing. The front BMP's buffer
  silhouettes alone would imply wider spacing; the mechanical spacing wins.
- Bogie centres are 8.40 m apart, with 3.30 m axle spacing recovered from the
  source silhouette wheel centres (source X: 2.6, 5.9, 11.0, 14.3 m).
  The bogies consequently retain the source's 0.05 m rearward offset. The model uses 1.25 m wheels on standard-gauge tread
  positions, not the original simplemodel's flat painted bogie boxes. Running
  gear below the body is an interpretation; detailed suspension is not
  recoverable from these pixels.
- Source `/pant` instances have different X/Y scales: the folded instance is
  vertically compressed. The new model uses connected arms of the same length
  in both poses instead of stretching that source component. Rear (-X) is
  raised, front (+X) folded. Collector tops are 6.24 and 4.64 m. This is a
  display operating height, not a sourced contact-wire specification.
- Front mask, checked against the photographs (scaled by the 1.0 m plate):
  the number plate (0.23 m tall) sits just below the 1.9 m cream/green
  boundary, and the four marker lamps are level with it, chrome-rimmed, at
  z=+/-0.87 and +/-1.13 (inner white, outer red). The native BMP's 3-pixel
  plate and yellow lamp patches put them 0.35 m lower; landmarks F06 and
  F08..F11 keep that estimate but carry a superseding `photoBox`. The top
  headlight is a dark 0.6 m housing with two round lenses (landmark F05 is the
  lens pair). The green front wraps down to the buffer beam (0.8..1.22 m).
- Plates show the full running number `150 222-8`: a CD-era 150.2 unit with a
  valid check digit. The tiny native plate does not resolve digits, so the
  serial is a choice, not read from the source; 150 222 is a real unit in this
  livery (`photo-150-222-front-three-quarter.jpg`). The shared CD
  outline approximates the native period badge.
- The green side skirt hangs to 0.9 m above rail along the body (source rows
  41..50 of both side BMPs; in the photographs only the lower wheels show
  below it), broken by the cab-door steps, and drops to 0.6 m between the
  bogies (columns 74..95, rows 51..53) with sloped ends at columns 70..73 and
  96..100.
- Wheels have cast spoked centres (ten spokes and a hub), after
  `photo-150-209-bogie.jpg`; the bogie frame, motors and springs behind the
  skirt stay simplified.
- One rigid node; no truck/trailer articulation. Fixed equipment remains below
  4.7 m and the active collector below the separate 6.5 m project limit.

## Measurement record

`native/landmarks.json` contains 39 fixed front and side annotations, with
scope selectors, pixel-edge boxes and uncertainty. `native/baseline.json` is
the first authored geometry's measurement record, before fitting. See
[COMPARISON.md](COMPARISON.md) for normalized before/after errors, signed
per-element residuals, generated views and the reproducible model hash.

The source BMPs and XML are the evidence for this transfer. No independent
photographic calibration was performed; unresolved raster details remain
interpretations, not claims of photographic accuracy.

## Photographs

Downloaded from Wikimedia Commons for the model page's Images tab and visual
checks; downscaled to at most 1600 px on the long side, otherwise unchanged.
They decide the front mask details, the full skirt and the spoked wheels
(see "Mechanical and display choices"); the rest stays calibrated to the
native BMPs above. Licences require attribution (and share-alike for derivatives of
the photographs themselves); the procedural model is not a derivative copy.

- `photo-150-222-front-three-quarter.jpg` - "I10 333 Bf Zilina, 150 222.jpg" by Falk2, CC BY-SA 3.0,
  https://commons.wikimedia.org/wiki/File%3AI10_333_Bf_%C5%BDilina%2C_150_222.jpg - 150 222 in the CD green/cream livery at Zilina, 2012 - the modelled unit: front mask, lamps, plate, emblem and skirt.
- `photo-150-green-side-three-quarter.jpg` - "Electric locomotive class 150 of Ceske drahy.jpg" by Rainerhaufe, CC BY-SA 3.0,
  https://commons.wikimedia.org/wiki/File%3AElectric_locomotive_class_150_of_%C4%8Cesk%C3%A9_dr%C3%A1hy.jpg - a class 150 in the green/cream livery, 2006 - side, cab door, band boundary and the green skirt lowered between the bogies.
- `photo-150-209-front-depot.jpg` - "Lokomotivni depo Praha-Vrsovice, lokomotiva 150.209 (2).jpg" by Jan Polak, CC BY-SA 3.0,
  https://commons.wikimedia.org/wiki/File%3ALokomotivn%C3%AD_depo_Praha-Vr%C5%A1ovice%2C_lokomotiva_150.209_%282%29.jpg - 150 209 lifted in Praha-Vrsovice depot, 2015 - straight front, green/cream mask, plate and emblem.
- `photo-150-209-bogie.jpg` - "Lokomotivni depo Praha-Vrsovice, lokomotiva 150.209, podvozek (1).jpg" by Jan Polak, CC BY-SA 3.0,
  https://commons.wikimedia.org/wiki/File%3ALokomotivn%C3%AD_depo_Praha-Vr%C5%A1ovice%2C_lokomotiva_150.209%2C_podvozek_%281%29.jpg - 150 209 bogie from below, 2015 - wheels, axle boxes, motor and suspension.
- `photo-150-226-side.jpg` - "150 226-9 Bohumin.jpg" by Akjam-Sen, CC BY-SA 4.0,
  https://commons.wikimedia.org/wiki/File%3A150_226-9_Bohumin.jpg - 150 226-9 at Bohumin, 2016 - near-orthogonal side (later blue livery, same body).
- `photo-150-203-side.jpg` - "150 203 Chomutov.jpg" by Rainerhaufe, CC BY-SA 4.0,
  https://commons.wikimedia.org/wiki/File%3A150_203_Chomutov.jpg - 150 203 at Chomutov, 2018 - side with the lowered skirt and roof equipment (later blue livery).

## Liveries (`livery` parameter)

The other liveries of this design are read from their vlakosimdb side BMPs,
kept unchanged under `native/liveries/<model>/` (`x_both.bmp`, `z_dec.bmp`,
`z_inc.bmp`, from `janproch/vlakosimdb` commit
`b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`, `db/train/loco/electric/<model>/model/`).
See docs/models/loco-liveries.md for the reading and the deviations.

| model | author (vlakosimdb) | running number |
|---|---|---|
| `cd_151` | Vojtech Vohlidka | 151 012 - illustrative |
| `cd_151_cez` | Vojtech Vohlidka | 151 019 - illustrative |
| `zsr_350` | Jan Prochazka | 350 016 - illustrative |
| `zsr_350_001` | Vojtech Vohlidka | 350 001 - the model's name |
| `zsr_350_002` | Vojtech Vohlidka | 350 002 - the model's name |
| `zsr_350_003` | Vojtech Vohlidka | 350 003 - the model's name |
| `zsr_350_004` | Vojtech Vohlidka | 350 004 - the model's name |
