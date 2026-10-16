# Hadgs native reference comparison

**Covers** - native pixel annotations, baseline and final orthographic errors.
**Code** - `generator/freightWagons.ts`, `generator/hopperWagons.ts`, `generator/freightWagonParts.ts`, `generator/freightTransfers.ts`, `generator/csdCoachComparison.ts`, `generator/csdCoachReport.ts`.
**See also** - [source notes](SOURCES.md), [Freight wagons (container, flat, sliding-wall, hopper)](../../docs/models/freight-wagons.md).

Model geometry revision (SHA-256 of comparison GLB): `0c0f34ca7d437aff88723a4f62962dee89182c910b6b7f2206601f1d30328a2a`.

Regenerate with `pnpm exec tsx generator/csdCoachReport.ts n_hadgs`. The baseline is the first authored geometry (`native/n_hadgs/baseline.json`); baseline and final use the same annotations.

Canvases: sides 16.8 x 4.3 m (168 x 43 px), ends 3 x 4.3 m (30 x 43 px), including empty space, 0.1 m a pixel. Origin top left; x right, y down. Side u = 10 * source x = 10 * (Factory X + 8.4); both sides keep increasing source x, so the left (-Z) elevation is mirrored relative to an outside observer, as its BMP is. Ends are seen from outside: rear u = 10 * (z + 1.5), front u = 10 * (1.5 - z). v = 10 * (4.3 - y).

Each vector is (left, top, width, height). Percentages are 100*x/W, 100*y/H, 100*w/W, 100*h/H of the native canvas. Signed delta = model minus source in percentage points. MAE = sum(abs(delta)) / (4 * number of boxes). Model boxes are the bounds of actual GLB vertices of the named scopes, occluded vertices included. Only the original BMPs define the measurements, never the 4x textures.

| View | Boxes | Baseline MAE (pp) | Final MAE (pp) |
|---|---:|---:|---:|
| z_both, right | 8 | 0.306 | 0.306 |
| z_both, left | 8 | 0.306 | 0.306 |
| All | 16 | 0.306 | 0.306 |

One pixel is 0.595 pp horizontally on the sides, 3.333 pp horizontally on the ends and 2.326 pp vertically. The model was authored from these same measured boxes, so the residuals measure the transfer onto the XML clip shapes (0.1 m posts the BMPs paint wider, loads bounded by their XML hulls) and the deliberate mechanical choices (1.75 m buffer spacing, 920 mm wheels, the ISO 40 ft container, the 3.1 m width), not photographic accuracy.

Annotated views (generated locally, not committed):

- z_both, right: [native](../../export/review/n_hadgs/z_both-right-native.svg), [model](../../export/review/n_hadgs/z_both-right-model.svg)
- z_both, left: [native](../../export/review/n_hadgs/z_both-left-native.svg), [model](../../export/review/n_hadgs/z_both-left-model.svg)
- [Three-quarter view](../../export/review/n_hadgs/three-quarter.png), [thumbnail](../../export/thumbs/veh-hadgs-hopper-wagon.png)

