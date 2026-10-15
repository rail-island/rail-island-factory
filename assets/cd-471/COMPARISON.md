# CD 471 motor car native reference comparison

**Covers** - native pixel annotations, baseline and final orthographic errors.
**Code** - `generator/emu471.ts`, `generator/emu680.ts`, `generator/emuComparison.ts`, `generator/emuReport.ts`.
**See also** - [source notes](SOURCES.md), [Czech electric units](../../docs/models/czech-emus.md).

Model geometry revision (SHA-256 of comparison GLB): `f9dee694b8572ae7037079b584290091d66ee378ef51192b0685cbded6d89884`.

Regenerate with `pnpm exec tsx generator/emuReport.ts cd_471`. The baseline is the first authored geometry (`native/cd_471/baseline.json`); baseline and final use the same annotations. Built with `unit=motorCar`, `variant=cd471` of `veh-cd-471`.

Canvases: sides 26 x 6 m (260 x 60 px), ends 3 x 6 m (30 x 60 px), including empty space, 0.1 m a pixel. Origin top left; x right, y down. Side u = 10 * (25.1 - (Factory X + 12.825)): the BMP has the cab at column 0, the model at +X; both sides use the same mapping, so the left (-Z) elevation is mirrored relative to an outside observer, as its BMP is. Ends are seen from outside: rear u = 10 * (z + 1.5), front u = 10 * (1.5 - z). v = 10 * (6 - y), physical heights: no scale is undone.

Each vector is (left, top, width, height). Percentages are 100*x/W, 100*y/H, 100*w/W, 100*h/H of the native canvas. Signed delta = model minus source in percentage points. MAE = sum(abs(delta)) / (4 * number of boxes). Model boxes are the bounds of actual GLB vertices of the named scopes, occluded vertices included. Only the original BMPs define the measurements, never the 4x textures.

| View | Boxes | Baseline MAE (pp) | Final MAE (pp) |
|---|---:|---:|---:|
| z_both, right | 23 | 0.620 | 0.620 |
| x_inc, front | 8 | 2.934 | 2.934 |
| x_dec, rear | 3 | 1.897 | 1.897 |
| All | 34 | 1.277 | 1.277 |

