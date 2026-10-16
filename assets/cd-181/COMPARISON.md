# CD 181 105: native landmark comparison

**Covers** - the default build of `veh-cd-180` against 17 boxes annotated on the native vlakosimdb BMPs (`native/landmarks.json`).
**Code** - `generator/mainlineComparison.ts`, `generator/mainlineReport.ts`, `test/mainlineElectrics.test.ts`
**See also** - [SOURCES.md](SOURCES.md), [docs/models/mainline-electrics.md](../../docs/models/mainline-electrics.md)

Model revision: `9cec458` (measured when this file was written). Mapping: side column px = 94 - 10 x, row = 10 (6 - y); front column = 10 (1.5 - z). Canvases: x_front 30 x 60 px (`native/cd_181/x_both.bmp`), z_right 220 x 60 px (`native/cd_181/z_dec.bmp`).

Each vector is (left, top, width, height) in native pixels; percentages are 100*x/W, 100*y/H, 100*w/W, 100*h/H of the view's canvas, origin top left. Delta = model minus source in percentage points. MAE = sum(|delta|) / (4 * boxes). Model boxes are the bounds of the actual GLB vertices of the named scopes, occluded vertices included.

| View | Boxes | MAE baseline (pp) | MAE now (pp) |
|---|---:|---:|---:|
| x_front | 7 | 1.45 | 0.73 |
| z_right | 10 | 0.07 | 0.07 |
| all | 17 | 0.64 | 0.34 |

