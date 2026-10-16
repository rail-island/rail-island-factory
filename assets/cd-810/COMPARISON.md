# CD 810 604-9 (red): native landmark comparison

**Covers** - the build `proc-vehicle-cd-810` {} against 17 boxes annotated on the native vlakosimdb BMPs (`native/cd_810_1/landmarks.json`).
**Code** - `generator/dmuComparison.ts`, `generator/dmuReport.ts`, `test/czechDmus.test.ts`
**See also** - [SOURCES.md](SOURCES.md), [docs/models/czech-dmus.md](../../docs/models/czech-dmus.md)

Model revision: `03acb6a` (measured when this file was written). Mapping: side column = 10 (x / 1.04824 + 6.65) (the XML body scaled to the published 13.103 m), row = 10 (4 - y); front column = 10 (1.5 - z), row = 10 (4 - y). Canvases: side 140 x 40 px (`native/cd_810_1/z_dec.bmp`), front 30 x 40 px (`native/cd_810_1/2x_both.bmp`).

Each vector is (left, top, width, height) in native pixels; percentages are 100*x/W, 100*y/H, 100*w/W, 100*h/H of the view's canvas, origin top left. Delta = model minus source in percentage points. MAE = sum(|delta|) / (4 * boxes). Model boxes are the bounds of the actual GLB vertices of the named scopes, projected orthographically with the documented scales undone, occluded vertices included.

| View | Boxes | MAE baseline (pp) | MAE now (pp) |
|---|---:|---:|---:|
| side | 10 | 0.07 | 0.08 |
| front | 7 | 2.05 | 1.71 |
| all | 17 | 0.89 | 0.75 |

