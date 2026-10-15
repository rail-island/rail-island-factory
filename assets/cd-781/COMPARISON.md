# CD 781, default livery: native reference comparison

**Covers** - native pixel annotations, baseline and final orthographic errors of `veh-cd-781` (the default build, vlakosimdb `cd_781`).
**Code** - `generator/dieselComparison.ts`, `generator/dieselReport.ts`, `native/landmarks.json`.
**See also** - [source notes](SOURCES.md), [photographs](PHOTOS.md), [the models' reference](../../docs/models/diesel-locos.md).

Model geometry revision (SHA-256 of the comparison GLB): `bd564eb987bb1706914acc4fec2b5ae23a27622708045df6b9e7794b11d653b6`.

Regenerate with `pnpm exec tsx generator/dieselReport.ts`. The baseline is the first authored model (a new model: no earlier factory version existed), stored in `native/baseline.json` with the same annotations.

Canvases: side 180 x 50 px, front 30 x 50 px, 0.1 m a pixel, including empty space; origin top left, X right, Y down. Mapping: source x = Factory x + 8.8; the side canvas is 18 x 5 m, the front 3 x 5 m. The +X face plots (half width - z, height - y), the -X face (half width + z, height - y), both against the one shared `x_both` BMP; both sides plot the source x against the one shared `z_both` BMP, so the -Z elevation is mirrored relative to an outside observer.

Each vector is (left, top, width, height). Percentages are 100*x/W, 100*y/H, 100*w/W, 100*h/H. Signed delta = model minus source in percentage points. MAE = sum(abs(delta)) / (4 * number of boxes). Actual GLB vertices are selected by named scope triangle ranges; bounds include occluded vertices. Native BMPs, never the enhanced `_4x` textures, define the measurements.

| View | Boxes | Baseline MAE (pp) | Final MAE (pp) |
|---|---:|---:|---:|
| x_front | 11 | 1.724 | 1.724 |
| x_rear | 11 | 1.724 | 1.724 |
| z_right | 13 | 0.521 | 0.521 |
| All | 35 | 1.277 | 1.277 |

One pixel is 3.333 pp horizontally at the front, 0.556 pp horizontally at the sides and 2.000 pp vertically. Rows with a tolerance above about one pixel are deliberate departures, explained in their uncertainty column.

Annotated views (generated locally, not committed):

- x_front: [native](../../export/review/cd-781/x_front-native.svg), [model](../../export/review/cd-781/x_front-model.svg)
- x_rear: [native](../../export/review/cd-781/x_rear-native.svg), [model](../../export/review/cd-781/x_rear-model.svg)
- z_right: [native](../../export/review/cd-781/z_right-native.svg), [model](../../export/review/cd-781/z_right-model.svg)
- [Three-quarter thumbnail](../../export/thumbs/veh-cd-781.png)

| ID | Native pixel edges | Reference | Mesh scope(s) | Source % (x,y,w,h) | Model % | Signed delta (pp) | Baseline abs. mean (pp) | Final abs. mean (pp) | Uncertainty |
|---|---|---|---|---|---|---|---:|---:|---|
| F01 | 2, 14, 14, 20 | native | `front-cab/face/windscreen/left-pane` | 6.667, 28.000, 40.000, 12.000 | 6.270, 26.270, 39.738, 15.372 | -0.397, -1.730, -0.262, 3.372 | 1.440 | 1.440 | Native pixel edge estimate; +/- one pixel. Glass rows 14..19; the rubber frame rows 13 and 20 are excluded, the model's rubber included (rounded corners). |
| B01 | 2, 14, 14, 20 | native | `rear-cab/face/windscreen/left-pane` | 6.667, 28.000, 40.000, 12.000 | 6.270, 26.270, 39.738, 15.372 | -0.397, -1.730, -0.262, 3.372 | 1.440 | 1.440 | Native pixel edge estimate; +/- one pixel. Glass rows 14..19; the rubber frame rows 13 and 20 are excluded, the model's rubber included (rounded corners). |
| F02 | 16, 14, 28, 20 | native | `front-cab/face/windscreen/right-pane` | 53.333, 28.000, 40.000, 12.000 | 53.992, 26.270, 39.738, 15.372 | 0.659, -1.730, -0.262, 3.372 | 1.506 | 1.506 | Native pixel edge estimate; +/- one pixel. |
| B02 | 16, 14, 28, 20 | native | `rear-cab/face/windscreen/right-pane` | 53.333, 28.000, 40.000, 12.000 | 53.992, 26.270, 39.738, 15.372 | 0.659, -1.730, -0.262, 3.372 | 1.506 | 1.506 | Native pixel edge estimate; +/- one pixel. |
| F03 | 12, 8, 18, 12 | native | `front-cab/face/headlight/housing` | 40.000, 16.000, 20.000, 8.000 | 41.296, 13.618, 17.408, 11.789 | 1.296, -2.382, -2.592, 3.789 | 2.515 | 2.515 | Native pixel edge estimate; +/- one pixel. The headlight on the roof's slope. |
| B03 | 12, 8, 18, 12 | native | `rear-cab/face/headlight/housing` | 40.000, 16.000, 20.000, 8.000 | 41.296, 13.618, 17.408, 11.789 | 1.296, -2.382, -2.592, 3.789 | 2.515 | 2.515 | Native pixel edge estimate; +/- one pixel. The headlight on the roof's slope. |
| F04 | 0, 21, 30, 23 | native | `body/shell/front/band-4` | 0.000, 42.000, 100.000, 4.000 | 0.833, 42.000, 98.333, 4.000 | 0.833, -0.000, -1.667, 0.000 | 0.625 | 0.625 | Livery band 2.7 .. 2.9 m (the bright strip). |
| B04 | 0, 21, 30, 23 | native | `body/shell/rear/band-4` | 0.000, 42.000, 100.000, 4.000 | 0.833, 42.000, 98.333, 4.000 | 0.833, -0.000, -1.667, 0.000 | 0.625 | 0.625 | Livery band 2.7 .. 2.9 m (the bright strip). |
| F05 | 0, 26, 30, 32 | native | `body/shell/front/band-2` | 0.000, 52.000, 100.000, 12.000 | 0.833, 52.000, 98.333, 12.000 | 0.833, -0.000, -1.667, 0.000 | 0.625 | 0.625 | Livery band 1.8 .. 2.4 m (yellow). |
| B05 | 0, 26, 30, 32 | native | `body/shell/rear/band-2` | 0.000, 52.000, 100.000, 12.000 | 0.833, 52.000, 98.333, 12.000 | 0.833, -0.000, -1.667, 0.000 | 0.625 | 0.625 | Livery band 1.8 .. 2.4 m (yellow). |
| F06 | 2, 34, 5, 36 | native | `front-cab/face/lamps/head-lamp` | 6.667, 68.000, 10.000, 4.000 | 8.333, 67.927, 8.667, 4.945 | 1.667, -0.073, -1.333, 0.945 | 1.005 | 1.005 | Native pixel edge estimate; +/- one pixel. White lamp. |
| B06 | 2, 34, 5, 36 | native | `rear-cab/face/lamps/head-lamp` | 6.667, 68.000, 10.000, 4.000 | 8.333, 67.927, 8.667, 4.945 | 1.667, -0.073, -1.333, 0.945 | 1.005 | 1.005 | Native pixel edge estimate; +/- one pixel. White lamp. |
| F07 | 25, 34, 28, 36 | native | `front-cab/face/lamps/head-lamp-2` | 83.333, 68.000, 10.000, 4.000 | 83.000, 67.927, 8.667, 4.945 | -0.333, -0.073, -1.333, 0.945 | 0.671 | 0.671 | Native pixel edge estimate; +/- one pixel. |
| B07 | 25, 34, 28, 36 | native | `rear-cab/face/lamps/head-lamp-2` | 83.333, 68.000, 10.000, 4.000 | 83.000, 67.927, 8.667, 4.945 | -0.333, -0.073, -1.333, 0.945 | 0.671 | 0.671 | Native pixel edge estimate; +/- one pixel. |
| F08 | 11, 34, 19, 37 | native | `front-cab/face/number-plate` | 36.667, 68.000, 26.667, 6.000 | 37.617, 68.400, 24.767, 4.000 | 0.950, 0.400, -1.900, -2.000 | 1.312 | 1.312 | Native pixel edge estimate; +/- one pixel. |
| B08 | 11, 34, 19, 37 | native | `rear-cab/face/number-plate` | 36.667, 68.000, 26.667, 6.000 | 37.617, 68.400, 24.767, 4.000 | 0.950, 0.400, -1.900, -2.000 | 1.312 | 1.312 | Native pixel edge estimate; +/- one pixel. |
| F09 | 2, 38, 8, 42 | native | `front-cab/lower-end/right-buffer/head` | 6.667, 76.000, 20.000, 8.000 | 14.167, 75.500, 13.333, 7.799 | 7.500, -0.500, -6.667, -0.201 | 3.717 | 3.717 | Native buffer frames; the model keeps the standard 1.75 m buffer spacing and 1.03 m height (deliberate mechanical constraint). |
| B09 | 2, 38, 8, 42 | native | `rear-cab/lower-end/right-buffer/head` | 6.667, 76.000, 20.000, 8.000 | 14.167, 75.500, 13.333, 7.799 | 7.500, -0.500, -6.667, -0.201 | 3.717 | 3.717 | Native buffer frames; the model keeps the standard 1.75 m buffer spacing and 1.03 m height (deliberate mechanical constraint). |
| F10 | 22, 38, 28, 42 | native | `front-cab/lower-end/left-buffer/head` | 73.333, 76.000, 20.000, 8.000 | 72.500, 75.500, 13.333, 7.799 | -0.833, -0.500, -6.667, -0.201 | 2.050 | 2.050 | Native buffer frames; the model keeps the standard 1.75 m buffer spacing and 1.03 m height (deliberate mechanical constraint). |
| B10 | 22, 38, 28, 42 | native | `rear-cab/lower-end/left-buffer/head` | 73.333, 76.000, 20.000, 8.000 | 72.500, 75.500, 13.333, 7.799 | -0.833, -0.500, -6.667, -0.201 | 2.050 | 2.050 | Native buffer frames; the model keeps the standard 1.75 m buffer spacing and 1.03 m height (deliberate mechanical constraint). |
| F11 | 0, 42, 30, 46 | native | `front-cab/lower-end/plough` | 0.000, 84.000, 100.000, 8.000 | 2.667, 83.000, 94.667, 13.000 | 2.667, -1.000, -5.333, 5.000 | 3.500 | 3.500 | Native pixel edge estimate; +/- one pixel. The plough, 0.4 .. 0.8 m in the BMP; the model's reaches 0.85 m under the beam. |
| B11 | 0, 42, 30, 46 | native | `rear-cab/lower-end/plough` | 0.000, 84.000, 100.000, 8.000 | 2.667, 83.000, 94.667, 13.000 | 2.667, -1.000, -5.333, 5.000 | 3.500 | 3.500 | Native pixel edge estimate; +/- one pixel. The plough, 0.4 .. 0.8 m in the BMP; the model's reaches 0.85 m under the beam. |
| R01 | 11, 15, 20, 21 | native | `sides/right-side/left-cab/cab-window` | 6.111, 30.000, 5.000, 12.000 | 6.111, 30.000, 5.000, 12.000 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. The cab's sliding window, two panes. |
| R02 | 24, 16, 28, 21 | native | `sides/right-side/left-cab/door/window` | 13.333, 32.000, 2.222, 10.000 | 13.222, 31.600, 2.444, 9.400 | -0.111, -0.400, 0.222, -0.600 | 0.333 | 0.333 | Native pixel edge estimate; +/- one pixel. The door's window. |
| R03 | 33, 16, 39, 20 | native | `sides/right-side/windows/window-1` | 18.333, 32.000, 3.333, 8.000 | 18.333, 31.600, 3.444, 8.800 | 0.000, -0.400, 0.111, 0.800 | 0.328 | 0.328 | Native pixel edge estimate; +/- one pixel. Machine-room window; glass columns c+1..c+6 of the 8 px drawing. |
| R04 | 50, 16, 56, 20 | native | `sides/right-side/windows/window-2` | 27.778, 32.000, 3.333, 8.000 | 27.778, 31.600, 3.444, 8.800 | 0.000, -0.400, 0.111, 0.800 | 0.328 | 0.328 | Native pixel edge estimate; +/- one pixel. Machine-room window; glass columns c+1..c+6 of the 8 px drawing. |
| R05 | 60, 16, 66, 20 | native | `sides/right-side/windows/window-3` | 33.333, 32.000, 3.333, 8.000 | 33.333, 31.600, 3.444, 8.800 | 0.000, -0.400, 0.111, 0.800 | 0.328 | 0.328 | Native pixel edge estimate; +/- one pixel. Machine-room window; glass columns c+1..c+6 of the 8 px drawing. |
| R06 | 70, 16, 76, 20 | native | `sides/right-side/windows/window-4` | 38.889, 32.000, 3.333, 8.000 | 38.889, 31.600, 3.444, 8.800 | 0.000, -0.400, 0.111, 0.800 | 0.328 | 0.328 | Native pixel edge estimate; +/- one pixel. Machine-room window; glass columns c+1..c+6 of the 8 px drawing. |
| R07 | 80, 16, 86, 20 | native | `sides/right-side/windows/window-5` | 44.444, 32.000, 3.333, 8.000 | 44.444, 31.600, 3.444, 8.800 | -0.000, -0.400, 0.111, 0.800 | 0.328 | 0.328 | Native pixel edge estimate; +/- one pixel. Machine-room window; glass columns c+1..c+6 of the 8 px drawing. |
| R08 | 90, 16, 96, 20 | native | `sides/right-side/windows/window-6` | 50.000, 32.000, 3.333, 8.000 | 50.000, 31.600, 3.444, 8.800 | 0.000, -0.400, 0.111, 0.800 | 0.328 | 0.328 | Native pixel edge estimate; +/- one pixel. Machine-room window; glass columns c+1..c+6 of the 8 px drawing. |
| R09 | 100, 16, 106, 20 | native | `sides/right-side/windows/window-7` | 55.556, 32.000, 3.333, 8.000 | 55.556, 31.600, 3.444, 8.800 | 0.000, -0.400, 0.111, 0.800 | 0.328 | 0.328 | Native pixel edge estimate; +/- one pixel. Machine-room window; glass columns c+1..c+6 of the 8 px drawing. |
| R10 | 120, 15, 146, 26 | native | `sides/right-side/radiator` | 66.667, 30.000, 14.444, 22.000 | 66.667, 30.000, 14.444, 22.000 | 0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. The radiator louvres, two panels. |
| R11 | 5, 26, 171, 32 | native | `body/shell/side-right/band-2`, `body/shell/cab-right/band-2` | 2.778, 52.000, 92.222, 12.000 | 3.889, 52.000, 90.000, 12.000 | 1.111, -0.000, -2.222, 0.000 | 0.833 | 0.833 | Livery band 1.8 .. 2.4 m (yellow) along the body. |
| R12 | 61, 5, 96, 7 | native | `body/roof/engine-hatch` | 33.889, 10.000, 19.444, 4.000 | 33.889, 9.900, 19.889, 3.700 | -0.000, -0.100, 0.444, -0.300 | 0.211 | 0.211 | XML alongz 6.1 .. 9.6 m to 4.5 m; the BMP's roof edge rows 4..5. |
| R13 | 76, 37, 100, 46 | native | `underframe/fuel-tank` | 42.222, 74.000, 13.333, 18.000 | 42.222, 80.000, 13.333, 11.600 | -0.000, 6.000, 0.000, -6.400 | 3.100 | 3.100 | Native pixel edge estimate; +/- one pixel. The BMP draws the tank from the frame (1.3 m); the model's tank hangs under the frame, 0.42 .. 1.0 m. |
