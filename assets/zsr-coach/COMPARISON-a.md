# ZSR A native reference comparison

**Covers** - native pixel annotations, baseline and final orthographic errors.
**Code** - `generator/liveryCoach.ts`, `generator/cdYCoach.ts`, `generator/zsrCoach.ts`, `generator/uicZCoach.ts`, `generator/czskCoaches.ts`, `generator/csdCoachComparison.ts`, `generator/csdCoachReport.ts`.
**See also** - [source notes](SOURCES.md), [Czech and Slovak coaches (CD Y, ZSR, UIC-Z)](../../docs/models/czsk-coaches.md).

Model geometry revision (SHA-256 of comparison GLB): `e3edb95353ecf30929073c0c47d245249e8d723ac1e30ecdd17534e2cac6c621`.

Regenerate with `pnpm exec tsx generator/csdCoachReport.ts zsr_a`. The baseline is the first authored geometry (`native/zsr_a/baseline.json`); baseline and final use the same annotations. Built with `variant=a` of `veh-zsr-coach`.

Canvases: sides 25 x 5 m (250 x 50 px), ends 3 x 5 m (30 x 50 px), including empty space, 0.1 m a pixel. Origin top left; x right, y down. Side u = 10 * source x = 10 * (Factory X + 12.25); both sides keep increasing source x, so the left (-Z) elevation is mirrored relative to an outside observer, as its BMP is. Ends are seen from outside: rear u = 10 * (z + 1.5), front u = 10 * (1.5 - z). v = 10 * (5 - y).

Each vector is (left, top, width, height). Percentages are 100*x/W, 100*y/H, 100*w/W, 100*h/H of the native canvas. Signed delta = model minus source in percentage points. MAE = sum(abs(delta)) / (4 * number of boxes). Model boxes are the bounds of actual GLB vertices of the named scopes, occluded vertices included. Only the original BMPs define the measurements, never the 4x textures.

| View | Boxes | Baseline MAE (pp) | Final MAE (pp) |
|---|---:|---:|---:|
| z_dec, right | 17 | 0.001 | 0.001 |
| z_inc, left | 17 | 0.001 | 0.001 |
| x_both, rear | 8 | 0.690 | 0.690 |
| x_both, front | 8 | 0.690 | 0.690 |
| All | 50 | 0.221 | 0.221 |

One pixel is 0.400 pp horizontally on the sides, 3.333 pp horizontally on the ends and 2.000 pp vertically. The model was authored from these same measured boxes, so the residuals measure the transfer onto the XML body (tapered and rounded ends, sloped faces, 5 mm edge clearances) and the deliberate mechanical choices (1.75 m buffer spacing, round lamp lenses), not photographic accuracy.

Annotated views (generated locally, not committed):

- z_dec, right: [native](../../export/review/zsr_a/z_dec-right-native.svg), [model](../../export/review/zsr_a/z_dec-right-model.svg)
- z_inc, left: [native](../../export/review/zsr_a/z_inc-left-native.svg), [model](../../export/review/zsr_a/z_inc-left-model.svg)
- x_both, rear: [native](../../export/review/zsr_a/x_both-rear-native.svg), [model](../../export/review/zsr_a/x_both-rear-model.svg)
- x_both, front: [native](../../export/review/zsr_a/x_both-front-native.svg), [model](../../export/review/zsr_a/x_both-front-model.svg)
- [Three-quarter view](../../export/review/zsr_a/three-quarter.png), [thumbnail](../../export/thumbs/veh-zsr-coach.png)

