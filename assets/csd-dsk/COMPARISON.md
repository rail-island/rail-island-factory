# CSD Dsk native reference comparison

**Covers** - native pixel annotations, baseline and final orthographic errors.
**Code** - `generator/csdCoaches.ts`, `generator/csdCoachComparison.ts`, `generator/csdCoachReport.ts`.
**See also** - [source notes](SOURCES.md), [CSD coaches](../../docs/models/csd-coaches.md).

Model geometry revision (SHA-256 of comparison GLB): `a8ff927f73aa76ea5765863930042d1bc771010baec0692337c1b9b2e9e80dc8`.

Regenerate with `pnpm exec tsx generator/csdCoachReport.ts csd_dsk`. The baseline is the first authored geometry (`native/baseline.json`); baseline and final use the same annotations.

Canvases: sides 11 x 4 m (110 x 40 px), ends 3 x 4 m (30 x 40 px), including empty space, 0.1 m a pixel. Origin top left; x right, y down. Side u = 10 * source x = 10 * (Factory X + 5.25); both sides keep increasing source x, so the left (-Z) elevation is mirrored relative to an outside observer, as its BMP is. Ends are seen from outside: rear u = 10 * (z + 1.5), front u = 10 * (1.5 - z). v = 10 * (4 - y).

Each vector is (left, top, width, height). Percentages are 100*x/W, 100*y/H, 100*w/W, 100*h/H of the native canvas. Signed delta = model minus source in percentage points. MAE = sum(abs(delta)) / (4 * number of boxes). Model boxes are the bounds of actual GLB vertices of the named scopes, occluded vertices included. Only the original BMPs define the measurements, never the 4x textures.

| View | Boxes | Baseline MAE (pp) | Final MAE (pp) |
|---|---:|---:|---:|
| z_both, right | 7 | 0.080 | 0.013 |
| z_both, left | 7 | 0.080 | 0.013 |
| x_inc, front | 4 | 1.078 | 1.078 |
| x_dec, rear | 4 | 1.094 | 1.094 |
| All | 22 | 0.446 | 0.403 |

One pixel is 0.909 pp horizontally on the sides, 3.333 pp horizontally on the ends and 2.500 pp vertically. The model was authored from these same measured boxes, so the residuals measure the transfer onto the XML body (tapered and rounded ends, sloped faces, 5 mm edge clearances) and the deliberate mechanical choices (1.75 m buffer spacing, round lamp lenses), not photographic accuracy.

Annotated views (generated locally, not committed):

- z_both, right: [native](../../export/review/csd_dsk/z_both-right-native.svg), [model](../../export/review/csd_dsk/z_both-right-model.svg)
- z_both, left: [native](../../export/review/csd_dsk/z_both-left-native.svg), [model](../../export/review/csd_dsk/z_both-left-model.svg)
- x_inc, front: [native](../../export/review/csd_dsk/x_inc-front-native.svg), [model](../../export/review/csd_dsk/x_inc-front-model.svg)
- x_dec, rear: [native](../../export/review/csd_dsk/x_dec-rear-native.svg), [model](../../export/review/csd_dsk/x_dec-rear-model.svg)
- [Three-quarter view](../../export/review/csd_dsk/three-quarter.png), [thumbnail](../../export/thumbs/veh-csd-dsk.png)

