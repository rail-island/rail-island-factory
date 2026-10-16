# DB Regio double-deck coach source references

**Covers** - provenance, coordinate conversion, measurements, dimensions and reconstruction choices of the parametric `veh-db-dosto` (three vlakosimdb coaches).
**Code** - `generator/dbDoubleDeck.ts`, `generator/germanCoachParts.ts`, `generator/germanCoaches.ts`, `native/<key>/landmarks.json`.
**See also** - [photos](PHOTOS.md), [German coaches](../../docs/models/german-coaches.md), [CSD coaches](../../docs/models/csd-coaches.md) (the shared builder and the comparison method), [Bmo double-deck coach](../../docs/models/bmo-double-deck.md).

## Original evidence

All native files come from `janproch/vlakosimdb` revision `b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`, directories `db/train/coach/<key>/`, all by Karola Meyer:

| key | vlakosimdb title | design parameters |
|---|---|---|
| `db_ds_re1` | DB DS Re 1Kl | `variant=firstClass` |
| `db_ds_re2` | DB DS Re 2Kl | `variant=secondClass` (the default) |
| `db_ds_re2_s` | DB DS Re 2Kl S | `variant=drivingTrailer` |

Each `native/<key>/` keeps the unchanged `vehicle.xml` (Windows-1250), the simplemodel `index.xml` and the original BMPs (`x_both`, `x_both1`, `y_dec`, `z_both`, 0.1 m a pixel), with `landmarks.json` and `baseline.json`. No 4x texture was used or copied.

## What the XML says

- One section for all three: 3.0 m wide up to 3.4 m, then the upper deck's sloped walls to (1.0, 4.3) and the roof to 4.8 m, which the elevation cuts at 4.6 m (the model cuts the section there). The XML's left roof point is (-1.0, 4.2), the right (1.0, 4.3); the model keeps the section symmetric at 4.3 m.
- re1 and re2: the body from 0.2 to 26.6 m on a plain 3.0 m plan; the elevation's chamfered bottom corners are the underframe. The model adds buffers to 0 and 26.8 m.
- re2_s: the body from 0 to 26.8 m with the cab at the far end: the elevation rises from (26.8, 1.1) to (26.7, 2.0), slopes the windscreen back to (26.2, 3.3) and the roof to (24.8, 4.6).
- Colorizes: `z_both` paints both sides with u along source x; `x_both` both ends of re2; re1 both ends with `x_both1`; re2_s its x = 0 end with `x_both1` (a gangway end) and its cab with `x_both`.

The model is source `(x - 13.4, y, z)` for re1 and re2. The re2_s side texture is the re2 layout drawn two pixels toward x = 0 (its body starts at 0 instead of 0.2 m), so the builder works in re2 columns, adds 0.2 m to re2_s source x and centres the coach at 13.6 m in those coordinates: the comparison's re2_s centre is 13.4 m in its own.

## What the BMPs say

- Paint: grey roof above 4.1 m, red down to 3.1 m, a white line 3.0..3.1 m (yellow over the double-deck section on re1, columns 52..215, and re2_s, its columns 72..191: the 1st class upper deck), red to 0.9 m, and under the dropped centre a white 0.7..0.9 m and grey 0.5..0.7 m stripe; the single-level ends carry the white stripe at 0.9..1.1 m.
- The lower deck drops from 0.9 m to 0.5 m between columns 51..55 and 213..217 (re2), as on the Bmo.
- Windows (connected components of the dark frame pixels): ten upper-deck windows (rows 10..18, 3.1..4.0 m, on the sloped wall; the outer two narrower), six lower-deck windows (rows 31..39) and three end-section windows (rows 20..28) on re1 and re2, two on re2_s whose x = 0 end carries a grille panel instead.
- Doors at columns 56..72 and 195..211 (rows 23..44, down to the dropped floor), two windows each.
- The class numerals: "2" beside the doors on the lower deck (rows 32..38), "1" on the upper deck of re1 and re2_s (rows 11..17). The destination display (columns 119..131 on re1/re2, 134..146 on re2_s; rows 23..26), the DB logo (re1 columns 79..86, re2_s 181..188), red-outlined hatches (re1/re2 columns 245..261, re1's service hatch 12..19) and re2_s's grille panel (columns 4..20, two louvre groups per side).
- Ends: a gangway door with two windows in the black gangway field, red lamps at columns 2..4 and 24..26 (1.65 m), buffers. The cab (`x_both` of re2_s): the windscreen frame columns 6..24 rows 20..33 with the glass 1.8..2.6 m and the destination display above it, head lamps at columns 7..8 and 22..23 (1.45 m).
- Bogies painted at about 3.3 and 23.5 m.

## Dimensions

From de.wikipedia.org "Doppelstockwagen" and "Bombardier-Doppelstockwagen": the Goerlitz double-deck coaches are 26.8 m long, 4.60 m high and 2,780 mm wide; the driving trailers of classes 761 and 762 (from 1994) have the angular head. The model: 26.8 m over buffers (the driving trailer 27.2 m: its 26.8 m XML body plus buffers), 4.6 m high, 3.0 m wide (the XML section; 0.22 m wider than published, as the Bmo), bogies 20.0 m apart (the BMP paints 20.2 m) with 2.5 m wheelbase and 920 mm wheels (the Goerlitz VIII bogie's nominal size; not stated by the sources above).

## Choices and deviations

- The cab's nose follows the XML elevation; the band edges get extra stations on the slope (`noseTop`) and the clipped bands no end caps, so no paint band stands proud of the sloped face.
- The lamps are round (head 0.2 m, tail 0.12 m) where the BMPs paint 1 by 2 pixel patches; buffers at the standard 1.75 m spacing.
- The upper "1" follows the sloped wall vertex by vertex (`skinNumeral`).
- Underframe boxes under the dropped centre and the roof seams over the single-level ends (the `y_dec` lines at columns 16, 42, 221, 247) are generic.
- Running numbers (`DOSTO_NUMBERS`) are illustrative UIC numbers with valid check digits: `50 80 26-81 052-5`, `50 80 25-81 318-1`, `50 80 86-81 104-1`; no number is legible in the photographs.

## Photo check

The photographs (PHOTOS.md) confirm the dropped lower deck between the bogies, the upper deck's sloped window band, the light grey double doors, the white line under the upper deck windows, the angular driving-trailer head with its single large windscreen and destination display, and the Goerlitz VIII bogie.
