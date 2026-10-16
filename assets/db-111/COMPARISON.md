# DB 111 024: native landmark comparison

**Covers** - the default build of `veh-db-111` against 15 boxes annotated on the native vlakosimdb BMPs (`native/landmarks.json`).
**Code** - `generator/mainlineComparison.ts`, `generator/mainlineReport.ts`, `test/mainlineElectrics.test.ts`
**See also** - [SOURCES.md](SOURCES.md), [docs/models/mainline-electrics.md](../../docs/models/mainline-electrics.md)

Model revision: `9cec458` (measured when this file was written). Mapping: side column px = 83.65 - 10 x, row = 10 (6 - y); front column = 10 (1.5 - z). Canvases: x_front 30 x 60 px (`native/db_111/x_both.bmp`), z_right 170 x 60 px (`native/db_111/z_dec.bmp`).

Each vector is (left, top, width, height) in native pixels; percentages are 100*x/W, 100*y/H, 100*w/W, 100*h/H of the view's canvas, origin top left. Delta = model minus source in percentage points. MAE = sum(|delta|) / (4 * boxes). Model boxes are the bounds of the actual GLB vertices of the named scopes, occluded vertices included.

| View | Boxes | MAE baseline (pp) | MAE now (pp) |
|---|---:|---:|---:|
| x_front | 6 | 0.99 | 0.99 |
| z_right | 9 | 0.16 | 0.16 |
| all | 15 | 0.49 | 0.49 |

| ID | View | Element | Source px | Model px | Source % | Model % | Delta pp | Tolerance px | Note |
|---|---|---|---|---|---|---|---|---:|---|
| F01 | x_front | front-cab/windscreen-right/frame | 2.00, 26.00, 12.00, 7.00 | 2.00, 25.50, 12.00, 7.00 | 6.67, 43.33, 40.00, 11.67 | 6.67, 42.50, 40.00, 11.67 | 0.00, -0.83, -0.00, 0.00 | 1.5 | Left windscreen seen from ahead. |
| F02 | x_front | front-cab/windscreen-left/frame | 16.00, 26.00, 12.00, 7.00 | 16.00, 25.50, 12.00, 7.00 | 53.33, 43.33, 40.00, 11.67 | 53.33, 42.50, 40.00, 11.67 | 0.00, -0.83, -0.00, 0.00 | 1.5 | Right windscreen seen from ahead. |
| F03 | x_front | front-cab/white-band-left | 20.00, 37.00, 10.00, 3.00 | 20.00, 37.00, 9.50, 3.00 | 66.67, 61.67, 33.33, 5.00 | 66.67, 61.67, 31.67, 5.00 | 0.00, 0.00, -1.67, -0.00 | 1.5 | White band right of the emblem. |
| F04 | x_front | front-cab/white-band-right | 0.00, 37.00, 10.00, 3.00 | 0.50, 37.00, 9.50, 3.00 | 0.00, 61.67, 33.33, 5.00 | 1.67, 61.67, 31.67, 5.00 | 1.67, 0.00, -1.67, -0.00 | 1.5 | White band left of the emblem. |
| F05 | x_front | front-cab/headlight-left | 22.00, 43.00, 3.00, 3.00 | 22.60, 43.20, 1.80, 1.80 | 73.33, 71.67, 10.00, 5.00 | 75.33, 72.00, 6.00, 3.00 | 2.00, 0.33, -4.00, -2.00 | 1.5 | Headlight, a few pixels: position only. |
| F06 | x_front | front-cab/tail-lamp-left | 26.00, 44.00, 3.00, 2.00 | 26.70, 43.30, 1.60, 1.60 | 86.67, 73.33, 10.00, 3.33 | 89.00, 72.17, 5.33, 2.67 | 2.33, -1.17, -4.67, -0.67 | 1.5 | Red tail lamp, a few pixels: position only. |
| S01 | z_right | sides/right-side/grille-bank-front | 33.00, 25.00, 32.00, 7.00 | 33.00, 25.00, 32.00, 7.00 | 19.41, 41.67, 18.82, 11.67 | 19.41, 41.67, 18.82, 11.67 | -0.00, 0.00, 0.00, 0.00 | 1.01 | Front grille bank. |
| S02 | z_right | sides/right-side/grille-bank-rear | 103.00, 25.00, 32.00, 7.00 | 102.30, 25.00, 32.00, 7.00 | 60.59, 41.67, 18.82, 11.67 | 60.18, 41.67, 18.82, 11.67 | -0.41, 0.00, 0.00, 0.00 | 1.5 | Rear grille bank; the native texture is centred half a pixel off. |
| S03 | z_right | sides/right-side/window-1/frame | 65.00, 25.00, 12.00, 8.00 | 65.35, 25.00, 11.30, 8.00 | 38.24, 41.67, 7.06, 13.33 | 38.44, 41.67, 6.65, 13.33 | 0.21, 0.00, -0.41, -0.00 | 1.5 | Window, the frames of neighbours shared. |
| S04 | z_right | sides/right-side/window-2/frame | 77.00, 25.00, 13.00, 8.00 | 77.65, 25.00, 11.70, 8.00 | 45.29, 41.67, 7.65, 13.33 | 45.68, 41.67, 6.88, 13.33 | 0.38, 0.00, -0.76, -0.00 | 1.5 | Window. |
| S05 | z_right | sides/right-side/window-3/frame | 90.00, 25.00, 13.00, 8.00 | 90.35, 25.00, 12.30, 8.00 | 52.94, 41.67, 7.65, 13.33 | 53.15, 41.67, 7.24, 13.33 | 0.21, 0.00, -0.41, -0.00 | 1.5 | Window. |
| S06 | z_right | sides/right-side/cab-window-front | 17.00, 26.00, 5.00, 6.00 | 17.00, 26.00, 5.00, 6.00 | 10.00, 43.33, 2.94, 10.00 | 10.00, 43.33, 2.94, 10.00 | 0.00, -0.00, 0.00, 0.00 | 1.01 | Cab side window. |
| S07 | z_right | sides/right-side/door-front/seams | 23.00, 25.00, 9.00, 22.00 | 23.00, 25.00, 9.00, 22.00 | 13.53, 41.67, 5.29, 36.67 | 13.53, 41.67, 5.29, 36.67 | -0.00, 0.00, 0.00, 0.00 | 1.5 | Cab door between its seams at columns 23 and 31. |
| S08 | z_right | sides/right-side/emblem | 81.00, 37.00, 5.00, 4.00 | 81.00, 37.00, 5.00, 3.00 | 47.65, 61.67, 2.94, 6.67 | 47.65, 61.67, 2.94, 5.00 | 0.00, 0.00, -0.00, -1.67 | 1.01 | The DB emblem. |
| S09 | z_right | sides/right-side/number | 79.00, 46.00, 10.00, 2.00 | 79.00, 45.60, 10.00, 1.60 | 46.47, 76.67, 5.88, 3.33 | 46.47, 76.00, 5.88, 2.67 | -0.00, -0.67, 0.00, -0.67 | 1.5 | Painted running number. |
