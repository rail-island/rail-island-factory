# CSD Balm native reference comparison

**Covers** - native pixel annotations, baseline and final orthographic errors.
**Code** - `generator/csdCoaches.ts`, `generator/csdCoachComparison.ts`, `generator/csdCoachReport.ts`.
**See also** - [source notes](SOURCES.md), [CSD coaches](../../docs/models/csd-coaches.md).

Model geometry revision (SHA-256 of comparison GLB): `166a95602bfc879299ab3c38f5c89e99f4729b7d466a7f514681027052357e58`.

Regenerate with `pnpm exec tsx generator/csdCoachReport.ts csd_balm`. The baseline is the first authored geometry (`native/baseline.json`); baseline and final use the same annotations.

Canvases: sides 19.1 x 4 m (191 x 40 px), ends 3 x 4 m (30 x 40 px), including empty space, 0.1 m a pixel. Origin top left; x right, y down. Side u = 10 * source x = 10 * (Factory X + 9.55); both sides keep increasing source x, so the left (-Z) elevation is mirrored relative to an outside observer, as its BMP is. Ends are seen from outside: rear u = 10 * (z + 1.5), front u = 10 * (1.5 - z). v = 10 * (4 - y).

Each vector is (left, top, width, height). Percentages are 100*x/W, 100*y/H, 100*w/W, 100*h/H of the native canvas. Signed delta = model minus source in percentage points. MAE = sum(abs(delta)) / (4 * number of boxes). Model boxes are the bounds of actual GLB vertices of the named scopes, occluded vertices included. Only the original BMPs define the measurements, never the 4x textures.

| View | Boxes | Baseline MAE (pp) | Final MAE (pp) |
|---|---:|---:|---:|
| z_both, right | 14 | 0.000 | 0.000 |
| z_both, left | 14 | 0.000 | 0.000 |
| x_both, rear | 8 | 1.215 | 1.215 |
| x_both, front | 8 | 1.215 | 1.215 |
| All | 44 | 0.442 | 0.442 |

One pixel is 0.524 pp horizontally on the sides, 3.333 pp horizontally on the ends and 2.500 pp vertically. The model was authored from these same measured boxes, so the residuals measure the transfer onto the XML body (tapered and rounded ends, sloped faces, 5 mm edge clearances) and the deliberate mechanical choices (1.75 m buffer spacing, round lamp lenses), not photographic accuracy.

Annotated views (generated locally, not committed):

- z_both, right: [native](../../export/review/csd_balm/z_both-right-native.svg), [model](../../export/review/csd_balm/z_both-right-model.svg)
- z_both, left: [native](../../export/review/csd_balm/z_both-left-native.svg), [model](../../export/review/csd_balm/z_both-left-model.svg)
- x_both, rear: [native](../../export/review/csd_balm/x_both-rear-native.svg), [model](../../export/review/csd_balm/x_both-rear-model.svg)
- x_both, front: [native](../../export/review/csd_balm/x_both-front-native.svg), [model](../../export/review/csd_balm/x_both-front-model.svg)
- [Three-quarter view](../../export/review/csd_balm/three-quarter.png), [thumbnail](../../export/thumbs/veh-csd-balm.png)

