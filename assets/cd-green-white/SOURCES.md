# CD Green-White Coach source references

**Covers** - provenance, coordinate conversion, per-variant measurements and reconstruction choices of the nine CD green and white coaches.
**Code** - `generator/cdGreenWhiteCoach.ts`, `generator/csdCoachParts.ts`, `native/cd_<variant>/landmarks.json`.
**See also** - [photos](PHOTOS.md), [CD green and white coaches](../../docs/models/cd-green-white.md), [CSD coaches](../../docs/models/csd-coaches.md).

## Original evidence

All native files come from `janproch/vlakosimdb` revision `b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`, directories `db/train/coach/cd_<variant>/` for a, ab, b, bee, beel, bds, ds, bdmeer and bdmtee. Each `native/cd_<variant>/` keeps:

- `vehicle.xml`: the unchanged metadata (Windows-1250; authors Tomas Skvrna and Vojtech Vohlidka, original spelling kept in the files).
- `index.xml`: the unchanged simplemodel with its `alongx`/`alongy`/`alongz` clip polygons.
- `x_both.bmp`, `y_dec.bmp`, `z_dec.bmp`, `z_inc.bmp`: the unchanged original BMPs at 0.1 m a pixel. No 4x texture was used or copied.

## What the XML says

- a, ab, b, bee, beel, bds, ds: the UIC-Y body of the CSD A and B (24.5 m over buffers, section 3.0 m wide from 0.9 to 3.2 m, roof to 4.2 m; plan 2.8 m at the ends, 3.0 m from 1.6 to 22.9 m). Bogies at 3.7 and 20.8 m, wheelbase 2.5 m. The underframe boxes and roof ventilators differ per variant and are copied from each XML.
- Beel: lower entrances (XML `door2` down to 0.3 m) and two roof units over the x = 0 end (`roof` 0.7..1.3 and 1.6..2.2 m, `gear` 4.1..4.2 m), modelled as taller roof boxes.
- BDs and Ds: a guard's lookout bay, `alongy` 3.2..4.4 m reaching 1.6 m from the centreline between 2.1 and 3.1 m (`alongx`).
- BDmeer: 26.4 m, the Bdmtee's 4.0 m section on a Y-type plan (2.8 m at the ends, 3.0 m from 1.6 to 24.8 m); bogies at 3.7 and 22.7 m.
- Bdmtee: byte-identical to the CSD Bdmtee's XML (26.4 m, bogies 3.7 and 22.7 m).

## What the BMPs say

Side canvases are 250 (Y) or 270 (BDmeer, Bdmtee) by 50 pixels. `z_dec` paints the right (+Z) side, `z_inc` the left; both keep increasing source x, so the left elevation is mirrored relative to an outside observer.

- Paint: roof light (240, 247, 240; Bee 207 grey; Beel 192, 192, 176) from the top to 3.2 m, green (0, 120, 0) from 1.9 to 3.2 m, white below to 0.9 m. A has the 1st class yellow line at 3.1..3.2 m over columns 15..230, AB over 133..230 (the 1st class half) with yellow class numerals beside the toilets. Ends green; the Beel's ends keep the roof, green and white bands. Bee and Beel have red end doors.
- Windows, door windows and the white class-numeral marks are connected components of the window-frame pixels; door outlines are read from the dark seam columns and the leaf colour (the passenger doors' leaves are green also in the white band; the luggage doors of BDs, Ds and BDmeer, and the Ds's end door, are painted in the bands).
- The Ds's `z_inc` is drawn about two pixels toward x = 0 against `z_dec`; the model keeps each side as measured, except the lookout bay, which stays at the XML position (its left-side boxes carry a 2.5-pixel tolerance).
- The CD emblem sits on the white band near one end of each side (`[44, 33, 50, 37]` on most right sides); the running number is the small text in the middle of the white band.

## Choices and deviations