| ID | View | Element | Source px | Model px | Source % | Model % | Delta pp | Tolerance px | Note |
|---|---|---|---|---|---|---|---|---:|---|
| F01 | x_front | front-cab/windscreen-right/frame | 3.00, 26.00, 11.00, 9.00 | 3.00, 26.00, 11.00, 9.00 | 10.00, 43.33, 36.67, 15.00 | 10.00, 43.33, 36.67, 15.00 | -0.00, -0.00, 0.00, 0.00 | 1.5 | Left windscreen seen from ahead, light frame included. |
| F02 | x_front | front-cab/windscreen-left/frame | 16.00, 26.00, 11.00, 9.00 | 16.00, 26.00, 11.00, 9.00 | 53.33, 43.33, 36.67, 15.00 | 53.33, 43.33, 36.67, 15.00 | 0.00, -0.00, 0.00, 0.00 | 1.5 | Right windscreen seen from ahead. |
| F03 | x_front | front-cab/roof-headlight | 13.00, 20.00, 4.00, 4.00 | 13.60, 21.10, 2.80, 2.80 | 43.33, 33.33, 13.33, 6.67 | 45.33, 35.17, 9.33, 4.67 | 2.00, 1.83, -4.00, -2.00 | 2 | Roof headlight; the native box includes its dark housing. |
| F04 | x_front | front-cab/number-plate | 11.00, 36.00, 9.00, 3.00 | 10.00, 36.00, 9.00, 3.00 | 36.67, 60.00, 30.00, 5.00 | 33.33, 60.00, 30.00, 5.00 | -3.33, -0.00, 0.00, 0.00 | 1.01 | Red plate under the windscreens. |
| F05 | x_front | body/shell/front/band-5, body/shell/side-right/band-4, body/shell/side-left/band-4 | 0.00, 25.00, 30.00, 11.00 | 0.00, 25.00, 30.00, 11.00 | 0.00, 41.67, 100.00, 18.33 | 0.00, 41.67, 100.00, 18.33 | 0.00, 0.00, 0.00, -0.00 | 1.5 | Cream band across the end, rows 25-35; the rounded corners carry the side bands. |
| F06 | x_front | body/shell/front/band-3, body/shell/side-right/band-2, body/shell/side-left/band-2 | 0.00, 37.00, 30.00, 8.00 | 0.00, 37.00, 30.00, 8.00 | 0.00, 61.67, 100.00, 13.33 | 0.00, 61.67, 100.00, 13.33 | 0.00, 0.00, 0.00, -0.00 | 1.5 | Green band between the grey lines, rows 37-44; the corners carry the side bands. |
| F07 | x_front | front-cab/lamp-1 | 24.00, 39.00, 3.00, 3.00 | 24.10, 39.60, 1.80, 1.80 | 80.00, 65.00, 10.00, 5.00 | 80.33, 66.00, 6.00, 3.00 | 0.33, 1.00, -4.00, -2.00 | 1.5 | A white cross, 3 x 3 px: position only. |
| S01 | z_right | sides/right-side/window-1/frame | 35.00, 26.00, 11.00, 9.00 | 35.00, 26.00, 11.00, 9.00 | 15.91, 43.33, 5.00, 15.00 | 15.91, 43.33, 5.00, 15.00 | -0.00, -0.00, -0.00, 0.00 | 1.01 | Machine-room window with its light frame. |
| S02 | z_right | sides/right-side/window-2/frame | 56.00, 26.00, 11.00, 9.00 | 56.00, 26.00, 11.00, 9.00 | 25.45, 43.33, 5.00, 15.00 | 25.45, 43.33, 5.00, 15.00 | 0.00, -0.00, -0.00, 0.00 | 1.01 | Divided window. |
| S03 | z_right | sides/right-side/window-3/frame | 76.00, 26.00, 11.00, 9.00 | 76.00, 26.00, 11.00, 9.00 | 34.55, 43.33, 5.00, 15.00 | 34.55, 43.33, 5.00, 15.00 | 0.00, -0.00, -0.00, 0.00 | 1.01 | Divided window. |
| S04 | z_right | sides/right-side/window-4/frame | 99.00, 26.00, 11.00, 9.00 | 99.00, 26.00, 11.00, 9.00 | 45.00, 43.33, 5.00, 15.00 | 45.00, 43.33, 5.00, 15.00 | 0.00, -0.00, 0.00, 0.00 | 1.01 | Window. |
| S05 | z_right | sides/right-side/window-5/frame | 121.00, 26.00, 11.00, 9.00 | 121.00, 26.00, 11.00, 9.00 | 55.00, 43.33, 5.00, 15.00 | 55.00, 43.33, 5.00, 15.00 | 0.00, -0.00, -0.00, 0.00 | 1.01 | Window. |
| S06 | z_right | sides/right-side/window-6/frame | 142.00, 26.00, 11.00, 9.00 | 142.00, 26.00, 11.00, 9.00 | 64.55, 43.33, 5.00, 15.00 | 64.55, 43.33, 5.00, 15.00 | 0.00, -0.00, -0.00, 0.00 | 1.01 | Window. |
| S07 | z_right | sides/right-side/door-front/window | 19.00, 26.00, 6.00, 9.00 | 18.50, 26.00, 7.00, 9.00 | 8.64, 43.33, 2.73, 15.00 | 8.41, 43.33, 3.18, 15.00 | -0.23, -0.00, 0.45, 0.00 | 1.01 | Cab door window; the model insets it 0.1 m from the door's seams. |
| S08 | z_right | sides/right-side/door-front/seams | 17.00, 25.00, 10.00, 23.00 | 17.50, 25.00, 9.00, 23.00 | 7.73, 41.67, 4.55, 38.33 | 7.95, 41.67, 4.09, 38.33 | 0.23, 0.00, -0.45, -0.00 | 1.01 | Cab door between its seams at columns 17 and 26. |
| S09 | z_right | sides/right-side/number-plate | 88.00, 40.00, 10.00, 3.00 | 88.00, 40.00, 10.00, 3.00 | 40.00, 66.67, 4.55, 5.00 | 40.00, 66.67, 4.55, 5.00 | -0.00, 0.00, 0.00, -0.00 | 1.01 | Red number plate. |
| S10 | z_right | body/shell/side-right/band-4 | 12.00, 25.00, 164.00, 11.00 | 11.00, 25.00, 166.00, 11.00 | 5.45, 41.67, 74.55, 18.33 | 5.00, 41.67, 75.45, 18.33 | -0.45, 0.00, 0.91, -0.00 | 2.01 | Cream band; its ends follow the rounded nose, ambiguous by a pixel or two. |
