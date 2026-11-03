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
| `native/db_180/` | DB AG 180, Vojtech Vohlidka | `db180` | 180 008 - illustrative |
| `native/db ag_180/` | DB AG 180, Borek Hudak | `dbAg180` | 180 014 - illustrative |

The DB 180 (DR 230) is the CD 372 under its German number; the two DB models
draw the 372's body (grille banks on `z_dec`, windows on `z_inc`). Their band
rows in column 60: 27-50 red, row 42 white (1.7-1.8 m).

Measured from `cd_263` (pixel-edge boxes, x = column / 10 - 8.5 m, y = 6.0 - row / 10 m):

- `z_dec` (+z): grille banks columns 29-60 and 109-140, rows 27-41 in three rows
  of four pixels (x = -5.6..-2.5 and 2.4..5.5 m; 2.9-3.3, 2.4-2.8, 1.9-2.3 m);
  the emblem at columns 64-69 (x = -2.1..-1.6 m).
- `z_inc` (-z): square windows columns 40-50 and 119-129, rows 28-35
  (2.5-3.2 m); divided windows columns 67-77 and 92-102, rows 29-31 and 32-35.
- `cd_371.005` `z_inc`: four windows columns 34-42, 63-71, 98-106, 127-135, rows 29-35.

## Photographs

The `cd263Blue` and `cd371Blue` liveries (CD's current blue, the Najbrt scheme)
are read from these Wikimedia Commons photos (1600 px, saved as JPEG quality 85);
see docs/models/loco-liveries.md, "The current operators' liveries".

| File | Commons page | Author | Licence | Used for |
|---|---|---|---|---|
| `photo-263-001-cd-blue.jpg` | https://commons.wikimedia.org/wiki/File:CD_263001_Brno.jpg | Matijak | CC BY-SA 4.0 | `cd263Blue` and its number 263 001-0 (the prototype, named "Maja"; Brno hl. n., 1 August 2014): the mid blue ribbed machine room over the silver lower band, the navy panel and door behind each cab, the silver cab sides and noses with the light blue windscreen band, the red plates, the navy emblem on the nose, the white one on the side, the light grey roof; the window side |
| `photo-371-002-cd-blue.jpg` | https://commons.wikimedia.org/wiki/File:20240207_%C4%8Cesk%C3%A9_dr%C3%A1hy_371002.jpg | Alex Noble | CC0 | `cd371Blue` and its number 371 002-7 (Praha hl. n., 7 February 2024): the same zones over a dark grey lower band, the black number and emblem on the nose (no plates), the small white number on the lower band, the white emblem and "Ceske drahy" lettering on the machine room; the grille side |

Not yet stored, as the railroad-vehicle skill asks for the vlakosimdb liveries:
a side view of a red/yellow 263 and of the red/cream 371 and the 372 (Commons
categories "CD Class 263", "CD Class 371", "CD Class 372").