| ID | View | Element | Native pixel edges | Mesh scope(s) | Source % (x,y,w,h) | Model % | Signed delta (pp) | Baseline abs. mean (pp) | Final abs. mean (pp) | Uncertainty |
|---|---|---|---|---|---|---|---|---:|---:|---|
| R01 | z_both, right | body | 3, 1, 165, 34 | `body/shell`, `body/roof`, `body/roof-ends` | 1.786, 2.326, 96.429, 76.744 | 1.786, -0.000, 96.429, 76.744 | -0.000, -2.326, 0.000, 0.000 | 0.581 | 0.581 | Rows 1..33; the XML roof ridge is at 4.3 m (row 0), the BMP paints from row 1. |
| R02 | z_both, right | roof band | 5, 1, 164, 4 | `body/roof` | 2.976, 2.326, 94.643, 6.977 | 2.976, -0.000, 94.643, 9.302 | -0.000, -2.326, 0.000, 2.326 | 1.163 | 1.163 | Rows 1..3 (3.9..4.2 m), columns 5..163: the roof ends at 0.3..0.5 and 16.4..16.5 m are body colour, as in the model. |
| R03 | z_both, right | post at 1.6 m | 16, 6, 17, 33 | `body/right-side/ribs/rib-2` | 9.524, 13.953, 0.595, 62.791 | 9.524, 13.953, 0.595, 62.791 | -0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R04 | z_both, right | post at 7.2 m | 72, 7, 73, 32 | `body/right-side/ribs/rib-4` | 42.857, 16.279, 0.595, 58.140 | 42.857, 16.279, 0.595, 58.140 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R05 | z_both, right | post at 9.7 m | 97, 7, 98, 32 | `body/right-side/ribs/rib-8` | 57.738, 16.279, 0.595, 58.140 | 57.738, 16.279, 0.595, 58.140 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R06 | z_both, right | post at 15.1 m | 151, 6, 152, 33 | `body/right-side/ribs/rib-10` | 89.881, 13.953, 0.595, 62.791 | 89.881, 13.953, 0.595, 62.791 | -0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R07 | z_both, right | door 1 stiffener at 3.1 m | 31, 7, 32, 33 | `body/right-side/door-1/frame/stiffener-1` | 18.452, 16.279, 0.595, 60.465 | 18.333, 16.279, 0.476, 58.140 | -0.119, 0.000, -0.119, -2.326 | 0.641 | 0.641 | Native pixel edge estimate; +/- one pixel. |
| R08 | z_both, right | door 2 stiffener at 10.9 m | 109, 7, 110, 32 | `body/right-side/door-2/frame/stiffener-1` | 64.881, 16.279, 0.595, 58.140 | 64.762, 16.279, 0.476, 58.140 | -0.119, 0.000, -0.119, -0.000 | 0.060 | 0.060 | Native pixel edge estimate; +/- one pixel. |
| L01 | z_both, left | body | 3, 1, 165, 34 | `body/shell`, `body/roof`, `body/roof-ends` | 1.786, 2.326, 96.429, 76.744 | 1.786, -0.000, 96.429, 76.744 | -0.000, -2.326, 0.000, 0.000 | 0.581 | 0.581 | Rows 1..33; the XML roof ridge is at 4.3 m (row 0), the BMP paints from row 1. |
| L02 | z_both, left | roof band | 5, 1, 164, 4 | `body/roof` | 2.976, 2.326, 94.643, 6.977 | 2.976, -0.000, 94.643, 9.302 | -0.000, -2.326, 0.000, 2.326 | 1.163 | 1.163 | Rows 1..3 (3.9..4.2 m), columns 5..163: the roof ends at 0.3..0.5 and 16.4..16.5 m are body colour, as in the model. |
| L03 | z_both, left | post at 1.6 m | 16, 6, 17, 33 | `body/left-side/ribs/rib-2` | 9.524, 13.953, 0.595, 62.791 | 9.524, 13.953, 0.595, 62.791 | -0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L04 | z_both, left | post at 7.2 m | 72, 7, 73, 32 | `body/left-side/ribs/rib-4` | 42.857, 16.279, 0.595, 58.140 | 42.857, 16.279, 0.595, 58.140 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L05 | z_both, left | post at 9.7 m | 97, 7, 98, 32 | `body/left-side/ribs/rib-8` | 57.738, 16.279, 0.595, 58.140 | 57.738, 16.279, 0.595, 58.140 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L06 | z_both, left | post at 15.1 m | 151, 6, 152, 33 | `body/left-side/ribs/rib-10` | 89.881, 13.953, 0.595, 62.791 | 89.881, 13.953, 0.595, 62.791 | -0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L07 | z_both, left | door 1 stiffener at 3.1 m | 31, 7, 32, 33 | `body/left-side/door-1/frame/stiffener-1` | 18.452, 16.279, 0.595, 60.465 | 18.333, 16.279, 0.476, 58.140 | -0.119, 0.000, -0.119, -2.326 | 0.641 | 0.641 | Native pixel edge estimate; +/- one pixel. |
| L08 | z_both, left | door 2 stiffener at 10.9 m | 109, 7, 110, 32 | `body/left-side/door-2/frame/stiffener-1` | 64.881, 16.279, 0.595, 58.140 | 64.762, 16.279, 0.476, 58.140 | -0.119, 0.000, -0.119, -0.000 | 0.060 | 0.060 | Native pixel edge estimate; +/- one pixel. |
