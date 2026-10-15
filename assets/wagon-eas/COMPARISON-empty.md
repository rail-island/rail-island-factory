# Eas native reference comparison

**Covers** - native pixel annotations, baseline and final orthographic errors.
**Code** - `generator/wagons.ts`, `generator/wagonParts.ts`, `generator/wagonTransfers.ts`, `generator/csdCoachComparison.ts`, `generator/csdCoachReport.ts`.
**See also** - [source notes](SOURCES.md), [Freight wagons](../../docs/models/wagons.md).

Model geometry revision (SHA-256 of comparison GLB): `07c74fb7d23cb7e059335a356abb1d70c96f2581682900e6cb3e17616a010366`.

Regenerate with `pnpm exec tsx generator/csdCoachReport.ts n_eas`. The baseline is the first authored geometry (`native/n_eas/baseline.json`); baseline and final use the same annotations. Built with `cargo=empty` of `veh-eas-open-wagon`.

Canvases: sides 14.2 x 4 m (142 x 40 px), ends 3 x 4 m (30 x 40 px), including empty space, 0.1 m a pixel. Origin top left; x right, y down. Side u = 10 * source x = 10 * (Factory X + 6.95); both sides keep increasing source x, so the left (-Z) elevation is mirrored relative to an outside observer, as its BMP is. Ends are seen from outside: rear u = 10 * (z + 1.5), front u = 10 * (1.5 - z). v = 10 * (4 - y).

Each vector is (left, top, width, height). Percentages are 100*x/W, 100*y/H, 100*w/W, 100*h/H of the native canvas. Signed delta = model minus source in percentage points. MAE = sum(abs(delta)) / (4 * number of boxes). Model boxes are the bounds of actual GLB vertices of the named scopes, occluded vertices included. Only the original BMPs define the measurements, never the 4x textures.

| View | Boxes | Baseline MAE (pp) | Final MAE (pp) |
|---|---:|---:|---:|
| z_dec, right | 13 | 0.057 | 0.038 |
| z_inc, left | 13 | 0.057 | 0.038 |
| x_both, rear | 7 | 0.786 | 0.786 |
| x_both, front | 7 | 0.786 | 0.786 |
| All | 40 | 0.312 | 0.300 |

One pixel is 0.704 pp horizontally on the sides, 3.333 pp horizontally on the ends and 2.500 pp vertically. The model was authored from these same measured boxes, so the residuals measure the transfer onto the XML clip shapes (0.1 m posts the BMPs paint up to 0.2 m wide, polygonal hoppers and tank, loads bounded by their XML hulls) and the deliberate mechanical choices (1.75 m buffer spacing, 920 mm wheels), not photographic accuracy.

Annotated views (generated locally, not committed):

- z_dec, right: [native](../../export/review/n_eas/z_dec-right-native.svg), [model](../../export/review/n_eas/z_dec-right-model.svg)
- z_inc, left: [native](../../export/review/n_eas/z_inc-left-native.svg), [model](../../export/review/n_eas/z_inc-left-model.svg)
- x_both, rear: [native](../../export/review/n_eas/x_both-rear-native.svg), [model](../../export/review/n_eas/x_both-rear-model.svg)
- x_both, front: [native](../../export/review/n_eas/x_both-front-native.svg), [model](../../export/review/n_eas/x_both-front-model.svg)
- [Three-quarter view](../../export/review/n_eas/three-quarter.png), [thumbnail](../../export/thumbs/veh-eas-open-wagon.png)

