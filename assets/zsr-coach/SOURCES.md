# ZSR Coach source references

**Covers** - provenance, coordinate conversion, measurements and reconstruction choices of the eight ZSR coaches (A, AB, B, Bh, BDs, BDmeer, WRRm, Apee).
**Code** - `generator/zsrCoach.ts`, `generator/liveryCoach.ts`, `native/<key>/landmarks.json`.
**See also** - [photos](PHOTOS.md), [Czech and Slovak coaches](../../docs/models/czsk-coaches.md).

## Original evidence

All native files come from `janproch/vlakosimdb` revision `b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`, `db/train/coach/zsr_<variant>/`. Each `native/zsr_<variant>/` keeps `vehicle.xml`, `index.xml` and the original BMPs at 0.1 m a pixel; no 4x texture was used. zsr_wlab is archived in the game and not converted.

Authors (vehicle.xml): Vojtech Vohlidka (A, AB, B, BDs, BDmeer, WRRm, Apee), Jan Prochazka (Bh).

## What the XML says

- A, AB, B, Bh: one identical file, the UIC-Y body of the CD green and white coaches (24.5 m, 4.2 m roof) with two roof ventilators (2.2..2.8, 21.6..22.2 m) and a roof hatch; underframe boxes 6.0..10.3, 11.4..13.1, 13.6..18.5 m.
- BDs: the CD BDs body, with the guard's lookout bay (alongy 3.2..4.4 m, 1.6 m from the centreline).
- BDmeer: the CD BDmeer's 26.4 m body; WRRm: identical to cd_wrrm (26.4 m).
- Apee: a coarse file: the same Y plan and 4.2 m section, the body drawn down to the rail (the BMPs paint the bogies on it) and a copy of the BDs's lookout bay with nothing painted on it. The model gives it the Y body on bogies and leaves the bay out.

## What the BMPs say

Side canvases 250 (BDmeer, WRRm 270) by 50 pixels; end canvases 30 by 50 (Apee: `x_dec` and `x_inc`, identical).

- Red (191, 15, 15; BDmeer 192, 0, 0) from 0.9 to 3.2 m, grey (192) roof; two white lines at 1.6..1.7 and 1.4..1.5 m with a pale pink line between, broken around the ZSR mark; a darker red line at 1.1..1.2 m; orange (255, 87, 31) door leaves; red ends. Bh is the same in green (0, 160, 64).
- A: the yellow first class line at 3.1..3.2 m over columns 15..230; AB over 133..230 (the first class half). Yellow class numerals on white plates beside the toilets ("1" / "2").
- Toilet windows: frosted on both sides of A, AB and Bh, on the right of B; clear on BDs.
- Apee: white body with the yellow line, blue (0, 0, 255) 1.2..1.8 m, cyan (0, 204, 255) 0.9..1.2 m, twelve large windows (the outer two frosted), white folding doors at the very ends, ends painted in the side bands, the ZSR mark in white on the blue band.
- Windows are measured as connected components of the non-paint pixels in the window rows; the rest was read from the native pixels.

## Choices and deviations

- The ZSR mark (a stylised rhombus on the BMPs, 8 to 12 px) is drawn as a white rhombus ring with a bar, simplified.
- The yellow dashes over the WRRm's windows and the small inscriptions are not modelled; the WRRm's service door is seams only.
- Buffers at 1.75 m, round tail lamps at 1.5 m (Apee 1.65 m).

## Running numbers

UIC numbers with country code 56 (`ZSR_NUMBERS`, check digits verified by the tests): A 51 56 19-41 015-9, AB 50 56 39-41 001-6 (a real AB photographed in a later livery), B 51 56 20-41 816-7 (a real B of the Commons category ZSSK B 20-41), Bh 51 56 20-41 902-5, BDs 51 56 82-40 110-1, BDmeer 50 56 82-44 012-6, WRRm 61 56 88-70 004-1, Apee 61 56 19-70 101-9; the others illustrative. The railway's lettering is not drawn (the stroke font has no Z).

## Photo check

The ZSSK photographs (later liveries) confirm the B's ten compartment windows and two toilets, the AB's first class half and the BDs's lookout bay and double luggage door. See [PHOTOS.md](PHOTOS.md).
