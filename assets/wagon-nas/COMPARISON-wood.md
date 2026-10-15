# Nas + Wood native reference comparison

**Covers** - native pixel annotations, baseline and final orthographic errors.
**Code** - `generator/wagons.ts`, `generator/wagonParts.ts`, `generator/wagonTransfers.ts`, `generator/csdCoachComparison.ts`, `generator/csdCoachReport.ts`.
**See also** - [source notes](SOURCES.md), [Freight wagons](../../docs/models/wagons.md).

Model geometry revision (SHA-256 of comparison GLB): `5b753c8ded6433fc2b2062614f0f0b178dcf6579f02e90c2523cf1d962e4b738`.

Regenerate with `pnpm exec tsx generator/csdCoachReport.ts n_nas-full_1`. The baseline is the first authored geometry (`native/n_nas-full_1/baseline.json`); baseline and final use the same annotations. Built with `cargo=wood` of `veh-nas-flat-wagon`.

Canvases: sides 21 x 3 m (210 x 30 px), ends 3 x 3 m (30 x 30 px), including empty space, 0.1 m a pixel. Origin top left; x right, y down. Side u = 10 * source x = 10 * (Factory X + 10.45); both sides keep increasing source x, so the left (-Z) elevation is mirrored relative to an outside observer, as its BMP is. Ends are seen from outside: rear u = 10 * (z + 1.5), front u = 10 * (1.5 - z). v = 10 * (3 - y).

Each vector is (left, top, width, height). Percentages are 100*x/W, 100*y/H, 100*w/W, 100*h/H of the native canvas. Signed delta = model minus source in percentage points. MAE = sum(abs(delta)) / (4 * number of boxes). Model boxes are the bounds of actual GLB vertices of the named scopes, occluded vertices included. Only the original BMPs define the measurements, never the 4x textures.

| View | Boxes | Baseline MAE (pp) | Final MAE (pp) |
|---|---:|---:|---:|
| z_both, right | 10 | 0.274 | 0.274 |
| z_both, left | 8 | 0.054 | 0.054 |
| x_both, rear | 1 | 0.000 | 0.000 |
| x_both, front | 1 | 0.000 | 0.000 |
| All | 20 | 0.158 | 0.158 |

One pixel is 0.476 pp horizontally on the sides, 3.333 pp horizontally on the ends and 3.333 pp vertically. The model was authored from these same measured boxes, so the residuals measure the transfer onto the XML clip shapes (0.1 m posts the BMPs paint up to 0.2 m wide, polygonal hoppers and tank, loads bounded by their XML hulls) and the deliberate mechanical choices (1.75 m buffer spacing, 920 mm wheels), not photographic accuracy.

Annotated views (generated locally, not committed):

- z_both, right: [native](../../export/review/n_nas-full_1/z_both-right-native.svg), [model](../../export/review/n_nas-full_1/z_both-right-model.svg)
- z_both, left: [native](../../export/review/n_nas-full_1/z_both-left-native.svg), [model](../../export/review/n_nas-full_1/z_both-left-model.svg)
- x_both, rear: [native](../../export/review/n_nas-full_1/x_both-rear-native.svg), [model](../../export/review/n_nas-full_1/x_both-rear-model.svg)
- x_both, front: [native](../../export/review/n_nas-full_1/x_both-front-native.svg), [model](../../export/review/n_nas-full_1/x_both-front-model.svg)
- [Three-quarter view](../../export/review/n_nas-full_1/three-quarter.png), [thumbnail](../../export/thumbs/veh-nas-flat-wagon.png)

