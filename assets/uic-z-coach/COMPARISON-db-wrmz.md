# DB IC WRmz native reference comparison

**Covers** - native pixel annotations, baseline and final orthographic errors.
**Code** - `generator/liveryCoach.ts`, `generator/cdYCoach.ts`, `generator/zsrCoach.ts`, `generator/uicZCoach.ts`, `generator/czskCoaches.ts`, `generator/csdCoachComparison.ts`, `generator/csdCoachReport.ts`.
**See also** - [source notes](SOURCES.md), [Czech and Slovak coaches (CD Y, ZSR, UIC-Z)](../../docs/models/czsk-coaches.md).

Model geometry revision (SHA-256 of comparison GLB): `bbbf12e86feac53f5f19315ffce04d17605a639518ccef07f796c037a4301ece`.

Regenerate with `pnpm exec tsx generator/csdCoachReport.ts db_ic_wrmz`. The baseline is the first authored geometry (`native/db_ic_wrmz/baseline.json`); baseline and final use the same annotations. Built with `variant=restaurant`, `operator=db` of `veh-uic-z-coach`.

Canvases: sides 27 x 4 m (270 x 40 px), ends 3 x 4 m (30 x 40 px), including empty space, 0.1 m a pixel. Origin top left; x right, y down. Side u = 10 * source x = 10 * (Factory X + 13.45); both sides keep increasing source x, so the left (-Z) elevation is mirrored relative to an outside observer, as its BMP is. Ends are seen from outside: rear u = 10 * (z + 1.5), front u = 10 * (1.5 - z). v = 10 * (4 - y).

Each vector is (left, top, width, height). Percentages are 100*x/W, 100*y/H, 100*w/W, 100*h/H of the native canvas. Signed delta = model minus source in percentage points. MAE = sum(abs(delta)) / (4 * number of boxes). Model boxes are the bounds of actual GLB vertices of the named scopes, occluded vertices included. Only the original BMPs define the measurements, never the 4x textures.

| View | Boxes | Baseline MAE (pp) | Final MAE (pp) |
|---|---:|---:|---:|
| z_dec, right | 18 | 0.006 | 0.006 |
| z_inc, left | 13 | 0.000 | 0.000 |
| x_dec, rear | 8 | 0.720 | 0.720 |
| x_inc, front | 8 | 0.720 | 0.720 |
| All | 47 | 0.247 | 0.247 |

One pixel is 0.370 pp horizontally on the sides, 3.333 pp horizontally on the ends and 2.500 pp vertically. The model was authored from these same measured boxes, so the residuals measure the transfer onto the XML body (tapered and rounded ends, sloped faces, 5 mm edge clearances) and the deliberate mechanical choices (1.75 m buffer spacing, round lamp lenses), not photographic accuracy.

Annotated views (generated locally, not committed):

- z_dec, right: [native](../../export/review/db_ic_wrmz/z_dec-right-native.svg), [model](../../export/review/db_ic_wrmz/z_dec-right-model.svg)
- z_inc, left: [native](../../export/review/db_ic_wrmz/z_inc-left-native.svg), [model](../../export/review/db_ic_wrmz/z_inc-left-model.svg)
- x_dec, rear: [native](../../export/review/db_ic_wrmz/x_dec-rear-native.svg), [model](../../export/review/db_ic_wrmz/x_dec-rear-model.svg)
- x_inc, front: [native](../../export/review/db_ic_wrmz/x_inc-front-native.svg), [model](../../export/review/db_ic_wrmz/x_inc-front-model.svg)
- [Three-quarter view](../../export/review/db_ic_wrmz/three-quarter.png), [thumbnail](../../export/thumbs/veh-uic-z-coach.png)

