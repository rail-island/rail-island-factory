# Tatra KT8D5 source references

**Covers** - provenance, coordinate mapping, dimensions, articulation and reconstruction choices of `veh-tatra-kt8`.
**Code** - `generator/trams.ts` (`tatraKt8`, `KT8_MAP`), `generator/tramKit.ts` (`articulate`), `native/tram_ckd_kt8/landmarks.json`.
**See also** - [comparison](COMPARISON.md), [photos](PHOTOS.md), [trams](../../docs/models/trams.md), [vehicle rig](../../docs/models/vehicle-rig.md).

## Original evidence

From `janproch/vlakosimdb` revision `b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`, unchanged:

| folder | vlakosimdb | title | author | model value |
|---|---|---|---|---|
| `native/tram_ckd_kt8/` | `db/tram/tram_ckd_kt8` | Tram CKD Kt8 | Jan Prochazka | `livery` redWhite (default) |
| `native/tram_ckd_kt8_2/` | `db/tram/tram_ckd_kt8#2` | Tram CKD Kt8 - Red | Vojtech Vohlidka | `livery` red |
| `native/tram_ckd_kt8m/` | `db/tram/tram_ckd_kt8m` | Tram CKD Kt8 Modern | Vojtech Vohlidka | `livery` modern |

All three share the body (their `alongx` / `alongy` and side layouts are identical); they differ in paint and, for the modern one, longer roof covers (3.1..10.3 m and 18..25.2 m). The modern drawing is **not** the KT8D5R.N2 low-floor rebuild: its middle section keeps the high floor, the original doors and bogies, so it is a livery (grey window band), not a variant. `3.bmp` is a 5 x 5 px material swatch.

## Coordinates and mapping

`z_inc` / `z_dec` map 290 x 60 px to x 0..29 m, y 0..6 m (the two sides are drawn alike: doors on both, the tram is double-ended); `x_both` 30 x 40 px to z -1.5..1.5 m, y 0..4 m, both ends.

X = (14.15 - x) * 30.3 / 27.3, Y = y * 3.145 / 3.4, Z = -z * 2.48 / 2.4

The drawing's bodies run 0.5..27.8 m (27.3 m); the published KT8D5 (cs.wikipedia "Tatra KT8D5": length 30,300 mm without couplers, width 2,480 mm, height 3,145 mm) is 11 % longer. Wheels 700 mm, bogie wheelbase 1.9 m, standard gauge.

## Articulation

Three sections, `section0` 0.5..10.5 m, `section1` 11.2..17.1 m, `section2` 17.8..27.8 m (the XML's `alongz` bodies), joined by two bellows (`joint0`, `joint1`) over the 0.7 m gaps; each hinge in the middle of its gap at floor height (0.83 m). Four bogies at 4.45, 10.85, 17.35 and 23.85 m (the BMP's wheels): one under each outer section's cab end, the middle section carrying the two under the joints - the KT8D5's arrangement, the outer sections resting on the middle one at the joints. The rig has no steering (rail vehicles follow the track) and allows 40 degrees per joint.

## Reconstruction

- Paint: white with a red belt 0.9..1.8 m (rows 42..50), the cab fronts dark grey below the belt; all red for `red`; a grey window band 1.88..3.15 m for `modern`.
- Doors: five per side (columns 16, 66, 133, 199, 254), the outer two three-leaf, the others four-leaf; eight windows with a top transom at row 34.
- Pantographs: the front section's diamond collector raised to the 5.5 m display wire; the rear section's second collector folded (the source draws it folded), so exactly one is raised.
- Roof: equipment covers over the outer sections and the small route-number boxes over the cabs from the XML.

## Fleet number

`9009`, painted on the middle section: Prague's KT8D5 9009 on `photo-kt8d5-9009-door-side.jpg`.

## Measurement record

`native/tram_ckd_kt8/landmarks.json` holds 23 native boxes (z_inc, x_both); `baseline.json` the first authored geometry's (mapped with the 0.4..27.8 m length before the 0.5 m XML end was adopted). See [COMPARISON.md](COMPARISON.md).
