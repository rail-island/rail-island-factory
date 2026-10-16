# CD 110 046-0: native landmark comparison

**Covers** - the default build of `veh-cd-110` against 16 boxes annotated on the native vlakosimdb BMPs (`native/landmarks.json`).
**Code** - `generator/czElectricComparison.ts`, `generator/czElectricReport.ts`, `test/czElectrics.test.ts`
**See also** - [SOURCES.md](SOURCES.md), [docs/models/cz-electrics.md](../../docs/models/cz-electrics.md)

Model revision: `b73f62f` (measured when this file was written). Mapping: side column px = 72 - 10 x, row = 10 (6 - y); front column = 10 (1.5 - z). Canvases: x_front 30 x 60 px (`native/cd_110_046/x_both.bmp`), z_right 144 x 60 px (`native/cd_110_046/z_both.bmp`).

Each vector is (left, top, width, height) in native pixels; percentages are 100*x/W, 100*y/H, 100*w/W, 100*h/H of the view's canvas, origin top left. Delta = model minus source in percentage points. MAE = sum(|delta|) / (4 * boxes). Model boxes are the bounds of the actual GLB vertices of the named scopes, occluded vertices included.

| View | Boxes | MAE baseline (pp) | MAE now (pp) |
|---|---:|---:|---:|
| x_front | 7 | 0.90 | 0.90 |
| z_right | 9 | 0.45 | 0.45 |
| all | 16 | 0.65 | 0.65 |

