# CD 749 / 750 / 753 / 754 source references

**Covers** - provenance of the T 478 family's native files and photographs, dimensions, coordinate conversion and reconstruction choices.
**Code** - `generator/cd750.ts`, `generator/cd749.ts`, `generator/dieselParts.ts`, `generator/dieselComparison.ts`, `native/landmarks.json`.
**See also** - [comparison](COMPARISON.md), [photographs](PHOTOS.md), [the models' reference](../../docs/models/diesel-locos.md).

## Original evidence

All native files come from `janproch/vlakosimdb` revision
`b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`, `db/train/loco/diesel/`:

| design `livery` | vlakosimdb model | author (index.xml) | files here |
|---|---|---|---|
| `cd750` (default) | `cd_750` | Jan Prochazka | `native/` (`vehicle.xml`, `index.xml`, `x_both.bmp`, `z_both.bmp`, `y_dec.bmp`) |
| `cd750No308` | `cd_750_308` | Vojtech Vohlidka | `native/liveries/cd_750_308/` (BMPs, `vehicle.xml`) |
| `cd753` | `cd_753` | Vojtech Vohlidka | `native/liveries/cd_753/` (BMPs, `vehicle.xml`, its own `index.xml`) |
| `cd754` | `cd_754` | Vojtech Vohlidka | `native/liveries/cd_754/` |
| `cd754No013` | `cd_754_013` | Vojtech Vohlidka | `native/liveries/cd_754_013/` |
| `veh-cd-749` `cd749` (default) | `cd_749` | Vojtech Vohlidka | `native/liveries/cd_749/` (BMPs, `vehicle.xml`, its own `index.xml`: the Bardotka body) |
| `veh-cd-749` `cd749No264`, `cd749No121` | - | - | no native model: the bands are read from the photographs (`photo-749-264-*.jpg`, `photo-749-121-*.jpg`) on the `cd_749` body |

The original Windows-1250 spellings are kept in the XML files. The `cd_750`,
`cd_750_308`, `cd_754` and `cd_754_013` models share one geometry (the `m753`
simplemodel on a 16 x 5 m canvas); `cd_753` draws the same body on a 16.5 m
canvas with separate wheel and tank clips; `cd_749` is the T 478.1 body.
`cd_751` (T 478.1 with steam heating) is in the webapp's `db/archived.json` and
was deliberately left out. No `_4x` or other enhanced texture was used for
measurement or shipped; the model uses solid-colour materials only.

## Identification

- T 478.3 / CD 753 "Brejlovec" and its rebuild with electric train heating, CD
  750, and the T 478.4 / CD 754 share the body (de.wikipedia, CSD-Baureihe
  T 478.3 and T 478.4): the vlakosimdb models confirm it, drawing all of them on
  one simplemodel.
- T 478.1 / CD 751 "Bardotka" or "Zamracena", rebuilt as the CD 749 from 1992,
  has its own cab: the nose leaning out under the windscreen and the brow over
  it (the `cd_749` XML's `front`, `cab` and `light` clips; photographs). It is
  therefore its own design, `veh-cd-749` (`generator/cd749.ts`), drawn by the
  same `buildT478` as `veh-cd-750`.

## Dimensions

- T 478.3 / 478.4: 16.54 m over the buffers, 3.074 m wide, 4.335 m high, 9.0 m
  between the pivots, 2.4 m bogie wheelbase, 1.0 m wheels (de.wikipedia,
  CSD-Baureihe T 478.3 and T 478.4, infoboxes).
- T 478.1: 16.50 m over the buffers (de.wikipedia, CSD-Baureihe T 478.1). The
  pivots, wheelbase and wheels are not given there; the model uses the
  T 478.3's, which the XML bogie clips of both bodies also show (2.4 m
  wheelbase, 9.2 m between the drawn pivots).

## Coordinates and profiles

Factory X = source x - centre, centre 7.65 (Brejlovec, body 0 .. 15.3) or 8.25
(Bardotka, body 0.6 .. 15.9 on a 16.5 m canvas). The colorize maps `x_both`
(30 x 50) to 3 x 5 m and `z_both` (160 or 165 x 50) to 16 or 16.5 x 5 m: 0.1 m
a pixel; a row r spans 5 - (r + 1) / 10 to 5 - r / 10 m. `x_both` serves both
ends, `z_both` both sides.

- Brejlovec (`alongz`, `alongx`, `alongy`): the frame 1.1 .. 1.6 m with 0.4 by
  0.2 m chamfered corners; the lower body leaning out from 0.2 m behind the end
  at 1.6 m to 0.1 m at 2.6 m; the cab face at the end from 2.6 to 3.6 m with a
  0.1 m V in plan; the roof rolling back to 0.3 m at 3.8 m, 1.1 m at 4.1 m and
  2.1 m at 4.2 m, its section 3.0 m wide to 3.6 m, 2.8 at 3.8, 2.0 at 4.0 and
  0.4 at 4.2 m. The headlight housing (`light`) is the clip's 1.0 m wide ridge
  standing out where the roof slopes down; the raised hatch (`roof`) spans
  source x 5.0 .. 10.6, the fuel tank (`base`) 5.4 .. 9.9 at 0.2 .. 1.1 m.
- Bardotka: the nose from 0.7 m behind the end at 1.6 m out to 0.2 m at 2.7 m,
  V-shaped in plan (0.2, 0.3 and 0.8 at |z| = 0, 1.1 and 1.5); the sill back to
  0.6 at 2.9 m; the windscreen raked to 0.8 at 3.7 m; the brow out again to 0.6
  at 3.72 .. 3.9 m and the roof rolling to 2.6 at 4.3 m; the headlight housing
  on the brow (+-0.4 m, 3.7 .. 4.2 m); the exhaust at source x 5.4 .. 5.6 to
  4.6 m; the raised radiator roof 6.9 .. 11.1 m.

Livery bands were read row by row from each model's `x_both` and `z_both`.
The 750 liveries' yellow "sweep" (low at the cabs, high along the machine room,
diagonals between) follows `z_both` columns 0 .. 36 and 116 .. 159.

