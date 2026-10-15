# Renault / Karosa / Irisbus Citybus 18M references

Photographs for the articulated 18 m Citybus (generator/buses.ts). Not shipped with any model.

- `photo-citybus18m-side-left.jpg` - "Bus line 197 Irisbus Agora L - Citybus 18M.JPG" by Kevin.B,
  Wikimedia Commons, CC BY-SA 3.0,
  https://commons.wikimedia.org/wiki/File:Bus_line_197_Irisbus_Agora_L_-_Citybus_18M.JPG.
  Cropped to the bus. DPP (Prague) No. 6515 in the white/red livery, a shallow front
  three-quarter of the left side: section lengths, all three axles, the black bellows of the
  joint, the window line and the red skirt band; the left side has no doors.
- `photo-citybus18m-front-three-quarter-right.jpg` - "DOD garaze Vrsovice 2015, autobus Irisbus
  Citybus 18M.jpg" by SJu, Wikimedia Commons, CC BY 4.0,
  https://commons.wikimedia.org/wiki/File:DOD_gar%C3%A1%C5%BEe_Vr%C5%A1ovice_2015,_autobus_Irisbus_Citybus_18M.jpg.
  Cropped. DPP No. 6514, front three-quarter from the right (door) side: the front mask and
  windscreen in close-up, the front door and the door line receding along the right side.
- `photo-citybus18m-front-three-quarter-left.jpg` - "Bus line 253 Irisbus Agora L - Citybus
  18M.JPG" by Kevin.B, Wikimedia Commons, CC BY-SA 3.0,
  https://commons.wikimedia.org/wiki/File:Bus_line_253_Irisbus_Agora_L_-_Citybus_18M.JPG.
  Cropped. DPP No. 6519, front three-quarter from the left: front mask, destination display,
  headlamps and bumper, and both sections with the joint.

## Dimensions

| Item | Value |
|---|---|
| Length | 17 800 mm |
| Width | 2 500 mm |
| Height | 3 185 mm |
| Wheelbases | 5 355 mm (front axle to middle axle) + 6 575 mm (middle axle to rear axle) |
| Front / rear overhang | 2 710 / 3 160 mm (2 710 + 5 355 + 6 575 + 3 160 = 17 800, adds up) |
| Doors | 4 double-leaf folding doors on the right side, two per section (2-2-2-2) |
| Floor | low floor: 320 mm in the front section and at door 3, rising to 550 mm at the back of the rear section; kneeling |
| Engine | in the rear section, driving the rear axle (a pusher): Iveco Cursor F2B (213 kW) or Renault MIDR 060245 (186-217 kW) |
| Built | 1996-2005 (France from 1996; Czech-built from 2001, series 2002-2005) |
| Notes | 40 seats / 116 standing, kerb weight 17 300 kg; tyre size not given |

Sources:
- https://cs.wikipedia.org/wiki/Irisbus_Citybus_18M

## Native vlakosimdb files

`native/bus_karrencity18m/` - vlakosimdb `db/motocar` at commit `b170acf` (`#` in a folder name becomes `_`):
`index.xml`, the model XML as `model.xml` and the original BMPs (10 pixels a metre;
`x_inc` the front, `x_dec` the rear, `z_inc` / `z_dec` the right and left sides,
`y_dec` the underside). The XML gives the shell's outlines; the BMPs the doors,
windows and paint; the photographs and dimensions above everything the textures
cannot resolve (docs/models/buses.md).
