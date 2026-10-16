# CSD T 499.0: native reference comparison

**Covers** - native pixel annotations, baseline and final orthographic errors of `veh-csd-t499` (the default build, vlakosimdb `csd_t499`).
**Code** - `generator/dieselComparison.ts`, `generator/dieselReport.ts`, `native/landmarks.json`.
**See also** - [source notes](SOURCES.md), [photographs](PHOTOS.md), [the models' reference](../../docs/models/diesel-locos.md).

Model geometry revision (SHA-256 of the comparison GLB): `5f7d9c0472be8db2d9f06179669ce0a1bc64f6d215b857fd76f5a8feff610d55`.

Regenerate with `pnpm exec tsx generator/dieselReport.ts`. The baseline is the first authored model (a new model: no earlier factory version existed), stored in `native/baseline.json` with the same annotations.

Canvases: side 180 x 50 px, front 30 x 50 px, 0.1 m a pixel, including empty space; origin top left, X right, Y down. Mapping: source x = Factory x + 8.75; the side canvas is 18 x 5 m, the front 3 x 5 m. The +X face plots (half width - z, height - y), the -X face (half width + z, height - y), both against the one shared `x_both` BMP; both sides plot the source x against the one shared `z_both` BMP, so the -Z elevation is mirrored relative to an outside observer.

Each vector is (left, top, width, height). Percentages are 100*x/W, 100*y/H, 100*w/W, 100*h/H. Signed delta = model minus source in percentage points. MAE = sum(abs(delta)) / (4 * number of boxes). Actual GLB vertices are selected by named scope triangle ranges; bounds include occluded vertices. Native BMPs, never the enhanced `_4x` textures, define the measurements.

| View | Boxes | Baseline MAE (pp) | Final MAE (pp) |
|---|---:|---:|---:|
| x_front | 10 | 1.099 | 1.099 |
| x_rear | 10 | 1.099 | 1.099 |
| z_right | 9 | 0.185 | 0.054 |
| All | 29 | 0.815 | 0.775 |

One pixel is 3.333 pp horizontally at the front, 0.556 pp horizontally at the sides and 2.000 pp vertically. Rows with a tolerance above about one pixel are deliberate departures, explained in their uncertainty column.

Annotated views (generated locally, not committed):

- x_front: [native](../../export/review/csd-t499/x_front-native.svg), [model](../../export/review/csd-t499/x_front-model.svg)
- x_rear: [native](../../export/review/csd-t499/x_rear-native.svg), [model](../../export/review/csd-t499/x_rear-model.svg)
- z_right: [native](../../export/review/csd-t499/z_right-native.svg), [model](../../export/review/csd-t499/z_right-model.svg)
- [Three-quarter thumbnail](../../export/thumbs/veh-csd-t499.png)

| ID | Native pixel edges | Reference | Mesh scope(s) | Source % (x,y,w,h) | Model % | Signed delta (pp) | Baseline abs. mean (pp) | Final abs. mean (pp) | Uncertainty |
|---|---|---|---|---|---|---|---:|---:|---|
| F01 | 1, 17, 14, 24 | native | `front-cab/face/windscreen/left-pane` | 3.333, 34.000, 43.333, 14.000 | 2.499, 33.540, 44.849, 12.881 | -0.834, -0.460, 1.515, -1.119 | 0.982 | 0.982 | Native pixel edge estimate; +/- one pixel. |
| B01 | 1, 17, 14, 24 | native | `rear-cab/face/windscreen/left-pane` | 3.333, 34.000, 43.333, 14.000 | 2.499, 33.540, 44.849, 12.881 | -0.834, -0.460, 1.515, -1.119 | 0.982 | 0.982 | Native pixel edge estimate; +/- one pixel. |
| F02 | 16, 17, 29, 24 | native | `front-cab/face/windscreen/right-pane` | 53.333, 34.000, 43.333, 14.000 | 52.652, 33.540, 44.849, 12.881 | -0.681, -0.460, 1.515, -1.119 | 0.944 | 0.944 | Native pixel edge estimate; +/- one pixel. |
| B02 | 16, 17, 29, 24 | native | `rear-cab/face/windscreen/right-pane` | 53.333, 34.000, 43.333, 14.000 | 52.652, 33.540, 44.849, 12.881 | -0.681, -0.460, 1.515, -1.119 | 0.944 | 0.944 | Native pixel edge estimate; +/- one pixel. |
| F03 | 12, 25, 18, 30 | native | `front-cab/face/headlight/rim` | 40.000, 50.000, 20.000, 10.000 | 41.578, 48.872, 16.843, 10.170 | 1.578, -1.128, -3.157, 0.170 | 1.508 | 1.508 | Native pixel edge estimate; +/- one pixel. The central 'Kyklop' headlight. |
| B03 | 12, 25, 18, 30 | native | `rear-cab/face/headlight/rim` | 40.000, 50.000, 20.000, 10.000 | 41.578, 48.872, 16.843, 10.170 | 1.578, -1.128, -3.157, 0.170 | 1.508 | 1.508 | Native pixel edge estimate; +/- one pixel. The central 'Kyklop' headlight. |
| F04 | 2, 25, 10, 26 | native | `front-cab/face/grab-bars/left` | 6.667, 50.000, 26.667, 2.000 | 6.248, 49.451, 23.693, 0.865 | -0.418, -0.549, -2.974, -1.135 | 1.269 | 1.269 | Native pixel edge estimate; +/- one pixel. The grab bar under the left pane. |
| B04 | 2, 25, 10, 26 | native | `rear-cab/face/grab-bars/left` | 6.667, 50.000, 26.667, 2.000 | 6.248, 49.451, 23.693, 0.865 | -0.418, -0.549, -2.974, -1.135 | 1.269 | 1.269 | Native pixel edge estimate; +/- one pixel. The grab bar under the left pane. |
| F05 | 0, 30, 30, 35 | native | `body/shell/front/band-1` | 0.000, 60.000, 100.000, 10.000 | 0.000, 60.000, 100.000, 10.000 | 0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Livery band 1.5 .. 2.0 m (navy). |
| B05 | 0, 30, 30, 35 | native | `body/shell/rear/band-1` | 0.000, 60.000, 100.000, 10.000 | 0.000, 60.000, 100.000, 10.000 | 0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Livery band 1.5 .. 2.0 m (navy). |
| F06 | 2, 32, 4, 34 | native | `front-cab/face/lamps/tail-lamp` | 6.667, 64.000, 6.667, 4.000 | 4.372, 63.430, 7.746, 4.455 | -2.295, -0.570, 1.080, 0.455 | 1.100 | 1.100 | Native pixel edge estimate; +/- one pixel. Red lamp. |
| B06 | 2, 32, 4, 34 | native | `rear-cab/face/lamps/tail-lamp` | 6.667, 64.000, 6.667, 4.000 | 4.372, 63.430, 7.746, 4.455 | -2.295, -0.570, 1.080, 0.455 | 1.100 | 1.100 | Native pixel edge estimate; +/- one pixel. Red lamp. |
| F07 | 5, 32, 7, 34 | native | `front-cab/face/lamps/head-lamp` | 16.667, 64.000, 6.667, 4.000 | 15.705, 63.239, 8.324, 4.839 | -0.962, -0.761, 1.657, 0.839 | 1.055 | 1.055 | Native pixel edge estimate; +/- one pixel. White lamp. |
| B07 | 5, 32, 7, 34 | native | `rear-cab/face/lamps/head-lamp` | 16.667, 64.000, 6.667, 4.000 | 15.705, 63.239, 8.324, 4.839 | -0.962, -0.761, 1.657, 0.839 | 1.055 | 1.055 | Native pixel edge estimate; +/- one pixel. White lamp. |
| F08 | 11, 35, 19, 38 | native | `front-cab/face/number-plate` | 36.667, 70.000, 26.667, 6.000 | 36.433, 71.000, 27.133, 4.000 | -0.233, 1.000, 0.467, -2.000 | 0.925 | 0.925 | Native pixel edge estimate; +/- one pixel. |
| B08 | 11, 35, 19, 38 | native | `rear-cab/face/number-plate` | 36.667, 70.000, 26.667, 6.000 | 36.433, 71.000, 27.133, 4.000 | -0.233, 1.000, 0.467, -2.000 | 0.925 | 0.925 | Native pixel edge estimate; +/- one pixel. |
| F09 | 3, 38, 9, 42 | native | `front-cab/lower-end/right-buffer/head` | 10.000, 76.000, 20.000, 8.000 | 10.833, 76.600, 20.000, 5.600 | 0.833, 0.600, -0.000, -2.400 | 0.958 | 0.958 | Native pixel edge estimate; +/- one pixel. Rectangular buffer head. |
| B09 | 3, 38, 9, 42 | native | `rear-cab/lower-end/right-buffer/head` | 10.000, 76.000, 20.000, 8.000 | 10.833, 76.600, 20.000, 5.600 | 0.833, 0.600, -0.000, -2.400 | 0.958 | 0.958 | Native pixel edge estimate; +/- one pixel. Rectangular buffer head. |
| F10 | 0, 43, 30, 47 | native | `front-cab/lower-end/plough` | 0.000, 86.000, 100.000, 8.000 | 1.667, 85.000, 96.667, 11.000 | 1.667, -1.000, -3.333, 3.000 | 2.250 | 2.250 | Native pixel edge estimate; +/- one pixel. |
| B10 | 0, 43, 30, 47 | native | `rear-cab/lower-end/plough` | 0.000, 86.000, 100.000, 8.000 | 1.667, 85.000, 96.667, 11.000 | 1.667, -1.000, -3.333, 3.000 | 2.250 | 2.250 | Native pixel edge estimate; +/- one pixel. |
| R01 | 9, 17, 14, 22 | native | `sides/right-side/left-cab/cab-window` | 5.000, 34.000, 2.778, 10.000 | 5.000, 34.000, 2.778, 10.000 | 0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R02 | 17, 17, 21, 22 | native | `sides/right-side/left-cab/door/window` | 9.444, 34.000, 2.222, 10.000 | 9.333, 34.000, 2.444, 10.000 | -0.111, 0.000, 0.222, 0.000 | 0.083 | 0.083 | Native pixel edge estimate; +/- one pixel. The door's window. |
| R03 | 25, 16, 51, 30 | native | `sides/right-side/left-cab/yellow-bay/frame` | 13.889, 32.000, 14.444, 28.000 | 13.889, 32.400, 14.444, 27.200 | 0.000, 0.400, -0.000, -0.800 | 1.478 | 0.300 | Native pixel edge estimate; +/- one pixel. The louvred bay behind the cab. |
| R04 | 58, 17, 63, 22 | native | `sides/right-side/windows/window-1` | 32.222, 34.000, 2.778, 10.000 | 32.222, 34.000, 2.778, 10.000 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. Machine-room window. |
| R05 | 78, 17, 83, 22 | native | `sides/right-side/windows/window-2` | 43.333, 34.000, 2.778, 10.000 | 43.333, 34.000, 2.778, 10.000 | 0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. Machine-room window. |
| R06 | 85, 17, 90, 22 | native | `sides/right-side/windows/window-3` | 47.222, 34.000, 2.778, 10.000 | 47.222, 34.000, 2.778, 10.000 | 0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. Machine-room window. |
| R07 | 102, 17, 107, 22 | native | `sides/right-side/windows/window-4` | 56.667, 34.000, 2.778, 10.000 | 56.667, 34.000, 2.778, 10.000 | 0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. Machine-room window. |
| R08 | 5, 30, 170, 35 | native | `body/shell/side-right/band-1`, `body/shell/cab-right/band-1`, `body/shell/front/band-1`, `body/shell/rear/band-1` | 2.778, 60.000, 91.667, 10.000 | 2.778, 60.000, 91.667, 10.000 | 0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Livery band 1.5 .. 2.0 m (navy). |
| R09 | 63, 40, 112, 47 | native | `underframe/fuel-tank` | 35.000, 80.000, 27.222, 14.000 | 35.000, 80.000, 27.222, 13.600 | -0.000, 0.000, 0.000, -0.400 | 0.100 | 0.100 | XML 'box' clip 6.3 .. 11.2, 0.3 .. 1.0 m. |
