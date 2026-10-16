# OBB 1012 source references

**Covers** - provenance of the native vlakosimdb files, dimensions and their sources, the coordinate conversion and reconstruction choices.
**Code** - `generator/obb1012.ts`, `generator/boxLocoKit.ts`, `generator/mainlineComparison.ts`, `native/landmarks.json`.
**See also** - [photographs](PHOTOS.md), [comparison](COMPARISON.md), [the model's reference](../../docs/models/mainline-electrics.md).

## Original evidence

All native files come from `janproch/vlakosimdb` revision
`b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`, `db/train/loco/electric/<model>/model/`, unchanged. No `_4x` or other
enhanced texture was used or shipped.

| Folder | vlakosimdb model | Author (index.xml) |
|---|---|---|
| `native/` | `obb 1012` | Karola Meyer |

## Dimensions

From de.wikipedia (OBB 1012): 19.30 m over the buffers, 2.8 m bogie wheelbase;
three prototypes of 1996 (SGP, Siemens, ELIN, ABB), sold to Hector Rail in 2007.
Pivots (9.9 m) and wheels (1.15 m) assumed from the contemporary OBB 1016 data
sheet; not published for the 1012.

## Coordinates and profiles

The side BMP is 193 x 58 pixels on 18 x 6 m; the native body spans 0.4 .. 17.6
m, 17.2 m against the real one's 18.3 m, so x is scaled by 1.064: column px ->
x = (96.5 - px) * 0.09923, row r -> y = 6.0 - r * 0.10345. The end BMP is 30 x
60 on 3 x 6 m.

- **Elevation** (alongz): the skirt, the nose upright 1.5 to 1.9 m, the rake 1.0
  m back by 3.7 m, the roof's fairing from 3.9 to 4.2 m.
- **Section** (alongx): 3.0 m wide to 2.9 m, the upper sides leaning in to 2.2 m
  at 3.8 m, the fairing 1.5 m wide.
- **Plan** (alongy): rounded ends, 0.5 m back at the side.

## Running number

1012.001, the first of the three, in OBB style (no check digit is shown).
