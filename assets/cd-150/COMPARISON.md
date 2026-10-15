# CD 150 native reference comparison

**Covers** - native pixel annotations, baseline and final orthographic errors.
**Code** - `generator/cd150.ts`, `generator/cd150Comparison.ts`, `generator/cd150Report.ts`.
**See also** - [source notes](SOURCES.md), [vehicle reference](../../docs/models/vehicles.md).

Model geometry revision (SHA-256 of comparison GLB): `ee1e08cdcfabf988bb7a087e2c38aa3eeed028883137768c04935f63502e6782`.

Regenerate with `pnpm build:models && pnpm exec tsx generator/cd150Report.ts`.
The initial authored model is the baseline; this is a new model, so no prior factory CD 150 existed.
Baseline and final use the same annotations. Buffer selectors were corrected before baseline capture; the number-plate selector was renamed to housing when its panel was split at the cab slope, without changing its baseline measurement.

Canvases: front 3 x 6 m (30 x 60 px), sides 17 x 6 m (170 x 60 px), including empty space. Origin is top left; X right, Y down. Source x maps to Factory x + 8.5; source z maps to -Factory z. Both side plots use source x increasing to the right, so the left elevation is mirrored relative to an outside observer. The front plot uses (1.5 - z, 6 - y).

Each vector is (left, top, width, height). Percentages are 100*x/W, 100*y/H, 100*w/W, 100*h/H. Signed delta = model minus source in percentage points. MAE = sum(abs(delta)) / (4 * number of boxes). Actual GLB vertices are selected by named scope/material triangle ranges; bounds include occluded vertices. Frames and lenses are separate where annotated. Native BMPs, never enhanced 4x textures, define the measurements, except where a row's reference is `photo`: there a box measured on the photographs (blue in the views) supersedes the native estimate (red), which stays in the record. Baseline columns are against the native boxes.

| View | Boxes | Baseline MAE (pp) | Final MAE (pp) |
|---|---:|---:|---:|
| x_both | 13 | 0.812 | 0.498 |
| z_dec | 13 | 0.190 | 0.000 |
| z_inc | 13 | 0.717 | 0.026 |
| All | 39 | 0.573 | 0.175 |

One pixel is 3.333 pp horizontally at the front, 0.588 pp horizontally at the sides, and 1.667 pp vertically. The 1.75 m buffer spacing is retained; the coarse front silhouettes differ by up to 1.75 px. The CD emblem is a shared outline approximation. The front plate and marker lamps follow the photographs: the plate just below the cream/green boundary, chrome-rimmed white/red lamp pairs level with it, a dark twin-lens headlight on the roof edge. Full running gear uses 1.25 m wheels rather than the source's painted low box. These choices are outside a claim of photographic accuracy.

Annotated views (generated locally, not committed):

- x_both: [native](../../export/review/cd-150/x_both-native.svg), [model](../../export/review/cd-150/x_both-model.svg)
- z_dec: [native](../../export/review/cd-150/z_dec-native.svg), [model](../../export/review/cd-150/z_dec-model.svg)
- z_inc: [native](../../export/review/cd-150/z_inc-native.svg), [model](../../export/review/cd-150/z_inc-model.svg)
- [Rear model](../../export/review/cd-150/rear-model.svg)
- [Three-quarter thumbnail](../../export/thumbs/veh-cd-150.png)

