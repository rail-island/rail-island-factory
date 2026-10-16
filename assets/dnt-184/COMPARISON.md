# DNT 184 503: native landmark comparison

**Covers** - the default build of `veh-dnt-184-5` against 15 boxes annotated on the native vlakosimdb BMPs (`native/landmarks.json`).
**Code** - `generator/mainlineComparison.ts`, `generator/mainlineReport.ts`, `test/mainlineElectrics.test.ts`
**See also** - [SOURCES.md](SOURCES.md), [docs/models/mainline-electrics.md](../../docs/models/mainline-electrics.md)

Model revision: `a9eb5f3` (measured when this file was written). Mapping: side column px = 101.5 - 10 x, row = 10 (6 - y); front column = 10 (1.5 - z). Canvases: x_front 30 x 60 px (`native/dnt_184.5/x_both.bmp`), z_right 204 x 60 px (`native/dnt_184.5/z_dec.bmp`).

Each vector is (left, top, width, height) in native pixels; percentages are 100*x/W, 100*y/H, 100*w/W, 100*h/H of the view's canvas, origin top left. Delta = model minus source in percentage points. MAE = sum(|delta|) / (4 * boxes). Model boxes are the bounds of the actual GLB vertices of the named scopes, occluded vertices included.

| View | Boxes | MAE baseline (pp) | MAE now (pp) |
|---|---:|---:|---:|
| x_front | 6 | 0.63 | 0.63 |
| z_right | 9 | 0.21 | 0.11 |
| all | 15 | 0.37 | 0.32 |

| ID | View | Element | Source px | Model px | Source % | Model % | Delta pp | Tolerance px | Note |
|---|---|---|---|---|---|---|---|---:|---|
| F01 | x_front | front-cab/windscreen-right/frame | 1.00, 25.00, 13.00, 9.00 | 1.00, 25.00, 13.00, 9.00 | 3.33, 41.67, 43.33, 15.00 | 3.33, 41.67, 43.33, 15.00 | 0.00, 0.00, -0.00, 0.00 | 1.5 | Left windscreen seen from ahead. |
| F02 | x_front | front-cab/windscreen-left/frame | 16.00, 25.00, 13.00, 9.00 | 16.00, 25.00, 13.00, 9.00 | 53.33, 41.67, 43.33, 15.00 | 53.33, 41.67, 43.33, 15.00 | 0.00, 0.00, -0.00, 0.00 | 1.5 | Right windscreen seen from ahead. |
| F03 | x_front | front-cab/headlight-panel | 11.00, 35.00, 7.00, 3.00 | 11.50, 35.00, 7.00, 3.00 | 36.67, 58.33, 23.33, 5.00 | 38.33, 58.33, 23.33, 5.00 | 1.67, 0.00, -0.00, -0.00 | 1.01 | The grey panel round the twin headlight. |
| F04 | x_front | body/shell/front/band-1, body/shell/side-right/band-1, body/shell/side-left/band-1 | 0.00, 38.00, 30.00, 6.00 | 0.00, 38.00, 30.00, 6.00 | 0.00, 63.33, 100.00, 10.00 | 0.00, 63.33, 100.00, 10.00 | 0.00, -0.00, 0.00, 0.00 | 1.5 | Cream band across the end, rows 38-43; the chamfered corners carry the side bands. |
| F05 | x_front | front-cab/number-plate | 12.00, 47.00, 6.00, 2.00 | 11.50, 46.00, 7.00, 2.00 | 40.00, 78.33, 20.00, 3.33 | 38.33, 76.67, 23.33, 3.33 | -1.67, -1.67, 3.33, -0.00 | 1.5 | Red plate low on the end. |
| F06 | x_front | front-cab/lamp-left | 27.00, 44.00, 3.00, 2.00 | 27.50, 43.00, 2.00, 2.00 | 90.00, 73.33, 10.00, 3.33 | 91.67, 71.67, 6.67, 3.33 | 1.67, -1.67, -3.33, 0.00 | 1.5 | White marker lamp, 3 x 2 px: position only. |
| S01 | z_right | sides/right-side/window-1/frame | 48.00, 26.00, 13.00, 10.00 | 48.00, 26.00, 13.00, 10.00 | 23.53, 43.33, 6.37, 16.67 | 23.53, 43.33, 6.37, 16.67 | 0.00, -0.00, -0.00, 0.00 | 1.01 | Large machine-room window. |
| S02 | z_right | sides/right-side/window-2/frame | 78.00, 28.00, 11.00, 8.00 | 78.00, 28.00, 11.00, 8.00 | 38.24, 46.67, 5.39, 13.33 | 38.24, 46.67, 5.39, 13.33 | 0.00, -0.00, -0.00, -0.00 | 1.01 | Small divided window. |
| S03 | z_right | sides/right-side/window-3/frame | 114.00, 28.00, 11.00, 8.00 | 114.00, 28.00, 11.00, 8.00 | 55.88, 46.67, 5.39, 13.33 | 55.88, 46.67, 5.39, 13.33 | 0.00, -0.00, -0.00, -0.00 | 1.01 | Small divided window. |
| S04 | z_right | sides/right-side/window-4/frame | 142.00, 26.00, 13.00, 10.00 | 142.00, 26.00, 13.00, 10.00 | 69.61, 43.33, 6.37, 16.67 | 69.61, 43.33, 6.37, 16.67 | 0.00, -0.00, -0.00, 0.00 | 1.01 | Large machine-room window. |
| S05 | z_right | sides/right-side/door-front/seams | 17.00, 25.00, 8.00, 23.00 | 17.50, 25.50, 7.50, 22.50 | 8.33, 41.67, 3.92, 38.33 | 8.58, 42.50, 3.68, 37.50 | 0.25, 0.83, -0.25, -0.83 | 1.5 | Cab door between the handrails; its outline is faint. |
| S06 | z_right | body/shell/side-right/band-1 | 5.00, 38.00, 193.00, 6.00 | 5.20, 38.00, 192.60, 6.00 | 2.45, 63.33, 94.61, 10.00 | 2.55, 63.33, 94.41, 10.00 | 0.10, -0.00, -0.20, 0.00 | 2 | Cream band; its ends follow the raked nose. |
| S07 | z_right | sides/right-side/number-plate | 97.00, 40.00, 9.00, 2.00 | 97.00, 39.80, 9.00, 2.40 | 47.55, 66.67, 4.41, 3.33 | 47.55, 66.33, 4.41, 4.00 | 0.00, -0.33, -0.00, 0.67 | 1.01 | Yellow number plate. |
| S08 | z_right | roof-equipment/middle-cover | 89.00, 14.00, 25.00, 6.00 | 89.00, 14.00, 25.00, 6.20 | 43.63, 23.33, 12.25, 10.00 | 43.63, 23.33, 12.25, 10.33 | 0.00, 0.00, 0.00, 0.33 | 1.01 | The middle roof cover. |
| S09 | z_right | roof-equipment/front-cover | 61.00, 15.00, 28.00, 5.00 | 61.00, 15.00, 28.00, 5.20 | 29.90, 25.00, 13.73, 8.33 | 29.90, 25.00, 13.73, 8.67 | -0.00, 0.00, 0.00, 0.33 | 1.01 | The front roof cover. |
