# CD 163 references

Inspiration for `veh-cd-163` (generator/cd163.ts). Not shipped with any model.

- `cd-163.glb`, `cd-163-side.png` - the vlakosimdb model `db/train/loco/electric/cd_163`
  (by Vojtech Vohladka), as the webapp imports it (`train-loco-electric-cd-163`).
- `elevation-front.png`, `elevation-side.png` - that model's textures `x_both_4x.png` and
  `z_inc_4x.png`: orthographic front and side elevations at 40 px/m, used for positions
  along the body and across the ends (their vertical scale is squashed; heights come from
  the side photograph).
- `cd-emblem.svg` - "Ceske_drahy-logo.svg", Wikimedia Commons: the modern official CD logo.
  generator/cdLogo.ts holds its outlines (the wordmark is not used). The model
  de-skews and narrows them to approximate the upright period badge visible
  in the two photographs; this is not an exact historic logo tracing.
- `photo-163-244-front.jpg` - "Praha hlavni nadrazi, lokomotiva 163.jpg" by PatrikPaprika,
  Wikimedia Commons, CC BY-SA 4.0. The green livery with the yellow band, the front.
- `photo-163-048-three-quarter.jpg` - "CzechLocomotive163a.jpg" by Radouch, Wikimedia Commons,
  CC BY 2.5. Ribbed sides, portholes, cant louvres, single-arm pantographs, track clearers.
- `photo-bogie-dimensions.jpg` - "163 wozek.jpg" by Flyz1, Wikimedia Commons, CC BY-SA 4.0.
  The bogie, and the dimensions painted on the frame: 16.80 m over the buffers,
  8.30 m between the bogie pivots, 3.20 m bogie wheelbase.
- Also used, not stored: "Locomotive type 163 (8511484998).jpg" and
  "Locomotive type 163 (8511473442).jpg" (163 016 at Ostrava), Wikimedia Commons - the side view.

## Proportion corrections

The photographs above are the primary references for the revised cab, glazing,
light housings, number plates, buffer heads and handrails. The 4x side drawings
in vlakosimdb (`z_dec_4x.png`, portholes; `z_inc_4x.png`, intake shutters) also
show the different machine-room sides. They are layout references, not
photographs or engineering drawings; the absolute mechanical dimensions remain
those documented on the photographed locomotive and bogie.

## Double-raked cab profile

`cd_163/model/` uses `z_dec.bmp` and `z_inc.bmp` for the two sides, but a shared
`x_both.bmp` for both ends (there are no separate `x_dec`/`x_inc` files in this
model). Their `*_4x.png` counterparts were compared with the factory renders.

The original `index.xml`, `alongz/clip/polygon[@apply="base"]`, makes the
lower rake explicit. At one end its profile runs through (x, y) =
(0.6, 1.2), (0.5, 2.3), (0.7, 3.7); the opposite end mirrors it. Thus the nose
projects 0.10 m beyond the lower apron and 0.20 m beyond the upper cab. The
factory uses these setbacks at its existing 2.38 m band top and 3.76 m eave,
with a 1.20 m apron; these are not claims of an exact engineering drawing.
The lower lamps and markings must follow the lower face rather than floating
in front of it, while the buffer heads stay vertical.
