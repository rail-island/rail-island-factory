# Habis Transwaggon 1 native reference comparison

**Covers** - native pixel annotations, baseline and final orthographic errors.
**Code** - `generator/freightWagons.ts`, `generator/hopperWagons.ts`, `generator/freightWagonParts.ts`, `generator/freightTransfers.ts`, `generator/csdCoachComparison.ts`, `generator/csdCoachReport.ts`.
**See also** - [source notes](SOURCES.md), [Freight wagons (container, flat, sliding-wall, hopper)](../../docs/models/freight-wagons.md).

Model geometry revision (SHA-256 of comparison GLB): `ee1af75af992bc16addc190cb6bf3040fb5164692c9649bb9ccfc298d82b06c9`.

Regenerate with `pnpm exec tsx generator/csdCoachReport.ts n_habis_tw1`. The baseline is the first authored geometry (`native/n_habis_tw1/baseline.json`); baseline and final use the same annotations. Built with `livery=tw1` of `veh-habis-sliding-wall-wagon`.

Canvases: sides 24 x 5 m (240 x 50 px), ends 3 x 5 m (30 x 50 px), including empty space, 0.1 m a pixel. Origin top left; x right, y down. Side u = 10 * source x = 10 * (Factory X + 11.6); both sides keep increasing source x, so the left (-Z) elevation is mirrored relative to an outside observer, as its BMP is. Ends are seen from outside: rear u = 10 * (z + 1.5), front u = 10 * (1.5 - z). v = 10 * (5 - y).

Each vector is (left, top, width, height). Percentages are 100*x/W, 100*y/H, 100*w/W, 100*h/H of the native canvas. Signed delta = model minus source in percentage points. MAE = sum(abs(delta)) / (4 * number of boxes). Model boxes are the bounds of actual GLB vertices of the named scopes, occluded vertices included. Only the original BMPs define the measurements, never the 4x textures.

| View | Boxes | Baseline MAE (pp) | Final MAE (pp) |
|---|---:|---:|---:|
| z_dec, right | 6 | 0.042 | 0.042 |
| z_inc, left | 6 | 0.042 | 0.042 |
| All | 12 | 0.042 | 0.042 |

One pixel is 0.417 pp horizontally on the sides, 3.333 pp horizontally on the ends and 2.000 pp vertically. The model was authored from these same measured boxes, so the residuals measure the transfer onto the XML clip shapes (0.1 m posts the BMPs paint wider, loads bounded by their XML hulls) and the deliberate mechanical choices (1.75 m buffer spacing, 920 mm wheels, the ISO 40 ft container, the 3.1 m width), not photographic accuracy.

Annotated views (generated locally, not committed):

- z_dec, right: [native](../../export/review/n_habis_tw1/z_dec-right-native.svg), [model](../../export/review/n_habis_tw1/z_dec-right-model.svg)
- z_inc, left: [native](../../export/review/n_habis_tw1/z_inc-left-native.svg), [model](../../export/review/n_habis_tw1/z_inc-left-model.svg)
- [Three-quarter view](../../export/review/n_habis_tw1/three-quarter.png), [thumbnail](../../export/thumbs/veh-habis-sliding-wall-wagon.png)

