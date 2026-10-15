# CD 681 end car native reference comparison

**Covers** - native pixel annotations, baseline and final orthographic errors.
**Code** - `generator/emu471.ts`, `generator/emu680.ts`, `generator/emuComparison.ts`, `generator/emuReport.ts`.
**See also** - [source notes](SOURCES.md), [Czech electric units](../../docs/models/czech-emus.md).

Model geometry revision (SHA-256 of comparison GLB): `99e473bf5536d6753cebfaca7f967dd53487c625ecd8b607e30b19fdac359fc6`.

Regenerate with `pnpm exec tsx generator/emuReport.ts cd_681`. The baseline is the first authored geometry (`native/cd_681/baseline.json`); baseline and final use the same annotations. Built with `unit=endCar` of `veh-cd-680`.

Canvases: sides 25 x 5 m (250 x 50 px), ends 3 x 5 m (30 x 50 px), including empty space, 0.1 m a pixel. Origin top left; x right, y down. Side u = 10 * (27.70 - (Factory X + 13.85)): the cab tip at column 0, the model at +X; both sides use the same mapping, so the left (-Z) elevation is mirrored relative to an outside observer, as its BMP is. Ends are seen from outside: rear u = 10 * (z + 1.5), front u = 10 * (1.5 - z). v = 10 * (5 - y), physical heights: no scale is undone.

Each vector is (left, top, width, height). Percentages are 100*x/W, 100*y/H, 100*w/W, 100*h/H of the native canvas. Signed delta = model minus source in percentage points. MAE = sum(abs(delta)) / (4 * number of boxes). Model boxes are the bounds of actual GLB vertices of the named scopes, occluded vertices included. Only the original BMPs define the measurements, never the 4x textures.

| View | Boxes | Baseline MAE (pp) | Final MAE (pp) |
|---|---:|---:|---:|
| z_inc, right | 15 | 1.748 | 1.748 |
| x_inc, front | 5 | 1.723 | 1.723 |
| x_dec, rear | 3 | 2.222 | 2.222 |
| All | 23 | 1.804 | 1.804 |

