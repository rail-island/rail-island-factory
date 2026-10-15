# Mercedes-Benz Citaro (O 530, first generation) references

Photographs for the first-generation 12 m Citaro solo bus (generator/buses.ts). Not shipped
with any model.

- `photo-citaro-front-three-quarter-right.jpg` - "351 EMT - Flickr - antoniovera1.jpg" by
  Antonio Vera, Wikimedia Commons, CC BY-SA 2.0,
  https://commons.wikimedia.org/wiki/File:351_EMT_-_Flickr_-_antoniovera1.jpg. Cropped.
  First-generation (C1) Citaro No. 351 of EMT Tarragona (red/white), front three-quarter from
  the right (door) side: the original front mask with the Mercedes star on the front panel, deep
  windscreen, destination display; a two-door bus (ENTRADA at the front door, SORTIDA at the
  door between the axles), wheel arches.
- `photo-citaro-side-left.jpg` - "Arriva 529.jpg" by Kevster, Wikimedia Commons, CC BY-SA 3.0,
  https://commons.wikimedia.org/wiki/File:Arriva_529.jpg. Cropped. Arriva Groningen No. 529
  (2006), a shallow front three-quarter of the left side: the low window line, roof line,
  axle positions and the front mask.
- `photo-citaro-rear-three-quarter-left-blue.jpg` - "5. autobuss uz Mezciema ielas.jpg" by
  Titans, Wikimedia Commons, CC BY-SA 4.0,
  https://commons.wikimedia.org/wiki/File:5._autobuss_uz_Me%C5%BEciema_ielas.jpg. Cropped
  (small: the bus is far away in the original). Riga (Rigas satiksme) Citaro No. 72691 in the
  white/dark-blue livery, rear three-quarter from the left: the rear end (window, CITARO badge,
  lamp clusters, the dark blue rear panel) and the left side; also the dark blue livery
  reference.

## Dimensions

| Item | Value |
|---|---|
| Length | 11 950 mm (first generation; later 12 m Citaros are quoted at 12 135 mm) |
| Width | 2 550 mm |
| Height | 2 869 mm |
| Wheelbase | 5 845 mm |
| Front / rear overhang | not given for the first generation (11 950 - 5 845 = 6 105 mm in total); the second-generation infobox on cs.wikipedia gives 2 805 / 3 430 mm with a 5 900 mm wheelbase |
| Doors | 2 or 3 on the right side, 2-2-0 or 2-2-2; door width 1 250 mm |
| Floor | low floor: 320 mm at door 1, 340 mm at doors 2 and 3; kneeling lowers it by 80 mm |
| Engine | at the rear on the left side, lying underfloor behind seats on podiums; from 1999 optionally a standing "tower" engine at the left rear |
| Built | 1997-2006 (O 530 first generation; Euro III update autumn 2002, facelift summer 2006); second generation from 2011 |
| Notes | tyre size not given |

Sources:
- https://pl.wikipedia.org/wiki/Mercedes-Benz_Citaro (first-generation infobox: length, height, wheelbase, doors, floor, engine side)
- https://de.wikipedia.org/wiki/Mercedes-Benz_O_530 (engine at the rear left, tower engine from 1999, 2002 and 2006 updates)
- https://cs.wikipedia.org/wiki/Mercedes-Benz_Citaro (later 12 m data with overhangs)
- https://en.wikipedia.org/wiki/Mercedes-Benz_Citaro (12 135 mm, 2 550 mm, 3 130 mm for the current family)

## Native vlakosimdb files

`native/bus_mb_citaro/`, `native/bus_mb_citarob/` - vlakosimdb `db/motocar` at commit `b170acf` (`#` in a folder name becomes `_`):
`index.xml`, the model XML as `model.xml` and the original BMPs (10 pixels a metre;
`x_inc` the front, `x_dec` the rear, `z_inc` / `z_dec` the right and left sides,
`y_dec` the underside). The XML gives the shell's outlines; the BMPs the doors,
windows and paint; the photographs and dimensions above everything the textures
cannot resolve (docs/models/buses.md).
