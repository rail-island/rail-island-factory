# CD 451 motor car native reference comparison

**Covers** - native pixel annotations, baseline and final orthographic errors.
**Code** - `generator/emu451.ts`, `generator/emuClassicKit.ts`, `generator/emuComparison.ts`, `generator/emuReport.ts`.
**See also** - [source notes](SOURCES.md), [older Czech electric units](../../docs/models/czech-emus-classic.md).

Model geometry revision (SHA-256 of comparison GLB): `22ba0b94563f63b6e7a2031e8685948d4ce392d4bbfe2c7051594248e25a95e9`.

Regenerate with `pnpm exec tsx generator/emuReport.ts cd_451`. The baseline is the first authored geometry (`native/cd_451/baseline.json`); baseline and final use the same annotations. Built with `unit=motorCar` of `veh-cd-451`.

Canvases: sides 25 x 6 m (250 x 60 px), ends 3 x 6 m (30 x 60 px), including empty space, 0.1 m a pixel. Origin top left; x right, y down. Side u = 10 * (23.919 - (Factory X + 11.911)): the BMP has the cab at column 0, the model at +X; both sides use the same mapping, so the left (-Z) elevation is mirrored relative to an outside observer, as its BMP is. Ends are seen from outside: rear u = 10 * (z + 1.5), front u = 10 * (1.5 - z). v = 10 * (6 - y), physical heights: no scale is undone.

Each vector is (left, top, width, height). Percentages are 100*x/W, 100*y/H, 100*w/W, 100*h/H of the native canvas. Signed delta = model minus source in percentage points. MAE = sum(abs(delta)) / (4 * number of boxes). Model boxes are the bounds of actual GLB vertices of the named scopes, occluded vertices included. Only the original BMPs define the measurements, never the 4x textures.

| View | Boxes | Baseline MAE (pp) | Final MAE (pp) |
|---|---:|---:|---:|
| em475_z_both, right | 15 | 0.501 | 0.501 |
| em475_x_inc, front | 7 | 2.287 | 2.049 |
| em475_x_dec, rear | 2 | 1.875 | 0.833 |
| All | 24 | 1.136 | 0.980 |

