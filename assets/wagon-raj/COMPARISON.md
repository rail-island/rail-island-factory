# Raj native reference comparison

**Covers** - native pixel annotations, baseline and final orthographic errors.
**Code** - `generator/wagons.ts`, `generator/wagonParts.ts`, `generator/wagonTransfers.ts`, `generator/csdCoachComparison.ts`, `generator/csdCoachReport.ts`.
**See also** - [source notes](SOURCES.md), [Freight wagons](../../docs/models/wagons.md).

Model geometry revision (SHA-256 of comparison GLB): `19907cf87d14acf7d2cb97e35b74720ae47ab763f175a42326f27501f2f58a12`.

Regenerate with `pnpm exec tsx generator/csdCoachReport.ts n_raj`. The baseline is the first authored geometry (`native/n_raj/baseline.json`); baseline and final use the same annotations.

Canvases: sides 15 x 5 m (150 x 50 px), ends 3 x 5 m (30 x 50 px), including empty space, 0.1 m a pixel. Origin top left; x right, y down. Side u = 10 * source x = 10 * (Factory X + 7.2); both sides keep increasing source x, so the left (-Z) elevation is mirrored relative to an outside observer, as its BMP is. Ends are seen from outside: rear u = 10 * (z + 1.5), front u = 10 * (1.5 - z). v = 10 * (5 - y).

Each vector is (left, top, width, height). Percentages are 100*x/W, 100*y/H, 100*w/W, 100*h/H of the native canvas. Signed delta = model minus source in percentage points. MAE = sum(abs(delta)) / (4 * number of boxes). Model boxes are the bounds of actual GLB vertices of the named scopes, occluded vertices included. Only the original BMPs define the measurements, never the 4x textures.

| View | Boxes | Baseline MAE (pp) | Final MAE (pp) |
|---|---:|---:|---:|
| z_both, right | 9 | 0.484 | 0.484 |
| z_both, left | 9 | 0.484 | 0.484 |
| All | 18 | 0.484 | 0.484 |

One pixel is 0.667 pp horizontally on the sides, 3.333 pp horizontally on the ends and 2.000 pp vertically. The model was authored from these same measured boxes, so the residuals measure the transfer onto the XML clip shapes (0.1 m posts the BMPs paint up to 0.2 m wide, polygonal hoppers and tank, loads bounded by their XML hulls) and the deliberate mechanical choices (1.75 m buffer spacing, 920 mm wheels), not photographic accuracy.

Annotated views (generated locally, not committed):

- z_both, right: [native](../../export/review/n_raj/z_both-right-native.svg), [model](../../export/review/n_raj/z_both-right-model.svg)
- z_both, left: [native](../../export/review/n_raj/z_both-left-native.svg), [model](../../export/review/n_raj/z_both-left-model.svg)
- [Three-quarter view](../../export/review/n_raj/three-quarter.png), [thumbnail](../../export/thumbs/veh-raj-hopper-wagon.png)

