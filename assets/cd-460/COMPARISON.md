# CD 460 motor car native reference comparison

**Covers** - native pixel annotations, baseline and final orthographic errors.
**Code** - `generator/emu460.ts`, `generator/emuClassicKit.ts`, `generator/emuComparison.ts`, `generator/emuReport.ts`.
**See also** - [source notes](SOURCES.md), [older Czech electric units](../../docs/models/czech-emus-classic.md).

Model geometry revision (SHA-256 of comparison GLB): `af27df691844c3cd42ca1799577dffd903e4deb4fd88bfe64c8d6d1c59b36cc8`.

Regenerate with `pnpm exec tsx generator/emuReport.ts cd_460`. The baseline is the first authored geometry (`native/cd_460/baseline.json`); baseline and final use the same annotations. Built with `unit=motorCar`, `livery=cd` of `veh-cd-460`.

Canvases: sides 25 x 5 m (250 x 50 px), ends 3 x 5 m (30 x 50 px), including empty space, 0.1 m a pixel. Origin top left; x right, y down. Side u = 10 * (24.300 - (Factory X + 12.050)): the BMP has the cab at column 0, the model at +X; both sides use the same mapping, so the left (-Z) elevation is mirrored relative to an outside observer, as its BMP is. Ends are seen from outside: rear u = 10 * (z + 1.5), front u = 10 * (1.5 - z). v = 10 * (5 - y), physical heights: no scale is undone.

Each vector is (left, top, width, height). Percentages are 100*x/W, 100*y/H, 100*w/W, 100*h/H of the native canvas. Signed delta = model minus source in percentage points. MAE = sum(abs(delta)) / (4 * number of boxes). Model boxes are the bounds of actual GLB vertices of the named scopes, occluded vertices included. Only the original BMPs define the measurements, never the 4x textures.

| View | Boxes | Baseline MAE (pp) | Final MAE (pp) |
|---|---:|---:|---:|
| z_inc, right | 13 | 0.114 | 0.114 |
| x_dec, front | 8 | 1.245 | 0.995 |
| x_inc, rear | 2 | 1.000 | 1.000 |
| All | 23 | 0.585 | 0.498 |

