# DB V 100 / 212 source references

**Covers** - provenance of the three native models of the DB class 212, the dimensions, the coordinate conversion and the reconstruction choices.
**Code** - `generator/db212.ts`, `generator/smallDieselKit.ts`, `generator/smallDieselComparison.ts`, `native/landmarks.json`
**See also** - [photographs](PHOTOS.md), [comparison](COMPARISON.md), [the model's reference](../../docs/models/small-diesels.md)

## Original evidence

All native files come from `janproch/vlakosimdb` revision
`b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`, `db/train/loco/diesel/`, models
by Karola Meyer, unchanged: `db_212/` (old red, the default), `db_212bb/`
(ocean blue and beige) and `db_212nr/` (traffic red), each with
`vehicle.xml`, `x_both.bmp` (30 x 50), `y_dec.bmp`, `z_both.bmp` (140 x 50)
and `image.bmp`. The three `index.xml` are byte-identical; one copy is kept
in `native/db_212/`. The design is one body with a `livery` parameter.

## Dimensions

From de.wikipedia (DB-Baureihe V 100): 12.30 m over the buffers (212 022
on; 12.10 m before), 4.275 m high, 6.00 m between the pivots, 2.20 m bogie
wheelbase, 0.95 m wheels.

## Coordinates and profiles

`colorize` maps `z_both` to 14 x 5 m and `x_both` to 3 x 5 m: 0.1 m a pixel.
Side column px -> x = px / 10 - 6.05 (the source's x, centred on the hoods),
row r -> y = 5 - r / 10; end column u -> z = 1.5 - u / 10 seen from ahead.

- **Frame** (fahr): 3.0 m wide, the model's 1.0..1.5 m over 0.3..11.7 m.
- **Hoods** (base): 2.0 m wide, 1.5..3.2 m at the ends and 3.3 m over most of
  their length, over 0.6..11.5 m; the model rolls their tops and leans their
  ends back at the top.
- **Cab**: the texture's columns 54-82 (the XML haus clip, 5.6..8.0 m, is
  narrower than its texture and the photographs); 3.0 m wide to 3.2 m, the
  window band leaning 0.2 m in to 3.8 m, the roof flaring to 5.1..8.4 m and
  topping out at 4.3 m.
- **Paint** (row 20 and row 35): the line along the hoods at 2.9..3.0 m and
  the line on the frame's top edge.

## Running numbers

DB computer numbers use the same check digit scheme as the CSD 1988 numbers.
Illustrative units photographed in each paint (PHOTOS.md): 212 325-5 (old
red), 212 364-4 (ocean blue), 212 376-8 (traffic red).

## Deviations

- The XML's lower step at the hood ends (1.5..2.1 m out to 0.4 / 11.7 m) is
  left out; the photographs show a flat hood end with the grille, the lamps
  and, below the frame line, the number plate on the frame.
- The ocean blue scheme's beige hood-end edges are not drawn.
