# CSD M 240.0113: native landmark comparison

**Covers** - the build `veh-csd-m240` {} against 14 boxes annotated on the native vlakosimdb BMPs (`native/csd_m240/landmarks.json`).
**Code** - `generator/dmuComparison.ts`, `generator/dmuReport.ts`, `test/czechDmus.test.ts`
**See also** - [SOURCES.md](SOURCES.md), [docs/models/czech-dmus.md](../../docs/models/czech-dmus.md)

Model revision: `979f87d` (measured when this file was written). Mapping: side column = 10 (x / 0.97368 + 9.55) (the XML scaled to the published 18.5 m over the buffers), row = 10 (4 - y); front column = 10 (1.5 - z), row = 10 (4 - y). Canvases: side 191 x 40 px (`native/csd_m240/z_both.bmp`), front 30 x 40 px (`native/csd_m240/x_both.bmp`).

Each vector is (left, top, width, height) in native pixels; percentages are 100*x/W, 100*y/H, 100*w/W, 100*h/H of the view's canvas, origin top left. Delta = model minus source in percentage points. MAE = sum(|delta|) / (4 * boxes). Model boxes are the bounds of the actual GLB vertices of the named scopes, projected orthographically with the documented scales undone, occluded vertices included.

| View | Boxes | MAE baseline (pp) | MAE now (pp) |
|---|---:|---:|---:|
| side | 9 | 0.19 | 0.19 |
| front | 5 | 1.51 | 0.58 |
| all | 14 | 0.66 | 0.33 |

| ID | View | Scope | Source px | Model px | Source % | Model % | Delta pp | Tolerance px | Note |
|---|---|---|---|---|---|---|---|---:|---|
| S01 | side | body/right-side/windows/window-1/frame | 81.00, 10.00, 13.00, 11.00 | 81.00, 10.00, 13.00, 11.00 | 42.41, 25.00, 6.81, 27.50 | 42.41, 25.00, 6.81, 27.50 | -0.00, 0.00, 0.00, 0.00 | 1.5 | First large saloon window with sash bar. |
| S02 | side | body/right-side/windows/window-5/frame | 154.00, 10.00, 13.00, 11.00 | 154.00, 10.00, 13.00, 11.00 | 80.63, 25.00, 6.81, 27.50 | 80.63, 25.00, 6.81, 27.50 | -0.00, 0.00, 0.00, 0.00 | 1.5 | Last large window. |
| S03 | side | body/right-side/windows/end-window-1/frame | 46.00, 10.00, 7.00, 11.00 | 46.00, 10.00, 7.00, 11.00 | 24.08, 25.00, 3.66, 27.50 | 24.08, 25.00, 3.66, 27.50 | -0.00, 0.00, 0.00, 0.00 | 1.5 | Small window behind the -X doors. |
| S04 | side | body/right-side/windows/cab-window-1/frame | 3.00, 10.00, 8.00, 11.00 | 7.00, 10.00, 4.00, 11.00 | 1.57, 25.00, 4.19, 27.50 | 3.66, 25.00, 2.09, 27.50 | 2.09, 0.00, -2.09, 0.00 | 1.5 | Cab side window; the BMP wraps it round the rounded end, the model keeps it on the side from column 7. |
| S05 | side | body/right-side/doors/door-2/outline | 24.00, 9.00, 12.00, 23.00 | 24.00, 9.00, 12.00, 22.95 | 12.57, 22.50, 6.28, 57.50 | 12.57, 22.50, 6.28, 57.37 | 0.00, 0.00, -0.00, -0.13 | 1.5 | Double entrance door near -X; leaf split estimated. |
| S06 | side | body/right-side/doors/door-3/outline | 55.00, 10.00, 8.00, 22.00 | 55.00, 10.00, 8.00, 22.00 | 28.80, 25.00, 4.19, 55.00 | 28.80, 25.00, 4.19, 55.00 | -0.00, 0.00, -0.00, -0.00 | 1.5 | Single door, grey frame. |
| S07 | side | body/right-side/doors/door-4/outline | 128.00, 10.00, 8.00, 22.00 | 128.00, 10.00, 8.00, 22.00 | 67.02, 25.00, 4.19, 55.00 | 67.02, 25.00, 4.19, 55.00 | 0.00, 0.00, -0.00, -0.00 | 1.5 | Single door near +X. |
| S08 | side | body/right-side/windows/narrow-window-1/frame | 70.00, 11.00, 4.00, 10.00 | 70.00, 11.00, 4.00, 10.00 | 36.65, 27.50, 2.09, 25.00 | 36.65, 27.50, 2.09, 25.00 | 0.00, -0.00, -0.00, 0.00 | 1.5 | Narrow window. |
| S09 | side | shell/red-band | 4.00, 22.00, 183.00, 10.00 | 4.00, 21.48, 183.00, 9.50 | 2.09, 55.00, 95.81, 25.00 | 2.09, 53.69, 95.81, 23.75 | 0.00, -1.31, -0.00, -1.25 | 1.5 | Red band 0.9 to 1.85 m. |
| F01 | front | front-end/window-1 | 0.00, 10.00, 10.00, 11.00 | 0.50, 10.00, 9.50, 11.00 | 0.00, 25.00, 33.33, 27.50 | 1.67, 25.00, 31.67, 27.50 | 1.67, 0.00, -1.67, 0.00 | 1.5 | Left end window wrapping round the corner. |
| F02 | front | front-end/window-2 | 20.00, 10.00, 10.00, 11.00 | 20.00, 10.00, 9.50, 11.00 | 66.67, 25.00, 33.33, 27.50 | 66.67, 25.00, 31.67, 27.50 | 0.00, 0.00, -1.67, 0.00 | 1.5 | Right end window. |
| F03 | front | front-end/door-frame-1 | 11.00, 10.00, 8.00, 19.00 | 10.50, 10.00, 9.00, 19.00 | 36.67, 25.00, 26.67, 47.50 | 35.00, 25.00, 30.00, 47.50 | -1.67, 0.00, 3.33, -0.00 | 1.5 | End door frame. |
| F04 | front | front-end/top-lamp | 13.00, 4.00, 4.00, 4.00 | 13.00, 4.20, 4.00, 3.60 | 43.33, 10.00, 13.33, 10.00 | 43.33, 10.50, 13.33, 9.00 | -0.00, 0.50, 0.00, -1.00 | 1.5 | Headlamp on the roof dome over the end door. |
| F05 | front | front-end/lamp-1 | 4.00, 24.00, 3.00, 3.00 | 4.00, 24.00, 3.00, 3.00 | 13.33, 60.00, 10.00, 7.50 | 13.33, 60.00, 10.00, 7.50 | -0.00, -0.00, 0.00, 0.00 | 1.5 | Lamp on the red band. |
