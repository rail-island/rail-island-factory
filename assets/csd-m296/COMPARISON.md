# CSD M 296.1028: native landmark comparison

**Covers** - the build `veh-csd-m296` {} against 15 boxes annotated on the native vlakosimdb BMPs (`native/csd_m296/landmarks.json`).
**Code** - `generator/dmuComparison.ts`, `generator/dmuReport.ts`, `test/czechDmus.test.ts`
**See also** - [SOURCES.md](SOURCES.md), [docs/models/czech-dmus.md](../../docs/models/czech-dmus.md)

Model revision: `d8ba830` (measured when this file was written). Mapping: side column = 10 (x / 1.00772 + 12.45) (the XML scaled to the published 24.79 m over the buffers), row = 10 (5 - y); front column = 10 (1.5 - z), row = 10 (5 - y). Canvases: side 250 x 50 px (`native/csd_m296/z_both.bmp`), front 30 x 50 px (`native/csd_m296/x_dec.bmp`).

Each vector is (left, top, width, height) in native pixels; percentages are 100*x/W, 100*y/H, 100*w/W, 100*h/H of the view's canvas, origin top left. Delta = model minus source in percentage points. MAE = sum(|delta|) / (4 * boxes). Model boxes are the bounds of the actual GLB vertices of the named scopes, projected orthographically with the documented scales undone, occluded vertices included.

| View | Boxes | MAE baseline (pp) | MAE now (pp) |
|---|---:|---:|---:|
| side | 10 | 0.17 | 0.17 |
| front | 5 | 0.71 | 0.71 |
| all | 15 | 0.35 | 0.35 |

| ID | View | Scope | Source px | Model px | Source % | Model % | Delta pp | Tolerance px | Note |
|---|---|---|---|---|---|---|---|---:|---|
| S01 | side | body/right-side/windows/window-1/frame | 28.00, 20.00, 13.00, 10.00 | 28.00, 20.00, 13.00, 10.00 | 11.20, 40.00, 5.20, 20.00 | 11.20, 40.00, 5.20, 20.00 | 0.00, 0.00, -0.00, 0.00 | 1.5 | First window, grey frame with sash bar. |
| S02 | side | body/right-side/windows/window-3/frame | 111.00, 20.00, 13.00, 10.00 | 111.00, 20.00, 13.00, 10.00 | 44.40, 40.00, 5.20, 20.00 | 44.40, 40.00, 5.20, 20.00 | 0.00, 0.00, -0.00, 0.00 | 1.5 | Saloon window. |
| S03 | side | body/right-side/windows/window-8/frame | 201.00, 20.00, 13.00, 10.00 | 201.00, 20.00, 13.00, 10.00 | 80.40, 40.00, 5.20, 20.00 | 80.40, 40.00, 5.20, 20.00 | 0.00, 0.00, -0.00, 0.00 | 1.5 | Last saloon window. |
| S04 | side | body/right-side/windows/small-window-1/frame | 88.00, 20.00, 7.00, 10.00 | 88.00, 20.00, 7.00, 10.00 | 35.20, 40.00, 2.80, 20.00 | 35.20, 40.00, 2.80, 20.00 | 0.00, 0.00, -0.00, 0.00 | 1.5 | Small window. |
| S05 | side | body/right-side/windows/cab-window-1/frame | 228.00, 19.00, 6.00, 10.00 | 228.00, 19.00, 6.00, 10.00 | 91.20, 38.00, 2.40, 20.00 | 91.20, 38.00, 2.40, 20.00 | 0.00, 0.00, 0.00, 0.00 | 1.5 | Cab side window at +X. |
| S06 | side | body/right-side/doors/door-2/outline | 71.00, 20.00, 13.00, 19.00 | 71.00, 20.00, 13.00, 19.00 | 28.40, 40.00, 5.20, 38.00 | 28.40, 40.00, 5.20, 38.00 | -0.00, 0.00, -0.00, -0.00 | 1.5 | Luggage double door with two narrow windows; lower edge estimated. |
| S07 | side | body/right-side/doors/door-3/outline | 94.00, 18.00, 7.00, 22.00 | 93.50, 18.50, 8.00, 21.50 | 37.60, 36.00, 2.80, 44.00 | 37.40, 37.00, 3.20, 43.00 | -0.20, 1.00, 0.40, -1.00 | 1.5 | Passenger door, edges at columns 94 and 100. |
| S08 | side | body/right-side/doors/door-4/outline | 216.00, 18.00, 8.00, 22.00 | 216.00, 18.50, 8.00, 21.50 | 86.40, 36.00, 3.20, 44.00 | 86.40, 37.00, 3.20, 43.00 | -0.00, 1.00, 0.00, -1.00 | 1.5 | Passenger door near +X. |
| S09 | side | shell/cream-band | 6.00, 19.00, 237.00, 12.00 | 6.00, 17.97, 237.00, 12.00 | 2.40, 38.00, 94.80, 24.00 | 2.40, 35.95, 94.80, 24.00 | -0.00, -2.05, 0.00, 0.00 | 1.5 | Cream window band 2.0 to 3.2 m (rows 19 to 30). |
| S10 | side | body/right-side/radiator-grille | 21.00, 12.00, 31.00, 6.00 | 21.00, 12.00, 31.00, 6.00 | 8.40, 24.00, 12.40, 12.00 | 8.40, 24.00, 12.40, 12.00 | -0.00, 0.00, 0.00, -0.00 | 1.5 | Radiator grille on the roof's side slope (XML `roof` clip 2.3 to 5.2 m). |
| F01 | front | front-end/window-1 | 0.00, 18.00, 8.00, 11.00 | 0.50, 18.50, 7.50, 10.50 | 0.00, 36.00, 26.67, 22.00 | 1.67, 37.00, 25.00, 21.00 | 1.67, 1.00, -1.67, -1.00 | 1.5 | Left cab window. |
| F02 | front | front-end/window-2 | 22.00, 18.00, 8.00, 11.00 | 22.00, 18.50, 7.50, 10.50 | 73.33, 36.00, 26.67, 22.00 | 73.33, 37.00, 25.00, 21.00 | -0.00, 1.00, -1.67, -1.00 | 1.5 | Right cab window. |
| F03 | front | front-end/gangway-door-1 | 8.00, 18.00, 14.00, 13.00 | 8.50, 18.05, 13.00, 12.95 | 26.67, 36.00, 46.67, 26.00 | 28.33, 36.10, 43.33, 25.90 | 1.67, 0.10, -3.33, -0.10 | 1.5 | Gangway door pair with its frame. |
| F04 | front | front-end/lamp-1 | 2.00, 33.00, 6.00, 3.00 | 2.00, 33.00, 6.00, 3.00 | 6.67, 66.00, 20.00, 6.00 | 6.67, 66.00, 20.00, 6.00 | 0.00, -0.00, -0.00, 0.00 | 1.5 | Lamp housing. |
| F05 | front | front-end/lamp-2 | 22.00, 33.00, 6.00, 3.00 | 22.00, 33.00, 6.00, 3.00 | 73.33, 66.00, 20.00, 6.00 | 73.33, 66.00, 20.00, 6.00 | -0.00, -0.00, -0.00, 0.00 | 1.5 | As F04. |
