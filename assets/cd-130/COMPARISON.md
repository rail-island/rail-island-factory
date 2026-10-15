# CD 130 036-7: native landmark comparison

**Covers** - the default build of `veh-cd-130` against 16 boxes annotated on the native vlakosimdb BMPs (`native/landmarks.json`).
**Code** - `generator/czElectricComparison.ts`, `generator/czElectricReport.ts`, `test/czElectrics.test.ts`
**See also** - [SOURCES.md](SOURCES.md), [docs/models/cz-electrics.md](../../docs/models/cz-electrics.md)

Model revision: `1ea204d` (measured when this file was written). Mapping: side column px = 79.5 - 10 x, row = 10 (6 - y); front column = 10 (1.5 - z). Canvases: x_front 30 x 60 px (`native/cd_130/x_both.bmp`), z_right 170 x 60 px (`native/cd_130/z_both.bmp`).

Each vector is (left, top, width, height) in native pixels; percentages are 100*x/W, 100*y/H, 100*w/W, 100*h/H of the view's canvas, origin top left. Delta = model minus source in percentage points. MAE = sum(|delta|) / (4 * boxes). Model boxes are the bounds of the actual GLB vertices of the named scopes, occluded vertices included.

| View | Boxes | MAE baseline (pp) | MAE now (pp) |
|---|---:|---:|---:|
| x_front | 7 | 1.79 | 1.79 |
| z_right | 9 | 0.14 | 0.14 |
| all | 16 | 0.86 | 0.86 |

