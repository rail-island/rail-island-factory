# DR 243 864: native landmark comparison

**Covers** - the default build of `veh-dr-243` against 14 boxes annotated on the native vlakosimdb BMPs (`native/landmarks.json`).
**Code** - `generator/mainlineComparison.ts`, `generator/mainlineReport.ts`, `test/mainlineElectrics.test.ts`
**See also** - [SOURCES.md](SOURCES.md), [docs/models/mainline-electrics.md](../../docs/models/mainline-electrics.md)

Model revision: `a9eb5f3` (measured when this file was written). Mapping: side column px = 84 - 10 x, row = 10 (6 - y); front column = 10 (1.5 - z). Canvases: x_front 30 x 60 px (`native/dr_243/x_both.bmp`), z_right 170 x 60 px (`native/dr_243/z_dec.bmp`).

Each vector is (left, top, width, height) in native pixels; percentages are 100*x/W, 100*y/H, 100*w/W, 100*h/H of the view's canvas, origin top left. Delta = model minus source in percentage points. MAE = sum(|delta|) / (4 * boxes). Model boxes are the bounds of the actual GLB vertices of the named scopes, occluded vertices included.

| View | Boxes | MAE baseline (pp) | MAE now (pp) |
|---|---:|---:|---:|
| x_front | 5 | 1.58 | 1.10 |
| z_right | 9 | 0.54 | 0.37 |
| all | 14 | 0.91 | 0.63 |

| ID | View | Element | Source px | Model px | Source % | Model % | Delta pp | Tolerance px | Note |
|---|---|---|---|---|---|---|---|---:|---|
| F01 | x_front | front-cab/windscreen-right/frame | 1.00, 25.00, 14.00, 9.00 | 1.00, 25.00, 13.50, 8.80 | 3.33, 41.67, 46.67, 15.00 | 3.33, 41.67, 45.00, 14.67 | 0.00, 0.00, -1.67, -0.33 | 1.5 | Left windscreen seen from ahead. |
| F02 | x_front | front-cab/windscreen-left/frame | 15.00, 25.00, 14.00, 9.00 | 15.50, 25.00, 13.50, 8.80 | 50.00, 41.67, 46.67, 15.00 | 51.67, 41.67, 45.00, 14.67 | 1.67, 0.00, -1.67, -0.33 | 1.5 | Right windscreen seen from ahead. |
| F03 | x_front | front-cab/top-headlight | 13.00, 34.00, 4.00, 2.00 | 13.70, 33.90, 2.60, 2.60 | 43.33, 56.67, 13.33, 3.33 | 45.67, 56.50, 8.67, 4.33 | 2.33, -0.17, -4.67, 1.00 | 1.5 | Headlight under the windscreens. |
| F04 | x_front | body/shell/front/band-1, body/shell/side-right/band-1, body/shell/side-left/band-1 | 0.00, 43.00, 30.00, 4.00 | 0.00, 43.00, 30.00, 4.00 | 0.00, 71.67, 100.00, 6.67 | 0.00, 71.67, 100.00, 6.67 | 0.00, -0.00, 0.00, 0.00 | 1.5 | White band with the lamps, rows 43-46; the rounded corners carry the side bands (the white line). |
| F05 | x_front | front-cab/tail-lamp-left | 26.00, 44.00, 3.00, 2.00 | 26.70, 43.70, 1.60, 1.60 | 86.67, 73.33, 10.00, 3.33 | 89.00, 72.83, 5.33, 2.67 | 2.33, -0.50, -4.67, -0.67 | 1.5 | Red tail lamp: position only. |
| S01 | z_right | sides/right-side/cab-window-front | 15.00, 26.00, 7.00, 8.00 | 15.00, 26.00, 7.00, 7.00 | 8.82, 43.33, 4.12, 13.33 | 8.82, 43.33, 4.12, 11.67 | -0.00, -0.00, 0.00, -1.67 | 1.01 | Cab side window with its frame. |
| S02 | z_right | sides/right-side/cab-window-rear | 146.00, 26.00, 7.00, 8.00 | 146.00, 26.00, 7.00, 7.00 | 85.88, 43.33, 4.12, 13.33 | 85.88, 43.33, 4.12, 11.67 | -0.00, -0.00, 0.00, -1.67 | 1.5 | Rear cab window; the texture is a pixel off symmetry. |
| S03 | z_right | sides/right-side/door-front/seams | 30.00, 25.00, 7.00, 22.00 | 30.00, 25.00, 7.00, 22.50 | 17.65, 41.67, 4.12, 36.67 | 17.65, 41.67, 4.12, 37.50 | -0.00, 0.00, 0.00, 0.83 | 1.5 | Cab door, its seams faint. |
| S04 | z_right | sides/right-side/ribs-1 | 40.00, 24.00, 89.00, 21.00 | 40.00, 23.80, 88.00, 20.70 | 23.53, 40.00, 52.35, 35.00 | 23.53, 39.67, 51.76, 34.50 | -0.00, -0.33, -0.59, -0.50 | 1.5 | The ribbed machine room. |
| S05 | z_right | sides/right-side/roof-grille-1 | 28.00, 21.00, 41.00, 3.00 | 28.00, 21.40, 41.00, 2.20 | 16.47, 35.00, 24.12, 5.00 | 16.47, 35.67, 24.12, 3.67 | 0.00, 0.67, -0.00, -1.33 | 1.01 | Grille on the roof's edge. |
| S06 | z_right | sides/right-side/roof-grille-2 | 73.00, 21.00, 27.00, 3.00 | 73.00, 21.40, 27.00, 2.20 | 42.94, 35.00, 15.88, 5.00 | 42.94, 35.67, 15.88, 3.67 | -0.00, 0.67, 0.00, -1.33 | 1.01 | Grille on the roof's edge. |
| S07 | z_right | sides/right-side/roof-grille-3 | 112.00, 21.00, 29.00, 3.00 | 112.00, 21.40, 29.00, 2.20 | 65.88, 35.00, 17.06, 5.00 | 65.88, 35.67, 17.06, 3.67 | -0.00, 0.67, -0.00, -1.33 | 1.01 | Grille on the roof's edge. |
| S08 | z_right | sides/right-side/number | 80.00, 41.00, 9.00, 3.00 | 80.00, 41.00, 9.00, 3.00 | 47.06, 68.33, 5.29, 5.00 | 47.06, 68.33, 5.29, 5.00 | -0.00, 0.00, 0.00, -0.00 | 1.01 | Black number plate. |
| S09 | z_right | body/shell/side-right/band-1 | 8.00, 45.00, 152.00, 1.00 | 9.00, 45.00, 150.00, 1.00 | 4.71, 75.00, 89.41, 1.67 | 5.29, 75.00, 88.24, 1.67 | 0.59, 0.00, -1.18, 0.00 | 2 | The white line; its ends round the corners. |
