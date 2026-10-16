# CD 230 / 240 / 340 source references

**Covers** - provenance of the laminatka's native files and photographs, coordinate conversion and reconstruction choices.
**Code** - `generator/cd230.ts`, `generator/cd230Comparison.ts`, `native/landmarks.json`.
**See also** - [comparison](COMPARISON.md), [the model's reference](../../docs/models/cd-230.md).

## Original evidence

All native files come from `janproch/vlakosimdb` revision
`b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`, `db/train/loco/electric/`, models by
Vojtech Vohladka (the original spelling is kept in the Windows-1250 files):

- `native/vehicle.xml`, `native/index.xml`: `cd_230`'s metadata (85 t, 3080 kW,
  110 km/h) and geometry, unchanged: clip profiles (`alongx`, `alongy`,
  `alongz`), baked polygons, texture mappings and the two `pant2` inlines.
- `native/x_both.bmp`, `z_both.bmp`, `y_dec.bmp`, `ploughx_both.bmp`: the 230's
  original textures. `native/pant2/`: the local diamond pantograph component.
- `native/liveries/cd_240`, `cd_240_047`, `cd_340`: the other three models'
  original textures and metadata, and the 240's `index.xml`. The four models
  share every clip profile; the 240 family differs only in its roof clips (a box
  at source x 6.1..7.3 and the breaker at 8.5..9.8 instead of 7.3..8.6).
- `native/liveries/cd_242`: the CD 242 (S 499.02, Skoda 73E, the 240's
  steel-bodied sister; model by Vojtech Vohlidka): textures, metadata and its
  `index.xml`. Its XML is a plain box (one clip per axis) with two `pantdbl`
  inlines, so it gives the paint only; the `cd242` livery keeps the laminatka
  outline and the 240 family's roof box. Its side BMP is 157 x 57 pixels on the
  17 x 6 m canvas (0.108 x 0.105 m a pixel): cream above 2.2 m, red below with a
  light line at 1.4 to 1.5 m; the front (`x_both`, 0.1 m a pixel) adds the
  yellow band from 1.3 to 1.6 m. Number 242 214-5, photographed in this livery
  (`photo-242-214-side.jpg`).

No `_4x` or other enhanced texture was used for measurement or shipped. The
model uses procedural surfaces and solid-colour materials only.

## Photographs

All from Wikimedia Commons, downscaled to 1280 px by Commons' thumbnailer.

