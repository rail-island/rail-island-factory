# Ua Coal native reference comparison

**Covers** - native pixel annotations, baseline and final orthographic errors.
**Code** - `generator/wagons.ts`, `generator/wagonParts.ts`, `generator/wagonTransfers.ts`, `generator/csdCoachComparison.ts`, `generator/csdCoachReport.ts`.
**See also** - [source notes](SOURCES.md), [Freight wagons](../../docs/models/wagons.md).

Model geometry revision (SHA-256 of comparison GLB): `438c9f2f8e83020b704f34ee1a972d82ec922774b54d0f1d784697b976026e51`.

Regenerate with `pnpm exec tsx generator/csdCoachReport.ts n_ua_1`. The baseline is the first authored geometry (`native/n_ua_1/baseline.json`); baseline and final use the same annotations. Built with `cargo=coal` of `veh-ua-open-wagon`.

Canvases: sides 14 x 4 m (140 x 40 px), ends 3 x 4 m (30 x 40 px), including empty space, 0.1 m a pixel. Origin top left; x right, y down. Side u = 10 * source x = 10 * (Factory X + 6.85); both sides keep increasing source x, so the left (-Z) elevation is mirrored relative to an outside observer, as its BMP is. Ends are seen from outside: rear u = 10 * (z + 1.5), front u = 10 * (1.5 - z). v = 10 * (4 - y).

Each vector is (left, top, width, height). Percentages are 100*x/W, 100*y/H, 100*w/W, 100*h/H of the native canvas. Signed delta = model minus source in percentage points. MAE = sum(abs(delta)) / (4 * number of boxes). Model boxes are the bounds of actual GLB vertices of the named scopes, occluded vertices included. Only the original BMPs define the measurements, never the 4x textures.

| View | Boxes | Baseline MAE (pp) | Final MAE (pp) |
|---|---:|---:|---:|
| z_both, right | 15 | 0.120 | 0.120 |
| z_both, left | 13 | 0.121 | 0.121 |
| x_both, rear | 7 | 0.786 | 0.786 |
| x_both, front | 7 | 1.024 | 1.024 |
| All | 42 | 0.382 | 0.382 |

One pixel is 0.714 pp horizontally on the sides, 3.333 pp horizontally on the ends and 2.500 pp vertically. The model was authored from these same measured boxes, so the residuals measure the transfer onto the XML clip shapes (0.1 m posts the BMPs paint up to 0.2 m wide, polygonal hoppers and tank, loads bounded by their XML hulls) and the deliberate mechanical choices (1.75 m buffer spacing, 920 mm wheels), not photographic accuracy.

Annotated views (generated locally, not committed):

- z_both, right: [native](../../export/review/n_ua_1/z_both-right-native.svg), [model](../../export/review/n_ua_1/z_both-right-model.svg)
- z_both, left: [native](../../export/review/n_ua_1/z_both-left-native.svg), [model](../../export/review/n_ua_1/z_both-left-model.svg)
- x_both, rear: [native](../../export/review/n_ua_1/x_both-rear-native.svg), [model](../../export/review/n_ua_1/x_both-rear-model.svg)
- x_both, front: [native](../../export/review/n_ua_1/x_both-front-native.svg), [model](../../export/review/n_ua_1/x_both-front-model.svg)
- [Three-quarter view](../../export/review/n_ua_1/three-quarter.png), [thumbnail](../../export/thumbs/veh-ua-open-wagon.png)