| ID | Native pixel edges | Reference | Mesh scope(s) | Source % (x,y,w,h) | Model % | Signed delta (pp) | Baseline abs. mean (pp) | Final abs. mean (pp) | Uncertainty |
|---|---|---|---|---|---|---|---:|---:|---|
| F01 | 1, 24, 14, 32 | native | `front-cab/windscreen/right-pane/slab-1` | 3.333, 40.000, 43.333, 13.333 | 4.000, 40.000, 42.667, 13.333 | 0.667, 0.000, -0.667, -0.000 | 0.333 | 0.333 | Native pixel edge estimate; +/- one pixel. |
| F02 | 2, 25, 14, 32 | native | `front-cab/windscreen/right-pane/slab-2` | 6.667, 41.667, 40.000, 11.667 | 5.667, 40.833, 39.333, 11.833 | -1.000, -0.833, -0.667, 0.167 | 0.667 | 0.667 | Native pixel edge estimate; +/- one pixel. |
| F03 | 16, 24, 29, 32 | native | `front-cab/windscreen/left-pane/slab-1` | 53.333, 40.000, 43.333, 13.333 | 53.333, 40.000, 42.667, 13.333 | 0.000, 0.000, -0.667, -0.000 | 0.167 | 0.167 | Native pixel edge estimate; +/- one pixel. |
| F04 | 17, 25, 29, 32 | native | `front-cab/windscreen/left-pane/slab-2` | 56.667, 41.667, 40.000, 11.667 | 55.000, 40.833, 39.333, 11.833 | -1.667, -0.833, -0.667, 0.167 | 0.833 | 0.833 | Native pixel edge estimate; +/- one pixel. |
| F05 | 13, 22, 17, 24 | native | `front-cab/lamps/headlight/lenses` | 43.333, 36.667, 13.333, 3.333 | 43.000, 36.333, 14.000, 2.667 | -0.333, -0.333, 0.667, -0.667 | 0.000 | 0.500 | Native pixel edge estimate; +/- one pixel. The 4 x 2 px light patch is the twin lens pair of the dark roof-edge housing (photographs). |
| F06 | 10, 43, 20, 46 | photo 10, 41.3, 20, 43.6 | `front-cab/number-plate/housing` | 33.333, 68.833, 33.333, 3.833 | 33.333, 68.833, 33.333, 3.833 | 0.000, -0.000, 0.000, 0.000 | 0.833 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| F07 | 12, 36, 18, 40 | native | `front-cab/emblem` | 40.000, 60.000, 20.000, 6.667 | 40.000, 60.001, 16.098, 6.329 | -0.000, 0.001, -3.902, -0.338 | 1.060 | 1.060 | Period badge approximated with the shared CD emblem; raster is six pixels wide. |
| F08 | 1, 45, 3, 47 | photo 2.75, 41.55, 4.65, 43.45 | `front-cab/lamps/right-marker-1/slab-2` | 9.167, 69.250, 6.333, 3.167 | 9.167, 69.250, 6.333, 3.167 | -0.000, -0.000, 0.000, 0.000 | 0.979 | 0.000 | Circular lenses retained; native source paints yellow light patches without resolving lens colours. |
| F09 | 5, 45, 7, 47 | photo 5.35, 41.55, 7.25, 43.45 | `front-cab/lamps/right-marker-0/slab-2` | 17.833, 69.250, 6.333, 3.167 | 17.833, 69.250, 6.333, 3.167 | 0.000, -0.000, -0.000, 0.000 | 0.896 | 0.000 | Circular lenses retained; native source paints yellow light patches without resolving lens colours. |
| F10 | 23, 45, 25, 47 | photo 22.75, 41.55, 24.65, 43.45 | `front-cab/lamps/left-marker-0/slab-2` | 75.833, 69.250, 6.333, 3.167 | 75.833, 69.250, 6.333, 3.167 | -0.000, -0.000, -0.000, 0.000 | 0.979 | 0.000 | Circular lenses retained; native source paints yellow light patches without resolving lens colours. |
| F11 | 27, 45, 29, 47 | photo 25.35, 41.55, 27.25, 43.45 | `front-cab/lamps/left-marker-1/slab-2` | 84.500, 69.250, 6.333, 3.167 | 84.500, 69.250, 6.333, 3.167 | -0.000, -0.000, 0.000, 0.000 | 0.896 | 0.000 | Circular lenses retained; native source paints yellow light patches without resolving lens colours. |
| F12 | 1, 48, 8, 52 | native | `front-cab/buffers/sweep-4` | 3.333, 80.000, 23.333, 6.667 | 9.167, 80.000, 23.333, 6.667 | 5.833, -0.000, 0.000, 0.000 | 1.458 | 1.458 | Keep 1.75 m mechanical buffer spacing despite coarse raster. |
| F13 | 22, 48, 29, 52 | native | `front-cab/buffers/sweep-2` | 73.333, 80.000, 23.333, 6.667 | 67.500, 80.000, 23.333, 6.667 | -5.833, -0.000, 0.000, 0.000 | 1.458 | 1.458 | Keep 1.75 m mechanical buffer spacing despite coarse raster. |
| D01 | 16, 25, 26, 44 | native | `rear-cab/right-side/door/slab-1` | 9.412, 41.667, 5.882, 31.667 | 9.412, 41.667, 5.882, 31.667 | -0.000, 0.000, 0.000, -0.000 | 0.368 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| D02 | 18, 26, 24, 33 | native | `rear-cab/right-side/door/glass` | 10.588, 43.333, 3.529, 11.667 | 10.588, 43.333, 3.529, 11.667 | 0.000, -0.000, -0.000, 0.000 | 0.397 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| D03 | 144, 25, 154, 44 | native | `front-cab/right-side/door/slab-1` | 84.706, 41.667, 5.882, 31.667 | 84.706, 41.667, 5.882, 31.667 | 0.000, 0.000, 0.000, -0.000 | 0.074 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| D04 | 146, 26, 152, 33 | native | `front-cab/right-side/door/glass` | 85.882, 43.333, 3.529, 11.667 | 85.882, 43.333, 3.529, 11.667 | -0.000, -0.000, -0.000, 0.000 | 0.103 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| D05 | 80, 37, 90, 40 | native | `body/right-side/number-plate/slab-1` | 47.059, 61.667, 5.882, 5.000 | 47.059, 61.667, 5.882, 5.000 | 0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| D06 | 30, 25, 59, 41 | native | `body/right-side/machine-room-grilles/bank-1/housing` | 17.647, 41.667, 17.059, 26.667 | 17.647, 41.667, 17.059, 26.667 | 0.000, 0.000, 0.000, 0.000 | 0.147 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| D07 | 111, 25, 140, 41 | native | `body/right-side/machine-room-grilles/bank-2/housing` | 65.294, 41.667, 17.059, 26.667 | 65.294, 41.667, 17.059, 26.667 | -0.000, 0.000, 0.000, 0.000 | 0.147 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| D08 | 63, 24, 70, 31 | native | `body/cooler/right-grilles/panel-1/housing` | 37.059, 40.000, 4.118, 11.667 | 37.059, 40.000, 4.118, 11.667 | -0.000, 0.000, 0.000, -0.000 | 0.206 | 0.000 | Native gray grille frame edges; one pixel uncertainty; dark recess excluded. |
| D09 | 70, 24, 77, 31 | native | `body/cooler/right-grilles/panel-2/housing` | 41.176, 40.000, 4.118, 11.667 | 41.176, 40.000, 4.118, 11.667 | 0.000, 0.000, -0.000, -0.000 | 0.235 | 0.000 | Native gray grille frame edges; one pixel uncertainty; dark recess excluded. |
| D10 | 77, 24, 84, 31 | native | `body/cooler/right-grilles/panel-3/housing` | 45.294, 40.000, 4.118, 11.667 | 45.294, 40.000, 4.118, 11.667 | -0.000, 0.000, 0.000, -0.000 | 0.265 | 0.000 | Native gray grille frame edges; one pixel uncertainty; dark recess excluded. |
| D11 | 85, 24, 92, 31 | native | `body/cooler/right-grilles/panel-4/housing` | 50.000, 40.000, 4.118, 11.667 | 50.000, 40.000, 4.118, 11.667 | 0.000, 0.000, -0.000, -0.000 | 0.147 | 0.000 | Native gray grille frame edges; one pixel uncertainty; dark recess excluded. |
| D12 | 92, 24, 99, 31 | native | `body/cooler/right-grilles/panel-5/housing` | 54.118, 40.000, 4.118, 11.667 | 54.118, 40.000, 4.118, 11.667 | -0.000, 0.000, -0.000, -0.000 | 0.176 | 0.000 | Native gray grille frame edges; one pixel uncertainty; dark recess excluded. |
| D13 | 99, 24, 106, 31 | native | `body/cooler/right-grilles/panel-6/housing` | 58.235, 40.000, 4.118, 11.667 | 58.235, 40.000, 4.118, 11.667 | -0.000, 0.000, -0.000, -0.000 | 0.206 | 0.000 | Native gray grille frame edges; one pixel uncertainty; dark recess excluded. |
| I01 | 16, 25, 26, 44 | native | `rear-cab/left-side/door/slab-1` | 9.412, 41.667, 5.882, 31.667 | 9.412, 41.667, 5.882, 31.667 | -0.000, 0.000, 0.000, -0.000 | 0.368 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| I02 | 18, 26, 24, 33 | native | `rear-cab/left-side/door/glass` | 10.588, 43.333, 3.529, 11.667 | 10.588, 43.333, 3.529, 11.667 | 0.000, -0.000, -0.000, 0.000 | 0.397 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| I03 | 144, 25, 154, 44 | native | `front-cab/left-side/door/slab-1` | 84.706, 41.667, 5.882, 31.667 | 84.706, 41.667, 5.882, 31.667 | 0.000, 0.000, 0.000, -0.000 | 0.074 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| I04 | 146, 26, 152, 33 | native | `front-cab/left-side/door/glass` | 85.882, 43.333, 3.529, 11.667 | 85.882, 43.333, 3.529, 11.667 | -0.000, -0.000, -0.000, 0.000 | 0.103 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| I05 | 80, 37, 90, 40 | native | `body/left-side/number-plate/slab-1` | 47.059, 61.667, 5.882, 5.000 | 47.059, 61.667, 5.882, 5.000 | 0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| I06 | 38, 27, 47, 33 | native | `body/left-side/machine-room-windows/window-1/slab-1` | 22.353, 45.000, 5.294, 10.000 | 22.353, 45.000, 5.294, 10.000 | 0.000, 0.000, -0.000, -0.000 | 0.074 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| I07 | 68, 27, 77, 33 | native | `body/left-side/machine-room-windows/window-2/slab-1` | 40.000, 45.000, 5.294, 10.000 | 40.000, 45.000, 5.294, 10.000 | -0.000, 0.000, 0.000, -0.000 | 0.074 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| I08 | 93, 27, 102, 33 | native | `body/left-side/machine-room-windows/window-3/slab-1` | 54.706, 45.000, 5.294, 10.000 | 54.706, 45.000, 5.294, 10.000 | 0.000, 0.000, 0.000, -0.000 | 0.074 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| I09 | 123, 27, 132, 33 | native | `body/left-side/machine-room-windows/window-4/slab-1` | 72.353, 45.000, 5.294, 10.000 | 72.353, 45.000, 5.294, 10.000 | -0.000, 0.000, -0.000, -0.000 | 0.074 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| I10 | 64, 14, 75, 23 | native | `body/cooler/left-grilles/panel-1/housing` | 37.647, 23.333, 6.471, 15.000 | 37.647, 23.500, 6.471, 14.833 | 0.000, 0.167, -0.000, -0.167 | 1.331 | 0.083 | Native gray grille frame edges; one pixel uncertainty; dark recess excluded. |
| I11 | 74, 14, 85, 23 | native | `body/cooler/left-grilles/panel-2/housing` | 43.529, 23.333, 6.471, 15.000 | 43.529, 23.500, 6.471, 14.833 | -0.000, 0.167, 0.000, -0.167 | 1.743 | 0.083 | Native gray grille frame edges; one pixel uncertainty; dark recess excluded. |
| I12 | 85, 14, 96, 23 | native | `body/cooler/left-grilles/panel-3/housing` | 50.000, 23.333, 6.471, 15.000 | 50.000, 23.500, 6.471, 14.833 | 0.000, 0.167, 0.000, -0.167 | 2.301 | 0.083 | Native gray grille frame edges; one pixel uncertainty; dark recess excluded. |
| I13 | 95, 14, 106, 23 | native | `body/cooler/left-grilles/panel-4/housing` | 55.882, 23.333, 6.471, 15.000 | 55.882, 23.500, 6.471, 14.833 | 0.000, 0.167, -0.000, -0.167 | 2.713 | 0.083 | Native gray grille frame edges; one pixel uncertainty; dark recess excluded. |
