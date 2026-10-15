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
- Equal circular marker lenses are white/red inside yellow housings; the tiny
  native yellow patches cannot establish lens colours or exact outlines.
- Plates show the class `150`; the tiny native plate does not resolve a full
  running number. The shared CD outline approximates the native period badge.
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
