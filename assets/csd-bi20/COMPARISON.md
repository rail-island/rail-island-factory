# CSD Bi20 native reference comparison

**Covers** - native pixel annotations, baseline and final orthographic errors.
**Code** - `generator/csdCoaches.ts`, `generator/csdCoachComparison.ts`, `generator/csdCoachReport.ts`.
**See also** - [source notes](SOURCES.md), [CSD coaches](../../docs/models/csd-coaches.md).

Model geometry revision (SHA-256 of comparison GLB): `31991d7fd610a31019eb0c612d7530f82ac5d57cf89b7b4cfd0a822c57059f50`.

Regenerate with `pnpm exec tsx generator/csdCoachReport.ts csd-bi20`. The baseline is the first authored geometry (`native/baseline.json`); baseline and final use the same annotations.

Canvases: sides 13 x 4 m (130 x 40 px), ends 3 x 4 m (30 x 40 px), including empty space, 0.1 m a pixel. Origin top left; x right, y down. Side u = 10 * source x = 10 * (Factory X + 6.3); both sides keep increasing source x, so the left (-Z) elevation is mirrored relative to an outside observer, as its BMP is. Ends are seen from outside: rear u = 10 * (z + 1.5), front u = 10 * (1.5 - z). v = 10 * (4 - y).

Each vector is (left, top, width, height). Percentages are 100*x/W, 100*y/H, 100*w/W, 100*h/H of the native canvas. Signed delta = model minus source in percentage points. MAE = sum(abs(delta)) / (4 * number of boxes). Model boxes are the bounds of actual GLB vertices of the named scopes, occluded vertices included. Only the original BMPs define the measurements, never the 4x textures.

| View | Boxes | Baseline MAE (pp) | Final MAE (pp) |
|---|---:|---:|---:|
| z_both, right | 12 | 0.031 | 0.031 |
| z_both, left | 12 | 0.031 | 0.031 |
| x_both, rear | 4 | 0.766 | 0.766 |
| x_both, front | 4 | 0.766 | 0.766 |
| All | 32 | 0.215 | 0.215 |

One pixel is 0.769 pp horizontally on the sides, 3.333 pp horizontally on the ends and 2.500 pp vertically. The model was authored from these same measured boxes, so the residuals measure the transfer onto the XML body (tapered and rounded ends, sloped faces, 5 mm edge clearances) and the deliberate mechanical choices (1.75 m buffer spacing, round lamp lenses), not photographic accuracy.

Annotated views (generated locally, not committed):

- z_both, right: [native](../../export/review/csd-bi20/z_both-right-native.svg), [model](../../export/review/csd-bi20/z_both-right-model.svg)
- z_both, left: [native](../../export/review/csd-bi20/z_both-left-native.svg), [model](../../export/review/csd-bi20/z_both-left-model.svg)
- x_both, rear: [native](../../export/review/csd-bi20/x_both-rear-native.svg), [model](../../export/review/csd-bi20/x_both-rear-model.svg)
- x_both, front: [native](../../export/review/csd-bi20/x_both-front-native.svg), [model](../../export/review/csd-bi20/x_both-front-model.svg)
- [Three-quarter view](../../export/review/csd-bi20/three-quarter.png), [thumbnail](../../export/thumbs/veh-csd-bi20.png)

