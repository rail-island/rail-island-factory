# CSD Bdmtee native reference comparison

**Covers** - native pixel annotations, baseline and final orthographic errors.
**Code** - `generator/csdCoaches.ts`, `generator/csdCoachComparison.ts`, `generator/csdCoachReport.ts`.
**See also** - [source notes](SOURCES.md), [CSD coaches](../../docs/models/csd-coaches.md).

Model geometry revision (SHA-256 of comparison GLB): `6ac6b32df52c7725ed12411b27412b9fbe1a9a1ac68fd2b3b521764386723679`.

Regenerate with `pnpm exec tsx generator/csdCoachReport.ts csd_bdmtee`. The baseline is the first authored geometry (`native/baseline.json`); baseline and final use the same annotations.

Canvases: sides 27 x 5 m (270 x 50 px), ends 3 x 5 m (30 x 50 px), including empty space, 0.1 m a pixel. Origin top left; x right, y down. Side u = 10 * source x = 10 * (Factory X + 13.2); both sides keep increasing source x, so the left (-Z) elevation is mirrored relative to an outside observer, as its BMP is. Ends are seen from outside: rear u = 10 * (z + 1.5), front u = 10 * (1.5 - z). v = 10 * (5 - y).

Each vector is (left, top, width, height). Percentages are 100*x/W, 100*y/H, 100*w/W, 100*h/H of the native canvas. Signed delta = model minus source in percentage points. MAE = sum(abs(delta)) / (4 * number of boxes). Model boxes are the bounds of actual GLB vertices of the named scopes, occluded vertices included. Only the original BMPs define the measurements, never the 4x textures.

| View | Boxes | Baseline MAE (pp) | Final MAE (pp) |
|---|---:|---:|---:|
| z_dec, right | 20 | 0.000 | 0.000 |
| z_inc, left | 20 | 0.000 | 0.000 |
| x_both, rear | 8 | 0.690 | 0.690 |
| x_both, front | 8 | 0.690 | 0.690 |
| All | 56 | 0.197 | 0.197 |

One pixel is 0.370 pp horizontally on the sides, 3.333 pp horizontally on the ends and 2.000 pp vertically. The model was authored from these same measured boxes, so the residuals measure the transfer onto the XML body (tapered and rounded ends, sloped faces, 5 mm edge clearances) and the deliberate mechanical choices (1.75 m buffer spacing, round lamp lenses), not photographic accuracy.

Annotated views (generated locally, not committed):

- z_dec, right: [native](../../export/review/csd_bdmtee/z_dec-right-native.svg), [model](../../export/review/csd_bdmtee/z_dec-right-model.svg)
- z_inc, left: [native](../../export/review/csd_bdmtee/z_inc-left-native.svg), [model](../../export/review/csd_bdmtee/z_inc-left-model.svg)
- x_both, rear: [native](../../export/review/csd_bdmtee/x_both-rear-native.svg), [model](../../export/review/csd_bdmtee/x_both-rear-model.svg)
- x_both, front: [native](../../export/review/csd_bdmtee/x_both-front-native.svg), [model](../../export/review/csd_bdmtee/x_both-front-model.svg)
- [Three-quarter view](../../export/review/csd_bdmtee/three-quarter.png), [thumbnail](../../export/thumbs/veh-csd-bdmtee.png)

