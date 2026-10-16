# OBB 1040 source references

**Covers** - provenance of the native vlakosimdb files, dimensions and their sources, the coordinate conversion and reconstruction choices.
**Code** - `generator/obb1040.ts`, `generator/boxLocoKit.ts`, `generator/mainlineComparison.ts`, `native/landmarks.json`.
**See also** - [photographs](PHOTOS.md), [comparison](COMPARISON.md), [the model's reference](../../docs/models/mainline-electrics.md).

## Original evidence

All native files come from `janproch/vlakosimdb` revision
`b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`, `db/train/loco/electric/<model>/model/`, unchanged. No `_4x` or other
enhanced texture was used or shipped.

| Folder | vlakosimdb model | Author (index.xml) |
|---|---|---|
| `native/` | `obb_1040` (title "OBB 1040 Rot") | Karola Meyer |

## Dimensions

From de.wikipedia (OBB 1040): 12.92 m over the buffers, Bo'Bo', 16 built by
Floridsdorf in 1950-1953, two pantographs. Pivots, wheelbase and wheels are not
published there; the model takes them from the native side (axles at +-2.6 and
+-5.0 m) with 1.30 m wheels.

## Coordinates

Every canvas 0.1 m a pixel; the vehicle spans 0.4 .. 12.7 m of the 17 m canvas,
12.3 m against the published 12.92 m, so x is scaled by 1.0504: column px ->
x = (px - 65.5) * 0.10504 (the raised `zadni` pantograph at -X), row r -> y =
6.0 - r / 10.

## Running number

1040 013-3, photographed (photo-1040-013.jpg).