| ID | View | Element | Source px | Model px | Source % | Model % | Delta pp | Tolerance px | Note |
|---|---|---|---|---|---|---|---|---:|---|
| F01 | x_front | front-cab/headlight | 11.00, 20.00, 8.00, 5.00 | 12.50, 19.76, 5.00, 4.87 | 36.67, 33.33, 26.67, 8.33 | 41.67, 32.94, 16.67, 8.12 | 5.00, -0.40, -10.00, -0.21 | 3 | Round headlight housing on the roof leading edge. The native 8 x 5 px box includes the grey dome around it; photographs show a round housing about 0.5 m across, which the model keeps. |
| F02 | x_front | front-cab/windscreen/right-pane/rubber | 0.00, 25.00, 13.00, 9.00 | 0.80, 25.80, 11.80, 8.00 | 0.00, 41.67, 43.33, 15.00 | 2.67, 43.00, 39.33, 13.33 | 2.67, 1.33, -4.00, -1.67 | 1.5 | Windscreen pane with its rubber; the native trim strip runs across the whole face at rows 25 and 33. |
| F03 | x_front | front-cab/windscreen/left-pane/rubber | 17.00, 25.00, 13.00, 9.00 | 17.40, 25.80, 11.80, 8.00 | 56.67, 41.67, 43.33, 15.00 | 58.00, 43.00, 39.33, 13.33 | 1.33, 1.33, -4.00, -1.67 | 1.5 | As F02, the other pane. |
| F04 | x_front | front-cab/number-plate | 10.00, 36.00, 9.00, 2.00 | 10.50, 36.00, 9.00, 1.80 | 33.33, 60.00, 30.00, 3.33 | 35.00, 60.00, 30.00, 3.00 | 1.67, -0.00, -0.00, -0.33 | 1.01 | Red plate at the cream/green boundary; +/- one pixel. |
| F05 | x_front | front-cab/lamps/lamp-1 | 5.00, 38.00, 2.00, 2.00 | 5.00, 38.05, 2.00, 1.90 | 16.67, 63.33, 6.67, 3.33 | 16.67, 63.41, 6.67, 3.17 | 0.00, 0.08, -0.00, -0.16 | 1.01 | Outer lamp, a 2 x 2 px patch: position only. |
| F06 | x_front | body/shell/front/band-0 | 0.00, 45.00, 30.00, 3.00 | 0.30, 45.00, 29.40, 3.00 | 0.00, 75.00, 100.00, 5.00 | 1.00, 75.00, 98.00, 5.00 | 1.00, 0.00, -2.00, -0.00 | 1.01 | The yellow band across the nose, 1.2 to 1.5 m. |
| F07 | x_front | front-cab/lower-end/buffers/right/head | 3.00, 48.00, 6.00, 4.00 | 4.25, 47.70, 4.00, 4.00 | 10.00, 80.00, 20.00, 6.67 | 14.17, 79.50, 13.33, 6.67 | 4.17, -0.50, -6.67, 0.00 | 2 | Buffer head ring, drawn 0.6 m across; the model keeps 0.4 m heads at the standard 1.75 m spacing. |
| S01 | z_right | sides/right-side/windows/window-1 | 38.00, 27.00, 10.00, 8.00 | 38.00, 27.00, 10.00, 8.00 | 22.35, 45.00, 5.88, 13.33 | 22.35, 45.00, 5.88, 13.33 | -0.00, 0.00, 0.00, -0.00 | 1.01 | Large machine-room window, frame and glass. |
| S02 | z_right | sides/right-side/windows/window-2 | 63.00, 30.00, 10.00, 5.00 | 63.00, 30.00, 10.00, 5.00 | 37.06, 50.00, 5.88, 8.33 | 37.06, 50.00, 5.88, 8.33 | 0.00, 0.00, 0.00, 0.00 | 1.01 | Small machine-room window. |
| S03 | z_right | sides/right-side/windows/window-3 | 87.00, 30.00, 10.00, 5.00 | 87.00, 30.00, 10.00, 5.00 | 51.18, 50.00, 5.88, 8.33 | 51.18, 50.00, 5.88, 8.33 | 0.00, 0.00, 0.00, 0.00 | 1.01 | Small machine-room window. |
| S04 | z_right | sides/right-side/windows/window-4 | 112.00, 27.00, 10.00, 8.00 | 112.00, 27.00, 10.00, 8.00 | 65.88, 45.00, 5.88, 13.33 | 65.88, 45.00, 5.88, 13.33 | 0.00, 0.00, 0.00, -0.00 | 1.01 | Large machine-room window. |
| S05 | z_right | sides/right-side/front-cab/door/window | 12.00, 26.00, 6.00, 8.00 | 12.00, 26.00, 6.00, 8.00 | 7.06, 43.33, 3.53, 13.33 | 7.06, 43.33, 3.53, 13.33 | 0.00, -0.00, -0.00, 0.00 | 1.01 | Cab door window at the front end. |
| S06 | z_right | sides/right-side/number-plate | 76.00, 41.00, 9.00, 3.00 | 76.00, 41.00, 9.00, 3.00 | 44.71, 68.33, 5.29, 5.00 | 44.71, 68.33, 5.29, 5.00 | 0.00, 0.00, 0.00, -0.00 | 1.01 | Red side plate; +/- one pixel. |
| S07 | z_right | body/shell/side-right/band-1, body/shell/front/band-2, body/shell/rear/band-2 | 0.00, 25.00, 160.00, 12.00 | -0.35, 25.00, 159.70, 12.00 | 0.00, 41.67, 94.12, 20.00 | -0.21, 41.67, 93.94, 20.00 | -0.21, 0.00, -0.18, 0.00 | 1.5 | The cream upper band, 2.3 to 3.5 m, over the whole side including the rounded corners (painted with the ends). |
| S08 | z_right | roof-equipment/roof-hump | 55.00, 16.00, 49.00, 4.00 | 55.50, 16.00, 48.00, 5.50 | 32.35, 26.67, 28.82, 6.67 | 32.65, 26.67, 28.24, 9.17 | 0.29, -0.00, -0.59, 2.50 | 2 | Raised middle of the roof, top at 4.4 m (XML roof clip); its lower edge disappears into the roof's curve, so only the top and ends are sharp. |
| S09 | z_right | rear-cab/lower-end/buffers/left | 158.00, 48.00, 6.00, 4.00 | 159.25, 47.70, 6.30, 4.00 | 92.94, 80.00, 3.53, 6.67 | 93.68, 79.50, 3.71, 6.67 | 0.74, -0.50, 0.18, 0.00 | 2 | The buffers drawn at one end of the native side only; the model's are 0.62 m long to the published 17.21 m over the buffers. |