| ID | View | Element | Native pixel edges | Mesh scope(s) | Source % (x,y,w,h) | Model % | Signed delta (pp) | Baseline abs. mean (pp) | Final abs. mean (pp) | Uncertainty |
|---|---|---|---|---|---|---|---|---:|---:|---|
| R01 | z_dec, right | window 1 frame | 6, 20, 18, 30 | `body/right-side/window-1/frame` | 2.222, 40.000, 4.444, 20.000 | 2.222, 40.000, 4.444, 20.000 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R02 | z_dec, right | window 2 frame | 21, 20, 33, 30 | `body/right-side/window-2/frame` | 7.778, 40.000, 4.444, 20.000 | 7.778, 40.000, 4.444, 20.000 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R03 | z_dec, right | window 3 frame | 36, 20, 48, 30 | `body/right-side/window-3/frame` | 13.333, 40.000, 4.444, 20.000 | 13.333, 40.000, 4.444, 20.000 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R04 | z_dec, right | window 4 frame | 53, 20, 60, 30 | `body/right-side/window-4/frame` | 19.630, 40.000, 2.593, 20.000 | 19.630, 40.000, 2.593, 20.000 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R05 | z_dec, right | window 5 frame | 86, 20, 98, 30 | `body/right-side/window-5/frame` | 31.852, 40.000, 4.444, 20.000 | 31.852, 40.000, 4.444, 20.000 | 0.000, 0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R06 | z_dec, right | window 6 frame | 102, 20, 114, 30 | `body/right-side/window-6/frame` | 37.778, 40.000, 4.444, 20.000 | 37.778, 40.000, 4.444, 20.000 | 0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R07 | z_dec, right | window 7 frame | 118, 20, 130, 30 | `body/right-side/window-7/frame` | 43.704, 40.000, 4.444, 20.000 | 43.704, 40.000, 4.444, 20.000 | 0.000, 0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R08 | z_dec, right | window 8 frame | 134, 20, 146, 30 | `body/right-side/window-8/frame` | 49.630, 40.000, 4.444, 20.000 | 49.630, 40.000, 4.444, 20.000 | 0.000, 0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R09 | z_dec, right | window 9 frame | 150, 20, 162, 30 | `body/right-side/window-9/frame` | 55.556, 40.000, 4.444, 20.000 | 55.556, 40.000, 4.444, 20.000 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R10 | z_dec, right | window 10 frame | 166, 20, 178, 30 | `body/right-side/window-10/frame` | 61.481, 40.000, 4.444, 20.000 | 61.481, 40.000, 4.444, 20.000 | 0.000, 0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R11 | z_dec, right | window 11 frame | 203, 20, 210, 30 | `body/right-side/window-11/frame` | 75.185, 40.000, 2.593, 20.000 | 75.185, 40.000, 2.593, 20.000 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R12 | z_dec, right | window 12 frame | 216, 20, 228, 30 | `body/right-side/window-12/frame` | 80.000, 40.000, 4.444, 20.000 | 80.000, 40.000, 4.444, 20.000 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R13 | z_dec, right | window 13 frame | 231, 20, 243, 30 | `body/right-side/window-13/frame` | 85.556, 40.000, 4.444, 20.000 | 85.556, 40.000, 4.444, 20.000 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R14 | z_dec, right | window 14 frame | 246, 20, 258, 30 | `body/right-side/window-14/frame` | 91.111, 40.000, 4.444, 20.000 | 91.111, 40.000, 4.444, 20.000 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R15 | z_dec, right | door 1 outline | 63, 18, 83, 44 | `body/right-side/door-1/outline` | 23.333, 36.000, 7.407, 52.000 | 23.333, 36.000, 7.407, 52.000 | -0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R16 | z_dec, right | door 1 window 1 frame | 65, 20, 70, 30 | `body/right-side/door-1/window-1/frame` | 24.074, 40.000, 1.852, 20.000 | 24.074, 40.000, 1.852, 20.000 | 0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R17 | z_dec, right | door 1 window 2 frame | 76, 20, 81, 30 | `body/right-side/door-1/window-2/frame` | 28.148, 40.000, 1.852, 20.000 | 28.148, 40.000, 1.852, 20.000 | 0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R18 | z_dec, right | door 2 outline | 181, 18, 201, 44 | `body/right-side/door-2/outline` | 67.037, 36.000, 7.407, 52.000 | 67.037, 36.000, 7.407, 52.000 | 0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R19 | z_dec, right | door 2 window 1 frame | 183, 20, 188, 30 | `body/right-side/door-2/window-1/frame` | 67.778, 40.000, 1.852, 20.000 | 67.778, 40.000, 1.852, 20.000 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R20 | z_dec, right | door 2 window 2 frame | 194, 20, 199, 30 | `body/right-side/door-2/window-2/frame` | 71.852, 40.000, 1.852, 20.000 | 71.852, 40.000, 1.852, 20.000 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L01 | z_inc, left | window 1 frame | 6, 20, 18, 30 | `body/left-side/window-1/frame` | 2.222, 40.000, 4.444, 20.000 | 2.222, 40.000, 4.444, 20.000 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L02 | z_inc, left | window 2 frame | 21, 20, 33, 30 | `body/left-side/window-2/frame` | 7.778, 40.000, 4.444, 20.000 | 7.778, 40.000, 4.444, 20.000 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L03 | z_inc, left | window 3 frame | 36, 20, 48, 30 | `body/left-side/window-3/frame` | 13.333, 40.000, 4.444, 20.000 | 13.333, 40.000, 4.444, 20.000 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L04 | z_inc, left | window 4 frame | 53, 20, 60, 30 | `body/left-side/window-4/frame` | 19.630, 40.000, 2.593, 20.000 | 19.630, 40.000, 2.593, 20.000 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L05 | z_inc, left | window 5 frame | 86, 20, 98, 30 | `body/left-side/window-5/frame` | 31.852, 40.000, 4.444, 20.000 | 31.852, 40.000, 4.444, 20.000 | 0.000, 0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L06 | z_inc, left | window 6 frame | 102, 20, 114, 30 | `body/left-side/window-6/frame` | 37.778, 40.000, 4.444, 20.000 | 37.778, 40.000, 4.444, 20.000 | 0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L07 | z_inc, left | window 7 frame | 118, 20, 130, 30 | `body/left-side/window-7/frame` | 43.704, 40.000, 4.444, 20.000 | 43.704, 40.000, 4.444, 20.000 | 0.000, 0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L08 | z_inc, left | window 8 frame | 134, 20, 146, 30 | `body/left-side/window-8/frame` | 49.630, 40.000, 4.444, 20.000 | 49.630, 40.000, 4.444, 20.000 | 0.000, 0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L09 | z_inc, left | window 9 frame | 150, 20, 162, 30 | `body/left-side/window-9/frame` | 55.556, 40.000, 4.444, 20.000 | 55.556, 40.000, 4.444, 20.000 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L10 | z_inc, left | window 10 frame | 166, 20, 178, 30 | `body/left-side/window-10/frame` | 61.481, 40.000, 4.444, 20.000 | 61.481, 40.000, 4.444, 20.000 | 0.000, 0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L11 | z_inc, left | window 11 frame | 203, 20, 210, 30 | `body/left-side/window-11/frame` | 75.185, 40.000, 2.593, 20.000 | 75.185, 40.000, 2.593, 20.000 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L12 | z_inc, left | window 12 frame | 216, 20, 228, 30 | `body/left-side/window-12/frame` | 80.000, 40.000, 4.444, 20.000 | 80.000, 40.000, 4.444, 20.000 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L13 | z_inc, left | window 13 frame | 231, 20, 243, 30 | `body/left-side/window-13/frame` | 85.556, 40.000, 4.444, 20.000 | 85.556, 40.000, 4.444, 20.000 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L14 | z_inc, left | window 14 frame | 246, 20, 258, 30 | `body/left-side/window-14/frame` | 91.111, 40.000, 4.444, 20.000 | 91.111, 40.000, 4.444, 20.000 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L15 | z_inc, left | door 1 outline | 63, 18, 83, 44 | `body/left-side/door-1/outline` | 23.333, 36.000, 7.407, 52.000 | 23.333, 36.000, 7.407, 52.000 | -0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L16 | z_inc, left | door 1 window 1 frame | 65, 20, 70, 30 | `body/left-side/door-1/window-1/frame` | 24.074, 40.000, 1.852, 20.000 | 24.074, 40.000, 1.852, 20.000 | 0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L17 | z_inc, left | door 1 window 2 frame | 76, 20, 81, 30 | `body/left-side/door-1/window-2/frame` | 28.148, 40.000, 1.852, 20.000 | 28.148, 40.000, 1.852, 20.000 | 0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L18 | z_inc, left | door 2 outline | 181, 18, 201, 44 | `body/left-side/door-2/outline` | 67.037, 36.000, 7.407, 52.000 | 67.037, 36.000, 7.407, 52.000 | 0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L19 | z_inc, left | door 2 window 1 frame | 183, 20, 188, 30 | `body/left-side/door-2/window-1/frame` | 67.778, 40.000, 1.852, 20.000 | 67.778, 40.000, 1.852, 20.000 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L20 | z_inc, left | door 2 window 2 frame | 194, 20, 199, 30 | `body/left-side/door-2/window-2/frame` | 71.852, 40.000, 1.852, 20.000 | 71.852, 40.000, 1.852, 20.000 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| B01 | x_both, rear | gangway frame | 7, 17, 23, 37 | `rear-end/gangway` | 23.333, 34.000, 53.333, 40.000 | 23.333, 34.000, 53.333, 40.000 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| B02 | x_both, rear | end door outline | 9, 19, 21, 37 | `rear-end/end-door/outline` | 30.000, 38.000, 40.000, 36.000 | 30.000, 38.000, 40.000, 36.000 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Door between the gangway posts; the raster shows the frame, not the leaf edge. |
| B03 | x_both, rear | end door window 1 | 10, 20, 13, 29 | `rear-end/end-door/window-1/frame` | 33.333, 40.000, 10.000, 18.000 | 33.333, 40.000, 10.000, 18.000 | 0.000, 0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| B04 | x_both, rear | end door window 2 | 17, 20, 20, 29 | `rear-end/end-door/window-2/frame` | 56.667, 40.000, 10.000, 18.000 | 56.667, 40.000, 10.000, 18.000 | 0.000, 0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| B05 | x_both, rear | tail lamp 1 | 4, 22, 6, 24 | `rear-end/tail-lamps/lamp-1` | 13.333, 44.000, 6.667, 4.000 | 12.917, 43.750, 7.500, 4.500 | -0.417, -0.250, 0.833, 0.500 | 0.500 | 0.500 | One-to-three-pixel lamp patch; a round lens of the stated size is kept. |
| B06 | x_both, rear | tail lamp 2 | 24, 22, 26, 24 | `rear-end/tail-lamps/lamp-2` | 80.000, 44.000, 6.667, 4.000 | 79.583, 43.750, 7.500, 4.500 | -0.417, -0.250, 0.833, 0.500 | 0.500 | 0.500 | One-to-three-pixel lamp patch; a round lens of the stated size is kept. |
| B07 | x_both, rear | buffer head 1 | 2, 38, 7, 42 | `rear-end/buffers/buffer-1/sweep-1` | 6.667, 76.000, 16.667, 8.000 | 13.500, 75.600, 14.667, 8.800 | 6.833, -0.400, -2.000, 0.800 | 2.508 | 2.508 | Standard 1.75 m buffer spacing kept; the coarse raster places the heads wider. |
| B08 | x_both, rear | buffer head 2 | 23, 38, 28, 42 | `rear-end/buffers/buffer-2/sweep-1` | 76.667, 76.000, 16.667, 8.000 | 71.833, 75.600, 14.667, 8.800 | -4.833, -0.400, -2.000, 0.800 | 2.008 | 2.008 | Standard 1.75 m buffer spacing kept; the coarse raster places the heads wider. |
| F01 | x_both, front | gangway frame | 7, 17, 23, 37 | `front-end/gangway` | 23.333, 34.000, 53.333, 40.000 | 23.333, 34.000, 53.333, 40.000 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| F02 | x_both, front | end door outline | 9, 19, 21, 37 | `front-end/end-door/outline` | 30.000, 38.000, 40.000, 36.000 | 30.000, 38.000, 40.000, 36.000 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Door between the gangway posts; the raster shows the frame, not the leaf edge. |
| F03 | x_both, front | end door window 1 | 10, 20, 13, 29 | `front-end/end-door/window-1/frame` | 33.333, 40.000, 10.000, 18.000 | 33.333, 40.000, 10.000, 18.000 | 0.000, 0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| F04 | x_both, front | end door window 2 | 17, 20, 20, 29 | `front-end/end-door/window-2/frame` | 56.667, 40.000, 10.000, 18.000 | 56.667, 40.000, 10.000, 18.000 | 0.000, 0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| F05 | x_both, front | tail lamp 1 | 4, 22, 6, 24 | `front-end/tail-lamps/lamp-2` | 13.333, 44.000, 6.667, 4.000 | 12.917, 43.750, 7.500, 4.500 | -0.417, -0.250, 0.833, 0.500 | 0.500 | 0.500 | One-to-three-pixel lamp patch; a round lens of the stated size is kept. |
| F06 | x_both, front | tail lamp 2 | 24, 22, 26, 24 | `front-end/tail-lamps/lamp-1` | 80.000, 44.000, 6.667, 4.000 | 79.583, 43.750, 7.500, 4.500 | -0.417, -0.250, 0.833, 0.500 | 0.500 | 0.500 | One-to-three-pixel lamp patch; a round lens of the stated size is kept. |
| F07 | x_both, front | buffer head 1 | 2, 38, 7, 42 | `front-end/buffers/buffer-2/sweep-1` | 6.667, 76.000, 16.667, 8.000 | 13.500, 75.600, 14.667, 8.800 | 6.833, -0.400, -2.000, 0.800 | 2.508 | 2.508 | Standard 1.75 m buffer spacing kept; the coarse raster places the heads wider. |
| F08 | x_both, front | buffer head 2 | 23, 38, 28, 42 | `front-end/buffers/buffer-1/sweep-1` | 76.667, 76.000, 16.667, 8.000 | 71.833, 75.600, 14.667, 8.800 | -4.833, -0.400, -2.000, 0.800 | 2.008 | 2.008 | Standard 1.75 m buffer spacing kept; the coarse raster places the heads wider. |