| ID | View | Element | Native pixel edges | Mesh scope(s) | Source % (x,y,w,h) | Model % | Signed delta (pp) | Baseline abs. mean (pp) | Final abs. mean (pp) | Uncertainty |
|---|---|---|---|---|---|---|---|---:|---:|---|
| R01 | z_dec, right | side wall, top rail and solebar | 2, 7, 137, 32 | `body/right-side/wall`, `body/right-side/top-rail`, `body/right-side/solebar` | 1.408, 17.500, 95.070, 62.500 | 1.408, 17.500, 95.070, 62.500 | 0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R02 | z_dec, right | door 1 frame | 25, 7, 48, 29 | `body/right-side/door-1/frame`, `body/right-side/door-1/posts` | 17.606, 17.500, 16.197, 55.000 | 17.606, 17.500, 16.197, 55.000 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Grey frame; native posts are 2 px wide where the XML stanchions are 0.1 m. |
| R03 | z_dec, right | door 2 frame | 91, 7, 114, 29 | `body/right-side/door-2/frame`, `body/right-side/door-2/posts` | 64.085, 17.500, 16.197, 55.000 | 64.085, 17.500, 16.197, 55.000 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Grey frame; native posts are 2 px wide where the XML stanchions are 0.1 m. |
| R04 | z_dec, right | door 1 middle post | 36, 8, 38, 29 | `body/right-side/door-1/posts/post-2` | 25.352, 20.000, 1.408, 52.500 | 25.352, 20.000, 0.704, 52.500 | 0.000, -0.000, -0.704, 0.000 | 0.176 | 0.176 | Painted 2 px wide; the XML stanchion is 0.1 m. |
| R05 | z_dec, right | door 2 middle post | 102, 8, 104, 29 | `body/right-side/door-2/posts/post-2` | 71.831, 20.000, 1.408, 52.500 | 71.831, 20.000, 0.704, 52.500 | 0.000, -0.000, -0.704, 0.000 | 0.176 | 0.176 | Painted 2 px wide; the XML stanchion is 0.1 m. |
| R06 | z_dec, right | stanchion at 1.4 m | 14, 8, 15, 31 | `body/right-side/stanchions/stanchion-2` | 9.859, 20.000, 0.704, 57.500 | 9.859, 20.000, 0.704, 57.500 | -0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R07 | z_dec, right | stanchion at 5.8 m | 58, 8, 59, 31 | `body/right-side/stanchions/stanchion-6` | 40.845, 20.000, 0.704, 57.500 | 40.845, 20.000, 0.704, 57.500 | 0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R08 | z_dec, right | stanchion at 6.9 m | 69, 8, 70, 31 | `body/right-side/stanchions/stanchion-7` | 48.592, 20.000, 0.704, 57.500 | 48.592, 20.000, 0.704, 57.500 | -0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R09 | z_dec, right | stanchion at 8.0 m | 80, 8, 81, 31 | `body/right-side/stanchions/stanchion-8` | 56.338, 20.000, 0.704, 57.500 | 56.338, 20.000, 0.704, 57.500 | -0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R10 | z_dec, right | stanchion at 12.4 m | 124, 8, 125, 31 | `body/right-side/stanchions/stanchion-12` | 87.324, 20.000, 0.704, 57.500 | 87.324, 20.000, 0.704, 57.500 | -0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R11 | z_dec, right | data panel | 4, 22, 14, 28 | `body/right-side/data-panel` | 2.817, 55.000, 7.042, 15.000 | 2.817, 55.000, 7.042, 15.000 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R12 | z_dec, right | white label | 16, 14, 24, 17 | `body/right-side/label` | 11.268, 35.000, 5.634, 7.500 | 11.268, 35.000, 5.634, 7.500 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R13 | z_dec, right | running number block | 5, 13, 13, 18 | `body/right-side/running-number` | 3.521, 32.500, 5.634, 12.500 | 3.540, 32.325, 5.594, 12.851 | 0.019, -0.175, -0.039, 0.351 | 0.386 | 0.146 | One-pixel glyphs: the block of the first three lines. |
| L01 | z_inc, left | side wall, top rail and solebar | 2, 7, 137, 32 | `body/left-side/wall`, `body/left-side/top-rail`, `body/left-side/solebar` | 1.408, 17.500, 95.070, 62.500 | 1.408, 17.500, 95.070, 62.500 | 0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L02 | z_inc, left | door 1 frame | 25, 7, 48, 29 | `body/left-side/door-1/frame`, `body/left-side/door-1/posts` | 17.606, 17.500, 16.197, 55.000 | 17.606, 17.500, 16.197, 55.000 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Grey frame; native posts are 2 px wide where the XML stanchions are 0.1 m. |
| L03 | z_inc, left | door 2 frame | 91, 7, 114, 29 | `body/left-side/door-2/frame`, `body/left-side/door-2/posts` | 64.085, 17.500, 16.197, 55.000 | 64.085, 17.500, 16.197, 55.000 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Grey frame; native posts are 2 px wide where the XML stanchions are 0.1 m. |
| L04 | z_inc, left | door 1 middle post | 36, 8, 38, 29 | `body/left-side/door-1/posts/post-2` | 25.352, 20.000, 1.408, 52.500 | 25.352, 20.000, 0.704, 52.500 | 0.000, -0.000, -0.704, 0.000 | 0.176 | 0.176 | Painted 2 px wide; the XML stanchion is 0.1 m. |
| L05 | z_inc, left | door 2 middle post | 102, 8, 104, 29 | `body/left-side/door-2/posts/post-2` | 71.831, 20.000, 1.408, 52.500 | 71.831, 20.000, 0.704, 52.500 | 0.000, -0.000, -0.704, 0.000 | 0.176 | 0.176 | Painted 2 px wide; the XML stanchion is 0.1 m. |
| L06 | z_inc, left | stanchion at 1.4 m | 14, 8, 15, 31 | `body/left-side/stanchions/stanchion-2` | 9.859, 20.000, 0.704, 57.500 | 9.859, 20.000, 0.704, 57.500 | -0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L07 | z_inc, left | stanchion at 5.8 m | 58, 8, 59, 31 | `body/left-side/stanchions/stanchion-6` | 40.845, 20.000, 0.704, 57.500 | 40.845, 20.000, 0.704, 57.500 | 0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L08 | z_inc, left | stanchion at 6.9 m | 69, 8, 70, 31 | `body/left-side/stanchions/stanchion-7` | 48.592, 20.000, 0.704, 57.500 | 48.592, 20.000, 0.704, 57.500 | -0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L09 | z_inc, left | stanchion at 8.0 m | 80, 8, 81, 31 | `body/left-side/stanchions/stanchion-8` | 56.338, 20.000, 0.704, 57.500 | 56.338, 20.000, 0.704, 57.500 | -0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L10 | z_inc, left | stanchion at 12.4 m | 124, 8, 125, 31 | `body/left-side/stanchions/stanchion-12` | 87.324, 20.000, 0.704, 57.500 | 87.324, 20.000, 0.704, 57.500 | -0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L11 | z_inc, left | data panel | 125, 22, 135, 28 | `body/left-side/data-panel` | 88.028, 55.000, 7.042, 15.000 | 88.028, 55.000, 7.042, 15.000 | 0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L12 | z_inc, left | white label | 115, 14, 123, 17 | `body/left-side/label` | 80.986, 35.000, 5.634, 7.500 | 80.986, 35.000, 5.634, 7.500 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L13 | z_inc, left | running number block | 126, 13, 134, 18 | `body/left-side/running-number` | 88.732, 32.500, 5.634, 12.500 | 88.753, 32.325, 5.594, 12.851 | 0.020, -0.175, -0.039, 0.351 | 0.386 | 0.146 | One-pixel glyphs: the block of the first three lines. |
| B01 | x_both, rear | end top rail | 0, 7, 30, 8 | `body/rear-end-wall/top-rail`, `body/right-side/top-rail`, `body/left-side/top-rail` | 0.000, 17.500, 100.000, 2.500 | 0.000, 17.500, 100.000, 2.500 | 0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| B02 | x_both, rear | end post at u 10 | 10, 9, 11, 29 | `body/rear-end-wall/post-2` | 33.333, 22.500, 3.333, 50.000 | 33.333, 22.500, 3.333, 50.000 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| B03 | x_both, rear | end post at u 19 | 19, 9, 20, 29 | `body/rear-end-wall/post-3` | 63.333, 22.500, 3.333, 50.000 | 63.333, 22.500, 3.333, 50.000 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| B04 | x_both, rear | middle end rail | 2, 20, 28, 21 | `body/rear-end-wall/rail-1` | 6.667, 50.000, 86.667, 2.500 | 6.667, 50.000, 86.667, 2.500 | 0.000, 0.000, -0.000, 0.000 | 0.000 | 0.000 | The rail runs into the dark corner posts; its ends are the XML `side` section (z -1.3..1.3). |
| B05 | x_both, rear | top end rail | 2, 9, 28, 10 | `body/rear-end-wall/rail-2` | 6.667, 22.500, 86.667, 2.500 | 6.667, 22.500, 86.667, 2.500 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | The rail runs into the dark corner posts; its ends are the XML `side` section (z -1.3..1.3). |
| B06 | x_both, rear | buffer at u 3..8 | 3, 29, 8, 32 | `rear-end/buffers/buffer-1` | 10.000, 72.500, 16.667, 7.500 | 13.500, 69.500, 14.667, 11.000 | 3.500, -3.000, -2.000, 3.500 | 3.000 | 3.000 | Standard 1.75 m buffer spacing and 0.44 m heads kept; the native paints a 0.5 to 0.6 m dark box. |
| B07 | x_both, rear | buffer at u 22..27 | 22, 29, 27, 32 | `rear-end/buffers/buffer-2` | 73.333, 72.500, 16.667, 7.500 | 71.833, 69.500, 14.667, 11.000 | -1.500, -3.000, -2.000, 3.500 | 2.500 | 2.500 | Standard 1.75 m buffer spacing and 0.44 m heads kept; the native paints a 0.5 to 0.6 m dark box. |
| F01 | x_both, front | end top rail | 0, 7, 30, 8 | `body/front-end-wall/top-rail`, `body/right-side/top-rail`, `body/left-side/top-rail` | 0.000, 17.500, 100.000, 2.500 | 0.000, 17.500, 100.000, 2.500 | 0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| F02 | x_both, front | end post at u 10 | 10, 9, 11, 29 | `body/front-end-wall/post-3` | 33.333, 22.500, 3.333, 50.000 | 33.333, 22.500, 3.333, 50.000 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| F03 | x_both, front | end post at u 19 | 19, 9, 20, 29 | `body/front-end-wall/post-2` | 63.333, 22.500, 3.333, 50.000 | 63.333, 22.500, 3.333, 50.000 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| F04 | x_both, front | middle end rail | 2, 20, 28, 21 | `body/front-end-wall/rail-1` | 6.667, 50.000, 86.667, 2.500 | 6.667, 50.000, 86.667, 2.500 | 0.000, 0.000, -0.000, 0.000 | 0.000 | 0.000 | The rail runs into the dark corner posts; its ends are the XML `side` section (z -1.3..1.3). |
| F05 | x_both, front | top end rail | 2, 9, 28, 10 | `body/front-end-wall/rail-2` | 6.667, 22.500, 86.667, 2.500 | 6.667, 22.500, 86.667, 2.500 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | The rail runs into the dark corner posts; its ends are the XML `side` section (z -1.3..1.3). |
| F06 | x_both, front | buffer at u 3..8 | 3, 29, 8, 32 | `front-end/buffers/buffer-2` | 10.000, 72.500, 16.667, 7.500 | 13.500, 69.500, 14.667, 11.000 | 3.500, -3.000, -2.000, 3.500 | 3.000 | 3.000 | Standard 1.75 m buffer spacing and 0.44 m heads kept; the native paints a 0.5 to 0.6 m dark box. |
| F07 | x_both, front | buffer at u 22..27 | 22, 29, 27, 32 | `front-end/buffers/buffer-1` | 73.333, 72.500, 16.667, 7.500 | 71.833, 69.500, 14.667, 11.000 | -1.500, -3.000, -2.000, 3.500 | 2.500 | 2.500 | Standard 1.75 m buffer spacing and 0.44 m heads kept; the native paints a 0.5 to 0.6 m dark box. |
