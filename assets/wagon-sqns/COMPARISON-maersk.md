# Sqns + Maersk native reference comparison

**Covers** - native pixel annotations, baseline and final orthographic errors.
**Code** - `generator/freightWagons.ts`, `generator/hopperWagons.ts`, `generator/freightWagonParts.ts`, `generator/freightTransfers.ts`, `generator/csdCoachComparison.ts`, `generator/csdCoachReport.ts`.
**See also** - [source notes](SOURCES.md), [Freight wagons (container, flat, sliding-wall, hopper)](../../docs/models/freight-wagons.md).

Model geometry revision (SHA-256 of comparison GLB): `d49605fc2404cf622207359785916397ab3a1ddbf622fdf06bbaa6ad1254ba87`.

Regenerate with `pnpm exec tsx generator/csdCoachReport.ts n_sqns-full_1`. The baseline is the first authored geometry (`native/n_sqns-full_1/baseline.json`); baseline and final use the same annotations. Built with `cargo=maersk` of `veh-sqns-container-wagon`.

Canvases: sides 20 x 4 m (200 x 40 px), ends 3 x 4 m (30 x 40 px), including empty space, 0.1 m a pixel. Origin top left; x right, y down. Side u = 10 * source x = 10 * (Factory X + 9.9); both sides keep increasing source x, so the left (-Z) elevation is mirrored relative to an outside observer, as its BMP is. Ends are seen from outside: rear u = 10 * (z + 1.5), front u = 10 * (1.5 - z). v = 10 * (4 - y).

Each vector is (left, top, width, height). Percentages are 100*x/W, 100*y/H, 100*w/W, 100*h/H of the native canvas. Signed delta = model minus source in percentage points. MAE = sum(abs(delta)) / (4 * number of boxes). Model boxes are the bounds of actual GLB vertices of the named scopes, occluded vertices included. Only the original BMPs define the measurements, never the 4x textures.

| View | Boxes | Baseline MAE (pp) | Final MAE (pp) |
|---|---:|---:|---:|
| z_dec, right | 6 | 0.503 | 0.503 |
| z_inc, left | 6 | 0.499 | 0.499 |
| x_both, rear | 1 | 2.475 | 2.475 |
| All | 13 | 0.653 | 0.653 |

One pixel is 0.500 pp horizontally on the sides, 3.333 pp horizontally on the ends and 2.500 pp vertically. The model was authored from these same measured boxes, so the residuals measure the transfer onto the XML clip shapes (0.1 m posts the BMPs paint wider, loads bounded by their XML hulls) and the deliberate mechanical choices (1.75 m buffer spacing, 920 mm wheels, the ISO 40 ft container, the 3.1 m width), not photographic accuracy.

Annotated views (generated locally, not committed):

- z_dec, right: [native](../../export/review/n_sqns-full_1/z_dec-right-native.svg), [model](../../export/review/n_sqns-full_1/z_dec-right-model.svg)
- z_inc, left: [native](../../export/review/n_sqns-full_1/z_inc-left-native.svg), [model](../../export/review/n_sqns-full_1/z_inc-left-model.svg)
- x_both, rear: [native](../../export/review/n_sqns-full_1/x_both-rear-native.svg), [model](../../export/review/n_sqns-full_1/x_both-rear-model.svg)
- [Three-quarter view](../../export/review/n_sqns-full_1/three-quarter.png), [thumbnail](../../export/thumbs/veh-sqns-container-wagon.png)

