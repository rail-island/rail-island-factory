# CD WRRmz native reference comparison

**Covers** - native pixel annotations, baseline and final orthographic errors.
**Code** - `generator/liveryCoach.ts`, `generator/cdYCoach.ts`, `generator/zsrCoach.ts`, `generator/uicZCoach.ts`, `generator/czskCoaches.ts`, `generator/csdCoachComparison.ts`, `generator/csdCoachReport.ts`.
**See also** - [source notes](SOURCES.md), [Czech and Slovak coaches (CD Y, ZSR, UIC-Z)](../../docs/models/czsk-coaches.md).

Model geometry revision (SHA-256 of comparison GLB): `0951c8cf40b259618e06de4158afb86e6ba04f8b55b7be6cf0fa61ce3be55ea8`.

Regenerate with `pnpm exec tsx generator/csdCoachReport.ts cd_wrrmz`. The baseline is the first authored geometry (`native/cd_wrrmz/baseline.json`); baseline and final use the same annotations. Built with `variant=restaurant` of `veh-uic-z-coach`.

Canvases: sides 27 x 4 m (270 x 40 px), ends 3 x 4 m (30 x 40 px), including empty space, 0.1 m a pixel. Origin top left; x right, y down. Side u = 10 * source x = 10 * (Factory X + 13.45); both sides keep increasing source x, so the left (-Z) elevation is mirrored relative to an outside observer, as its BMP is. Ends are seen from outside: rear u = 10 * (z + 1.5), front u = 10 * (1.5 - z). v = 10 * (4 - y).

Each vector is (left, top, width, height). Percentages are 100*x/W, 100*y/H, 100*w/W, 100*h/H of the native canvas. Signed delta = model minus source in percentage points. MAE = sum(abs(delta)) / (4 * number of boxes). Model boxes are the bounds of actual GLB vertices of the named scopes, occluded vertices included. Only the original BMPs define the measurements, never the 4x textures.

| View | Boxes | Baseline MAE (pp) | Final MAE (pp) |
|---|---:|---:|---:|
| z_dec, right | 13 | 0.044 | 0.044 |
| z_inc, left | 14 | 0.041 | 0.041 |
| x_both, rear | 8 | 0.720 | 0.720 |
| x_both, front | 8 | 0.720 | 0.720 |
| All | 43 | 0.295 | 0.295 |

One pixel is 0.370 pp horizontally on the sides, 3.333 pp horizontally on the ends and 2.500 pp vertically. The model was authored from these same measured boxes, so the residuals measure the transfer onto the XML body (tapered and rounded ends, sloped faces, 5 mm edge clearances) and the deliberate mechanical choices (1.75 m buffer spacing, round lamp lenses), not photographic accuracy.

Annotated views (generated locally, not committed):

- z_dec, right: [native](../../export/review/cd_wrrmz/z_dec-right-native.svg), [model](../../export/review/cd_wrrmz/z_dec-right-model.svg)
- z_inc, left: [native](../../export/review/cd_wrrmz/z_inc-left-native.svg), [model](../../export/review/cd_wrrmz/z_inc-left-model.svg)
- x_both, rear: [native](../../export/review/cd_wrrmz/x_both-rear-native.svg), [model](../../export/review/cd_wrrmz/x_both-rear-model.svg)
- x_both, front: [native](../../export/review/cd_wrrmz/x_both-front-native.svg), [model](../../export/review/cd_wrrmz/x_both-front-model.svg)
- [Three-quarter view](../../export/review/cd_wrrmz/three-quarter.png), [thumbnail](../../export/thumbs/veh-uic-z-coach.png)

