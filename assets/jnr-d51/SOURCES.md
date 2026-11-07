# JNR D51 source references

**Covers** - provenance of the JNR D51 model (`proc-vehicle-jnr-d51`): photographs, the measurements taken from them and published dimensions.
**Code** - `generator/jpLocos.ts`
**See also** - [the reference](../../docs/models/jnr-locos.md)

## Photographs

Downloaded from Wikimedia Commons (`pnpm refs:fetch`) and scaled to 1600 px (the older two) or 1280 px on the long side.

| file | original | URL | author | licence | use |
|---|---|---|---|---|---|
| `photo-d51-51-namekuji-side.jpg` | D51namekuzi.jpg | https://commons.wikimedia.org/wiki/File:D51namekuzi.jpg | Ariake | CC BY-SA 3.0 | D51 51 (namekuji), left side almost square on: every length along the engine (see "Measured"), the namekuji casing's length and tail, the running board's rise over the fourth driver, the cab, the air compressor |
| `photo-d51-489.jpg` | JNR-D51 489Deflector by Goto factory.jpg | https://commons.wikimedia.org/wiki/File:JNR-D51_489Deflector_by_Goto_factory.jpg | Rsa | CC BY-SA 3.0 | D51 498 (standard), left front three-quarter: the dome casing over the first two drivers, the deflectors, the tall cylinder casing with its brass covers, the box (Boxpok) drivers, the running board stepping up to the cab, the pilot plate |
| `photo-d51-200.jpg` | D51 200 本線復活運転時.jpg | https://commons.wikimedia.org/wiki/File:D51_200_%E6%9C%AC%E7%B7%9A%E5%BE%A9%E6%B4%BB%E9%81%8B%E8%BB%A2%E6%99%82.jpg | 32602Fand3060F | CC BY-SA 4.0 | D51 200 (the modelled standard engine), right front three-quarter: the feedwater heater across the smokebox ahead of the chimney, the headlight, the red number plates, the deflector's foot following the front step down to the beam, the marker lamps, the white running-board edge |
| `photo-d51-426-front.jpg` | D51 426 in the Railway Museum-1 (Japan).jpg | https://commons.wikimedia.org/wiki/File:D51_426_in_the_Railway_Museum-1_(Japan).jpg | Saigen Jiro | CC0 | D51 426 head-on: the deflectors' width and height against the smokebox, the feedwater heater's length (about 1.45 m), the number plate and star handle on the door |
| `photo-d51-95.jpg` | D51-95.jpg | https://commons.wikimedia.org/wiki/File:D51-95.jpg | MaedaAkihiko | CC BY-SA 4.0 | D51 95 (namekuji), left front three-quarter: the casing starting at the chimney, no feedwater heater on the smokebox, the white edging on running boards and tyres |
| `photo-d51-320-abira.jpg` | JNR D51 320 steam locomotive at Michinoeki Abira D51 Station.jpg | https://commons.wikimedia.org/wiki/File:JNR_D51_320_steam_locomotive_at_Michinoeki_Abira_D51_Station.jpg | Yasu (talk) | see the Commons page (not recorded when it was added) | D51 320 front three-quarter: the smokebox front, headlight and pilot (a Hokkaido engine with a second headlight, not modelled) |

Running numbers: the standard engine is D51 200 (red plates, as in `photo-d51-200.jpg`), the namekuji D51 1
(the first of the class, black plates as preserved at Kyoto).

## Measured

`photo-d51-51-namekuji-side.jpg` (1280 x 609): a projective fit u = (a x + b) / (c x + 1) through the four
driver centres at the published 1,550 mm pitch (u = 415, 557.5, 692.5, 822.5 px; residuals under 2 px), its
foreshortening taken from the drivers' image diameters (120 px first, 107.5 px fourth): a = 97.6, b = 415,
c = 0.01215, about 93 px/m at the first driver and 77 px/m at the cab. Distances from the first driver:
coupler face -3.15 m, beam and deflector front -2.85, leading axle -2.36, cylinder -1.90 to -0.91, chimney
-1.33, deflector rear -0.90, namekuji casing to +4.08 (its tail from +3.2), safety valves +4.4 / +4.65,
running board rise +4.48 to +6.04 (up 0.45 m), trailing axle +6.85, cab +7.64 to +8.92, roof to +9.6.
Heights over the rail: running board 1.8 - 1.9 m, smokebox top about 3.2 m, casing 3.8 - 3.9 m, cab window
2.7 - 3.3 m. The model's engine runs from the coupler (0) to the drawbar (12.4 m); the tender is the rest of
the 19.73 m.

## Published figures

- **Dimensions** - Wikipedia "JNR Class D51" and the Japanese article: 2-8-2, 1,400 mm drivers at 1,550 mm
  (4,650 mm coupled wheelbase; the fixed base 3,100 mm to the third driver), 550 x 660 mm cylinders,
  19,730 mm with the 8-20 tender, 3,980 mm high, 78.37 t engine, 47.4 t tender, 85 km/h, 1,115 built
  1936 - 1950. D51 1 - 85 and 91 - 100 ("namekuji") carry the feedwater heater lengthwise between chimney and
  sand box under one long casing and have a shorter cab; from D51 86 - 90 (trials) and 101 on the heater lies
  across the smokebox ahead of the chimney and one casing covers the sand box and steam dome.
- **Gauge** - the prototype's track is 1,067 mm; the model keeps its real body on the game's standard-gauge wheelsets.
