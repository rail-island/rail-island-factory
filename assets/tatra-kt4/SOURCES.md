# Tatra KT4 source references

**Covers** - provenance, coordinate mapping, dimensions, articulation and reconstruction choices of `veh-tatra-kt4`.
**Code** - `generator/trams.ts` (`tatraKt4`, `KT4_MAP`), `generator/tramKit.ts` (`articulate`), `native/tram_ckd_kt4/landmarks.json`.
**See also** - [comparison](COMPARISON.md), [photos](PHOTOS.md), [trams](../../docs/models/trams.md), [vehicle rig](../../docs/models/vehicle-rig.md).

## Original evidence

`native/tram_ckd_kt4/` comes unchanged from `janproch/vlakosimdb` revision `b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`, `db/tram/tram_ckd_kt4` ("Tram CKD Kt4", author Jan Prochazka): `vehicle.xml`, the simplemodel `index.xml` and the native BMPs (no `image.bmp` in the source). No `_4x` texture was used.

## Coordinates and mapping

`z_inc` / `z_dec` map 220 x 40 px to x 0..22 m, y 0..4 m; `x_inc` / `x_dec` 30 x 40 px to z -1.5..1.5 m, y 0..4 m.

X = (11.1 - x) * 18.11 / 21.2, Y = y * 3.1 / 3.25, Z = -z

The drawing is 21.2 m long over its bodies (0.5..21.7 m), 18 % longer than the published KT4 (cs.wikipedia "Tatra KT4": 18,110 mm without couplers, 2,200 mm wide, 3,100 mm high). The width needs no scaling. Wheels 700 mm, bogie wheelbase 1.9 m, standard gauge.

## Articulation

Two sections, `section0` 0.5..10.6 m and `section1` 11.5..21.7 m (the XML's bodies), each on one bogie under its middle (5.75 and 16.2 m, the BMP's wheels; 8.9 m apart in the model), joined by one bellows over the 0.9 m gap; the hinge in the middle of the gap at 0.86 m. No steering; 40 degrees bend.

## Reconstruction

- Body: the XML's section bulges to 1.1 m half width at the belt (1.7 m) and pitches to the roof, cut flat at 3.2 m by the elevation; the plan tapers to 0.45 m at the ends.
- Paint: white with a red belt 0.8..1.5 m (z_inc rows 25..31), grey window frames. The end BMPs draw the bands at other heights (red 1.4..2.0 m); the model follows the sides, and the comparison lists the end rows with that note.
- Right side: four four-leaf doors (columns 20, 80, 124, 184); the KT4 is single-ended, the left side windows only (twelve, with a transom at row 16).
- Roof: the diamond pantograph over the front section's bogie (inline at 5.72 m) raised to the 5.5 m display wire; the resistor box over the rear bogie (16.3..17.7 m, z_inc rows 3..6) and vents.

## Fleet number

None: the KT4 never ran in Czech passenger service and the drawing's livery belongs to no operator photographed; the Tallinn photographs show the type only.

## Measurement record

`native/tram_ckd_kt4/landmarks.json` holds 17 native boxes (z_inc, x_inc); `baseline.json` the first authored geometry's. See [COMPARISON.md](COMPARISON.md).
