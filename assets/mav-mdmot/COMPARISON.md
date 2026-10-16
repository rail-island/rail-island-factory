# MAV MDmot motor car native reference comparison

**Covers** - native pixel annotations, baseline and final orthographic errors.
**Code** - `generator/mavMdmot.ts`, `generator/unitComparison.ts`, `generator/unitReport.ts`.
**See also** - [source notes](SOURCES.md), [foreign multiple units](../../docs/models/foreign-units.md).

Model geometry revision (SHA-256 of comparison GLB): `02cf94c7d56dfaaafa8376761111a588b2294e00f9ba01a8e08aa0381357a50e`.

Regenerate with `pnpm exec tsx generator/unitReport.ts mav_mdmot`. The baseline is the geometry when the annotations were fixed (`native/mav_mdmot/baseline.json`); baseline and final use the same annotations. Built with `unit=motorCar` of `veh-mav-mdmot`.

Canvases: sides 15 x 4 m (150 x 40 px), ends 3 x 4 m, including empty space, 0.1 m a pixel (an annotation with a metresPerRow field gives its canvas's row height). Origin top left; x right, y down. Side u = 10 * (15.26 - (Factory X + 7.760)): the BMP's cab at its left, the model's at +X; both sides use the same mapping, so the left (-Z) elevation is mirrored relative to an outside observer, as its BMP is. Ends are seen from outside: rear u = 10 * (z + W / 20), front u = 10 * (W / 20 - z), W the end canvas's width in pixels. v = 10 * (H - y), physical heights: no scale is undone.

Each vector is (left, top, width, height). Percentages are 100*x/W, 100*y/H, 100*w/W, 100*h/H of the native canvas. Signed delta = model minus source in percentage points. MAE = sum(abs(delta)) / (4 * number of boxes). Model boxes are the bounds of actual GLB vertices of the named scopes, occluded vertices included. Only the original BMPs define the measurements, never the 4x textures.

| View | Boxes | Baseline MAE (pp) | Final MAE (pp) |
|---|---:|---:|---:|
| z_both, right | 12 | 1.663 | 1.663 |
| x_both, front | 4 | 2.503 | 2.503 |
| All | 16 | 1.873 | 1.873 |

With the documented scales undone (side lengths / 1.0000, model heights / 1.0700, end-view widths / 1.0179: the published dimensions against the XML's), the final MAE is 0.283 pp over the same 16 boxes; the residual left is the transfer itself.

One pixel is 0.667 pp horizontally on the sides, 3.333 pp horizontally on the ends and 2.500 pp vertically.

Annotated views (generated locally, not committed):

- z_both, right: [native](../../export/review/mav_mdmot/z_both-right-native.svg), [model](../../export/review/mav_mdmot/z_both-right-model.svg)
- x_both, front: [native](../../export/review/mav_mdmot/x_both-front-native.svg), [model](../../export/review/mav_mdmot/x_both-front-model.svg)
- [Three-quarter view](../../export/review/mav_mdmot/three-quarter-front.png), [thumbnail](../../export/thumbs/veh-mav-mdmot.png)

| ID | View | Element | Native pixel edges | Mesh scope(s) | Source % (x,y,w,h) | Model % | Signed delta (pp) | Baseline abs. mean (pp) | Final abs. mean (pp) | Uncertainty |
|---|---|---|---|---|---|---|---|---:|---:|---|
| P01 | z_both, right | cab side window (frame) | 12, 12, 17, 19 | `body/right-side/windows/window-1/frame` | 8.000, 30.000, 3.333, 17.500 | 8.033, 25.100, 3.300, 18.725 | 0.033, -4.900, -0.033, 1.225 | 1.548 | 1.548 | Native pixel edge estimate; +/- one pixel. |
| P02 | z_both, right | cab door (outline) | 23, 11, 28, 29 | `body/right-side/doors/door-1/outline` | 15.333, 27.500, 3.333, 45.000 | 15.333, 22.425, 3.333, 48.150 | 0.000, -5.075, 0.000, 3.150 | 2.056 | 2.056 | The door's edges are inferred from its window and the handrail; +/- two pixels. |
| P03 | z_both, right | cab door window (frame) | 24, 12, 27, 19 | `body/right-side/doors/door-1/window/frame` | 16.000, 30.000, 2.000, 17.500 | 16.000, 25.100, 2.000, 18.725 | 0.000, -4.900, -0.000, 1.225 | 1.531 | 1.531 | Native pixel edge estimate; +/- one pixel. |
| P04 | z_both, right | compartment window by the cab door | 30, 12, 33, 19 | `body/right-side/windows/window-2/frame` | 20.000, 30.000, 2.000, 17.500 | 20.000, 25.100, 2.000, 18.725 | 0.000, -4.900, 0.000, 1.225 | 1.531 | 1.531 | Native pixel edge estimate; +/- one pixel. |
| P05 | z_both, right | machine room window 1 | 48, 12, 55, 19 | `body/right-side/windows/window-3/frame` | 32.000, 30.000, 4.667, 17.500 | 32.000, 25.100, 4.667, 18.725 | -0.000, -4.900, 0.000, 1.225 | 1.531 | 1.531 | Native pixel edge estimate; +/- one pixel. |
| P06 | z_both, right | grille 1 | 58, 12, 69, 19 | `body/right-side/grilles/grille-1` | 38.667, 30.000, 7.333, 17.500 | 38.667, 25.100, 7.333, 18.725 | -0.000, -4.900, 0.000, 1.225 | 1.531 | 1.531 | Native pixel edge estimate; +/- one pixel. |
| P07 | z_both, right | machine room window 2 | 72, 12, 78, 19 | `body/right-side/windows/window-4/frame` | 48.000, 30.000, 4.000, 17.500 | 48.000, 25.100, 4.000, 18.725 | -0.000, -4.900, 0.000, 1.225 | 1.531 | 1.531 | Native pixel edge estimate; +/- one pixel. |
| P08 | z_both, right | grille 2 | 81, 12, 92, 19 | `body/right-side/grilles/grille-2` | 54.000, 30.000, 7.333, 17.500 | 54.000, 25.100, 7.333, 18.725 | 0.000, -4.900, 0.000, 1.225 | 1.531 | 1.531 | Native pixel edge estimate; +/- one pixel. |
| P09 | z_both, right | machine room window 3 | 95, 12, 102, 19 | `body/right-side/windows/window-5/frame` | 63.333, 30.000, 4.667, 17.500 | 63.333, 25.100, 4.667, 18.725 | 0.000, -4.900, 0.000, 1.225 | 1.531 | 1.531 | Native pixel edge estimate; +/- one pixel. |
| P10 | z_both, right | second cab's side window | 133, 12, 138, 19 | `body/right-side/windows/window-7/frame` | 88.667, 30.000, 3.333, 17.500 | 88.667, 25.100, 3.300, 18.725 | 0.000, -4.900, -0.033, 1.225 | 1.540 | 1.540 | Native pixel edge estimate; +/- one pixel. |
| P11 | z_both, right | radiator louvre on the hump | 46, 5, 54, 10 | `body/right-side/roof-louvres/louvre-1` | 30.667, 12.500, 5.333, 12.500 | 30.667, 7.178, 5.333, 12.572 | -0.000, -5.322, 0.000, 0.072 | 1.349 | 1.349 | Native pixel edge estimate; +/- one pixel. |
| P12 | z_both, right | red body band | 12, 11, 138, 29 | `body/red-band` | 8.000, 27.500, 84.000, 45.000 | 8.000, 22.363, 84.000, 50.825 | -0.000, -5.137, 0.000, 5.825 | 2.740 | 2.741 | The band's ends meet the cab fronts' shading; +/- two pixels at the ends. |
| F01 | x_both, front | windscreens (frame) | 4, 12, 28, 18 | `front-end/windscreens` | 13.333, 30.000, 80.000, 15.000 | 11.321, 24.002, 84.143, 18.236 | -2.012, -5.998, 4.143, 3.236 | 3.847 | 3.847 | Native pixel edge estimate; +/- one pixel. |
| F02 | x_both, front | number plate | 12, 23, 21, 26 | `front-end/number-plate` | 40.000, 57.500, 30.000, 7.500 | 39.821, 54.532, 30.536, 8.045 | -0.179, -2.968, 0.536, 0.545 | 1.057 | 1.057 | Native pixel edge estimate; +/- one pixel. |
| F03 | x_both, front | cream lamp band | 2, 23, 30, 28 | `body/cab-1/cream-band` | 6.667, 57.500, 93.333, 12.500 | 2.500, 54.463, 95.000, 13.375 | -4.167, -3.037, 1.667, 0.875 | 2.437 | 2.436 | The band's rounded corners are shaded; +/- two pixels across. |
| F04 | x_both, front | roof headlight housing | 14, 4, 18, 10 | `front-end/top-lamp` | 46.667, 10.000, 13.333, 15.000 | 43.333, 3.700, 13.333, 16.050 | -3.333, -6.300, 0.000, 1.050 | 2.671 | 2.671 | A small painted housing; its depth on the roof is not drawn. |
