# CSD Be31 native reference comparison

**Covers** - native pixel annotations, baseline and final orthographic errors.
**Code** - `generator/csdCoaches.ts`, `generator/csdCoachComparison.ts`, `generator/csdCoachReport.ts`.
**See also** - [source notes](SOURCES.md), [CSD coaches](../../docs/models/csd-coaches.md).

Model geometry revision (SHA-256 of comparison GLB): `b3c0c4c157c576306912d0ec21e757b993f7f63f33d19376294593031aa9a393`.

Regenerate with `pnpm exec tsx generator/csdCoachReport.ts csd-be31`. The baseline is the first authored geometry (`native/baseline.json`); baseline and final use the same annotations.

Canvases: sides 16 x 4 m (160 x 40 px), ends 3 x 4 m (30 x 40 px), including empty space, 0.1 m a pixel. Origin top left; x right, y down. Side u = 10 * source x = 10 * (Factory X + 7.8); both sides keep increasing source x, so the left (-Z) elevation is mirrored relative to an outside observer, as its BMP is. Ends are seen from outside: rear u = 10 * (z + 1.5), front u = 10 * (1.5 - z). v = 10 * (4 - y).

Each vector is (left, top, width, height). Percentages are 100*x/W, 100*y/H, 100*w/W, 100*h/H of the native canvas. Signed delta = model minus source in percentage points. MAE = sum(abs(delta)) / (4 * number of boxes). Model boxes are the bounds of actual GLB vertices of the named scopes, occluded vertices included. Only the original BMPs define the measurements, never the 4x textures.

| View | Boxes | Baseline MAE (pp) | Final MAE (pp) |
|---|---:|---:|---:|
| z_both, right | 12 | 0.018 | 0.018 |
| z_both, left | 12 | 0.018 | 0.018 |
| x_both, rear | 6 | 1.536 | 1.536 |
| x_both, front | 6 | 1.536 | 1.536 |
| All | 36 | 0.524 | 0.524 |

One pixel is 0.625 pp horizontally on the sides, 3.333 pp horizontally on the ends and 2.500 pp vertically. The model was authored from these same measured boxes, so the residuals measure the transfer onto the XML body (tapered and rounded ends, sloped faces, 5 mm edge clearances) and the deliberate mechanical choices (1.75 m buffer spacing, round lamp lenses), not photographic accuracy.

Annotated views (generated locally, not committed):

- z_both, right: [native](../../export/review/csd-be31/z_both-right-native.svg), [model](../../export/review/csd-be31/z_both-right-model.svg)
- z_both, left: [native](../../export/review/csd-be31/z_both-left-native.svg), [model](../../export/review/csd-be31/z_both-left-model.svg)
- x_both, rear: [native](../../export/review/csd-be31/x_both-rear-native.svg), [model](../../export/review/csd-be31/x_both-rear-model.svg)
- x_both, front: [native](../../export/review/csd-be31/x_both-front-native.svg), [model](../../export/review/csd-be31/x_both-front-model.svg)
- [Three-quarter view](../../export/review/csd-be31/three-quarter.png), [thumbnail](../../export/thumbs/veh-csd-be31.png)

