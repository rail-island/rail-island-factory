# CD Y Coach source references

**Covers** - provenance, coordinate conversion, measurements and reconstruction choices of the four CD Y-family coaches in later liveries (Bcc, Beer, Bnb, WRRm).
**Code** - `generator/cdYCoach.ts`, `generator/liveryCoach.ts`, `native/<key>/landmarks.json`.
**See also** - [photos](PHOTOS.md), [Czech and Slovak coaches](../../docs/models/czsk-coaches.md), [CD green and white coaches](../../docs/models/cd-green-white.md).

## Original evidence

All native files come from `janproch/vlakosimdb` revision `b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`, `db/train/coach/<key>/` for cd_bcc, cd_beer, cd_bnb and cd_wrrm. Each `native/<key>/` keeps `vehicle.xml` (the metadata, Windows-1250), `index.xml` (the simplemodel) and the original BMPs (`x_both`, `y_dec`, `z_dec`, `z_inc`) at 0.1 m a pixel. No 4x texture was used or copied.

Authors (vehicle.xml): Vojtech Vohlidka (Bcc, Beer, Bnb), Jan Prochazka (WRRm).

## What the XML says

- Bcc, Beer: byte-for-byte the UIC-Y body of cd_bee (24.5 m over buffers, section 3.0 m wide from 0.9 to 3.2 m, roof to 4.2 m, plan 2.8 m at the ends); only the roof ventilators (Bcc: two, 2.2..2.8 and 21.7..22.3 m) and the underframe boxes differ.
- Bnb: the same plan and length under a lower roof, the 4.0 m section of the BDmeer; elevation 3.8 m at the ends.
- WRRm: 26.4 m, the BDmeer's 4.0 m section and Y-type plan (identical to zsr_wrrm); eight roof ventilators and four larger kitchen roof boxes (`roof2`), steps (`door2`) at both ends, one entrance.
- Bogies modelled at the published centres (Y 17.1 m, 26.4 m bodies 19.0 m), 2.5 m wheelbase, 0.9 m wheels.

## What the BMPs say

Side canvases 250 (WRRm 270) by 50 pixels, end canvases 30 by 50.

- cd_bnb's colorizes are swapped: its `z_inc.bmp` paints the +z (right) side, `z_dec.bmp` the left; the landmarks name the BMP each side uses.
- Bcc: white (240, 247, 240) roof and lower body, blue (0, 51, 153) window band 1.9..3.2 m, blue ends and end doors; the left side's toilet windows frosted.
- Beer: light grey roof, white window band 1.8..3.2 m, dark blue (0, 33, 66) 1.1..1.8 m, red (255, 53, 53) foot line 0.9..1.1 m; dark blue door surrounds, a red strip at each end and a red wedge by each door step; red ends; door leaves dark blue over red.
- Bnb: grey roof, cream (239, 239, 191) window band 1.9..3.2 m, red (176, 15, 15) below with a darker line at 1.1..1.2 m; one toilet window and eleven bays at 1.8 m; door leaves in the bands; red class numerals "2".
- WRRm: white body and roof, red window band 1.9..3.2 m broken by a white diagonal at 18 m that carries on below the band as a red stripe over a service door; five barred kitchen windows, five dining windows; one red entrance door at the front end.
- Windows are measured as connected components of the non-paint pixels in the window rows; door, door-window, class-mark, emblem and end boxes were read from the native pixels.

## Choices and deviations

- Painted shapes are one-sided decals on the skin; the Beer's dark blue and red roof ends and its small end lettering are not modelled (the roof stays grey).
- The WRRm's service door is drawn as seams only, under the diagonal paint.
- Buffers at the standard 1.75 m spacing, round tail lamps at 1.5 m as on the green and white coaches.

## Running numbers

Illustrative UIC numbers in the format of each type (check digits verified by the tests; `CD_Y_NUMBERS`): Bcc 51 54 50-41 041-7, Beer 61 54 20-70 233-9, Bnb 50 54 20-29 064-3, WRRm 61 54 88-70 008-4. No legible photograph of these coaches in these liveries was found.

## Photo check

The Beer and Bc photographs confirm the paint schemes (Beer: white band over dark blue with a red foot and dark blue and red ends; Bc: blue window band between white). The red and white dining car confirms the WRRm's white roof and red window band. See [PHOTOS.md](PHOTOS.md).
