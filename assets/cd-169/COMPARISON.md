# CD 169 001: native landmark comparison

**Covers** - the default build of `veh-cd-169` against 16 boxes annotated on the native vlakosimdb BMPs (`native/landmarks.json`).
**Code** - `generator/czElectricComparison.ts`, `generator/czElectricReport.ts`, `test/czElectrics.test.ts`
**See also** - [SOURCES.md](SOURCES.md), [docs/models/cz-electrics.md](../../docs/models/cz-electrics.md)

Model revision: `1ea204d` (measured when this file was written). Mapping: side column px = 90 - x / 0.0971 (the native body scaled to the published 16.70 m), row = 10 (6 - y); front column = 10 (1.5 - z). Canvases: x_front 30 x 60 px (`native/x_both.bmp`), z_right 180 x 60 px (`native/z_both.bmp`).

Each vector is (left, top, width, height) in native pixels; percentages are 100*x/W, 100*y/H, 100*w/W, 100*h/H of the view's canvas, origin top left. Delta = model minus source in percentage points. MAE = sum(|delta|) / (4 * boxes). Model boxes are the bounds of the actual GLB vertices of the named scopes, occluded vertices included.

| View | Boxes | MAE baseline (pp) | MAE now (pp) |
|---|---:|---:|---:|
| x_front | 6 | 0.83 | 0.83 |
| z_right | 10 | 0.18 | 0.18 |
| all | 16 | 0.43 | 0.43 |

