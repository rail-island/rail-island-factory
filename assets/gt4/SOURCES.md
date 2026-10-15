# GT4 source references

**Covers** - provenance, coordinate mapping, dimensions, articulation and reconstruction choices of `veh-kvag-gt4`.
**Code** - `generator/trams.ts` (`gt4Tram`, `GT4_MAP`), `generator/tramKit.ts` (`articulate`), `native/tram_kvag_gt4/landmarks.json`.
**See also** - [comparison](COMPARISON.md), [photos](PHOTOS.md), [trams](../../docs/models/trams.md), [vehicle rig](../../docs/models/vehicle-rig.md).

## Original evidence

`native/tram_kvag_gt4/` comes unchanged from `janproch/vlakosimdb` revision `b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`, `db/tram/tram_kvag_gt4` ("Tram KVAG GT4", author Karola Meyer): `vehicle.xml`, the simplemodel `index.xml` and the native BMPs. No `_4x` texture was used.

The source is not an articulated tram: it draws one rigid, single-ended car of about 14.1 m with three double doors on the right and none on the left, and its style `tram2v` couples two copies of it back to back (vlakosimdb `scripts/models/articulate.ts`). The Factory model is the type the name gives - the Maschinenfabrik Esslingen GT4, a two-section articulated car - at its published dimensions, in the drawing's cream and red.

## Coordinates and mapping

`z_inc` / `z_dec` map 160 x 40 px to x 0..16 m, y 0..4 m; `x_inc` / `x_dec` 30 x 40 px to z -1.5..1.5 m, y 0..4 m.

X = (7.25 - x) * 18.2 / 14.1, Y = y * 3.3 / 3.6, Z = -z * 2.2 / 2.4

The drawing's body 0.3..14.4 m becomes the GT4's 18.2 m body and, with the couplings, its 18.8 m (de.wikipedia "Maschinenfabrik Esslingen GT4": 18,800 mm over the couplings, 2,200 mm wide, 3,800 mm high over the lowered pantograph, 10,000 mm between the bogie pivots, 1,700 mm bogie wheelbase). Most GT4 ran on metre gauge; eight were standard gauge, which the model uses as the brief asks.

## Articulation and the deviations from the drawing

- The joint is cut in at x 7.1..7.4 m: `section0` 0.3..7.1 m (the cab, the front door and three windows), `section1` 7.4..14.4 m. The hinge is in the middle of the gap at 0.87 m.
- The drawing's middle door (columns 62..79) straddles that cut; it moves 1.3 m back to stand just behind the joint (columns 75..92), where the GT4 has its middle door. The rear section's windows are re-laid around it (two at columns 92..123).
- The bogies stand under the sections at 3.4 and 11.15 m, the published 10.0 m apart (the drawing's 3.95 and 10.45 m would give 8.4 m).
- The roof's raised ventilator strip (2.0..9.2 m in the drawing) is split into one per section.

## Reconstruction

- Body: the `alongx` section (made symmetric: the source's crown is 0.7 / -0.8 m), the plan tapering to 0.45 m at the ends, the elevation's raked front and the skirts.
- Paint: cream with two red lines, 0.6..0.7 m (row 33) and 1.4..1.6 m (rows 24..25), a grey roof.
- Doors: three double folding doors on the right; windows with a top transom; one diamond pantograph over the front section raised to the 5.5 m display wire.

## Fleet number

None: the drawing names KVAG but carries no number, and the photographed Stuttgart cars wear another livery.

## Measurement record

`native/tram_kvag_gt4/landmarks.json` holds 15 native boxes (z_inc, x_inc), the moved door and the bogies included with their reasons; `baseline.json` the first authored geometry's. See [COMPARISON.md](COMPARISON.md).