| ID | View | Element | Native pixel edges | Mesh scope(s) | Source % (x,y,w,h) | Model % | Signed delta (pp) | Baseline abs. mean (pp) | Final abs. mean (pp) | Uncertainty |
|---|---|---|---|---|---|---|---|---:|---:|---|
| R01 | z_dec, right | side beam with end beams | 5, 28, 193, 31 | `frame/right-side/side-beam`, `frame/right-side/flange`, `rear-end/buffer-beam`, `front-end/buffer-beam` | 2.500, 70.000, 94.000, 7.500 | 2.500, 70.000, 94.000, 8.750 | 0.000, -0.000, -0.000, 1.250 | 0.313 | 0.313 | Rows 28..30 from column 5 to 192 (0.5..19.3 m), the end beams included; the model end beams reach 0.85 m. |
| R02 | z_dec, right | container pin 1 | 5, 27, 7, 28 | `frame/right-side/pins/pin-1` | 2.500, 67.500, 1.000, 2.500 | 2.500, 67.500, 1.000, 2.500 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R03 | z_dec, right | container pin 7 | 191, 27, 193, 28 | `frame/right-side/pins/pin-7` | 95.500, 67.500, 1.000, 2.500 | 95.500, 67.500, 1.000, 2.500 | -0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R04 | z_dec, right | container | 39, 2, 158, 27 | `cargo/box`, `cargo/frame`, `cargo/corner-castings` | 19.500, 5.000, 59.500, 62.500 | 18.870, 2.475, 61.260, 65.275 | -0.630, -2.525, 1.760, 2.775 | 1.923 | 1.923 | The model carries an ISO 40 ft box (12.19 x 2.44 x 2.59 m) on the pins at 1.3 m; the BMP paints 11.9 x 2.5 m from 1.3 m. |
| R05 | z_dec, right | Maersk star square | 47, 6, 62, 21 | `cargo/right-side-livery/star-square` | 23.500, 15.000, 7.500, 37.500 | 23.625, 15.625, 7.250, 36.250 | 0.125, 0.625, -0.250, -1.250 | 0.562 | 0.562 | The light blue square with the white seven-pointed star. |
| R06 | z_dec, right | MAERSK lettering | 70, 8, 143, 20 | `cargo/right-side-livery/lettering` | 35.000, 20.000, 36.500, 30.000 | 34.889, 20.068, 36.585, 30.614 | -0.111, 0.068, 0.085, 0.614 | 0.219 | 0.219 | Bold black capitals 1.2 m tall; the stroke font is thinner than the painted letters. |
| L01 | z_inc, left | side beam with end beams | 5, 28, 193, 31 | `frame/left-side/side-beam`, `frame/left-side/flange`, `rear-end/buffer-beam`, `front-end/buffer-beam` | 2.500, 70.000, 94.000, 7.500 | 2.500, 70.000, 94.000, 8.750 | 0.000, -0.000, -0.000, 1.250 | 0.313 | 0.313 | Rows 28..30 from column 5 to 192 (0.5..19.3 m), the end beams included; the model end beams reach 0.85 m. |
| L02 | z_inc, left | container pin 1 | 5, 27, 7, 28 | `frame/left-side/pins/pin-1` | 2.500, 67.500, 1.000, 2.500 | 2.500, 67.500, 1.000, 2.500 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L03 | z_inc, left | container pin 7 | 191, 27, 193, 28 | `frame/left-side/pins/pin-7` | 95.500, 67.500, 1.000, 2.500 | 95.500, 67.500, 1.000, 2.500 | -0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L04 | z_inc, left | container | 39, 2, 158, 27 | `cargo/box`, `cargo/frame`, `cargo/corner-castings` | 19.500, 5.000, 59.500, 62.500 | 18.870, 2.475, 61.260, 65.275 | -0.630, -2.525, 1.760, 2.775 | 1.923 | 1.923 | The model carries an ISO 40 ft box (12.19 x 2.44 x 2.59 m) on the pins at 1.3 m; the BMP paints 11.9 x 2.5 m from 1.3 m. |
| L05 | z_inc, left | Maersk star square | 135, 6, 150, 21 | `cargo/left-side-livery/star-square` | 67.500, 15.000, 7.500, 37.500 | 67.625, 15.625, 7.250, 36.250 | 0.125, 0.625, -0.250, -1.250 | 0.562 | 0.562 | The light blue square with the white seven-pointed star. |
| L06 | z_inc, left | MAERSK lettering | 54, 8, 127, 20 | `cargo/left-side-livery/lettering` | 27.000, 20.000, 36.500, 30.000 | 27.026, 20.068, 36.585, 30.614 | 0.026, 0.068, 0.085, 0.614 | 0.198 | 0.198 | Bold black capitals 1.2 m tall; the stroke font is thinner than the painted letters. |
| E01 | x_both, rear | container end | 2, 2, 28, 27 | `cargo/box`, `cargo/frame`, `cargo/corner-castings` | 6.667, 5.000, 86.667, 62.500 | 8.200, 2.475, 83.600, 65.275 | 1.533, -2.525, -3.067, 2.775 | 2.475 | 2.475 | The model carries an ISO 40 ft box (12.19 x 2.44 x 2.59 m) on the pins at 1.3 m; the BMP paints 11.9 x 2.5 m from 1.3 m. |
