# CD 123 / 130 source references

**Covers** - provenance of the Skoda 57E / 79E native files, dimensions, the coordinate conversion and reconstruction choices.
**Code** - `generator/cd130.ts`, `generator/czElectricKit.ts`, `generator/czElectricComparison.ts`, `native/landmarks.json`.
**See also** - [photographs](PHOTOS.md), [comparison](COMPARISON.md), [the model's reference](../../docs/models/cz-electrics.md).

## Original evidence

All native files come from `janproch/vlakosimdb` revision
`b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`, `db/train/loco/electric/`, unchanged
(`vehicle.xml` is the top-level `index.xml`, `index.xml` the `model/index.xml`):

| Folder | vlakosimdb model | Author (index.xml) | Livery value |
|---|---|---|---|
| `native/cd_130/` | `cd_130` | Vojtech Vohlidka | `cd130` (default) |
| `native/cd_123/` | `cd_123` | Vojtech Vohlidka | `cd123` |
| `native/cd_123-019-2/` | `cd_123-019-2` | Borek Hudak | `cd123No019` |

`csd_131` (the two-section 131) is archived in the game and was left out on
request. No `_4x` or other enhanced texture was used or shipped.

## Dimensions

From atlaslokomotiv.net (Lokomotiva 123, 130) and cs.wikipedia:

- 17.21 m over the buffers, a 15.97 m body, 2.94 m wide (2.95 m on the 123);
- 8.17 m between the bogie pivots; bogie wheelbase 3.20 m (130) and 3.33 m
  (123: total wheelbase 11.50 m); 1.25 m wheels;
- 4.64 / 4.65 m high with the collectors down;
- the 123 with diamond pantographs (vlakosimdb `pantdbl`), the 130 with
  single-arm ones (`pant`); the shared Skoda body with four machine-room windows
  a side and the raised middle of the roof.

## Coordinates and profiles

The side BMPs are 0.1 m a pixel: column px -> x = (79.5 - px) / 10 (the source's
x flipped, so its raised `zadni` pantograph is at -X), row r -> y = 6.0 - r / 10
(`cd_130`, `cd_123`; 5.0 - r / 10 on `cd_123-019-2`'s 5 m canvas).

- **Section** (`cd_130` alongx, `cd_123-019-2` box clip): 2.94 m wide to 3.5 m,
  the roof curving through (1.38, 3.7), (1.22, 3.85), (0.95, 3.98) to a 1.0 m
  flat crown at 4.1 m.
- **Elevation**: the end vertical to 2.5 m, the windscreen raked 0.15 m back
  by 3.5 m, the roof rolling over 1.05 m back by the crown.
- **Plan**: nearly flat ends whose corners round off 0.45 m back (the XML's
  0.5 m and 0.45 m).
- **Roof**: the raised middle (XML roof clip 5.6..10.3 m), 4.8 m long with
  louvred slopes up to a flat top at 4.4 m; pantographs at +-4.75 m.
- **Paint**: the 130's cream over green with the yellow nose band; the 123's
  pale and dark green with yellow lines; the 123 019's two greens with a salmon
  line.

## Running numbers

- 130 036-7: photographed in this livery (`photo-130-036-front-three-quarter.jpg`).
- 123 008-5: illustrative, a unit of the class photographed in Praha-Smichov in 1992-93.
- 123 019-2: the vlakosimdb model's name.
