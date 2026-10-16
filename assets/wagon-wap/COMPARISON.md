# Wap - full#2 native reference comparison

**Covers** - native pixel annotations, baseline and final orthographic errors.
**Code** - `generator/freightWagons.ts`, `generator/hopperWagons.ts`, `generator/freightWagonParts.ts`, `generator/freightTransfers.ts`, `generator/csdCoachComparison.ts`, `generator/csdCoachReport.ts`.
**See also** - [source notes](SOURCES.md), [Freight wagons (container, flat, sliding-wall, hopper)](../../docs/models/freight-wagons.md).

Model geometry revision (SHA-256 of comparison GLB): `a77819ec19176d250e978fa001200e560a229babd64e5f22f0063e4f62443e6b`.

Regenerate with `pnpm exec tsx generator/csdCoachReport.ts n_wap-full_2`. The baseline is the first authored geometry (`native/n_wap-full_2/baseline.json`); baseline and final use the same annotations.

Canvases: sides 14 x 5 m (140 x 50 px), ends 3 x 5 m (30 x 50 px), including empty space, 0.1 m a pixel. Origin top left; x right, y down. Side u = 10 * source x = 10 * (Factory X + 6.75); both sides keep increasing source x, so the left (-Z) elevation is mirrored relative to an outside observer, as its BMP is. Ends are seen from outside: rear u = 10 * (z + 1.5), front u = 10 * (1.5 - z). v = 10 * (5 - y).

Each vector is (left, top, width, height). Percentages are 100*x/W, 100*y/H, 100*w/W, 100*h/H of the native canvas. Signed delta = model minus source in percentage points. MAE = sum(abs(delta)) / (4 * number of boxes). Model boxes are the bounds of actual GLB vertices of the named scopes, occluded vertices included. Only the original BMPs define the measurements, never the 4x textures.

| View | Boxes | Baseline MAE (pp) | Final MAE (pp) |
|---|---:|---:|---:|
| z_both, right | 4 | 0.067 | 0.067 |
| z_both, left | 4 | 0.067 | 0.067 |
| All | 8 | 0.067 | 0.067 |

One pixel is 0.714 pp horizontally on the sides, 3.333 pp horizontally on the ends and 2.000 pp vertically. The model was authored from these same measured boxes, so the residuals measure the transfer onto the XML clip shapes (0.1 m posts the BMPs paint wider, loads bounded by their XML hulls) and the deliberate mechanical choices (1.75 m buffer spacing, 920 mm wheels, the ISO 40 ft container, the 3.1 m width), not photographic accuracy.

Annotated views (generated locally, not committed):

- z_both, right: [native](../../export/review/n_wap-full_2/z_both-right-native.svg), [model](../../export/review/n_wap-full_2/z_both-right-model.svg)
- z_both, left: [native](../../export/review/n_wap-full_2/z_both-left-native.svg), [model](../../export/review/n_wap-full_2/z_both-left-model.svg)
- [Three-quarter view](../../export/review/n_wap-full_2/three-quarter.png), [thumbnail](../../export/thumbs/veh-wap-hopper-wagon.png)

| ID | View | Element | Native pixel edges | Mesh scope(s) | Source % (x,y,w,h) | Model % | Signed delta (pp) | Baseline abs. mean (pp) | Final abs. mean (pp) | Uncertainty |
|---|---|---|---|---|---|---|---|---:|---:|---|
| R01 | z_both, right | upper bulge | 9, 9, 133, 20 | `body/upper` | 6.429, 18.000, 88.571, 22.000 | 6.429, 18.000, 88.571, 22.000 | 0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Rows 9..19; at row 15 (3.5 m) the BMP spans columns 10..131. |
| R02 | z_both, right | flap 1 | 15, 24, 67, 38 | `body/right-side-flaps/flap-1` | 10.714, 48.000, 37.143, 28.000 | 10.714, 48.000, 37.500, 28.000 | 0.000, 0.000, 0.357, -0.000 | 0.089 | 0.089 | Native pixel edge estimate; +/- one pixel. |
| R03 | z_both, right | flap 2 | 75, 24, 127, 38 | `body/right-side-flaps/flap-2` | 53.571, 48.000, 37.143, 28.000 | 53.214, 48.000, 37.500, 28.000 | -0.357, 0.000, 0.357, -0.000 | 0.179 | 0.179 | Native pixel edge estimate; +/- one pixel. |
| R04 | z_both, right | centre post | 68, 20, 74, 41 | `body/right-side-flaps/post` | 48.571, 40.000, 4.286, 42.000 | 48.571, 40.000, 4.286, 42.000 | 0.000, 0.000, -0.000, 0.000 | 0.000 | 0.000 | Columns 68..73 at row 30. |
| L01 | z_both, left | upper bulge | 9, 9, 133, 20 | `body/upper` | 6.429, 18.000, 88.571, 22.000 | 6.429, 18.000, 88.571, 22.000 | 0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Rows 9..19; at row 15 (3.5 m) the BMP spans columns 10..131. |
| L02 | z_both, left | flap 1 | 15, 24, 67, 38 | `body/left-side-flaps/flap-1` | 10.714, 48.000, 37.143, 28.000 | 10.714, 48.000, 37.500, 28.000 | 0.000, 0.000, 0.357, -0.000 | 0.089 | 0.089 | Native pixel edge estimate; +/- one pixel. |
| L03 | z_both, left | flap 2 | 75, 24, 127, 38 | `body/left-side-flaps/flap-2` | 53.571, 48.000, 37.143, 28.000 | 53.214, 48.000, 37.500, 28.000 | -0.357, 0.000, 0.357, -0.000 | 0.179 | 0.179 | Native pixel edge estimate; +/- one pixel. |
| L04 | z_both, left | centre post | 68, 20, 74, 41 | `body/left-side-flaps/post` | 48.571, 40.000, 4.286, 42.000 | 48.571, 40.000, 4.286, 42.000 | 0.000, 0.000, -0.000, 0.000 | 0.000 | 0.000 | Columns 68..73 at row 30. |
