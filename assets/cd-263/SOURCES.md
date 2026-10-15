# CD 263 / 371 / 372 references

Sources of `veh-cd-263` (generator/cd163Family.ts, `cd263`; the body is the CD
163's, generator/cd163.ts `cd163Body` with the `"263"` and `"371"` layouts). See
docs/models/loco-liveries.md. Not shipped with any model.

## Native BMPs

Unchanged original low-resolution BMPs (`x_both.bmp` 30 x 60, `z_dec.bmp` and
`z_inc.bmp` 170 x 60, 0.1 m a pixel; the XML colorize maps them onto 3 x 6 m and
17 x 6 m) from `janproch/vlakosimdb` commit
`b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`, `db/train/loco/electric/<model>/model/`:

| folder | vlakosimdb title, author | `livery` | running number |
|---|---|---|---|
| `native/cd_263/` | CD 263, Vojtech Vohlidka | `cd263` (default) | 263 002 - illustrative |
| `native/cd_263.015/` | CD 263.015, Borek Hudak | `cd263No015` | 263 015 - the model's name |
| `native/cd_371_002/` | CD 371 002, Vojtech Vohlidka | `cd371No002` | 371 002 - the model's name |
| `native/cd_371.005/` | CD 371.005, Borek Hudak | `cd371No005` | 371 005 - the model's name |
| `native/cd_372/` | CD 372, Borek Hudak | `cd372` | 372 011 - illustrative |

Measured from `cd_263` (pixel-edge boxes, x = column / 10 - 8.5 m, y = 6.0 - row / 10 m):

- `z_dec` (+z): grille banks columns 29-60 and 109-140, rows 27-41 in three rows
  of four pixels (x = -5.6..-2.5 and 2.4..5.5 m; 2.9-3.3, 2.4-2.8, 1.9-2.3 m);
  the emblem at columns 64-69 (x = -2.1..-1.6 m).
- `z_inc` (-z): square windows columns 40-50 and 119-129, rows 28-35
  (2.5-3.2 m); divided windows columns 67-77 and 92-102, rows 29-31 and 32-35.
- `cd_371.005` `z_inc`: four windows columns 34-42, 63-71, 98-106, 127-135, rows 29-35.

## Photographs

None are stored: Wikimedia Commons was not reachable from the session that built
the model (the network policy refused the connection). The ones to add when it
is, as the railroad-vehicle skill asks (side, front three-quarter, bogie):
Wikimedia Commons category "CD Class 263" (a side view of a red/yellow 263 and a
front three-quarter), category "CD Class 371" and "CD Class 372" (the red/cream
371 and the 372). Record title, author, licence and URL here when they are added.
