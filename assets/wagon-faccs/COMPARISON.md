# N_Faccs native reference comparison

**Covers** - native pixel annotations, baseline and final orthographic errors.
**Code** - `generator/freightWagons.ts`, `generator/hopperWagons.ts`, `generator/freightWagonParts.ts`, `generator/freightTransfers.ts`, `generator/csdCoachComparison.ts`, `generator/csdCoachReport.ts`.
**See also** - [source notes](SOURCES.md), [Freight wagons (container, flat, sliding-wall, hopper)](../../docs/models/freight-wagons.md).

Model geometry revision (SHA-256 of comparison GLB): `88f7cf54e9d829834e666c1a6f9e07868139d035ab4057f4b91224cbe4c87bc4`.

Regenerate with `pnpm exec tsx generator/csdCoachReport.ts n_faccs`. The baseline is the first authored geometry (`native/n_faccs/baseline.json`); baseline and final use the same annotations. Built with `livery=cd` of `veh-faccs-hopper-wagon`.

Canvases: sides 12.8 x 4.2 m (128 x 42 px), ends 3 x 4.2 m (30 x 42 px), including empty space, 0.1 m a pixel. Origin top left; x right, y down. Side u = 10 * source x = 10 * (Factory X + 6.4); both sides keep increasing source x, so the left (-Z) elevation is mirrored relative to an outside observer, as its BMP is. Ends are seen from outside: rear u = 10 * (z + 1.5), front u = 10 * (1.5 - z). v = 10 * (4.2 - y).

Each vector is (left, top, width, height). Percentages are 100*x/W, 100*y/H, 100*w/W, 100*h/H of the native canvas. Signed delta = model minus source in percentage points. MAE = sum(abs(delta)) / (4 * number of boxes). Model boxes are the bounds of actual GLB vertices of the named scopes, occluded vertices included. Only the original BMPs define the measurements, never the 4x textures.

| View | Boxes | Baseline MAE (pp) | Final MAE (pp) |
|---|---:|---:|---:|
| z_both, right | 9 | 0.086 | 0.086 |
| z_both, left | 9 | 0.086 | 0.086 |
| All | 18 | 0.086 | 0.086 |

One pixel is 0.781 pp horizontally on the sides, 3.333 pp horizontally on the ends and 2.381 pp vertically. The model was authored from these same measured boxes, so the residuals measure the transfer onto the XML clip shapes (0.1 m posts the BMPs paint wider, loads bounded by their XML hulls) and the deliberate mechanical choices (1.75 m buffer spacing, 920 mm wheels, the ISO 40 ft container, the 3.1 m width), not photographic accuracy.

Annotated views (generated locally, not committed):

- z_both, right: [native](../../export/review/n_faccs/z_both-right-native.svg), [model](../../export/review/n_faccs/z_both-right-model.svg)
- z_both, left: [native](../../export/review/n_faccs/z_both-left-native.svg), [model](../../export/review/n_faccs/z_both-left-model.svg)
- [Three-quarter view](../../export/review/n_faccs/three-quarter.png), [thumbnail](../../export/thumbs/veh-faccs-hopper-wagon.png)

