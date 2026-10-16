# DB 111 source references

**Covers** - provenance of the native vlakosimdb files, dimensions and their sources, the coordinate conversion and reconstruction choices.
**Code** - `generator/db111.ts`, `generator/boxLocoKit.ts`, `generator/mainlineComparison.ts`, `native/landmarks.json`.
**See also** - [photographs](PHOTOS.md), [comparison](COMPARISON.md), [the model's reference](../../docs/models/mainline-electrics.md).

## Original evidence

All native files come from `janproch/vlakosimdb` revision
`b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`, `db/train/loco/electric/<model>/model/`, unchanged. No `_4x` or other
enhanced texture was used or shipped.

| Folder | vlakosimdb model | Author (index.xml) | Livery value |
|---|---|---|---|
| `native/db_111/` | `db_111` | Karola Meyer | `db111` (default) |
| `native/db_111_bb/` | `db_111_bb` | Karola Meyer | `db111Bb` |
| `native/db_111_s/` | `db_111_s` | Karola Meyer | `db111S` |

## Dimensions

From de.wikipedia (DB-Baureihe 111): 16.75 m over the buffers, 7.9 m between
the pivots, 3.4 m bogie wheelbase, 11.3 m total, 1.25 m wheels, 3.13 m wide
(the model 3.0 m, the XML's width), 4.489 m high; 227 built (111 001-227); the
S-Bahn units 111 111-188 in orange and kieselgrau.

## Coordinates and profiles

Every canvas 0.1 m a pixel; the body spans 0.45 .. 16.28 m of the 17 m canvas:
column px -> x = (83.65 - px) / 10, row r -> y = 6.0 - r / 10.

- **Section** (alongx): 3.0 m wide to 1.8 m, leaning in to 2.6 m at 4.2 m.
- **Elevation** (alongz): the end upright 1.7 to 2.1 m, raked 0.6 m back by
  3.8 m; the roof at 3.9 m with the cover between the pantographs to 4.3 m.
- **Plan** (alongy): pointed ends, 0.1 m back near the middle, 0.88 m at the side.

## Running numbers

- 111 024-6: illustrative, a unit of the class in verkehrsrot.
- 111 174-9: photographed in ozeanblau-beige (photo-111-174-blue-beige.jpg).
- 111 143-4: illustrative, one of the S-Bahn Rhein-Ruhr units.
