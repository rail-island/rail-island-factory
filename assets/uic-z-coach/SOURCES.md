# UIC-Z Coach source references

**Covers** - provenance, coordinate conversion, measurements and reconstruction choices of the UIC-Z coaches: CD (Ampz, Bmz, WRRmz), DB IC (Ampz, Bmpz, WRmz) and OBB (Ampz, Bmpz, WRmz).
**Code** - `generator/uicZCoach.ts`, `generator/liveryCoach.ts`, `native/<key>/landmarks.json`.
**See also** - [photos](PHOTOS.md), [Czech and Slovak coaches](../../docs/models/czsk-coaches.md).

## Original evidence

All native files come from `janproch/vlakosimdb` revision `b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`, `db/train/coach/cd_ampz`, `cd_bmz`, `cd_wrrmz` (author Tomas Skvrna). Each `native/<key>/` keeps `vehicle.xml`, `index.xml` and the original BMPs; no 4x texture was used.

## What the XML says

- Ampz and Bmz: one identical file. 26.4 m over buffers; section 3.0 m wide from 0.9 to 3.2 m, a flatter roof to 4.0 m (0.6 m flat top); plan 2.8 m at the ends, 3.0 m from 1.5 to 24.9 m; the ends rounded in elevation at the roof (3.6 to 4.0 m) and at the floor (1.2 to 0.9 m); a sloped skirt between the bogies (`door` 0.4..0.9 m from 5.1 to 21.3 m); plug-door step wells at both ends.
- WRRmz: the same body 26.9 m long (the textures are drawn for it); the model keeps the XML length although CD's WRmz are 26.4 m.
- Bogies: the XML wheels give centres about 19.3 m apart; the model uses the published 19.0 m (19.5 m under the 26.9 m car), 2.5 m wheelbase, 0.9 m wheels.
- The DB IC (db_ic_ampz, bmpz, wrmz) and OBB (obb_ampz, bmpz, wrmz) files draw the same envelope (26.4 m, 4.0 m roof) more coarsely, so they can use this body.

## What the BMPs say

Side canvases 270 by 40 pixels (27 x 4 m), end canvases 30 by 40.

- Grey (149, 146, 149) roof to 3.2 m, red (255, 0, 0) window band 1.9..3.2 m, light grey (224) lower body 0.9..1.9 m, a dark skirt; Ampz has the yellow first class line at 3.1..3.2 m; grey grilles at both ends of the light band; red plug doors from 3.2 down to 0.5 m; red class numerals on white plates beside the toilets.
- Ampz: two frosted toilets, eleven compartment windows (1.5 m frames); Bmz: two toilets (frosted on the right), eleven 1.4 m windows; WRRmz: one door at the x = 0 end, five 1.6 m windows, the kitchen windows, a white diagonal across the red band at 21 m carrying on below as a red stripe.
- Ends: grey, the gangway (7..23 px), the red end door with two windows, tail lamps at 2.2 m.

## Choices and deviations

- The parameter is the kind of coach (`firstClass`, `secondClass`, `restaurant`) rather than the class code, so each operator's coach of that kind (CD Bmz, DB Bmpz) is the same value; the `operator` parameter (default `cd`, then `db`, `obb`) picks the livery and layout.
- Plug doors are leaves on the skin reaching 0.5 m with two steps in the skirt recess behind them.

## Running numbers

`UIC_Z_NUMBERS`: Ampz 73 54 10-91 008-8 (a real Ampz, Commons file title, EC 176, Praha 2005), Bmz 73 54 21-91 026-7 (Bmz245 21-91 026 of a Commons file title, check digit computed), WRRmz 73 54 88-91 003-6 (illustrative).

## Photo check

The Ampz photograph shows this very livery: red window band with the yellow line, light grey lower body, red plug door, grey end with the red end door. See [PHOTOS.md](PHOTOS.md).

## DB IC and OBB coaches

Native files: `db/train/coach/db_ic_ampz`, `db_ic_bmpz`, `db_ic_wrmz`, `obb_ampz`, `obb_bmpz`, `obb_wrmz` at the same vlakosimdb revision, author Karola Meyer; each `native/<key>/` keeps `vehicle.xml`, `index.xml` and the original BMPs (`x_dec`/`x_inc` ends, identical, `y_dec` roof, `z_dec` right, `z_inc` left).

- XML: one coarse file for all six: section 3.0 m wide reaching down to the rail (no separate skirt or bogies, which the textures draw), the same plan and roof as the CD file (26.4 m over buffers, 4.0 m roof); the DB WRmz 26.9 m long, the OBB WRmz 26.4 m. The model builds them on the CD body (`body(length)`, skirt, 19.0 m / 19.5 m bogie centres), so only the paint and the openings differ; the DB WRmz keeps the XML's 26.9 m like the CD WRRmz.
- Side canvases 270 by 40 px (27 x 4 m), end canvases 30 by 40 px with the same gangway, red end door and lamps as the CD end BMP (`Z_END`).
- DB IC: white (255) body, roof grey to 3.3 m, red (255, 0, 0) stripe 1.3..1.6 m (rows 24..26), white doors with a narrow window and the stripe across them, a grey door foot; class numerals on plates beside the toilets; the DB mark (white patch in the stripe, 0.6 x 0.3 m); Ampz: a white gap in the stripe near the middle, toilet windows drawn clear (frosted in the model, after the Avmz photograph); WRmz: one passenger door per side at opposite ends, the service door outline (seams only) at the other end, a white "Bordrestaurant" gap in the stripe, two kitchen boxes on the roof (`y_dec`).
- OBB: roof to 3.4 m, a red line 3.1..3.4 m, the dark grey (64) window band 1.9..3.1 m, red (255, 0, 0) below to 0.9 m; doors in the same bands; white "1"/"2" numerals (2 to 3 px patches), blue pictograms; Ampz: the yellow first class line at 3.1..3.2 m; WRmz: one door at the front end only, three lower kitchen windows at the rear; the OBB mark is a simplified white patch of three slanted bars.
- Windows, doors, signs, emblems and painted areas: connected runs of non-paint pixels in the window rows (`landmarks.json` of each key).

Running numbers (`UIC_Z_NUMBERS.db`, `.obb`): OBB Bmpz 73 81 21-91 111-4 and OBB WRmz 61 81 88-90 203-4 from Commons file titles; the DB numbers and the OBB Ampz are illustrative numbers of their series with computed check digits.

Photos: [PHOTOS.md](PHOTOS.md); the DB ones show the BMPs' livery, the OBB ones later liveries of the same bodies.
