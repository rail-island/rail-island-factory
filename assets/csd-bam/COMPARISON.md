# CSD Bam native reference comparison

**Covers** - native pixel annotations, baseline and final orthographic errors.
**Code** - `generator/csdCoaches.ts`, `generator/csdCoachComparison.ts`, `generator/csdCoachReport.ts`.
**See also** - [source notes](SOURCES.md), [CSD coaches](../../docs/models/csd-coaches.md).

Model geometry revision (SHA-256 of comparison GLB): `6cb97b2a9110eac4b8ffd0bab3e208fa6bd4279fe7de3100a2c9c4520cca5aac`.

Regenerate with `pnpm exec tsx generator/csdCoachReport.ts csd_bam`. The baseline is the first authored geometry (`native/baseline.json`); baseline and final use the same annotations.

Canvases: sides 23 x 4 m (230 x 40 px), ends 3 x 4 m (30 x 40 px), including empty space, 0.1 m a pixel. Origin top left; x right, y down. Side u = 10 * source x = 10 * (Factory X + 11.15); both sides keep increasing source x, so the left (-Z) elevation is mirrored relative to an outside observer, as its BMP is. Ends are seen from outside: rear u = 10 * (z + 1.5), front u = 10 * (1.5 - z). v = 10 * (4 - y).

Each vector is (left, top, width, height). Percentages are 100*x/W, 100*y/H, 100*w/W, 100*h/H of the native canvas. Signed delta = model minus source in percentage points. MAE = sum(abs(delta)) / (4 * number of boxes). Model boxes are the bounds of actual GLB vertices of the named scopes, occluded vertices included. Only the original BMPs define the measurements, never the 4x textures.

| View | Boxes | Baseline MAE (pp) | Final MAE (pp) |
|---|---:|---:|---:|
| z_both, right | 16 | 0.004 | 0.004 |
| z_both, left | 16 | 0.004 | 0.004 |
| x_both, rear | 8 | 1.250 | 1.250 |
| x_both, front | 8 | 1.250 | 1.250 |
| All | 48 | 0.419 | 0.419 |

One pixel is 0.435 pp horizontally on the sides, 3.333 pp horizontally on the ends and 2.500 pp vertically. The model was authored from these same measured boxes, so the residuals measure the transfer onto the XML body (tapered and rounded ends, sloped faces, 5 mm edge clearances) and the deliberate mechanical choices (1.75 m buffer spacing, round lamp lenses), not photographic accuracy.

Annotated views (generated locally, not committed):

- z_both, right: [native](../../export/review/csd_bam/z_both-right-native.svg), [model](../../export/review/csd_bam/z_both-right-model.svg)
- z_both, left: [native](../../export/review/csd_bam/z_both-left-native.svg), [model](../../export/review/csd_bam/z_both-left-model.svg)
- x_both, rear: [native](../../export/review/csd_bam/x_both-rear-native.svg), [model](../../export/review/csd_bam/x_both-rear-model.svg)
- x_both, front: [native](../../export/review/csd_bam/x_both-front-native.svg), [model](../../export/review/csd_bam/x_both-front-model.svg)
- [Three-quarter view](../../export/review/csd_bam/three-quarter.png), [thumbnail](../../export/thumbs/veh-csd-bam.png)