| File | Original | Author | Licence | Used for |
|---|---|---|---|---|
| `photo-230-025-front.jpg` | [230 025-9 ČD Cargo.jpg](https://commons.wikimedia.org/wiki/File:230_025-9_%C4%8CD_Cargo.jpg) | JirkaSv, 2008 | public domain | the face head-on: the headlight housing (photo box of F01/B01), vents, lip grilles, lamps, plate; the number 230 025-9 |
| `photo-230-029-side.jpg` | [CZ Class 230 029 - 1 ČD.jpg](https://commons.wikimedia.org/wiki/File:CZ_Class_230_029_-_1_%C4%8CD.jpg) | Pohled 111, 2021 | CC BY-SA 4.0 | the nose in profile: lip, rake, the wrap of the windscreen, door, rails |
| `photo-340-062-three-quarter.jpg` | [340062ceskevelenice2010.jpg](https://commons.wikimedia.org/wiki/File:340062ceskevelenice2010.jpg) | PetrS., 2010 | CC BY-SA 3.0 / GFDL | the 340 livery, the number 340 062-9, roof layout |
| `photo-240-144-front-three-quarter.jpg` | [20200118-Railtrans-240144 No.1 end.jpg](https://commons.wikimedia.org/wiki/File:20200118-Railtrans-240144_No.1_end.jpg) | Alex Noble, 2020 | WTFPL | the face's details: vent rims, oval lip grilles, single headlight, lamp housings and steps |
| `photo-240-005-three-quarter.jpg` | [Locomotive 240 005-9 at Bratislava hlavná stanica.jpg](https://commons.wikimedia.org/wiki/File:Locomotive_240_005-9_at_Bratislava_hlavn%C3%A1_stanica.jpg) | Maksym Kozlenko, 2018 | CC BY-SA 4.0 | hood painted in the body colour, rectangular buffer heads, plough |
| `photo-240-082-three-quarter.jpg` | [Laminátka.JPG](https://commons.wikimedia.org/wiki/File:Lamin%C3%A1tka.JPG) | Balogh Zsolt, 2006 | public domain | the 240 in red and yellow, the diamond pantograph |
| `photo-242-214-side.jpg` | [242 214 Cheb.jpg](https://commons.wikimedia.org/wiki/File:242_214_Cheb.jpg) | Steffen Mokosch, 2001 | GFDL (relicensed CC BY-SA 3.0) | the 242's cream and red livery with the yellow nose band, the number 242 214-5 |
| `photo-242-282-side.jpg` | [15.02.92 Ceske Budejovice 242.282 (11355707036).jpg](https://commons.wikimedia.org/wiki/File:15.02.92_%C4%8Cesk%C3%A9_Bud%C4%9Bjovice_242.282_%2811355707036%29.jpg) | Phil Richards, 1992 | CC BY-SA 2.0 | the 242's steel body in profile, roof equipment (in the earlier orange and yellow) |

Dimensions: 16.44 m over the buffers (cs.wikipedia, Lokomotiva 230 and 240);
15.20 m body, 3.02 m wide, 7.80 m between the pivots, 2.80 m bogie wheelbase
(de.wikipedia, CSD-Baureihe S 489.0). Wheels 1.25 m.

## Coordinates and profiles

Source `(x, y, z)` maps to Factory `(8.2 - x, y, z)`, metres. The flip of x
puts the source's raised `zadni` (rear) pantograph at -X, the repository's rear;
the front one is folded. Colorize maps the 30 x 60 front BMP to 3 x 6 m and the
170 x 60 side BMP to 17 x 6 m: 0.1 m per pixel on both. `x_both` serves both
noses and `z_both` both sides.

- **Plan** (`alongy`): the noses stand at source x = 0.6 and 15.8 (Factory
  +-7.6) and fall back 0.1, 0.2 and 0.4 m at |z| = 1.0, 1.3 and 1.5. The model
  draws that as a superelliptic quarter, `0.4 (1 - sqrt(1 - t^2.2))` at
  t = |z| / half width, which passes through those points and meets the side
  tangentially, as the glass-fibre corners do.
- **Elevation** (`alongz`): the lower face leans out from 7.5 at 1.2 m to 7.6 at
  1.9 m; the lip (`line`, 1.9 to 2.3 m) stands 0.1 m proud; the windscreen face
  rakes back to 7.45 at 3.65 m; the hood rolls into the roof at 7.4 (3.7 m),
  7.0 (3.9 m) and 6.6 (4.0 m). The flat crown is at 4.0 m.
- **Section** (`alongx`): 3.0 m wide to 2.3 m, leaning in to 2.8 m at 3.4 m and
  2.44 m at 3.7 m, the roof curving to a 1.2 m crown.
- **Underframe**: frame 0.9 to 1.2 m, the plough clip (0.2 to 0.9 m, its face
  at source x = 0.7, 2.5 m wide at its foot, 2.85 m under the beam), the tank
  box at source x 6.9..8.3.

## Reconstruction choices

- Face details sit on the curved skin through (s, y) patches, s an arc length
  around the nose; the shell and the patches both join equal fractions of the
  curve from height to height, and the patches split where the profile kinks,
  so nothing of the skin shows through the wrap-round glass.
- The headlight housing follows the photographs (0.44 m across, top at
  4.04 m): the native BMP draws it as a 0.4 m dark square. The 230 carries twin
  lenses (230 025), the 240s and the 340 one large lens.
- The hood above the windscreen is painted in the upper body colour, as every
  photograph shows; the native front BMP paints it roof grey.
- The standard 1.75 m buffer spacing is kept (native frames 2.0 m apart); the
  buffer heads are rectangular with rounded corners, as photographed.
- Running gear follows the published dimensions rather than the painted
  bogies. Pantographs are the native `pant2` diamond with 1.3 m arms: the
  rear raised to 5.87 m, the front folded to 4.55 m.
- The small dark mark under the 240-family pillar on the native front BMP and
  the 230's door transom strip are not modelled.

## Running numbers

- `cd230`: 230 025-9, photographed in this livery.
- `cd240`: 240 048-9, illustrative; the native plate does not resolve digits.
- `cd240No047`: 240 047-1, the vlakosimdb model's name.
- `cd340`: 340 062-9, photographed in this livery.
