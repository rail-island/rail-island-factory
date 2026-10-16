# CSD M 131.1238 (motor car): native landmark comparison

**Covers** - the build `veh-csd-m131` {} against 12 boxes annotated on the native vlakosimdb BMPs (`native/csd_m131/landmarks.json`).
**Code** - `generator/dmuComparison.ts`, `generator/dmuReport.ts`, `test/czechDmus.test.ts`
**See also** - [SOURCES.md](SOURCES.md), [docs/models/czech-dmus.md](../../docs/models/czech-dmus.md)

Model revision: `d8ba830` (measured when this file was written). Mapping: side column = 10 (x / 1.05217 + 5.85) (the XML scaled to the published 12.1 m over the buffers), row = 10 (5 - y); front column = 10 (1.5 - z), row = 10 (5 - y). Canvases: side 140 x 50 px (`native/csd_m131/z_both.bmp`), front 30 x 50 px (`native/csd_m131/x_both.bmp`).

Each vector is (left, top, width, height) in native pixels; percentages are 100*x/W, 100*y/H, 100*w/W, 100*h/H of the view's canvas, origin top left. Delta = model minus source in percentage points. MAE = sum(|delta|) / (4 * boxes). Model boxes are the bounds of the actual GLB vertices of the named scopes, projected orthographically with the documented scales undone, occluded vertices included.

| View | Boxes | MAE baseline (pp) | MAE now (pp) |
|---|---:|---:|---:|
| side | 8 | 0.13 | 0.02 |
| front | 4 | 1.50 | 0.63 |
| all | 12 | 0.59 | 0.22 |

| ID | View | Scope | Source px | Model px | Source % | Model % | Delta pp | Tolerance px | Note |
|---|---|---|---|---|---|---|---|---:|---|
| S01 | side | body/right-side/windows/window-1/frame | 21.00, 23.00, 9.00, 9.00 | 21.00, 23.00, 9.00, 9.00 | 15.00, 46.00, 6.43, 18.00 | 15.00, 46.00, 6.43, 18.00 | -0.00, -0.00, 0.00, 0.00 | 1.5 | First saloon window, grey frame. |
| S02 | side | body/right-side/windows/window-3/frame | 49.00, 23.00, 9.00, 9.00 | 49.00, 23.00, 9.00, 9.00 | 35.00, 46.00, 6.43, 18.00 | 35.00, 46.00, 6.43, 18.00 | -0.00, -0.00, 0.00, 0.00 | 1.5 | Third window. |
| S03 | side | body/right-side/windows/window-5/frame | 77.00, 23.00, 9.00, 9.00 | 77.00, 23.00, 9.00, 9.00 | 55.00, 46.00, 6.43, 18.00 | 55.00, 46.00, 6.43, 18.00 | 0.00, -0.00, -0.00, 0.00 | 1.5 | Fifth window. |
| S04 | side | body/right-side/windows/end-window-1/frame | 100.00, 23.00, 7.00, 9.00 | 100.00, 23.00, 7.00, 9.00 | 71.43, 46.00, 5.00, 18.00 | 71.43, 46.00, 5.00, 18.00 | 0.00, -0.00, -0.00, 0.00 | 1.5 | Window beyond the +X door. |
| S05 | side | body/right-side/doors/door-1/outline | 10.00, 23.00, 8.00, 19.00 | 10.00, 23.00, 8.00, 18.95 | 7.14, 46.00, 5.71, 38.00 | 7.14, 46.00, 5.71, 37.90 | -0.00, -0.00, 0.00, -0.10 | 1.5 | Door near the -X end, dark red outline. |
| S06 | side | body/right-side/doors/door-2/outline | 90.00, 23.00, 8.00, 19.00 | 90.00, 23.00, 8.00, 18.95 | 64.29, 46.00, 5.71, 38.00 | 64.29, 46.00, 5.71, 37.90 | -0.00, -0.00, 0.00, -0.10 | 1.5 | Door near the +X end. |
| S07 | side | body/right-side/doors/door-1/glass/frame | 12.00, 25.00, 4.00, 7.00 | 12.00, 25.00, 4.00, 7.00 | 8.57, 50.00, 2.86, 14.00 | 8.57, 50.00, 2.86, 14.00 | 0.00, 0.00, -0.00, 0.00 | 1.5 | Door window. |
| S08 | side | roof-equipment/radiator | 26.00, 15.00, 69.00, 2.00 | 26.00, 15.00, 69.00, 2.20 | 18.57, 30.00, 49.29, 4.00 | 18.57, 30.00, 49.29, 4.40 | 0.00, 0.00, -0.00, 0.40 | 1.5 | Roof radiator, seen over the roof edge; the BMP draws it to 9.5 m, the XML `str` clip to 9.0 m (the model follows the BMP). |
| F01 | front | front-end/fittings/window-1 | 3.00, 23.00, 8.00, 9.00 | 3.00, 23.00, 8.00, 9.00 | 10.00, 46.00, 26.67, 18.00 | 10.00, 46.00, 26.67, 18.00 | -0.00, -0.00, 0.00, 0.00 | 1.5 | Left end window, wrapping round the rounded end. |
| F02 | front | front-end/fittings/window-2 | 19.00, 23.00, 8.00, 9.00 | 19.00, 23.00, 8.00, 9.00 | 63.33, 46.00, 26.67, 18.00 | 63.33, 46.00, 26.67, 18.00 | 0.00, -0.00, 0.00, 0.00 | 1.5 | Right end window. |
| F03 | front | front-end/end-door | 12.00, 23.00, 6.00, 18.00 | 12.00, 22.50, 6.00, 18.50 | 40.00, 46.00, 20.00, 36.00 | 40.00, 45.00, 20.00, 37.00 | -0.00, -1.00, 0.00, 1.00 | 1.5 | End door standing proud of the rounded end (XML `dve` clip, 0.9 to 2.3 m), carried up to the BMP frame at 2.75 m. |
| F04 | front | front-end/fittings/lamp-1 | 4.00, 37.00, 2.00, 2.00 | 3.50, 36.50, 3.00, 3.00 | 13.33, 74.00, 6.67, 4.00 | 11.67, 73.00, 10.00, 6.00 | -1.67, -1.00, 3.33, 2.00 | 1.5 | White lamp, a 2 x 2 px patch; the model's housing is 0.3 m. |
