# CD 771 235, default livery: native reference comparison

**Covers** - native pixel annotations, baseline and final orthographic errors of `veh-cd-771` (the default build, vlakosimdb `cd_771.235`).
**Code** - `generator/dieselComparison.ts`, `generator/dieselReport.ts`, `native/landmarks.json`.
**See also** - [source notes](SOURCES.md), [photographs](PHOTOS.md), [the models' reference](../../docs/models/diesel-locos.md).

Model geometry revision (SHA-256 of the comparison GLB): `73651409b827446e400085a59ed1fbcb46f7d48e13901cdf84331833f926fdb2`.

Regenerate with `pnpm exec tsx generator/dieselReport.ts`. The baseline is the first authored model (a new model: no earlier factory version existed), stored in `native/baseline.json` with the same annotations.

Canvases: side 180 x 60 px, front 30 x 60 px, 0.1 m a pixel, including empty space; origin top left, X right, Y down. Mapping: source x = 8.8 - Factory x / 0.98 (the short hood toward +X; the drawing is scaled to the published 17.24 m over the buffers); the side canvas is 18 x 6 m, the front 3 x 6 m. The +X face plots (half width - z, height - y), the -X face (half width + z, height - y), both against the one shared `x_both` BMP; both sides plot the source x against the one shared `z_both` BMP, so the -Z elevation is mirrored relative to an outside observer.

Each vector is (left, top, width, height). Percentages are 100*x/W, 100*y/H, 100*w/W, 100*h/H. Signed delta = model minus source in percentage points. MAE = sum(abs(delta)) / (4 * number of boxes). Actual GLB vertices are selected by named scope triangle ranges; bounds include occluded vertices. Native BMPs, never the enhanced `_4x` textures, define the measurements.

| View | Boxes | Baseline MAE (pp) | Final MAE (pp) |
|---|---:|---:|---:|
| x_front | 6 | 3.024 | 1.823 |
| z_right | 8 | 0.398 | 0.398 |
| All | 14 | 1.524 | 1.009 |

One pixel is 3.333 pp horizontally at the front, 0.556 pp horizontally at the sides and 1.667 pp vertically. Rows with a tolerance above about one pixel are deliberate departures, explained in their uncertainty column.

Annotated views (generated locally, not committed):

- x_front: [native](../../export/review/cd-771/x_front-native.svg), [model](../../export/review/cd-771/x_front-model.svg)
- z_right: [native](../../export/review/cd-771/z_right-native.svg), [model](../../export/review/cd-771/z_right-model.svg)
- [Three-quarter thumbnail](../../export/thumbs/veh-cd-771.png)

| ID | Native pixel edges | Reference | Mesh scope(s) | Source % (x,y,w,h) | Model % | Signed delta (pp) | Baseline abs. mean (pp) | Final abs. mean (pp) | Uncertainty |
|---|---|---|---|---|---|---|---:|---:|---|
| F01 | 5, 22, 25, 32 | native | `short-hood/end/grille` | 16.667, 36.667, 66.667, 16.667 | 18.333, 36.667, 63.333, 16.667 | 1.667, 0.000, -3.333, 0.000 | 7.917 | 1.250 | Native pixel edge estimate; +/- one pixel. The hood end's radiator (cream in the BMP); the model's grille is 1.5 m wide, 2.4 .. 3.8 m. |
| F02 | 0, 22, 5, 31 | native | `cab/end-windows/front-left` | 0.000, 36.667, 16.667, 15.000 | 2.000, 36.667, 13.333, 13.333 | 2.000, 0.000, -3.333, -1.667 | 1.750 | 1.750 | Native pixel edge estimate; +/- one pixel. The cab window beside the hood, viewer's left. |
| F06 | 25, 22, 30, 31 | native | `cab/end-windows/front-right` | 83.333, 36.667, 16.667, 15.000 | 84.667, 36.667, 13.333, 13.333 | 1.333, 0.000, -3.333, -1.667 | 1.583 | 1.583 | Native pixel edge estimate; +/- one pixel. The cab window beside the hood, viewer's right. |
| F03 | 13, 17, 17, 21 | native | `short-hood/end/headlight` | 43.333, 28.333, 13.333, 6.667 | 45.667, 27.000, 8.667, 4.333 | 2.333, -1.333, -4.667, -2.333 | 2.667 | 2.667 | Native pixel edge estimate; +/- one pixel. The headlight on the hood's cap. |
| F04 | 2, 48, 8, 52 | native | `frame/short-hood-end/right-buffer/head` | 6.667, 80.000, 20.000, 6.667 | 14.167, 80.084, 13.333, 6.500 | 7.500, 0.084, -6.667, -0.167 | 3.604 | 3.604 | Native buffer frames; the model keeps the standard 1.75 m buffer spacing and 1.03 m height (deliberate mechanical constraint). |
| F05 | 0, 43, 30, 57 | native | `frame/short-hood-end/end-plate` | 0.000, 71.667, 100.000, 23.333 | 0.000, 71.667, 100.000, 23.000 | 0.000, -0.000, 0.000, -0.333 | 0.625 | 0.083 | Native pixel edge estimate; +/- one pixel. The end plate and buffer beam, 0.4 .. 1.7 m. |
| R01 | 34, 22, 49, 31 | native | `cab/side-windows` | 18.889, 36.667, 8.333, 15.000 | 19.002, 36.667, 8.107, 13.333 | 0.113, 0.000, -0.227, -1.667 | 0.502 | 0.502 | Native pixel edge estimate; +/- one pixel. The cab's side windows, two panes. |
| R02 | 30, 14, 54, 21 | native | `cab/roof` | 16.667, 23.333, 13.333, 11.667 | 16.667, 23.333, 12.778, 11.667 | -0.000, 0.000, -0.556, -0.000 | 0.139 | 0.139 | Native pixel edge estimate; +/- one pixel. The cab's roof (XML 3.0 .. 5.3, 3.9 .. 4.6 m). |
| R03 | 31, 21, 52, 43 | native | `cab/body` | 17.222, 35.000, 11.667, 36.667 | 17.222, 35.000, 11.667, 36.667 | 0.000, -0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R04 | 7, 15, 31, 43 | native | `short-hood` | 3.889, 25.000, 13.333, 46.667 | 3.741, 26.617, 13.481, 45.050 | -0.147, 1.617, 0.147, -1.617 | 0.882 | 0.882 | Native pixel edge estimate; +/- one pixel. The short hood with its cap (XML 0.7 .. 3.1). |
| R05 | 52, 15, 170, 43 | native | `long-hood` | 28.889, 25.000, 65.556, 46.667 | 28.889, 26.617, 65.147, 45.050 | -0.000, 1.617, -0.408, -1.617 | 0.910 | 0.910 | Native pixel edge estimate; +/- one pixel. The long hood with its cap (XML 5.2 .. 16.9). |
| R06 | 52, 24, 166, 30 | native | `long-hood/band-cream` | 28.889, 40.000, 63.333, 10.000 | 28.889, 40.000, 63.333, 10.000 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Livery band 3.0 .. 3.6 m (cream) along the long hood. |
| R07 | 4, 43, 172, 48 | native | `frame/deck` | 2.222, 71.667, 93.333, 8.333 | 2.500, 71.667, 92.778, 7.500 | 0.278, -0.000, -0.556, -0.833 | 0.417 | 0.417 | Native pixel edge estimate; +/- one pixel. The frame and walkway deck, 1.25 .. 1.7 m. |
| R08 | 77, 48, 99, 57 | native | `underframe/fuel-tank` | 42.778, 80.000, 12.222, 15.000 | 42.778, 79.167, 12.222, 15.500 | 0.000, -0.833, -0.000, 0.500 | 0.333 | 0.333 | XML 'box' clip 7.7 .. 9.9, 0.3 .. 1.2 m. |
