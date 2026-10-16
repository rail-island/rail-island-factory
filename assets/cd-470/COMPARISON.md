# CD 470 motor car native reference comparison

**Covers** - native pixel annotations, baseline and final orthographic errors.
**Code** - `generator/emu470.ts`, `generator/emuClassicKit.ts`, `generator/emuComparison.ts`, `generator/emuReport.ts`.
**See also** - [source notes](SOURCES.md), [older Czech electric units](../../docs/models/czech-emus-classic.md).

Model geometry revision (SHA-256 of comparison GLB): `df7eface4142669876293cda7730d036aecb60c494d238bf6e6cf6e28612a816`.

Regenerate with `pnpm exec tsx generator/emuReport.ts cd_470`. The baseline is the first authored geometry (`native/cd_470/baseline.json`); baseline and final use the same annotations. Built with `unit=motorCar` of `veh-cd-470`.

Canvases: sides 25 x 6 m (250 x 60 px), ends 3 x 6 m (30 x 60 px), including empty space, 0.1 m a pixel. Origin top left; x right, y down. Side u = 10 * (26.184 - (Factory X + 12.984)): the BMP has the cab at column 0, the model at +X; both sides use the same mapping, so the left (-Z) elevation is mirrored relative to an outside observer, as its BMP is. Ends are seen from outside: rear u = 10 * (z + 1.5), front u = 10 * (1.5 - z). v = 10 * (6 - y), physical heights: no scale is undone.

Each vector is (left, top, width, height). Percentages are 100*x/W, 100*y/H, 100*w/W, 100*h/H of the native canvas. Signed delta = model minus source in percentage points. MAE = sum(abs(delta)) / (4 * number of boxes). Model boxes are the bounds of actual GLB vertices of the named scopes, occluded vertices included. Only the original BMPs define the measurements, never the 4x textures.

| View | Boxes | Baseline MAE (pp) | Final MAE (pp) |
|---|---:|---:|---:|
| z_both, right | 14 | 1.354 | 1.059 |
| x_inc, front | 7 | 0.427 | 0.141 |
| x_dec, rear | 1 | 0.000 | 0.000 |
| All | 22 | 0.998 | 0.719 |

