# CD 140 040: native landmark comparison

**Covers** - the default build of `veh-cd-140` against 14 boxes annotated on the native vlakosimdb BMPs (`native/landmarks.json`).
**Code** - `generator/czElectricComparison.ts`, `generator/czElectricReport.ts`, `test/czElectrics.test.ts`
**See also** - [SOURCES.md](SOURCES.md), [docs/models/cz-electrics.md](../../docs/models/cz-electrics.md)

Model revision: `b73f62f` (measured when this file was written). Mapping: side column px = 85.5 - x / 0.09006 (the native body scaled to the published 14.50 m), row = 10 (6 - y); front column = 10 (1.5 - z). Canvases: x_front 30 x 60 px (`native/x_both.bmp`), z_right 180 x 60 px (`native/z_both.bmp`).

Each vector is (left, top, width, height) in native pixels; percentages are 100*x/W, 100*y/H, 100*w/W, 100*h/H of the view's canvas, origin top left. Delta = model minus source in percentage points. MAE = sum(|delta|) / (4 * boxes). Model boxes are the bounds of the actual GLB vertices of the named scopes, occluded vertices included.

| View | Boxes | MAE baseline (pp) | MAE now (pp) |
|---|---:|---:|---:|
| x_front | 6 | 0.86 | 0.86 |
| z_right | 8 | 0.34 | 0.34 |
| all | 14 | 0.57 | 0.57 |

| ID | View | Element | Source px | Model px | Source % | Model % | Delta pp | Tolerance px | Note |
|---|---|---|---|---|---|---|---|---:|---|
| F01 | x_front | front-cab/windscreen/right-pane/frame | 3.00, 26.00, 11.00, 7.00 | 2.80, 25.80, 11.20, 7.40 | 10.00, 43.33, 36.67, 11.67 | 9.33, 43.00, 37.33, 12.33 | -0.67, -0.33, 0.67, 0.67 | 1.01 | Windscreen pane with its frame. |
| F02 | x_front | front-cab/windscreen/left-pane/frame | 16.00, 26.00, 11.00, 7.00 | 16.00, 25.80, 11.20, 7.40 | 53.33, 43.33, 36.67, 11.67 | 53.33, 43.00, 37.33, 12.33 | 0.00, -0.33, 0.67, 0.67 | 1.01 | As F01. |
| F03 | x_front | front-cab/whiskers/white | 7.00, 38.00, 16.00, 7.00 | 7.00, 37.95, 16.00, 6.45 | 23.33, 63.33, 53.33, 11.67 | 23.33, 63.25, 53.33, 10.75 | -0.00, -0.08, 0.00, -0.92 | 1.5 | The white V below the white band; its pale blue edge (native colour #a8c0d8) is a separate panel. |
| F04 | x_front | front-cab/number-plate | 10.00, 45.00, 10.00, 2.00 | 10.50, 45.00, 9.00, 1.70 | 33.33, 75.00, 33.33, 3.33 | 35.00, 75.00, 30.00, 2.83 | 1.67, 0.00, -3.33, -0.50 | 1.01 | Red plate under the V's tip. |
| F05 | x_front | front-cab/lamps/right-lamp | 4.00, 43.00, 2.00, 2.00 | 4.00, 43.00, 3.00, 3.00 | 13.33, 71.67, 6.67, 3.33 | 13.33, 71.67, 10.00, 5.00 | -0.00, -0.00, 3.33, 1.67 | 1.5 | Low lamp, a 2 x 2 px patch; the XML light clip gives a 0.3 m lens. |
| F06 | x_front | front-cab/lamps/top-lamp | 13.00, 22.00, 4.00, 3.00 | 13.50, 21.90, 3.00, 3.00 | 43.33, 36.67, 13.33, 5.00 | 45.00, 36.50, 10.00, 5.00 | 1.67, -0.17, -3.33, -0.00 | 1.01 | Top lamp over the windscreen. |
| S01 | z_right | sides/right-side/portholes/porthole-1 | 37.00, 26.00, 8.00, 8.00 | 36.28, 26.20, 8.44, 7.60 | 20.56, 43.33, 4.44, 13.33 | 20.16, 43.67, 4.69, 12.67 | -0.40, 0.33, 0.24, -0.67 | 1.01 | Porthole with its rim. |
| S02 | z_right | sides/right-side/portholes/porthole-3 | 73.00, 26.00, 8.00, 8.00 | 72.28, 26.20, 8.44, 7.60 | 40.56, 43.33, 4.44, 13.33 | 40.16, 43.67, 4.69, 12.67 | -0.40, 0.33, 0.24, -0.67 | 1.01 | Porthole with its rim. |
| S03 | z_right | sides/right-side/portholes/porthole-6 | 127.00, 26.00, 8.00, 8.00 | 126.28, 26.20, 8.44, 7.60 | 70.56, 43.33, 4.44, 13.33 | 70.16, 43.67, 4.69, 12.67 | -0.40, 0.33, 0.24, -0.67 | 1.01 | Porthole with its rim. |
| S04 | z_right | sides/right-side/front-cab/door/window | 18.00, 26.00, 6.00, 8.00 | 17.50, 26.20, 6.00, 7.60 | 10.00, 43.33, 3.33, 13.33 | 9.72, 43.67, 3.33, 12.67 | -0.28, 0.33, 0.00, -0.67 | 1.01 | Cab door window. |
| S05 | z_right | sides/right-side/number-plate | 72.00, 40.00, 9.00, 3.00 | 72.18, 40.50, 9.44, 2.30 | 40.00, 66.67, 5.00, 5.00 | 40.10, 67.50, 5.24, 3.83 | 0.10, 0.83, 0.24, -1.17 | 1.01 | Red side plate, off the middle as drawn. |
| S06 | z_right | body/shell/side-right/band-3, body/shell/front/band-3, body/shell/rear/band-3 | 5.00, 35.00, 161.00, 1.00 | 5.08, 35.00, 160.83, 1.00 | 2.78, 58.33, 89.44, 1.67 | 2.82, 58.33, 89.35, 1.67 | 0.05, 0.00, -0.09, -0.00 | 1.01 | The pale blue line under the light band, 2.4 to 2.5 m, round the whole body. |
| S07 | z_right | body/shell/side-right/band-1, body/shell/front/band-1, body/shell/rear/band-1 | 5.00, 37.00, 161.00, 1.00 | 5.00, 37.00, 161.00, 1.00 | 2.78, 61.67, 89.44, 1.67 | 2.78, 61.67, 89.44, 1.67 | 0.00, 0.00, 0.00, -0.00 | 1.01 | The white line over the dark blue lower body, round the whole body. |
| S08 | z_right | roof-equipment/resistor-box/loft-2, roof-equipment/resistor-box/slats | 55.00, 17.00, 61.00, 2.00 | 55.00, 17.70, 61.00, 1.30 | 30.56, 28.33, 33.89, 3.33 | 30.56, 29.50, 33.89, 2.17 | 0.00, 1.17, -0.00, -1.17 | 1.5 | The upper part of the resistor box with its slats (XML roof clip 5.5..11.6 m, scaled). |
