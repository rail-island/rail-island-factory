# OBB 1012.001: native landmark comparison

**Covers** - the default build of `veh-obb-1012` against 9 boxes annotated on the native vlakosimdb BMPs (`native/landmarks.json`).
**Code** - `generator/mainlineComparison.ts`, `generator/mainlineReport.ts`, `test/mainlineElectrics.test.ts`
**See also** - [SOURCES.md](SOURCES.md), [docs/models/mainline-electrics.md](../../docs/models/mainline-electrics.md)

Model revision: `9cec458` (measured when this file was written). Mapping: side column px = 96.5 - x / 0.09923 (the native body scaled to the published 18.3 m), row = (6 - y) / 0.10345; front column = 10 (1.5 - z). Canvases: x_front 30 x 60 px (`native/x_both.bmp`), z_right 193 x 58 px (`native/z_both.bmp`).

Each vector is (left, top, width, height) in native pixels; percentages are 100*x/W, 100*y/H, 100*w/W, 100*h/H of the view's canvas, origin top left. Delta = model minus source in percentage points. MAE = sum(|delta|) / (4 * boxes). Model boxes are the bounds of the actual GLB vertices of the named scopes, occluded vertices included.

| View | Boxes | MAE baseline (pp) | MAE now (pp) |
|---|---:|---:|---:|
| x_front | 4 | 1.52 | 0.73 |
| z_right | 5 | 0.30 | 0.30 |
| all | 9 | 0.85 | 0.49 |

| ID | View | Element | Source px | Model px | Source % | Model % | Delta pp | Tolerance px | Note |
|---|---|---|---|---|---|---|---|---:|---|
| F01 | x_front | front-cab/windscreen/frame | 1.00, 23.00, 28.00, 12.00 | 1.00, 23.00, 28.00, 12.00 | 3.33, 38.33, 93.33, 20.00 | 3.33, 38.33, 93.33, 20.00 | 0.00, -0.00, -0.00, 0.00 | 1.5 | The wide windscreen. |
| F02 | x_front | body/shell/front/band-1 | 0.00, 39.00, 30.00, 7.00 | 0.00, 39.00, 30.00, 6.00 | 0.00, 65.00, 100.00, 11.67 | 0.00, 65.00, 100.00, 10.00 | 0.00, 0.00, 0.00, -1.67 | 1.5 | The red band across the nose. |
| F03 | x_front | front-cab/lamp-cluster-left | 17.00, 41.00, 12.00, 3.00 | 18.00, 41.00, 11.20, 2.80 | 56.67, 68.33, 40.00, 5.00 | 60.00, 68.33, 37.33, 4.67 | 3.33, 0.00, -2.67, -0.33 | 1.5 | Right lamp cluster seen from ahead. |
| F04 | x_front | front-cab/lamp-cluster-right | 1.00, 41.00, 12.00, 3.00 | 0.80, 41.00, 11.20, 2.80 | 3.33, 68.33, 40.00, 5.00 | 2.67, 68.33, 37.33, 4.67 | -0.67, 0.00, -2.67, -0.33 | 1.5 | Left lamp cluster seen from ahead. |
| S01 | z_right | sides/right-side/machine-room | 51.00, 24.00, 91.00, 15.00 | 51.00, 24.00, 91.00, 15.00 | 26.42, 41.38, 47.15, 25.86 | 26.42, 41.38, 47.15, 25.86 | -0.00, -0.00, 0.00, 0.00 | 1.01 | The red machine room. |
| S02 | z_right | sides/right-side/line | 55.00, 40.00, 83.00, 1.00 | 55.00, 40.00, 83.00, 1.00 | 28.50, 68.97, 43.01, 1.72 | 28.50, 68.97, 43.01, 1.72 | -0.00, -0.00, 0.00, -0.00 | 1.01 | The light grey line under it. |
| S03 | z_right | sides/right-side/cab-window-front | 23.00, 25.00, 5.00, 7.00 | 23.00, 25.00, 5.00, 6.00 | 11.92, 43.10, 2.59, 12.07 | 11.92, 43.10, 2.59, 10.34 | 0.00, 0.00, -0.00, -1.72 | 1.01 | Cab side window. |
| S04 | z_right | sides/right-side/roof-grille | 55.00, 17.00, 83.00, 4.00 | 55.00, 17.69, 83.00, 3.09 | 28.50, 29.31, 43.01, 6.90 | 28.50, 30.50, 43.01, 5.33 | -0.00, 1.19, 0.00, -1.56 | 1.5 | Grilles on the leaning upper side. |
| S05 | z_right | body/frame | 5.00, 44.00, 183.00, 5.00 | 5.30, 43.98, 182.41, 4.35 | 2.59, 75.86, 94.82, 8.62 | 2.74, 75.83, 94.51, 7.50 | 0.15, -0.03, -0.31, -1.12 | 2 | The grey skirt. |
