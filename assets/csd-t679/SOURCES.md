# CSD T 679.0 source references

**Covers** - identification and provenance of the T 679.0 "Pomeranc" (CD / ZSR 776): native files, photograph, dimensions, coordinate conversion and reconstruction choices.
**Code** - `generator/csdT679.ts`, `generator/dieselParts.ts`, `generator/dieselComparison.ts`, `native/landmarks.json`.
**See also** - [comparison](COMPARISON.md), [photographs](PHOTOS.md), [the models' reference](../../docs/models/diesel-locos.md).

## Identification

The vlakosimdb model `csd_t_679` (title "CSD T 679", Borek Hudak) was listed
beside the CD 781 because the T 679.1 is the M62. Its textures show another
locomotive: a full-width orange body with a cream roof, a long dark machine-room
window between a louvred intake and a ladder, cream bands under the cab windows,
an olive frame band, a 19 m canvas and Co'Co' bogies. That is the CKD T 679.0
of 1962 .. 1965 (27 built, T 679.001 .. 027, later CD / ZSR 776 001 .. 027),
nicknamed "Pomeranc" for its orange paint (de.wikipedia, CSD-Baureihe T 679.0;
cs.wikipedia, Lokomotiva 776), as `photo-t679-0-side.jpg` confirms. It is its
own design, `veh-csd-t679-0`.

## Original evidence

`janproch/vlakosimdb` revision `b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`,
`db/train/loco/diesel/csd_t_679`: `native/vehicle.xml` (114 t, 1470 kW,
100 km/h), `native/index.xml`, `x_both.bmp`, `z_both.bmp`, `y_dec.bmp`. No
enhanced texture exists or was used.

## Dimensions

18.0 m over the buffers, 3.1 m wide, 4.25 m high, 9.56 m between the pivots,
4.0 m bogie wheelbase (2 x 2.0), 1.0 m wheels, 114 t (de.wikipedia,
CSD-Baureihe T 679.0, infobox).

## Coordinates and profiles

The BMPs are 19 x 4.4 m (`z_both` 190 x 44 px) and 3 x 4.4 m (`x_both` 30 x 44),
0.1 m a pixel; row r spans 4.4 - (r + 1) / 10 to 4.4 - r / 10 m. The XML body
spans source x 0.6 .. 18.3 (17.7 m) with buffers to 18.6 - drawn longer than the
published locomotive. The model scales the drawing along x by K = 0.95:
Factory X = (source x - 9.45) * 0.95, a 16.8 m body with 0.6 m buffers, 18.0 m
over them. Heights and widths are unscaled.

- `alongz`: the face leaning back from source x 0.6 at 1.3 m to 0.8 at 3.9 m,
  the roof rolling to 0.9 at 4.1, 1.1 at 4.2 and 1.9 at 4.3 m; the body down to
  0.9 m, the cream skirt under each cab to 0.1 m.
- `alongx`: upright sides to 3.9 m, the roof's corners 1.4 at 4.1, 1.2 at
  4.2 m, the crown at 4.3 m; `light` the headlight housing on the roof's front
  (+-0.2 m, 4.1 .. 4.3 m); `kom` the exhaust (source x 9.0 .. 9.4, z 0.7 .. 0.9).
- `alongy`: corners chamfered 0.1 by 0.1 m.

## Running number

T 679.001: the class's first unit, in the pre-1988 Kryspin numbering the
photograph shows on the side ("T679 0.."; its serial is not legible). As a
1988 number it would be 776 001-0.

## Deviations

- The scale K above (published length).
- The head lamps stand 0.35 m inboard of where the BMP draws them, clear of the
  standard buffers at 1.03 m (the BMP draws the buffers 0.2 m lower).
- The machine room's window is a dark glazed band with mullions; the side's
  orange bands under the cab windows follow the BMP, the face's orange "V" under
  the windows is simplified to a straight band.
