# Pao + Tubes native reference comparison

**Covers** - native pixel annotations, baseline and final orthographic errors.
**Code** - `generator/freightWagons.ts`, `generator/hopperWagons.ts`, `generator/freightWagonParts.ts`, `generator/freightTransfers.ts`, `generator/csdCoachComparison.ts`, `generator/csdCoachReport.ts`.
**See also** - [source notes](SOURCES.md), [Freight wagons (container, flat, sliding-wall, hopper)](../../docs/models/freight-wagons.md).

Model geometry revision (SHA-256 of comparison GLB): `7d429c970e7e1132dd0e157f2dfd94293e896e394689bd97893d6a7896c49cf9`.

Regenerate with `pnpm exec tsx generator/csdCoachReport.ts n_pao-full_1`. The baseline is the first authored geometry (`native/n_pao-full_1/baseline.json`); baseline and final use the same annotations. Built with `cargo=tubes` of `veh-pao-flat-wagon`.

Canvases: sides 16 x 2 m (160 x 20 px), ends 3 x 2 m (30 x 20 px), including empty space, 0.1 m a pixel. Origin top left; x right, y down. Side u = 10 * source x = 10 * (Factory X + 7.65); both sides keep increasing source x, so the left (-Z) elevation is mirrored relative to an outside observer, as its BMP is. Ends are seen from outside: rear u = 10 * (z + 1.5), front u = 10 * (1.5 - z). v = 10 * (2 - y).

Each vector is (left, top, width, height). Percentages are 100*x/W, 100*y/H, 100*w/W, 100*h/H of the native canvas. Signed delta = model minus source in percentage points. MAE = sum(abs(delta)) / (4 * number of boxes). Model boxes are the bounds of actual GLB vertices of the named scopes, occluded vertices included. Only the original BMPs define the measurements, never the 4x textures.

| View | Boxes | Baseline MAE (pp) | Final MAE (pp) |
|---|---:|---:|---:|
| z_both, right | 6 | 0.476 | 0.476 |
| z_both, left | 6 | 0.476 | 0.476 |
| All | 12 | 0.476 | 0.476 |

One pixel is 0.625 pp horizontally on the sides, 3.333 pp horizontally on the ends and 5.000 pp vertically. The model was authored from these same measured boxes, so the residuals measure the transfer onto the XML clip shapes (0.1 m posts the BMPs paint wider, loads bounded by their XML hulls) and the deliberate mechanical choices (1.75 m buffer spacing, 920 mm wheels, the ISO 40 ft container, the 3.1 m width), not photographic accuracy.

Annotated views (generated locally, not committed):

- z_both, right: [native](../../export/review/n_pao-full_1/z_both-right-native.svg), [model](../../export/review/n_pao-full_1/z_both-right-model.svg)
- z_both, left: [native](../../export/review/n_pao-full_1/z_both-left-native.svg), [model](../../export/review/n_pao-full_1/z_both-left-model.svg)
- [Three-quarter view](../../export/review/n_pao-full_1/three-quarter.png), [thumbnail](../../export/thumbs/veh-pao-flat-wagon.png)