| ID | View | Element | Native pixel edges | Mesh scope(s) | Source % (x,y,w,h) | Model % | Signed delta (pp) | Baseline abs. mean (pp) | Final abs. mean (pp) | Uncertainty |
|---|---|---|---|---|---|---|---|---:|---:|---|
| R01 | z_both, right | side wall and top rim | 5, 7, 132, 31 | `body/right-side/wall`, `body/right-side/top-rim` | 3.571, 17.500, 90.714, 60.000 | 3.571, 17.500, 90.714, 60.000 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R02 | z_both, right | door 1 locking bar 1 | 29, 11, 34, 27 | `body/right-side/door-1/locking-bar-1` | 20.714, 27.500, 3.571, 40.000 | 20.714, 27.500, 3.571, 40.000 | -0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R03 | z_both, right | door 1 locking bar 2 | 38, 11, 43, 27 | `body/right-side/door-1/locking-bar-2` | 27.143, 27.500, 3.571, 40.000 | 27.143, 27.500, 3.571, 40.000 | 0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R04 | z_both, right | door 2 locking bar 1 | 93, 11, 98, 27 | `body/right-side/door-2/locking-bar-1` | 66.429, 27.500, 3.571, 40.000 | 66.429, 27.500, 3.571, 40.000 | 0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R05 | z_both, right | door 2 locking bar 2 | 102, 11, 107, 27 | `body/right-side/door-2/locking-bar-2` | 72.857, 27.500, 3.571, 40.000 | 72.857, 27.500, 3.571, 40.000 | -0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R06 | z_both, right | door 1 seam | 35, 9, 36, 30 | `body/right-side/door-1/seam` | 25.000, 22.500, 0.714, 52.500 | 25.214, 21.250, 0.286, 53.750 | 0.214, -1.250, -0.429, 1.250 | 0.786 | 0.786 | A dark one-pixel line; the model seam is 0.04 m. |
| R07 | z_both, right | door 2 seam | 99, 9, 100, 30 | `body/right-side/door-2/seam` | 70.714, 22.500, 0.714, 52.500 | 70.929, 21.250, 0.286, 53.750 | 0.214, -1.250, -0.429, 1.250 | 0.786 | 0.786 | A dark one-pixel line; the model seam is 0.04 m. |
| R08 | z_both, right | stanchion at 1.5 m | 15, 8, 16, 31 | `body/right-side/stanchions/stanchion-1` | 10.714, 20.000, 0.714, 57.500 | 10.714, 20.000, 0.714, 57.500 | 0.000, -0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R09 | z_both, right | stanchion at 4.5 m | 45, 8, 47, 31 | `body/right-side/stanchions/stanchion-3` | 32.143, 20.000, 1.429, 57.500 | 32.143, 20.000, 1.429, 57.500 | 0.000, -0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R10 | z_both, right | stanchion at 6.7 m | 67, 8, 69, 31 | `body/right-side/stanchions/stanchion-5` | 47.857, 20.000, 1.429, 57.500 | 47.857, 20.000, 1.429, 57.500 | -0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R11 | z_both, right | stanchion at 12.0 m | 120, 8, 122, 31 | `body/right-side/stanchions/stanchion-9` | 85.714, 20.000, 1.429, 57.500 | 85.714, 20.000, 1.429, 57.500 | 0.000, -0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R12 | z_both, right | door 1 sill | 26, 31, 46, 32 | `body/right-side/door-1/sill` | 18.571, 77.500, 14.286, 2.500 | 18.571, 77.500, 14.286, 2.500 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R13 | z_both, right | door 2 sill | 90, 31, 110, 32 | `body/right-side/door-2/sill` | 64.286, 77.500, 14.286, 2.500 | 64.286, 77.500, 14.286, 2.500 | 0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L01 | z_both, left | side wall and top rim | 5, 7, 132, 31 | `body/left-side/wall`, `body/left-side/top-rim` | 3.571, 17.500, 90.714, 60.000 | 3.571, 17.500, 90.714, 60.000 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L02 | z_both, left | door 1 locking bar 1 | 29, 11, 34, 27 | `body/left-side/door-1/locking-bar-1` | 20.714, 27.500, 3.571, 40.000 | 20.714, 27.500, 3.571, 40.000 | -0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L03 | z_both, left | door 1 locking bar 2 | 38, 11, 43, 27 | `body/left-side/door-1/locking-bar-2` | 27.143, 27.500, 3.571, 40.000 | 27.143, 27.500, 3.571, 40.000 | 0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L04 | z_both, left | door 2 locking bar 1 | 93, 11, 98, 27 | `body/left-side/door-2/locking-bar-1` | 66.429, 27.500, 3.571, 40.000 | 66.429, 27.500, 3.571, 40.000 | 0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L05 | z_both, left | door 2 locking bar 2 | 102, 11, 107, 27 | `body/left-side/door-2/locking-bar-2` | 72.857, 27.500, 3.571, 40.000 | 72.857, 27.500, 3.571, 40.000 | -0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L06 | z_both, left | door 1 seam | 35, 9, 36, 30 | `body/left-side/door-1/seam` | 25.000, 22.500, 0.714, 52.500 | 25.214, 21.250, 0.286, 53.750 | 0.214, -1.250, -0.429, 1.250 | 0.786 | 0.786 | A dark one-pixel line; the model seam is 0.04 m. |
| L07 | z_both, left | door 2 seam | 99, 9, 100, 30 | `body/left-side/door-2/seam` | 70.714, 22.500, 0.714, 52.500 | 70.929, 21.250, 0.286, 53.750 | 0.214, -1.250, -0.429, 1.250 | 0.786 | 0.786 | A dark one-pixel line; the model seam is 0.04 m. |
| L08 | z_both, left | stanchion at 1.5 m | 15, 8, 16, 31 | `body/left-side/stanchions/stanchion-1` | 10.714, 20.000, 0.714, 57.500 | 10.714, 20.000, 0.714, 57.500 | 0.000, -0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L09 | z_both, left | stanchion at 4.5 m | 45, 8, 47, 31 | `body/left-side/stanchions/stanchion-3` | 32.143, 20.000, 1.429, 57.500 | 32.143, 20.000, 1.429, 57.500 | 0.000, -0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L10 | z_both, left | stanchion at 6.7 m | 67, 8, 69, 31 | `body/left-side/stanchions/stanchion-5` | 47.857, 20.000, 1.429, 57.500 | 47.857, 20.000, 1.429, 57.500 | -0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L11 | z_both, left | stanchion at 12.0 m | 120, 8, 122, 31 | `body/left-side/stanchions/stanchion-9` | 85.714, 20.000, 1.429, 57.500 | 85.714, 20.000, 1.429, 57.500 | 0.000, -0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L12 | z_both, left | door 1 sill | 26, 31, 46, 32 | `body/left-side/door-1/sill` | 18.571, 77.500, 14.286, 2.500 | 18.571, 77.500, 14.286, 2.500 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L13 | z_both, left | door 2 sill | 90, 31, 110, 32 | `body/left-side/door-2/sill` | 64.286, 77.500, 14.286, 2.500 | 64.286, 77.500, 14.286, 2.500 | 0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| U01 | z_both, right | handbrake box | 49, 30, 54, 35 | `underframe/handbrake` | 35.000, 75.000, 3.571, 12.500 | 35.000, 75.000, 3.571, 12.500 | -0.000, 0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| B01 | x_both, rear | end wall and corner posts | 0, 7, 30, 31 | `body/rear-end-wall` | 0.000, 17.500, 100.000, 60.000 | 0.000, 17.500, 100.000, 60.000 | 0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| B02 | x_both, rear | end post at u 2 | 2, 8, 3, 28 | `body/rear-end-wall/end-post-1` | 6.667, 20.000, 3.333, 50.000 | 6.667, 20.000, 3.333, 50.000 | 0.000, -0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| B03 | x_both, rear | end post at u 9 | 9, 8, 10, 28 | `body/rear-end-wall/end-post-2` | 30.000, 20.000, 3.333, 50.000 | 30.000, 20.000, 3.333, 50.000 | -0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| B04 | x_both, rear | end post at u 19 | 19, 8, 20, 28 | `body/rear-end-wall/end-post-3` | 63.333, 20.000, 3.333, 50.000 | 63.333, 20.000, 3.333, 50.000 | 0.000, -0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| B05 | x_both, rear | end post at u 27 | 27, 8, 28, 28 | `body/rear-end-wall/end-post-4` | 90.000, 20.000, 3.333, 50.000 | 90.000, 20.000, 3.333, 50.000 | 0.000, -0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| B06 | x_both, rear | buffer at u 2..8 | 2, 28, 8, 32 | `rear-end/buffers/buffer-1` | 6.667, 70.000, 20.000, 10.000 | 13.500, 69.500, 14.667, 11.000 | 6.833, -0.500, -5.333, 1.000 | 3.417 | 3.417 | Standard 1.75 m buffer spacing and 0.44 m heads kept; the native paints a 0.5 to 0.6 m dark box. |
| B07 | x_both, rear | buffer at u 22..28 | 22, 28, 28, 32 | `rear-end/buffers/buffer-2` | 73.333, 70.000, 20.000, 10.000 | 71.833, 69.500, 14.667, 11.000 | -1.500, -0.500, -5.333, 1.000 | 2.083 | 2.083 | Standard 1.75 m buffer spacing and 0.44 m heads kept; the native paints a 0.5 to 0.6 m dark box. |
| F01 | x_both, front | end wall and corner posts | 0, 7, 30, 31 | `body/front-end-wall` | 0.000, 17.500, 100.000, 60.000 | 0.000, 17.500, 100.000, 60.000 | 0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| F02 | x_both, front | end post at u 2 | 2, 8, 3, 28 | `body/front-end-wall/end-post-4` | 6.667, 20.000, 3.333, 50.000 | 6.667, 20.000, 3.333, 50.000 | 0.000, -0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| F03 | x_both, front | end post at u 9 | 9, 8, 10, 28 | `body/front-end-wall/end-post-3` | 30.000, 20.000, 3.333, 50.000 | 33.333, 20.000, 3.333, 50.000 | 3.333, -0.000, -0.000, 0.000 | 0.833 | 0.833 | Native pixel edge estimate; +/- one pixel. |
| F04 | x_both, front | end post at u 19 | 19, 8, 20, 28 | `body/front-end-wall/end-post-2` | 63.333, 20.000, 3.333, 50.000 | 66.667, 20.000, 3.333, 50.000 | 3.333, -0.000, 0.000, 0.000 | 0.833 | 0.833 | Native pixel edge estimate; +/- one pixel. |
| F05 | x_both, front | end post at u 27 | 27, 8, 28, 28 | `body/front-end-wall/end-post-1` | 90.000, 20.000, 3.333, 50.000 | 90.000, 20.000, 3.333, 50.000 | 0.000, -0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| F06 | x_both, front | buffer at u 2..8 | 2, 28, 8, 32 | `front-end/buffers/buffer-2` | 6.667, 70.000, 20.000, 10.000 | 13.500, 69.500, 14.667, 11.000 | 6.833, -0.500, -5.333, 1.000 | 3.417 | 3.417 | Standard 1.75 m buffer spacing and 0.44 m heads kept; the native paints a 0.5 to 0.6 m dark box. |
| F07 | x_both, front | buffer at u 22..28 | 22, 28, 28, 32 | `front-end/buffers/buffer-1` | 73.333, 70.000, 20.000, 10.000 | 71.833, 69.500, 14.667, 11.000 | -1.500, -0.500, -5.333, 1.000 | 2.083 | 2.083 | Standard 1.75 m buffer spacing and 0.44 m heads kept; the native paints a 0.5 to 0.6 m dark box. |
| C01 | z_both, right | coal above the rim | 8, 4, 129, 7 | `cargo` | 5.714, 10.000, 86.429, 7.500 | 5.714, 10.469, 86.429, 7.031 | -0.000, 0.469, 0.000, -0.469 | 0.234 | 0.234 | The XML `load` visual hull above the 3.3 m rim (alongx section, alongz heaps); the BMP paints the load only from above. |
