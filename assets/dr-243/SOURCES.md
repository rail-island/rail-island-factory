# DR 243 / DB 143 / 112 source references

**Covers** - provenance of the native vlakosimdb files, dimensions and their sources, the coordinate conversion and reconstruction choices.
**Code** - `generator/dr243.ts`, `generator/boxLocoKit.ts`, `generator/mainlineComparison.ts`, `native/landmarks.json`.
**See also** - [photographs](PHOTOS.md), [comparison](COMPARISON.md), [the model's reference](../../docs/models/mainline-electrics.md).

## Original evidence

All native files come from `janproch/vlakosimdb` revision
`b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`, `db/train/loco/electric/<model>/model/`, unchanged. No `_4x` or other
enhanced texture was used or shipped.

| Folder | vlakosimdb model | Author (index.xml) | Livery value |
|---|---|---|---|
| `native/dr_243/` | `dr_243` | Karola Meyer | `dr243` (default) |
| `native/db_143/` | `db_143` (S-Bahn) | Karola Meyer | `db143` |
| `native/db_143vr/` | `db_143vr` | Karola Meyer | `db143vr` |
| `native/db_112/` | `db_112` | Karola Meyer | `db112` |

`db_143 007` (Florian Wassmann) is archived in the game and was left out.

## Dimensions

From de.wikipedia (DR-Baureihe 243): 16.64 m over the buffers, a 15.34 m body,
8.5 m between the pivots (8.4 m on the 112), 3.3 m bogie wheelbase, 1.25 m
wheels, 3.12 m wide, 3.98 m high. The DR 212 / DB 112 is the related design on
the same body (other gearing, 8.4 m pivots), so vlakosimdb's `db_112` is a
livery of this design.

## Coordinates and profiles

Every canvas 0.1 m a pixel; the body spans 0.6 .. 16.0 m of the 17 m canvas and
the texture is centred on column 84: column px -> x = (84 - px) / 10, row r ->
y = 6.0 - r / 10.

- **Section** (alongx): 3.0 m wide to 3.5 m, then the roof's edge to a 1.8 m
  crown at 3.9 m (the model rounds it at 3.7 m).
- **Elevation** (alongz): the end upright to 2.0 m, 0.2 m back by 3.6 m, rolling
  over to 1.1 m back at the crown.
- **Plan**: the XML's is a rectangle; the model rounds the corners 0.35 m back
  as photographs show.

## Running numbers

- 243 864-6: photographed in DR livery (photo-243-864.jpg).
- 143 617-9, 143 837-3, 112 139-1: illustrative units of the class.
