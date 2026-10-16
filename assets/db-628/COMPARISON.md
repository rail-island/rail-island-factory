# DB 628 motor car native reference comparison

**Covers** - native pixel annotations, baseline and final orthographic errors.
**Code** - `generator/db628.ts`, `generator/unitComparison.ts`, `generator/unitReport.ts`.
**See also** - [source notes](SOURCES.md), [foreign multiple units](../../docs/models/foreign-units.md).

Model geometry revision (SHA-256 of comparison GLB): `52668f9b63497f7cefaaf523f86c909e61595b387b92847fd5223d3cb090e717`.

Regenerate with `pnpm exec tsx generator/unitReport.ts db_628`. The baseline is the geometry when the annotations were fixed (`native/db_628/baseline.json`); baseline and final use the same annotations. Built with `livery=mint` of `veh-db-628`.

Canvases: sides 25 x 5 m (250 x 50 px), ends 3 x 5 m, including empty space, 0.1 m a pixel (an annotation with a metresPerRow field gives its canvas's row height). Origin top left; x right, y down. Side u = 10 * (22.45 - (Factory X + 11.350)): the BMP's cab at its left, the model's at +X; both sides use the same mapping, so the left (-Z) elevation is mirrored relative to an outside observer, as its BMP is. Ends are seen from outside: rear u = 10 * (z + W / 20), front u = 10 * (W / 20 - z), W the end canvas's width in pixels. v = 10 * (H - y), physical heights: no scale is undone.

Each vector is (left, top, width, height). Percentages are 100*x/W, 100*y/H, 100*w/W, 100*h/H of the native canvas. Signed delta = model minus source in percentage points. MAE = sum(abs(delta)) / (4 * number of boxes). Model boxes are the bounds of actual GLB vertices of the named scopes, occluded vertices included. Only the original BMPs define the measurements, never the 4x textures.

| View | Boxes | Baseline MAE (pp) | Final MAE (pp) |
|---|---:|---:|---:|
| 843_z_both, right | 15 | 0.216 | 0.216 |
| 843_x_both, front | 3 | 0.257 | 0.257 |
| 843_x_a, rear | 2 | 0.000 | 0.000 |
| All | 20 | 0.201 | 0.201 |

With the documented scales undone (side lengths / 1.0000, model heights / 1.0000, end-view widths / 1.0000: the published dimensions against the XML's), the final MAE is 0.201 pp over the same 20 boxes; the residual left is the transfer itself.

One pixel is 0.400 pp horizontally on the sides, 3.333 pp horizontally on the ends and 2.000 pp vertically.

Annotated views (generated locally, not committed):

- 843_z_both, right: [native](../../export/review/db_628/843_z_both-right-native.svg), [model](../../export/review/db_628/843_z_both-right-model.svg)
- 843_x_both, front: [native](../../export/review/db_628/843_x_both-front-native.svg), [model](../../export/review/db_628/843_x_both-front-model.svg)
- 843_x_a, rear: [native](../../export/review/db_628/843_x_a-rear-native.svg), [model](../../export/review/db_628/843_x_a-rear-model.svg)
- [Three-quarter view](../../export/review/db_628/three-quarter-front.png), [thumbnail](../../export/thumbs/veh-db-628.png)

| ID | View | Element | Native pixel edges | Mesh scope(s) | Source % (x,y,w,h) | Model % | Signed delta (pp) | Baseline abs. mean (pp) | Final abs. mean (pp) | Uncertainty |
|---|---|---|---|---|---|---|---|---:|---:|---|
| P01 | 843_z_both, right | cab side window (frame) | 10, 21, 16, 31 | `body/right-side/cab-window/frame` | 4.000, 42.000, 2.400, 20.000 | 4.000, 42.000, 2.400, 20.000 | -0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| P02 | 843_z_both, right | door 1 (outline) | 17, 20, 28, 44 | `body/right-side/doors/door-1/outline` | 6.800, 40.000, 4.400, 48.000 | 6.800, 40.000, 4.400, 48.000 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| P03 | 843_z_both, right | door 1 upper window (frame) | 19, 21, 26, 31 | `body/right-side/doors/door-1/window-1/frame` | 7.600, 42.000, 2.800, 20.000 | 7.600, 42.000, 2.800, 20.000 | 0.000, -0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| P04 | 843_z_both, right | door 1 lower window (frame) | 19, 35, 26, 41 | `body/right-side/doors/door-1/window-2/frame` | 7.600, 70.000, 2.800, 12.000 | 7.600, 70.400, 2.800, 11.600 | 0.000, 0.400, -0.000, -0.400 | 0.200 | 0.200 | Native pixel edge estimate; +/- one pixel. |
| P05 | 843_z_both, right | window 1 (frame) | 38, 21, 50, 31 | `body/right-side/windows/window-1/frame` | 15.200, 42.000, 4.800, 20.000 | 15.200, 42.000, 4.800, 20.000 | -0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| P06 | 843_z_both, right | window 5 (frame) | 117, 21, 129, 31 | `body/right-side/windows/window-5/frame` | 46.800, 42.000, 4.800, 20.000 | 46.800, 42.000, 4.800, 20.000 | 0.000, -0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| P07 | 843_z_both, right | window 9 (frame) | 185, 21, 197, 31 | `body/right-side/windows/window-9/frame` | 74.000, 42.000, 4.800, 20.000 | 74.000, 42.000, 4.800, 20.000 | 0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| P08 | 843_z_both, right | door 2 (outline) | 205, 20, 216, 44 | `body/right-side/doors/door-2/outline` | 82.000, 40.000, 4.400, 48.000 | 82.000, 40.000, 4.400, 48.000 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| P09 | 843_z_both, right | DB logo | 79, 36, 82, 38 | `body/right-side/logo` | 31.600, 72.000, 1.200, 4.000 | 31.600, 72.000, 1.200, 4.000 | -0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| P10 | 843_z_both, right | fuel filler panel | 59, 32, 64, 41 | `body/right-side/fuel-filler` | 23.600, 64.000, 2.000, 18.000 | 23.600, 64.000, 2.000, 18.000 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| P11 | 843_z_both, right | mint band (body, from the cab side window's column) | 9, 19, 221, 32 | `body/mint-band` | 3.600, 38.000, 84.800, 26.000 | 3.600, 37.950, 84.800, 26.000 | 0.000, -0.050, -0.000, -0.000 | 0.013 | 0.013 | Native pixel edge estimate; +/- one pixel. |
| P12 | 843_z_both, right | pale blue line | 9, 32, 221, 35 | `body/paleblue-band` | 3.600, 64.000, 84.800, 6.000 | 3.600, 63.950, 84.800, 6.000 | 0.000, -0.050, -0.000, -0.000 | 0.013 | 0.013 | Native pixel edge estimate; +/- one pixel. |
| P13 | 843_z_both, right | roof's grey edge | 14, 12, 221, 15 | `body/roof-band` | 5.600, 24.000, 82.800, 6.000 | 3.600, 24.000, 84.800, 6.950 | -2.000, 0.000, 2.000, 0.950 | 1.238 | 1.237 | The roof's curve is shaded in three greys; the edge is +/- one pixel, the nose end two. |
| P14 | 843_z_both, right | cab bogie wheels | 25, 43, 54, 50 | `running-gear/bogie-1/wheelset`, `running-gear/bogie-1/wheelset-2` | 10.000, 86.000, 11.600, 14.000 | 10.873, 84.732, 10.654, 15.268 | 0.873, -1.268, -0.946, 1.268 | 1.089 | 1.089 | Texture-painted running gear on a dark ground; the extent is +/- two pixels. |
| P15 | 843_z_both, right | inner bogie wheels | 178, 43, 205, 50 | `running-gear/bogie-2/wheelset`, `running-gear/bogie-2/wheelset-2` | 71.200, 86.000, 10.800, 14.000 | 71.273, 84.732, 10.654, 15.268 | 0.073, -1.268, -0.146, 1.268 | 0.689 | 0.689 | Texture-painted running gear on a dark ground; the extent is +/- two pixels. |
| F01 | 843_x_both, front | windscreen (black) | 1, 22, 29, 35 | `cab/windscreen` | 3.333, 36.667, 93.333, 21.667 | 4.000, 36.621, 92.000, 21.743 | 0.667, -0.046, -1.333, 0.076 | 0.531 | 0.530 | Native pixel edge estimate; +/- one pixel. |
| F02 | 843_x_both, front | front's pale blue line | 0, 40, 30, 42 | `body/nose/paleblue-band` | 0.000, 66.667, 100.000, 3.333 | 0.000, 66.350, 100.000, 3.600 | 0.000, -0.317, 0.000, 0.267 | 0.146 | 0.146 | Native pixel edge estimate; +/- one pixel. |
| F03 | 843_x_both, front | front's light grey | 0, 42, 30, 50 | `body/nose/nosegrey-band` | 0.000, 70.000, 100.000, 13.333 | 0.000, 69.950, 100.000, 13.000 | 0.000, -0.050, 0.000, -0.333 | 0.096 | 0.096 | Native pixel edge estimate; +/- one pixel. |
| R01 | 843_x_a, rear | gangway frame | 7, 21, 23, 50 | `rear-end/gangway` | 23.333, 35.000, 53.333, 48.333 | 23.333, 35.000, 53.333, 48.333 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R02 | 843_x_a, rear | gangway door (outline) | 9, 23, 21, 41 | `rear-end/end-door/outline` | 30.000, 38.333, 40.000, 30.000 | 30.000, 38.333, 40.000, 30.000 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
