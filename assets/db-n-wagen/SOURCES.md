# DB n-Wagen source references

**Covers** - provenance, coordinate conversion, measurements, dimensions and reconstruction choices of the parametric `veh-db-n-wagen` (six vlakosimdb coaches).
**Code** - `generator/dbNWagen.ts`, `generator/germanCoachParts.ts`, `generator/germanCoaches.ts`, `native/<key>/landmarks.json`.
**See also** - [photos](PHOTOS.md), [German coaches](../../docs/models/german-coaches.md), [CSD coaches](../../docs/models/csd-coaches.md) (the shared builder and the comparison method).

## Original evidence

All native files come from `janproch/vlakosimdb` revision `b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`, directories `db/train/coach/<key>/`:

| key | vlakosimdb title | design parameters |
|---|---|---|
| `db_bnvr` | DB Bn vr | `variant=bn`, `livery=vr` (the defaults) |
| `db_bnvriv` | DB Bn IV | `variant=bn`, `livery=iv` |
| `db_abnvr` | DB Abn vr | `variant=abn`, `livery=vr` |
| `db_abnvriv` | DB Abn IV | `variant=abn`, `livery=iv` |
| `db_bdnrf` | DB Bdnrf vr | `variant=bdnrf`, `livery=vr` |
| `db_bdnrfiv` | DB Bdnrf IV | `variant=bdnrf`, `livery=iv` |

All six are by Karola Meyer (`vehicle.xml`, Windows-1250). Each `native/<key>/` keeps the unchanged `vehicle.xml`, the simplemodel `index.xml` and the original BMPs (`x_dec`, `x_inc`, `y_dec`, `z_dec`, `z_inc`, 0.1 m a pixel). No 4x texture was used or copied. `landmarks.json` and `baseline.json` exist for the three vr folders; the iv textures paint the same boxes in other colours and are kept as evidence for the livery.

## What the XML says

- Bn and ABn (`index.xml` byte-identical): the section 3.0 m wide from 1.0 to 3.1 m, narrowing to 2.6 m at the rail, the roof to 3.9 m; the plan 2.8 m wide (1.4 m from the centreline) from 0.3 to 26.1 m with 0.1 m chamfers to 0.2 and 26.2 m, the gangway blocks out to 0 and 26.4 m. The model scales the section to the plan's width, so the body is 2.8 m wide (published 2.825 m).
- Bdnrf: the same body with the Karlsruher Kopf at x = 0: the plan narrows from 1.4 m at x = 0.7 m to 1.2 m at 0.4 m and 1.05 m at the 0.3 m tip; the elevation slopes the windscreen from (0.3, 2.1) to (0.7, 3.3) and rounds the roof to 3.9 m at x = 1.4 m. Only the far end has a gangway.
- The colorize directions: the first (`dirs` 1;0;...) paints the x = 0 end, the second the 26.2 m end; on Bn and ABn `x_inc` is the x = 0 end, on Bdnrf `x_dec` (the cab). `z_dec` paints the +z side, `z_inc` the -z side, both with u along increasing source x.

The Factory model is source `(x - 13.2, y, z)`: the x = 0 end is the rear (-X), so the Bdnrf's cab is at -X, as in the source.

## What the BMPs say

Side canvases 270 by 50 pixels (27 by 5 m), ends 30 by 50 pixels.

- vr: roof grey from the top to 3.4 m, red to 3.1 m, a light grey line 3.0..3.1 m, red over the window band down to 1.3 m, a light grey band 1.1..1.3 m and a grey skirt 0.9..1.1 m. iv: light grey roof, a white line 3.1..3.3 m, the mint turquoise window band 1.9..3.1 m, the pastel turquoise line 1.6..1.9 m and light grey below.
- Windows are connected components of the frame pixels (`#c0c0c0` and the `#808080` corners), rows 20..29 (2.1..3.0 m). Bn: 14 (two small frosted toilet windows at the ends); ABn: the four end-section windows each side and five wider-pitched 1st class windows between the doors; Bdnrf: a small window behind the cab door, one before the single door, five, and the four end-section windows.
- Doors: the double doors at columns 64..83 and 181..200 (rows 19..38) with two narrow windows each, read from their edge and seam columns; the Bdnrf's cab door (columns 7..13), the luggage room's four-leaf folding door (40..63, seams at 46, 52 and 57, a window in each leaf) and a single door (89..97).
- Class signs: pink plates with a red "2" (vr Bn), mint plates with a teal numeral (iv), or a white numeral painted on the red pier (vr ABn and Bdnrf, rows 22..28). ABn: "2", "1", "1", "2". The 1st class yellow line at rows 17..18 (3.1..3.3 m), columns 85..178.
- The DB logo: an 8 by 4 pixel white outline on the red (vr Bn), a 4 by 2 pixel red mark on the white band (vr ABn and Bdnrf, iv), placed differently on the two sides.
- Ends: the gangway's black field (columns 7..22), the end door (9..20, rows 20..33) with two windows, red tail lamps at columns 4..5 and 24..25 (2.5 m), buffers. The Bdnrf's cab end is a photographic texture: two windscreens (rows 21..28) and lamp clusters at the lower corners (rows 33..36).
- Roof (`y_dec`): seven 0.6 m square vents on the crown at 0.8, 3.9, 9.7, 12.9, 16.1, 21.9 and 25.0 m.
- Bogies painted at about 3.6 and 22.8 m with 2.5 m wheelbase.

## Dimensions

From de.wikipedia.org "n-Wagen" (infobox): length over buffers 26,400 mm, width 2,825 mm, height 4,050 mm, bogie pivots 19,000 mm apart, bogie wheelbase 2,500 mm, wheel diameter 950 mm. The model: 26.4 m over buffers, bogies at 3.7 and 22.7 m (19.0 m apart), 2.5 m wheelbase, 950 mm wheels, 2.8 m wide, 3.9 m high (the XML section; 0.15 m below the published height).

## Choices and deviations

- The window and door boxes follow the BMPs to whole pixels; the end door's windows start 1 cm below the door's top so their frames do not share its edge plane.
- The Karlsruher Kopf: the windscreens lie on the XML's sloped face and keep 4.5 cm inside its width (the photographic end texture projects them onto the nose's rounded corners); the lamps stay on the 2.1 m wide flat tip (head lamps at 0.88 m from the centreline, red tail lamps at 0.6 m) where the texture paints the clusters 1.2 m out. A light front panel (vr light grey, iv white) covers the windscreen band, a black destination display sits above it and a headlamp on the roof's front, as the photographs show.
- Buffers at the standard 1.75 m spacing; round tail lamps.
- The doors' step boards and the underframe boxes are generic (the BMPs paint them as dark noise).
- Running numbers (`N_WAGEN_NUMBERS`, the same in both liveries, as a repainted coach keeps its number): Bn `50 80 22-34 366-1` (a Bnrz 451.0 in a Commons file title), ABn `50 80 31-34 359-5` (an ABnrz in a Commons file title), Bdnrf `50 80 82-34 192-8` (the BDnrzf 740 of the Commons file "BA 740 50 80 82 34 192-8 1998-05-30 Luebeck Hbf.jpg"). The check digits are valid; the numbers were read from file titles, not from the photographs kept here.

## Photo check

The photographs (PHOTOS.md) confirm the Karlsruher Kopf's sloped windscreen pair, its light grey front above the red in the vr livery, the lamp clusters at the lower corners and the roof headlamp, the double doors' light grey leaves in vr, and the iv livery's light grey body with the mint window band.