| ID | View | Element | Native pixel edges | Mesh scope(s) | Source % (x,y,w,h) | Model % | Signed delta (pp) | Baseline abs. mean (pp) | Final abs. mean (pp) | Uncertainty |
|---|---|---|---|---|---|---|---|---:|---:|---|
| R01 | z_both, right | drop side | 6, 13, 203, 18 | `body/right-side/drop-side` | 2.857, 43.333, 93.810, 16.667 | 2.857, 43.333, 93.810, 16.667 | -0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Row 12 paints a light edge above the XML 1.7 m drop side; the geometry stops at row 13. |
| R02 | z_both, right | solebar | 6, 18, 203, 22 | `body/right-side/solebar` | 2.857, 60.000, 93.810, 13.333 | 2.857, 60.000, 93.810, 13.333 | -0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Solebar band rows 18..21; the fishbelly is listed apart. |
| R03 | z_both, right | stake at 2.7 m | 27, 1, 28, 23 | `body/right-side/stakes/stake-1` | 12.857, 3.333, 0.476, 73.333 | 12.714, 3.333, 0.762, 73.333 | -0.143, -0.000, 0.286, 0.000 | 0.107 | 0.107 | Native pixel edge estimate; +/- one pixel. |
| R04 | z_both, right | stake at 7.1 m | 71, 1, 72, 23 | `body/right-side/stakes/stake-3` | 33.810, 3.333, 0.476, 73.333 | 33.667, 3.333, 0.762, 73.333 | -0.143, -0.000, 0.286, 0.000 | 0.107 | 0.107 | Native pixel edge estimate; +/- one pixel. |
| R05 | z_both, right | stake at 11.5 m | 115, 1, 116, 23 | `body/right-side/stakes/stake-5` | 54.762, 3.333, 0.476, 73.333 | 54.619, 3.333, 0.762, 73.333 | -0.143, -0.000, 0.286, 0.000 | 0.107 | 0.107 | Native pixel edge estimate; +/- one pixel. |
| R06 | z_both, right | stake at 18.1 m | 181, 1, 182, 23 | `body/right-side/stakes/stake-8` | 86.190, 3.333, 0.476, 73.333 | 86.048, 3.333, 0.762, 73.333 | -0.143, -0.000, 0.286, 0.000 | 0.107 | 0.107 | Native pixel edge estimate; +/- one pixel. |
| R07 | z_both, right | rear end post | 5, 3, 6, 22 | `body/rear-end-wall/right-post` | 2.381, 10.000, 0.476, 63.333 | 2.381, 10.000, 0.476, 63.333 | 0.000, -0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R08 | z_both, right | front end post | 203, 3, 204, 22 | `body/front-end-wall/right-post` | 96.667, 10.000, 0.476, 63.333 | 96.667, 10.000, 0.476, 63.333 | 0.000, -0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L01 | z_both, left | drop side | 6, 13, 203, 18 | `body/left-side/drop-side` | 2.857, 43.333, 93.810, 16.667 | 2.857, 43.333, 93.810, 16.667 | -0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Row 12 paints a light edge above the XML 1.7 m drop side; the geometry stops at row 13. |
| L02 | z_both, left | solebar | 6, 18, 203, 22 | `body/left-side/solebar` | 2.857, 60.000, 93.810, 13.333 | 2.857, 60.000, 93.810, 13.333 | -0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Solebar band rows 18..21; the fishbelly is listed apart. |
| L03 | z_both, left | stake at 2.7 m | 27, 1, 28, 23 | `body/left-side/stakes/stake-1` | 12.857, 3.333, 0.476, 73.333 | 12.714, 3.333, 0.762, 73.333 | -0.143, -0.000, 0.286, 0.000 | 0.107 | 0.107 | Native pixel edge estimate; +/- one pixel. |
| L04 | z_both, left | stake at 7.1 m | 71, 1, 72, 23 | `body/left-side/stakes/stake-3` | 33.810, 3.333, 0.476, 73.333 | 33.667, 3.333, 0.762, 73.333 | -0.143, -0.000, 0.286, 0.000 | 0.107 | 0.107 | Native pixel edge estimate; +/- one pixel. |
| L05 | z_both, left | stake at 11.5 m | 115, 1, 116, 23 | `body/left-side/stakes/stake-5` | 54.762, 3.333, 0.476, 73.333 | 54.619, 3.333, 0.762, 73.333 | -0.143, -0.000, 0.286, 0.000 | 0.107 | 0.107 | Native pixel edge estimate; +/- one pixel. |
| L06 | z_both, left | stake at 18.1 m | 181, 1, 182, 23 | `body/left-side/stakes/stake-8` | 86.190, 3.333, 0.476, 73.333 | 86.048, 3.333, 0.762, 73.333 | -0.143, -0.000, 0.286, 0.000 | 0.107 | 0.107 | Native pixel edge estimate; +/- one pixel. |
| L07 | z_both, left | rear end post | 5, 3, 6, 22 | `body/rear-end-wall/left-post` | 2.381, 10.000, 0.476, 63.333 | 2.381, 10.000, 0.476, 63.333 | 0.000, -0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L08 | z_both, left | front end post | 203, 3, 204, 22 | `body/front-end-wall/left-post` | 96.667, 10.000, 0.476, 63.333 | 96.667, 10.000, 0.476, 63.333 | 0.000, -0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| U01 | z_both, right | fishbelly and solebar | 6, 18, 203, 26 | `body/right-side/solebar`, `body/right-side/fishbelly` | 2.857, 60.000, 93.810, 26.667 | 2.857, 60.000, 93.810, 26.667 | -0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | The fishbelly bottom (row 25) read against the bogie pixels; XML alongz base 4.8..16.4 m down to 0.4 m. |
| B01 | x_both, rear | end wall | 1, 10, 29, 18 | `body/rear-end-wall/wall` | 3.333, 33.333, 93.333, 26.667 | 3.333, 33.333, 93.333, 26.667 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | The end wall 1.2..2.0 m between the corner columns 0 and 29. |
| F01 | x_both, front | end wall | 1, 10, 29, 18 | `body/front-end-wall/wall` | 3.333, 33.333, 93.333, 26.667 | 3.333, 33.333, 93.333, 26.667 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | The end wall 1.2..2.0 m between the corner columns 0 and 29. |
| C01 | z_both, right | log pile | 28, -1, 182, 18 | `cargo` | 13.333, -3.333, 73.333, 63.333 | 13.362, 0.987, 73.276, 58.505 | 0.029, 4.321, -0.057, -4.828 | 2.309 | 2.309 | From the XML inline placements (the cargo is painted by its own bitmaps, not the z_both canvas). Seven 0.4 m logs fit between the stakes, so the pile tops out 0.11 m under the XML 3.1 m. |
