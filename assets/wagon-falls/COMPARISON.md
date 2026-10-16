# N_Falls native reference comparison

**Covers** - native pixel annotations, baseline and final orthographic errors.
**Code** - `generator/freightWagons.ts`, `generator/hopperWagons.ts`, `generator/freightWagonParts.ts`, `generator/freightTransfers.ts`, `generator/csdCoachComparison.ts`, `generator/csdCoachReport.ts`.
**See also** - [source notes](SOURCES.md), [Freight wagons (container, flat, sliding-wall, hopper)](../../docs/models/freight-wagons.md).

Model geometry revision (SHA-256 of comparison GLB): `0f7fe16f82eb0d1be85ed66603cbab73cadf51a63679c51f902b74a9af388f1b`.

Regenerate with `pnpm exec tsx generator/csdCoachReport.ts n_falls`. The baseline is the first authored geometry (`native/n_falls/baseline.json`); baseline and final use the same annotations. Built with `livery=cd` of `veh-falls-hopper-wagon`.

Canvases: sides 13.5 x 6 m (135 x 60 px), ends 3 x 6 m (30 x 60 px), including empty space, 0.1 m a pixel. Origin top left; x right, y down. Side u = 10 * source x = 10 * (Factory X + 6.75); both sides keep increasing source x, so the left (-Z) elevation is mirrored relative to an outside observer, as its BMP is. Ends are seen from outside: rear u = 10 * (z + 1.5), front u = 10 * (1.5 - z). v = 10 * (6 - y).

Each vector is (left, top, width, height). Percentages are 100*x/W, 100*y/H, 100*w/W, 100*h/H of the native canvas. Signed delta = model minus source in percentage points. MAE = sum(abs(delta)) / (4 * number of boxes). Model boxes are the bounds of actual GLB vertices of the named scopes, occluded vertices included. Only the original BMPs define the measurements, never the 4x textures.

| View | Boxes | Baseline MAE (pp) | Final MAE (pp) |
|---|---:|---:|---:|
| z_dec, right | 4 | 0.021 | 0.021 |
| z_inc, left | 4 | 0.021 | 0.021 |
| x_dec, rear | 1 | 0.000 | 0.000 |
| x_inc, front | 1 | 0.000 | 0.000 |
| All | 10 | 0.017 | 0.017 |

One pixel is 0.741 pp horizontally on the sides, 3.333 pp horizontally on the ends and 1.667 pp vertically. The model was authored from these same measured boxes, so the residuals measure the transfer onto the XML clip shapes (0.1 m posts the BMPs paint wider, loads bounded by their XML hulls) and the deliberate mechanical choices (1.75 m buffer spacing, 920 mm wheels, the ISO 40 ft container, the 3.1 m width), not photographic accuracy.

Annotated views (generated locally, not committed):

- z_dec, right: [native](../../export/review/n_falls/z_dec-right-native.svg), [model](../../export/review/n_falls/z_dec-right-model.svg)
- z_inc, left: [native](../../export/review/n_falls/z_inc-left-native.svg), [model](../../export/review/n_falls/z_inc-left-model.svg)
- x_dec, rear: [native](../../export/review/n_falls/x_dec-rear-native.svg), [model](../../export/review/n_falls/x_dec-rear-model.svg)
- x_inc, front: [native](../../export/review/n_falls/x_inc-front-native.svg), [model](../../export/review/n_falls/x_inc-front-model.svg)
- [Three-quarter view](../../export/review/n_falls/three-quarter.png), [thumbnail](../../export/thumbs/veh-falls-hopper-wagon.png)

| ID | View | Element | Native pixel edges | Mesh scope(s) | Source % (x,y,w,h) | Model % | Signed delta (pp) | Baseline abs. mean (pp) | Final abs. mean (pp) | Uncertainty |
|---|---|---|---|---|---|---|---|---:|---:|---|
| R01 | z_dec, right | upper bulge | 1, 17, 129, 30 | `body/upper` | 0.741, 28.333, 94.815, 21.667 | 0.741, 28.333, 94.815, 21.667 | -0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R02 | z_dec, right | lower body, first half | 4, 31, 61, 51 | `body/lower/half-1` | 2.963, 51.667, 42.222, 33.333 | 2.963, 51.667, 42.222, 33.333 | 0.000, -0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R03 | z_dec, right | lower body, second half | 69, 31, 126, 51 | `body/lower/half-2` | 51.111, 51.667, 42.222, 33.333 | 51.111, 51.667, 42.222, 33.333 | 0.000, -0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R04 | z_dec, right | centre post | 61, 30, 69, 51 | `body/lower/centre-post` | 45.185, 50.000, 5.926, 35.000 | 45.185, 50.000, 5.926, 34.667 | 0.000, 0.000, -0.000, -0.333 | 0.083 | 0.083 | From the XML gap between the lower halves (6.1..6.9 m). |
| L01 | z_inc, left | upper bulge | 1, 17, 129, 30 | `body/upper` | 0.741, 28.333, 94.815, 21.667 | 0.741, 28.333, 94.815, 21.667 | -0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L02 | z_inc, left | lower body, first half | 4, 31, 61, 51 | `body/lower/half-1` | 2.963, 51.667, 42.222, 33.333 | 2.963, 51.667, 42.222, 33.333 | 0.000, -0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L03 | z_inc, left | lower body, second half | 69, 31, 126, 51 | `body/lower/half-2` | 51.111, 51.667, 42.222, 33.333 | 51.111, 51.667, 42.222, 33.333 | 0.000, -0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L04 | z_inc, left | centre post | 61, 30, 69, 51 | `body/lower/centre-post` | 45.185, 50.000, 5.926, 35.000 | 45.185, 50.000, 5.926, 34.667 | 0.000, 0.000, -0.000, -0.333 | 0.083 | 0.083 | From the XML gap between the lower halves (6.1..6.9 m). |
| E01 | x_dec, rear | rear end of the body | 0, 17, 30, 51 | `body/lower`, `body/upper` | 0.000, 28.333, 100.000, 56.667 | 0.000, 28.333, 100.000, 56.667 | 0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | x_dec rows 17..51. |
| E02 | x_inc, front | front end of the body | 0, 17, 30, 51 | `body/lower`, `body/upper` | 0.000, 28.333, 100.000, 56.667 | 0.000, 28.333, 100.000, 56.667 | 0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | x_inc rows 17..51; the ladder and railing are in front of it. |