| ID | View | Element | Native pixel edges | Mesh scope(s) | Source % (x,y,w,h) | Model % | Signed delta (pp) | Baseline abs. mean (pp) | Final abs. mean (pp) | Uncertainty |
|---|---|---|---|---|---|---|---|---:|---:|---|
| R01 | z_dec, right | window 1 frame | 18, 19, 26, 30 | `body/right-side/window-1/frame` | 7.200, 38.000, 3.200, 22.000 | 7.200, 38.000, 3.200, 22.000 | 0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Connected component of the non-paint pixels in the window rows; +/- one pixel. |
| R02 | z_dec, right | window 2 frame | 32, 19, 45, 30 | `body/right-side/window-2/frame` | 12.800, 38.000, 5.200, 22.000 | 12.800, 38.000, 5.200, 22.000 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Connected component of the non-paint pixels in the window rows; +/- one pixel. |
| R03 | z_dec, right | window 3 frame | 53, 19, 66, 30 | `body/right-side/window-3/frame` | 21.200, 38.000, 5.200, 22.000 | 21.200, 38.000, 5.200, 22.000 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Connected component of the non-paint pixels in the window rows; +/- one pixel. |
| R04 | z_dec, right | window 4 frame | 74, 19, 87, 30 | `body/right-side/window-4/frame` | 29.600, 38.000, 5.200, 22.000 | 29.600, 38.000, 5.200, 22.000 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Connected component of the non-paint pixels in the window rows; +/- one pixel. |
| R05 | z_dec, right | window 5 frame | 95, 19, 108, 30 | `body/right-side/window-5/frame` | 38.000, 38.000, 5.200, 22.000 | 38.000, 38.000, 5.200, 22.000 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Connected component of the non-paint pixels in the window rows; +/- one pixel. |
| R06 | z_dec, right | window 6 frame | 116, 19, 129, 30 | `body/right-side/window-6/frame` | 46.400, 38.000, 5.200, 22.000 | 46.400, 38.000, 5.200, 22.000 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Connected component of the non-paint pixels in the window rows; +/- one pixel. |
| R07 | z_dec, right | window 7 frame | 137, 19, 150, 30 | `body/right-side/window-7/frame` | 54.800, 38.000, 5.200, 22.000 | 54.800, 38.000, 5.200, 22.000 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Connected component of the non-paint pixels in the window rows; +/- one pixel. |
| R08 | z_dec, right | window 8 frame | 158, 19, 171, 30 | `body/right-side/window-8/frame` | 63.200, 38.000, 5.200, 22.000 | 63.200, 38.000, 5.200, 22.000 | -0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Connected component of the non-paint pixels in the window rows; +/- one pixel. |
| R09 | z_dec, right | window 9 frame | 179, 19, 192, 30 | `body/right-side/window-9/frame` | 71.600, 38.000, 5.200, 22.000 | 71.600, 38.000, 5.200, 22.000 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Connected component of the non-paint pixels in the window rows; +/- one pixel. |
| R10 | z_dec, right | window 10 frame | 200, 19, 213, 30 | `body/right-side/window-10/frame` | 80.000, 38.000, 5.200, 22.000 | 80.000, 38.000, 5.200, 22.000 | 0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Connected component of the non-paint pixels in the window rows; +/- one pixel. |
| R11 | z_dec, right | window 11 frame | 219, 19, 227, 30 | `body/right-side/window-11/frame` | 87.600, 38.000, 3.200, 22.000 | 87.600, 38.000, 3.200, 22.000 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Connected component of the non-paint pixels in the window rows; +/- one pixel. |
| R12 | z_dec, right | door 1 outline | 5, 18, 15, 38 | `body/right-side/door-1/outline` | 2.000, 36.000, 4.000, 40.000 | 2.000, 36.000, 4.000, 40.000 | 0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Door edges read from the seam columns and the leaf colour; +/- two pixels. |
| R13 | z_dec, right | door 1 window 1 frame | 8, 20, 13, 29 | `body/right-side/door-1/window-1/frame` | 3.200, 40.000, 2.000, 18.000 | 3.200, 40.000, 2.000, 18.000 | 0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edges of the door window; +/- one pixel. |
| R14 | z_dec, right | door 2 outline | 230, 18, 240, 38 | `body/right-side/door-2/outline` | 92.000, 36.000, 4.000, 40.000 | 92.000, 36.000, 4.000, 40.000 | 0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Door edges read from the seam columns and the leaf colour; +/- two pixels. |
| R15 | z_dec, right | door 2 window 1 frame | 232, 20, 237, 29 | `body/right-side/door-2/window-1/frame` | 92.800, 40.000, 2.000, 18.000 | 92.800, 40.000, 2.000, 18.000 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edges of the door window; +/- one pixel. |
| R16 | z_dec, right | class marks | 27, 21, 218, 27 | `body/right-side/class-marks` | 10.800, 42.000, 76.400, 12.000 | 10.800, 42.000, 76.400, 12.000 | -0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Union of the class-mark patches; the numerals are drawn narrower than a plate. |
| R17 | z_dec, right | emblem | 56, 31, 65, 38 | `body/right-side/emblem` | 22.400, 62.000, 3.600, 14.000 | 22.380, 62.000, 3.640, 14.000 | -0.020, 0.000, 0.040, -0.000 | 0.015 | 0.015 | The emblem patch; the drawn emblem keeps its own proportions. |
| L01 | z_inc, left | window 1 frame | 18, 19, 26, 30 | `body/left-side/window-1/frame` | 7.200, 38.000, 3.200, 22.000 | 7.200, 38.000, 3.200, 22.000 | 0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Connected component of the non-paint pixels in the window rows; +/- one pixel. |
| L02 | z_inc, left | window 2 frame | 32, 19, 45, 30 | `body/left-side/window-2/frame` | 12.800, 38.000, 5.200, 22.000 | 12.800, 38.000, 5.200, 22.000 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Connected component of the non-paint pixels in the window rows; +/- one pixel. |
| L03 | z_inc, left | window 3 frame | 53, 19, 66, 30 | `body/left-side/window-3/frame` | 21.200, 38.000, 5.200, 22.000 | 21.200, 38.000, 5.200, 22.000 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Connected component of the non-paint pixels in the window rows; +/- one pixel. |
| L04 | z_inc, left | window 4 frame | 74, 19, 87, 30 | `body/left-side/window-4/frame` | 29.600, 38.000, 5.200, 22.000 | 29.600, 38.000, 5.200, 22.000 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Connected component of the non-paint pixels in the window rows; +/- one pixel. |
| L05 | z_inc, left | window 5 frame | 95, 19, 108, 30 | `body/left-side/window-5/frame` | 38.000, 38.000, 5.200, 22.000 | 38.000, 38.000, 5.200, 22.000 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Connected component of the non-paint pixels in the window rows; +/- one pixel. |
| L06 | z_inc, left | window 6 frame | 116, 19, 129, 30 | `body/left-side/window-6/frame` | 46.400, 38.000, 5.200, 22.000 | 46.400, 38.000, 5.200, 22.000 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Connected component of the non-paint pixels in the window rows; +/- one pixel. |
| L07 | z_inc, left | window 7 frame | 137, 19, 150, 30 | `body/left-side/window-7/frame` | 54.800, 38.000, 5.200, 22.000 | 54.800, 38.000, 5.200, 22.000 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Connected component of the non-paint pixels in the window rows; +/- one pixel. |
| L08 | z_inc, left | window 8 frame | 158, 19, 171, 30 | `body/left-side/window-8/frame` | 63.200, 38.000, 5.200, 22.000 | 63.200, 38.000, 5.200, 22.000 | -0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Connected component of the non-paint pixels in the window rows; +/- one pixel. |
| L09 | z_inc, left | window 9 frame | 179, 19, 192, 30 | `body/left-side/window-9/frame` | 71.600, 38.000, 5.200, 22.000 | 71.600, 38.000, 5.200, 22.000 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Connected component of the non-paint pixels in the window rows; +/- one pixel. |
| L10 | z_inc, left | window 10 frame | 200, 19, 213, 30 | `body/left-side/window-10/frame` | 80.000, 38.000, 5.200, 22.000 | 80.000, 38.000, 5.200, 22.000 | 0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Connected component of the non-paint pixels in the window rows; +/- one pixel. |
| L11 | z_inc, left | window 11 frame | 219, 19, 227, 30 | `body/left-side/window-11/frame` | 87.600, 38.000, 3.200, 22.000 | 87.600, 38.000, 3.200, 22.000 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Connected component of the non-paint pixels in the window rows; +/- one pixel. |
| L12 | z_inc, left | door 1 outline | 5, 18, 15, 38 | `body/left-side/door-1/outline` | 2.000, 36.000, 4.000, 40.000 | 2.000, 36.000, 4.000, 40.000 | 0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Door edges read from the seam columns and the leaf colour; +/- two pixels. |
| L13 | z_inc, left | door 1 window 1 frame | 8, 20, 13, 29 | `body/left-side/door-1/window-1/frame` | 3.200, 40.000, 2.000, 18.000 | 3.200, 40.000, 2.000, 18.000 | 0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edges of the door window; +/- one pixel. |
| L14 | z_inc, left | door 2 outline | 230, 18, 240, 38 | `body/left-side/door-2/outline` | 92.000, 36.000, 4.000, 40.000 | 92.000, 36.000, 4.000, 40.000 | 0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Door edges read from the seam columns and the leaf colour; +/- two pixels. |
| L15 | z_inc, left | door 2 window 1 frame | 232, 20, 237, 29 | `body/left-side/door-2/window-1/frame` | 92.800, 40.000, 2.000, 18.000 | 92.800, 40.000, 2.000, 18.000 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edges of the door window; +/- one pixel. |
| L16 | z_inc, left | class marks | 27, 21, 218, 27 | `body/left-side/class-marks` | 10.800, 42.000, 76.400, 12.000 | 10.800, 42.000, 76.400, 12.000 | -0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Union of the class-mark patches; the numerals are drawn narrower than a plate. |
| L17 | z_inc, left | emblem | 56, 31, 65, 38 | `body/left-side/emblem` | 22.400, 62.000, 3.600, 14.000 | 22.380, 62.000, 3.640, 14.000 | -0.020, 0.000, 0.040, -0.000 | 0.015 | 0.015 | The emblem patch; the drawn emblem keeps its own proportions. |
| B01 | x_both, rear | gangway frame | 7, 17, 23, 37 | `rear-end/gangway` | 23.333, 34.000, 53.333, 40.000 | 23.333, 34.000, 53.333, 40.000 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| B02 | x_both, rear | end door outline | 9, 19, 21, 37 | `rear-end/end-door/outline` | 30.000, 38.000, 40.000, 36.000 | 30.000, 38.000, 40.000, 36.000 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Door between the gangway posts; +/- one pixel. |
| B03 | x_both, rear | end door window 1 | 10, 20, 13, 29 | `rear-end/end-door/window-1/frame` | 33.333, 40.000, 10.000, 18.000 | 33.333, 40.000, 10.000, 18.000 | 0.000, 0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| B04 | x_both, rear | end door window 2 | 17, 20, 20, 29 | `rear-end/end-door/window-2/frame` | 56.667, 40.000, 10.000, 18.000 | 56.667, 40.000, 10.000, 18.000 | 0.000, 0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| B05 | x_both, rear | lamp 1 | 4, 34, 6, 36 | `rear-end/tail-lamps/lamp-1` | 13.333, 68.000, 6.667, 4.000 | 12.917, 67.750, 7.500, 4.500 | -0.417, -0.250, 0.833, 0.500 | 0.500 | 0.500 | Two-pixel lamp patch; a round lens is kept. |
| B06 | x_both, rear | lamp 2 | 24, 34, 26, 36 | `rear-end/tail-lamps/lamp-2` | 80.000, 68.000, 6.667, 4.000 | 79.583, 67.750, 7.500, 4.500 | -0.417, -0.250, 0.833, 0.500 | 0.500 | 0.500 | Two-pixel lamp patch; a round lens is kept. |
| B07 | x_both, rear | buffer head 1 | 2, 38, 7, 42 | `rear-end/buffers/buffer-1/sweep-1` | 6.667, 76.000, 16.667, 8.000 | 13.500, 75.600, 14.667, 8.800 | 6.833, -0.400, -2.000, 0.800 | 2.508 | 2.508 | Standard 1.75 m buffer spacing kept; the coarse raster places the heads wider. |
| B08 | x_both, rear | buffer head 2 | 23, 38, 28, 42 | `rear-end/buffers/buffer-2/sweep-1` | 76.667, 76.000, 16.667, 8.000 | 71.833, 75.600, 14.667, 8.800 | -4.833, -0.400, -2.000, 0.800 | 2.008 | 2.008 | Standard 1.75 m buffer spacing kept; the coarse raster places the heads wider. |
| F01 | x_both, front | gangway frame | 7, 17, 23, 37 | `front-end/gangway` | 23.333, 34.000, 53.333, 40.000 | 23.333, 34.000, 53.333, 40.000 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| F02 | x_both, front | end door outline | 9, 19, 21, 37 | `front-end/end-door/outline` | 30.000, 38.000, 40.000, 36.000 | 30.000, 38.000, 40.000, 36.000 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Door between the gangway posts; +/- one pixel. |
| F03 | x_both, front | end door window 1 | 10, 20, 13, 29 | `front-end/end-door/window-1/frame` | 33.333, 40.000, 10.000, 18.000 | 33.333, 40.000, 10.000, 18.000 | 0.000, 0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| F04 | x_both, front | end door window 2 | 17, 20, 20, 29 | `front-end/end-door/window-2/frame` | 56.667, 40.000, 10.000, 18.000 | 56.667, 40.000, 10.000, 18.000 | 0.000, 0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| F05 | x_both, front | lamp 1 | 4, 34, 6, 36 | `front-end/tail-lamps/lamp-2` | 13.333, 68.000, 6.667, 4.000 | 12.917, 67.750, 7.500, 4.500 | -0.417, -0.250, 0.833, 0.500 | 0.500 | 0.500 | Two-pixel lamp patch; a round lens is kept. |
| F06 | x_both, front | lamp 2 | 24, 34, 26, 36 | `front-end/tail-lamps/lamp-1` | 80.000, 68.000, 6.667, 4.000 | 79.583, 67.750, 7.500, 4.500 | -0.417, -0.250, 0.833, 0.500 | 0.500 | 0.500 | Two-pixel lamp patch; a round lens is kept. |
| F07 | x_both, front | buffer head 1 | 2, 38, 7, 42 | `front-end/buffers/buffer-2/sweep-1` | 6.667, 76.000, 16.667, 8.000 | 13.500, 75.600, 14.667, 8.800 | 6.833, -0.400, -2.000, 0.800 | 2.508 | 2.508 | Standard 1.75 m buffer spacing kept; the coarse raster places the heads wider. |
| F08 | x_both, front | buffer head 2 | 23, 38, 28, 42 | `front-end/buffers/buffer-1/sweep-1` | 76.667, 76.000, 16.667, 8.000 | 71.833, 75.600, 14.667, 8.800 | -4.833, -0.400, -2.000, 0.800 | 2.008 | 2.008 | Standard 1.75 m buffer spacing kept; the coarse raster places the heads wider. |
