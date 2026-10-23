# Tatra T6A5 source references

**Covers** - provenance, coordinate mapping, dimensions and reconstruction choices of `veh-tatra-t6`.
**Code** - `generator/trams.ts` (`tatraT6`, `T6_MAP`), `generator/tramKit.ts`, `native/tram_ckd_t6/landmarks.json`.
**See also** - [comparison](COMPARISON.md), [photos](PHOTOS.md), [trams](../../docs/models/trams.md).

## Original evidence

`native/tram_ckd_t6/` comes unchanged from `janproch/vlakosimdb` revision `b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`, `db/tram/tram_ckd_t6` ("Tram CKD T6 Solo", author Vojtech Vohlidka; the original spelling is kept in the Windows-1250 `vehicle.xml`): the simplemodel `index.xml`, the native BMPs and `image.bmp`. No `_4x` texture was used.

`db/train/tram/rtram_t6` ("Tram T6", the same author) is archived in the game (`rail-island-webapp/db/archived.json`, `train-tram-rtram-t6`) and was deliberately not transferred.

## Coordinates and mapping

`z_inc` / `z_dec` map 160 x 60 px to x 0..16 m, y 0..6 m; `x_inc` / `x_dec` 30 x 60 px to z -1.5..1.5 m, y 0..6 m. `x_inc` (headlights) is the x = 0 end, the model's front; `z_inc` (the doors) the Factory right.

X = (8.0 - x) * 14.7 / 15.2, Y = y * 3.165 / 3.5, Z = -z * 2.5 / 2.4

The drawing's body is 15.2 m long (0.4..15.6 m) and 3.5 m high; the published T6A5 (Wikipedia en/cs, "Tatra T6A5") is 14,700 mm long, 2,500 mm wide and 3,165 mm high. 700 mm wheels, a 1.9 m bogie wheelbase and standard gauge are real sizes.

## Reconstruction

- Body: the `alongx` section (flat sides to 3.4 m, crown 3.5 m), the `alongy` plan tapering to 0.8 m half width at the ends, the `alongz` elevation with the raked cab fronts (0.4, 1.7) to (0.8, 3.3) and skirts down to 0.4 m between the bogies.
- Paint: cream with a red belt 0.7..1.6 m (z_inc rows 44..52), a white line over it and a grey window band 1.8..3.2 m (rows 28..42, darkened toward the photographs); the cabs a grey bumper 0.72..0.92 m and a grey strip under the windscreen.
- Right side: three two-leaf plug doors at columns 14, 72 and 130, four windows; left side: seven windows with a top transom at row 32.
- Roof: a single-arm pantograph, hinge at x 4.9 m, the knee toward the rear and the head over 4.4 m (as drawn on z_inc), raised to the 5.5 m display wire; the equipment box 8.9..12.4 m and three vents from the XML.

## Fleet number

`8745`, painted on the sides: Prague's T6A5 8745, photographed (its photograph is listed in [PHOTOS.md](PHOTOS.md) but could not be downloaded).

## Measurement record

`native/tram_ckd_t6/landmarks.json` holds 18 native boxes (z_inc, z_dec, x_inc); `baseline.json` the first authored geometry's. See [COMPARISON.md](COMPARISON.md).

## Direction indicators

The vlakosimdb drawing shows no indicators; their places come from photographs ([PHOTOS.md](PHOTOS.md)):

| file | URL | author | licence | use |
|---|---|---|---|---|
| `photo-t6a5-8601-front.jpg` | https://commons.wikimedia.org/wiki/File:Praha%2C_Tatra_T6A5_%C4%8D._8601.jpg | Oleksandr Dede | CC BY-SA 4.0 | front: an upright cluster at each corner of the end, the amber lamp on top, just above the headlights |
| `photo-t6a5-pair-three-quarter.jpg` | https://commons.wikimedia.org/wiki/File:Praha%2C_souprava_tramvaj%C3%AD_Tatra_T6A5.jpg | Petr Dadak from Ostrava-Poruba 8, Czech Republic | CC BY-SA 2.0 | the same cluster from the side, on the cab corner |
| `photo-t6a5-8626-rear.jpg` | https://commons.wikimedia.org/wiki/File:Tatra_T6A5%2C_-8625%2B8626%2C_DP_Praha_%2842284199544%29.jpg | Janusz Jakubowski from Warsaw, Poland | CC BY 2.0 | rear: the same clusters on the rear corners (downloaded for this) |

The model draws the amber lenses only, round, at the corners of both end caps (`indicators` scopes); see [trams.md](../../docs/models/trams.md).
