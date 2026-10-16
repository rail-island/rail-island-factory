# CD 843 024-1 (motor car): native landmark comparison

**Covers** - the build `veh-cd-843` {} against 15 boxes annotated on the native vlakosimdb BMPs (`native/cd_843/landmarks.json`).
**Code** - `generator/dmuComparison.ts`, `generator/dmuReport.ts`, `test/czechDmus.test.ts`
**See also** - [SOURCES.md](SOURCES.md), [docs/models/czech-dmus.md](../../docs/models/czech-dmus.md)

Model revision: `979f87d` (measured when this file was written). Mapping: side column = 10 (x + 12.05) (unscaled: the XML's 24.1 m body is the published one), row = 10 (5 - y); front column = 10 (1.5 - z), row = 10 (5 - y). Canvases: side 250 x 50 px (`native/cd_843/843_z_both.bmp`), front 30 x 50 px (`native/cd_843/843_x_both.bmp`).

Each vector is (left, top, width, height) in native pixels; percentages are 100*x/W, 100*y/H, 100*w/W, 100*h/H of the view's canvas, origin top left. Delta = model minus source in percentage points. MAE = sum(|delta|) / (4 * boxes). Model boxes are the bounds of the actual GLB vertices of the named scopes, projected orthographically with the documented scales undone, occluded vertices included.

| View | Boxes | MAE baseline (pp) | MAE now (pp) |
|---|---:|---:|---:|
| side | 10 | 0.00 | 0.00 |
| front | 5 | 0.63 | 0.03 |
| all | 15 | 0.21 | 0.01 |

| ID | View | Scope | Source px | Model px | Source % | Model % | Delta pp | Tolerance px | Note |
|---|---|---|---|---|---|---|---|---:|---|
| S01 | side | body/right-side/windows/window-1/frame | 74.00, 22.00, 13.00, 11.00 | 74.00, 22.00, 13.00, 11.00 | 29.60, 44.00, 5.20, 22.00 | 29.60, 44.00, 5.20, 22.00 | -0.00, 0.00, 0.00, -0.00 | 1.5 | First saloon window, grey frame with a sash bar. |
| S02 | side | body/right-side/windows/window-5/frame | 138.00, 22.00, 13.00, 11.00 | 138.00, 22.00, 13.00, 11.00 | 55.20, 44.00, 5.20, 22.00 | 55.20, 44.00, 5.20, 22.00 | 0.00, 0.00, -0.00, -0.00 | 1.5 | Fifth saloon window. |
| S03 | side | body/right-side/windows/window-7/frame | 208.00, 22.00, 13.00, 11.00 | 208.00, 22.00, 13.00, 11.00 | 83.20, 44.00, 5.20, 22.00 | 83.20, 44.00, 5.20, 22.00 | 0.00, 0.00, 0.00, -0.00 | 1.5 | Last saloon window. |
| S04 | side | body/right-side/windows/toilet-window-1/frame | 44.00, 22.00, 7.00, 11.00 | 44.00, 22.00, 7.00, 11.00 | 17.60, 44.00, 2.80, 22.00 | 17.60, 44.00, 2.80, 22.00 | -0.00, 0.00, 0.00, -0.00 | 1.5 | Toilet window. |
| S05 | side | body/right-side/windows/high-window-1/frame | 182.00, 26.00, 7.00, 7.00 | 182.00, 26.00, 7.00, 7.00 | 72.80, 52.00, 2.80, 14.00 | 72.80, 52.00, 2.80, 14.00 | 0.00, -0.00, -0.00, 0.00 | 1.5 | High small window; frame colour estimated. |
| S06 | side | body/right-side/windows/cab-window-1/frame | 0.00, 20.00, 6.00, 9.00 | 0.05, 20.00, 5.95, 9.00 | 0.00, 40.00, 2.40, 18.00 | 0.02, 40.00, 2.38, 18.00 | 0.02, 0.00, -0.02, 0.00 | 1.5 | Cab side window at the -X end. |
| S07 | side | body/right-side/doors/door-3/outline | 18.00, 20.00, 11.00, 21.00 | 18.00, 20.00, 11.00, 21.00 | 7.20, 40.00, 4.40, 42.00 | 7.20, 40.00, 4.40, 42.00 | 0.00, 0.00, 0.00, 0.00 | 1.5 | Double door behind the -X cab (dark red edges). |
| S08 | side | body/right-side/doors/door-4/outline | 61.00, 21.00, 9.00, 26.00 | 61.00, 21.00, 9.00, 26.00 | 24.40, 42.00, 3.60, 52.00 | 24.40, 42.00, 3.60, 52.00 | 0.00, -0.00, -0.00, 0.00 | 1.5 | Single door; reaches below the floor to the step. |
| S09 | side | body/right-side/doors/door-5/outline | 155.00, 21.00, 17.00, 26.00 | 155.00, 21.00, 17.00, 26.00 | 62.00, 42.00, 6.80, 52.00 | 62.00, 42.00, 6.80, 52.00 | 0.00, -0.00, 0.00, 0.00 | 1.5 | Double door. |
| S10 | side | shell/cream-band | 0.00, 34.00, 241.00, 6.00 | -0.00, 33.98, 241.00, 6.00 | 0.00, 68.00, 96.40, 12.00 | -0.00, 67.95, 96.40, 12.00 | -0.00, -0.05, 0.00, -0.00 | 1.5 | Cream band 1.0 to 1.6 m. |
| F01 | front | front-end/cab/window-1 | 2.00, 17.00, 7.00, 12.00 | 2.00, 17.00, 7.00, 12.00 | 6.67, 34.00, 23.33, 24.00 | 6.67, 34.00, 23.33, 24.00 | 0.00, 0.00, -0.00, 0.00 | 1.5 | Left front window. |
| F02 | front | front-end/cab/window-2 | 21.00, 17.00, 7.00, 12.00 | 21.00, 17.00, 7.00, 12.00 | 70.00, 34.00, 23.33, 24.00 | 70.00, 34.00, 23.33, 24.00 | 0.00, 0.00, -0.00, 0.00 | 1.5 | Right front window. |
| F03 | front | front-end/cab/door-outline-1 | 11.00, 17.00, 8.00, 23.00 | 11.00, 17.00, 8.00, 23.00 | 36.67, 34.00, 26.67, 46.00 | 36.67, 34.00, 26.67, 46.00 | -0.00, 0.00, 0.00, -0.00 | 1.5 | Front door with its frame. |
| F04 | front | front-end/cab/lamp-1 | 1.00, 34.00, 4.00, 6.00 | 1.05, 34.00, 3.95, 6.00 | 3.33, 68.00, 13.33, 12.00 | 3.50, 68.00, 13.17, 12.00 | 0.17, -0.00, -0.17, 0.00 | 1.5 | Lamp housing on the cream band. |
| F05 | front | front-end/cab/lamp-2 | 25.00, 34.00, 4.00, 6.00 | 25.00, 34.00, 3.95, 6.00 | 83.33, 68.00, 13.33, 12.00 | 83.33, 68.00, 13.17, 12.00 | 0.00, -0.00, -0.17, 0.00 | 1.5 | As F04. |
