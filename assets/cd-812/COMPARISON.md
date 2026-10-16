# CD 812 613-8 (motor car): native landmark comparison

**Covers** - the build `proc-vehicle-cd-812` {} against 11 boxes annotated on the native vlakosimdb BMPs (`native/cd_812_613/landmarks.json`).
**Code** - `generator/dmuComparison.ts`, `generator/dmuReport.ts`, `test/czechDmus.test.ts`
**See also** - [SOURCES.md](SOURCES.md), [docs/models/czech-dmus.md](../../docs/models/czech-dmus.md)

Model revision: `03acb6a` (measured when this file was written). Mapping: side column = 10 (x / 0.96467 + 7.5) (the XML scaled to the published 14.47 m over the buffers), row = 10 (6 - y); the front is compared with photographs, not the BMP. Canvases: side 160 x 60 px (`native/cd_812_613/z_dec.bmp`).

Each vector is (left, top, width, height) in native pixels; percentages are 100*x/W, 100*y/H, 100*w/W, 100*h/H of the view's canvas, origin top left. Delta = model minus source in percentage points. MAE = sum(|delta|) / (4 * boxes). Model boxes are the bounds of the actual GLB vertices of the named scopes, projected orthographically with the documented scales undone, occluded vertices included.

| View | Boxes | MAE baseline (pp) | MAE now (pp) |
|---|---:|---:|---:|
| side | 11 | 1.16 | 0.20 |
| all | 11 | 1.16 | 0.20 |

| ID | View | Scope | Source px | Model px | Source % | Model % | Delta pp | Tolerance px | Note |
|---|---|---|---|---|---|---|---|---:|---|
| S01 | side | body/right-side/windows/window-1/frame | 31.00, 30.00, 13.00, 9.00 | 31.00, 30.00, 13.00, 9.00 | 19.38, 50.00, 8.13, 15.00 | 19.37, 50.00, 8.13, 15.00 | -0.00, 0.00, 0.00, 0.00 | 1.5 | First saloon window, light grey frame. |
| S02 | side | body/right-side/windows/window-3/frame | 61.00, 30.00, 13.00, 9.00 | 61.00, 30.00, 13.00, 9.00 | 38.13, 50.00, 8.13, 15.00 | 38.12, 50.00, 8.13, 15.00 | -0.00, 0.00, 0.00, 0.00 | 1.5 | Third saloon window. |
| S03 | side | body/right-side/windows/window-6/frame | 106.00, 30.00, 13.00, 9.00 | 106.00, 30.00, 13.00, 9.00 | 66.25, 50.00, 8.13, 15.00 | 66.25, 50.00, 8.13, 15.00 | -0.00, 0.00, 0.00, 0.00 | 1.5 | Last saloon window. |
| S04 | side | body/right-side/windows/window-4/frame | 76.00, 30.00, 13.00, 9.00 | 76.00, 30.00, 13.00, 9.00 | 47.50, 50.00, 8.13, 15.00 | 47.50, 50.00, 8.13, 15.00 | 0.00, 0.00, 0.00, 0.00 | 1.5 | Fourth saloon window, over the destination display. |
| S05 | side | body/right-side/doors/door-1/outline | 18.00, 28.00, 10.00, 27.00 | 18.00, 28.00, 10.00, 26.95 | 11.25, 46.67, 6.25, 45.00 | 11.25, 46.67, 6.25, 44.92 | -0.00, -0.00, 0.00, -0.08 | 1.5 | Green folding door behind the -X cab, down to the skirt's foot at 0.5 m. |
| S06 | side | body/right-side/doors/door-2/outline | 122.00, 28.00, 10.00, 27.00 | 122.00, 28.00, 10.00, 26.95 | 76.25, 46.67, 6.25, 45.00 | 76.25, 46.67, 6.25, 44.92 | -0.00, -0.00, 0.00, -0.08 | 1.5 | As S05 behind the +X cab. |
| S07 | side | body/right-side/doors/door-1/glass-1/frame | 20.00, 32.00, 6.00, 10.00 | 20.00, 32.00, 6.00, 10.00 | 12.50, 53.33, 3.75, 16.67 | 12.50, 53.33, 3.75, 16.67 | 0.00, 0.00, -0.00, 0.00 | 1.5 | Door window. |
| S08 | side | body/right-side/emblem | 47.00, 42.00, 8.00, 5.00 | 47.41, 42.25, 5.93, 4.50 | 29.38, 70.00, 5.00, 8.33 | 29.63, 70.42, 3.71, 7.49 | 0.26, 0.42, -1.29, -0.84 | 1.5 | Black CD emblem on the white band; the model draws the emblem 90 % of the box high at its proportions. |
| S09 | side | body/right-side/display | 76.00, 41.00, 12.00, 4.00 | 76.00, 41.00, 12.00, 4.00 | 47.50, 68.33, 7.50, 6.67 | 47.50, 68.33, 7.50, 6.67 | 0.00, 0.00, 0.00, -0.00 | 1.5 | Destination display (black with yellow pixels). |
| S10 | side | shell/greyline-band, front-end/skin/grey-line, rear-end/skin/grey-line | 5.00, 48.00, 140.00, 1.00 | 5.00, 48.08, 140.00, 0.72 | 3.13, 80.00, 87.50, 1.67 | 3.13, 80.13, 87.50, 1.21 | 0.00, 0.13, -0.00, -0.46 | 1.5 | Dark grey line under the white band, end to end; the cab ends' skins carry it round the noses. |
| S11 | side | shell/green-band, front-end/skin/green, rear-end/skin/green | 4.00, 24.00, 142.00, 23.00 | 5.12, 23.00, 139.75, 23.80 | 2.50, 40.00, 88.75, 38.33 | 3.20, 38.33, 87.34, 39.67 | 0.70, -1.67, -1.41, 1.33 | 1.5 | Green: window band, roof and the cab noses, tip to tip, down to the sweep's foot at the noses (row 47, 1.3 m; the doors excluded) up to the roof (row 24, 3.6 m; the XML section's crown is 3.7 m). |
