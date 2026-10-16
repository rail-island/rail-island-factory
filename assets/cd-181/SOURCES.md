# CD 180 / 181 / 182 source references

**Covers** - provenance of the native vlakosimdb files, dimensions and their sources, the coordinate conversion and reconstruction choices.
**Code** - `generator/cd181.ts`, `generator/boxLocoKit.ts`, `generator/mainlineComparison.ts`, `native/landmarks.json`.
**See also** - [photographs](PHOTOS.md), [comparison](COMPARISON.md), [the model's reference](../../docs/models/mainline-electrics.md).

## Original evidence

All native files come from `janproch/vlakosimdb` revision
`b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`, `db/train/loco/electric/<model>/model/`, unchanged. No `_4x` or other
enhanced texture was used or shipped.

| Folder | vlakosimdb model | Author (index.xml) | Livery value |
|---|---|---|---|
| `native/cd_180/` | `cd_180` | Vojtech Vohlidka | `cd180` |
| `native/cd_181/` | `cd_181` | Borek Hudak | `cd181` (default) |
| `native/cd_181-okd/` | `cd_181-okd` | Borek Hudak | `cd181Okd` |
| `native/cd_182/` | `cd_182` | Vojtech Vohlidka | `cd182` |

## Dimensions

- 18.80 m over the buffers (cs.wikipedia, Lokomotiva 181), Co'Co', 3 kV DC;
- from the `cd_181` XML: a 17.6 m body (0.6 .. 18.2 m), 3.0 m wide, the roof's
  crown at 4.1 m with the resistor cover to 4.3 m, bogie centres 8.2 m apart
  with axles 2.4 m apart, 1.25 m wheels; diamond pantographs (vlakosimdb
  `pantdbl`) at +-5.35 m.

## Coordinates and profiles

Every canvas is 0.1 m a pixel; the vehicle spans 0 .. 18.8 m of the 22 m
(`cd_181`) or 19 m (`cd_180`, `cd_182`) side canvas: column px -> x = (94 - px)
/ 10 (the source's x flipped, so its raised `predni` pantograph is at -X), row
r -> y = 6.0 - r / 10. Front: column u -> z = 1.5 - u / 10 seen from ahead.

- **Section** (alongx): 3.0 m wide to 3.5 m, the roof rolling through (1.4,
  3.7), (1.2, 3.9), (1.0, 4.0) to a 1.0 m crown at 4.1 m.
- **Elevation** (alongz): the end upright to 2.4 m, raked 0.2 m back by 3.5 m,
  rolling over to 1.2 m back at the crown.
- **Plan** (alongy box): rounded ends, 0.1 / 0.2 / 0.3 / 0.5 / 1.0 m back at
  z = 1.0 / 1.2 / 1.3 / 1.4 / 1.5 m.
- **Paint**: band rows read in column 100 (12 on the OKD's cab, 50 on the 180
  and 182); the comment above each livery lists them.
- `cd_180` and `cd_182` (Vohlidka) have a cruder body of their own; the design
  uses the `cd_181` body for all four and takes from them only the paint and the
  machine-room layout (the 180's louvre banks and divided windows, columns
  35-153; the 182's window order).

## Running numbers

- 180 001-0: the preserved prototype (photo-180-001.jpg).
- 181 105-8: photographed in this livery (photo-181-105-side.jpg; its title
  writes the check digit as -6, the scheme gives -8).
- 181 056-3: illustrative; OKD Doprava ran two ex-CD units from 1998.
- 182 099-2: photo-182-099.jpg.