| ID | View | Element | Source px | Model px | Source % | Model % | Delta pp | Tolerance px | Note |
|---|---|---|---|---|---|---|---|---:|---|
| F01 | x_front | front-cab/windscreen/right-pane/rubber | 2.00, 26.00, 13.00, 9.00 | 2.30, 25.50, 12.10, 9.00 | 6.67, 43.33, 43.33, 15.00 | 7.67, 42.50, 40.33, 15.00 | 1.00, -0.83, -3.00, 0.00 | 1.01 | Windscreen pane with its rubber, on the raked face. |
| F02 | x_front | front-cab/windscreen/left-pane/rubber | 15.00, 26.00, 13.00, 9.00 | 15.60, 25.50, 12.10, 9.00 | 50.00, 43.33, 43.33, 15.00 | 52.00, 42.50, 40.33, 15.00 | 2.00, -0.83, -3.00, 0.00 | 1.01 | As F01. |
| F03 | x_front | body/shell/front/band-1 | 0.00, 41.00, 30.00, 4.00 | 0.30, 41.00, 29.40, 4.00 | 0.00, 68.33, 100.00, 6.67 | 1.00, 68.33, 98.00, 6.67 | 1.00, 0.00, -2.00, -0.00 | 1.01 | The dark buffer band across the nose, 1.5 to 1.9 m. |
| F04 | x_front | front-cab/lamps/lamp-1 | 2.00, 42.00, 2.00, 2.00 | 1.60, 41.80, 2.40, 2.40 | 6.67, 70.00, 6.67, 3.33 | 5.33, 69.67, 8.00, 4.00 | -1.33, -0.33, 1.33, 0.67 | 1.5 | Outer lamp in the dark band, a 2 x 2 px patch. |
| F05 | x_front | front-cab/headlight | 12.00, 35.00, 6.00, 4.00 | 11.80, 35.00, 6.40, 4.00 | 40.00, 58.33, 20.00, 6.67 | 39.33, 58.33, 21.33, 6.67 | -0.67, 0.00, 1.33, 0.00 | 1.01 | The twin headlight box under the windscreen (photographs of 169 001-5); the number plate sits in the dark band between the lamps. |
| F06 | x_front | front-cab/roof-vent | 10.00, 21.00, 10.00, 3.00 | 10.00, 21.20, 10.00, 2.80 | 33.33, 35.00, 33.33, 5.00 | 33.33, 35.33, 33.33, 4.67 | 0.00, 0.33, 0.00, -0.33 | 1.01 | The louvred vent on the roof leading edge (photographs of 169 001-5; the native draws it light grey). |
| S01 | z_right | sides/right-side/stripe/blue | 25.00, 42.00, 126.00, 2.00 | 25.00, 42.00, 126.00, 2.00 | 13.89, 70.00, 70.00, 3.33 | 13.89, 70.00, 70.00, 3.33 | -0.00, 0.00, 0.00, -0.00 | 1.01 | Blue stripe. |
| S02 | z_right | sides/right-side/stripe/white | 25.00, 41.00, 126.00, 4.00 | 25.00, 41.00, 126.00, 4.00 | 13.89, 68.33, 70.00, 6.67 | 13.89, 68.33, 70.00, 6.67 | -0.00, 0.00, 0.00, -0.00 | 1.01 | White stripe edges. |
| S03 | z_right | sides/right-side/roof-grilles/grille-1 | 115.00, 21.00, 37.00, 5.00 | 115.00, 21.10, 36.00, 4.80 | 63.89, 35.00, 20.56, 8.33 | 63.89, 35.17, 20.00, 8.00 | -0.00, 0.17, -0.56, -0.33 | 1.01 | Roof-edge grille on the chamfer, rear section. |
| S04 | z_right | sides/right-side/roof-grilles/grille-2 | 67.00, 21.00, 47.00, 5.00 | 67.00, 21.10, 46.00, 4.80 | 37.22, 35.00, 26.11, 8.33 | 37.22, 35.17, 25.56, 8.00 | 0.00, 0.17, -0.56, -0.33 | 1.01 | Middle grille. |
| S05 | z_right | sides/right-side/roof-grilles/grille-3 | 28.00, 21.00, 38.00, 5.00 | 28.00, 21.10, 37.00, 4.80 | 15.56, 35.00, 21.11, 8.33 | 15.56, 35.17, 20.56, 8.00 | 0.00, 0.17, -0.56, -0.33 | 1.01 | Front grille. |
| S06 | z_right | sides/right-side/door | 17.00, 28.00, 8.00, 20.00 | 16.50, 27.80, 8.00, 19.70 | 9.44, 46.67, 4.44, 33.33 | 9.17, 46.33, 4.44, 32.83 | -0.28, -0.33, 0.00, -0.50 | 1.5 | Cab door between the handrails at native columns 17 and 24; the bottom is estimated from the handrail lines. |
| S07 | z_right | sides/right-side/door/window | 18.00, 28.00, 6.00, 7.00 | 17.53, 28.20, 5.94, 6.30 | 10.00, 46.67, 3.33, 11.67 | 9.74, 47.00, 3.30, 10.50 | -0.26, 0.33, -0.03, -1.17 | 1.01 | Door window. |
| S08 | z_right | sides/right-side/roundel | 162.00, 28.00, 8.00, 7.00 | 162.29, 27.99, 7.42, 7.02 | 90.00, 46.67, 4.44, 11.67 | 90.16, 46.65, 4.12, 11.70 | 0.16, -0.02, -0.32, 0.03 | 1.01 | The maker's roundel at the rear end. |
| S09 | z_right | sides/right-side/number-plate | 84.00, 37.00, 11.00, 3.00 | 84.03, 37.00, 11.02, 3.00 | 46.67, 61.67, 6.11, 5.00 | 46.68, 61.67, 6.12, 5.00 | 0.01, 0.00, 0.01, -0.00 | 1.01 | Side plate. |
| S10 | z_right | roof-equipment/roof-cover/loft-1 | 69.00, 17.00, 43.00, 4.00 | 68.99, 17.00, 42.02, 4.10 | 38.33, 28.33, 23.89, 6.67 | 38.33, 28.33, 23.35, 6.83 | -0.01, -0.00, -0.54, 0.17 | 2 | The raised roof cover (XML roof clip 6.9..11.1 m, 3.9..4.3 m); its native edge is ragged. |
