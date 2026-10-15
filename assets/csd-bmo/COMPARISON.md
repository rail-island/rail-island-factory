# CSD Bmo native reference comparison

**Covers** - native pixel annotations, baseline and final orthographic errors.
**Code** - `generator/csdCoaches.ts`, `generator/csdCoachComparison.ts`, `generator/csdCoachReport.ts`.
**See also** - [source notes](SOURCES.md), [CSD coaches](../../docs/models/csd-coaches.md).

Model geometry revision (SHA-256 of comparison GLB): `5cdbfc1882caa8c91a3afd325578828da117849889070c4719d2077639e3edfd`.

Regenerate with `pnpm exec tsx generator/csdCoachReport.ts csd-bmo`. The baseline is the first authored geometry (`native/baseline.json`); baseline and final use the same annotations.

Canvases: sides 27 x 5 m (270 x 50 px), ends 3 x 5 m (30 x 50 px), including empty space, 0.1 m a pixel. Origin top left; x right, y down. Side u = 10 * source x = 10 * (Factory X + 13.4); both sides keep increasing source x, so the left (-Z) elevation is mirrored relative to an outside observer, as its BMP is. Ends are seen from outside: rear u = 10 * (z + 1.5), front u = 10 * (1.5 - z). v = 10 * (5 - y).

Each vector is (left, top, width, height). Percentages are 100*x/W, 100*y/H, 100*w/W, 100*h/H of the native canvas. Signed delta = model minus source in percentage points. MAE = sum(abs(delta)) / (4 * number of boxes). Model boxes are the bounds of actual GLB vertices of the named scopes, occluded vertices included. Only the original BMPs define the measurements, never the 4x textures.

| View | Boxes | Baseline MAE (pp) | Final MAE (pp) |
|---|---:|---:|---:|
| z_both, right | 22 | 0.000 | 0.000 |
| z_both, left | 22 | 0.000 | 0.000 |
| x_both, rear | 8 | 0.794 | 0.794 |
| x_both, front | 8 | 0.794 | 0.794 |
| All | 60 | 0.212 | 0.212 |

One pixel is 0.370 pp horizontally on the sides, 3.333 pp horizontally on the ends and 2.000 pp vertically. The model was authored from these same measured boxes, so the residuals measure the transfer onto the XML body (tapered and rounded ends, sloped faces, 5 mm edge clearances) and the deliberate mechanical choices (1.75 m buffer spacing, round lamp lenses), not photographic accuracy.

Annotated views (generated locally, not committed):

- z_both, right: [native](../../export/review/csd-bmo/z_both-right-native.svg), [model](../../export/review/csd-bmo/z_both-right-model.svg)
- z_both, left: [native](../../export/review/csd-bmo/z_both-left-native.svg), [model](../../export/review/csd-bmo/z_both-left-model.svg)
- x_both, rear: [native](../../export/review/csd-bmo/x_both-rear-native.svg), [model](../../export/review/csd-bmo/x_both-rear-model.svg)
- x_both, front: [native](../../export/review/csd-bmo/x_both-front-native.svg), [model](../../export/review/csd-bmo/x_both-front-model.svg)
- [Three-quarter view](../../export/review/csd-bmo/three-quarter.png), [thumbnail](../../export/thumbs/veh-csd-bmo.png)

