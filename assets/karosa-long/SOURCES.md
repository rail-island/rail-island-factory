# Karosa articulated bus references

Photographs for the articulated Karosa city buses (B 741, B 941, B 941 E, B 961)
(generator/buses.ts). Not shipped with any model.

- `photo-b941e-front-three-quarter-left.jpg` - "Ostrava, Karosa B941E.1962 c. 4286.jpg" by
  Oleksandr Dede, Wikimedia Commons, CC BY-SA 4.0,
  https://commons.wikimedia.org/wiki/File:Ostrava,_Karosa_B941E.1962_%C4%8D._4286.jpg.
  Cropped to the bus. DPO (Ostrava) B 941 E No. 4286 in the blue/white livery, front
  three-quarter from the left (driver) side: the 900-series E front mask, the window rhythm of
  both sections, the grey bellows of the joint and the wheel positions.
- `photo-b961e-front-three-quarter-left.jpg` - "Ostrava, Karosa B961E.1970 c. 4295.jpg" by
  Oleksandr Dede, Wikimedia Commons, CC BY-SA 4.0,
  https://commons.wikimedia.org/wiki/File:Ostrava,_Karosa_B961E.1970_%C4%8D._4295.jpg.
  Cropped to the bus. DPO B 961 E No. 4295 (blue/white), close front three-quarter from the
  left: the E front mask with the bonded windscreen, destination display, mirrors, roof
  air-conditioning pod and the joint in the distance.
- `photo-b741-front-three-quarter-left.jpg` - "20200117-DPB-1639.jpg" by Alex Noble, Wikimedia
  Commons, CC0, https://commons.wikimedia.org/wiki/File:20200117-DPB-1639.jpg. Cropped to the
  bus. DPB (Bratislava) B 741 No. 1639 in the red livery, front three-quarter from the left:
  the 700-series front mask on the articulated bus, both sections, the joint and all three
  axles.
- `photo-b941-side-right-joint.jpg` - "Horni Stropnice, Hojna Voda, Karosa B 941 RZ 4C9 9121
  (01).jpg" by Harold, Wikimedia Commons, CC BY-SA 3.0,
  https://commons.wikimedia.org/wiki/File:Horn%C3%AD_Stropnice,_Hojn%C3%A1_Voda,_Karosa_B_941_RZ_4C9_9121_(01).jpg.
  Cropped to the bus. CSAD Jihotrans B 941 (white/blue) turning, seen almost square from the
  right (door) side: all four doors (2-2-2-2), window rhythm, the long grey bellows with the
  turntable skirt, wheel arches, rear lamps and the engine grille behind the third axle.
- `photo-b941-rear-three-quarter-right.jpg` - "Karosa B 941 in Zlin.jpg" by MichalCZE, Wikimedia
  Commons, CC0, https://commons.wikimedia.org/wiki/File:Karosa_B_941_in_Zl%C3%ADn.jpg.
  B 941 No. 2374 (white with the red skirt band) at a stop, rear three-quarter from the right
  with the doors open: the 900-series rear end (window, lamp cluster, engine louvres, bumper)
  and the opened door leaves along the right side.

## Dimensions

From the Czech Wikipedia infoboxes. All are three-axle, two-section high-floor buses, width
2500 mm, height 3165 mm, four double-leaf outward-swinging doors on the right side (2-2-2-2,
two per section, the first and last narrower than the middle two). The engine lies behind the
third axle in the rear section and drives only that axle: a pusher (en.wikipedia uses the word
for the B 741).

| Type | Length (mm) | Wheelbases (mm) | Front / rear overhang (mm) | Built | Notes |
|---|---|---|---|---|---|
| B 741 | 17 355 | 5 600 + 6 270 | 2 290 / 3 085 (as quoted) | 1991-1997, 620 | 700-series body; LIAZ or Renault engine. The quoted overhangs look copied from the B 731: 17 355 - 2 290 - 11 870 leaves 3 195 mm for the rear overhang |
| B 941 | 17 615 | 5 600 + 6 270 | 2 355 / 3 390 | 1995/1997-2001 | 900-series body, adds up exactly |
| B 941 E | 17 615 | 5 600 + 6 270 | 2 355 / 3 390 | 1999-2001 (333 B 941 + E) | floor lowered by 100 mm in the front section, LIAZ rigid front axle with disc brakes, ABS/ASR |
| B 961 / B 961 E | 17 590 | 5 600 + 6 270 | 2 355 / 3 365 | 2000-2006 (67 + 83) | Iveco Cursor engine; E (from 2003): modified front mask, bonded glazing |

The first wheelbase (5 600 mm) is front axle to middle axle, as on the solo buses; the second
(6 270 mm) is middle axle to rear (driven) axle across the joint. Tyre sizes are not given.

Sources:
- https://cs.wikipedia.org/wiki/Karosa_B_741
- https://cs.wikipedia.org/wiki/Karosa_B_941
- https://cs.wikipedia.org/wiki/Karosa_B_961
- https://en.wikipedia.org/wiki/Karosa_B_741 (high floor, pusher configuration, 1991-1997)

## Native vlakosimdb files

`native/bus_kar_b741/`, `native/bus_kar_b941/`, `native/bus_kar_b941e/`, `native/bus_kar_b961/` - vlakosimdb `db/motocar` at commit `b170acf` (`#` in a folder name becomes `_`):
`index.xml`, the model XML as `model.xml` and the original BMPs (10 pixels a metre;
`x_inc` the front, `x_dec` the rear, `z_inc` / `z_dec` the right and left sides,
`y_dec` the underside). The XML gives the shell's outlines; the BMPs the doors,
windows and paint; the photographs and dimensions above everything the textures
cannot resolve (docs/models/buses.md).