With the documented scales undone (side lengths / 1.0000, model heights / 1.0000, end-view widths / 1.0000: the published dimensions against the XML's), the final MAE is 0.498 pp over the same 23 boxes; the residual left is the transfer itself.

One pixel is 0.400 pp horizontally on the sides, 3.333 pp horizontally on the ends and 2.000 pp vertically.

Annotated views (generated locally, not committed):

- z_inc, right: [native](../../export/review/cd_460/z_inc-right-native.svg), [model](../../export/review/cd_460/z_inc-right-model.svg)
- x_dec, front: [native](../../export/review/cd_460/x_dec-front-native.svg), [model](../../export/review/cd_460/x_dec-front-model.svg)
- x_inc, rear: [native](../../export/review/cd_460/x_inc-rear-native.svg), [model](../../export/review/cd_460/x_inc-rear-model.svg)
- [Three-quarter view](../../export/review/cd_460/three-quarter-front.png), [thumbnail](../../export/thumbs/veh-cd-460.png)

| ID | View | Element | Native pixel edges | Mesh scope(s) | Source % (x,y,w,h) | Model % | Signed delta (pp) | Baseline abs. mean (pp) | Final abs. mean (pp) | Uncertainty |
|---|---|---|---|---|---|---|---|---:|---:|---|
| S01 | z_inc, right | cab side window | 3, 19, 11, 26 | `body/right-side/cab-window/frame` | 1.200, 38.000, 3.200, 14.000 | 1.220, 38.000, 3.180, 14.000 | 0.020, 0.000, -0.020, -0.000 | 0.010 | 0.010 | Native pixel edge estimate; +/- one pixel. |
| S02 | z_inc, right | cab door outline | 18, 18, 26, 39 | `body/right-side/cab-door/outline` | 7.200, 36.000, 3.200, 42.000 | 7.220, 36.000, 3.180, 42.000 | 0.020, -0.000, -0.020, 0.000 | 0.010 | 0.010 | Native pixel edge estimate; +/- one pixel. |
| S03 | z_inc, right | window 1 frame | 42, 19, 55, 30 | `body/right-side/windows/window-1/frame` | 16.800, 38.000, 5.200, 22.000 | 16.800, 38.000, 5.200, 22.000 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| S04 | z_inc, right | luggage door outline | 64, 18, 79, 41 | `body/right-side/luggage-door/outline` | 25.600, 36.000, 6.000, 46.000 | 25.600, 36.000, 6.000, 45.900 | 0.000, -0.000, 0.000, -0.100 | 0.025 | 0.025 | Native pixel edge estimate; +/- one pixel. |
| S05 | z_inc, right | door 1 outline | 92, 18, 103, 39 | `body/right-side/doors/door-1/outline` | 36.800, 36.000, 4.400, 42.000 | 36.800, 36.000, 4.400, 42.000 | 0.000, -0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| S06 | z_inc, right | grille | 105, 18, 114, 38 | `body/right-side/grille/panel` | 42.000, 36.000, 3.600, 40.000 | 42.000, 36.000, 3.600, 40.000 | 0.000, -0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| S07 | z_inc, right | window 2 frame | 117, 19, 130, 30 | `body/right-side/windows/window-2/frame` | 46.800, 38.000, 5.200, 22.000 | 46.800, 38.000, 5.200, 22.000 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| S08 | z_inc, right | window 4 frame | 151, 19, 164, 30 | `body/right-side/windows/window-4/frame` | 60.400, 38.000, 5.200, 22.000 | 60.400, 38.000, 5.200, 22.000 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| S09 | z_inc, right | window 7 frame | 202, 19, 215, 30 | `body/right-side/windows/window-7/frame` | 80.800, 38.000, 5.200, 22.000 | 80.800, 38.000, 5.200, 22.000 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| S10 | z_inc, right | window 8 (narrow) frame | 219, 19, 226, 30 | `body/right-side/windows/window-8/frame` | 87.600, 38.000, 2.800, 22.000 | 87.600, 38.000, 2.800, 22.000 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| S11 | z_inc, right | door 2 outline | 230, 18, 240, 39 | `body/right-side/doors/door-2/outline` | 92.000, 36.000, 4.000, 42.000 | 92.000, 36.000, 4.000, 42.000 | 0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| S12 | z_inc, right | CD emblem | 44, 33, 50, 36 | `body/right-side/emblem` | 17.600, 66.000, 2.400, 6.000 | 17.997, 65.002, 2.033, 7.994 | 0.397, -0.998, -0.367, 1.994 | 0.939 | 0.939 | A 6 x 3 pixel emblem. |
| S13 | z_inc, right | equipment skirt | 59, 41, 189, 47 | `underframe/equipment-skirt` | 23.600, 82.000, 52.000, 12.000 | 23.600, 82.400, 52.000, 13.600 | 0.000, 0.400, 0.000, 1.600 | 0.500 | 0.500 | Grey on grey; bottom +/- one pixel. |
| F01 | x_dec, front | windscreen pane (left in the BMP) | 5, 19, 14, 27 | `cab/windscreen/slab-3` | 16.667, 38.000, 30.000, 16.000 | 20.667, 38.426, 26.000, 15.220 | 4.000, 0.426, -4.000, -0.780 | 3.301 | 2.302 | The BMP paints the pane onto the chamfered corner; the model holds it on the flat face, 0.88 m from the centre line. |
| F02 | x_dec, front | windscreen pane (right in the BMP) | 16, 19, 25, 27 | `cab/windscreen/slab-2` | 53.333, 38.000, 30.000, 16.000 | 53.333, 38.426, 26.000, 15.220 | 0.000, 0.426, -4.000, -0.780 | 2.301 | 1.302 | The BMP paints the pane onto the chamfered corner; the model holds it on the flat face, 0.88 m from the centre line. |
| F03 | x_dec, front | top lamp | 13, 10, 17, 14 | `cab/top-lamp` | 43.333, 20.000, 13.333, 8.000 | 43.333, 20.000, 13.333, 8.000 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| F04 | x_dec, front | grille box under the windscreen | 9, 28, 21, 32 | `cab/grille-box` | 30.000, 56.000, 40.000, 8.000 | 30.000, 56.000, 40.000, 8.000 | -0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| F05 | x_dec, front | lower grille | 9, 32, 21, 36 | `cab/lower-grille` | 30.000, 64.000, 40.000, 8.000 | 30.000, 64.800, 40.000, 7.200 | -0.000, 0.800, 0.000, -0.800 | 0.400 | 0.400 | Native pixel edge estimate; +/- one pixel. |
| F06 | x_dec, front | red lamp (left in the BMP) | 3, 33, 5, 35 | `cab/lamps/right/sweep-1` | 10.000, 66.000, 6.667, 4.000 | 12.000, 66.400, 5.333, 3.200 | 2.000, 0.400, -1.333, -0.800 | 1.133 | 1.133 | A 2 x 2 pixel lamp. |
| F07 | x_dec, front | head lamp (left in the BMP) | 6, 33, 8, 35 | `cab/lamps/right/sweep-2` | 20.000, 66.000, 6.667, 4.000 | 20.167, 66.100, 6.333, 3.800 | 0.167, 0.100, -0.333, -0.200 | 0.200 | 0.200 | A 2 x 2 pixel lamp. |
| F08 | x_dec, front | buffer (left in the BMP) | 3, 39, 8, 42 | `cab/buffers/buffers/right/head` | 10.000, 78.000, 16.667, 6.000 | 14.167, 77.000, 13.333, 8.000 | 4.167, -1.000, -3.333, 2.000 | 2.625 | 2.625 | Dark buffer on the dark beam. |
| R01 | x_inc, rear | end door leaves | 9, 19, 21, 34 | `rear-end/end-door/outline` | 30.000, 38.000, 40.000, 30.000 | 30.000, 38.000, 40.000, 30.000 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R02 | x_inc, rear | marker lamp (left in the BMP) | 4, 35, 6, 37 | `rear-end/marker-lamps/sweep-1` | 13.333, 70.000, 6.667, 4.000 | 15.000, 71.000, 3.333, 2.000 | 1.667, 1.000, -3.333, -2.000 | 2.000 | 2.000 | A 2 x 2 pixel lamp. |
