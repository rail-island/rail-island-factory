# CSD T 679.0: native reference comparison

**Covers** - native pixel annotations, baseline and final orthographic errors of `veh-csd-t679-0` (the default build, vlakosimdb `csd_t_679`).
**Code** - `generator/dieselComparison.ts`, `generator/dieselReport.ts`, `native/landmarks.json`.
**See also** - [source notes](SOURCES.md), [photographs](PHOTOS.md), [the models' reference](../../docs/models/diesel-locos.md).

Model geometry revision (SHA-256 of the comparison GLB): `89e4d81ddd9e2f7f20f94a1eadef3d9fc8c346be90182fce89010750c64a191e`.

Regenerate with `pnpm exec tsx generator/dieselReport.ts`. The baseline is the first authored model (a new model: no earlier factory version existed), stored in `native/baseline.json` with the same annotations.

Canvases: side 190 x 44 px, front 30 x 44 px, 0.1 m a pixel, including empty space; origin top left, X right, Y down. Mapping: source x = Factory x / 0.95 + 9.45 (the drawing is scaled to the published 18.0 m over the buffers); the side canvas is 19 x 4.4 m, the front 3 x 4.4 m. The +X face plots (half width - z, height - y), the -X face (half width + z, height - y), both against the one shared `x_both` BMP; both sides plot the source x against the one shared `z_both` BMP, so the -Z elevation is mirrored relative to an outside observer.

Each vector is (left, top, width, height). Percentages are 100*x/W, 100*y/H, 100*w/W, 100*h/H. Signed delta = model minus source in percentage points. MAE = sum(abs(delta)) / (4 * number of boxes). Actual GLB vertices are selected by named scope triangle ranges; bounds include occluded vertices. Native BMPs, never the enhanced `_4x` textures, define the measurements.

| View | Boxes | Baseline MAE (pp) | Final MAE (pp) |
|---|---:|---:|---:|
| x_front | 9 | 0.819 | 0.819 |
| x_rear | 9 | 0.819 | 0.819 |
| z_right | 9 | 0.646 | 0.646 |
| All | 27 | 0.761 | 0.761 |

One pixel is 3.333 pp horizontally at the front, 0.526 pp horizontally at the sides and 2.273 pp vertically. Rows with a tolerance above about one pixel are deliberate departures, explained in their uncertainty column.

Annotated views (generated locally, not committed):

- x_front: [native](../../export/review/csd-t679/x_front-native.svg), [model](../../export/review/csd-t679/x_front-model.svg)
- x_rear: [native](../../export/review/csd-t679/x_rear-native.svg), [model](../../export/review/csd-t679/x_rear-model.svg)
- z_right: [native](../../export/review/csd-t679/z_right-native.svg), [model](../../export/review/csd-t679/z_right-model.svg)
- [Three-quarter thumbnail](../../export/thumbs/veh-csd-t679-0.png)

| ID | Native pixel edges | Reference | Mesh scope(s) | Source % (x,y,w,h) | Model % | Signed delta (pp) | Baseline abs. mean (pp) | Final abs. mean (pp) | Uncertainty |
|---|---|---|---|---|---|---|---:|---:|---|
| F01 | 0, 6, 30, 15 | native | `front-cab/face/windscreen/surround` | 0.000, 13.636, 100.000, 20.455 | -0.288, 13.603, 100.576, 19.384 | -0.288, -0.033, 0.576, -1.070 | 0.492 | 0.492 | Native pixel edge estimate; +/- one pixel. The blue frame round both panes. |
| B01 | 0, 6, 30, 15 | native | `rear-cab/face/windscreen/surround` | 0.000, 13.636, 100.000, 20.455 | -0.288, 13.603, 100.576, 19.384 | -0.288, -0.033, 0.576, -1.070 | 0.492 | 0.492 | Native pixel edge estimate; +/- one pixel. The blue frame round both panes. |
| F02 | 0, 7, 14, 14 | native | `front-cab/face/windscreen/left-pane` | 0.000, 15.909, 46.667, 15.909 | 2.021, 15.408, 44.646, 15.745 | 2.021, -0.501, -2.020, -0.164 | 1.177 | 1.177 | Native pixel edge estimate; +/- one pixel. |
| B02 | 0, 7, 14, 14 | native | `rear-cab/face/windscreen/left-pane` | 0.000, 15.909, 46.667, 15.909 | 2.021, 15.408, 44.646, 15.745 | 2.021, -0.501, -2.020, -0.164 | 1.177 | 1.177 | Native pixel edge estimate; +/- one pixel. |
| F03 | 16, 7, 30, 14 | native | `front-cab/face/windscreen/right-pane` | 53.333, 15.909, 46.667, 15.909 | 53.332, 15.408, 44.646, 15.745 | -0.001, -0.501, -2.020, -0.164 | 0.672 | 0.672 | Native pixel edge estimate; +/- one pixel. |
| B03 | 16, 7, 30, 14 | native | `rear-cab/face/windscreen/right-pane` | 53.333, 15.909, 46.667, 15.909 | 53.332, 15.408, 44.646, 15.745 | -0.001, -0.501, -2.020, -0.164 | 0.672 | 0.672 | Native pixel edge estimate; +/- one pixel. |
| F04 | 14, 1, 16, 3 | native | `front-cab/face/headlight` | 46.667, 2.273, 6.667, 4.545 | 45.667, 1.281, 8.667, 5.620 | -1.000, -0.992, 2.000, 1.074 | 1.267 | 1.267 | Native pixel edge estimate; +/- one pixel. The headlight on the roof's front edge (XML 'light'). |
| B04 | 14, 1, 16, 3 | native | `rear-cab/face/headlight` | 46.667, 2.273, 6.667, 4.545 | 45.667, 1.281, 8.667, 5.620 | -1.000, -0.992, 2.000, 1.074 | 1.267 | 1.267 | Native pixel edge estimate; +/- one pixel. The headlight on the roof's front edge (XML 'light'). |
| F05 | 0, 19, 30, 25 | native | `body/shell/front/band-4` | 0.000, 43.182, 100.000, 13.636 | 0.000, 43.182, 100.000, 13.636 | 0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Livery band 1.9 .. 2.5 m (cream). |
| B05 | 0, 19, 30, 25 | native | `body/shell/rear/band-4` | 0.000, 43.182, 100.000, 13.636 | 0.000, 43.182, 100.000, 13.636 | 0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Livery band 1.9 .. 2.5 m (cream). |
| F06 | 0, 25, 30, 31 | native | `body/shell/front/band-3` | 0.000, 56.818, 100.000, 13.636 | 0.000, 56.818, 100.000, 13.636 | 0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Livery band 1.3 .. 1.9 m (orange). |
| B06 | 0, 25, 30, 31 | native | `body/shell/rear/band-3` | 0.000, 56.818, 100.000, 13.636 | 0.000, 56.818, 100.000, 13.636 | 0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Livery band 1.3 .. 1.9 m (orange). |
| F07 | 0, 32, 30, 34 | native | `body/shell/front/band-1` | 0.000, 72.727, 100.000, 4.545 | 0.000, 72.727, 100.000, 4.545 | 0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Livery band 1.0 .. 1.2 m (olive). |
| B07 | 0, 32, 30, 34 | native | `body/shell/rear/band-1` | 0.000, 72.727, 100.000, 4.545 | 0.000, 72.727, 100.000, 4.545 | 0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Livery band 1.0 .. 1.2 m (olive). |
| F08 | 5, 32, 7, 34 | native | `front-cab/face/lamps/head-lamp` | 16.667, 72.727, 6.667, 4.545 | 28.000, 72.622, 7.333, 4.755 | 11.333, -0.105, 0.667, 0.210 | 3.079 | 3.079 | The lamp in the olive band; moved 0.35 m inboard of the standard buffers, which the BMP draws 0.2 m lower (deliberate). |
| B08 | 5, 32, 7, 34 | native | `rear-cab/face/lamps/head-lamp` | 16.667, 72.727, 6.667, 4.545 | 28.000, 72.622, 7.333, 4.755 | 11.333, -0.105, 0.667, 0.210 | 3.079 | 3.079 | The lamp in the olive band; moved 0.35 m inboard of the standard buffers, which the BMP draws 0.2 m lower (deliberate). |
| F09 | 0, 35, 30, 44 | native | `front-cab/lower-end/skirt` | 0.000, 79.545, 100.000, 20.455 | 0.000, 79.545, 100.000, 17.727 | 0.000, 0.000, 0.000, -2.727 | 0.682 | 0.682 | Native pixel edge estimate; +/- one pixel. The cream skirt under the cab (XML base clip). |
| B09 | 0, 35, 30, 44 | native | `rear-cab/lower-end/skirt` | 0.000, 79.545, 100.000, 20.455 | 0.000, 79.545, 100.000, 17.727 | 0.000, 0.000, 0.000, -2.727 | 0.682 | 0.682 | Native pixel edge estimate; +/- one pixel. The cream skirt under the cab (XML base clip). |
| R01 | 7, 7, 11, 14 | native | `sides/right-side/left-cab/cab-windows/window-1` | 3.684, 15.909, 2.105, 15.909 | 3.947, 14.773, 1.579, 18.182 | 0.263, -1.136, -0.526, 2.273 | 1.050 | 1.050 | Native pixel edge estimate; +/- one pixel. The cab side window ahead (columns 7..10). |
| R09 | 12, 7, 17, 14 | native | `sides/right-side/left-cab/cab-windows/window-2` | 6.316, 15.909, 2.632, 15.909 | 6.316, 14.773, 2.632, 18.182 | -0.000, -1.136, -0.000, 2.273 | 0.852 | 0.852 | Native pixel edge estimate; +/- one pixel. The second cab window (columns 12..16). |
| R02 | 20, 7, 26, 14 | native | `sides/right-side/left-cab/door/window` | 10.526, 15.909, 3.158, 15.909 | 10.471, 15.455, 2.742, 17.500 | -0.055, -0.455, -0.416, 1.591 | 0.629 | 0.629 | Native pixel edge estimate; +/- one pixel. The door's window. |
| R03 | 30, 8, 51, 25 | native | `sides/right-side/intake` | 15.789, 18.182, 11.053, 38.636 | 15.789, 18.182, 10.526, 38.636 | -0.000, 0.000, -0.526, -0.000 | 0.132 | 0.132 | Native pixel edge estimate; +/- one pixel. The louvred intake, two panels. |
| R04 | 58, 6, 131, 19 | native | `sides/right-side/machine-room-window/frame` | 30.526, 13.636, 38.421, 29.545 | 30.526, 13.636, 38.421, 28.409 | 0.000, 0.000, -0.000, -1.136 | 0.284 | 0.284 | Native pixel edge estimate; +/- one pixel. The machine room's long window. |
| R05 | 155, 5, 161, 31 | native | `sides/right-side/ladder` | 81.579, 11.364, 3.158, 59.091 | 81.842, 11.364, 2.368, 56.818 | 0.263, -0.000, -0.789, -2.273 | 0.831 | 0.831 | Native pixel edge estimate; +/- one pixel. The ladder to the roof. |
| R06 | 91, 24, 99, 27 | native | `sides/right-side/number-plate` | 47.895, 54.545, 4.211, 6.818 | 47.958, 56.136, 3.557, 3.636 | 0.064, 1.591, -0.654, -3.182 | 1.373 | 1.373 | Native pixel edge estimate; +/- one pixel. The model's plate is as wide as T 679.001. |
| R07 | 6, 32, 184, 34 | native | `body/shell/side-right/band-1`, `body/shell/cab-right/band-1` | 3.158, 72.727, 93.684, 4.545 | 3.712, 72.727, 92.050, 4.545 | 0.554, -0.000, -1.634, 0.000 | 0.547 | 0.547 | Livery band 1.0 .. 1.2 m (olive). |
| R08 | 74, 35, 115, 42 | native | `underframe/fuel-tank` | 38.947, 79.545, 21.579, 15.909 | 38.947, 79.545, 21.579, 15.455 | 0.000, 0.000, -0.000, -0.455 | 0.114 | 0.114 | Native pixel edge estimate; +/- one pixel. The fuel tank (XML 'box' 7.4 .. 11.5). |