| ID | View | Element | Native pixel edges | Mesh scope(s) | Source % (x,y,w,h) | Model % | Signed delta (pp) | Baseline abs. mean (pp) | Final abs. mean (pp) | Uncertainty |
|---|---|---|---|---|---|---|---|---:|---:|---|
| R01 | z_both, right | door 1 outline | 16, 7, 25, 28 | `body/right-side/door-1/outline` | 12.308, 17.500, 6.923, 52.500 | 12.308, 17.625, 6.923, 52.375 | 0.000, 0.125, -0.000, -0.125 | 0.063 | 0.062 | Native pixel edge estimate; +/- one pixel. |
| R02 | z_both, right | door 1 window 1 frame | 17, 9, 24, 19 | `body/right-side/door-1/window-1/frame` | 13.077, 22.500, 5.385, 25.000 | 13.077, 22.500, 5.385, 25.000 | 0.000, 0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R03 | z_both, right | door 2 outline | 33, 7, 42, 28 | `body/right-side/door-2/outline` | 25.385, 17.500, 6.923, 52.500 | 25.385, 17.625, 6.923, 52.375 | 0.000, 0.125, 0.000, -0.125 | 0.063 | 0.062 | Native pixel edge estimate; +/- one pixel. |
| R04 | z_both, right | door 2 window 1 frame | 34, 9, 41, 19 | `body/right-side/door-2/window-1/frame` | 26.154, 22.500, 5.385, 25.000 | 26.154, 22.500, 5.385, 25.000 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R05 | z_both, right | door 3 outline | 50, 7, 59, 28 | `body/right-side/door-3/outline` | 38.462, 17.500, 6.923, 52.500 | 38.462, 17.625, 6.923, 52.375 | 0.000, 0.125, -0.000, -0.125 | 0.063 | 0.062 | Native pixel edge estimate; +/- one pixel. |
| R06 | z_both, right | door 3 window 1 frame | 51, 9, 58, 19 | `body/right-side/door-3/window-1/frame` | 39.231, 22.500, 5.385, 25.000 | 39.231, 22.500, 5.385, 25.000 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R07 | z_both, right | door 4 outline | 67, 7, 76, 28 | `body/right-side/door-4/outline` | 51.538, 17.500, 6.923, 52.500 | 51.538, 17.625, 6.923, 52.375 | 0.000, 0.125, -0.000, -0.125 | 0.063 | 0.062 | Native pixel edge estimate; +/- one pixel. |
| R08 | z_both, right | door 4 window 1 frame | 68, 9, 75, 19 | `body/right-side/door-4/window-1/frame` | 52.308, 22.500, 5.385, 25.000 | 52.308, 22.500, 5.385, 25.000 | 0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R09 | z_both, right | door 5 outline | 84, 7, 93, 28 | `body/right-side/door-5/outline` | 64.615, 17.500, 6.923, 52.500 | 64.615, 17.625, 6.923, 52.375 | -0.000, 0.125, 0.000, -0.125 | 0.063 | 0.062 | Native pixel edge estimate; +/- one pixel. |
| R10 | z_both, right | door 5 window 1 frame | 85, 9, 92, 19 | `body/right-side/door-5/window-1/frame` | 65.385, 22.500, 5.385, 25.000 | 65.385, 22.500, 5.385, 25.000 | 0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R11 | z_both, right | door 6 outline | 101, 7, 110, 28 | `body/right-side/door-6/outline` | 77.692, 17.500, 6.923, 52.500 | 77.692, 17.625, 6.923, 52.375 | -0.000, 0.125, -0.000, -0.125 | 0.063 | 0.062 | Native pixel edge estimate; +/- one pixel. |
| R12 | z_both, right | door 6 window 1 frame | 102, 9, 109, 19 | `body/right-side/door-6/window-1/frame` | 78.462, 22.500, 5.385, 25.000 | 78.462, 22.500, 5.385, 25.000 | 0.000, 0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L01 | z_both, left | door 1 outline | 16, 7, 25, 28 | `body/left-side/door-1/outline` | 12.308, 17.500, 6.923, 52.500 | 12.308, 17.625, 6.923, 52.375 | 0.000, 0.125, -0.000, -0.125 | 0.063 | 0.062 | Native pixel edge estimate; +/- one pixel. |
| L02 | z_both, left | door 1 window 1 frame | 17, 9, 24, 19 | `body/left-side/door-1/window-1/frame` | 13.077, 22.500, 5.385, 25.000 | 13.077, 22.500, 5.385, 25.000 | 0.000, 0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L03 | z_both, left | door 2 outline | 33, 7, 42, 28 | `body/left-side/door-2/outline` | 25.385, 17.500, 6.923, 52.500 | 25.385, 17.625, 6.923, 52.375 | 0.000, 0.125, 0.000, -0.125 | 0.063 | 0.062 | Native pixel edge estimate; +/- one pixel. |
| L04 | z_both, left | door 2 window 1 frame | 34, 9, 41, 19 | `body/left-side/door-2/window-1/frame` | 26.154, 22.500, 5.385, 25.000 | 26.154, 22.500, 5.385, 25.000 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L05 | z_both, left | door 3 outline | 50, 7, 59, 28 | `body/left-side/door-3/outline` | 38.462, 17.500, 6.923, 52.500 | 38.462, 17.625, 6.923, 52.375 | 0.000, 0.125, -0.000, -0.125 | 0.063 | 0.062 | Native pixel edge estimate; +/- one pixel. |
| L06 | z_both, left | door 3 window 1 frame | 51, 9, 58, 19 | `body/left-side/door-3/window-1/frame` | 39.231, 22.500, 5.385, 25.000 | 39.231, 22.500, 5.385, 25.000 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L07 | z_both, left | door 4 outline | 67, 7, 76, 28 | `body/left-side/door-4/outline` | 51.538, 17.500, 6.923, 52.500 | 51.538, 17.625, 6.923, 52.375 | 0.000, 0.125, -0.000, -0.125 | 0.063 | 0.062 | Native pixel edge estimate; +/- one pixel. |
| L08 | z_both, left | door 4 window 1 frame | 68, 9, 75, 19 | `body/left-side/door-4/window-1/frame` | 52.308, 22.500, 5.385, 25.000 | 52.308, 22.500, 5.385, 25.000 | 0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L09 | z_both, left | door 5 outline | 84, 7, 93, 28 | `body/left-side/door-5/outline` | 64.615, 17.500, 6.923, 52.500 | 64.615, 17.625, 6.923, 52.375 | -0.000, 0.125, 0.000, -0.125 | 0.063 | 0.062 | Native pixel edge estimate; +/- one pixel. |
| L10 | z_both, left | door 5 window 1 frame | 85, 9, 92, 19 | `body/left-side/door-5/window-1/frame` | 65.385, 22.500, 5.385, 25.000 | 65.385, 22.500, 5.385, 25.000 | 0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L11 | z_both, left | door 6 outline | 101, 7, 110, 28 | `body/left-side/door-6/outline` | 77.692, 17.500, 6.923, 52.500 | 77.692, 17.625, 6.923, 52.375 | -0.000, 0.125, -0.000, -0.125 | 0.063 | 0.062 | Native pixel edge estimate; +/- one pixel. |
| L12 | z_both, left | door 6 window 1 frame | 102, 9, 109, 19 | `body/left-side/door-6/window-1/frame` | 78.462, 22.500, 5.385, 25.000 | 78.462, 22.500, 5.385, 25.000 | 0.000, 0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| B01 | x_both, rear | end door outline | 10, 7, 20, 28 | `rear-end/end-door/outline` | 33.333, 17.500, 33.333, 52.500 | 33.333, 17.625, 33.333, 52.375 | 0.000, 0.125, 0.000, -0.125 | 0.063 | 0.062 | Door frame read between the double outline columns; +/- one pixel. |
| B02 | x_both, rear | end door window | 12, 9, 18, 19 | `rear-end/end-door/window/frame` | 40.000, 22.500, 20.000, 25.000 | 40.000, 22.500, 20.000, 25.000 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| B03 | x_both, rear | buffer head 1 | 3, 28, 8, 32 | `rear-end/buffers/buffer-1/sweep-1` | 10.000, 70.000, 16.667, 10.000 | 13.500, 69.500, 14.667, 11.000 | 3.500, -0.500, -2.000, 1.000 | 1.750 | 1.750 | Standard 1.75 m buffer spacing kept; the coarse raster places the heads wider. The XML has no buffers; the model adds them 0.3 m beyond the platforms. |
| B04 | x_both, rear | buffer head 2 | 22, 28, 27, 32 | `rear-end/buffers/buffer-2/sweep-1` | 73.333, 70.000, 16.667, 10.000 | 71.833, 69.500, 14.667, 11.000 | -1.500, -0.500, -2.000, 1.000 | 1.250 | 1.250 | Standard 1.75 m buffer spacing kept; the coarse raster places the heads wider. The XML has no buffers; the model adds them 0.3 m beyond the platforms. |
| F01 | x_both, front | end door outline | 10, 7, 20, 28 | `front-end/end-door/outline` | 33.333, 17.500, 33.333, 52.500 | 33.333, 17.625, 33.333, 52.375 | 0.000, 0.125, 0.000, -0.125 | 0.063 | 0.062 | Door frame read between the double outline columns; +/- one pixel. |
| F02 | x_both, front | end door window | 12, 9, 18, 19 | `front-end/end-door/window/frame` | 40.000, 22.500, 20.000, 25.000 | 40.000, 22.500, 20.000, 25.000 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| F03 | x_both, front | buffer head 1 | 3, 28, 8, 32 | `front-end/buffers/buffer-2/sweep-1` | 10.000, 70.000, 16.667, 10.000 | 13.500, 69.500, 14.667, 11.000 | 3.500, -0.500, -2.000, 1.000 | 1.750 | 1.750 | Standard 1.75 m buffer spacing kept; the coarse raster places the heads wider. The XML has no buffers; the model adds them 0.3 m beyond the platforms. |
| F04 | x_both, front | buffer head 2 | 22, 28, 27, 32 | `front-end/buffers/buffer-1/sweep-1` | 73.333, 70.000, 16.667, 10.000 | 71.833, 69.500, 14.667, 11.000 | -1.500, -0.500, -2.000, 1.000 | 1.250 | 1.250 | Standard 1.75 m buffer spacing kept; the coarse raster places the heads wider. The XML has no buffers; the model adds them 0.3 m beyond the platforms. |