| ID | View | Element | Native pixel edges | Mesh scope(s) | Source % (x,y,w,h) | Model % | Signed delta (pp) | Baseline abs. mean (pp) | Final abs. mean (pp) | Uncertainty |
|---|---|---|---|---|---|---|---|---:|---:|---|
| R01 | z_dec, right | window 1 frame | 17, 10, 32, 20 | `body/right-side/window-1/frame` | 6.296, 25.000, 5.556, 25.000 | 6.296, 25.000, 5.556, 25.000 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Connected component of the non-paint pixels in the window rows; +/- one pixel. |
| R02 | z_dec, right | window 2 frame | 35, 10, 50, 20 | `body/right-side/window-2/frame` | 12.963, 25.000, 5.556, 25.000 | 12.963, 25.000, 5.556, 25.000 | 0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Connected component of the non-paint pixels in the window rows; +/- one pixel. |
| R03 | z_dec, right | window 3 frame | 53, 10, 68, 20 | `body/right-side/window-3/frame` | 19.630, 25.000, 5.556, 25.000 | 19.630, 25.000, 5.556, 25.000 | 0.000, 0.000, -0.000, 0.000 | 0.000 | 0.000 | Connected component of the non-paint pixels in the window rows; +/- one pixel. |
| R04 | z_dec, right | window 4 frame | 71, 10, 86, 20 | `body/right-side/window-4/frame` | 26.296, 25.000, 5.556, 25.000 | 26.296, 25.000, 5.556, 25.000 | 0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Connected component of the non-paint pixels in the window rows; +/- one pixel. |
| R05 | z_dec, right | window 5 frame | 89, 10, 104, 20 | `body/right-side/window-5/frame` | 32.963, 25.000, 5.556, 25.000 | 32.963, 25.000, 5.556, 25.000 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Connected component of the non-paint pixels in the window rows; +/- one pixel. |
| R06 | z_dec, right | window 6 frame | 107, 10, 122, 20 | `body/right-side/window-6/frame` | 39.630, 25.000, 5.556, 25.000 | 39.630, 25.000, 5.556, 25.000 | 0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Connected component of the non-paint pixels in the window rows; +/- one pixel. |
| R07 | z_dec, right | window 7 frame | 125, 10, 140, 20 | `body/right-side/window-7/frame` | 46.296, 25.000, 5.556, 25.000 | 46.296, 25.000, 5.556, 25.000 | 0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Connected component of the non-paint pixels in the window rows; +/- one pixel. |
| R08 | z_dec, right | window 8 frame | 145, 10, 160, 20 | `body/right-side/window-8/frame` | 53.704, 25.000, 5.556, 25.000 | 53.704, 25.000, 5.556, 25.000 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Connected component of the non-paint pixels in the window rows; +/- one pixel. |
| R09 | z_dec, right | window 9 frame | 165, 10, 180, 20 | `body/right-side/window-9/frame` | 61.111, 25.000, 5.556, 25.000 | 61.111, 25.000, 5.556, 25.000 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Connected component of the non-paint pixels in the window rows; +/- one pixel. |
| R10 | z_dec, right | window 10 frame | 185, 10, 200, 20 | `body/right-side/window-10/frame` | 68.519, 25.000, 5.556, 25.000 | 68.519, 25.000, 5.407, 25.000 | 0.000, 0.000, -0.148, 0.000 | 0.037 | 0.037 | Connected component of the non-paint pixels in the window rows; +/- one pixel. |
| R11 | z_dec, right | window 11 frame | 200, 10, 215, 20 | `body/right-side/window-11/frame` | 74.074, 25.000, 5.556, 25.000 | 74.222, 25.000, 5.407, 25.000 | 0.148, 0.000, -0.148, 0.000 | 0.074 | 0.074 | Connected component of the non-paint pixels in the window rows; +/- one pixel. |
| R12 | z_dec, right | window 12 frame | 220, 10, 235, 20 | `body/right-side/window-12/frame` | 81.481, 25.000, 5.556, 25.000 | 81.481, 25.000, 5.556, 25.000 | 0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Connected component of the non-paint pixels in the window rows; +/- one pixel. |
| R13 | z_dec, right | window 13 frame | 256, 10, 265, 20 | `body/right-side/window-13/frame` | 94.815, 25.000, 3.333, 25.000 | 94.815, 25.000, 3.333, 25.000 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Connected component of the non-paint pixels in the window rows; +/- one pixel. |
| R14 | z_dec, right | door 1 outline | 5, 9, 14, 34 | `body/right-side/door-1/outline` | 1.852, 22.500, 3.333, 62.500 | 1.852, 22.500, 3.333, 62.500 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Door edges read from the seam columns and the leaf colour; +/- two pixels. |
| R15 | z_dec, right | door 1 window 1 frame | 7, 11, 12, 20 | `body/right-side/door-1/window-1/frame` | 2.593, 27.500, 1.852, 22.500 | 2.593, 27.500, 1.852, 22.500 | -0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edges of the door window; +/- one pixel. |
| R16 | z_dec, right | service door seams | 241, 9, 251, 29 | `body/right-side/seams` | 89.259, 22.500, 3.704, 50.000 | 89.259, 22.500, 3.704, 50.000 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Service door seams painted over by the livery; +/- one pixel. |
| R17 | z_dec, right | painted areas | 101, 24, 131, 27 | `body/right-side/paint` | 37.407, 60.000, 11.111, 7.500 | 37.407, 60.000, 11.111, 7.500 | 0.000, -0.000, -0.000, 0.000 | 0.000 | 0.000 | Union of the painted patches (stripe gaps, first class line, pictograms); +/- one pixel. |
| R18 | z_dec, right | emblem | 30, 24, 36, 27 | `body/right-side/emblem` | 11.111, 60.000, 2.222, 7.500 | 11.111, 60.000, 2.222, 7.500 | 0.000, -0.000, -0.000, 0.000 | 0.000 | 0.000 | The emblem patch; the drawn emblem keeps its own proportions. |
| L01 | z_inc, left | window 1 frame | 72, 10, 87, 20 | `body/left-side/window-1/frame` | 26.667, 25.000, 5.556, 25.000 | 26.667, 25.000, 5.556, 25.000 | 0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Connected component of the non-paint pixels in the window rows; +/- one pixel. |
| L02 | z_inc, left | window 2 frame | 92, 10, 107, 20 | `body/left-side/window-2/frame` | 34.074, 25.000, 5.556, 25.000 | 34.074, 25.000, 5.556, 25.000 | 0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Connected component of the non-paint pixels in the window rows; +/- one pixel. |
| L03 | z_inc, left | window 3 frame | 112, 10, 127, 20 | `body/left-side/window-3/frame` | 41.481, 25.000, 5.556, 25.000 | 41.481, 25.000, 5.556, 25.000 | 0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Connected component of the non-paint pixels in the window rows; +/- one pixel. |
| L04 | z_inc, left | window 4 frame | 132, 10, 147, 20 | `body/left-side/window-4/frame` | 48.889, 25.000, 5.556, 25.000 | 48.889, 25.000, 5.556, 25.000 | 0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Connected component of the non-paint pixels in the window rows; +/- one pixel. |
| L05 | z_inc, left | window 5 frame | 183, 10, 198, 20 | `body/left-side/window-5/frame` | 67.778, 25.000, 5.556, 25.000 | 67.778, 25.000, 5.556, 25.000 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Connected component of the non-paint pixels in the window rows; +/- one pixel. |
| L06 | z_inc, left | window 6 frame | 201, 10, 216, 20 | `body/left-side/window-6/frame` | 74.444, 25.000, 5.556, 25.000 | 74.444, 25.000, 5.556, 25.000 | 0.000, 0.000, -0.000, 0.000 | 0.000 | 0.000 | Connected component of the non-paint pixels in the window rows; +/- one pixel. |
| L07 | z_inc, left | window 7 frame | 219, 10, 234, 20 | `body/left-side/window-7/frame` | 81.111, 25.000, 5.556, 25.000 | 81.111, 25.000, 5.556, 25.000 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Connected component of the non-paint pixels in the window rows; +/- one pixel. |
| L08 | z_inc, left | window 8 frame | 237, 10, 252, 20 | `body/left-side/window-8/frame` | 87.778, 25.000, 5.556, 25.000 | 87.778, 25.000, 5.556, 25.000 | 0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Connected component of the non-paint pixels in the window rows; +/- one pixel. |
| L09 | z_inc, left | door 1 outline | 255, 9, 264, 34 | `body/left-side/door-1/outline` | 94.444, 22.500, 3.333, 62.500 | 94.444, 22.500, 3.333, 62.500 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Door edges read from the seam columns and the leaf colour; +/- two pixels. |
| L10 | z_inc, left | door 1 window 1 frame | 257, 11, 262, 20 | `body/left-side/door-1/window-1/frame` | 95.185, 27.500, 1.852, 22.500 | 95.185, 27.500, 1.852, 22.500 | 0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edges of the door window; +/- one pixel. |
| L11 | z_inc, left | service door seams | 19, 9, 29, 29 | `body/left-side/seams` | 7.037, 22.500, 3.704, 50.000 | 7.037, 22.500, 3.704, 50.000 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Service door seams painted over by the livery; +/- one pixel. |
| L12 | z_inc, left | painted areas | 152, 24, 182, 27 | `body/left-side/paint` | 56.296, 60.000, 11.111, 7.500 | 56.296, 60.000, 11.111, 7.500 | 0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Union of the painted patches (stripe gaps, first class line, pictograms); +/- one pixel. |
| L13 | z_inc, left | emblem | 36, 24, 42, 27 | `body/left-side/emblem` | 13.333, 60.000, 2.222, 7.500 | 13.333, 60.000, 2.222, 7.500 | -0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | The emblem patch; the drawn emblem keeps its own proportions. |
| B01 | x_dec, rear | gangway frame | 7, 7, 23, 29 | `rear-end/gangway` | 23.333, 17.500, 53.333, 55.000 | 23.333, 17.500, 53.333, 55.000 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| B02 | x_dec, rear | end door outline | 9, 9, 21, 24 | `rear-end/end-door/outline` | 30.000, 22.500, 40.000, 37.500 | 30.000, 22.500, 40.000, 37.500 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Door between the gangway posts; +/- one pixel. |
| B03 | x_dec, rear | end door window 1 | 10, 11, 13, 18 | `rear-end/end-door/window-1/frame` | 33.333, 27.500, 10.000, 17.500 | 33.333, 27.500, 10.000, 17.500 | 0.000, -0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| B04 | x_dec, rear | end door window 2 | 17, 11, 20, 18 | `rear-end/end-door/window-2/frame` | 56.667, 27.500, 10.000, 17.500 | 56.667, 27.500, 10.000, 17.500 | 0.000, -0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| B05 | x_dec, rear | lamp 1 | 4, 17, 6, 19 | `rear-end/tail-lamps/lamp-1` | 13.333, 42.500, 6.667, 5.000 | 12.917, 42.188, 7.500, 5.625 | -0.417, -0.313, 0.833, 0.625 | 0.547 | 0.547 | Two-pixel lamp patch; a round lens is kept. |
| B06 | x_dec, rear | lamp 2 | 24, 17, 26, 19 | `rear-end/tail-lamps/lamp-2` | 80.000, 42.500, 6.667, 5.000 | 79.583, 42.188, 7.500, 5.625 | -0.417, -0.313, 0.833, 0.625 | 0.547 | 0.547 | Two-pixel lamp patch; a round lens is kept. |
| B07 | x_dec, rear | buffer head 1 | 2, 28, 7, 32 | `rear-end/buffers/buffer-1/sweep-1` | 6.667, 70.000, 16.667, 10.000 | 13.500, 69.500, 14.667, 11.000 | 6.833, -0.500, -2.000, 1.000 | 2.583 | 2.583 | Standard 1.75 m buffer spacing kept; the coarse raster places the heads wider. |
| B08 | x_dec, rear | buffer head 2 | 23, 28, 28, 32 | `rear-end/buffers/buffer-2/sweep-1` | 76.667, 70.000, 16.667, 10.000 | 71.833, 69.500, 14.667, 11.000 | -4.833, -0.500, -2.000, 1.000 | 2.083 | 2.083 | Standard 1.75 m buffer spacing kept; the coarse raster places the heads wider. |
| F01 | x_inc, front | gangway frame | 7, 7, 23, 29 | `front-end/gangway` | 23.333, 17.500, 53.333, 55.000 | 23.333, 17.500, 53.333, 55.000 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| F02 | x_inc, front | end door outline | 9, 9, 21, 24 | `front-end/end-door/outline` | 30.000, 22.500, 40.000, 37.500 | 30.000, 22.500, 40.000, 37.500 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Door between the gangway posts; +/- one pixel. |
| F03 | x_inc, front | end door window 1 | 10, 11, 13, 18 | `front-end/end-door/window-1/frame` | 33.333, 27.500, 10.000, 17.500 | 33.333, 27.500, 10.000, 17.500 | 0.000, -0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| F04 | x_inc, front | end door window 2 | 17, 11, 20, 18 | `front-end/end-door/window-2/frame` | 56.667, 27.500, 10.000, 17.500 | 56.667, 27.500, 10.000, 17.500 | 0.000, -0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| F05 | x_inc, front | lamp 1 | 4, 17, 6, 19 | `front-end/tail-lamps/lamp-2` | 13.333, 42.500, 6.667, 5.000 | 12.917, 42.188, 7.500, 5.625 | -0.417, -0.313, 0.833, 0.625 | 0.547 | 0.547 | Two-pixel lamp patch; a round lens is kept. |
| F06 | x_inc, front | lamp 2 | 24, 17, 26, 19 | `front-end/tail-lamps/lamp-1` | 80.000, 42.500, 6.667, 5.000 | 79.583, 42.188, 7.500, 5.625 | -0.417, -0.313, 0.833, 0.625 | 0.547 | 0.547 | Two-pixel lamp patch; a round lens is kept. |
| F07 | x_inc, front | buffer head 1 | 2, 28, 7, 32 | `front-end/buffers/buffer-2/sweep-1` | 6.667, 70.000, 16.667, 10.000 | 13.500, 69.500, 14.667, 11.000 | 6.833, -0.500, -2.000, 1.000 | 2.583 | 2.583 | Standard 1.75 m buffer spacing kept; the coarse raster places the heads wider. |
| F08 | x_inc, front | buffer head 2 | 23, 28, 28, 32 | `front-end/buffers/buffer-1/sweep-1` | 76.667, 70.000, 16.667, 10.000 | 71.833, 69.500, 14.667, 11.000 | -4.833, -0.500, -2.000, 1.000 | 2.083 | 2.083 | Standard 1.75 m buffer spacing kept; the coarse raster places the heads wider. |
