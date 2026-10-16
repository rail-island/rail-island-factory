# DNT 184.5 source references

**Covers** - provenance of the native vlakosimdb files, dimensions and their sources, the coordinate conversion and reconstruction choices.
**Code** - `generator/dnt184.ts`, `generator/boxLocoKit.ts`, `generator/mainlineComparison.ts`, `native/landmarks.json`.
**See also** - [photographs](PHOTOS.md), [comparison](COMPARISON.md), [the model's reference](../../docs/models/mainline-electrics.md).

## Original evidence

All native files come from `janproch/vlakosimdb` revision
`b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`, `db/train/loco/electric/<model>/model/`, unchanged. No `_4x` or other
enhanced texture was used or shipped.

| Folder | vlakosimdb model | Author (index.xml) | Livery value |
|---|---|---|---|
| `native/dnt_184.5/` | `dnt_184.5` | Borek Hudak | `dnt1845` (default) |
| `native/dnt_184_5_1/` | `dnt_184_5#1` | Borek Hudak | `dnt1845No1` |
| `native/dnt_184_5_2/` | `dnt_184_5#2` (160 km/h) | Borek Hudak | `dnt1845No2` |

## Identification

"DNT" is Doly Nastup Tusimice, the lignite mine that ordered the class (it
became part of Severoceske doly in 1994; the locomotives belong to SD -
Kolejova doprava today). The 184.5 is the Skoda 93E, a 3 kV DC Bo'Bo'Bo'
(the middle bogie shiftable sideways) of 5,220 kW, four built in 1994-1999 for
the Kadan - Tusimice line; the first prototype was geared for 155 km/h for its
trials at Velim and later regeared to 95 km/h (cs.wikipedia).

## Dimensions

- 20.346 m over the buffers (cs.wikipedia), Bo'Bo'Bo';
- from the `dnt_184.5` XML: a 19.1 m body (0.6 .. 19.7 m; the native cream band
  runs a pixel beyond at each end, so the model's body is 19.3 m), 3.0 m wide,
  the nose upright from 1.6 to 2.2 m and raked 0.8 m back by 3.7 m, the roof at
  4.0 m with covers to 4.6 m, bogies at -5.5, 0, +5.5 m with axles 3.1 m apart,
  single-arm pantographs over the outer bogies; wheels 1.25 m (assumed).

## Coordinates

Every canvas 0.1 m a pixel; column px -> x = (101.5 - px) / 10, row r -> y =
6.0 - r / 10. `dnt_184.5` draws the windows on `z_dec` (+z) and five grille bays
in two tiers on `z_inc`; the two prototypes draw them the other way round and
a slightly longer rake, which the design does not reproduce.

## Running numbers

- 184 503-1: photographed (photo-184-503.jpg).
- 184 501-5 and 184 502-3: the prototypes, by vlakosimdb's #1 and #2.
