# MAV MDmot source references

**Covers** - provenance, coordinate conversion, the four cars, dimensions and reconstruction choices of `veh-mav-mdmot`.
**Code** - `generator/mavMdmot.ts`, `generator/unitParts.ts`, `generator/csdCoachParts.ts`, `generator/unitComparison.ts`, `native/mav_mdmot/landmarks.json`.
**See also** - [comparison (motor car)](COMPARISON.md), [photos](PHOTOS.md), [foreign multiple units](../../docs/models/foreign-units.md).

## Original evidence

All native files come from `janproch/vlakosimdb` revision `b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`, directory `db/train/dmu/`, all four by Ferencz Barnabas; the folders have no `image.bmp`.

| folder | vlakosimdb | title (index.xml) | model `unit` |
|---|---|---|---|
| `native/mav_mdmot/` | mav_mdmot | "MAV MDmot", 590 kW, 100 km/h | motorCar (the default) |
| `native/mav_ax/` | mav_ax | "MAV_Ax" | trailerAx |
| `native/mav_bx/` | mav_bx | "MAV_Bx" | trailerBx |
| `native/mav_btx/` | mav_btx | "MAV Btx" | drivingTrailer |

Each holds `vehicle.xml` (the unchanged Windows-1250 metadata), `index.xml` (the unchanged simplemodel) and the original BMPs, 0.1 m a pixel: `z_both.bmp` (both sides; 150 x 40 for the motor car, 220 x 40 for the others), `x_both.bmp` (the motor car's cab fronts, the trailers' gangway ends), the Btx's `x_dec.bmp` (its cab) and `x_inc.bmp` (its gangway end), and `y_dec.bmp` (the roofs). The vlakosimdb folder `mav_mdmot` also holds BMPs of the same names outside `model/`; they differ from the model's and are not used.

## Dimensions

- Motor car: 15.52 m over buffers, 2.85 m wide, 4.32 m high (with roof equipment), 8.05 m bogie pivots, 2.4 m wheelbase, 920 mm wheels (de.wikipedia "MAV-Baureihe MDmot").
- Trailers: the published set lengths (82.38 m for MDmot, Bx, Ax and Btx; 127.18 m for MDmot, three Bx, Ax and Btx) give 22.40 m for the Bx and, with vlakosimdb's equal Ax, 22.06 m for the Btx, matching vlakosimdb's `xsize` (22.4, 22.4, 22.06).
- Trailers' bogies: the BMP's bogie drawings, 15.5 m apart, 2.5 m wheelbase (no published figure was found).
- Heights: scaled by 1.07 from the XML (see below); widths the published 2.85 m.

## Coordinates and reconstruction

- Source x runs along each BMP from its left edge. The motor car and the trailers: body metres `b = x0 - x` (x0 15.26 m and 22.2 m, the -X buffer faces), so the BMP's left end is +X; the Btx's cab is at the BMP's right: `b = x + 0.1`. Factory `X = b - length / 2`.
- Sections (`alongx`): the motor car's (bottom chamfer, vertical walls 0.6 to 3.0 m, the roof's curve) and the trailers' (Ax: chamfer to 0.7 m, walls to 3.2 m, roof 3.6 m), each centred (vlakosimdb draws them 0.1 m off the centre line) and scaled to 2.85 m.
- Elevations (`alongz`): the cab fronts vertical from the buffer beam to 1.2 m, 0.1 m forward at 1.9 m, back to the windscreens' top at 2.9 m and the roof (the motor car's front at x 0.7 m, its second cab mirrored at 14.3 m; the Btx's at 21.3 m); the motor car's roof 3.5 m with the radiator hump (4.6 to 6.3 m, 3.8 m). vlakosimdb paints the bogies on sides that reach the rail; the model's bodies stop at the sill (0.9 m on the motor car, 1.0 m on the trailers) with bogies built under them.
- Heights: every source height times 1.07. Scaled from the buffers' 1.75 m spacing on `photo-mdmot-3038-front-mateszalka-1996.jpg`, the motor car's roof stands about 3.7 m high (the XML's 3.5 m), its lamp band 1.3 to 1.9 m (the XML's 1.2 to 1.7 m) and the windscreens' bottom 2.24 m (2.2 m).
- Paint: side red over a grey sill and the grey roof, the trailers' yellow line under the roof; the cab fronts' beam, cream lamp band, orange line, red and roof from the front BMPs.
- Windows (drop lights with their sash bars on the trailers; the Bx's and Btx's first window frosted), doors with handrails and steps, grilles, the radiator louvres, class numerals, the cab front's windscreens, lamps, number plate and roof headlight: native pixel boxes.

## Deliberate choices

- The motor car's cab doors: the BMP shows a window and a handrail by each cab; the door is taken as the window next to the cab at both ends (the second cab's handrail is 2 px off the mirror of the first).
- Buffers, screw couplings and buffer beams at both ends of every car; gangway bellows at the trailers' and the Btx's inner ends.
- Exhaust stacks, fans and horns on the motor car's roof after the photographs; the BMP shows only the hump and its louvres.

## Measurement record

`native/mav_mdmot/landmarks.json` holds 16 native pixel-edge boxes (12 side, 4 cab front) with their model scopes, tolerances and uncertainty; `baseline.json` is the geometry's measurement when the annotations were fixed. [COMPARISON.md](COMPARISON.md) lists the normalized errors at the model revision; with the height and width scales undone the residual is the transfer itself.