| ID | View | Element | Native pixel edges | Mesh scope(s) | Source % (x,y,w,h) | Model % | Signed delta (pp) | Baseline abs. mean (pp) | Final abs. mean (pp) | Uncertainty |
|---|---|---|---|---|---|---|---|---:|---:|---|
| R01 | z_both, right | window 1 frame | 8, 10, 15, 20 | `body/right-side/window-1/frame` | 7.273, 25.000, 6.364, 25.000 | 7.273, 25.000, 6.364, 25.000 | 0.000, 0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R02 | z_both, right | window 2 frame | 29, 10, 36, 20 | `body/right-side/window-2/frame` | 26.364, 25.000, 6.364, 25.000 | 26.364, 25.000, 6.364, 25.000 | 0.000, 0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R03 | z_both, right | window 3 frame | 60, 10, 67, 20 | `body/right-side/window-3/frame` | 54.545, 25.000, 6.364, 25.000 | 54.545, 25.000, 6.364, 25.000 | 0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R04 | z_both, right | sliding door | 39, 8, 57, 28 | `body/right-side/sliding-door/outline` | 35.455, 20.000, 16.364, 50.000 | 35.455, 20.000, 16.364, 50.000 | -0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R05 | z_both, right | door post 1 | 37, 8, 39, 28 | `body/right-side/framing/slab-3` | 33.636, 20.000, 1.818, 50.000 | 33.636, 20.000, 1.818, 50.000 | 0.000, -0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R06 | z_both, right | door post 2 | 57, 8, 59, 28 | `body/right-side/framing/slab-4` | 51.818, 20.000, 1.818, 50.000 | 51.818, 20.000, 1.818, 50.000 | -0.000, -0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L01 | z_both, left | window 1 frame | 8, 10, 15, 20 | `body/left-side/window-1/frame` | 7.273, 25.000, 6.364, 25.000 | 7.273, 25.000, 6.364, 25.000 | 0.000, 0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L02 | z_both, left | window 2 frame | 29, 10, 36, 20 | `body/left-side/window-2/frame` | 26.364, 25.000, 6.364, 25.000 | 26.364, 25.000, 6.364, 25.000 | 0.000, 0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L03 | z_both, left | window 3 frame | 60, 10, 67, 20 | `body/left-side/window-3/frame` | 54.545, 25.000, 6.364, 25.000 | 54.545, 25.000, 6.364, 25.000 | 0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L04 | z_both, left | sliding door | 39, 8, 57, 28 | `body/left-side/sliding-door/outline` | 35.455, 20.000, 16.364, 50.000 | 35.455, 20.000, 16.364, 50.000 | -0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L05 | z_both, left | door post 1 | 37, 8, 39, 28 | `body/left-side/framing/slab-3` | 33.636, 20.000, 1.818, 50.000 | 33.636, 20.000, 1.818, 50.000 | 0.000, -0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L06 | z_both, left | door post 2 | 57, 8, 59, 28 | `body/left-side/framing/slab-4` | 51.818, 20.000, 1.818, 50.000 | 51.818, 20.000, 1.818, 50.000 | -0.000, -0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R07 | z_both, right | ducket glass | 83, 12, 87, 19 | `body/duckets/right-side/window/slab-2` | 75.455, 30.000, 3.636, 17.500 | 75.636, 30.000, 3.455, 17.500 | 0.182, 0.000, -0.182, 0.000 | 0.563 | 0.091 | Ducket face glass; the oblique ducket sides are not modelled as glass. |
| L07 | z_both, left | ducket glass | 83, 12, 87, 19 | `body/duckets/left-side/window/slab-2` | 75.455, 30.000, 3.636, 17.500 | 75.636, 30.000, 3.455, 17.500 | 0.182, 0.000, -0.182, 0.000 | 0.563 | 0.091 | Ducket face glass; the oblique ducket sides are not modelled as glass. |
| F01 | x_inc, front | end door outline | 11, 7, 19, 28 | `front-end/end-door/outline` | 36.667, 17.500, 26.667, 52.500 | 36.667, 17.625, 26.667, 52.375 | -0.000, 0.125, 0.000, -0.125 | 0.063 | 0.062 | Native pixel edge estimate; +/- one pixel. |
| F02 | x_inc, front | end door window | 12, 8, 18, 17 | `front-end/end-door/window/frame` | 40.000, 20.000, 20.000, 22.500 | 40.000, 20.000, 20.000, 22.500 | -0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| F03 | x_inc, front | buffer head 1 | 3, 28, 8, 31 | `front-end/buffers/buffer-2/sweep-1` | 10.000, 70.000, 16.667, 7.500 | 13.500, 69.500, 14.667, 11.000 | 3.500, -0.500, -2.000, 3.500 | 2.375 | 2.375 | Standard 1.75 m buffer spacing kept; the coarse raster places the heads wider. |
| F04 | x_inc, front | buffer head 2 | 22, 28, 27, 31 | `front-end/buffers/buffer-1/sweep-1` | 73.333, 70.000, 16.667, 7.500 | 71.833, 69.500, 14.667, 11.000 | -1.500, -0.500, -2.000, 3.500 | 1.875 | 1.875 | Standard 1.75 m buffer spacing kept; the coarse raster places the heads wider. |
| B01 | x_dec, rear | end post 1 | 9, 7, 10, 28 | `rear-end/end-framing/slab-1` | 30.000, 17.500, 3.333, 52.500 | 30.000, 17.625, 3.333, 52.375 | -0.000, 0.125, 0.000, -0.125 | 0.063 | 0.062 | Native pixel edge estimate; +/- one pixel. Columns 0 and 29 lie outside the 2.8 m body and are not annotated. |
| B02 | x_dec, rear | end post 2 | 20, 7, 21, 28 | `rear-end/end-framing/slab-2` | 66.667, 17.500, 3.333, 52.500 | 66.667, 17.625, 3.333, 52.375 | 0.000, 0.125, 0.000, -0.125 | 0.063 | 0.062 | Native pixel edge estimate; +/- one pixel. |
| B03 | x_dec, rear | buffer head 1 | 3, 28, 8, 31 | `rear-end/buffers/buffer-1/sweep-1` | 10.000, 70.000, 16.667, 7.500 | 13.500, 69.500, 14.667, 11.000 | 3.500, -0.500, -2.000, 3.500 | 2.375 | 2.375 | Standard 1.75 m buffer spacing kept; the coarse raster places the heads wider. |
| B04 | x_dec, rear | buffer head 2 | 22, 28, 27, 31 | `rear-end/buffers/buffer-2/sweep-1` | 73.333, 70.000, 16.667, 7.500 | 71.833, 69.500, 14.667, 11.000 | -1.500, -0.500, -2.000, 3.500 | 1.875 | 1.875 | Standard 1.75 m buffer spacing kept; the coarse raster places the heads wider. |