| ID | View | Element | Native pixel edges | Mesh scope(s) | Source % (x,y,w,h) | Model % | Signed delta (pp) | Baseline abs. mean (pp) | Final abs. mean (pp) | Uncertainty |
|---|---|---|---|---|---|---|---|---:|---:|---|
| R01 | z_both, right | window 1 frame | 14, 10, 21, 21 | `body/right-side/window-1/frame` | 7.330, 25.000, 3.665, 27.500 | 7.330, 25.000, 3.665, 27.500 | 0.000, 0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R02 | z_both, right | window 2 frame | 24, 10, 37, 21 | `body/right-side/window-2/frame` | 12.565, 25.000, 6.806, 27.500 | 12.565, 25.000, 6.806, 27.500 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R03 | z_both, right | window 3 frame | 40, 10, 53, 21 | `body/right-side/window-3/frame` | 20.942, 25.000, 6.806, 27.500 | 20.942, 25.000, 6.806, 27.500 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R04 | z_both, right | window 4 frame | 69, 10, 74, 21 | `body/right-side/window-4/frame` | 36.126, 25.000, 2.618, 27.500 | 36.126, 25.000, 2.618, 27.500 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R05 | z_both, right | window 5 frame | 81, 10, 94, 21 | `body/right-side/window-5/frame` | 42.408, 25.000, 6.806, 27.500 | 42.408, 25.000, 6.806, 27.500 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R06 | z_both, right | window 6 frame | 97, 10, 110, 21 | `body/right-side/window-6/frame` | 50.785, 25.000, 6.806, 27.500 | 50.785, 25.000, 6.806, 27.500 | 0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R07 | z_both, right | window 7 frame | 113, 10, 126, 21 | `body/right-side/window-7/frame` | 59.162, 25.000, 6.806, 27.500 | 59.162, 25.000, 6.806, 27.500 | 0.000, 0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R08 | z_both, right | window 8 frame | 138, 10, 151, 21 | `body/right-side/window-8/frame` | 72.251, 25.000, 6.806, 27.500 | 72.251, 25.000, 6.806, 27.500 | 0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R09 | z_both, right | window 9 frame | 154, 10, 167, 21 | `body/right-side/window-9/frame` | 80.628, 25.000, 6.806, 27.500 | 80.628, 25.000, 6.806, 27.500 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R10 | z_both, right | window 10 frame | 170, 10, 177, 21 | `body/right-side/window-10/frame` | 89.005, 25.000, 3.665, 27.500 | 89.005, 25.000, 3.665, 27.500 | -0.000, 0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R11 | z_both, right | door 1 outline | 55, 10, 63, 31 | `body/right-side/door-1/outline` | 28.796, 25.000, 4.188, 52.500 | 28.796, 25.000, 4.188, 52.500 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R12 | z_both, right | door 1 window 1 frame | 57, 11, 61, 21 | `body/right-side/door-1/window-1/frame` | 29.843, 27.500, 2.094, 25.000 | 29.843, 27.500, 2.094, 25.000 | 0.000, -0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R13 | z_both, right | door 2 outline | 128, 10, 136, 31 | `body/right-side/door-2/outline` | 67.016, 25.000, 4.188, 52.500 | 67.016, 25.000, 4.188, 52.500 | 0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R14 | z_both, right | door 2 window 1 frame | 130, 11, 134, 21 | `body/right-side/door-2/window-1/frame` | 68.063, 27.500, 2.094, 25.000 | 68.063, 27.500, 2.094, 25.000 | 0.000, -0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L01 | z_both, left | window 1 frame | 14, 10, 21, 21 | `body/left-side/window-1/frame` | 7.330, 25.000, 3.665, 27.500 | 7.330, 25.000, 3.665, 27.500 | 0.000, 0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L02 | z_both, left | window 2 frame | 24, 10, 37, 21 | `body/left-side/window-2/frame` | 12.565, 25.000, 6.806, 27.500 | 12.565, 25.000, 6.806, 27.500 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L03 | z_both, left | window 3 frame | 40, 10, 53, 21 | `body/left-side/window-3/frame` | 20.942, 25.000, 6.806, 27.500 | 20.942, 25.000, 6.806, 27.500 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L04 | z_both, left | window 4 frame | 69, 10, 74, 21 | `body/left-side/window-4/frame` | 36.126, 25.000, 2.618, 27.500 | 36.126, 25.000, 2.618, 27.500 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L05 | z_both, left | window 5 frame | 81, 10, 94, 21 | `body/left-side/window-5/frame` | 42.408, 25.000, 6.806, 27.500 | 42.408, 25.000, 6.806, 27.500 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L06 | z_both, left | window 6 frame | 97, 10, 110, 21 | `body/left-side/window-6/frame` | 50.785, 25.000, 6.806, 27.500 | 50.785, 25.000, 6.806, 27.500 | 0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L07 | z_both, left | window 7 frame | 113, 10, 126, 21 | `body/left-side/window-7/frame` | 59.162, 25.000, 6.806, 27.500 | 59.162, 25.000, 6.806, 27.500 | 0.000, 0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L08 | z_both, left | window 8 frame | 138, 10, 151, 21 | `body/left-side/window-8/frame` | 72.251, 25.000, 6.806, 27.500 | 72.251, 25.000, 6.806, 27.500 | 0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L09 | z_both, left | window 9 frame | 154, 10, 167, 21 | `body/left-side/window-9/frame` | 80.628, 25.000, 6.806, 27.500 | 80.628, 25.000, 6.806, 27.500 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L10 | z_both, left | window 10 frame | 170, 10, 177, 21 | `body/left-side/window-10/frame` | 89.005, 25.000, 3.665, 27.500 | 89.005, 25.000, 3.665, 27.500 | -0.000, 0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L11 | z_both, left | door 1 outline | 55, 10, 63, 31 | `body/left-side/door-1/outline` | 28.796, 25.000, 4.188, 52.500 | 28.796, 25.000, 4.188, 52.500 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L12 | z_both, left | door 1 window 1 frame | 57, 11, 61, 21 | `body/left-side/door-1/window-1/frame` | 29.843, 27.500, 2.094, 25.000 | 29.843, 27.500, 2.094, 25.000 | 0.000, -0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L13 | z_both, left | door 2 outline | 128, 10, 136, 31 | `body/left-side/door-2/outline` | 67.016, 25.000, 4.188, 52.500 | 67.016, 25.000, 4.188, 52.500 | 0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L14 | z_both, left | door 2 window 1 frame | 130, 11, 134, 21 | `body/left-side/door-2/window-1/frame` | 68.063, 27.500, 2.094, 25.000 | 68.063, 27.500, 2.094, 25.000 | 0.000, -0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| B01 | x_both, rear | cab window 1 | 0, 10, 10, 21 | `rear-end/front-windows/window-1/frame` | 0.000, 25.000, 33.333, 27.500 | 0.167, 25.000, 29.167, 27.500 | 0.167, 0.000, -4.167, 0.000 | 1.083 | 1.083 | Wrap-round cab window; the model keeps it to the facets behind the 0.1 m nose tip (|z| >= 0.62 m). |
| B02 | x_both, rear | cab window 2 | 20, 10, 30, 21 | `rear-end/front-windows/window-2/frame` | 66.667, 25.000, 33.333, 27.500 | 70.667, 25.000, 29.167, 27.500 | 4.000, 0.000, -4.167, 0.000 | 2.042 | 2.042 | Wrap-round cab window; the model keeps it to the facets behind the 0.1 m nose tip (|z| >= 0.62 m). |
| B03 | x_both, rear | end door outline | 11, 10, 19, 30 | `rear-end/end-door/outline` | 36.667, 25.000, 26.667, 50.000 | 36.667, 25.000, 26.667, 50.000 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| B04 | x_both, rear | end door window | 13, 11, 17, 18 | `rear-end/end-door/window/frame` | 43.333, 27.500, 13.333, 17.500 | 43.333, 27.500, 13.333, 17.500 | -0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| B05 | x_both, rear | lamp 1 | 4, 24, 7, 27 | `rear-end/lamps/lamp-1` | 13.333, 60.000, 10.000, 7.500 | 13.750, 60.313, 9.167, 6.875 | 0.417, 0.313, -0.833, -0.625 | 0.547 | 0.547 | One-to-three-pixel lamp patch; a round lens of the stated size is kept. |
| B06 | x_both, rear | lamp 2 | 23, 24, 26, 27 | `rear-end/lamps/lamp-2` | 76.667, 60.000, 10.000, 7.500 | 77.083, 60.313, 9.167, 6.875 | 0.417, 0.313, -0.833, -0.625 | 0.547 | 0.547 | One-to-three-pixel lamp patch; a round lens of the stated size is kept. |
| B07 | x_both, rear | buffer head 1 | 2, 29, 8, 33 | `rear-end/buffers/buffer-1/sweep-1` | 6.667, 72.500, 20.000, 10.000 | 13.500, 72.000, 14.667, 11.000 | 6.833, -0.500, -5.333, 1.000 | 3.417 | 3.417 | Standard 1.75 m buffer spacing kept; the coarse raster places the heads wider. |
| B08 | x_both, rear | buffer head 2 | 22, 29, 28, 33 | `rear-end/buffers/buffer-2/sweep-1` | 73.333, 72.500, 20.000, 10.000 | 71.833, 72.000, 14.667, 11.000 | -1.500, -0.500, -5.333, 1.000 | 2.083 | 2.083 | Standard 1.75 m buffer spacing kept; the coarse raster places the heads wider. |
| F01 | x_both, front | cab window 1 | 0, 10, 10, 21 | `front-end/front-windows/window-1/frame` | 0.000, 25.000, 33.333, 27.500 | 0.167, 25.000, 29.167, 27.500 | 0.167, 0.000, -4.167, 0.000 | 1.083 | 1.083 | Wrap-round cab window; the model keeps it to the facets behind the 0.1 m nose tip (|z| >= 0.62 m). |
| F02 | x_both, front | cab window 2 | 20, 10, 30, 21 | `front-end/front-windows/window-2/frame` | 66.667, 25.000, 33.333, 27.500 | 70.667, 25.000, 29.167, 27.500 | 4.000, 0.000, -4.167, 0.000 | 2.042 | 2.042 | Wrap-round cab window; the model keeps it to the facets behind the 0.1 m nose tip (|z| >= 0.62 m). |
| F03 | x_both, front | end door outline | 11, 10, 19, 30 | `front-end/end-door/outline` | 36.667, 25.000, 26.667, 50.000 | 36.667, 25.000, 26.667, 50.000 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| F04 | x_both, front | end door window | 13, 11, 17, 18 | `front-end/end-door/window/frame` | 43.333, 27.500, 13.333, 17.500 | 43.333, 27.500, 13.333, 17.500 | -0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| F05 | x_both, front | lamp 1 | 4, 24, 7, 27 | `front-end/lamps/lamp-2` | 13.333, 60.000, 10.000, 7.500 | 13.750, 60.313, 9.167, 6.875 | 0.417, 0.313, -0.833, -0.625 | 0.547 | 0.547 | One-to-three-pixel lamp patch; a round lens of the stated size is kept. |
| F06 | x_both, front | lamp 2 | 23, 24, 26, 27 | `front-end/lamps/lamp-1` | 76.667, 60.000, 10.000, 7.500 | 77.083, 60.313, 9.167, 6.875 | 0.417, 0.313, -0.833, -0.625 | 0.547 | 0.547 | One-to-three-pixel lamp patch; a round lens of the stated size is kept. |
| F07 | x_both, front | buffer head 1 | 2, 29, 8, 33 | `front-end/buffers/buffer-2/sweep-1` | 6.667, 72.500, 20.000, 10.000 | 13.500, 72.000, 14.667, 11.000 | 6.833, -0.500, -5.333, 1.000 | 3.417 | 3.417 | Standard 1.75 m buffer spacing kept; the coarse raster places the heads wider. |
| F08 | x_both, front | buffer head 2 | 22, 29, 28, 33 | `front-end/buffers/buffer-1/sweep-1` | 73.333, 72.500, 20.000, 10.000 | 71.833, 72.000, 14.667, 11.000 | -1.500, -0.500, -5.333, 1.000 | 2.083 | 2.083 | Standard 1.75 m buffer spacing kept; the coarse raster places the heads wider. |
