# CD 163 references

Inspiration for `veh-cd-163` (generator/cd163.ts). Not shipped with any model.

- `cd-163.glb`, `cd-163-side.png` - the vlakosimdb model `db/train/loco/electric/cd_163`
  (by Vojtech Vohladka), as the webapp imports it (`train-loco-electric-cd-163`).
- `native/x_both.bmp`, `native/z_dec.bmp`, `native/z_inc.bmp` - unchanged original
  low-resolution BMPs from `janproch/vlakosimdb` commit
  `b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`, under
  `db/train/loco/electric/cd_163/model/`. The XML's `colorize` mapping gives
  10 pixels per metre in both axes. `native/landmarks.json` contains the
  manually reviewed pixel-edge annotations used for regression checks.
- `elevation-front.png`, `elevation-side.png` - legacy copies of the 4x textures.
  They are not used to calibrate the current geometry: the upscaled details
  differ from the native BMPs.
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

Use the original BMPs above, not the legacy 4x images. `x_both.bmp` is shared
by both ends; there are no separate `x_dec`, `x_inc` or `z_both` files for this
model. `z_dec.bmp` has portholes, `z_inc.bmp` has intake shutters.

The original `index.xml`, `alongz/clip/polygon[@apply="base"]`, also establishes
the double rake: (x, y) = (0.6, 1.2), (0.5, 2.3), (0.7, 3.7) at one end.
The factory keeps the 0.10 m lower and 0.20 m upper horizontal setbacks, with
the current colour boundary at 2.30 m and structural eave at 3.70 m. Fittings follow the
sloped faces; the buffer heads remain upright.

See `../../docs/models/vehicles.md` for the native-pixel coordinate convention,
calibrated dimensions and treatment of ambiguous outlines. Round marker lenses,
standard buffer spacing and the emblem's continuous outline are retained rather
than reproducing low-resolution raster artifacts.
