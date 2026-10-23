# Tatra T3 source references

**Covers** - provenance, coordinate mapping, dimensions and reconstruction choices of `veh-tatra-t3`.
**Code** - `generator/trams.ts` (`tatraT3`, `T3_MAP`), `generator/tramKit.ts`, `native/tram_ckd_t3/landmarks.json`.
**See also** - [comparison](COMPARISON.md), [photos](PHOTOS.md), [trams](../../docs/models/trams.md).

## Original evidence

All native files come from `janproch/vlakosimdb` revision `b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`, unchanged:

| folder | vlakosimdb | title (index.xml) | author | model value |
|---|---|---|---|---|
| `native/tram_ckd_t3/` | `db/tram/tram_ckd_t3` | Tram CKD T3 Solo | Jan Prochazka | `variant` t3 (default) |
| `native/tram_ckd_t3m/` | `db/tram/tram_ckd_t3m` | Tram CKD T3M Solo | Jan Prochazka | `variant` t3m |
| `native/tram_ckd_t3x/` | `db/tram/tram_ckd_t3x` | Tram CKD T3 Prototyp | Jan Prochazka | `variant` t3prototype |

Each holds `vehicle.xml` (the vehicle's `index.xml`, Windows-1250), `index.xml` (the simplemodel: `alongx` / `alongy` / `alongz` clips, colorizes, the `/pantdbl` inline), the native BMPs (`x_inc`, `x_dec`, `y_dec`, `z_inc`, `z_dec`, 0.1 m a pixel) and `image.bmp`. No `_4x` texture was used or kept.

T3M differs from T3 only in the front's destination (an LED display in place of the blue route-number box) and a roof box; the prototype has blunter ends in plan (half widths 1.0 / 1.1 m at 0.8 / 1.2 m), a flatter roof crown and its own blue, yellow and navy paint. All three share one body builder.

## Coordinates and mapping

`colorize`: `z_inc` / `z_dec` map 160 x 60 px to x 0..16 m, y 0..6 m; `x_inc` / `x_dec` 30 x 40 px to z -1.5..1.5 m, y 0..4 m. `x_inc` (headlights, route box) paints the x = 0 end, which the model makes its front (+X); `z_inc` (the doors) paints the -z side, the Factory right (+Z). The Factory frame is a 180 degree turn of the source's about Y:

X = (7.85 - x) * 14.0 / 14.8, Y = y * 3.05 / 3.4, Z = -z * 2.5 / 2.4

The drawing is about 6 % long and 11 % tall: its body runs 0.5..15.3 m (14.8 m) and its roof crown is at 3.4 m. The factors map it onto the published body (Wikipedia en/cs, "Tatra T3": length 14,000 mm, width 2,500 mm, height 3,050 mm). Wheels (700 mm), the bogie wheelbase (1.9 m) and standard gauge (1.435 m) are kept at their real sizes rather than scaled; the bogie pivots land 6.43 m apart (published 6.4 m).

## Reconstruction

- Body: the `alongx` section (sides to 3.0 m, eaves 3.2 / 3.3 m, crown 3.4 m) scaled by the `alongy` plan (tapered ends) and clamped by the `alongz` elevation: the raked windscreen from (0.5, 1.7) to (0.8, 2.9), the roof visor, and skirts down to 0.4 m between the bogie cut-outs. The cabs (0.5..1.2 and 14.45..15.3 m) carry the glass as a band of the body, wrapping onto the cab sides as on the BMPs.
- Paint (z_inc rows): cream skirt, red belt 0.95..1.8 m (rows 42..50), cream window band, grey roof; the cabs add the brown bumper strip 0.85..1.0 m.
- Right side: three four-leaf folding doors at columns 14, 78 and 126, five windows (rows 30..41, a transom at row 35); left side: eight windows at a 1.6 m pitch.
- Front: two headlights in the belt, the route-number box over the windscreen (T3) or a destination display (T3M, prototype); rear: three red lamps.
- Roof: the diamond pantograph at x 4.75 m (the inline sits at 4.81 m), raised to the 5.5 m display wire; the resistor box at 10.9..12.6 m (drawn on z_dec; in the XML of t3m and t3x); three vents.

## Fleet numbers

Prague numbers, painted on the sides: `7290` (t3, legible on `photo-t3sucs-7290-door-side.jpg`), `8029` (t3m, `photo-t3m-8029-window-side.jpg`) and `6340` (t3prototype: illustrative, in Prague's four-digit format: no photograph of this livery was found). Tram fleet numbers carry no check digit.

## Measurement record

`native/tram_ckd_t3/landmarks.json` holds 20 native pixel-edge boxes (z_inc, z_dec, x_inc) with their model scopes, tolerances and uncertainty; `baseline.json` is the first authored geometry's measurement. See [COMPARISON.md](COMPARISON.md).

## Direction indicators

The vlakosimdb drawings show no indicators; their places come from photographs ([PHOTOS.md](PHOTOS.md)):

| file | URL | author | licence | use |
|---|---|---|---|---|
| `photo-t3sucs-front-three-quarter.jpg` | https://commons.wikimedia.org/wiki/File:Smy%C4%8Dka_Podbaba%2C_Tatra_T3SUCS_na_vn%C4%9Bj%C5%A1%C3%AD_koleji.jpg | Honza Groh ( Jagro ) | CC BY-SA 3.0 | front: an amber-over-clear cluster on each cab corner, in the belt just above the headlights |
| `photo-t3sucs-7290-door-side.jpg` | https://commons.wikimedia.org/wiki/File:Praha%2C_Tatra_T3SUCS_%C4%8D._7290.jpg | Oleksandr Dede | CC BY-SA 4.0 | the same cluster from the side: behind the curved front, the amber lamp on top |
| `photo-t3-6102-rear.jpg` | https://commons.wikimedia.org/wiki/File:Tram_Tatra_T3_Praha_6102-zezadu.jpg | SJu | CC BY-SA 3.0 | rear: the amber outer half of each oval tail-lamp cluster, outboard of the red lamp (downloaded for this) |

The model draws the amber lenses only (`indicators` scopes); see [trams.md](../../docs/models/trams.md).