With the documented scales undone (side lengths / 0.9645, model heights / 1.0000, end-view widths / 1.0000: the published dimensions against the XML's), the final MAE is 0.696 pp over the same 24 boxes; the residual left is the transfer itself.

One pixel is 0.400 pp horizontally on the sides, 3.333 pp horizontally on the ends and 1.667 pp vertically.

Annotated views (generated locally, not committed):

- em475_z_both, right: [native](../../export/review/cd_451/em475_z_both-right-native.svg), [model](../../export/review/cd_451/em475_z_both-right-model.svg)
- em475_x_inc, front: [native](../../export/review/cd_451/em475_x_inc-front-native.svg), [model](../../export/review/cd_451/em475_x_inc-front-model.svg)
- em475_x_dec, rear: [native](../../export/review/cd_451/em475_x_dec-rear-native.svg), [model](../../export/review/cd_451/em475_x_dec-rear-model.svg)
- [Three-quarter view](../../export/review/cd_451/three-quarter-front.png), [thumbnail](../../export/thumbs/veh-cd-451.png)

| ID | View | Element | Native pixel edges | Mesh scope(s) | Source % (x,y,w,h) | Model % | Signed delta (pp) | Baseline abs. mean (pp) | Final abs. mean (pp) | Uncertainty |
|---|---|---|---|---|---|---|---|---:|---:|---|
| S01 | em475_z_both, right | louvre 1 panel | 26, 28, 34, 36 | `body/right-side/louvres/louvre-1/panel` | 10.400, 46.667, 3.200, 13.333 | 10.031, 46.667, 3.086, 13.333 | -0.369, -0.000, -0.114, -0.000 | 0.121 | 0.121 | Native pixel edge estimate; +/- one pixel. |
| S02 | em475_z_both, right | louvre 3 panel | 44, 28, 52, 36 | `body/right-side/louvres/louvre-3/panel` | 17.600, 46.667, 3.200, 13.333 | 16.975, 46.667, 3.086, 13.333 | -0.625, -0.000, -0.114, -0.000 | 0.185 | 0.185 | Native pixel edge estimate; +/- one pixel. |
| S03 | em475_z_both, right | machine room door outline | 35, 36, 52, 47 | `body/right-side/machine-room-door/outline` | 14.000, 60.000, 6.800, 18.333 | 13.503, 60.000, 6.558, 18.333 | -0.497, -0.000, -0.242, 0.000 | 0.185 | 0.185 | Grey outline on grey; bottom edge +/- one pixel. |
| S04 | em475_z_both, right | window behind the louvres, frame | 55, 28, 62, 36 | `body/right-side/windows/cab-end-window/frame` | 22.000, 46.667, 2.800, 13.333 | 21.218, 46.667, 2.701, 13.333 | -0.782, -0.000, -0.099, -0.000 | 0.220 | 0.220 | Native pixel edge estimate; +/- one pixel. |
| S05 | em475_z_both, right | door 1 outline | 70, 31, 87, 55 | `body/right-side/doors/door-1/outline` | 28.000, 51.667, 6.800, 40.000 | 27.005, 51.667, 6.558, 40.000 | -0.995, -0.000, -0.242, 0.000 | 0.309 | 0.309 | Native pixel edge estimate; +/- one pixel. |
| S06 | em475_z_both, right | door 1, first window | 72, 37, 77, 46 | `body/right-side/doors/door-1/frame` | 28.800, 61.667, 2.000, 15.000 | 27.777, 61.667, 1.929, 15.000 | -1.023, 0.000, -0.071, -0.000 | 0.273 | 0.274 | Native pixel edge estimate; +/- one pixel. |
| S07 | em475_z_both, right | window 1 (small) frame | 93, 36, 101, 46 | `body/right-side/windows/window-1/frame` | 37.200, 60.000, 3.200, 16.667 | 35.878, 60.000, 3.086, 16.667 | -1.322, -0.000, -0.114, 0.000 | 0.359 | 0.359 | Native pixel edge estimate; +/- one pixel. |
| S08 | em475_z_both, right | window 2 frame | 105, 36, 117, 46 | `body/right-side/windows/window-2/frame` | 42.000, 60.000, 4.800, 16.667 | 40.508, 60.000, 4.629, 16.667 | -1.492, -0.000, -0.171, 0.000 | 0.416 | 0.416 | Native pixel edge estimate; +/- one pixel. |
| S09 | em475_z_both, right | window 4 frame | 137, 36, 149, 46 | `body/right-side/windows/window-4/frame` | 54.800, 60.000, 4.800, 16.667 | 52.853, 60.000, 4.629, 16.667 | -1.947, -0.000, -0.171, 0.000 | 0.529 | 0.529 | Native pixel edge estimate; +/- one pixel. |
| S10 | em475_z_both, right | window 6 (small) frame | 169, 36, 177, 46 | `body/right-side/windows/window-6/frame` | 67.600, 60.000, 3.200, 16.667 | 65.198, 60.000, 3.086, 16.667 | -2.402, -0.000, -0.114, 0.000 | 0.629 | 0.629 | Native pixel edge estimate; +/- one pixel. |
| S11 | em475_z_both, right | door 2 outline | 183, 31, 200, 55 | `body/right-side/doors/door-2/outline` | 73.200, 51.667, 6.800, 40.000 | 70.599, 51.667, 6.558, 40.000 | -2.601, -0.000, -0.242, 0.000 | 0.711 | 0.711 | Native pixel edge estimate; +/- one pixel. |
| S12 | em475_z_both, right | inner end window 1 frame | 207, 29, 213, 39 | `body/right-side/windows/window-7/frame` | 82.800, 48.333, 2.400, 16.667 | 79.858, 48.333, 2.315, 16.667 | -2.942, 0.000, -0.085, 0.000 | 0.757 | 0.757 | Native pixel edge estimate; +/- one pixel. |
| S13 | em475_z_both, right | inner end window 2 frame | 216, 29, 228, 39 | `body/right-side/windows/window-8/frame` | 86.400, 48.333, 4.800, 16.667 | 83.331, 48.333, 4.629, 16.667 | -3.069, 0.000, -0.171, 0.000 | 0.810 | 0.810 | Native pixel edge estimate; +/- one pixel. |
| S14 | em475_z_both, right | luggage door outline | 232, 28, 245, 49 | `body/right-side/doors/luggage-door/outline` | 92.800, 46.667, 5.200, 35.000 | 89.503, 46.667, 5.015, 35.000 | -3.297, -0.000, -0.185, 0.000 | 0.871 | 0.870 | Grey outline on grey; +/- one pixel. |
| S15 | em475_z_both, right | roof ventilator housing | 92, 17, 181, 21 | `roof-equipment/ventilator` | 36.800, 28.333, 35.600, 6.667 | 35.878, 30.000, 33.949, 7.000 | -0.922, 1.667, -1.651, 0.333 | 1.143 | 1.143 | The BMP shows its visible top; the model's measured bounds include its foot inside the roof. |
| F01 | em475_x_inc, front | windscreen (glass band of the nose) | 0, 28, 30, 35 | `body/nose/glass-band` | 0.000, 46.667, 100.000, 11.667 | 0.000, 45.792, 100.000, 12.500 | 0.000, -0.875, 0.000, 0.833 | 0.427 | 0.427 | Light glass on the BMP; the band's top +/- one pixel. |
| F02 | em475_x_inc, front | roof lamp housing | 10, 23, 20, 27 | `cab/top-lamp` | 33.333, 38.333, 33.333, 6.667 | 35.000, 36.333, 30.000, 8.667 | 1.667, -2.000, -3.333, 2.000 | 2.917 | 2.250 | Dark housing; the XML raises it to 3.9 m, the model keeps it at 3.82 m so it still stands over the 3.8 m cab roof behind it. |
| F03 | em475_x_inc, front | lamp pod (left in the BMP), white lens | 2, 44, 4, 46 | `cab/lamp-pods/right/sweep-2` | 6.667, 73.333, 6.667, 3.333 | 4.333, 72.500, 10.000, 5.000 | -2.333, -0.833, 3.333, 1.667 | 2.042 | 2.042 | A 2 x 2 pixel lens; the model's round lens is 0.3 m across. |
| F04 | em475_x_inc, front | lamp pod (left in the BMP), red lens | 3, 47, 4, 49 | `cab/lamp-pods/right/sweep-3` | 10.000, 78.333, 3.333, 3.333 | 7.333, 79.833, 4.000, 2.000 | -2.667, 1.500, 0.667, -1.333 | 1.542 | 1.542 | A 1 x 2 pixel lens. |
| F05 | em475_x_inc, front | lamp pod (left in the BMP) | 1, 42, 6, 49 | `cab/lamp-pods/right/sweep-1` | 3.333, 70.000, 16.667, 11.667 | 0.000, 70.000, 18.333, 13.333 | -3.333, 0.000, 1.667, 1.667 | 1.667 | 1.667 | Native pixel edge estimate; +/- one pixel. |
| F06 | em475_x_inc, front | CD emblem | 13, 41, 18, 45 | `cab/emblem` | 43.333, 68.333, 16.667, 6.667 | 41.538, 69.001, 13.980, 5.496 | -1.795, 0.668, -2.687, -1.171 | 2.163 | 1.580 | Native pixel edge estimate; +/- one pixel. |
| F07 | em475_x_inc, front | coupler head | 12, 48, 18, 55 | `cab/coupler/head` | 40.000, 80.000, 20.000, 11.667 | 44.333, 82.333, 11.333, 7.667 | 4.333, 2.333, -8.667, -4.000 | 5.250 | 4.833 | Mechanical constraint: the Scharfenberg head is 0.34 m wide (emuParts centreCoupler); the BMP paints the whole draw gear dark on the dark apron. |
| R01 | em475_x_dec, rear | end door outline | 10, 26, 21, 45 | `rear-end/end-door/outline` | 33.333, 43.333, 36.667, 31.667 | 31.667, 43.333, 36.667, 31.667 | -1.667, -0.000, 0.000, 0.000 | 2.500 | 0.417 | Native pixel edge estimate; +/- one pixel. |
| R02 | em475_x_dec, rear | marker lamp (left in the BMP) | 6, 43, 8, 44 | `rear-end/marker-lamps/sweep-1` | 20.000, 71.667, 6.667, 1.667 | 21.667, 71.667, 3.333, 1.667 | 1.667, -0.000, -3.333, 0.000 | 1.250 | 1.250 | A 2 x 1 pixel lamp. |