| ID | View | Element | Native pixel edges | Mesh scope(s) | Source % (x,y,w,h) | Model % | Signed delta (pp) | Baseline abs. mean (pp) | Final abs. mean (pp) | Uncertainty |
|---|---|---|---|---|---|---|---|---:|---:|---|
| R01 | z_both, right | hopper body | 20, 0, 108, 30 | `hopper/body` | 15.625, 0.000, 68.750, 71.429 | 15.625, 0.000, 68.750, 71.429 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | XML `box` 2.0..10.8 m at the top, down to 1.2 m; braces and end frames paint the same brown. |
| R02 | z_both, right | underframe | 1, 30, 126, 33 | `underframe/frame` | 0.781, 71.429, 97.656, 7.143 | 1.563, 71.429, 96.875, 7.143 | 0.781, -0.000, -0.781, 0.000 | 0.391 | 0.391 | Native pixel edge estimate; +/- one pixel. |
| R03 | z_both, right | discharge chute 1 | 44, 33, 62, 41 | `underframe/chutes/chute-1` | 34.375, 78.571, 14.063, 19.048 | 34.375, 78.571, 14.062, 19.048 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | From the XML `unload` 4.4..6.2 m, 0.1..0.9 m. |
| R04 | z_both, right | discharge chute 2 | 66, 33, 84, 41 | `underframe/chutes/chute-2` | 51.563, 78.571, 14.063, 19.048 | 51.563, 78.571, 14.062, 19.048 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | From the XML `unload` 6.6..8.4 m, 0.1..0.9 m. |
| R05 | z_both, right | rear end wall | 2, 19, 3, 30 | `underframe/rear-end-frame/end-wall` | 1.563, 45.238, 0.781, 26.190 | 1.563, 45.238, 0.781, 26.190 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R06 | z_both, right | front end wall | 125, 19, 126, 30 | `underframe/front-end-frame/end-wall` | 97.656, 45.238, 0.781, 26.190 | 97.656, 45.238, 0.781, 26.190 | -0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R07 | z_both, right | stiffener at 4.0 m | 40, 0, 41, 17 | `hopper/right-side-stiffeners/stiffener-1` | 31.250, 0.000, 0.781, 40.476 | 31.250, -0.223, 0.781, 40.699 | -0.000, -0.223, 0.000, 0.223 | 0.112 | 0.112 | Native pixel edge estimate; +/- one pixel. |
| R08 | z_both, right | stiffener at 6.2 m | 62, 0, 63, 29 | `hopper/right-side-stiffeners/stiffener-2` | 48.438, 0.000, 0.781, 69.048 | 48.437, -0.223, 0.781, 69.465 | -0.000, -0.223, 0.000, 0.417 | 0.160 | 0.160 | Native pixel edge estimate; +/- one pixel. |
| R09 | z_both, right | stiffener at 8.7 m | 87, 0, 88, 17 | `hopper/right-side-stiffeners/stiffener-4` | 67.969, 0.000, 0.781, 40.476 | 67.969, -0.223, 0.781, 40.699 | -0.000, -0.223, 0.000, 0.223 | 0.112 | 0.112 | Native pixel edge estimate; +/- one pixel. |
| L01 | z_both, left | hopper body | 20, 0, 108, 30 | `hopper/body` | 15.625, 0.000, 68.750, 71.429 | 15.625, 0.000, 68.750, 71.429 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | XML `box` 2.0..10.8 m at the top, down to 1.2 m; braces and end frames paint the same brown. |
| L02 | z_both, left | underframe | 1, 30, 126, 33 | `underframe/frame` | 0.781, 71.429, 97.656, 7.143 | 1.563, 71.429, 96.875, 7.143 | 0.781, -0.000, -0.781, 0.000 | 0.391 | 0.391 | Native pixel edge estimate; +/- one pixel. |
| L03 | z_both, left | discharge chute 1 | 44, 33, 62, 41 | `underframe/chutes/chute-1` | 34.375, 78.571, 14.063, 19.048 | 34.375, 78.571, 14.062, 19.048 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | From the XML `unload` 4.4..6.2 m, 0.1..0.9 m. |
| L04 | z_both, left | discharge chute 2 | 66, 33, 84, 41 | `underframe/chutes/chute-2` | 51.563, 78.571, 14.063, 19.048 | 51.563, 78.571, 14.062, 19.048 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | From the XML `unload` 6.6..8.4 m, 0.1..0.9 m. |
| L05 | z_both, left | rear end wall | 2, 19, 3, 30 | `underframe/rear-end-frame/end-wall` | 1.563, 45.238, 0.781, 26.190 | 1.563, 45.238, 0.781, 26.190 | 0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L06 | z_both, left | front end wall | 125, 19, 126, 30 | `underframe/front-end-frame/end-wall` | 97.656, 45.238, 0.781, 26.190 | 97.656, 45.238, 0.781, 26.190 | -0.000, 0.000, -0.000, -0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L07 | z_both, left | stiffener at 4.0 m | 40, 0, 41, 17 | `hopper/left-side-stiffeners/stiffener-1` | 31.250, 0.000, 0.781, 40.476 | 31.250, -0.223, 0.781, 40.699 | -0.000, -0.223, 0.000, 0.223 | 0.112 | 0.112 | Native pixel edge estimate; +/- one pixel. |
| L08 | z_both, left | stiffener at 6.2 m | 62, 0, 63, 29 | `hopper/left-side-stiffeners/stiffener-2` | 48.438, 0.000, 0.781, 69.048 | 48.437, -0.223, 0.781, 69.465 | -0.000, -0.223, 0.000, 0.417 | 0.160 | 0.160 | Native pixel edge estimate; +/- one pixel. |
| L09 | z_both, left | stiffener at 8.7 m | 87, 0, 88, 17 | `hopper/left-side-stiffeners/stiffener-4` | 67.969, 0.000, 0.781, 40.476 | 67.969, -0.223, 0.781, 40.699 | -0.000, -0.223, 0.000, 0.223 | 0.112 | 0.112 | Native pixel edge estimate; +/- one pixel. |
