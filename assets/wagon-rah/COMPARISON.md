# Rah#1 native reference comparison

**Covers** - native pixel annotations, baseline and final orthographic errors.
**Code** - `generator/wagons.ts`, `generator/wagonParts.ts`, `generator/wagonTransfers.ts`, `generator/csdCoachComparison.ts`, `generator/csdCoachReport.ts`.
**See also** - [source notes](SOURCES.md), [Freight wagons](../../docs/models/wagons.md).

Model geometry revision (SHA-256 of comparison GLB): `93eb1694b93d09663ace42a0f7d003c588e84c0a8db828726c9b038e04b4a15f`.

Regenerate with `pnpm exec tsx generator/csdCoachReport.ts n_rah_1`. The baseline is the first authored geometry (`native/n_rah_1/baseline.json`); baseline and final use the same annotations.

Canvases: sides 15 x 5 m (150 x 50 px), ends 3 x 5 m (30 x 50 px), including empty space, 0.1 m a pixel. Origin top left; x right, y down. Side u = 10 * source x = 10 * (Factory X + 6.35); both sides keep increasing source x, so the left (-Z) elevation is mirrored relative to an outside observer, as its BMP is. Ends are seen from outside: rear u = 10 * (z + 1.5), front u = 10 * (1.5 - z). v = 10 * (5 - y).

Each vector is (left, top, width, height). Percentages are 100*x/W, 100*y/H, 100*w/W, 100*h/H of the native canvas. Signed delta = model minus source in percentage points. MAE = sum(abs(delta)) / (4 * number of boxes). Model boxes are the bounds of actual GLB vertices of the named scopes, occluded vertices included. Only the original BMPs define the measurements, never the 4x textures.

| View | Boxes | Baseline MAE (pp) | Final MAE (pp) |
|---|---:|---:|---:|
| z_dec, right | 11 | 0.508 | 0.327 |
| z_inc, left | 11 | 0.508 | 0.326 |
| All | 22 | 0.508 | 0.326 |

One pixel is 0.667 pp horizontally on the sides, 3.333 pp horizontally on the ends and 2.000 pp vertically. The model was authored from these same measured boxes, so the residuals measure the transfer onto the XML clip shapes (0.1 m posts the BMPs paint up to 0.2 m wide, polygonal hoppers and tank, loads bounded by their XML hulls) and the deliberate mechanical choices (1.75 m buffer spacing, 920 mm wheels), not photographic accuracy.

Annotated views (generated locally, not committed):

- z_dec, right: [native](../../export/review/n_rah_1/z_dec-right-native.svg), [model](../../export/review/n_rah_1/z_dec-right-model.svg)
- z_inc, left: [native](../../export/review/n_rah_1/z_inc-left-native.svg), [model](../../export/review/n_rah_1/z_inc-left-model.svg)
- [Three-quarter view](../../export/review/n_rah_1/three-quarter.png), [thumbnail](../../export/thumbs/veh-rah-tank-wagon.png)

