# CD 810 604-8 (red): native landmark comparison

**Covers** - the build `veh-cd-810` {} against 17 boxes annotated on the native vlakosimdb BMPs (`native/cd_810_1/landmarks.json`).
**Code** - `generator/dmuComparison.ts`, `generator/dmuReport.ts`, `test/czechDmus.test.ts`
**See also** - [SOURCES.md](SOURCES.md), [docs/models/czech-dmus.md](../../docs/models/czech-dmus.md)

Model revision: `d8ba830` (measured when this file was written). Mapping: side column = 10 (x / 1.04824 + 6.65) (the XML body scaled to the published 13.103 m), row = 10 (4 - y); front column = 10 (1.5 - z), row = 10 (4 - y). Canvases: side 140 x 40 px (`native/cd_810_1/z_dec.bmp`), front 30 x 40 px (`native/cd_810_1/2x_both.bmp`).

Each vector is (left, top, width, height) in native pixels; percentages are 100*x/W, 100*y/H, 100*w/W, 100*h/H of the view's canvas, origin top left. Delta = model minus source in percentage points. MAE = sum(|delta|) / (4 * boxes). Model boxes are the bounds of the actual GLB vertices of the named scopes, projected orthographically with the documented scales undone, occluded vertices included.

| View | Boxes | MAE baseline (pp) | MAE now (pp) |
|---|---:|---:|---:|
| side | 10 | 0.07 | 0.07 |
| front | 7 | 2.30 | 1.35 |
| all | 17 | 0.99 | 0.60 |