| ID | View | Element | Native pixel edges | Mesh scope(s) | Source % (x,y,w,h) | Model % | Signed delta (pp) | Baseline abs. mean (pp) | Final abs. mean (pp) | Uncertainty |
|---|---|---|---|---|---|---|---|---:|---:|---|
| R01 | z_dec, right | roof and top rail band | 5, 9, 227, 18 | `body/roof`, `body/right-side/top-rail` | 2.083, 18.000, 92.500, 18.000 | 2.083, 18.000, 92.500, 18.000 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | The light band rows 9..17: roof slope and top rail (XML base2 3.2..4.1 m). |
| R02 | z_dec, right | sliding walls with posts and rails | 5, 18, 227, 39 | `body/wall-1`, `body/wall-2`, `body/centre-post`, `body/right-side/posts`, `body/right-side/bottom-rail` | 2.083, 36.000, 92.500, 42.000 | 2.083, 36.000, 92.500, 42.000 | -0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Wall panels rows 18..36 and the bottom rail rows 37..38. |
| R03 | z_dec, right | TRANSWAGGON plate | 87, 23, 146, 30 | `body/right-side/name-plate` | 36.250, 46.000, 24.583, 14.000 | 36.250, 46.000, 24.583, 14.000 | -0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R04 | z_dec, right | label board | 7, 19, 19, 37 | `body/right-side/label-board` | 2.917, 38.000, 5.000, 36.000 | 2.917, 38.000, 5.000, 35.400 | 0.000, 0.000, -0.000, -0.600 | 0.150 | 0.150 | The light label board at the -x end (+z side), the +x end (-z side); rows 36..37 meet the data panel. |
| R05 | z_dec, right | black data panel | 18, 34, 34, 38 | `body/right-side/data-panel` | 7.500, 68.000, 6.667, 8.000 | 7.500, 68.000, 6.667, 7.600 | -0.000, -0.000, 0.000, -0.400 | 0.100 | 0.100 | Native pixel edge estimate; +/- one pixel. |
| R06 | z_dec, right | underframe and fishbelly | 5, 39, 227, 47 | `underframe` | 2.083, 78.000, 92.500, 16.000 | 2.083, 78.000, 92.500, 16.000 | -0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Rows 39..46, columns 5..226 (0.5..22.7 m); the end frames' feet at 0.3..0.5 and 22.7..22.9 m share the colour. |
| L01 | z_inc, left | roof and top rail band | 5, 9, 227, 18 | `body/roof`, `body/left-side/top-rail` | 2.083, 18.000, 92.500, 18.000 | 2.083, 18.000, 92.500, 18.000 | -0.000, 0.000, 0.000, -0.000 | 0.000 | 0.000 | The light band rows 9..17: roof slope and top rail (XML base2 3.2..4.1 m). |
| L02 | z_inc, left | sliding walls with posts and rails | 5, 18, 227, 39 | `body/wall-1`, `body/wall-2`, `body/centre-post`, `body/left-side/posts`, `body/left-side/bottom-rail` | 2.083, 36.000, 92.500, 42.000 | 2.083, 36.000, 92.500, 42.000 | -0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Wall panels rows 18..36 and the bottom rail rows 37..38. |
| L03 | z_inc, left | TRANSWAGGON plate | 86, 23, 145, 30 | `body/left-side/name-plate` | 35.833, 46.000, 24.583, 14.000 | 35.833, 46.000, 24.583, 14.000 | 0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L04 | z_inc, left | label board | 210, 19, 225, 37 | `body/left-side/label-board` | 87.500, 38.000, 6.250, 36.000 | 87.500, 38.000, 6.250, 35.400 | -0.000, 0.000, 0.000, -0.600 | 0.150 | 0.150 | The light label board at the -x end (+z side), the +x end (-z side); rows 36..37 meet the data panel. |
| L05 | z_inc, left | black data panel | 198, 34, 214, 38 | `body/left-side/data-panel` | 82.500, 68.000, 6.667, 8.000 | 82.500, 68.000, 6.667, 7.600 | -0.000, -0.000, 0.000, -0.400 | 0.100 | 0.100 | Native pixel edge estimate; +/- one pixel. |
| L06 | z_inc, left | underframe and fishbelly | 5, 39, 227, 47 | `underframe` | 2.083, 78.000, 92.500, 16.000 | 2.083, 78.000, 92.500, 16.000 | -0.000, -0.000, 0.000, 0.000 | 0.000 | 0.000 | Rows 39..46, columns 5..226 (0.5..22.7 m); the end frames' feet at 0.3..0.5 and 22.7..22.9 m share the colour. |