| ID | View | Scope | Source px | Model px | Source % | Model % | Delta pp | Tolerance px | Note |
|---|---|---|---|---|---|---|---|---:|---|
| S01 | side | body/right-side/windows/window-1/frame | 22.00, 11.00, 14.00, 9.00 | 22.00, 11.00, 14.00, 9.00 | 15.71, 27.50, 10.00, 22.50 | 15.71, 27.50, 10.00, 22.50 | -0.00, -0.00, -0.00, 0.00 | 1.5 | First saloon window, light grey frame over the cream band. |
| S02 | side | body/right-side/windows/window-3/frame | 52.00, 11.00, 14.00, 9.00 | 52.00, 11.00, 14.00, 9.00 | 37.14, 27.50, 10.00, 22.50 | 37.14, 27.50, 10.00, 22.50 | -0.00, -0.00, 0.00, 0.00 | 1.5 | Third saloon window. |
| S03 | side | body/right-side/windows/window-6/frame | 97.00, 11.00, 14.00, 9.00 | 97.00, 11.00, 14.00, 9.00 | 69.29, 27.50, 10.00, 22.50 | 69.29, 27.50, 10.00, 22.50 | 0.00, -0.00, -0.00, 0.00 | 1.5 | Last saloon window. |
| S04 | side | body/right-side/windows/end-window-1/frame | 7.00, 11.00, 5.00, 9.00 | 7.00, 11.00, 5.00, 9.00 | 5.00, 27.50, 3.57, 22.50 | 5.00, 27.50, 3.57, 22.50 | -0.00, -0.00, 0.00, 0.00 | 1.5 | Cab-end window beside the -X door. |
| S05 | side | body/right-side/windows/end-window-2/frame | 122.00, 11.00, 5.00, 9.00 | 122.00, 11.00, 4.95, 9.00 | 87.14, 27.50, 3.57, 22.50 | 87.14, 27.50, 3.54, 22.50 | -0.00, -0.00, -0.03, 0.00 | 1.5 | Cab-end window beside the +X door. |
| S06 | side | body/right-side/doors/door-1/outline | 13.00, 10.00, 8.00, 25.00 | 13.00, 10.00, 8.00, 25.00 | 9.29, 25.00, 5.71, 62.50 | 9.29, 25.00, 5.71, 62.50 | -0.00, 0.00, 0.00, 0.00 | 1.5 | Folding door, olive frame above the band, dark red edges below; reaches the step at 0.5 m. |
| S07 | side | body/right-side/doors/door-2/outline | 112.00, 10.00, 8.00, 25.00 | 112.00, 10.00, 8.00, 25.00 | 80.00, 25.00, 5.71, 62.50 | 80.00, 25.00, 5.71, 62.50 | 0.00, 0.00, 0.00, 0.00 | 1.5 | As S06. |
| S08 | side | body/right-side/doors/door-1/glass/frame | 15.00, 12.00, 4.00, 8.00 | 15.00, 12.00, 4.00, 8.00 | 10.71, 30.00, 2.86, 20.00 | 10.71, 30.00, 2.86, 20.00 | -0.00, 0.00, 0.00, -0.00 | 1.5 | Door window. |
| S09 | side | body/right-side/emblem | 32.00, 23.00, 6.00, 4.00 | 32.36, 23.20, 4.36, 3.60 | 22.86, 57.50, 4.29, 10.00 | 23.11, 58.00, 3.12, 8.99 | 0.26, 0.50, -1.17, -1.01 | 1.5 | White CD emblem; the model draws the emblem 90 % of the box high at its proportions. |
| S10 | side | shell/cream-band, front-end/skin/cream-side, rear-end/skin/cream-side | 4.00, 10.00, 125.00, 11.00 | 4.00, 9.97, 125.00, 11.02 | 2.86, 25.00, 89.29, 27.50 | 2.86, 24.94, 89.29, 27.56 | 0.00, -0.06, -0.00, 0.06 | 1.5 | Cream window band 1.9 to 3.0 m from end wall to end wall; the body volume carries it between the cab ends' joins, each cab end's skin the last 0.13 to 0.21 m. |
| F01 | front | front-end/skin/pane-1-glass | 2.00, 13.00, 12.00, 7.00 | 2.23, 11.05, 11.63, 7.90 | 6.67, 32.50, 40.00, 17.50 | 7.43, 27.63, 38.77, 19.75 | 0.76, -4.87, -1.23, 2.25 | 1.5 | Left windscreen glass (seen from ahead). The model follows the photographs (PHOTOS.md): the panes run from the sill at 2.0 m to 2.9 m, 0.2 m taller than the BMP's rows 13 to 20. |
| F02 | front | front-end/skin/pane-2-glass | 18.00, 13.00, 12.00, 7.00 | 16.14, 11.05, 11.63, 7.90 | 60.00, 32.50, 40.00, 17.50 | 53.81, 27.63, 38.77, 19.75 | -6.19, -4.87, -1.23, 2.25 | 1.5 | Right windscreen glass; as F01, and the BMP runs it to the canvas edge. |
| F03 | front | front-end/lamps/left/housing | 0.00, 23.00, 6.00, 3.00 | 1.30, 23.00, 4.80, 3.00 | 0.00, 57.50, 20.00, 7.50 | 4.33, 57.50, 16.00, 7.50 | 4.33, -0.00, -4.00, 0.00 | 1.5 | Twin lamp housing on the yellow band (grey and white pixels); the model's protruding housing stands 0.13 m in from the corner as photographed. |
| F04 | front | front-end/lamps/right/housing | 24.00, 23.00, 6.00, 3.00 | 23.90, 23.00, 4.80, 3.00 | 80.00, 57.50, 20.00, 7.50 | 79.67, 57.50, 16.00, 7.50 | -0.33, -0.00, -4.00, 0.00 | 1.5 | As F03. |
| F05 | front | front-end/skin/front-band | 0.00, 23.00, 30.00, 3.00 | 0.00, 23.00, 30.00, 3.00 | 0.00, 57.50, 100.00, 7.50 | 0.00, 57.50, 100.00, 7.50 | 0.00, 0.00, 0.00, -0.00 | 1.01 | Yellow front band 1.4 to 1.7 m (XML `light` clip). |
| F06 | front | front-end/lamps/top/housing | 12.00, 8.00, 6.00, 3.00 | 12.60, 7.61, 4.80, 2.04 | 40.00, 20.00, 20.00, 7.50 | 42.00, 19.02, 16.00, 5.10 | 2.00, -0.98, -4.00, -2.40 | 1.5 | Twin top lamps in their black oval housing on the roof cap. |
| F07 | front | front-end/skin/front-upper, front-end/skin/cream-side | 0.00, 8.00, 30.00, 13.00 | 0.00, 7.55, 30.00, 13.45 | 0.00, 20.00, 100.00, 32.50 | 0.00, 18.87, 100.00, 33.63 | 0.00, -1.13, 0.00, 1.13 | 1.5 | Cream upper face and the corners' cream band, from the windscreens' sill (row 20) to the roof cap (row 8). Re-annotated: the earlier box (rows 8 to 10) took only the strip over the windscreens, which no longer is a separate visor part; the model's cap reaches the 3.3 m crown (row 7). |
