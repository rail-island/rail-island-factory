# ICE 1 source references

**Covers** - provenance, coordinate conversion, the three cars, dimensions and reconstruction choices of `veh-ice-1`.
**Code** - `generator/ice1.ts`, `generator/unitParts.ts`, `generator/csdCoachParts.ts`, `generator/emuParts.ts`, `generator/unitComparison.ts`, `native/ice_loco/landmarks.json`.
**See also** - [comparison (power car)](COMPARISON.md), [photos](PHOTOS.md), [foreign multiple units](../../docs/models/foreign-units.md).

## Original evidence

All native files come from `janproch/vlakosimdb` revision `b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`, directory `db/train/emu/ice/`, all three by Paul Burton:

| folder | vlakosimdb | title (index.xml) | model `unit` |
|---|---|---|---|
| `native/ice_loco/` | ice loco | "ICE Loco", 9600 kW, 280 km/h | powerCar (the default) |
| `native/ice_car/` | ice car | "ICE Car" | coach |
| `native/ice_restaurant/` | ice restaurant | "ICE Restaurant" | restaurant |

Each holds `vehicle.xml` (the unchanged Windows-1250 metadata), `index.xml` (the unchanged simplemodel), `image.bmp` and the original BMPs: the power car's `z_inc.bmp` and `z_dec.bmp` (206 x 38 for 20.56 x 3.84 m; the same layout, the lettering mirrored), `x_inc.bmp` (the nose's lamps and stripe, 31 x 38), `x_dec.bmp` (its rear end, black) and `y_dec.bmp` (the roof); the coaches' `z_both.bmp` (264 x 43 for 26.4 x 4.3 m), `x_both.bmp` and `y_dec.bmp`.

## Dimensions

- Power car 20.56 m over couplers, 11.46 m bogie pivots, 3.0 m wheelbase, 1040 mm wheels (new); the train 3.02 m wide (the power car "up to 3.07 m"), 3.84 m high, the restaurant car 4.295 m (de.wikipedia "ICE 1").
- Coaches 26.40 m; 19.0 m bogie pivots, 2.5 m wheelbase and 920 mm wheels are the usual figures of German 26.4 m coaches (no ICE-specific figure was found).

## Coordinates and reconstruction

- Power car: source x from the nose tip (0) to the rear wall (20.5 m); body metres `b = 20.55 - x`, the nose at +X, the rear coupler face at b = 0, the front logo 1 cm ahead of the tip making the 20.56 m. Its BMP rows are 3.84 / 38 m: heights from boxes are scaled by 1.0105. Coaches: `b = 26.4 - x`.
- Section (`alongx`): walls 0.9 to 3.3 m, the lower chamfer to the 2.0 m wide bottom, the roof's shoulder to 3.8 m; the restaurant's roof rises to 4.3 m (0.7 m half width). Widths scaled to 3.02 m.
- Elevation (`alongz`): the nose's undercut from 0.3 m, the vertical face 0.9 to 1.4 m, the windscreen's slope from 1.8 m (0.3 m back) to 3.6 m (2.5 m back) and the roof at 3.3 m back; skirts to 0.1 m except over the bogies. vlakosimdb's openings over the bogies are moved with the published pivots.
- Paint: grey skirts to 0.5 m, white, the pale pink line and the red stripe (rows 23 to 27 of the power car, 28 to 32 of the coaches), white above; the coaches' dark window band (rows 13 to 22) with the black glass.
- Grilles, the door, the cab window, the logo, the "ICE" lettering, the coaches' windows and doors, the restaurant's dining windows, clerestory lights, kitchen door and stripe: native pixel boxes. The nose's headlights and grille at `x_inc.bmp`'s rows 21 and 22.

## Deliberate choices

- The red stripe is a paint band that wraps round the nose, as the photographs show; the BMP stops it 0.3 m short of the tip.
- One single-arm pantograph, raised, at vlakosimdb's inline position over the rear bogie (x 17.4 m), on the roof platform; vlakosimdb gives the power car one.
- The nose's coupler is hidden behind its cover (none is built); the rear end has a centre coupler, an end door and tail lamps.
- The coaches meet at centre couplers inside their bellows.

## Measurement record

`native/ice_loco/landmarks.json` holds 13 native pixel-edge boxes (11 side, 2 nose) with their model scopes, tolerances, uncertainty and, where a published dimension or photograph overrides the BMP, the constraint; `baseline.json` is the geometry's measurement when the annotations were fixed. [COMPARISON.md](COMPARISON.md) lists the normalized errors at the model revision.