| ID | View | Element | Native pixel edges | Mesh scope(s) | Source % (x,y,w,h) | Model % | Signed delta (pp) | Baseline abs. mean (pp) | Final abs. mean (pp) | Uncertainty |
|---|---|---|---|---|---|---|---|---:|---:|---|
| R01 | z_dec, right | window 1 frame | 25, 10, 41, 20 | `body/right-side/window-1/frame` | 9.259, 25.000, 5.926, 25.000 | 9.259, 25.000, 5.926, 25.000 | 0.000, 0.000, -0.000, 0.000 | 0.000 | 0.000 | Connected component of the non-paint pixels in the window rows; +/- one pixel. |
| R02 | z_dec, right | window 2 frame | 44, 10, 60, 20 | `body/right-side/window-2/frame` | 16.296, 25.000, 5.926, 25.000 | 16.296, 25.000, 5.926, 25.000 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Connected component of the non-paint pixels in the window rows; +/- one pixel. |
| R03 | z_dec, right | window 3 frame | 63, 10, 79, 20 | `body/right-side/window-3/frame` | 23.333, 25.000, 5.926, 25.000 | 23.333, 25.000, 5.926, 25.000 | -0.000, 0.000, -0.000, 0.000 | 0.000 | 0.000 | Connected component of the non-paint pixels in the window rows; +/- one pixel. |
| R04 | z_dec, right | window 4 frame | 82, 10, 98, 20 | `body/right-side/window-4/frame` | 30.370, 25.000, 5.926, 25.000 | 30.370, 25.000, 5.926, 25.000 | 0.000, 0.000, -0.000, 0.000 | 0.000 | 0.000 | Connected component of the non-paint pixels in the window rows; +/- one pixel. |
| R05 | z_dec, right | window 5 frame | 101, 10, 117, 20 | `body/right-side/window-5/frame` | 37.407, 25.000, 5.926, 25.000 | 37.407, 25.000, 5.926, 25.000 | 0.000, 0.000, -0.000, 0.000 | 0.000 | 0.000 | Connected component of the non-paint pixels in the window rows; +/- one pixel. |
| R06 | z_dec, right | window 6 frame | 136, 10, 152, 19 | `body/right-side/window-6/frame` | 50.370, 25.000, 5.926, 22.500 | 50.370, 25.000, 5.926, 22.500 | 0.000, 0.000, -0.000, 0.000 | 0.000 | 0.000 | Connected component of the non-paint pixels in the window rows; +/- one pixel. |
| R07 | z_dec, right | window 7 frame | 162, 10, 178, 19 | `body/right-side/window-7/frame` | 60.000, 25.000, 5.926, 22.500 | 60.000, 25.000, 5.926, 22.500 | 0.000, 0.000, -0.000, 0.000 | 0.000 | 0.000 | Connected component of the non-paint pixels in the window rows; +/- one pixel. |
| R08 | z_dec, right | window 8 frame | 188, 10, 204, 19 | `body/right-side/window-8/frame` | 69.630, 25.000, 5.926, 22.500 | 69.630, 25.000, 5.926, 22.500 | -0.000, 0.000, -0.000, 0.000 | 0.000 | 0.000 | Connected component of the non-paint pixels in the window rows; +/- one pixel. |
| R09 | z_dec, right | window 9 frame | 221, 10, 237, 20 | `body/right-side/window-9/frame` | 81.852, 25.000, 5.926, 25.000 | 81.852, 25.000, 5.926, 25.000 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Connected component of the non-paint pixels in the window rows; +/- one pixel. |
| R10 | z_dec, right | door 1 outline | 6, 8, 15, 35 | `body/right-side/door-1/outline` | 2.222, 20.000, 3.333, 67.500 | 2.222, 20.000, 3.333, 67.500 | -0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Door edges read from the seam columns and the leaf colour; +/- two pixels. |
| R11 | z_dec, right | door 1 window 1 frame | 8, 11, 14, 20 | `body/right-side/door-1/window-1/frame` | 2.963, 27.500, 2.222, 22.500 | 2.963, 27.500, 2.222, 22.500 | 0.000, -0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edges of the door window; +/- one pixel. |
| R12 | z_dec, right | class marks | 20, 11, 24, 17 | `body/right-side/class-marks` | 7.407, 27.500, 1.481, 15.000 | 7.407, 27.500, 1.481, 15.000 | 0.000, -0.000, -0.000, 0.000 | 0.000 | 0.000 | Union of the class-mark patches; the numerals are drawn narrower than a plate. |
| R13 | z_dec, right | emblem | 46, 23, 52, 27 | `body/right-side/emblem` | 17.037, 57.500, 2.222, 10.000 | 17.301, 58.002, 1.694, 8.994 | 0.264, 0.502, -0.528, -1.006 | 0.575 | 0.575 | The emblem patch; the drawn emblem keeps its own proportions. |
| L01 | z_inc, left | window 1 frame | 25, 10, 41, 20 | `body/left-side/window-1/frame` | 9.259, 25.000, 5.926, 25.000 | 9.259, 25.000, 5.926, 25.000 | 0.000, 0.000, -0.000, 0.000 | 0.000 | 0.000 | Connected component of the non-paint pixels in the window rows; +/- one pixel. |
| L02 | z_inc, left | window 2 frame | 44, 10, 60, 20 | `body/left-side/window-2/frame` | 16.296, 25.000, 5.926, 25.000 | 16.296, 25.000, 5.926, 25.000 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Connected component of the non-paint pixels in the window rows; +/- one pixel. |
| L03 | z_inc, left | window 3 frame | 63, 10, 79, 20 | `body/left-side/window-3/frame` | 23.333, 25.000, 5.926, 25.000 | 23.333, 25.000, 5.926, 25.000 | -0.000, 0.000, -0.000, 0.000 | 0.000 | 0.000 | Connected component of the non-paint pixels in the window rows; +/- one pixel. |
| L04 | z_inc, left | window 4 frame | 82, 10, 98, 20 | `body/left-side/window-4/frame` | 30.370, 25.000, 5.926, 25.000 | 30.370, 25.000, 5.926, 25.000 | 0.000, 0.000, -0.000, 0.000 | 0.000 | 0.000 | Connected component of the non-paint pixels in the window rows; +/- one pixel. |
| L05 | z_inc, left | window 5 frame | 101, 10, 117, 20 | `body/left-side/window-5/frame` | 37.407, 25.000, 5.926, 25.000 | 37.407, 25.000, 5.926, 25.000 | 0.000, 0.000, -0.000, 0.000 | 0.000 | 0.000 | Connected component of the non-paint pixels in the window rows; +/- one pixel. |
| L06 | z_inc, left | window 6 frame | 124, 10, 134, 20 | `body/left-side/window-6/frame` | 45.926, 25.000, 3.704, 25.000 | 45.926, 25.000, 3.704, 25.000 | 0.000, 0.000, -0.000, 0.000 | 0.000 | 0.000 | Connected component of the non-paint pixels in the window rows; +/- one pixel. |
| L07 | z_inc, left | window 7 frame | 142, 10, 152, 19 | `body/left-side/window-7/frame` | 52.593, 25.000, 3.704, 22.500 | 52.593, 25.000, 3.704, 22.500 | 0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Connected component of the non-paint pixels in the window rows; +/- one pixel. |
| L08 | z_inc, left | window 8 frame | 168, 10, 178, 19 | `body/left-side/window-8/frame` | 62.222, 25.000, 3.704, 22.500 | 62.222, 25.000, 3.704, 22.500 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Connected component of the non-paint pixels in the window rows; +/- one pixel. |
| L09 | z_inc, left | window 9 frame | 193, 10, 203, 19 | `body/left-side/window-9/frame` | 71.481, 25.000, 3.704, 22.500 | 71.481, 25.000, 3.704, 22.500 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Connected component of the non-paint pixels in the window rows; +/- one pixel. |
| L10 | z_inc, left | window 10 frame | 221, 10, 237, 20 | `body/left-side/window-10/frame` | 81.852, 25.000, 5.926, 25.000 | 81.852, 25.000, 5.926, 25.000 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Connected component of the non-paint pixels in the window rows; +/- one pixel. |
| L11 | z_inc, left | door 1 outline | 6, 8, 15, 35 | `body/left-side/door-1/outline` | 2.222, 20.000, 3.333, 67.500 | 2.222, 20.000, 3.333, 67.500 | -0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Door edges read from the seam columns and the leaf colour; +/- two pixels. |
| L12 | z_inc, left | door 1 window 1 frame | 8, 11, 14, 20 | `body/left-side/door-1/window-1/frame` | 2.963, 27.500, 2.222, 22.500 | 2.963, 27.500, 2.222, 22.500 | 0.000, -0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edges of the door window; +/- one pixel. |
| L13 | z_inc, left | class marks | 20, 11, 24, 17 | `body/left-side/class-marks` | 7.407, 27.500, 1.481, 15.000 | 7.407, 27.500, 1.481, 15.000 | 0.000, -0.000, -0.000, 0.000 | 0.000 | 0.000 | Union of the class-mark patches; the numerals are drawn narrower than a plate. |
| L14 | z_inc, left | emblem | 183, 23, 189, 27 | `body/left-side/emblem` | 67.778, 57.500, 2.222, 10.000 | 68.042, 58.002, 1.694, 8.994 | 0.264, 0.502, -0.528, -1.006 | 0.575 | 0.575 | The emblem patch; the drawn emblem keeps its own proportions. |
| B01 | x_both, rear | gangway frame | 7, 7, 23, 29 | `rear-end/gangway` | 23.333, 17.500, 53.333, 55.000 | 23.333, 17.500, 53.333, 55.000 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| B02 | x_both, rear | end door outline | 9, 9, 21, 24 | `rear-end/end-door/outline` | 30.000, 22.500, 40.000, 37.500 | 30.000, 22.500, 40.000, 37.500 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Door between the gangway posts; +/- one pixel. |
| B03 | x_both, rear | end door window 1 | 10, 11, 13, 18 | `rear-end/end-door/window-1/frame` | 33.333, 27.500, 10.000, 17.500 | 33.333, 27.500, 10.000, 17.500 | 0.000, -0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| B04 | x_both, rear | end door window 2 | 17, 11, 20, 18 | `rear-end/end-door/window-2/frame` | 56.667, 27.500, 10.000, 17.500 | 56.667, 27.500, 10.000, 17.500 | 0.000, -0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| B05 | x_both, rear | lamp 1 | 4, 17, 6, 19 | `rear-end/tail-lamps/lamp-1` | 13.333, 42.500, 6.667, 5.000 | 12.917, 42.188, 7.500, 5.625 | -0.417, -0.313, 0.833, 0.625 | 0.547 | 0.547 | Two-pixel lamp patch; a round lens is kept. |
| B06 | x_both, rear | lamp 2 | 24, 17, 26, 19 | `rear-end/tail-lamps/lamp-2` | 80.000, 42.500, 6.667, 5.000 | 79.583, 42.188, 7.500, 5.625 | -0.417, -0.313, 0.833, 0.625 | 0.547 | 0.547 | Two-pixel lamp patch; a round lens is kept. |
| B07 | x_both, rear | buffer head 1 | 2, 28, 7, 32 | `rear-end/buffers/buffer-1/sweep-1` | 6.667, 70.000, 16.667, 10.000 | 13.500, 69.500, 14.667, 11.000 | 6.833, -0.500, -2.000, 1.000 | 2.583 | 2.583 | Standard 1.75 m buffer spacing kept; the coarse raster places the heads wider. |
| B08 | x_both, rear | buffer head 2 | 23, 28, 28, 32 | `rear-end/buffers/buffer-2/sweep-1` | 76.667, 70.000, 16.667, 10.000 | 71.833, 69.500, 14.667, 11.000 | -4.833, -0.500, -2.000, 1.000 | 2.083 | 2.083 | Standard 1.75 m buffer spacing kept; the coarse raster places the heads wider. |
| F01 | x_both, front | gangway frame | 7, 7, 23, 29 | `front-end/gangway` | 23.333, 17.500, 53.333, 55.000 | 23.333, 17.500, 53.333, 55.000 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| F02 | x_both, front | end door outline | 9, 9, 21, 24 | `front-end/end-door/outline` | 30.000, 22.500, 40.000, 37.500 | 30.000, 22.500, 40.000, 37.500 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Door between the gangway posts; +/- one pixel. |
| F03 | x_both, front | end door window 1 | 10, 11, 13, 18 | `front-end/end-door/window-1/frame` | 33.333, 27.500, 10.000, 17.500 | 33.333, 27.500, 10.000, 17.500 | 0.000, -0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| F04 | x_both, front | end door window 2 | 17, 11, 20, 18 | `front-end/end-door/window-2/frame` | 56.667, 27.500, 10.000, 17.500 | 56.667, 27.500, 10.000, 17.500 | 0.000, -0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| F05 | x_both, front | lamp 1 | 4, 17, 6, 19 | `front-end/tail-lamps/lamp-2` | 13.333, 42.500, 6.667, 5.000 | 12.917, 42.188, 7.500, 5.625 | -0.417, -0.313, 0.833, 0.625 | 0.547 | 0.547 | Two-pixel lamp patch; a round lens is kept. |
| F06 | x_both, front | lamp 2 | 24, 17, 26, 19 | `front-end/tail-lamps/lamp-1` | 80.000, 42.500, 6.667, 5.000 | 79.583, 42.188, 7.500, 5.625 | -0.417, -0.313, 0.833, 0.625 | 0.547 | 0.547 | Two-pixel lamp patch; a round lens is kept. |
| F07 | x_both, front | buffer head 1 | 2, 28, 7, 32 | `front-end/buffers/buffer-2/sweep-1` | 6.667, 70.000, 16.667, 10.000 | 13.500, 69.500, 14.667, 11.000 | 6.833, -0.500, -2.000, 1.000 | 2.583 | 2.583 | Standard 1.75 m buffer spacing kept; the coarse raster places the heads wider. |
| F08 | x_both, front | buffer head 2 | 23, 28, 28, 32 | `front-end/buffers/buffer-1/sweep-1` | 76.667, 70.000, 16.667, 10.000 | 71.833, 69.500, 14.667, 11.000 | -4.833, -0.500, -2.000, 1.000 | 2.083 | 2.083 | Standard 1.75 m buffer spacing kept; the coarse raster places the heads wider. |
