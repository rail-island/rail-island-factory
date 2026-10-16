# Sqns native reference comparison

**Covers** - native pixel annotations, baseline and final orthographic errors.
**Code** - `generator/freightWagons.ts`, `generator/hopperWagons.ts`, `generator/freightWagonParts.ts`, `generator/freightTransfers.ts`, `generator/csdCoachComparison.ts`, `generator/csdCoachReport.ts`.
**See also** - [source notes](SOURCES.md), [Freight wagons (container, flat, sliding-wall, hopper)](../../docs/models/freight-wagons.md).

Model geometry revision (SHA-256 of comparison GLB): `50e3f942e394385ec79e4871d1a5dab50cd8bc3218f12982e5c103014233b2e8`.

Regenerate with `pnpm exec tsx generator/csdCoachReport.ts n_sqns`. The baseline is the first authored geometry (`native/n_sqns/baseline.json`); baseline and final use the same annotations. Built with `cargo=empty` of `veh-sqns-container-wagon`.

Canvases: sides 20 x 4 m (200 x 40 px), ends 3 x 4 m (30 x 40 px), including empty space, 0.1 m a pixel. Origin top left; x right, y down. Side u = 10 * source x = 10 * (Factory X + 9.9); both sides keep increasing source x, so the left (-Z) elevation is mirrored relative to an outside observer, as its BMP is. Ends are seen from outside: rear u = 10 * (z + 1.5), front u = 10 * (1.5 - z). v = 10 * (4 - y).

Each vector is (left, top, width, height). Percentages are 100*x/W, 100*y/H, 100*w/W, 100*h/H of the native canvas. Signed delta = model minus source in percentage points. MAE = sum(abs(delta)) / (4 * number of boxes). Model boxes are the bounds of actual GLB vertices of the named scopes, occluded vertices included. Only the original BMPs define the measurements, never the 4x textures.

| View | Boxes | Baseline MAE (pp) | Final MAE (pp) |
|---|---:|---:|---:|
| z_both, right | 9 | 0.213 | 0.213 |
| z_both, left | 9 | 0.213 | 0.213 |
| x_both, rear | 1 | 1.000 | 1.000 |
| x_both, front | 1 | 1.000 | 1.000 |
| All | 20 | 0.292 | 0.292 |

One pixel is 0.500 pp horizontally on the sides, 3.333 pp horizontally on the ends and 2.500 pp vertically. The model was authored from these same measured boxes, so the residuals measure the transfer onto the XML clip shapes (0.1 m posts the BMPs paint wider, loads bounded by their XML hulls) and the deliberate mechanical choices (1.75 m buffer spacing, 920 mm wheels, the ISO 40 ft container, the 3.1 m width), not photographic accuracy.

Annotated views (generated locally, not committed):

- z_both, right: [native](../../export/review/n_sqns/z_both-right-native.svg), [model](../../export/review/n_sqns/z_both-right-model.svg)
- z_both, left: [native](../../export/review/n_sqns/z_both-left-native.svg), [model](../../export/review/n_sqns/z_both-left-model.svg)
- x_both, rear: [native](../../export/review/n_sqns/x_both-rear-native.svg), [model](../../export/review/n_sqns/x_both-rear-model.svg)
- x_both, front: [native](../../export/review/n_sqns/x_both-front-native.svg), [model](../../export/review/n_sqns/x_both-front-model.svg)
- [Three-quarter view](../../export/review/n_sqns/three-quarter.png), [thumbnail](../../export/thumbs/veh-sqns-container-wagon.png)

