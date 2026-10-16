# CSD M 296.1 / CD 853 / 854 source references

**Covers** - provenance, coordinate conversion, the three variants, dimensions and reconstruction choices of `veh-csd-m296`.
**Code** - `generator/dmuM296.ts`, `generator/dmuKit.ts`, `generator/dmuComparison.ts`, `native/csd_m296/landmarks.json`.
**See also** - [comparison (M 296.1)](COMPARISON.md), [photos](PHOTOS.md), [Czech diesel railcars](../../docs/models/czech-dmus.md).

## Original evidence

All native files come from `janproch/vlakosimdb` revision `b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`; author of all three Vojtech Vohlidka:

| folder | vlakosimdb (db/train/dmu/...) | `variant` |
|---|---|---|
| `native/csd_m296/` | csd_m296 (CSD M 296, 57 t, 592 kW, 120 km/h) | m296 (default) |
| `native/csd_853/` | csd_853 (CSD 853) | cd853 |
| `native/cd_854/` | cd_854 (CD 854) | cd854 |

Each holds `vehicle.xml`, `index.xml` (unchanged) and the original BMPs (0.1 m a pixel). No 4x texture was used.

## Dimensions

M 296.1 / 853 (Vagonka Studenka, 1969-70, B' 2'): 24,790 mm over the buffers, bogie pivots 17,200 mm, wheelbase 2,400 mm, 920 mm wheels (cs.wikipedia "Motorove vozy 852 a 853"); the 854 (rebuilt from 1997): 24,790 mm, 2,883 mm wide, 4,200 mm high, 920 / 840 mm wheels (cs.wikipedia "Motorovy vuz 854").

## Coordinates and reconstruction

- z_both 250 x 50 px on 25 x 5 m, x_dec / x_inc 30 x 50 px. Source x = column / 10, y = 5 - row / 10. The M 296 XML runs 0.15 to 24.75 m over the buffers: x is scaled by 24.79 / 24.6 = 1.00772 (`K296`) about 12.45 m.
- The 853 and 854 BMPs place the body 0.6 m further left (their plain-box XML runs 0 to 23.7 m): the 853's side repeats the M 296's layout six columns to the left - the same car in nearly the same shades - and the 854's boxes are shifted six columns into the M 296's frame. All three take the M 296's XML section, plan and elevation.
- Bogies at the published 17.2 m pivots and 2.4 m wheelbase (the XML's are 17.9 m and 2.5 m); the powered bogie under the radiator end (-X), 920 mm wheels, 840 mm under the trailing bogie.
- The roof radiator (XML `roof` clip, 2.3 to 5.2 m, 3.3 to 4.2 m) is a grille on the roof's side slope where the BMP draws it, under a low hump.
- The front is the M 296's x_dec for both ends (x_inc is the same front without the gangway's dark centre).

## Running numbers

M 296.1028 (photographed in 1985, PHOTOS.md) in the pre-1988 Kryspin designation; 853 029-7 and 854 032-0 (both photographed).