| ID | View | Element | Source px | Model px | Source % | Model % | Delta pp | Tolerance px | Note |
|---|---|---|---|---|---|---|---|---:|---|
| F01 | x_front | cab/front-windows/right | 2.00, 18.00, 12.00, 9.00 | 2.50, 18.00, 12.10, 9.00 | 6.67, 30.00, 40.00, 15.00 | 8.33, 30.00, 40.33, 15.00 | 1.67, 0.00, 0.33, -0.00 | 1.5 | Cab front window over the hood, frame and glass; the native window is drawn 0.2 m taller, the model's cab roof is held at 4.3 m for the published 4.65 m folded height. |
| F02 | x_front | cab/front-windows/left | 16.00, 18.00, 13.00, 9.00 | 15.40, 18.00, 12.10, 9.00 | 53.33, 30.00, 43.33, 15.00 | 51.33, 30.00, 40.33, 15.00 | -2.00, 0.00, -3.00, -0.00 | 1.5 | As F01, the other pane. |
| F03 | x_front | cab/shell/front/band-3 | 0.00, 15.00, 30.00, 12.00 | 0.00, 17.00, 30.00, 11.00 | 0.00, 25.00, 100.00, 20.00 | 0.00, 28.33, 100.00, 18.33 | 0.00, 3.33, 0.00, -1.67 | 2.5 | The cream upper cab; the native cab top stands at 4.5 m, the model's at 4.3 m (deliberate, see F01). |
| F04 | x_front | front-hood/hood/front/band-1 | 4.00, 34.00, 22.00, 4.00 | 4.00, 34.00, 22.00, 4.00 | 13.33, 56.67, 73.33, 6.67 | 13.33, 56.67, 73.33, 6.67 | -0.00, 0.00, 0.00, -0.00 | 1.01 | The cream band across the hood end, 2.2 to 2.6 m. |
| F05 | x_front | front-hood/hood-end/number-plate | 11.00, 41.00, 8.00, 3.00 | 11.00, 41.00, 8.00, 3.00 | 36.67, 68.33, 26.67, 5.00 | 36.67, 68.33, 26.67, 5.00 | -0.00, 0.00, 0.00, -0.00 | 1.01 | Black plate frame with the number; +/- one pixel. |
| F06 | x_front | front-hood/hood-end/lamps/right-lamp | 5.00, 43.00, 3.00, 3.00 | 5.40, 43.40, 2.20, 2.20 | 16.67, 71.67, 10.00, 5.00 | 18.00, 72.33, 7.33, 3.67 | 1.33, 0.67, -2.67, -1.33 | 1.01 | Low marker lamp, the 3 x 3 px lens with its ring. |
| F07 | x_front | underframe/front-end/plough | 2.00, 52.00, 26.00, 6.00 | 2.50, 50.80, 25.00, 6.20 | 6.67, 86.67, 86.67, 10.00 | 8.33, 84.67, 83.33, 10.33 | 1.67, -2.00, -3.33, 0.33 | 1.5 | The yellow buffer-beam skirt; the native paints two blocks under the buffers, the model one plate. |
| S01 | z_right | cab/right-side/windows/window-4 | 61.00, 18.00, 3.00, 9.00 | 60.80, 18.00, 3.40, 9.00 | 42.36, 30.00, 2.08, 15.00 | 42.22, 30.00, 2.36, 15.00 | -0.14, 0.00, 0.28, -0.00 | 1.5 | Narrow cab side window toward the front hood. |
| S02 | z_right | cab/right-side/windows/window-3 | 66.00, 18.00, 6.00, 9.00 | 65.00, 18.00, 6.00, 9.00 | 45.83, 30.00, 4.17, 15.00 | 45.14, 30.00, 4.17, 15.00 | -0.69, 0.00, -0.00, -0.00 | 1.5 | Cab side window; the native cab is drawn 0.1 m off centre, the model keeps it symmetric. |
| S03 | z_right | cab/right-side/windows/window-2 | 74.00, 18.00, 6.00, 9.00 | 73.00, 18.00, 6.00, 9.00 | 51.39, 30.00, 4.17, 15.00 | 50.69, 30.00, 4.17, 15.00 | -0.69, 0.00, -0.00, -0.00 | 1.5 | As S02. |
| S04 | z_right | cab/right-side/windows/window-1 | 81.00, 18.00, 3.00, 9.00 | 79.80, 18.00, 3.40, 9.00 | 56.25, 30.00, 2.08, 15.00 | 55.42, 30.00, 2.36, 15.00 | -0.83, 0.00, 0.28, -0.00 | 1.5 | As S01, toward the rear hood. |
| S05 | z_right | cab/right-side/door | 63.00, 29.00, 9.00, 16.00 | 62.04, 28.60, 9.92, 16.90 | 43.75, 48.33, 6.25, 26.67 | 43.08, 47.67, 6.89, 28.17 | -0.67, -0.67, 0.64, 1.50 | 1.5 | The cab door's seams between native columns 63 and 71, rows 29-44; the handrails stand just outside it. |
| S06 | z_right | cab/right-side/number-plate | 75.00, 35.00, 9.00, 3.00 | 75.00, 35.00, 9.00, 3.00 | 52.08, 58.33, 6.25, 5.00 | 52.08, 58.33, 6.25, 5.00 | 0.00, 0.00, 0.00, -0.00 | 1.01 | Black side plate; +/- one pixel. |
| S07 | z_right | front-hood/right-louvres/louvre-9 | 49.00, 29.00, 8.00, 16.00 | 50.00, 30.00, 7.00, 15.00 | 34.03, 48.33, 5.56, 26.67 | 34.72, 50.00, 4.86, 25.00 | 0.69, 1.67, -0.69, -1.67 | 1.5 | Tall louvre on the full-width block beside the cab. |
| S08 | z_right | front-hood/right-louvres/louvre-4 | 20.00, 29.00, 7.00, 5.00 | 20.00, 29.20, 6.00, 4.00 | 13.89, 48.33, 4.86, 8.33 | 13.89, 48.67, 4.17, 6.67 | 0.00, 0.33, -0.69, -1.67 | 1.5 | Outermost upper hood louvre over the cream band. |
| S09 | z_right | front-hood/right-louvres/louvre-8 | 27.00, 38.00, 7.00, 7.00 | 27.00, 38.00, 6.00, 6.00 | 18.75, 63.33, 4.86, 11.67 | 18.75, 63.33, 4.17, 10.00 | 0.00, -0.00, -0.69, -1.67 | 1.5 | Lower louvre on the cabinet under the ramp. |