| ID | View | Element | Native pixel edges | Mesh scope(s) | Source % (x,y,w,h) | Model % | Signed delta (pp) | Baseline abs. mean (pp) | Final abs. mean (pp) | Uncertainty |
|---|---|---|---|---|---|---|---|---:|---:|---|
| R01 | z_dec, right | tank shell | 10, 16, 114, 35 | `tank/shell` | 6.667, 32.000, 69.333, 38.000 | 6.000, 32.365, 69.333, 37.270 | -0.667, 0.365, -0.000, -0.730 | 0.441 | 0.440 | The silhouette 3.4 m to 1.5 m of the XML rotation; the native shading continues below it. |
| R02 | z_dec, right | orange band | 10, 23, 113, 28 | `tank/band` | 6.667, 46.000, 68.667, 10.000 | 5.953, 45.969, 69.407, 10.061 | -0.713, -0.031, 0.740, 0.061 | 0.386 | 0.386 | The model band runs over the conical end to the 0.9 m end disc; native column 9 is shaded grey. |
| R03 | z_dec, right | CPAVEX lettering | 50, 23, 71, 28 | `tank/lettering` | 33.333, 46.000, 14.000, 10.000 | 33.280, 44.582, 14.107, 11.699 | -0.054, -1.418, 0.107, 1.699 | 1.983 | 0.819 | Bold one-pixel glyphs. |
| R04 | z_dec, right | dome | 60, 10, 69, 16 | `tank/dome` | 40.000, 20.000, 6.000, 12.000 | 40.000, 20.000, 6.000, 14.000 | 0.000, 0.000, 0.000, 2.000 | 0.500 | 0.500 | XML alongz dome (6.0..6.9 m, up to 4.0 m) inside the painted walkway handrail. |
| R05 | z_dec, right | walkway handrail | 58, 11, 75, 15 | `tank/walkway-handrail` | 38.667, 22.000, 11.333, 8.000 | 38.667, 22.000, 11.067, 9.600 | -0.000, -0.000, -0.267, 1.600 | 0.467 | 0.467 | Native pixel edge estimate; +/- one pixel. |
| R06 | z_dec, right | side ladder | 52, 11, 58, 45 | `right-side-boards/ladder` | 34.667, 22.000, 4.000, 68.000 | 34.667, 21.000, 3.733, 68.000 | 0.000, -1.000, -0.267, 0.000 | 0.317 | 0.317 | Its rails cross the tank in the native; the model rails stand just outside the shell. |
| R07 | z_dec, right | data board 1 | 16, 30, 41, 38 | `right-side-boards/board-1` | 10.667, 60.000, 16.667, 16.000 | 10.667, 60.000, 16.667, 16.000 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Black on the black background: the outline is the XML `sign` (1.6..4.1 m, 1.2..2.0 m). |
| R08 | z_dec, right | data board 2 | 82, 30, 107, 38 | `right-side-boards/board-2` | 54.667, 60.000, 16.667, 16.000 | 54.667, 60.000, 16.667, 16.000 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Black on the black background: the outline is the XML `sign` (8.2..10.7 m, 1.2..2.0 m). |
| R09 | z_dec, right | running number lines | 18, 31, 31, 38 | `right-side-boards/running-number` | 12.000, 62.000, 8.667, 14.000 | 12.058, 62.830, 8.567, 12.339 | 0.058, 0.830, -0.100, -1.661 | 1.498 | 0.662 | One-pixel glyphs; the model lettering is set in the stroke font. |
| R10 | z_dec, right | frame | 5, 38, 122, 42 | `frame/underframe` | 3.333, 76.000, 78.000, 8.000 | 3.333, 76.000, 78.000, 8.000 | 0.000, -0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R11 | z_dec, right | platform railing post | 121, 27, 122, 38 | `platform-railing` | 80.667, 54.000, 0.667, 22.000 | 80.667, 54.000, 0.667, 22.000 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | XML `rail` (12.1..12.2 m, 1.2..2.3 m); the native paints the post one column to the left. |
| L01 | z_inc, left | tank shell | 10, 16, 114, 35 | `tank/shell` | 6.667, 32.000, 69.333, 38.000 | 6.000, 32.365, 69.333, 37.270 | -0.667, 0.365, -0.000, -0.730 | 0.441 | 0.440 | The silhouette 3.4 m to 1.5 m of the XML rotation; the native shading continues below it. |
| L02 | z_inc, left | orange band | 10, 23, 113, 28 | `tank/band` | 6.667, 46.000, 68.667, 10.000 | 5.953, 45.969, 69.407, 10.061 | -0.713, -0.031, 0.740, 0.061 | 0.386 | 0.386 | The model band runs over the conical end to the 0.9 m end disc; native column 9 is shaded grey. |
| L03 | z_inc, left | CPAVEX lettering | 50, 23, 71, 28 | `tank/lettering` | 33.333, 46.000, 14.000, 10.000 | 33.280, 44.582, 14.107, 11.699 | -0.054, -1.418, 0.107, 1.699 | 1.983 | 0.819 | Bold one-pixel glyphs. |
| L04 | z_inc, left | dome | 60, 10, 69, 16 | `tank/dome` | 40.000, 20.000, 6.000, 12.000 | 40.000, 20.000, 6.000, 14.000 | 0.000, 0.000, 0.000, 2.000 | 0.500 | 0.500 | XML alongz dome (6.0..6.9 m, up to 4.0 m) inside the painted walkway handrail. |
| L05 | z_inc, left | walkway handrail | 58, 11, 75, 15 | `tank/walkway-handrail` | 38.667, 22.000, 11.333, 8.000 | 38.667, 22.000, 11.067, 9.600 | -0.000, -0.000, -0.267, 1.600 | 0.467 | 0.467 | Native pixel edge estimate; +/- one pixel. |
| L06 | z_inc, left | side ladder | 52, 11, 58, 45 | `left-side-boards/ladder` | 34.667, 22.000, 4.000, 68.000 | 34.667, 21.000, 3.733, 68.000 | 0.000, -1.000, -0.267, 0.000 | 0.317 | 0.317 | Its rails cross the tank in the native; the model rails stand just outside the shell. |
| L07 | z_inc, left | data board 1 | 16, 30, 41, 38 | `left-side-boards/board-1` | 10.667, 60.000, 16.667, 16.000 | 10.667, 60.000, 16.667, 16.000 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Black on the black background: the outline is the XML `sign` (1.6..4.1 m, 1.2..2.0 m). |
| L08 | z_inc, left | data board 2 | 82, 30, 107, 38 | `left-side-boards/board-2` | 54.667, 60.000, 16.667, 16.000 | 54.667, 60.000, 16.667, 16.000 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Black on the black background: the outline is the XML `sign` (8.2..10.7 m, 1.2..2.0 m). |
| L09 | z_inc, left | running number lines | 18, 31, 31, 38 | `left-side-boards/running-number` | 12.000, 62.000, 8.667, 14.000 | 12.042, 62.830, 8.567, 12.339 | 0.042, 0.830, -0.100, -1.661 | 1.495 | 0.658 | One-pixel glyphs; the model lettering is set in the stroke font. |
| L10 | z_inc, left | frame | 5, 38, 122, 42 | `frame/underframe` | 3.333, 76.000, 78.000, 8.000 | 3.333, 76.000, 78.000, 8.000 | 0.000, -0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L11 | z_inc, left | platform railing post | 121, 27, 122, 38 | `platform-railing` | 80.667, 54.000, 0.667, 22.000 | 80.667, 54.000, 0.667, 22.000 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | XML `rail` (12.1..12.2 m, 1.2..2.3 m); the native paints the post one column to the left. |