| ID | View | Element | Native pixel edges | Mesh scope(s) | Source % (x,y,w,h) | Model % | Signed delta (pp) | Baseline abs. mean (pp) | Final abs. mean (pp) | Uncertainty |
|---|---|---|---|---|---|---|---|---:|---:|---|
| R01 | z_both, right | window 1 frame | 15, 9, 21, 18 | `body/right-side/window-1/frame` | 9.375, 22.500, 3.750, 22.500 | 9.375, 22.500, 3.750, 22.500 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R02 | z_both, right | window 2 frame | 26, 9, 37, 18 | `body/right-side/window-2/frame` | 16.250, 22.500, 6.875, 22.500 | 16.250, 22.500, 6.875, 22.500 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R03 | z_both, right | window 3 frame | 43, 9, 54, 18 | `body/right-side/window-3/frame` | 26.875, 22.500, 6.875, 22.500 | 26.875, 22.500, 6.875, 22.500 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R04 | z_both, right | window 4 frame | 60, 9, 71, 18 | `body/right-side/window-4/frame` | 37.500, 22.500, 6.875, 22.500 | 37.500, 22.500, 6.875, 22.500 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R05 | z_both, right | window 5 frame | 77, 9, 88, 18 | `body/right-side/window-5/frame` | 48.125, 22.500, 6.875, 22.500 | 48.125, 22.500, 6.875, 22.500 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R06 | z_both, right | window 6 frame | 94, 9, 105, 18 | `body/right-side/window-6/frame` | 58.750, 22.500, 6.875, 22.500 | 58.750, 22.500, 6.875, 22.500 | 0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R07 | z_both, right | window 7 frame | 111, 9, 122, 18 | `body/right-side/window-7/frame` | 69.375, 22.500, 6.875, 22.500 | 69.375, 22.500, 6.875, 22.500 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R08 | z_both, right | window 8 frame | 128, 9, 139, 18 | `body/right-side/window-8/frame` | 80.000, 22.500, 6.875, 22.500 | 80.000, 22.500, 6.875, 22.500 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R09 | z_both, right | vestibule door 1 | 5, 7, 14, 29 | `body/right-side/vestibule-door-1/outline` | 3.125, 17.500, 5.625, 55.000 | 3.125, 17.625, 5.594, 54.750 | -0.000, 0.125, -0.031, -0.250 | 0.102 | 0.102 | Recessed vestibule door; edges read from shaded columns, +/- two pixels. |
| R10 | z_both, right | vestibule door 1 window | 7, 8, 12, 18 | `body/right-side/vestibule-door-1/window/frame` | 4.375, 20.000, 3.125, 25.000 | 4.375, 20.000, 3.125, 25.000 | 0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Recessed vestibule door; edges read from shaded columns, +/- two pixels. |
| R11 | z_both, right | vestibule door 2 | 142, 7, 151, 29 | `body/right-side/vestibule-door-2/outline` | 88.750, 17.500, 5.625, 55.000 | 88.781, 17.625, 5.594, 54.750 | 0.031, 0.125, -0.031, -0.250 | 0.109 | 0.109 | Recessed vestibule door; edges read from shaded columns, +/- two pixels. |
| R12 | z_both, right | vestibule door 2 window | 144, 8, 149, 18 | `body/right-side/vestibule-door-2/window/frame` | 90.000, 20.000, 3.125, 25.000 | 90.000, 20.000, 3.125, 25.000 | -0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Recessed vestibule door; edges read from shaded columns, +/- two pixels. |
| L01 | z_both, left | window 1 frame | 15, 9, 21, 18 | `body/left-side/window-1/frame` | 9.375, 22.500, 3.750, 22.500 | 9.375, 22.500, 3.750, 22.500 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L02 | z_both, left | window 2 frame | 26, 9, 37, 18 | `body/left-side/window-2/frame` | 16.250, 22.500, 6.875, 22.500 | 16.250, 22.500, 6.875, 22.500 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L03 | z_both, left | window 3 frame | 43, 9, 54, 18 | `body/left-side/window-3/frame` | 26.875, 22.500, 6.875, 22.500 | 26.875, 22.500, 6.875, 22.500 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L04 | z_both, left | window 4 frame | 60, 9, 71, 18 | `body/left-side/window-4/frame` | 37.500, 22.500, 6.875, 22.500 | 37.500, 22.500, 6.875, 22.500 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L05 | z_both, left | window 5 frame | 77, 9, 88, 18 | `body/left-side/window-5/frame` | 48.125, 22.500, 6.875, 22.500 | 48.125, 22.500, 6.875, 22.500 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L06 | z_both, left | window 6 frame | 94, 9, 105, 18 | `body/left-side/window-6/frame` | 58.750, 22.500, 6.875, 22.500 | 58.750, 22.500, 6.875, 22.500 | 0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L07 | z_both, left | window 7 frame | 111, 9, 122, 18 | `body/left-side/window-7/frame` | 69.375, 22.500, 6.875, 22.500 | 69.375, 22.500, 6.875, 22.500 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L08 | z_both, left | window 8 frame | 128, 9, 139, 18 | `body/left-side/window-8/frame` | 80.000, 22.500, 6.875, 22.500 | 80.000, 22.500, 6.875, 22.500 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L09 | z_both, left | vestibule door 1 | 5, 7, 14, 29 | `body/left-side/vestibule-door-1/outline` | 3.125, 17.500, 5.625, 55.000 | 3.125, 17.625, 5.594, 54.750 | -0.000, 0.125, -0.031, -0.250 | 0.102 | 0.102 | Recessed vestibule door; edges read from shaded columns, +/- two pixels. |
| L10 | z_both, left | vestibule door 1 window | 7, 8, 12, 18 | `body/left-side/vestibule-door-1/window/frame` | 4.375, 20.000, 3.125, 25.000 | 4.375, 20.000, 3.125, 25.000 | 0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Recessed vestibule door; edges read from shaded columns, +/- two pixels. |
| L11 | z_both, left | vestibule door 2 | 142, 7, 151, 29 | `body/left-side/vestibule-door-2/outline` | 88.750, 17.500, 5.625, 55.000 | 88.781, 17.625, 5.594, 54.750 | 0.031, 0.125, -0.031, -0.250 | 0.109 | 0.109 | Recessed vestibule door; edges read from shaded columns, +/- two pixels. |
| L12 | z_both, left | vestibule door 2 window | 144, 8, 149, 18 | `body/left-side/vestibule-door-2/window/frame` | 90.000, 20.000, 3.125, 25.000 | 90.000, 20.000, 3.125, 25.000 | -0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Recessed vestibule door; edges read from shaded columns, +/- two pixels. |
| B01 | x_both, rear | end door outline | 11, 7, 19, 29 | `rear-end/end-door/outline` | 36.667, 17.500, 26.667, 55.000 | 36.667, 17.625, 26.667, 54.750 | -0.000, 0.125, 0.000, -0.250 | 0.094 | 0.094 | Native pixel edge estimate; +/- one pixel. |
| B02 | x_both, rear | end door window | 12, 9, 18, 18 | `rear-end/end-door/window/frame` | 40.000, 22.500, 20.000, 22.500 | 40.000, 22.500, 20.000, 22.500 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| B03 | x_both, rear | lamp 1 | 5, 23, 6, 24 | `rear-end/lamps/lamp-1` | 16.667, 57.500, 3.333, 2.500 | 15.000, 56.250, 6.667, 5.000 | -1.667, -1.250, 3.333, 2.500 | 2.188 | 2.187 | One-to-three-pixel lamp patch; a round lens of the stated size is kept. |
| B04 | x_both, rear | lamp 2 | 24, 23, 25, 24 | `rear-end/lamps/lamp-2` | 80.000, 57.500, 3.333, 2.500 | 78.333, 56.250, 6.667, 5.000 | -1.667, -1.250, 3.333, 2.500 | 2.188 | 2.187 | One-to-three-pixel lamp patch; a round lens of the stated size is kept. |
| B05 | x_both, rear | buffer head 1 | 3, 28, 7, 31 | `rear-end/buffers/buffer-1/sweep-1` | 10.000, 70.000, 13.333, 7.500 | 13.500, 69.500, 14.667, 11.000 | 3.500, -0.500, 1.333, 3.500 | 2.208 | 2.208 | Standard 1.75 m buffer spacing kept; the coarse raster places the heads wider. |
| B06 | x_both, rear | buffer head 2 | 23, 28, 27, 31 | `rear-end/buffers/buffer-2/sweep-1` | 76.667, 70.000, 13.333, 7.500 | 71.833, 69.500, 14.667, 11.000 | -4.833, -0.500, 1.333, 3.500 | 2.542 | 2.542 | Standard 1.75 m buffer spacing kept; the coarse raster places the heads wider. |
| F01 | x_both, front | end door outline | 11, 7, 19, 29 | `front-end/end-door/outline` | 36.667, 17.500, 26.667, 55.000 | 36.667, 17.625, 26.667, 54.750 | -0.000, 0.125, 0.000, -0.250 | 0.094 | 0.094 | Native pixel edge estimate; +/- one pixel. |
| F02 | x_both, front | end door window | 12, 9, 18, 18 | `front-end/end-door/window/frame` | 40.000, 22.500, 20.000, 22.500 | 40.000, 22.500, 20.000, 22.500 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| F03 | x_both, front | lamp 1 | 5, 23, 6, 24 | `front-end/lamps/lamp-2` | 16.667, 57.500, 3.333, 2.500 | 15.000, 56.250, 6.667, 5.000 | -1.667, -1.250, 3.333, 2.500 | 2.188 | 2.187 | One-to-three-pixel lamp patch; a round lens of the stated size is kept. |
| F04 | x_both, front | lamp 2 | 24, 23, 25, 24 | `front-end/lamps/lamp-1` | 80.000, 57.500, 3.333, 2.500 | 78.333, 56.250, 6.667, 5.000 | -1.667, -1.250, 3.333, 2.500 | 2.188 | 2.187 | One-to-three-pixel lamp patch; a round lens of the stated size is kept. |
| F05 | x_both, front | buffer head 1 | 3, 28, 7, 31 | `front-end/buffers/buffer-2/sweep-1` | 10.000, 70.000, 13.333, 7.500 | 13.500, 69.500, 14.667, 11.000 | 3.500, -0.500, 1.333, 3.500 | 2.208 | 2.208 | Standard 1.75 m buffer spacing kept; the coarse raster places the heads wider. |
| F06 | x_both, front | buffer head 2 | 23, 28, 27, 31 | `front-end/buffers/buffer-1/sweep-1` | 76.667, 70.000, 13.333, 7.500 | 71.833, 69.500, 14.667, 11.000 | -4.833, -0.500, 1.333, 3.500 | 2.542 | 2.542 | Standard 1.75 m buffer spacing kept; the coarse raster places the heads wider. |
