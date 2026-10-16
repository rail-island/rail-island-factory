# CD 460 source references

**Covers** - provenance, coordinate conversion, the cars and liveries, dimensions and reconstruction choices.
**Code** - `generator/emu460.ts`, `generator/emuClassicKit.ts`, `generator/czElectricKit.ts` (`diamond`, `buffers`), `generator/csdCoachParts.ts`, `generator/emuComparison.ts`, `native/cd_460/landmarks.json`.
**See also** - [comparison (460 motor car)](COMPARISON.md), [photos](PHOTOS.md), [older Czech electric units](../../docs/models/czech-emus-classic.md).

## Original evidence

All native files come from `janproch/vlakosimdb` revision `b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`, directories `db/train/emu/cd 460/` and `db/train/emu/csd 460/`, one folder each under `native/` (the commas and dots of the vlakosimdb folder names become underscores):

| folder | vlakosimdb | author (index.xml) | model `unit`, `livery` |
|---|---|---|---|
| `native/cd_460/` | cd 460/cd_460 (CD 460, 1000 kW, 120 km/h) | Borek Hudak | motorCar, cd (the default) |
| `native/cd_460_003/` | cd 460/cd_460,003-4 | Borek Hudak | motorCar, cd003 |
| `native/cd_460_007/` | cd 460/cd_460,007-4 | Borek Hudak | motorCar, cd007 |
| `native/cd_060/` | cd 460/cd_060 (CD 060) | Borek Hudak | trailer, cd / cd003 / cd007 |
| `native/csd_460_045/` | csd 460/csd_460,045 (CSD 460,045, 110 km/h) | Borek Hudak | motorCar, csd |
| `native/csd_460_052/` | csd 460/csd_460,052 | Borek Hudak | motorCar, csd (the same paint, see below) |
| `native/csd_060_045/` | csd 460/csd_060.045 | Borek Hudak | trailer, csd |

Each holds `vehicle.xml` (the unchanged Windows-1250 metadata), `index.xml` (the unchanged simplemodel) and the original BMPs (0.1 m a pixel). No 4x texture exists or was used.

## What the files paint, and which combination comes from where

- The motor cars' colorizes paint both sides with `z_inc.bmp`; their `z_dec.bmp` (a red and cream car) is listed with no direction and paints nothing. The cd_060 trailer paints its -z side with `z_inc` (grey and blue) and its +z side with `z_dec`, the same unused red and cream picture: an inconsistency of the source, not a livery. The model paints both sides of the cd trailer grey and blue, from `z_inc`.
- cd_460, cd_460,003-4 and cd_460,007-4 share the front, the rear and the roof; their sides differ in 84 pixels (the door tops). What sets them apart is the running number and the pantographs: cd_460 raises both (sy 1), 003-4 raises the inner one and folds the cab one (sy 0.3), 007-4 the reverse. The model keeps one raised and one folded (the railroad-vehicle rule): `cd` and `cd003` raise the inner (rear, -X) pantograph, `cd007` the cab one.
- csd_460,045 and csd_460,052 are pixel-identical; 052 raises the cab pantograph where 045 raises the inner one. One `csd` value covers both, with the inner pantograph raised and the running number 460 045.
- vlakosimdb has no trailer for 003 or 007: those liveries' trailer is the cd_060 paint with the set's number. The csd trailer is csd_060.045.
- The csd motor car's side BMP is a separate tracing whose windows and doors sit within a pixel or two of the cd one; the model lays the cd layout (one body) and paints it cream over green with the doors in the body colours, as the csd BMPs show. Its trailer likewise keeps the cd_060 layout.
- The real CSD livery of the class was red and cream with a yellow stripe (`photo-460-002-csd-ostrava-svinov-1991.jpg`); the green and cream is vlakosimdb's, kept as the source paints it.

## Coordinates and reconstruction

- Both cars have the cab (or the first end) at low source x. Body metres `b = 24.3 - x` (no length scale: five cars of 24.5 m over buffers and gangways make the published 122.5 m set exactly). Heights and widths are the XML's (3.0 m wide, the roof at 4.0 m).
- Section (`alongx`): vertical walls 0.9 .. 3.2 m, the roof curving in to 4.0 m. The motor car's body runs from source x 1.8 to 24.3 m, narrowing to 1.4 m half-width at the inner end where its top rounds down to 3.8 m.
- The cab (`alongx`/`alongz` `cab` and `base`): below 1.8 m the lower front stands vertical at x 0.4 m, its plan chamfered from 1.15 m half-width to the full 1.5 m at x 1.8; above it the windscreen face leans forward, from x 0.6 at 1.8 m to x 0.3 at 3.6 m, and curves back into the roof by x 1.4. Both are volumes of their own in the front's bands (`x_dec`): grey and blue 1.7 .. 2.3 m in the cd liveries, green below 1.9 m in the csd.
- The front (`x_dec`): two windscreen panes on the leaning face, held 0.88 m from the centre line (the BMP wraps them onto the chamfer), the blue grille box (XML `b`, 1.8 .. 2.2 m) and the lower grille, a red and a white lamp each side at 1.6 m, the top lamp (XML `l`), the plough (XML `sp`), the side buffers at the standard 1.75 m (the BMP's sit a pixel wider) and the screw coupling.
- Roof: the resistor box (XML `e`, 8.7 .. 12.8 m, to 4.5 m; the BMP draws it longer, to 16.6 m) and the walkway (`st`); two diamond pantographs at the XML's inlines (3.7 and 21.1 m), one raised to 5.8 m.
- The trailer: the centre door's well drops the floor to 0.3 m (XML 11.4 .. 13.1 m), steps under the end doors and two equipment boxes; bogies at 3.6 and 20.85 m. Motor bogies at 3.6 and 21.1 m with traction motors; 2.5 m wheelbase.

## Running numbers

`number460()`: the default livery carries 460 071-4 (legible on `photo-460-071-three-quarter-ostrava-2009.jpg`), cd003 460 003-7 and cd007 460 007-8 (vlakosimdb writes "003-4" and "007-4"; those check digits are wrong, the CSD scheme gives 7 and 8), csd 460 045-8. The trailers carry the real class of the intermediate cars, 063, with the set's serial (illustrative: 063 071-5, 063 003-8, 063 007-9, 063 045-9). All check digits are valid (`tractionCheckDigit`).

## Measurement record

`native/cd_460/landmarks.json` holds 23 native pixel-edge boxes (13 side, 8 cab front, 2 inner end) with their model scopes, tolerances and uncertainty; `baseline.json` is the geometry's measurement when the annotations were fixed. [COMPARISON.md](COMPARISON.md) lists the normalized errors and the signed residual of every box at the model revision.
