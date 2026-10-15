# CSD Classic Green Coach source references

**Covers** - provenance, coordinate conversion, reconstruction choices, running numbers and the photo check of `veh-csd-classic-green-coach` (vlakosimdb CSD A and CSD B as one parametric model).
**Code** - `generator/csdCoaches.ts` (`csdClassicGreenCoach`, `CLASSIC_GREEN_PARAMS`), `generator/csdCoachParts.ts`, `native/csd_a/landmarks.json`, `native/csd_b/landmarks.json`.
**See also** - [class A comparison](COMPARISON-class-a.md), [class B comparison](COMPARISON-class-b.md), [photos](PHOTOS.md), [CSD coaches](../../docs/models/csd-coaches.md), [parametric models](../../docs/models/parameters.md).

## One model, two variants

The 1st class CSD A and the 2nd class CSD B are the same UIC-Y body (24.5 m,
built for CSD by VEB Waggonbau Bautzen): their vlakosimdb XML profiles are
identical and their side BMPs differ only in the window layout and the class
numeral. The Factory therefore ships one parametric design with the enum
parameter `variant`: `classA` (the default, the exported GLB) or `classB`.

## Original evidence

All native files come from `janproch/vlakosimdb` revision
`b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`, directories `db/train/coach/csd_a/`
and `csd_b/`, kept unchanged under `native/csd_a/` and `native/csd_b/`:

- `vehicle.xml`: metadata (`CSD_A` / `CSD_B`): 40 t, 140 km/h, author Vojtech Vohlidka (the original spelling is kept in the Windows-1250 file).
- `index.xml`: the simplemodel: `alongx`/`alongy`/`alongz` clip polygons, colorizes and baked polygons.
- `x_both.bmp`, `y_dec.bmp`, `z_dec.bmp`, `z_inc.bmp`: the original BMPs (0.1 m a pixel). No 4x texture was used or shipped; the 4x texture of CSD A even paints "2" where the original has the first-class "1".

## Coordinates and reconstruction

Source `(x, y, z)` is Factory `(x - 12.25, y, z)`, metres; `z_dec` paints the right (+Z) side, `z_inc` the left, with one layout (they differ only in glass shading and inscriptions). See [csd-coaches.md](../../docs/models/csd-coaches.md) for the builder and the choices every coach shares.

- Body section from `alongx`: 3.0 m wide from 0.9 to 3.2 m, a curved roof to 4.2 m. Plan `alongy`: 2.8 m at the ends (x 0.2, 24.3) widening to 3.0 m by x 1.6 and 22.9. Elevation `alongz`: the roof drops 0.2 m over the last 0.2 m.
- classA windows: toilet 18..26, nine compartments from column 32 at a 21-pixel pitch, toilet 219..227, rows 19..30; class numeral "1".
- classB windows: toilet 18..26, ten compartments from column 30 at a 19-pixel pitch, toilet 219..227; class numeral "2".
- Drop-light sash bars at 2.5 m (row 24). Bogies from the `alongz` wheel polygons: axles at source x 2.45, 4.95, 19.55, 22.05 m.

## Running numbers

"ČSD" over the number, centred on each side at native rows 30..35, as the green
ABa 2003 photograph shows it:

- classA `51 54 19-41 068-0`: a real 1st class Y coach; the number is from the Commons description of `photo-a-51-54-19-41-068-0-side-praha-2009.jpg` (not legible in the photo). The check digit is valid.
- classB `51 54 20-41 866-4`: read from `photo-b-y-side-praha-2014.jpg`. The serial's first digit is blurred; 866 is the only reading of the blurred digit that the printed check digit 4 confirms.

## Photo check

The photographs ([PHOTOS.md](PHOTOS.md)) confirm the dark green body, the
yellow cant line, the light grey roof, the aluminium window frames with the
drop-light sash, the class numerals beside the toilet windows, the black UIC
gangway frame and the centre "ČSD" inscription. Most photos show the later CD
blue livery; only the preserved AB and ABa 2003 show the green one. The end door
keeps the two narrow windows of the native BMP; the photographed coaches have
one wider window.

## Measurement record

`native/csd_a/landmarks.json` (46 boxes) and `native/csd_b/landmarks.json` (48)
hold the native pixel-edge boxes with their model scopes, tolerances and
uncertainty; each `baseline.json` is the first authored geometry's measurement.
The comparison tables list every box, built with `variant=classA` and
`variant=classB` respectively.
