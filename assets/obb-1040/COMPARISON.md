# OBB 1040 013: native landmark comparison

**Covers** - the default build of `veh-obb-1040` against 13 boxes annotated on the native vlakosimdb BMPs (`native/landmarks.json`).
**Code** - `generator/mainlineComparison.ts`, `generator/mainlineReport.ts`, `test/mainlineElectrics.test.ts`
**See also** - [SOURCES.md](SOURCES.md), [docs/models/mainline-electrics.md](../../docs/models/mainline-electrics.md)

Model revision: `a9eb5f3` (measured when this file was written). Mapping: side column px = 65.5 + x / 0.10504 (the native body scaled to the published 12.92 m over the buffers), row = 10 (6 - y); front column = 10 (1.5 - z). Canvases: x_front 30 x 60 px (`native/x_both.bmp`), z_right 170 x 60 px (`native/z_both.bmp`).

Each vector is (left, top, width, height) in native pixels; percentages are 100*x/W, 100*y/H, 100*w/W, 100*h/H of the view's canvas, origin top left. Delta = model minus source in percentage points. MAE = sum(|delta|) / (4 * boxes). Model boxes are the bounds of the actual GLB vertices of the named scopes, occluded vertices included.

| View | Boxes | MAE baseline (pp) | MAE now (pp) |
|---|---:|---:|---:|
| x_front | 5 | 1.33 | 1.26 |
| z_right | 8 | 0.27 | 0.16 |
| all | 13 | 0.68 | 0.58 |

| ID | View | Element | Source px | Model px | Source % | Model % | Delta pp | Tolerance px | Note |
|---|---|---|---|---|---|---|---|---:|---|
| F01 | x_front | front-cab/windscreen-right/frame | 2.00, 23.00, 12.00, 10.00 | 2.00, 23.20, 11.00, 9.60 | 6.67, 38.33, 40.00, 16.67 | 6.67, 38.67, 36.67, 16.00 | 0.00, 0.33, -3.33, -0.67 | 1.5 | Left windscreen seen from ahead, dark red frame. |
| F02 | x_front | front-cab/windscreen-left/frame | 16.00, 23.00, 12.00, 10.00 | 17.00, 23.20, 11.00, 9.60 | 53.33, 38.33, 40.00, 16.67 | 56.67, 38.67, 36.67, 16.00 | 3.33, 0.33, -3.33, -0.67 | 1.5 | Right windscreen seen from ahead. |
| F03 | x_front | front-cab/headlight-left | 23.00, 38.00, 3.00, 4.00 | 22.70, 38.20, 3.60, 3.60 | 76.67, 63.33, 10.00, 6.67 | 75.67, 63.67, 12.00, 6.00 | -1.00, 0.33, 2.00, -0.67 | 1.01 | Headlight. |
| F04 | x_front | front-cab/emblem | 13.00, 38.00, 5.00, 4.00 | 12.50, 38.50, 5.00, 3.00 | 43.33, 63.33, 16.67, 6.67 | 41.67, 64.17, 16.67, 5.00 | -1.67, 0.83, 0.00, -1.67 | 1.01 | The OBB emblem. |
| F05 | x_front | body/shell/front/band-1, body/shell/side-right/band-1, body/shell/side-left/band-1 | 0.00, 33.00, 30.00, 1.00 | 0.50, 33.00, 29.00, 1.00 | 0.00, 55.00, 100.00, 1.67 | 1.67, 55.00, 96.67, 1.67 | 1.67, -0.00, -3.33, 0.00 | 1.01 | The yellow line; the corners of the V carry the side bands. |
| S01 | z_right | sides/right-side/window-1/frame | 41.00, 27.00, 7.00, 5.00 | 41.00, 27.00, 7.00, 5.00 | 24.12, 45.00, 4.12, 8.33 | 24.12, 45.00, 4.12, 8.33 | 0.00, 0.00, -0.00, 0.00 | 1.01 | Window. |
| S02 | z_right | sides/right-side/window-2/frame | 83.00, 27.00, 7.00, 5.00 | 83.00, 27.00, 7.00, 5.00 | 48.82, 45.00, 4.12, 8.33 | 48.82, 45.00, 4.12, 8.33 | 0.00, 0.00, -0.00, 0.00 | 1.01 | Window. |
| S03 | z_right | sides/right-side/louvre-1 | 32.00, 26.00, 7.00, 7.00 | 32.00, 26.00, 7.00, 7.00 | 18.82, 43.33, 4.12, 11.67 | 18.82, 43.33, 4.12, 11.67 | 0.00, -0.00, 0.00, 0.00 | 1.01 | Louvre panel. |
| S04 | z_right | sides/right-side/louvre-6 | 92.00, 26.00, 7.00, 7.00 | 92.00, 26.00, 7.00, 7.00 | 54.12, 43.33, 4.12, 11.67 | 54.12, 43.33, 4.12, 11.67 | -0.00, -0.00, 0.00, 0.00 | 1.01 | Louvre panel. |
| S05 | z_right | sides/right-side/door-front/seams | 101.00, 24.00, 7.00, 20.00 | 101.00, 24.00, 7.00, 19.50 | 59.41, 40.00, 4.12, 33.33 | 59.41, 40.00, 4.12, 32.50 | 0.00, 0.00, 0.00, -0.83 | 2 | Cab door between the handrails; top and bottom estimated. |
| S06 | z_right | body/shell/side-right/band-1 | 11.00, 33.00, 110.00, 1.00 | 11.24, 33.00, 108.53, 1.00 | 6.47, 55.00, 64.71, 1.67 | 6.61, 55.00, 63.84, 1.67 | 0.14, -0.00, -0.87, 0.00 | 2.5 | The yellow line, round the corners of the V. |
| S07 | z_right | body/frame | 8.00, 44.00, 115.00, 6.00 | 8.38, 44.00, 114.24, 6.00 | 4.71, 73.33, 67.65, 10.00 | 4.93, 73.33, 67.20, 10.00 | 0.22, -0.00, -0.45, 0.00 | 1.5 | The grey frame. |
| S08 | z_right | sides/right-side/emblem | 95.00, 38.00, 5.00, 4.00 | 95.00, 38.50, 5.00, 3.00 | 55.88, 63.33, 2.94, 6.67 | 55.88, 64.17, 2.94, 5.00 | -0.00, 0.83, -0.00, -1.67 | 1.01 | The OBB emblem. |