| ID | View | Element | Native pixel edges | Mesh scope(s) | Source % (x,y,w,h) | Model % | Signed delta (pp) | Baseline abs. mean (pp) | Final abs. mean (pp) | Uncertainty |
|---|---|---|---|---|---|---|---|---:|---:|---|
| R01 | z_both, right | frame side | 5, 8, 147, 15 | `frame/right-side/solebar`, `frame/right-side/deck-edge`, `frame/right-side/fishbelly` | 3.125, 40.000, 88.750, 35.000 | 3.125, 40.000, 89.375, 35.000 | -0.000, -0.000, 0.625, 0.000 | 0.156 | 0.156 | Deck edge row 8, solebar and fishbelly down to row 14 (0.5 m). |
| R02 | z_both, right | rear buffers | 0, 8, 5, 12 | `rear-end/buffers` | 0.000, 40.000, 3.125, 20.000 | -0.000, 39.000, 2.813, 22.000 | -0.000, -1.000, -0.312, 2.000 | 0.828 | 0.828 | Native pixel edge estimate; +/- one pixel. |
| R03 | z_both, right | front buffers | 147, 8, 153, 12 | `front-end/buffers` | 91.875, 40.000, 3.750, 20.000 | 92.812, 39.000, 2.813, 22.000 | 0.937, -1.000, -0.937, 2.000 | 1.219 | 1.219 | The BMP paints the buffers from 14.7 m; the model beam ends the deck at 14.8 m. |
| R04 | z_both, right | tube bundle | 28, 3, 125, 6 | `cargo/tubes` | 17.500, 15.000, 60.625, 15.000 | 17.500, 13.836, 60.625, 15.936 | 0.000, -1.164, -0.000, 0.936 | 0.525 | 0.525 | XML `load` 2.8..12.5 m, 1.4..1.7 m; 21 tubes 0.12 m across in three layers. |
| R05 | z_both, right | timber bolster 1 | 38, 6, 48, 8 | `cargo/bolsters/bolster-1` | 23.750, 30.000, 6.250, 10.000 | 23.750, 30.000, 6.250, 9.750 | 0.000, 0.000, 0.000, -0.250 | 0.063 | 0.063 | Native pixel edge estimate; +/- one pixel. |
| R06 | z_both, right | timber bolster 2 | 105, 6, 115, 8 | `cargo/bolsters/bolster-2` | 65.625, 30.000, 6.250, 10.000 | 65.625, 30.000, 6.250, 9.750 | -0.000, 0.000, 0.000, -0.250 | 0.063 | 0.063 | Native pixel edge estimate; +/- one pixel. |
| L01 | z_both, left | frame side | 5, 8, 147, 15 | `frame/left-side/solebar`, `frame/left-side/deck-edge`, `frame/left-side/fishbelly` | 3.125, 40.000, 88.750, 35.000 | 3.125, 40.000, 89.375, 35.000 | -0.000, -0.000, 0.625, 0.000 | 0.156 | 0.156 | Deck edge row 8, solebar and fishbelly down to row 14 (0.5 m). |
| L02 | z_both, left | rear buffers | 0, 8, 5, 12 | `rear-end/buffers` | 0.000, 40.000, 3.125, 20.000 | -0.000, 39.000, 2.813, 22.000 | -0.000, -1.000, -0.312, 2.000 | 0.828 | 0.828 | Native pixel edge estimate; +/- one pixel. |
| L03 | z_both, left | front buffers | 147, 8, 153, 12 | `front-end/buffers` | 91.875, 40.000, 3.750, 20.000 | 92.812, 39.000, 2.813, 22.000 | 0.937, -1.000, -0.937, 2.000 | 1.219 | 1.219 | The BMP paints the buffers from 14.7 m; the model beam ends the deck at 14.8 m. |
| L04 | z_both, left | tube bundle | 28, 3, 125, 6 | `cargo/tubes` | 17.500, 15.000, 60.625, 15.000 | 17.500, 13.836, 60.625, 15.936 | 0.000, -1.164, -0.000, 0.936 | 0.525 | 0.525 | XML `load` 2.8..12.5 m, 1.4..1.7 m; 21 tubes 0.12 m across in three layers. |
| L05 | z_both, left | timber bolster 1 | 38, 6, 48, 8 | `cargo/bolsters/bolster-1` | 23.750, 30.000, 6.250, 10.000 | 23.750, 30.000, 6.250, 9.750 | 0.000, 0.000, 0.000, -0.250 | 0.063 | 0.063 | Native pixel edge estimate; +/- one pixel. |
| L06 | z_both, left | timber bolster 2 | 105, 6, 115, 8 | `cargo/bolsters/bolster-2` | 65.625, 30.000, 6.250, 10.000 | 65.625, 30.000, 6.250, 9.750 | -0.000, 0.000, 0.000, -0.250 | 0.063 | 0.063 | Native pixel edge estimate; +/- one pixel. |
