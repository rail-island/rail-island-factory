# CD 110 / 111 / 210 source references

**Covers** - provenance of the centre-cab shunters' native files, dimensions, the coordinate conversion and reconstruction choices.
**Code** - `generator/cd110.ts`, `generator/czElectricKit.ts`, `generator/czElectricComparison.ts`, `native/landmarks.json`.
**See also** - [photographs](PHOTOS.md), [comparison](COMPARISON.md), [the model's reference](../../docs/models/cz-electrics.md).

## Original evidence

All native files come from `janproch/vlakosimdb` revision
`b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`, `db/train/loco/electric/`, unchanged
(`vehicle.xml` is each model's top-level `index.xml`, `index.xml` its
`model/index.xml` with the clip profiles, baked polygons and texture mappings):

| Folder | vlakosimdb model | Author (index.xml) | Livery value |
|---|---|---|---|
| `native/cd_110_046/` | `cd_110 046-0` | Borek Hudak | `cd110` (default) |
| `native/cd_111/` | `cd_111` | Vojtech Vohlidka | `cd111` |
| `native/cd_210/` | `cd_210` (with its `pant1` component) | Vojtech Vohlidka | `cd210` |

`cd_110` (the plain 110 by Jan Prochazka) is archived in the game and was left
out on request. No `_4x` or other enhanced texture was used or shipped.

## Dimensions

From atlaslokomotiv.net (Lokomotiva 110, 111, 210) and cs.wikipedia:

- 14.40 m over the buffers, a 13.16 m frame, 3.00 m wide;
- 6.30 m between the bogie pivots, 2.80 m bogie wheelbase, 1.05 m wheels;
- 4.65 m (110, 111) and 4.625 m (210) high with the collector down;
- one single-arm half pantograph on the cab roof (the first Czechoslovak series
  locomotives with one), the 210 with its AC breaker beside it (photographs).

## Coordinates and profiles

`cd_110 046-0` is the detailed source (a 14.4 x 6 m canvas, 0.1 m a pixel; its
XML is the only one with the frame, hoods, ramps and cab as separate clips).
Source `(x, y, z)` maps to Factory `(7.2 - x, y, z)`. `cd_111` and `cd_210` are
simple boxes on a 16 m canvas and give the liveries only; the three classes
share the mechanical part, so one body serves all.

- **Frame**: 0.9 to 1.4 m (the XML's 0.9..1.3..1.5 m deck simplified to one
  level), 13.16 m long with 0.2 m corner chamfers.
- **Hoods** (`box` clip): 2.2 m wide, 1.4 to 3.1 m with a cambered top to 3.22 m,
  their ends leaning out from 5.80 m at the deck to 5.95 m at the roof.
- **Cabinets** (`roof` clips): full width beside the cab: below 2.6 m out to
  5.1 m with the ramp falling from 2.6 m at 3.6 m to 2.0 m at 5.1 m, and a block
  to 3.2 m whose face leans from 2.55 m to 2.23 m (XML 4.65..5.0 m).
- **Cab** (`cab` clip): 2.8 m long and 3.0 m wide to 3.2 m, leaning in to 2.4 x
  2.6 m at the roof. The native cab roof stands at 4.4 m; the model keeps it at
  4.3 m so the folded collector stays near the published 4.65 m.
- **Paint**: rows read from each model's `z_both` / `x_both` (row r spans
  6.0 - (r + 1) / 10 to 6.0 - r / 10 m): the 110's red with a cream band at 2.3 to
  2.6 m on the hoods and a cream upper cab; the 111's green with orange hood
  ends; the 210's blue with a cream band at 2.1 to 2.5 m.

## Running numbers

- 110 046-0: the vlakosimdb model's name.
- 111 006-3: illustrative, a unit of the class photographed in 2011
  (`photo-111-006-three-quarter.jpg`, in a later livery).
- 210 021-2: illustrative, the unit of `photo-210-021-three-quarter.jpg`.
