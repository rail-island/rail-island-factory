# CD 750 (Brejlovec), default livery: native reference comparison

**Covers** - native pixel annotations, baseline and final orthographic errors of `veh-cd-750` (the default build, vlakosimdb `cd_750`).
**Code** - `generator/dieselComparison.ts`, `generator/dieselReport.ts`, `native/landmarks.json`.
**See also** - [source notes](SOURCES.md), [photographs](PHOTOS.md), [the models' reference](../../docs/models/diesel-locos.md).

Model geometry revision (SHA-256 of the comparison GLB): `cc6cd73d13a48beda7aed6b230aae06c249aede2746c2b6739cda6df9e5b6d1e`.

Regenerate with `pnpm exec tsx generator/dieselReport.ts`. The baseline is the first authored model (a new model: no earlier factory version existed), stored in `native/baseline.json` with the same annotations.

Canvases: side 160 x 50 px, front 30 x 50 px, 0.1 m a pixel, including empty space; origin top left, X right, Y down. Mapping: source x = Factory x + 7.65; the side canvas is 16 x 5 m, the front 3 x 5 m. The +X face plots (half width - z, height - y), the -X face (half width + z, height - y), both against the one shared `x_both` BMP; both sides plot the source x against the one shared `z_both` BMP, so the -Z elevation is mirrored relative to an outside observer.

Each vector is (left, top, width, height). Percentages are 100*x/W, 100*y/H, 100*w/W, 100*h/H. Signed delta = model minus source in percentage points. MAE = sum(abs(delta)) / (4 * number of boxes). Actual GLB vertices are selected by named scope triangle ranges; bounds include occluded vertices. Native BMPs, never the enhanced `_4x` textures, define the measurements.

| View | Boxes | Baseline MAE (pp) | Final MAE (pp) |
|---|---:|---:|---:|
| x_front | 15 | 1.192 | 0.933 |
| x_rear | 15 | 1.192 | 0.933 |
| z_right | 15 | 0.202 | 0.135 |
| z_left | 15 | 0.202 | 0.135 |
| All | 60 | 0.697 | 0.534 |

One pixel is 3.333 pp horizontally at the front, 0.625 pp horizontally at the sides and 2.000 pp vertically. Rows with a tolerance above about one pixel are deliberate departures, explained in their uncertainty column.

Annotated views (generated locally, not committed):

- x_front: [native](../../export/review/cd-750/x_front-native.svg), [model](../../export/review/cd-750/x_front-model.svg)
- x_rear: [native](../../export/review/cd-750/x_rear-native.svg), [model](../../export/review/cd-750/x_rear-model.svg)
- z_right: [native](../../export/review/cd-750/z_right-native.svg), [model](../../export/review/cd-750/z_right-model.svg)
- z_left: [native](../../export/review/cd-750/z_left-native.svg), [model](../../export/review/cd-750/z_left-model.svg)
- [Three-quarter thumbnail](../../export/thumbs/veh-cd-750.png)

| ID | Native pixel edges | Reference | Mesh scope(s) | Source % (x,y,w,h) | Model % | Signed delta (pp) | Baseline abs. mean (pp) | Final abs. mean (pp) | Uncertainty |
|---|---|---|---|---|---|---|---:|---:|---|
| F01 | 0, 15, 30, 24 | native | `front-cab/face/windscreen/surround` | 0.000, 30.000, 100.000, 18.000 | -0.022, 30.000, 100.043, 18.400 | -0.022, 0.000, 0.043, 0.400 | 0.116 | 0.116 | Native pixel edge estimate; +/- one pixel. The white surround of the windscreens (the 'glasses'). |
| B01 | 0, 15, 30, 24 | native | `rear-cab/face/windscreen/surround` | 0.000, 30.000, 100.000, 18.000 | -0.022, 30.000, 100.043, 18.400 | -0.022, 0.000, 0.043, 0.400 | 0.116 | 0.116 | Native pixel edge estimate; +/- one pixel. The white surround of the windscreens (the 'glasses'). |
| F02 | 1, 16, 14, 23 | native | `front-cab/face/windscreen/left-pane` | 3.333, 32.000, 43.333, 14.000 | 3.273, 32.000, 43.416, 14.000 | -0.061, -0.000, 0.083, 0.000 | 0.036 | 0.036 | Native pixel edge estimate; +/- one pixel. Rubber and glass of the viewer's left pane. |
| B02 | 1, 16, 14, 23 | native | `rear-cab/face/windscreen/left-pane` | 3.333, 32.000, 43.333, 14.000 | 3.273, 32.000, 43.416, 14.000 | -0.061, -0.000, 0.083, 0.000 | 0.036 | 0.036 | Native pixel edge estimate; +/- one pixel. Rubber and glass of the viewer's left pane. |
| F03 | 16, 16, 29, 23 | native | `front-cab/face/windscreen/right-pane` | 53.333, 32.000, 43.333, 14.000 | 53.311, 32.000, 43.416, 14.000 | -0.022, -0.000, 0.083, 0.000 | 0.026 | 0.026 | Native pixel edge estimate; +/- one pixel. |
| B03 | 16, 16, 29, 23 | native | `rear-cab/face/windscreen/right-pane` | 53.333, 32.000, 43.333, 14.000 | 53.311, 32.000, 43.416, 14.000 | -0.022, -0.000, 0.083, 0.000 | 0.026 | 0.026 | Native pixel edge estimate; +/- one pixel. |
| F04 | 11, 9, 20, 15 | native | `front-cab/face/headlight/rim` | 36.667, 18.000, 30.000, 12.000 | 35.000, 18.000, 30.000, 11.900 | -1.667, 0.000, -0.000, -0.100 | 2.705 | 0.442 | The white ring of the headlight on the housing; +/- one pixel, a 9 px circle drawn square. |
| B04 | 11, 9, 20, 15 | native | `rear-cab/face/headlight/rim` | 36.667, 18.000, 30.000, 12.000 | 35.000, 18.000, 30.000, 11.900 | -1.667, 0.000, -0.000, -0.100 | 2.705 | 0.442 | The white ring of the headlight on the housing; +/- one pixel, a 9 px circle drawn square. |
| F05 | 12, 25, 18, 29 | native | `front-cab/face/emblem` | 40.000, 50.000, 20.000, 8.000 | 41.514, 50.014, 16.972, 7.994 | 1.514, 0.014, -3.028, -0.006 | 2.769 | 1.140 | Native pixel edge estimate; +/- one pixel. CD emblem. |
| B05 | 12, 25, 18, 29 | native | `rear-cab/face/emblem` | 40.000, 50.000, 20.000, 8.000 | 41.514, 50.014, 16.972, 7.994 | 1.514, 0.014, -3.028, -0.006 | 2.769 | 1.140 | Native pixel edge estimate; +/- one pixel. CD emblem. |
| F06 | 11, 35, 19, 37 | native | `front-cab/face/number-plate` | 36.667, 70.000, 26.667, 4.000 | 36.667, 70.000, 26.667, 4.000 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| B06 | 11, 35, 19, 37 | native | `rear-cab/face/number-plate` | 36.667, 70.000, 26.667, 4.000 | 36.667, 70.000, 26.667, 4.000 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| F07 | 6, 35, 8, 37 | native | `front-cab/face/lamps/head-lamp` | 20.000, 70.000, 6.667, 4.000 | 19.000, 69.527, 8.667, 4.945 | -1.000, -0.473, 2.000, 0.945 | 1.105 | 1.105 | Native pixel edge estimate; +/- one pixel. White lamp (2 by 2 px). |
| B07 | 6, 35, 8, 37 | native | `rear-cab/face/lamps/head-lamp` | 20.000, 70.000, 6.667, 4.000 | 19.000, 69.527, 8.667, 4.945 | -1.000, -0.473, 2.000, 0.945 | 1.105 | 1.105 | Native pixel edge estimate; +/- one pixel. White lamp (2 by 2 px). |
| F08 | 22, 35, 24, 37 | native | `front-cab/face/lamps/head-lamp-2` | 73.333, 70.000, 6.667, 4.000 | 72.333, 69.527, 8.667, 4.945 | -1.000, -0.473, 2.000, 0.945 | 1.105 | 1.105 | Native pixel edge estimate; +/- one pixel. |
| B08 | 22, 35, 24, 37 | native | `rear-cab/face/lamps/head-lamp-2` | 73.333, 70.000, 6.667, 4.000 | 72.333, 69.527, 8.667, 4.945 | -1.000, -0.473, 2.000, 0.945 | 1.105 | 1.105 | Native pixel edge estimate; +/- one pixel. |
| F09 | 3, 35, 5, 37 | native | `front-cab/face/lamps/tail-lamp` | 10.000, 70.000, 6.667, 4.000 | 9.833, 70.003, 7.000, 3.994 | -0.167, 0.003, 0.333, -0.006 | 0.127 | 0.127 | Native pixel edge estimate; +/- one pixel. Red lamp. |
| B09 | 3, 35, 5, 37 | native | `rear-cab/face/lamps/tail-lamp` | 10.000, 70.000, 6.667, 4.000 | 9.833, 70.003, 7.000, 3.994 | -0.167, 0.003, 0.333, -0.006 | 0.127 | 0.127 | Native pixel edge estimate; +/- one pixel. Red lamp. |
| F10 | 25, 35, 27, 37 | native | `front-cab/face/lamps/tail-lamp-2` | 83.333, 70.000, 6.667, 4.000 | 83.167, 70.003, 7.000, 3.994 | -0.167, 0.003, 0.333, -0.006 | 0.127 | 0.127 | Native pixel edge estimate; +/- one pixel. |
| B10 | 25, 35, 27, 37 | native | `rear-cab/face/lamps/tail-lamp-2` | 83.333, 70.000, 6.667, 4.000 | 83.167, 70.003, 7.000, 3.994 | -0.167, 0.003, 0.333, -0.006 | 0.127 | 0.127 | Native pixel edge estimate; +/- one pixel. |
| F11 | 0, 31, 30, 34 | native | `body/shell/front/band-0` | 0.000, 62.000, 100.000, 6.000 | 0.000, 62.000, 100.000, 6.000 | 0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Livery band 1.6 .. 1.9 m (yellow). |
| B11 | 0, 31, 30, 34 | native | `body/shell/rear/band-0` | 0.000, 62.000, 100.000, 6.000 | 0.000, 62.000, 100.000, 6.000 | 0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Livery band 1.6 .. 1.9 m (yellow). |
| F12 | 0, 24, 30, 31 | native | `body/shell/front/band-1` | 0.000, 48.000, 100.000, 14.000 | 0.000, 48.000, 100.000, 14.000 | 0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Livery band 1.9 .. 2.6 m (grey). |
| B12 | 0, 24, 30, 31 | native | `body/shell/rear/band-1` | 0.000, 48.000, 100.000, 14.000 | 0.000, 48.000, 100.000, 14.000 | 0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Livery band 1.9 .. 2.6 m (grey). |
| F13 | 1, 38, 8, 42 | native | `front-cab/lower-end/right-buffer/head` | 3.333, 76.000, 23.333, 8.000 | 14.167, 75.500, 13.333, 7.799 | 10.833, -0.500, -10.000, -0.201 | 5.383 | 5.383 | Native buffer frames; the model keeps the standard 1.75 m buffer spacing and 1.03 m height (deliberate mechanical constraint). |
| B13 | 1, 38, 8, 42 | native | `rear-cab/lower-end/right-buffer/head` | 3.333, 76.000, 23.333, 8.000 | 14.167, 75.500, 13.333, 7.799 | 10.833, -0.500, -10.000, -0.201 | 5.383 | 5.383 | Native buffer frames; the model keeps the standard 1.75 m buffer spacing and 1.03 m height (deliberate mechanical constraint). |
| F14 | 22, 38, 29, 42 | native | `front-cab/lower-end/left-buffer/head` | 73.333, 76.000, 23.333, 8.000 | 72.500, 75.500, 13.333, 7.799 | -0.833, -0.500, -10.000, -0.201 | 2.883 | 2.883 | Native buffer frames; the model keeps the standard 1.75 m buffer spacing and 1.03 m height (deliberate mechanical constraint). |
| B14 | 22, 38, 29, 42 | native | `rear-cab/lower-end/left-buffer/head` | 73.333, 76.000, 23.333, 8.000 | 72.500, 75.500, 13.333, 7.799 | -0.833, -0.500, -10.000, -0.201 | 2.883 | 2.883 | Native buffer frames; the model keeps the standard 1.75 m buffer spacing and 1.03 m height (deliberate mechanical constraint). |
| F15 | 0, 42, 30, 48 | native | `front-cab/lower-end/plough` | 0.000, 84.000, 100.000, 12.000 | 1.667, 84.000, 96.667, 13.000 | 1.667, -0.000, -3.333, 1.000 | 1.500 | 1.500 | Native pixel edge estimate; +/- one pixel. The plough's face, 0.2 .. 0.8 m. |
| B15 | 0, 42, 30, 48 | native | `rear-cab/lower-end/plough` | 0.000, 84.000, 100.000, 12.000 | 1.667, 84.000, 96.667, 13.000 | 1.667, -0.000, -3.333, 1.000 | 1.500 | 1.500 | Native pixel edge estimate; +/- one pixel. The plough's face, 0.2 .. 0.8 m. |
| R01 | 25, 19, 29, 23 | native | `sides/right-side/windows/window-1` | 15.625, 38.000, 2.500, 8.000 | 15.625, 38.000, 2.500, 8.000 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. Machine-room window, frame and glass. |
| R02 | 39, 19, 43, 23 | native | `sides/right-side/windows/window-2` | 24.375, 38.000, 2.500, 8.000 | 24.375, 38.000, 2.500, 8.000 | 0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. Machine-room window, frame and glass. |
| R03 | 53, 19, 57, 23 | native | `sides/right-side/windows/window-3` | 33.125, 38.000, 2.500, 8.000 | 33.125, 38.000, 2.500, 8.000 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. Machine-room window, frame and glass. |
| R04 | 68, 19, 72, 23 | native | `sides/right-side/windows/window-4` | 42.500, 38.000, 2.500, 8.000 | 42.500, 38.000, 2.500, 8.000 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. Machine-room window, frame and glass. |
| R05 | 82, 19, 86, 23 | native | `sides/right-side/windows/window-5` | 51.250, 38.000, 2.500, 8.000 | 51.250, 38.000, 2.500, 8.000 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. Machine-room window, frame and glass. |
| R06 | 96, 19, 100, 23 | native | `sides/right-side/windows/window-6` | 60.000, 38.000, 2.500, 8.000 | 60.000, 38.000, 2.500, 8.000 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. Machine-room window, frame and glass. |
| R07 | 107, 18, 130, 24 | native | `sides/right-side/radiator` | 66.875, 36.000, 14.375, 12.000 | 66.875, 36.000, 13.750, 12.000 | -0.000, -0.000, -0.625, 0.000 | 0.156 | 0.156 | Native pixel edge estimate; +/- one pixel. Two radiator shutter panels. |
| R08 | 3, 17, 5, 22 | native | `sides/right-side/left-cab/window-1` | 1.875, 34.000, 1.250, 10.000 | 1.875, 34.000, 1.250, 10.000 | 0.000, 0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. Cab windows at the left end; the right end is drawn 2 px off its mirror image and is not annotated. |
| R09 | 6, 17, 11, 22 | native | `sides/right-side/left-cab/window-2` | 3.750, 34.000, 3.125, 10.000 | 3.750, 34.000, 3.125, 10.000 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R10 | 13, 17, 17, 22 | native | `sides/right-side/left-cab/window-3` | 8.125, 34.000, 2.500, 10.000 | 8.125, 34.000, 2.500, 10.000 | 0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R11 | 74, 27, 82, 30 | native | `sides/right-side/number-plate` | 46.250, 54.000, 5.000, 6.000 | 46.744, 55.400, 4.012, 3.200 | 0.494, 1.400, -0.988, -2.800 | 1.420 | 1.420 | Native pixel edge estimate; +/- one pixel. The model's plate is the running number's width, 0.16 m tall. |
| R12 | 33, 26, 38, 30 | native | `sides/right-side/emblem` | 20.625, 52.000, 3.125, 8.000 | 20.758, 52.001, 2.859, 7.195 | 0.133, 0.001, -0.266, -0.805 | 0.301 | 0.301 | Native pixel edge estimate; +/- one pixel. |
| R13 | 0, 34, 153, 39 | native | `body/frame` | 0.000, 68.000, 95.625, 10.000 | -0.000, 68.000, 95.625, 10.000 | -0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. The frame, 1.1 .. 1.6 m, over the body's length. |
| R14 | 50, 7, 106, 8 | native | `body/roof/hatch` | 31.250, 14.000, 35.000, 2.000 | 31.250, 14.000, 35.000, 2.600 | -0.000, -0.000, 0.000, 0.600 | 0.150 | 0.150 | XML roof clip 5.0 .. 10.6, its crest at 4.3 m; one row. |
| R15 | 54, 39, 99, 48 | native | `underframe/fuel-tank` | 33.750, 78.000, 28.125, 18.000 | 33.750, 78.000, 28.125, 18.000 | 0.000, -0.000, 0.000, 0.000 | 1.000 | 0.000 | XML base clip 5.4 .. 9.9, 0.2 .. 1.1 m: the fuel tank. |
| L01 | 25, 19, 29, 23 | native | `sides/left-side/windows/window-1` | 15.625, 38.000, 2.500, 8.000 | 15.625, 38.000, 2.500, 8.000 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. Machine-room window, frame and glass. |
| L02 | 39, 19, 43, 23 | native | `sides/left-side/windows/window-2` | 24.375, 38.000, 2.500, 8.000 | 24.375, 38.000, 2.500, 8.000 | 0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. Machine-room window, frame and glass. |
| L03 | 53, 19, 57, 23 | native | `sides/left-side/windows/window-3` | 33.125, 38.000, 2.500, 8.000 | 33.125, 38.000, 2.500, 8.000 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. Machine-room window, frame and glass. |
| L04 | 68, 19, 72, 23 | native | `sides/left-side/windows/window-4` | 42.500, 38.000, 2.500, 8.000 | 42.500, 38.000, 2.500, 8.000 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. Machine-room window, frame and glass. |
| L05 | 82, 19, 86, 23 | native | `sides/left-side/windows/window-5` | 51.250, 38.000, 2.500, 8.000 | 51.250, 38.000, 2.500, 8.000 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. Machine-room window, frame and glass. |
| L06 | 96, 19, 100, 23 | native | `sides/left-side/windows/window-6` | 60.000, 38.000, 2.500, 8.000 | 60.000, 38.000, 2.500, 8.000 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. Machine-room window, frame and glass. |
| L07 | 107, 18, 130, 24 | native | `sides/left-side/radiator` | 66.875, 36.000, 14.375, 12.000 | 66.875, 36.000, 13.750, 12.000 | -0.000, -0.000, -0.625, 0.000 | 0.156 | 0.156 | Native pixel edge estimate; +/- one pixel. Two radiator shutter panels. |
| L08 | 3, 17, 5, 22 | native | `sides/left-side/left-cab/window-1` | 1.875, 34.000, 1.250, 10.000 | 1.875, 34.000, 1.250, 10.000 | 0.000, 0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. Cab windows at the left end; the right end is drawn 2 px off its mirror image and is not annotated. |
| L09 | 6, 17, 11, 22 | native | `sides/left-side/left-cab/window-2` | 3.750, 34.000, 3.125, 10.000 | 3.750, 34.000, 3.125, 10.000 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L10 | 13, 17, 17, 22 | native | `sides/left-side/left-cab/window-3` | 8.125, 34.000, 2.500, 10.000 | 8.125, 34.000, 2.500, 10.000 | 0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L11 | 74, 27, 82, 30 | native | `sides/left-side/number-plate` | 46.250, 54.000, 5.000, 6.000 | 46.744, 55.400, 4.012, 3.200 | 0.494, 1.400, -0.988, -2.800 | 1.420 | 1.420 | Native pixel edge estimate; +/- one pixel. The model's plate is the running number's width, 0.16 m tall. |
| L12 | 33, 26, 38, 30 | native | `sides/left-side/emblem` | 20.625, 52.000, 3.125, 8.000 | 20.758, 52.001, 2.859, 7.195 | 0.133, 0.001, -0.266, -0.805 | 0.301 | 0.301 | Native pixel edge estimate; +/- one pixel. |
| L13 | 0, 34, 153, 39 | native | `body/frame` | 0.000, 68.000, 95.625, 10.000 | -0.000, 68.000, 95.625, 10.000 | -0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. The frame, 1.1 .. 1.6 m, over the body's length. |
| L14 | 50, 7, 106, 8 | native | `body/roof/hatch` | 31.250, 14.000, 35.000, 2.000 | 31.250, 14.000, 35.000, 2.600 | -0.000, -0.000, 0.000, 0.600 | 0.150 | 0.150 | XML roof clip 5.0 .. 10.6, its crest at 4.3 m; one row. |
| L15 | 54, 39, 99, 48 | native | `underframe/fuel-tank` | 33.750, 78.000, 28.125, 18.000 | 33.750, 78.000, 28.125, 18.000 | 0.000, -0.000, 0.000, 0.000 | 1.000 | 0.000 | XML base clip 5.4 .. 9.9, 0.2 .. 1.1 m: the fuel tank. |
