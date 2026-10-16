# ICE 1 power car native reference comparison

**Covers** - native pixel annotations, baseline and final orthographic errors.
**Code** - `generator/ice1.ts`, `generator/unitComparison.ts`, `generator/unitReport.ts`.
**See also** - [source notes](SOURCES.md), [foreign multiple units](../../docs/models/foreign-units.md).

Model geometry revision (SHA-256 of comparison GLB): `a3f38b570529967e6394447f27ed58cf89849b9b4d90e05664a886348dc29dee`.

Regenerate with `pnpm exec tsx generator/unitReport.ts ice_loco`. The baseline is the geometry when the annotations were fixed (`native/ice_loco/baseline.json`); baseline and final use the same annotations. Built with `unit=powerCar` of `veh-ice-1`.

Canvases: sides 20.6 x 3.8 m (206 x 38 px), ends 3.1 x 3.8 m, including empty space, 0.1 m a pixel (an annotation with a metresPerRow field gives its canvas's row height). Origin top left; x right, y down. Side u = 10 * (20.55 - (Factory X + 10.280)): the BMP's cab at its left, the model's at +X; both sides use the same mapping, so the left (-Z) elevation is mirrored relative to an outside observer, as its BMP is. Ends are seen from outside: rear u = 10 * (z + W / 20), front u = 10 * (W / 20 - z), W the end canvas's width in pixels. v = 10 * (H - y), physical heights: no scale is undone.

Each vector is (left, top, width, height). Percentages are 100*x/W, 100*y/H, 100*w/W, 100*h/H of the native canvas. Signed delta = model minus source in percentage points. MAE = sum(abs(delta)) / (4 * number of boxes). Model boxes are the bounds of actual GLB vertices of the named scopes, occluded vertices included. Only the original BMPs define the measurements, never the 4x textures.

| View | Boxes | Baseline MAE (pp) | Final MAE (pp) |
|---|---:|---:|---:|
| z_inc, right | 11 | 1.066 | 1.037 |
| x_inc, front | 2 | 1.103 | 0.458 |
| All | 13 | 1.072 | 0.948 |

With the documented scales undone (side lengths / 1.0000, model heights / 1.0105, end-view widths / 1.0000: the published dimensions against the XML's), the final MAE is 0.782 pp over the same 13 boxes; the residual left is the transfer itself.

One pixel is 0.485 pp horizontally on the sides, 3.226 pp horizontally on the ends and 2.632 pp vertically.

Annotated views (generated locally, not committed):

- z_inc, right: [native](../../export/review/ice_loco/z_inc-right-native.svg), [model](../../export/review/ice_loco/z_inc-right-model.svg)
- x_inc, front: [native](../../export/review/ice_loco/x_inc-front-native.svg), [model](../../export/review/ice_loco/x_inc-front-model.svg)
- [Three-quarter view](../../export/review/ice_loco/three-quarter-front.png), [thumbnail](../../export/thumbs/veh-ice-1.png)

| ID | View | Element | Native pixel edges | Mesh scope(s) | Source % (x,y,w,h) | Model % | Signed delta (pp) | Baseline abs. mean (pp) | Final abs. mean (pp) | Uncertainty |
|---|---|---|---|---|---|---|---|---:|---:|---|
| P01 | z_inc, right | cab side window | 19, 9, 23, 13 | `body/right-side/cab-window/frame` | 9.223, 23.684, 1.942, 10.526 | 9.223, 22.881, 1.942, 10.637 | 0.000, -0.803, 0.000, 0.111 | 0.229 | 0.229 | A trapezoid on the nose's slope; its box +/- two pixels. |
| P02 | z_inc, right | front grille 1 | 35, 7, 48, 13 | `body/right-side/grilles/grille-1` | 16.990, 18.421, 6.311, 15.789 | 16.990, 17.562, 6.311, 15.956 | 0.000, -0.859, 0.000, 0.166 | 0.256 | 0.256 | Native pixel edge estimate; +/- one pixel. |
| P03 | z_inc, right | front grille 2 | 49, 7, 62, 13 | `body/right-side/grilles/grille-2` | 23.786, 18.421, 6.311, 15.789 | 23.786, 17.562, 6.311, 15.956 | 0.000, -0.859, -0.000, 0.166 | 0.256 | 0.256 | Native pixel edge estimate; +/- one pixel. |
| P04 | z_inc, right | side door (outline) | 62, 14, 71, 28 | `body/right-side/door/outline` | 30.097, 36.842, 4.369, 36.842 | 30.097, 36.177, 4.369, 37.230 | -0.000, -0.665, 0.000, 0.388 | 0.263 | 0.263 | Native pixel edge estimate; +/- one pixel. |
| P05 | z_inc, right | ICE lettering | 90, 7, 112, 20 | `body/right-side/lettering` | 43.689, 18.421, 10.680, 34.211 | 43.689, 16.922, 10.680, 35.851 | 0.000, -1.499, -0.000, 1.640 | 1.098 | 0.785 | Native pixel edge estimate; +/- one pixel. |
| P06 | z_inc, right | rear grille 1 | 160, 7, 173, 14 | `body/right-side/grilles/grille-3` | 77.670, 18.421, 6.311, 18.421 | 77.670, 17.562, 6.311, 18.615 | 0.000, -0.859, 0.000, 0.194 | 0.263 | 0.263 | Native pixel edge estimate; +/- one pixel. |
| P07 | z_inc, right | rear grille 2 | 174, 7, 187, 14 | `body/right-side/grilles/grille-4` | 84.466, 18.421, 6.311, 18.421 | 84.466, 17.562, 6.311, 18.615 | 0.000, -0.859, 0.000, 0.194 | 0.263 | 0.263 | Native pixel edge estimate; +/- one pixel. |
| P08 | z_inc, right | DB logo on the stripe | 178, 23, 186, 27 | `body/right-side/logo` | 86.408, 60.526, 3.883, 10.526 | 86.650, 60.643, 3.398, 9.573 | 0.243, 0.116, -0.485, -0.953 | 0.449 | 0.449 | Native pixel edge estimate; +/- one pixel. |
| P09 | z_inc, right | red stripe | 3, 23, 206, 26 | `body/red-band` | 1.456, 60.526, 98.544, 7.895 | -0.000, 59.934, 99.515, 8.158 | -1.456, -0.592, 0.971, 0.263 | 0.821 | 0.821 | The stripe thins toward the nose tip; +/- two pixels there. |
| P10 | z_inc, right | front bogie (painted frame) | 26, 33, 69, 38 | `running-gear/bogie-1/frame` | 12.621, 86.842, 20.874, 13.158 | 16.262, 80.117, 18.641, 9.474 | 3.641, -6.725, -2.233, -3.684 | 4.071 | 4.071 | Texture-painted running gear on a dark ground; the extent is +/- two pixels. |
| P11 | z_inc, right | rear bogie (painted frame) | 151, 33, 196, 38 | `running-gear/bogie-2/frame` | 73.301, 86.842, 21.845, 13.158 | 71.893, 80.117, 18.641, 9.474 | -1.408, -6.725, -3.204, -3.684 | 3.755 | 3.755 | Texture-painted running gear on a dark ground; the extent is +/- two pixels. |
| F01 | x_inc, front | headlight 1 | 3, 21, 10, 23 | `cab/lamps/lamp-2` | 9.677, 55.263, 22.581, 5.263 | 9.677, 54.116, 22.581, 5.947 | 0.000, -1.147, -0.000, 0.684 | 1.184 | 0.458 | Native pixel edge estimate; +/- one pixel. |
| F02 | x_inc, front | headlight 2 | 21, 21, 28, 23 | `cab/lamps/lamp-1` | 67.742, 55.263, 22.581, 5.263 | 67.742, 54.116, 22.581, 5.947 | 0.000, -1.147, -0.000, 0.684 | 1.022 | 0.458 | Native pixel edge estimate; +/- one pixel. |