With the documented scales undone (side lengths / 1.0000, model heights / 0.9656, end-view widths / 0.9400: the published dimensions against the XML's), the final MAE is 0.424 pp over the same 34 boxes; the residual left is the transfer itself.

One pixel is 0.385 pp horizontally on the sides, 3.333 pp horizontally on the ends and 1.667 pp vertically.

Annotated views (generated locally, not committed):

- z_both, right: [native](../../export/review/cd_471/z_both-right-native.svg), [model](../../export/review/cd_471/z_both-right-model.svg)
- x_inc, front: [native](../../export/review/cd_471/x_inc-front-native.svg), [model](../../export/review/cd_471/x_inc-front-model.svg)
- x_dec, rear: [native](../../export/review/cd_471/x_dec-rear-native.svg), [model](../../export/review/cd_471/x_dec-rear-model.svg)
- [Three-quarter view](../../export/review/cd_471/three-quarter-front.png), [thumbnail](../../export/thumbs/veh-cd-471.png)

| ID | View | Element | Native pixel edges | Mesh scope(s) | Source % (x,y,w,h) | Model % | Signed delta (pp) | Baseline abs. mean (pp) | Final abs. mean (pp) | Uncertainty |
|---|---|---|---|---|---|---|---|---:|---:|---|
| R01 | z_both, right | upper window 1 (small) frame | 90, 17, 96, 24 | `body/right-side/upper-windows/window-1/frame` | 34.615, 28.333, 2.308, 11.667 | 34.615, 30.797, 2.308, 11.266 | -0.000, 2.464, 0.000, -0.401 | 0.716 | 0.716 | Native pixel edge estimate; +/- one pixel. |
| R02 | z_both, right | upper window 2 frame | 99, 17, 113, 26 | `body/right-side/upper-windows/window-2/frame` | 38.077, 28.333, 5.385, 15.000 | 38.077, 30.797, 5.385, 14.484 | 0.000, 2.464, -0.000, -0.516 | 0.745 | 0.745 | Native pixel edge estimate; +/- one pixel. |
| R03 | z_both, right | upper window 4 frame | 134, 17, 148, 26 | `body/right-side/upper-windows/window-4/frame` | 51.538, 28.333, 5.385, 15.000 | 51.538, 30.797, 5.385, 14.484 | 0.000, 2.464, 0.000, -0.516 | 0.745 | 0.745 | Native pixel edge estimate; +/- one pixel. |
| R04 | z_both, right | upper window 6 frame | 168, 17, 182, 26 | `body/right-side/upper-windows/window-6/frame` | 64.615, 28.333, 5.385, 15.000 | 64.615, 30.797, 5.385, 14.484 | 0.000, 2.464, 0.000, -0.516 | 0.745 | 0.745 | Native pixel edge estimate; +/- one pixel. |
| R05 | z_both, right | lower window 1 (small) frame | 67, 40, 74, 49 | `body/right-side/lower-windows/window-1/frame` | 25.769, 66.667, 2.692, 15.000 | 25.769, 67.813, 2.692, 14.484 | 0.000, 1.146, -0.000, -0.516 | 0.415 | 0.415 | Native pixel edge estimate; +/- one pixel. |
| R06 | z_both, right | lower window 2 frame | 99, 39, 113, 49 | `body/right-side/lower-windows/window-2/frame` | 38.077, 65.000, 5.385, 16.667 | 38.077, 66.203, 5.385, 16.094 | 0.000, 1.203, -0.000, -0.573 | 0.444 | 0.444 | Native pixel edge estimate; +/- one pixel. |
| R07 | z_both, right | lower window 5 frame | 151, 39, 165, 49 | `body/right-side/lower-windows/window-5/frame` | 58.077, 65.000, 5.385, 16.667 | 58.077, 66.203, 5.385, 16.094 | 0.000, 1.203, -0.000, -0.573 | 0.444 | 0.444 | Native pixel edge estimate; +/- one pixel. |
| R08 | z_both, right | door 1 outline | 76, 33, 92, 57 | `body/right-side/doors/door-1/outline` | 29.231, 55.000, 6.154, 40.000 | 29.231, 56.547, 6.154, 38.625 | -0.000, 1.547, 0.000, -1.375 | 0.730 | 0.730 | Native pixel edge estimate; +/- one pixel. |
| R09 | z_both, right | door 2 outline | 166, 33, 182, 57 | `body/right-side/doors/door-2/outline` | 63.846, 55.000, 6.154, 40.000 | 63.846, 56.547, 6.154, 38.625 | -0.000, 1.547, 0.000, -1.375 | 0.730 | 0.730 | Native pixel edge estimate; +/- one pixel. |
| R10 | z_both, right | door 1 canopy | 73, 32, 96, 33 | `body/right-side/doors/canopy-1` | 28.077, 53.333, 8.846, 1.667 | 28.077, 54.938, 8.846, 1.609 | 0.000, 1.604, -0.000, -0.057 | 0.415 | 0.415 | Native pixel edge estimate; +/- one pixel. |
| R11 | z_both, right | inner-end window 1 frame | 196, 28, 210, 37 | `body/right-side/end-windows/window-1/frame` | 75.385, 46.667, 5.385, 15.000 | 75.385, 48.500, 5.385, 14.484 | -0.000, 1.833, 0.000, -0.516 | 0.587 | 0.587 | Native pixel edge estimate; +/- one pixel. |
| R12 | z_both, right | inner-end window 2 frame | 223, 28, 237, 37 | `body/right-side/end-windows/window-2/frame` | 85.769, 46.667, 5.385, 15.000 | 85.769, 48.500, 5.385, 14.484 | -0.000, 1.833, 0.000, -0.516 | 0.587 | 0.587 | Native pixel edge estimate; +/- one pixel. |
| R13 | z_both, right | CD emblem panel | 212, 30, 221, 35 | `body/right-side/emblem` | 81.538, 50.000, 3.462, 8.333 | 81.538, 51.719, 3.462, 8.047 | 0.000, 1.719, -0.000, -0.286 | 0.501 | 0.501 | Native pixel edge estimate; +/- one pixel. |
| R14 | z_both, right | yellow line under the upper windows | 99, 26, 182, 27 | `body/right-side/paint-lines/yellow-line-1` | 38.077, 43.333, 31.923, 1.667 | 38.077, 45.281, 31.923, 1.609 | 0.000, 1.948, 0.000, -0.057 | 0.501 | 0.501 | Native pixel edge estimate; +/- one pixel. |
| R15 | z_both, right | red stripe, inner end | 186, 43, 250, 45 | `body/right-side/paint-lines/stripe-2` | 71.538, 71.667, 24.615, 3.333 | 71.538, 72.641, 24.615, 3.219 | -0.000, 0.974, 0.000, -0.115 | 0.272 | 0.272 | Native pixel edge estimate; +/- one pixel. |
| R16 | z_both, right | blue band between the decks | 3, 27, 250, 38 | `body/blue-band` | 1.154, 45.000, 95.000, 18.333 | 0.000, 46.849, 96.538, 17.703 | -1.154, 1.849, 1.538, -0.630 | 1.293 | 1.293 | The band runs onto the nose slope (to the tip at column 0) and the end wall (column 251), where the BMP paints it from column 3 to 250. |
| R17 | z_both, right | low-floor skirt | 52, 51, 201, 58 | `body/skirtdark-band/sweep-1`, `body/skirtdark-band/sweep-2`, `body/skirtdark-band/sweep-3`, `body/skirtdark-band/sweep-4`, `body/skirt-band/sweep-4`, `body/skirt-band/sweep-5`, `body/skirt-band/sweep-6`, `body/skirt-band/sweep-7` | 20.000, 85.000, 57.308, 11.667 | 20.000, 85.474, 57.308, 11.307 | 0.000, 0.474, -0.000, -0.359 | 0.208 | 0.208 | The skirt's sloped ends follow the XML elevation, not the painted outline; +/- one pixel. |
| R18 | z_both, right | cab side window frame | 6, 28, 16, 37 | `cab/right-cab-side/cab-window/frame` | 2.308, 46.667, 3.846, 15.000 | 2.308, 48.500, 3.846, 14.484 | -0.000, 1.833, 0.000, -0.516 | 0.587 | 0.587 | Native pixel edge estimate; +/- one pixel. |
| R19 | z_both, right | cab door window frame | 20, 29, 25, 38 | `cab/right-cab-side/cab-door/frame` | 7.692, 48.333, 1.923, 15.000 | 7.692, 50.109, 1.923, 14.484 | 0.000, 1.776, 0.000, -0.516 | 0.573 | 0.573 | Native pixel edge estimate; +/- one pixel. |
| R20 | z_both, right | pantograph well louvres | 209, 19, 235, 24 | `roof-equipment/well-louvres/right` | 80.385, 31.667, 10.000, 8.333 | 80.385, 34.016, 10.000, 8.047 | 0.000, 2.349, 0.000, -0.286 | 0.659 | 0.659 | Native pixel edge estimate; +/- one pixel. |
| R21 | z_both, right | roof louvres over the cab end | 23, 13, 50, 16 | `roof-louvres/right` | 8.846, 21.667, 10.385, 5.000 | 8.846, 24.359, 10.385, 4.828 | -0.000, 2.693, 0.000, -0.172 | 0.716 | 0.716 | Native pixel edge estimate; +/- one pixel. |
| R22 | z_both, right | cab-end bogie (drawn wheels and frame) | 12, 51, 45, 60 | `running-gear/bogie-2/wheelset`, `running-gear/bogie-2/wheelset-2`, `running-gear/bogie-2/frame` | 4.615, 85.000, 12.692, 15.000 | 4.592, 84.798, 13.508, 15.202 | -0.023, -0.202, 0.816, 0.202 | 0.311 | 0.311 | Drawn bogie silhouette; the model's bogie stands at the published 19.0 m pivots and 2.6 m wheelbase. |
| R23 | z_both, right | inner bogie (drawn wheels and frame) | 204, 52, 237, 60 | `running-gear/bogie-1/wheelset`, `running-gear/bogie-1/wheelset-2`, `running-gear/bogie-1/frame` | 78.462, 86.667, 12.692, 13.333 | 77.669, 84.798, 13.508, 15.202 | -0.793, -1.869, 0.816, 1.869 | 1.337 | 1.337 | Drawn bogie silhouette; the model's bogie stands at the published 19.0 m pivots and 2.6 m wheelbase. |
| F01 | x_inc, front | windscreen frame | 4, 27, 26, 37 | `cab/windscreen` | 13.333, 45.000, 73.333, 16.667 | 15.533, 46.867, 68.933, 15.973 | 2.200, 1.867, -4.400, -0.694 | 2.290 | 2.290 | Native pixel edge estimate; +/- one pixel. |
| F02 | x_inc, front | top lamp | 13, 20, 17, 24 | `cab/top-lamp` | 43.333, 33.333, 13.333, 6.667 | 43.733, 35.593, 12.533, 6.478 | 0.400, 2.260, -0.800, -0.189 | 0.912 | 0.912 | Native pixel edge estimate; +/- one pixel. |
| F03 | x_inc, front | visor bar over the lamp | 11, 17, 19, 19 | `cab/visor` | 36.667, 28.333, 26.667, 3.333 | 37.467, 31.036, 25.067, 2.713 | 0.800, 2.703, -1.600, -0.620 | 1.431 | 1.431 | Native pixel edge estimate; +/- one pixel. |
| F04 | x_inc, front | left lamp cluster | 2, 42, 11, 45 | `cab/lamps/lamp-2` | 6.667, 70.000, 30.000, 5.000 | 9.267, 71.031, 28.200, 4.828 | 2.600, 1.031, -1.800, -0.172 | 1.401 | 1.401 | Checkered lamp patch, three lenses; housing compared. |
| F05 | x_inc, front | right lamp cluster | 19, 42, 28, 45 | `cab/lamps/lamp-1` | 63.333, 70.000, 30.000, 5.000 | 62.533, 71.031, 28.200, 4.828 | -0.800, 1.031, -1.800, -0.172 | 0.951 | 0.951 | Checkered lamp patch, three lenses; housing compared. |
| F06 | x_inc, front | red stripe across the front | 0, 43, 30, 45 | `cab/front-stripe` | 0.000, 71.667, 100.000, 3.333 | 12.713, 72.464, 74.573, 3.231 | 12.713, 0.797, -25.427, -0.103 | 9.760 | 9.760 | The BMP paints the stripe across its whole 3 m canvas; the model holds it to the nose tip, 2.26 m wide in the XML plan. |
| F07 | x_inc, front | black lower front and apron | 1, 46, 29, 54 | `cab/lower-front`, `cab/apron/upper` | 3.333, 76.667, 93.333, 13.333 | 7.667, 76.798, 84.667, 13.546 | 4.333, 0.131, -8.667, 0.212 | 3.336 | 3.336 | Dark area spans the nose undercut and the apron. |
| F08 | x_inc, front | yellow apron edge | 1, 54, 29, 58 | `cab/apron/edge` | 3.333, 90.000, 93.333, 6.667 | 7.667, 90.344, 84.667, 6.438 | 4.333, 0.344, -8.667, -0.229 | 3.393 | 3.393 | Native pixel edge estimate; +/- one pixel. |
| B01 | x_dec, rear | gangway bellows frame | 9, 19, 21, 48 | `rear-end/gangway` | 30.000, 31.667, 40.000, 48.333 | 31.200, 34.016, 37.600, 46.672 | 1.200, 2.349, -2.400, -1.661 | 1.903 | 1.903 | Native pixel edge estimate; +/- one pixel. |
| B02 | x_dec, rear | end door | 11, 26, 19, 44 | `rear-end/end-door/outline` | 36.667, 43.333, 26.667, 30.000 | 37.467, 45.281, 25.067, 28.969 | 0.800, 1.948, -1.600, -1.031 | 1.345 | 1.345 | Native pixel edge estimate; +/- one pixel. |
| B03 | x_dec, rear | marker lamps | 4, 42, 26, 44 | `rear-end/marker-lamps` | 13.333, 70.000, 73.333, 3.333 | 15.433, 71.807, 69.133, 1.667 | 2.100, 1.807, -4.200, -1.667 | 2.443 | 2.443 | Two 2 px lamps; their joint bounds compared. |
