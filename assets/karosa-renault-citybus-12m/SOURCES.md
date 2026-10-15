# Renault / Karosa / Irisbus Citybus 12M references

Photographs for the 12 m Citybus solo bus (generator/buses.ts). Not shipped with any model.

- `photo-citybus12m-side-right.jpg` - "DOD garaze Vrsovice 2015, autobus Irisbus Citybus 12M, 3261
  vyrazeny, pravy bok.jpg" by SJu, Wikimedia Commons, CC BY 4.0,
  https://commons.wikimedia.org/wiki/File:DOD_gar%C3%A1%C5%BEe_Vr%C5%A1ovice_2015,_autobus_Irisbus_Citybus_12M,_3261_vy%C5%99azen%C3%BD,_prav%C3%BD_bok.jpg.
  Cropped to the bus. Withdrawn DPP No. 3261 (white with the red skirt) square from the right
  (door) side with all three double doors open: door positions (2-2-2), axle positions,
  window line and the rear engine bay. Some side panels are taped / missing.
- `photo-citybus12m-front-three-quarter-left.jpg` - "20180717-DPP-3223 (cropped).jpg" by Alex
  Noble, Wikimedia Commons, CC0,
  https://commons.wikimedia.org/wiki/File:20180717-DPP-3223_(cropped).jpg. DPP (Prague)
  No. 3223, a 1999 Karosa-built Citybus 12M in the white/red livery, front three-quarter from
  the left: the rounded Agora front mask, deep windscreen, destination display, the low window
  line and the red skirt band.
- `photo-citybus12m-rear-three-quarter-right.jpg` - "Autobus 3212 zezadu, Ceskomoravska.jpg" by
  SJu (cs:SJu), Wikimedia Commons, CC BY-SA 3.0,
  https://commons.wikimedia.org/wiki/File:Autobus_3212_zezadu,_%C4%8Ceskomoravsk%C3%A1.jpg.
  DPP No. 3212 (all-over Zoo Praha advert) rear three-quarter from the right: the rear end with
  the window, lamp clusters, engine grilles, the RENAULT badge and the roof-level intake.

## Dimensions

| Item | Value |
|---|---|
| Length | 11 990 mm |
| Width | 2 500 mm |
| Height | 2 924 mm |
| Wheelbase | 6 120 mm |
| Front / rear overhang | 2 710 / 3 160 mm (2 710 + 6 120 + 3 160 = 11 990, adds up) |
| Doors | 3 double-leaf folding doors on the right side (2-2-2) |
| Floor | low floor, 320 mm at doors 1 and 2; door 3 originally had a step to a 550 mm floor, removed in the 2001 update (320 mm entry) |
| Engine | at the rear, behind the rear (driven) axle: Renault MIDR 062045 (186 kW), from 2001 Iveco Cursor F2B (180-213 kW) |
| Built | 1995 prototype, 1996-2005; Renault Citybus 12M 1995-2001 (built by Karosa with Renault), then Irisbus Citybus 12M |
| Notes | 30 seats / 69 standing, kerb weight 11 380 kg; tyre size not given |

Sources:
- https://cs.wikipedia.org/wiki/Karosa_Citybus (redirects to Irisbus Citybus 12M)

## Native vlakosimdb files

`native/bus_karrencity12m/` - vlakosimdb `db/motocar` at commit `b170acf` (`#` in a folder name becomes `_`):
`index.xml`, the model XML as `model.xml` and the original BMPs (10 pixels a metre;
`x_inc` the front, `x_dec` the rear, `z_inc` / `z_dec` the right and left sides,
`y_dec` the underside). The XML gives the shell's outlines; the BMPs the doors,
windows and paint; the photographs and dimensions above everything the textures
cannot resolve (docs/models/buses.md).