- The lookout bay reaches 1.525 m from the centreline instead of the XML's 1.6 m, so it and its glass stay inside the repository's 3.1 m width envelope (as the CSD Dsk's duckets).
- Buffers at the standard 1.75 m spacing, round 0.18 m tail lamps where the BMPs paint 2-pixel patches (y 1.5 m; Beel 1.75 m; Bdmtee 2.7 m), as on the CSD coaches.
- Beel and BDmeer get a second, lower step under their low entrances; Bdmtee keeps the CSD Bdmtee's green aprons and step boards under its centre doors.
- The white 3 by 5 pixel marks beside the toilets (and Bdmtee's doors) are the class numerals: a white "1" on the A, "2" on the others, drawn in the stroke numerals of the CSD coaches. The A's "1" is narrower than its mark, so its landmark rows carry a 1.5-pixel tolerance. The smaller inscriptions are not modelled.

## Running numbers

CD emblem plus a UIC number (check digit verified by the tests) on both sides (`GREEN_WHITE_NUMBERS`):

| Variant | Number | Source |
|---|---|---|
| a | 51 54 19-41 123-3 | illustrative (A149 series) |
| ab | 51 54 39-41 045-4 | illustrative (AB349 series) |
| b | 51 54 20-41 456-4 | illustrative (B249 series) |
| bee | 51 54 20-41 789-8 | illustrative |
| beel | 61 54 20-70 015-0 | illustrative |
| bds | 51 54 82-41 120-1 | illustrative (BDs449 series) |
| ds | 51 54 92-41 030-0 | illustrative |
| bdmeer | 50 54 82-44 017-7 | illustrative |
| bdmtee | 50 54 22-44 268-9 | legible on photo-bdmtee-50-54-22-44-268-9-side-brno-2009.jpg, a coach in this livery |

No legible photograph was available for the others (the network policy blocked new downloads); the numbers follow the UIC format of each type and are marked illustrative.

## Photo check

The Bdmtee photographs confirm the green window band between the light upper body and the white lower band, green door leaves reaching below the white band, the two double doors set in about a quarter of the length from each end and the light roof. The bogie photograph is a Goerlitz Va under a CD BDs. See [PHOTOS.md](PHOTOS.md).

## Measurement record

`native/cd_<variant>/landmarks.json` holds 46 to 58 native pixel-edge boxes per variant (455 in all) with model scopes, tolerances and uncertainty, built by component detection on the native BMPs; `baseline.json` is the first authored geometry's measurement. `COMPARISON-<variant>.md` lists the normalized errors and the signed residual of every box with the model revision.

## The blue and white Bee (cd_bee001)

`native/cd_bee001/` keeps vlakosimdb's `db/train/coach/cd_bee001` (CD Bee 001, author Vojtech Vohlidka), same revision. Its XML is identical to cd_bee's, and its BMPs are cd_bee's pixel for pixel with the green (0, 120, 0) and its shades replaced by blue (64, 64, 255); the red end doors stay. It is therefore the variant `beeBlue`: the Bee's measured layout with the `green` material in blue (#3c44e6), and the same landmarks as cd_bee. Running number 51 54 20-41 790-6, illustrative.

## CD blue livery

`livery=cdBlue` (CD's current blue, the Najbrt scheme) is read from these Wikimedia Commons photographs, downscaled to 1600 px wide and saved as JPEG (quality 85); author and licence from each file page:

| file | Commons page | author | licence | use |
|---|---|---|---|---|
| `photo-a-51-54-19-41-068-0-cd-blue.jpg` | https://commons.wikimedia.org/wiki/File:V%C5%AFz_A%2C_Praha-hlavn%C3%AD_n%C3%A1dra%C5%BE%C3%AD.jpg (2009-12-04) | Honza Groh (Jagro) | CC BY-SA 3.0 | the A in the blue: the running number (also in the file description), white below the navy line, the light blue window band, the yellow line under the grey roof, navy doors |
| `photo-ab-cd-blue-praha-vysocany.jpg` | https://commons.wikimedia.org/wiki/File:Praha-Vyso%C4%8Dany%2C_rychl%C3%ADk_do_Prahy_%2801%29.jpg (2014-06-17) | SJu (ŠJů) | CC BY 4.0 | an AB in the blue at the end of a train: the line under the navy roof yellow over the first class half and white over the second, the navy end wall, navy doors (the number is not legible) |
| `photo-b-51-54-20-41-866-4-cd-blue.jpg` | https://commons.wikimedia.org/wiki/File:Praha_hl._n.%2C_v%C5%AFz_B.jpg (2014-08-27) | PatrikPaprika | CC BY-SA 4.0 | the B side on, measured for the bands (white to 1.72 m, the navy line to 1.86 m, light blue to the eave, the white line to 3.32 m), the weathered navy roof, the navy door, the small emblem near one end, the number (a soft print, read as 51 54 20-41 866-4, which its check digit fits) |
| `photo-bee-243-cd-blue-praha-holesovice-2022.jpg` | https://commons.wikimedia.org/wiki/File:V%C5%AFz_Bee243_%C4%8CD.jpg (2022-02-03) | Martin Vrut | CC BY 3.0 | a Bee 243 in the blue (the description names the type): the bands as on the B, the white line under a light grey roof, the navy door (no number in view) |
| `photo-bds-50-54-82-40-340-7-cd-blue.jpg` | https://commons.wikimedia.org/wiki/File:Praha_hl._n.%2C_v%C5%AFz_BDs_%2801%29.jpg (2014-08-27) | PatrikPaprika | CC BY-SA 4.0 | a BDs 450 in the blue: light blue below the navy line too, the white emblem and "Ceske drahy" wordmark and the white number, the luggage doors in the bands, the navy passenger door, the grey roof |
| `photo-bdmtee-cd-blue-nove-mesto-2018.jpg` | https://commons.wikimedia.org/wiki/File:Nov%C3%A9_M%C4%9Bsto_na_Morav%C4%9B%2C_n%C3%A1dra%C5%BE%C3%AD%2C_2018_%284%29.jpg (2018-10-06) | Marie Ccheidzeova | CC BY-SA 4.0 | a Bdmtee in the blue: white below the navy line, light blue window band, white line, navy roof, the navy double doors; the number partly hidden (50 54 20-82 2..-0) |
| `photo-bdmtee-cd-blue-praha-liben.jpg` | https://commons.wikimedia.org/wiki/File:Praha-Libe%C5%88%2C_sp%C4%9B%C5%A1n%C3%BD_vlak_%C4%8CD_%2801%29.jpg (2016-12-21) | SJu (ŠJů) | CC BY 4.0 | a Bdmtee in the blue beside a green and white coach: the same bands, the navy double doors and roof |

Simplified: the pictogram panels, the class signs' plates and pictograms, "Narodni dopravce", the small inscriptions and the UIC prefixes are left out. The AB, Bee and Bdmtee numbers are illustrative (UIC check digits valid), the A, B and BDs numbers as photographed.