| ID | View | Element | Native pixel edges | Mesh scope(s) | Source % (x,y,w,h) | Model % | Signed delta (pp) | Baseline abs. mean (pp) | Final abs. mean (pp) | Uncertainty |
|---|---|---|---|---|---|---|---|---:|---:|---|
| R01 | z_both, right | side beam with end beams | 5, 28, 193, 31 | `frame/right-side/side-beam`, `frame/right-side/flange`, `rear-end/buffer-beam`, `front-end/buffer-beam` | 2.500, 70.000, 94.000, 7.500 | 2.500, 70.000, 94.000, 8.750 | 0.000, -0.000, -0.000, 1.250 | 0.313 | 0.313 | Rows 28..30 from column 5 to 192 (0.5..19.3 m), the end beams included; the model end beams reach 0.85 m. |
| R02 | z_both, right | fishbelly | 47, 31, 151, 35 | `frame/right-side/fishbelly` | 23.500, 77.500, 52.000, 10.000 | 23.500, 77.500, 52.000, 10.000 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | From the XML alongz outline (4.7..15.1 m down to 0.5 m); the BMP paints its lighter lower flange rows 33..34 from column 57 to 140. |
| R03 | z_both, right | container pin 1 | 5, 27, 7, 28 | `frame/right-side/pins/pin-1` | 2.500, 67.500, 1.000, 2.500 | 2.500, 67.500, 1.000, 2.500 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R04 | z_both, right | container pin 2 | 36, 27, 38, 28 | `frame/right-side/pins/pin-2` | 18.000, 67.500, 1.000, 2.500 | 18.000, 67.500, 1.000, 2.500 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R05 | z_both, right | container pin 4 | 98, 27, 100, 28 | `frame/right-side/pins/pin-4` | 49.000, 67.500, 1.000, 2.500 | 49.000, 67.500, 1.000, 2.500 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R06 | z_both, right | container pin 7 | 191, 27, 193, 28 | `frame/right-side/pins/pin-7` | 95.500, 67.500, 1.000, 2.500 | 95.500, 67.500, 1.000, 2.500 | -0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R07 | z_both, right | handbrake wheel | 60, 30, 65, 35 | `frame/right-side/handbrake` | 30.000, 75.000, 2.500, 12.500 | 30.000, 75.306, 2.500, 11.888 | -0.000, 0.306, 0.000, -0.612 | 0.229 | 0.229 | Yellow 0.4 m wheel, a 10-gon in the model. |
| R08 | z_both, right | rear buffers | 0, 28, 4, 32 | `rear-end/buffers` | 0.000, 70.000, 2.000, 10.000 | 0.000, 69.500, 2.500, 11.000 | 0.000, -0.500, 0.500, 1.000 | 0.500 | 0.500 | Native pixel edge estimate; +/- one pixel. |
| R09 | z_both, right | front buffers | 195, 28, 198, 32 | `front-end/buffers` | 97.500, 70.000, 1.500, 10.000 | 96.500, 69.500, 2.500, 11.000 | -1.000, -0.500, 1.000, 1.000 | 0.875 | 0.875 | The BMP paints 0.3 m buffer stubs; the model keeps the standard 0.5 m buffers from the 19.3 m beam. |
| L01 | z_both, left | side beam with end beams | 5, 28, 193, 31 | `frame/left-side/side-beam`, `frame/left-side/flange`, `rear-end/buffer-beam`, `front-end/buffer-beam` | 2.500, 70.000, 94.000, 7.500 | 2.500, 70.000, 94.000, 8.750 | 0.000, -0.000, -0.000, 1.250 | 0.313 | 0.313 | Rows 28..30 from column 5 to 192 (0.5..19.3 m), the end beams included; the model end beams reach 0.85 m. |
| L02 | z_both, left | fishbelly | 47, 31, 151, 35 | `frame/left-side/fishbelly` | 23.500, 77.500, 52.000, 10.000 | 23.500, 77.500, 52.000, 10.000 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | From the XML alongz outline (4.7..15.1 m down to 0.5 m); the BMP paints its lighter lower flange rows 33..34 from column 57 to 140. |
| L03 | z_both, left | container pin 1 | 5, 27, 7, 28 | `frame/left-side/pins/pin-1` | 2.500, 67.500, 1.000, 2.500 | 2.500, 67.500, 1.000, 2.500 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L04 | z_both, left | container pin 2 | 36, 27, 38, 28 | `frame/left-side/pins/pin-2` | 18.000, 67.500, 1.000, 2.500 | 18.000, 67.500, 1.000, 2.500 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L05 | z_both, left | container pin 4 | 98, 27, 100, 28 | `frame/left-side/pins/pin-4` | 49.000, 67.500, 1.000, 2.500 | 49.000, 67.500, 1.000, 2.500 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L06 | z_both, left | container pin 7 | 191, 27, 193, 28 | `frame/left-side/pins/pin-7` | 95.500, 67.500, 1.000, 2.500 | 95.500, 67.500, 1.000, 2.500 | -0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L07 | z_both, left | handbrake wheel | 60, 30, 65, 35 | `frame/left-side/handbrake` | 30.000, 75.000, 2.500, 12.500 | 30.000, 75.306, 2.500, 11.888 | -0.000, 0.306, 0.000, -0.612 | 0.229 | 0.229 | Yellow 0.4 m wheel, a 10-gon in the model. |
| L08 | z_both, left | rear buffers | 0, 28, 4, 32 | `rear-end/buffers` | 0.000, 70.000, 2.000, 10.000 | 0.000, 69.500, 2.500, 11.000 | 0.000, -0.500, 0.500, 1.000 | 0.500 | 0.500 | Native pixel edge estimate; +/- one pixel. |
| L09 | z_both, left | front buffers | 195, 28, 198, 32 | `front-end/buffers` | 97.500, 70.000, 1.500, 10.000 | 96.500, 69.500, 2.500, 11.000 | -1.000, -0.500, 1.000, 1.000 | 0.875 | 0.875 | The BMP paints 0.3 m buffer stubs; the model keeps the standard 0.5 m buffers from the 19.3 m beam. |
| E01 | x_both, rear | rear buffer beam, buffers and coupling | 0, 27, 30, 33 | `rear-end` | 0.000, 67.500, 100.000, 15.000 | 0.000, 69.500, 100.000, 13.000 | 0.000, 2.000, 0.000, -2.000 | 1.000 | 1.000 | Row 27 is the end beam pins; the beam and buffers rows 28..32. |
| E02 | x_both, front | front buffer beam, buffers and coupling | 0, 27, 30, 33 | `front-end` | 0.000, 67.500, 100.000, 15.000 | 0.000, 69.500, 100.000, 13.000 | 0.000, 2.000, 0.000, -2.000 | 1.000 | 1.000 | Row 27 is the end beam pins; the beam and buffers rows 28..32. |