| ID | View | Element | Native pixel edges | Mesh scope(s) | Source % (x,y,w,h) | Model % | Signed delta (pp) | Baseline abs. mean (pp) | Final abs. mean (pp) | Uncertainty |
|---|---|---|---|---|---|---|---|---:|---:|---|
| R01 | z_both, right | window 1 frame | 24, 10, 34, 19 | `body/right-side/window-1/frame` | 10.435, 25.000, 4.348, 22.500 | 10.435, 25.000, 4.348, 22.500 | 0.000, 0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R02 | z_both, right | window 2 frame | 39, 10, 49, 19 | `body/right-side/window-2/frame` | 16.957, 25.000, 4.348, 22.500 | 16.957, 25.000, 4.348, 22.500 | 0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R03 | z_both, right | window 3 frame | 54, 10, 64, 19 | `body/right-side/window-3/frame` | 23.478, 25.000, 4.348, 22.500 | 23.478, 25.000, 4.348, 22.500 | 0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R04 | z_both, right | window 4 frame | 69, 10, 79, 19 | `body/right-side/window-4/frame` | 30.000, 25.000, 4.348, 22.500 | 30.000, 25.000, 4.348, 22.500 | 0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R05 | z_both, right | window 5 frame | 84, 10, 94, 19 | `body/right-side/window-5/frame` | 36.522, 25.000, 4.348, 22.500 | 36.522, 25.000, 4.348, 22.500 | 0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R06 | z_both, right | window 6 frame | 99, 10, 109, 19 | `body/right-side/window-6/frame` | 43.043, 25.000, 4.348, 22.500 | 43.043, 25.000, 4.348, 22.500 | 0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R07 | z_both, right | window 7 frame | 114, 10, 124, 19 | `body/right-side/window-7/frame` | 49.565, 25.000, 4.348, 22.500 | 49.565, 25.000, 4.348, 22.500 | 0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R08 | z_both, right | window 8 frame | 129, 10, 139, 19 | `body/right-side/window-8/frame` | 56.087, 25.000, 4.348, 22.500 | 56.087, 25.000, 4.348, 22.500 | 0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R09 | z_both, right | window 9 frame | 144, 10, 154, 19 | `body/right-side/window-9/frame` | 62.609, 25.000, 4.348, 22.500 | 62.609, 25.000, 4.348, 22.500 | 0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R10 | z_both, right | window 10 frame | 159, 10, 169, 19 | `body/right-side/window-10/frame` | 69.130, 25.000, 4.348, 22.500 | 69.130, 25.000, 4.348, 22.500 | 0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R11 | z_both, right | window 11 frame | 174, 10, 184, 19 | `body/right-side/window-11/frame` | 75.652, 25.000, 4.348, 22.500 | 75.652, 25.000, 4.348, 22.500 | 0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R12 | z_both, right | window 12 frame | 189, 10, 199, 19 | `body/right-side/window-12/frame` | 82.174, 25.000, 4.348, 22.500 | 82.174, 25.000, 4.348, 22.500 | 0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R13 | z_both, right | door 1 outline | 12, 8, 20, 31 | `body/right-side/door-1/outline` | 5.217, 20.000, 3.478, 57.500 | 5.217, 20.000, 3.478, 57.375 | 0.000, -0.000, 0.000, -0.125 | 0.031 | 0.031 | Door window frame fills the leaf width; +/- one pixel. |
| R14 | z_both, right | door 1 window 1 frame | 13, 9, 19, 19 | `body/right-side/door-1/window-1/frame` | 5.652, 22.500, 2.609, 25.000 | 5.652, 22.500, 2.609, 25.000 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Door window frame fills the leaf width; +/- one pixel. |
| R15 | z_both, right | door 2 outline | 203, 8, 211, 31 | `body/right-side/door-2/outline` | 88.261, 20.000, 3.478, 57.500 | 88.261, 20.000, 3.478, 57.375 | -0.000, -0.000, 0.000, -0.125 | 0.031 | 0.031 | Door window frame fills the leaf width; +/- one pixel. |
| R16 | z_both, right | door 2 window 1 frame | 204, 9, 210, 19 | `body/right-side/door-2/window-1/frame` | 88.696, 22.500, 2.609, 25.000 | 88.696, 22.500, 2.609, 25.000 | 0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Door window frame fills the leaf width; +/- one pixel. |
| L01 | z_both, left | window 1 frame | 24, 10, 34, 19 | `body/left-side/window-1/frame` | 10.435, 25.000, 4.348, 22.500 | 10.435, 25.000, 4.348, 22.500 | 0.000, 0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L02 | z_both, left | window 2 frame | 39, 10, 49, 19 | `body/left-side/window-2/frame` | 16.957, 25.000, 4.348, 22.500 | 16.957, 25.000, 4.348, 22.500 | 0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L03 | z_both, left | window 3 frame | 54, 10, 64, 19 | `body/left-side/window-3/frame` | 23.478, 25.000, 4.348, 22.500 | 23.478, 25.000, 4.348, 22.500 | 0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L04 | z_both, left | window 4 frame | 69, 10, 79, 19 | `body/left-side/window-4/frame` | 30.000, 25.000, 4.348, 22.500 | 30.000, 25.000, 4.348, 22.500 | 0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L05 | z_both, left | window 5 frame | 84, 10, 94, 19 | `body/left-side/window-5/frame` | 36.522, 25.000, 4.348, 22.500 | 36.522, 25.000, 4.348, 22.500 | 0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L06 | z_both, left | window 6 frame | 99, 10, 109, 19 | `body/left-side/window-6/frame` | 43.043, 25.000, 4.348, 22.500 | 43.043, 25.000, 4.348, 22.500 | 0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L07 | z_both, left | window 7 frame | 114, 10, 124, 19 | `body/left-side/window-7/frame` | 49.565, 25.000, 4.348, 22.500 | 49.565, 25.000, 4.348, 22.500 | 0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L08 | z_both, left | window 8 frame | 129, 10, 139, 19 | `body/left-side/window-8/frame` | 56.087, 25.000, 4.348, 22.500 | 56.087, 25.000, 4.348, 22.500 | 0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L09 | z_both, left | window 9 frame | 144, 10, 154, 19 | `body/left-side/window-9/frame` | 62.609, 25.000, 4.348, 22.500 | 62.609, 25.000, 4.348, 22.500 | 0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L10 | z_both, left | window 10 frame | 159, 10, 169, 19 | `body/left-side/window-10/frame` | 69.130, 25.000, 4.348, 22.500 | 69.130, 25.000, 4.348, 22.500 | 0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L11 | z_both, left | window 11 frame | 174, 10, 184, 19 | `body/left-side/window-11/frame` | 75.652, 25.000, 4.348, 22.500 | 75.652, 25.000, 4.348, 22.500 | 0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L12 | z_both, left | window 12 frame | 189, 10, 199, 19 | `body/left-side/window-12/frame` | 82.174, 25.000, 4.348, 22.500 | 82.174, 25.000, 4.348, 22.500 | 0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L13 | z_both, left | door 1 outline | 12, 8, 20, 31 | `body/left-side/door-1/outline` | 5.217, 20.000, 3.478, 57.500 | 5.217, 20.000, 3.478, 57.375 | 0.000, -0.000, 0.000, -0.125 | 0.031 | 0.031 | Door window frame fills the leaf width; +/- one pixel. |
| L14 | z_both, left | door 1 window 1 frame | 13, 9, 19, 19 | `body/left-side/door-1/window-1/frame` | 5.652, 22.500, 2.609, 25.000 | 5.652, 22.500, 2.609, 25.000 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Door window frame fills the leaf width; +/- one pixel. |
| L15 | z_both, left | door 2 outline | 203, 8, 211, 31 | `body/left-side/door-2/outline` | 88.261, 20.000, 3.478, 57.500 | 88.261, 20.000, 3.478, 57.375 | -0.000, -0.000, 0.000, -0.125 | 0.031 | 0.031 | Door window frame fills the leaf width; +/- one pixel. |
| L16 | z_both, left | door 2 window 1 frame | 204, 9, 210, 19 | `body/left-side/door-2/window-1/frame` | 88.696, 22.500, 2.609, 25.000 | 88.696, 22.500, 2.609, 25.000 | 0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Door window frame fills the leaf width; +/- one pixel. |
| B01 | x_both, rear | end window 1 | 4, 10, 10, 19 | `rear-end/end-windows/window-1/frame` | 13.333, 25.000, 20.000, 22.500 | 13.500, 25.000, 19.833, 22.500 | 0.167, 0.000, -0.167, 0.000 | 0.084 | 0.083 | Native pixel edge estimate; +/- one pixel. |
| B02 | x_both, rear | end window 2 | 20, 10, 26, 19 | `rear-end/end-windows/window-2/frame` | 66.667, 25.000, 20.000, 22.500 | 66.667, 25.000, 19.833, 22.500 | 0.000, 0.000, -0.167, 0.000 | 0.042 | 0.042 | Native pixel edge estimate; +/- one pixel. |
| B03 | x_both, rear | end door outline | 11, 8, 19, 27 | `rear-end/end-door/outline` | 36.667, 20.000, 26.667, 47.500 | 36.667, 20.000, 26.667, 47.500 | -0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| B04 | x_both, rear | end door window | 12, 10, 18, 19 | `rear-end/end-door/window/frame` | 40.000, 25.000, 20.000, 22.500 | 40.000, 25.000, 20.000, 22.500 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| B05 | x_both, rear | lamp 1 | 5, 24, 6, 25 | `rear-end/lamps/lamp-1` | 16.667, 60.000, 3.333, 2.500 | 15.000, 58.750, 6.667, 5.000 | -1.667, -1.250, 3.333, 2.500 | 2.188 | 2.187 | One-to-three-pixel lamp patch; a round lens of the stated size is kept. |
| B06 | x_both, rear | lamp 2 | 24, 24, 25, 25 | `rear-end/lamps/lamp-2` | 80.000, 60.000, 3.333, 2.500 | 78.333, 58.750, 6.667, 5.000 | -1.667, -1.250, 3.333, 2.500 | 2.188 | 2.187 | One-to-three-pixel lamp patch; a round lens of the stated size is kept. |
| B07 | x_both, rear | buffer head 1 | 2, 28, 8, 32 | `rear-end/buffers/buffer-1/sweep-1` | 6.667, 70.000, 20.000, 10.000 | 13.500, 69.500, 14.667, 11.000 | 6.833, -0.500, -5.333, 1.000 | 3.417 | 3.417 | Standard 1.75 m buffer spacing kept; the coarse raster places the heads wider. |
| B08 | x_both, rear | buffer head 2 | 22, 28, 28, 32 | `rear-end/buffers/buffer-2/sweep-1` | 73.333, 70.000, 20.000, 10.000 | 71.833, 69.500, 14.667, 11.000 | -1.500, -0.500, -5.333, 1.000 | 2.083 | 2.083 | Standard 1.75 m buffer spacing kept; the coarse raster places the heads wider. |
| F01 | x_both, front | end window 1 | 4, 10, 10, 19 | `front-end/end-windows/window-1/frame` | 13.333, 25.000, 20.000, 22.500 | 13.500, 25.000, 19.833, 22.500 | 0.167, 0.000, -0.167, 0.000 | 0.084 | 0.083 | Native pixel edge estimate; +/- one pixel. |
| F02 | x_both, front | end window 2 | 20, 10, 26, 19 | `front-end/end-windows/window-2/frame` | 66.667, 25.000, 20.000, 22.500 | 66.667, 25.000, 19.833, 22.500 | 0.000, 0.000, -0.167, 0.000 | 0.042 | 0.042 | Native pixel edge estimate; +/- one pixel. |
| F03 | x_both, front | end door outline | 11, 8, 19, 27 | `front-end/end-door/outline` | 36.667, 20.000, 26.667, 47.500 | 36.667, 20.000, 26.667, 47.500 | -0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| F04 | x_both, front | end door window | 12, 10, 18, 19 | `front-end/end-door/window/frame` | 40.000, 25.000, 20.000, 22.500 | 40.000, 25.000, 20.000, 22.500 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| F05 | x_both, front | lamp 1 | 5, 24, 6, 25 | `front-end/lamps/lamp-2` | 16.667, 60.000, 3.333, 2.500 | 15.000, 58.750, 6.667, 5.000 | -1.667, -1.250, 3.333, 2.500 | 2.188 | 2.187 | One-to-three-pixel lamp patch; a round lens of the stated size is kept. |
| F06 | x_both, front | lamp 2 | 24, 24, 25, 25 | `front-end/lamps/lamp-1` | 80.000, 60.000, 3.333, 2.500 | 78.333, 58.750, 6.667, 5.000 | -1.667, -1.250, 3.333, 2.500 | 2.188 | 2.187 | One-to-three-pixel lamp patch; a round lens of the stated size is kept. |
| F07 | x_both, front | buffer head 1 | 2, 28, 8, 32 | `front-end/buffers/buffer-2/sweep-1` | 6.667, 70.000, 20.000, 10.000 | 13.500, 69.500, 14.667, 11.000 | 6.833, -0.500, -5.333, 1.000 | 3.417 | 3.417 | Standard 1.75 m buffer spacing kept; the coarse raster places the heads wider. |
| F08 | x_both, front | buffer head 2 | 22, 28, 28, 32 | `front-end/buffers/buffer-1/sweep-1` | 73.333, 70.000, 20.000, 10.000 | 71.833, 69.500, 14.667, 11.000 | -1.500, -0.500, -5.333, 1.000 | 2.083 | 2.083 | Standard 1.75 m buffer spacing kept; the coarse raster places the heads wider. |