| ID | View | Element | Native pixel edges | Mesh scope(s) | Source % (x,y,w,h) | Model % | Signed delta (pp) | Baseline abs. mean (pp) | Final abs. mean (pp) | Uncertainty |
|---|---|---|---|---|---|---|---|---:|---:|---|
| R01 | z_both, right | red frame body | 12, 30, 140, 38 | `frame/body` | 8.000, 60.000, 85.333, 16.000 | 8.667, 60.000, 83.333, 16.000 | 0.667, 0.000, -2.000, -0.000 | 0.667 | 0.667 | The model keeps the XML alongz (1.3/1.9 .. 13.1/13.8 m); the native paints the sloped ends 0.1 m (rear) and 0.2 m (front) longer. |
| R02 | z_both, right | hopper 1 | 17, 4, 43, 30 | `hoppers/hopper-1/shell`, `hoppers/hopper-1/lid` | 11.333, 8.000, 17.333, 52.000 | 11.123, 8.800, 17.753, 51.200 | -0.210, 0.800, 0.420, -0.800 | 0.557 | 0.557 | Native pixel edge estimate; +/- one pixel. |
| R03 | z_both, right | hopper 2 | 47, 4, 73, 30 | `hoppers/hopper-2/shell`, `hoppers/hopper-2/lid` | 31.333, 8.000, 17.333, 52.000 | 31.123, 8.800, 17.753, 51.200 | -0.210, 0.800, 0.420, -0.800 | 0.557 | 0.557 | Its left edge meets the ladder pixels. |
| R04 | z_both, right | hopper 3 | 76, 4, 102, 30 | `hoppers/hopper-3/shell`, `hoppers/hopper-3/lid` | 50.667, 8.000, 17.333, 52.000 | 50.457, 8.800, 17.753, 51.200 | -0.210, 0.800, 0.420, -0.800 | 0.557 | 0.557 | Its right edge meets the ladder pixels. |
| R05 | z_both, right | hopper 4 | 106, 4, 133, 30 | `hoppers/hopper-4/shell`, `hoppers/hopper-4/lid` | 70.667, 8.000, 18.000, 52.000 | 70.457, 8.800, 17.753, 51.200 | -0.210, 0.800, -0.247, -0.800 | 0.514 | 0.514 | Native pixel edge estimate; +/- one pixel. |
| R06 | z_both, right | ladder 1 | 42, 7, 48, 30 | `platforms/platform/ladder` | 28.000, 14.000, 4.000, 46.000 | 28.000, 14.000, 4.000, 46.000 | 0.000, -0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R07 | z_both, right | ladder 2 | 101, 7, 107, 30 | `platforms/platform-2/ladder` | 67.333, 14.000, 4.000, 46.000 | 67.333, 14.000, 4.000, 46.000 | 0.000, -0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| R08 | z_both, right | handrail 1 | 33, 5, 57, 7 | `platforms/platform/handrails/top-rails` | 22.000, 10.000, 16.000, 4.000 | 22.000, 11.000, 16.000, 2.000 | -0.000, 1.000, 0.000, -2.000 | 0.750 | 0.750 | Top rail rows 5..6; the XML puts it at 4.3..4.4 m, one pixel lower. |
| R09 | z_both, right | handrail 2 | 92, 5, 116, 7 | `platforms/platform-2/handrails/top-rails` | 61.333, 10.000, 16.000, 4.000 | 61.333, 11.000, 16.000, 2.000 | 0.000, 1.000, 0.000, -2.000 | 0.750 | 0.750 | Top rail rows 5..6; the XML puts it at 4.3..4.4 m, one pixel lower. |
| L01 | z_both, left | red frame body | 12, 30, 140, 38 | `frame/body` | 8.000, 60.000, 85.333, 16.000 | 8.667, 60.000, 83.333, 16.000 | 0.667, 0.000, -2.000, -0.000 | 0.667 | 0.667 | The model keeps the XML alongz (1.3/1.9 .. 13.1/13.8 m); the native paints the sloped ends 0.1 m (rear) and 0.2 m (front) longer. |
| L02 | z_both, left | hopper 1 | 17, 4, 43, 30 | `hoppers/hopper-1/shell`, `hoppers/hopper-1/lid` | 11.333, 8.000, 17.333, 52.000 | 11.123, 8.800, 17.753, 51.200 | -0.210, 0.800, 0.420, -0.800 | 0.557 | 0.557 | Native pixel edge estimate; +/- one pixel. |
| L03 | z_both, left | hopper 2 | 47, 4, 73, 30 | `hoppers/hopper-2/shell`, `hoppers/hopper-2/lid` | 31.333, 8.000, 17.333, 52.000 | 31.123, 8.800, 17.753, 51.200 | -0.210, 0.800, 0.420, -0.800 | 0.557 | 0.557 | Its left edge meets the ladder pixels. |
| L04 | z_both, left | hopper 3 | 76, 4, 102, 30 | `hoppers/hopper-3/shell`, `hoppers/hopper-3/lid` | 50.667, 8.000, 17.333, 52.000 | 50.457, 8.800, 17.753, 51.200 | -0.210, 0.800, 0.420, -0.800 | 0.557 | 0.557 | Its right edge meets the ladder pixels. |
| L05 | z_both, left | hopper 4 | 106, 4, 133, 30 | `hoppers/hopper-4/shell`, `hoppers/hopper-4/lid` | 70.667, 8.000, 18.000, 52.000 | 70.457, 8.800, 17.753, 51.200 | -0.210, 0.800, -0.247, -0.800 | 0.514 | 0.514 | Native pixel edge estimate; +/- one pixel. |
| L06 | z_both, left | ladder 1 | 42, 7, 48, 30 | `platforms/platform/ladder` | 28.000, 14.000, 4.000, 46.000 | 28.000, 14.000, 4.000, 46.000 | 0.000, -0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L07 | z_both, left | ladder 2 | 101, 7, 107, 30 | `platforms/platform-2/ladder` | 67.333, 14.000, 4.000, 46.000 | 67.333, 14.000, 4.000, 46.000 | 0.000, -0.000, -0.000, 0.000 | 0.000 | 0.000 | Native pixel edge estimate; +/- one pixel. |
| L08 | z_both, left | handrail 1 | 33, 5, 57, 7 | `platforms/platform/handrails/top-rails` | 22.000, 10.000, 16.000, 4.000 | 22.000, 11.000, 16.000, 2.000 | -0.000, 1.000, 0.000, -2.000 | 0.750 | 0.750 | Top rail rows 5..6; the XML puts it at 4.3..4.4 m, one pixel lower. |
| L09 | z_both, left | handrail 2 | 92, 5, 116, 7 | `platforms/platform-2/handrails/top-rails` | 61.333, 10.000, 16.000, 4.000 | 61.333, 11.000, 16.000, 2.000 | 0.000, 1.000, 0.000, -2.000 | 0.750 | 0.750 | Top rail rows 5..6; the XML puts it at 4.3..4.4 m, one pixel lower. |