With the documented scales undone (side lengths / 1.0776, model heights / 1.0000, end-view widths / 1.0000: the published dimensions against the XML's), the final MAE is 0.055 pp over the same 22 boxes; the residual left is the transfer itself.

One pixel is 0.400 pp horizontally on the sides, 3.333 pp horizontally on the ends and 1.667 pp vertically.

Annotated views (generated locally, not committed):

- z_both, right: [native](../../export/review/cd_470/z_both-right-native.svg), [model](../../export/review/cd_470/z_both-right-model.svg)
- x_inc, front: [native](../../export/review/cd_470/x_inc-front-native.svg), [model](../../export/review/cd_470/x_inc-front-model.svg)
- x_dec, rear: [native](../../export/review/cd_470/x_dec-rear-native.svg), [model](../../export/review/cd_470/x_dec-rear-model.svg)
- [Three-quarter view](../../export/review/cd_470/three-quarter-front.png), [thumbnail](../../export/thumbs/veh-cd-470.png)

| ID | View | Element | Native pixel edges | Mesh scope(s) | Source % (x,y,w,h) | Model % | Signed delta (pp) | Baseline abs. mean (pp) | Final abs. mean (pp) | Uncertainty |
|---|---|---|---|---|---|---|---|---:|---:|---|
| S01 | z_both, right | cab side window | 5, 29, 9, 34 | `body/right-side/cab-window/frame` | 2.000, 48.333, 1.600, 8.333 | 2.155, 48.333, 1.724, 8.333 | 0.155, 0.000, 0.124, 0.000 | 0.070 | 0.070 | Small window beside the cab door; +/- one pixel. |
| S02 | z_both, right | cab door outline | 10, 28, 17, 51 | `body/right-side/cab-door/outline` | 4.000, 46.667, 2.800, 38.333 | 4.310, 46.667, 2.997, 37.667 | 0.310, -0.000, 0.197, -0.667 | 0.152 | 0.294 | Traced from the door's handrails; +/- one pixel. |
| S03 | z_both, right | louvre 1 (machine room) | 38, 29, 51, 47 | `body/right-side/louvres/louvre-1/panel` | 15.200, 48.333, 5.200, 30.000 | 16.379, 48.333, 5.603, 30.000 | 1.179, 0.000, 0.403, -0.000 | 0.396 | 0.396 | Native pixel edge estimate; +/- one pixel. |
| S04 | z_both, right | window 1 (small) frame | 54, 29, 59, 40 | `body/right-side/windows/window-1/frame` | 21.600, 48.333, 2.000, 18.333 | 23.275, 48.333, 2.155, 18.333 | 1.675, 0.000, 0.155, -0.000 | 0.458 | 0.458 | Native pixel edge estimate; +/- one pixel. |
| S05 | z_both, right | door 1 outline | 64, 34, 79, 56 | `body/right-side/doors/door-1/outline` | 25.600, 56.667, 6.000, 36.667 | 27.585, 56.667, 6.465, 36.667 | 1.985, 0.000, 0.465, -0.000 | 0.613 | 0.613 | Native pixel edge estimate; +/- one pixel. |
| S06 | z_both, right | window 2 frame | 81, 36, 94, 47 | `body/right-side/windows/window-2/frame` | 32.400, 60.000, 5.200, 18.333 | 34.913, 60.000, 5.603, 18.333 | 2.513, -0.000, 0.403, 0.000 | 0.729 | 0.729 | Native pixel edge estimate; +/- one pixel. |
| S07 | z_both, right | window 4 frame | 116, 36, 129, 47 | `body/right-side/windows/window-4/frame` | 46.400, 60.000, 5.200, 18.333 | 49.998, 60.000, 5.603, 18.333 | 3.598, -0.000, 0.403, 0.000 | 1.000 | 1.000 | Native pixel edge estimate; +/- one pixel. |
| S08 | z_both, right | window 6 frame | 150, 36, 163, 47 | `body/right-side/windows/window-6/frame` | 60.000, 60.000, 5.200, 18.333 | 64.653, 60.000, 5.603, 18.333 | 4.653, -0.000, 0.403, 0.000 | 1.264 | 1.264 | Native pixel edge estimate; +/- one pixel. |
| S09 | z_both, right | door 2 outline | 165, 34, 180, 56 | `body/right-side/doors/door-2/outline` | 66.000, 56.667, 6.000, 36.667 | 71.118, 56.667, 6.465, 36.667 | 5.118, 0.000, 0.465, -0.000 | 1.396 | 1.396 | Native pixel edge estimate; +/- one pixel. |
| S10 | z_both, right | window 7 frame | 186, 29, 194, 38 | `body/right-side/windows/window-7/frame` | 74.400, 48.333, 3.200, 15.000 | 80.170, 48.333, 3.448, 15.000 | 5.770, 0.000, 0.248, -0.000 | 1.504 | 1.504 | Native pixel edge estimate; +/- one pixel. |
| S11 | z_both, right | window 8 frame | 197, 29, 210, 38 | `body/right-side/windows/window-8/frame` | 78.800, 48.333, 5.200, 15.000 | 84.911, 48.333, 5.603, 15.000 | 6.111, 0.000, 0.403, -0.000 | 1.628 | 1.629 | Native pixel edge estimate; +/- one pixel. |
| S12 | z_both, right | louvre 2 (inner end) | 214, 29, 222, 47 | `body/right-side/louvres/louvre-2/panel` | 85.600, 48.333, 3.200, 30.000 | 92.238, 48.333, 3.448, 30.000 | 6.638, 0.000, 0.248, -0.000 | 1.722 | 1.722 | Native pixel edge estimate; +/- one pixel. |
| S13 | z_both, right | yellow band | 17, 27, 243, 33 | `body/yellow-band` | 6.800, 45.000, 90.400, 10.000 | 7.327, 44.958, 97.411, 10.000 | 0.527, -0.042, 7.011, -0.000 | 3.140 | 1.895 | The BMP starts the band behind the cab door; the model's body band starts at the cab section. |
| S14 | z_both, right | raised roof at the inner end | 214, 13, 243, 19 | `roof-equipment/raised-roof` | 85.600, 21.667, 11.600, 10.000 | 92.238, 21.667, 12.370, 10.000 | 6.638, 0.000, 0.770, -0.000 | 4.886 | 1.852 | The model follows the BMP, which draws it from column 214; the XML clips it from 22.6 m (column 226). |
| F01 | x_inc, front | windscreen frame | 3, 24, 27, 35 | `cab/windscreen/slab-1` | 10.000, 40.000, 80.000, 18.333 | 10.000, 40.066, 80.000, 18.279 | -0.000, 0.066, 0.000, -0.054 | 0.030 | 0.030 | Native pixel edge estimate; +/- one pixel. |
| F02 | x_inc, front | windscreen pane (left in the BMP) | 4, 25, 14, 34 | `cab/windscreen/slab-3` | 13.333, 41.667, 33.333, 15.000 | 13.333, 41.625, 33.333, 15.018 | -0.000, -0.041, 0.000, 0.018 | 0.015 | 0.015 | Native pixel edge estimate; +/- one pixel. |
| F03 | x_inc, front | windscreen pane (right in the BMP) | 16, 25, 26, 34 | `cab/windscreen/slab-2` | 53.333, 41.667, 33.333, 15.000 | 53.333, 41.625, 33.333, 15.018 | 0.000, -0.041, 0.000, 0.018 | 0.015 | 0.015 | Native pixel edge estimate; +/- one pixel. |
| F04 | x_inc, front | top lamp | 13, 21, 17, 23 | `cab/top-lamp` | 43.333, 35.000, 13.333, 3.333 | 43.333, 35.603, 13.333, 3.412 | -0.000, 0.603, 0.000, 0.079 | 0.170 | 0.171 | A 4 x 2 pixel lamp. |
| F05 | x_inc, front | white lamp (left in the BMP) | 2, 40, 4, 42 | `cab/lamps/right/sweep-1` | 6.667, 66.667, 6.667, 3.333 | 7.000, 66.500, 6.000, 3.000 | 0.333, -0.167, -0.667, -0.333 | 1.333 | 0.375 | A 2 x 2 pixel lamp. |
| F06 | x_inc, front | red lamp (left in the BMP) | 2, 43, 4, 45 | `cab/lamps/right/sweep-2` | 6.667, 71.667, 6.667, 3.333 | 7.000, 71.833, 6.000, 3.000 | 0.333, 0.167, -0.667, -0.333 | 1.417 | 0.375 | A 2 x 2 pixel lamp. |
| F07 | x_inc, front | yellow band | 0, 39, 30, 46 | `body/cab/yellow-band`, `body/lower-front/yellow-band` | 0.000, 65.000, 100.000, 11.667 | 0.000, 64.958, 100.000, 11.667 | 0.000, -0.042, 0.000, -0.000 | 0.011 | 0.010 | Native pixel edge estimate; +/- one pixel. |
| R01 | x_dec, rear | end door outline | 9, 27, 21, 46 | `rear-end/end-door/outline` | 30.000, 45.000, 40.000, 31.667 | 30.000, 45.000, 40.000, 31.667 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