| ID | View | Scope | Source px | Model px | Source % | Model % | Delta pp | Tolerance px | Note |
|---|---|---|---|---|---|---|---|---:|---|
| S01 | side | body/right-side/windows/window-1/frame | 22.00, 11.00, 14.00, 9.00 | 22.00, 11.00, 14.00, 9.00 | 15.71, 27.50, 10.00, 22.50 | 15.71, 27.50, 10.00, 22.50 | -0.00, -0.00, -0.00, 0.00 | 1.5 | First saloon window, light grey frame over the cream band. |
| S02 | side | body/right-side/windows/window-3/frame | 52.00, 11.00, 14.00, 9.00 | 52.00, 11.00, 14.00, 9.00 | 37.14, 27.50, 10.00, 22.50 | 37.14, 27.50, 10.00, 22.50 | -0.00, -0.00, 0.00, 0.00 | 1.5 | Third saloon window. |
| S03 | side | body/right-side/windows/window-6/frame | 97.00, 11.00, 14.00, 9.00 | 97.00, 11.00, 14.00, 9.00 | 69.29, 27.50, 10.00, 22.50 | 69.29, 27.50, 10.00, 22.50 | 0.00, -0.00, -0.00, 0.00 | 1.5 | Last saloon window. |
| S04 | side | body/right-side/windows/end-window-1/frame | 7.00, 11.00, 5.00, 9.00 | 7.00, 11.00, 5.00, 9.00 | 5.00, 27.50, 3.57, 22.50 | 5.00, 27.50, 3.57, 22.50 | -0.00, -0.00, 0.00, 0.00 | 1.5 | Cab-end window beside the -X door. |
| S05 | side | body/right-side/windows/end-window-2/frame | 122.00, 11.00, 5.00, 9.00 | 122.00, 11.00, 5.00, 9.00 | 87.14, 27.50, 3.57, 22.50 | 87.14, 27.50, 3.57, 22.50 | -0.00, -0.00, 0.00, 0.00 | 1.5 | Cab-end window beside the +X door. |
| S06 | side | body/right-side/doors/door-1/outline | 13.00, 10.00, 8.00, 25.00 | 13.00, 10.00, 8.00, 25.00 | 9.29, 25.00, 5.71, 62.50 | 9.29, 25.00, 5.71, 62.50 | -0.00, 0.00, 0.00, 0.00 | 1.5 | Folding door, olive frame above the band, dark red edges below; reaches the step at 0.5 m. |
| S07 | side | body/right-side/doors/door-2/outline | 112.00, 10.00, 8.00, 25.00 | 112.00, 10.00, 8.00, 25.00 | 80.00, 25.00, 5.71, 62.50 | 80.00, 25.00, 5.71, 62.50 | 0.00, 0.00, 0.00, 0.00 | 1.5 | As S06. |
| S08 | side | body/right-side/doors/door-1/glass/frame | 15.00, 12.00, 4.00, 8.00 | 15.00, 12.00, 4.00, 8.00 | 10.71, 30.00, 2.86, 20.00 | 10.71, 30.00, 2.86, 20.00 | -0.00, 0.00, 0.00, -0.00 | 1.5 | Door window. |
| S09 | side | body/right-side/emblem | 32.00, 23.00, 6.00, 4.00 | 32.36, 23.20, 4.36, 3.60 | 22.86, 57.50, 4.29, 10.00 | 23.11, 58.00, 3.12, 8.99 | 0.26, 0.50, -1.17, -1.01 | 1.5 | White CD emblem; the model draws the emblem 90 % of the box high at its proportions. |
| S10 | side | shell/cream-band | 4.00, 10.00, 125.00, 11.00 | 4.00, 9.97, 125.00, 11.00 | 2.86, 25.00, 89.29, 27.50 | 2.86, 24.94, 89.29, 27.50 | 0.00, -0.06, -0.00, 0.00 | 1.5 | Cream window band 1.9 to 3.0 m from end wall to end wall. |
| F01 | front | front-end/windscreen/pane-1/glass | 2.00, 13.00, 12.00, 7.00 | 3.00, 13.18, 10.60, 6.41 | 6.67, 32.50, 40.00, 17.50 | 10.00, 32.95, 35.33, 16.02 | 3.33, 0.45, -4.67, -1.48 | 1.5 | Left windscreen glass (seen from ahead); the model holds the pane within the 0.1 m corner chamfer, the BMP runs it out to column 2. |
| F02 | front | front-end/windscreen/pane-2/glass | 18.00, 13.00, 12.00, 7.00 | 16.40, 13.18, 10.60, 6.41 | 60.00, 32.50, 40.00, 17.50 | 54.67, 32.95, 35.33, 16.02 | -5.33, 0.45, -4.67, -1.48 | 1.5 | Right windscreen glass; the BMP runs it to the canvas edge. |
| F03 | front | front-end/lamps/lamp-1 | 0.00, 23.00, 6.00, 3.00 | 0.20, 23.00, 5.60, 3.00 | 0.00, 57.50, 20.00, 7.50 | 0.67, 57.50, 18.67, 7.50 | 0.67, -0.00, -1.33, 0.00 | 1.5 | Twin lamp housing on the yellow band (grey and white pixels). |
| F04 | front | front-end/lamps/lamp-2 | 24.00, 23.00, 6.00, 3.00 | 24.20, 23.00, 5.60, 3.00 | 80.00, 57.50, 20.00, 7.50 | 80.67, 57.50, 18.67, 7.50 | 0.67, -0.00, -1.33, 0.00 | 1.5 | As F03. |
| F05 | front | front-end/front-band | 0.00, 23.00, 30.00, 3.00 | 0.05, 23.00, 29.90, 3.00 | 0.00, 57.50, 100.00, 7.50 | 0.17, 57.50, 99.67, 7.50 | 0.17, -0.00, -0.33, 0.00 | 1.01 | Yellow front band 1.4 to 1.7 m (XML `light` clip). |
| F06 | front | front-end/top-lamp | 12.00, 8.00, 6.00, 3.00 | 12.20, 8.20, 5.60, 1.80 | 40.00, 20.00, 20.00, 7.50 | 40.67, 20.50, 18.67, 4.50 | 0.67, 0.50, -1.33, -3.00 | 1.5 | Top lamp on the visor. |
| F07 | front | front-end/visor | 0.00, 8.00, 30.00, 3.00 | -0.06, 6.96, 30.12, 4.04 | 0.00, 20.00, 100.00, 7.50 | -0.20, 17.40, 100.40, 10.10 | -0.20, -2.60, 0.40, 2.60 | 1.5 | Cream visor over the raked windscreens; the model's reaches the 3.3 m crown (row 7), the BMP paints rows 8 to 10. |