With the documented scales undone (side lengths / 1.1080, model heights / 1.0000, end-view widths / 0.9333: the published dimensions against the XML's), the final MAE is 0.161 pp over the same 23 boxes; the residual left is the transfer itself.

One pixel is 0.400 pp horizontally on the sides, 3.333 pp horizontally on the ends and 2.000 pp vertically.

Annotated views (generated locally, not committed):

- z_inc, right: [native](../../export/review/cd_681/z_inc-right-native.svg), [model](../../export/review/cd_681/z_inc-right-model.svg)
- x_inc, front: [native](../../export/review/cd_681/x_inc-front-native.svg), [model](../../export/review/cd_681/x_inc-front-model.svg)
- x_dec, rear: [native](../../export/review/cd_681/x_dec-rear-native.svg), [model](../../export/review/cd_681/x_dec-rear-model.svg)
- [Three-quarter view](../../export/review/cd_681/three-quarter-front.png), [thumbnail](../../export/thumbs/veh-cd-680.png)

| ID | View | Element | Native pixel edges | Mesh scope(s) | Source % (x,y,w,h) | Model % | Signed delta (pp) | Baseline abs. mean (pp) | Final abs. mean (pp) | Uncertainty |
|---|---|---|---|---|---|---|---|---:|---:|---|
| P01 | z_inc, right | window 1 (short) glass | 63, 24, 69, 28 | `body/right-side/windows/window-1` | 25.200, 48.000, 2.400, 8.000 | 27.922, 48.000, 2.659, 8.000 | 2.722, 0.000, 0.259, -0.000 | 0.745 | 0.745 | Native pixel edge estimate; +/- one pixel. |
| P02 | z_inc, right | window 2 glass | 80, 24, 89, 28 | `body/right-side/windows/window-2` | 32.000, 48.000, 3.600, 8.000 | 35.456, 48.000, 3.989, 8.000 | 3.456, 0.000, 0.389, -0.000 | 0.961 | 0.961 | Native pixel edge estimate; +/- one pixel. |
| P03 | z_inc, right | window 5 glass | 134, 24, 143, 28 | `body/right-side/windows/window-5` | 53.600, 48.000, 3.600, 8.000 | 59.389, 48.000, 3.989, 8.000 | 5.789, 0.000, 0.389, -0.000 | 1.544 | 1.544 | Native pixel edge estimate; +/- one pixel. |
| P04 | z_inc, right | window 9 glass | 206, 24, 215, 28 | `body/right-side/windows/window-9` | 82.400, 48.000, 3.600, 8.000 | 91.299, 48.000, 3.989, 8.000 | 8.899, 0.000, 0.389, -0.000 | 2.322 | 2.322 | Native pixel edge estimate; +/- one pixel. |
| P05 | z_inc, right | entrance door outline | 236, 17, 246, 48 | `body/right-side/doors/door-1/outline` | 94.400, 34.000, 4.000, 62.000 | 104.595, 34.000, 4.432, 61.900 | 10.195, 0.000, 0.432, -0.100 | 2.682 | 2.682 | Native pixel edge estimate; +/- one pixel. |
| P06 | z_inc, right | entrance door window | 239, 24, 242, 31 | `body/right-side/doors/door-1/window` | 95.600, 48.000, 1.200, 14.000 | 105.925, 48.000, 1.330, 14.000 | 10.325, 0.000, 0.130, -0.000 | 2.614 | 2.614 | Native pixel edge estimate; +/- one pixel. |
| P07 | z_inc, right | cab door outline | 28, 20, 35, 40 | `cab/right-cab-door/outline` | 11.200, 40.000, 2.800, 40.000 | 12.410, 40.000, 3.102, 40.000 | 1.210, 0.000, 0.302, 0.000 | 0.378 | 0.378 | Native pixel edge estimate; +/- one pixel. |
| P08 | z_inc, right | CD emblem | 182, 33, 188, 38 | `body/right-side/emblem` | 72.800, 66.000, 2.400, 10.000 | 80.989, 66.002, 2.542, 9.993 | 8.189, 0.002, 0.142, -0.007 | 2.085 | 2.085 | Native pixel edge estimate; +/- one pixel. |
| P09 | z_inc, right | skirt panels between the bogies | 64, 43, 184, 47 | `body/right-side/skirt-panels` | 25.600, 86.000, 48.000, 8.000 | 28.365, 86.000, 53.627, 8.000 | 2.765, 0.000, 5.627, -0.000 | 2.098 | 2.098 | Native pixel edge estimate; +/- one pixel. |
| P10 | z_inc, right | sign by the door | 230, 24, 232, 28 | `body/right-side/signs` | 92.000, 48.000, 0.800, 8.000 | 101.936, 48.000, 0.886, 8.000 | 9.936, 0.000, 0.086, -0.000 | 2.506 | 2.506 | Native pixel edge estimate; +/- one pixel. |
| P11 | z_inc, right | roof cover | 96, 10, 183, 15 | `roof-equipment/roof-cover-1` | 38.400, 20.000, 34.800, 10.000 | 42.547, 20.000, 38.558, 10.000 | 4.147, 0.000, 3.758, 0.000 | 1.976 | 1.976 | Native pixel edge estimate; +/- one pixel. |
| P12 | z_inc, right | window band (black) | 48, 20, 249, 31 | `body/band-band` | 19.200, 40.000, 80.400, 22.000 | 22.160, 39.950, 88.197, 22.000 | 2.960, -0.050, 7.797, 0.000 | 2.702 | 2.702 | The band's model scope runs under the door to the gangway; +/- one pixel. |
| P13 | z_inc, right | nose silhouette with the plough | 0, 14, 25, 48 | `cab/nose`, `cab/plough` | 0.000, 28.000, 10.000, 68.000 | -0.000, 28.000, 11.080, 68.200 | -0.000, 0.000, 1.080, 0.200 | 0.320 | 0.320 | The nose's dark silhouette, including its roof edge; estimate. |
| P14 | z_inc, right | cab-end bogie (drawn) | 20, 41, 57, 50 | `running-gear/bogie-1/wheelset`, `running-gear/bogie-1/wheelset-2`, `running-gear/bogie-1/frame` | 8.000, 82.000, 14.800, 18.000 | 9.042, 82.352, 15.600, 17.648 | 1.042, 0.352, 0.800, -0.352 | 0.637 | 0.637 | Drawn bogie silhouette; the model's bogie has the published 2.7 m wheelbase. |
| P15 | z_inc, right | inner bogie (drawn) | 197, 41, 233, 50 | `running-gear/bogie-2/wheelset`, `running-gear/bogie-2/wheelset-2`, `running-gear/bogie-2/frame` | 78.800, 82.000, 14.400, 18.000 | 87.488, 82.352, 15.600, 17.648 | 8.688, 0.352, 1.200, -0.352 | 2.648 | 2.648 | Drawn bogie silhouette; the model's bogie has the published 2.7 m wheelbase. |
| Q01 | x_inc, front | windscreen frame | 2, 19, 28, 30 | `cab/windscreen` | 6.667, 38.000, 86.667, 22.000 | 9.556, 37.913, 80.889, 20.144 | 2.889, -0.087, -5.778, -1.856 | 2.652 | 2.652 | Native pixel edge estimate; +/- one pixel. |
| Q02 | x_inc, front | left lamp | 2, 33, 7, 36 | `cab/lamps/lamp-1` | 6.667, 66.000, 16.667, 6.000 | 9.556, 66.000, 15.556, 6.000 | 2.889, -0.000, -1.111, 0.000 | 1.000 | 1.000 | Two 2 px lenses; the housing compared. |
| Q03 | x_inc, front | right lamp | 23, 33, 28, 36 | `cab/lamps/lamp-2` | 76.667, 66.000, 16.667, 6.000 | 74.889, 66.000, 15.556, 6.000 | -1.778, -0.000, -1.111, 0.000 | 0.722 | 0.722 | Two 2 px lenses; the housing compared. |
| Q04 | x_inc, front | roof cover (cab view) | 5, 10, 25, 15 | `roof-equipment/roof-cover-1` | 16.667, 20.000, 66.667, 10.000 | 18.889, 20.000, 62.222, 10.000 | 2.222, 0.000, -4.444, 0.000 | 1.667 | 1.667 | Native pixel edge estimate; +/- one pixel. |
| Q05 | x_inc, front | teal lower nose and plough | 0, 40, 30, 48 | `cab/nose/teal-band`, `cab/plough` | 0.000, 80.000, 100.000, 16.000 | 3.333, 79.950, 93.333, 16.250 | 3.333, -0.050, -6.667, 0.250 | 2.575 | 2.575 | Native pixel edge estimate; +/- one pixel. |
| G01 | x_dec, rear | gangway door frame | 4, 17, 26, 39 | `rear-end/door-frame/outline` | 13.333, 34.000, 73.333, 44.000 | 17.333, 34.800, 65.333, 42.800 | 4.000, 0.800, -8.000, -1.200 | 3.500 | 3.500 | Native pixel edge estimate; +/- one pixel. |
| G02 | x_dec, rear | gangway door leaves | 6, 19, 24, 39 | `rear-end/doors` | 20.000, 38.000, 60.000, 40.000 | 22.000, 38.000, 56.000, 40.000 | 2.000, 0.000, -4.000, -0.000 | 1.500 | 1.500 | Native pixel edge estimate; +/- one pixel. |
| G03 | x_dec, rear | roof cover (end view) | 5, 10, 25, 15 | `roof-equipment/roof-cover-1` | 16.667, 20.000, 66.667, 10.000 | 18.889, 20.000, 62.222, 10.000 | 2.222, 0.000, -4.444, 0.000 | 1.667 | 1.667 | Native pixel edge estimate; +/- one pixel. |