| ID | View | Element | Native pixel edges | Mesh scope(s) | Source % (x,y,w,h) | Model % | Signed delta (pp) | Baseline abs. mean (pp) | Final abs. mean (pp) | Uncertainty |
|---|---|---|---|---|---|---|---|---:|---:|---|
| R01 | z_both, right | window 1 frame | 85, 10, 98, 18 | `body/right-side/window-1/frame` | 31.481, 20.000, 4.815, 16.000 | 31.481, 20.000, 4.815, 16.000 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R02 | z_both, right | window 2 frame | 102, 10, 115, 18 | `body/right-side/window-2/frame` | 37.778, 20.000, 4.815, 16.000 | 37.778, 20.000, 4.815, 16.000 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R03 | z_both, right | window 3 frame | 119, 10, 132, 18 | `body/right-side/window-3/frame` | 44.074, 20.000, 4.815, 16.000 | 44.074, 20.000, 4.815, 16.000 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R04 | z_both, right | window 4 frame | 136, 10, 149, 18 | `body/right-side/window-4/frame` | 50.370, 20.000, 4.815, 16.000 | 50.370, 20.000, 4.815, 16.000 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R05 | z_both, right | window 5 frame | 153, 10, 166, 18 | `body/right-side/window-5/frame` | 56.667, 20.000, 4.815, 16.000 | 56.667, 20.000, 4.815, 16.000 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R06 | z_both, right | window 6 frame | 170, 10, 183, 18 | `body/right-side/window-6/frame` | 62.963, 20.000, 4.815, 16.000 | 62.963, 20.000, 4.815, 16.000 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R07 | z_both, right | window 7 frame | 85, 31, 98, 40 | `body/right-side/window-7/frame` | 31.481, 62.000, 4.815, 18.000 | 31.481, 62.000, 4.815, 18.000 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R08 | z_both, right | window 8 frame | 102, 31, 115, 40 | `body/right-side/window-8/frame` | 37.778, 62.000, 4.815, 18.000 | 37.778, 62.000, 4.815, 18.000 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R09 | z_both, right | window 9 frame | 119, 31, 132, 40 | `body/right-side/window-9/frame` | 44.074, 62.000, 4.815, 18.000 | 44.074, 62.000, 4.815, 18.000 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R10 | z_both, right | window 10 frame | 136, 31, 149, 40 | `body/right-side/window-10/frame` | 50.370, 62.000, 4.815, 18.000 | 50.370, 62.000, 4.815, 18.000 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R11 | z_both, right | window 11 frame | 153, 31, 166, 40 | `body/right-side/window-11/frame` | 56.667, 62.000, 4.815, 18.000 | 56.667, 62.000, 4.815, 18.000 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R12 | z_both, right | window 12 frame | 170, 31, 183, 40 | `body/right-side/window-12/frame` | 62.963, 62.000, 4.815, 18.000 | 62.963, 62.000, 4.815, 18.000 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R13 | z_both, right | window 13 frame | 23, 21, 36, 30 | `body/right-side/window-13/frame` | 8.519, 42.000, 4.815, 18.000 | 8.519, 42.000, 4.815, 18.000 | -0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R14 | z_both, right | window 14 frame | 233, 21, 246, 30 | `body/right-side/window-14/frame` | 86.296, 42.000, 4.815, 18.000 | 86.296, 42.000, 4.815, 18.000 | -0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R15 | z_both, right | window 15 frame | 251, 21, 259, 30 | `body/right-side/window-15/frame` | 92.963, 42.000, 2.963, 18.000 | 92.963, 42.000, 2.963, 18.000 | -0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R16 | z_both, right | door 1 outline | 64, 25, 81, 46 | `body/right-side/door-1/outline` | 23.704, 50.000, 6.296, 42.000 | 23.704, 50.000, 6.296, 42.000 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R17 | z_both, right | door 1 window 1 frame | 66, 26, 71, 36 | `body/right-side/door-1/window-1/frame` | 24.444, 52.000, 1.852, 20.000 | 24.444, 52.000, 1.852, 20.000 | -0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R18 | z_both, right | door 1 window 2 frame | 74, 26, 79, 36 | `body/right-side/door-1/window-2/frame` | 27.407, 52.000, 1.852, 20.000 | 27.407, 52.000, 1.852, 20.000 | 0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R19 | z_both, right | door 2 outline | 187, 25, 204, 46 | `body/right-side/door-2/outline` | 69.259, 50.000, 6.296, 42.000 | 69.259, 50.000, 6.296, 42.000 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R20 | z_both, right | door 2 window 1 frame | 189, 26, 194, 36 | `body/right-side/door-2/window-1/frame` | 70.000, 52.000, 1.852, 20.000 | 70.000, 52.000, 1.852, 20.000 | 0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R21 | z_both, right | door 2 window 2 frame | 197, 26, 202, 36 | `body/right-side/door-2/window-2/frame` | 72.963, 52.000, 1.852, 20.000 | 72.963, 52.000, 1.852, 20.000 | 0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R22 | z_both, right | hatch outline | 24, 32, 35, 39 | `body/right-side/door-3/outline` | 8.889, 64.000, 4.074, 14.000 | 8.889, 64.000, 4.074, 14.000 | 0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L01 | z_both, left | window 1 frame | 85, 10, 98, 18 | `body/left-side/window-1/frame` | 31.481, 20.000, 4.815, 16.000 | 31.481, 20.000, 4.815, 16.000 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L02 | z_both, left | window 2 frame | 102, 10, 115, 18 | `body/left-side/window-2/frame` | 37.778, 20.000, 4.815, 16.000 | 37.778, 20.000, 4.815, 16.000 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L03 | z_both, left | window 3 frame | 119, 10, 132, 18 | `body/left-side/window-3/frame` | 44.074, 20.000, 4.815, 16.000 | 44.074, 20.000, 4.815, 16.000 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L04 | z_both, left | window 4 frame | 136, 10, 149, 18 | `body/left-side/window-4/frame` | 50.370, 20.000, 4.815, 16.000 | 50.370, 20.000, 4.815, 16.000 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L05 | z_both, left | window 5 frame | 153, 10, 166, 18 | `body/left-side/window-5/frame` | 56.667, 20.000, 4.815, 16.000 | 56.667, 20.000, 4.815, 16.000 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L06 | z_both, left | window 6 frame | 170, 10, 183, 18 | `body/left-side/window-6/frame` | 62.963, 20.000, 4.815, 16.000 | 62.963, 20.000, 4.815, 16.000 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L07 | z_both, left | window 7 frame | 85, 31, 98, 40 | `body/left-side/window-7/frame` | 31.481, 62.000, 4.815, 18.000 | 31.481, 62.000, 4.815, 18.000 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L08 | z_both, left | window 8 frame | 102, 31, 115, 40 | `body/left-side/window-8/frame` | 37.778, 62.000, 4.815, 18.000 | 37.778, 62.000, 4.815, 18.000 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L09 | z_both, left | window 9 frame | 119, 31, 132, 40 | `body/left-side/window-9/frame` | 44.074, 62.000, 4.815, 18.000 | 44.074, 62.000, 4.815, 18.000 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L10 | z_both, left | window 10 frame | 136, 31, 149, 40 | `body/left-side/window-10/frame` | 50.370, 62.000, 4.815, 18.000 | 50.370, 62.000, 4.815, 18.000 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L11 | z_both, left | window 11 frame | 153, 31, 166, 40 | `body/left-side/window-11/frame` | 56.667, 62.000, 4.815, 18.000 | 56.667, 62.000, 4.815, 18.000 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L12 | z_both, left | window 12 frame | 170, 31, 183, 40 | `body/left-side/window-12/frame` | 62.963, 62.000, 4.815, 18.000 | 62.963, 62.000, 4.815, 18.000 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L13 | z_both, left | window 13 frame | 23, 21, 36, 30 | `body/left-side/window-13/frame` | 8.519, 42.000, 4.815, 18.000 | 8.519, 42.000, 4.815, 18.000 | -0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L14 | z_both, left | window 14 frame | 233, 21, 246, 30 | `body/left-side/window-14/frame` | 86.296, 42.000, 4.815, 18.000 | 86.296, 42.000, 4.815, 18.000 | -0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L15 | z_both, left | window 15 frame | 251, 21, 259, 30 | `body/left-side/window-15/frame` | 92.963, 42.000, 2.963, 18.000 | 92.963, 42.000, 2.963, 18.000 | -0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L16 | z_both, left | door 1 outline | 64, 25, 81, 46 | `body/left-side/door-1/outline` | 23.704, 50.000, 6.296, 42.000 | 23.704, 50.000, 6.296, 42.000 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L17 | z_both, left | door 1 window 1 frame | 66, 26, 71, 36 | `body/left-side/door-1/window-1/frame` | 24.444, 52.000, 1.852, 20.000 | 24.444, 52.000, 1.852, 20.000 | -0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L18 | z_both, left | door 1 window 2 frame | 74, 26, 79, 36 | `body/left-side/door-1/window-2/frame` | 27.407, 52.000, 1.852, 20.000 | 27.407, 52.000, 1.852, 20.000 | 0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L19 | z_both, left | door 2 outline | 187, 25, 204, 46 | `body/left-side/door-2/outline` | 69.259, 50.000, 6.296, 42.000 | 69.259, 50.000, 6.296, 42.000 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L20 | z_both, left | door 2 window 1 frame | 189, 26, 194, 36 | `body/left-side/door-2/window-1/frame` | 70.000, 52.000, 1.852, 20.000 | 70.000, 52.000, 1.852, 20.000 | 0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L21 | z_both, left | door 2 window 2 frame | 197, 26, 202, 36 | `body/left-side/door-2/window-2/frame` | 72.963, 52.000, 1.852, 20.000 | 72.963, 52.000, 1.852, 20.000 | 0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L22 | z_both, left | hatch outline | 24, 32, 35, 39 | `body/left-side/door-3/outline` | 8.889, 64.000, 4.074, 14.000 | 8.889, 64.000, 4.074, 14.000 | 0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| B01 | x_both, rear | gangway frame | 7, 17, 23, 37 | `rear-end/gangway` | 23.333, 34.000, 53.333, 40.000 | 23.333, 34.000, 53.333, 40.000 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| B02 | x_both, rear | end door outline | 9, 19, 21, 37 | `rear-end/end-door/outline` | 30.000, 38.000, 40.000, 36.000 | 30.000, 38.000, 40.000, 36.000 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Door between the gangway posts; the raster shows the frame, not the leaf edge. |
| B03 | x_both, rear | end door window 1 | 10, 20, 13, 29 | `rear-end/end-door/window-1/frame` | 33.333, 40.000, 10.000, 18.000 | 33.333, 40.000, 10.000, 18.000 | 0.000, 0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| B04 | x_both, rear | end door window 2 | 17, 20, 20, 29 | `rear-end/end-door/window-2/frame` | 56.667, 40.000, 10.000, 18.000 | 56.667, 40.000, 10.000, 18.000 | 0.000, 0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| B05 | x_both, rear | lamp 1 | 3, 32, 6, 35 | `rear-end/lamps/lamp-1` | 10.000, 64.000, 10.000, 6.000 | 10.000, 64.000, 10.000, 6.000 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | One-to-three-pixel lamp patch; a round lens of the stated size is kept. |
| B06 | x_both, rear | lamp 2 | 24, 32, 27, 35 | `rear-end/lamps/lamp-2` | 80.000, 64.000, 10.000, 6.000 | 80.000, 64.000, 10.000, 6.000 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | One-to-three-pixel lamp patch; a round lens of the stated size is kept. |
| B07 | x_both, rear | buffer head 1 | 2, 38, 8, 41 | `rear-end/buffers/buffer-1/sweep-1` | 6.667, 76.000, 20.000, 6.000 | 13.500, 75.600, 14.667, 8.800 | 6.833, -0.400, -5.333, 2.800 | 3.841 | 3.842 | Standard 1.75 m buffer spacing kept; the coarse raster places the heads wider. |
| B08 | x_both, rear | buffer head 2 | 22, 38, 28, 41 | `rear-end/buffers/buffer-2/sweep-1` | 73.333, 76.000, 20.000, 6.000 | 71.833, 75.600, 14.667, 8.800 | -1.500, -0.400, -5.333, 2.800 | 2.508 | 2.508 | Standard 1.75 m buffer spacing kept; the coarse raster places the heads wider. |
| F01 | x_both, front | gangway frame | 7, 17, 23, 37 | `front-end/gangway` | 23.333, 34.000, 53.333, 40.000 | 23.333, 34.000, 53.333, 40.000 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| F02 | x_both, front | end door outline | 9, 19, 21, 37 | `front-end/end-door/outline` | 30.000, 38.000, 40.000, 36.000 | 30.000, 38.000, 40.000, 36.000 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Door between the gangway posts; the raster shows the frame, not the leaf edge. |
| F03 | x_both, front | end door window 1 | 10, 20, 13, 29 | `front-end/end-door/window-1/frame` | 33.333, 40.000, 10.000, 18.000 | 33.333, 40.000, 10.000, 18.000 | 0.000, 0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| F04 | x_both, front | end door window 2 | 17, 20, 20, 29 | `front-end/end-door/window-2/frame` | 56.667, 40.000, 10.000, 18.000 | 56.667, 40.000, 10.000, 18.000 | 0.000, 0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| F05 | x_both, front | lamp 1 | 3, 32, 6, 35 | `front-end/lamps/lamp-2` | 10.000, 64.000, 10.000, 6.000 | 10.000, 64.000, 10.000, 6.000 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | One-to-three-pixel lamp patch; a round lens of the stated size is kept. |
| F06 | x_both, front | lamp 2 | 24, 32, 27, 35 | `front-end/lamps/lamp-1` | 80.000, 64.000, 10.000, 6.000 | 80.000, 64.000, 10.000, 6.000 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | One-to-three-pixel lamp patch; a round lens of the stated size is kept. |
| F07 | x_both, front | buffer head 1 | 2, 38, 8, 41 | `front-end/buffers/buffer-2/sweep-1` | 6.667, 76.000, 20.000, 6.000 | 13.500, 75.600, 14.667, 8.800 | 6.833, -0.400, -5.333, 2.800 | 3.841 | 3.842 | Standard 1.75 m buffer spacing kept; the coarse raster places the heads wider. |
| F08 | x_both, front | buffer head 2 | 22, 38, 28, 41 | `front-end/buffers/buffer-1/sweep-1` | 73.333, 76.000, 20.000, 6.000 | 71.833, 75.600, 14.667, 8.800 | -1.500, -0.400, -5.333, 2.800 | 2.508 | 2.508 | Standard 1.75 m buffer spacing kept; the coarse raster places the heads wider. |