## Running numbers

| livery | number | source |
|---|---|---|
| `cd750` | 750 330-3 | illustrative, a unit of the class; the native plate does not resolve digits |
| `cd750No308` | 750 308-9 | the vlakosimdb model's name |
| `cd753` | 753 286-4 | photographed in this livery (`photo-753-286-front.jpg`) |
| `cd754` | 754 046-1 | photographed in this livery (`photo-754-046-three-quarter.jpg`) |
| `cd754No013` | 754 013-1 | the vlakosimdb model's name |
| `cd749` (`veh-cd-749`) | 749 107-9 | in the grey and red (CT24, 2018, "Pul stoleti na kolejich ... Bardotka cislo 121"); the native plate does not resolve digits |
| `cd749No264` (`veh-cd-749`) | 749 264-8 | photographed in this livery (`photo-749-264-side.jpg`, `photo-749-264-three-quarter.jpg`) |
| `cd749No121` (`veh-cd-749`) | 749 121-0 | photographed in this livery (`photo-749-121-front.jpg`, `photo-749-121-three-quarter.jpg`) |

The two photographed Bardotka liveries (CT24, 2018: 749 121 "combines red, blue
and cream", 749 264 is "cream and green with black details", 749 107 the
"typical grey and red"):

- `cd749No264`: the cream nose up to the windscreen, green round the windscreen
  and on the cab sides above 2.6 m (cream below), on the machine room a green
  skirt (1.6 .. 1.85 m), the cream band (to 2.6 m) and green to the cant; the
  maroon roof, brow and headlight housing; the black frame, the red plough.
- `cd749No121`: on the nose a red, cream (1.72 .. 2.5 m) and red band under the
  navy windscreen, brow and roof; the sides red from the frame to 2.65 m under
  the windows, navy above; the navy frame, the red plough.

## Deviations

- The standard 1.75 m buffer spacing and 1.03 m height (the BMPs draw the buffer
  frames 2.1 m apart).
- The XML draws the pivots 9.2 m apart; the model uses the published 9.0 m.
- The right cab's side windows are drawn 2 px off the left cab's mirror image;
  the model mirrors the left cab.
- Not modelled: the side's printed details (UIC data panels, small hatches)
  and the 749's rib pattern below the windows (one flat band).
- 749 264's plough is red with a yellow foot, and 749 121's frame carries red
  lining; both are drawn in one colour.
