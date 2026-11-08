# Cupola caboose source references

**Covers** - provenance of the Cupola caboose model (`proc-vehicle-us-caboose`): photographs, measurements and published dimensions.
**Code** - `generator/usFreight.ts`
**See also** - [the reference](../../docs/models/us-freight.md)

## Photographs

Fetched from Wikimedia Commons with `pnpm refs:fetch` (at most 1280 px on the long side). The
livery chooses the car as photographed: `santaFe` is Santa Fe Ce-3 999457, `unionPacific` is UP 25687.

| file | original | URL | author | licence | use |
|---|---|---|---|---|---|
| `photo-santa-fe-caboose-999457.jpg` | Santa Fe Caboose 999457.png | https://commons.wikimedia.org/wiki/File:Santa_Fe_Caboose_999457.png | CTUS1867 | CC0 | Santa Fe: near-orthographic side of a Ce-class steel cupola caboose (999457): body, offset cupola, windows, stripe, lettering, trucks |
| `photo-marshall-station-union-pacific-caboose-25687.jpg` | Marshall Station Union Pacific caboose 25687.jpg | https://commons.wikimedia.org/wiki/File:Marshall_Station_Union_Pacific_caboose_25687.jpg | Adam Moss | CC BY-SA 2.0 | Union Pacific: near side-on view of a steel cupola caboose (25687): centred cupola, window layout, lettering, red roof and railings; length and heights measured |
| `photo-atsf-caboose-999520-kingman.jpg` | ATSF Caboose 999520 Kingman.jpg | https://commons.wikimedia.org/wiki/File:ATSF_Caboose_999520_Kingman.jpg | Didier Duforest | CC BY-SA 4.0 | Santa Fe: three-quarter view of the cupola end of a sister Ce-class caboose (999520): end door and window, number over the door, ladder, brake wheel, steps, curved white grab irons, roof overhang, cupola end |
| `photo-union-pacific-caboose-no-25599-at-the-western-america-railro.jpg` | Union Pacific Caboose No. 25599 At The Western America Railroad Museum - May 2022.jpg | https://commons.wikimedia.org/wiki/File:Union_Pacific_Caboose_No._25599_At_The_Western_America_Railroad_Museum_-_May_2022.jpg | Forsaken Fotos | CC BY 2.0 | Union Pacific: three-quarter view of a sister steel cupola caboose (25599): end platform, door, ladder, red railings and steps, the cupola's two-lamp signal and windows, roof overhang |

## Measurements

- **999457** (side-on, 1280 px file): scale 104 px/m from the 33 in wheels (88 px) and the truck
  wheelbase (176 px = 1.69 m, a 5 ft 6 in caboose truck). Rail top at y 714, car centre at x 664.5.
  Body sides 8.68 m (x 213-1116), the roof and platforms over 10.14 m (x 135-1190), truck centres
  5.68 m apart; side sheet's bottom 0.90 m, yellow stripe 1.80-1.85 m, eave 3.07 m, roof walk 3.29 m,
  cupola 1.74 m long from 0.86 m inside the -x end wall, its top 4.35 m, its window 0.92 m wide at
  3.53-4.01 m; side windows 0.48 by 0.66 m (sill 1.97 m) centred 1.45 m toward the cupola and 1.57 m
  the other way; "ATSF" 0.22 m high, 1.18 m long at 1.51 m, the number 0.23 m high, 1.35 m long at
  1.15 m; the stove pipe 0.34 m toward the cupola, its top 4.38 m; the tool box from -0.67 to +0.31 m.
- **25687** (side-on, slightly from the front): its roof's length taken as the Santa Fe car's 10.14 m
  gives 49.8 px/m, and with it an eave of 3.09 m and a 0.90 m side-sheet bottom, as on the Santa Fe
  car. Body sides 8.12 m, the cupola centred, 2.48 m long, top 4.24 m, its side window 1.08 m wide at
  3.31-3.96 m; windows centred at -2.46 m (0.48 by 0.64), -0.98 m (0.38 by 0.42) and +2.86 m (0.40 by
  0.60); "UNION PACIFIC" 0.56 m high, 3.92 m long at 2.39 m; "UP 25687" 0.42 m high at 1.14 m; the
  stove pipe 1.9 m beyond the cupola's centre.
- Not photographed and assumed: the Santa Fe car's other side (drawn mirrored across the car), the UP
  car's other side (the same layout turned end for end), the cupola ends of 999457 (as on 999520: the
  number and a vent on the outer end), the UP car's ends (as on 25599). The Santa Fe cross herald
  and the UP shield are left out, as on the other US models.

## Published figures

- **Length** - about 36 ft 5 in (11.1 m) over the couplers: the end sills at the roof's measured 10.14 m
  and the knuckle couplers 0.49 m beyond them.
