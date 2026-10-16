# TGV PSE power car native reference comparison

**Covers** - native pixel annotations, baseline and final orthographic errors.
**Code** - `generator/tgv.ts`, `generator/unitComparison.ts`, `generator/unitReport.ts`.
**See also** - [source notes](SOURCES.md), [foreign multiple units](../../docs/models/foreign-units.md).

Model geometry revision (SHA-256 of comparison GLB): `d6bfe87f45d8c80fe1254cee90286aace2690f7e11d040e878e6ad26c12ac1ad`.

Regenerate with `pnpm exec tsx generator/unitReport.ts tgv_loco`. The baseline is the geometry when the annotations were fixed (`native/tgv_loco/baseline.json`); baseline and final use the same annotations. Built with `unit=powerCar`, `livery=pse` of `veh-tgv`.

Canvases: sides 22 x 6 m (220 x 60 px), ends 3 x 6 m, including empty space, 0.1 m a pixel (an annotation with a metresPerRow field gives its canvas's row height). Origin top left; x right, y down. Side u = 10 * (22.00 - (Factory X + 11.075) / 1.0114): the BMP's cab at its left, the model's at +X; both sides use the same mapping, so the left (-Z) elevation is mirrored relative to an outside observer, as its BMP is. Ends are seen from outside: rear u = 10 * (z + W / 20), front u = 10 * (W / 20 - z), W the end canvas's width in pixels. v = 10 * (H - y), physical heights: no scale is undone.

Each vector is (left, top, width, height). Percentages are 100*x/W, 100*y/H, 100*w/W, 100*h/H of the native canvas. Signed delta = model minus source in percentage points. MAE = sum(abs(delta)) / (4 * number of boxes). Model boxes are the bounds of actual GLB vertices of the named scopes, occluded vertices included. Only the original BMPs define the measurements, never the 4x textures.

| View | Boxes | Baseline MAE (pp) | Final MAE (pp) |
|---|---:|---:|---:|
| tgv_z_dec, right | 11 | 0.683 | 0.540 |
| All | 11 | 0.683 | 0.540 |

With the documented scales undone (side lengths / 1.0114, model heights / 1.0000, end-view widths / 1.0000: the published dimensions against the XML's), the final MAE is 0.346 pp over the same 11 boxes; the residual left is the transfer itself.

One pixel is 0.455 pp horizontally on the sides, 3.333 pp horizontally on the ends and 1.667 pp vertically.

Annotated views (generated locally, not committed):

- tgv_z_dec, right: [native](../../export/review/tgv_loco/tgv_z_dec-right-native.svg), [model](../../export/review/tgv_loco/tgv_z_dec-right-model.svg)
- [Three-quarter view](../../export/review/tgv_loco/three-quarter-front.png), [thumbnail](../../export/thumbs/veh-tgv.png)

| ID | View | Element | Native pixel edges | Mesh scope(s) | Source % (x,y,w,h) | Model % | Signed delta (pp) | Baseline abs. mean (pp) | Final abs. mean (pp) | Uncertainty |
|---|---|---|---|---|---|---|---|---:|---:|---|
| P01 | tgv_z_dec, right | cab side windows | 30, 28, 49, 34 | `body/right-side/cab-windows/frame` | 13.636, 46.667, 8.636, 10.000 | 17.470, 46.667, 5.057, 10.000 | 3.834, -0.000, -3.579, 0.000 | 1.568 | 1.853 | Dark windows on the nose's dark shading; the front edge +/- two pixels. |
| P02 | tgv_z_dec, right | cab door (outline) | 58, 30, 64, 47 | `body/right-side/cab-door/outline` | 26.364, 50.000, 2.727, 28.333 | 26.894, 50.000, 2.529, 28.333 | 0.531, 0.000, -0.199, 0.000 | 0.203 | 0.182 | Native pixel edge estimate; +/- one pixel. |
| P03 | tgv_z_dec, right | machine room louvres | 65, 33, 170, 45 | `body/right-side/louvres/louvre-1` | 29.545, 55.000, 47.727, 20.000 | 29.883, 55.833, 48.272, 18.333 | 0.337, 0.833, 0.545, -1.667 | 0.962 | 0.846 | Native pixel edge estimate; +/- one pixel. |
| P04 | tgv_z_dec, right | roof grille | 64, 22, 134, 26 | `body/right-side/roof-grille` | 29.091, 36.667, 31.818, 6.667 | 29.423, 37.333, 32.181, 5.667 | 0.332, 0.667, 0.363, -1.000 | 0.710 | 0.590 | Native pixel edge estimate; +/- one pixel. |
| P05 | tgv_z_dec, right | TGV lettering | 179, 33, 204, 41 | `body/right-side/lettering` | 81.364, 55.000, 11.364, 13.333 | 82.299, 55.596, 11.487, 12.142 | 0.935, 0.596, 0.124, -1.191 | 1.204 | 0.711 | Native pixel edge estimate; +/- one pixel. |
| P06 | tgv_z_dec, right | grey band | 58, 33, 219, 45 | `body/band-band` | 26.364, 55.000, 73.182, 20.000 | 26.665, 54.958, 74.017, 20.000 | 0.301, -0.042, 0.835, 0.000 | 0.429 | 0.295 | Native pixel edge estimate; +/- one pixel. |
| P07 | tgv_z_dec, right | orange upper band | 58, 26, 219, 32 | `body/orangelight-band` | 26.364, 43.333, 73.182, 10.000 | 26.665, 43.292, 74.017, 10.000 | 0.301, -0.042, 0.835, -0.000 | 0.429 | 0.295 | Native pixel edge estimate; +/- one pixel. |
| P08 | tgv_z_dec, right | white band under the grey | 58, 45, 219, 49 | `body/white-band` | 26.364, 75.000, 73.182, 6.667 | 26.665, 74.958, 74.017, 6.667 | 0.301, -0.042, 0.835, 0.000 | 0.429 | 0.295 | Native pixel edge estimate; +/- one pixel. |
| P09 | tgv_z_dec, right | orange line | 58, 49, 219, 51 | `body/orangeline-band` | 26.364, 81.667, 73.182, 3.333 | 26.665, 81.625, 74.017, 3.333 | 0.301, -0.042, 0.835, -0.000 | 0.429 | 0.295 | Native pixel edge estimate; +/- one pixel. |
| P10 | tgv_z_dec, right | front bogie (XML gear clip) | 30, 51, 73, 60 | `running-gear/bogie-1` | 13.636, 85.000, 19.545, 15.000 | 13.810, 84.798, 19.273, 15.202 | 0.174, -0.202, -0.273, 0.202 | 0.597 | 0.213 | The XML's gear clip (frame and wheels, x 3.0..7.3 m); the BMP's wheels are painted dark on dark. |
| P11 | tgv_z_dec, right | rear bogie (XML gear clip) | 170, 51, 212, 60 | `running-gear/bogie-2` | 77.273, 85.000, 19.091, 15.000 | 78.173, 84.798, 19.273, 15.202 | 0.900, -0.202, 0.182, 0.202 | 0.554 | 0.372 | The XML's gear clip (x 17.0..21.2 m). |
