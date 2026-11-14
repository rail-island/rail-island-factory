# ICE 2 source references

**Covers** - provenance of the ICE 2 model (`proc-vehicle-db-ice2`): photographs and published figures.
**Code** - `generator/deIce2.ts`, `generator/ice1.ts` (the power car and coach, `ice2` variant)
**See also** - [the reference](../../docs/models/germany-trains.md)

## Photographs

Downloaded from Wikimedia Commons at 1280 px wide (`pnpm refs:fetch`). The driving trailer (class 808)
and the power car (class 402) share the face: the photographs of either inform it.

| file | original | URL | author | licence | use |
|---|---|---|---|---|---|
| `photo-ice-2-halbzug-radbruch.jpg` | ICE-2-Halbzug Radbruch.jpg | https://commons.wikimedia.org/wiki/File:ICE-2-Halbzug_Radbruch.jpg | Sebastian Terfloth User:Sese_Ingolstadt | CC BY-SA 3.0 | driving trailer head-on (about 130 px/m on the face): windscreen 2.56 - 3.34 m and +-1.2 m, upper lamp 2.3 - 2.5 m, head lamp housings and grille 1.62 - 1.82 m, coupler flap to 1.57 m and its split, stripe across it 1.01 - 1.22 m, guide horn; the coaches' window band and stripe |
| `photo-ice2-007-koln-bonn-airport-steuerwagen.jpg` | ICE2 007 Köln Bonn Airport Steuerwagen.jpg | https://commons.wikimedia.org/wiki/File:ICE2_007_K%C3%B6ln_Bonn_Airport_Steuerwagen.jpg | Qualle | CC BY 2.5 | driving trailer front three-quarter (before the redesign): the raked cab side window, the door's narrow window, the stripe's sweep and its height under the window band |
| `photo-baureihe-402-ice2-9778170426.jpg` | Baureihe 402 ICE2 (9778170426).jpg | https://commons.wikimedia.org/wiki/File:Baureihe_402_ICE2_(9778170426).jpg | Lars Steffens | CC BY-SA 2.0 | driving trailer close three-quarter: face panel seam, lamp housings with two lamps, grille groups, flap outline, the "ICE" lettering between cab window and door, the coaches' stripe under the windows |
| `photo-trein-hamm.jpg` | Trein Hamm.JPG | https://commons.wikimedia.org/wiki/File:Trein_Hamm.JPG | Maxiiie | CC BY-SA 3.0 | driving trailer with the coupler flap open: the cab side window's outline, the door behind the cab |
| `photo-ice2-garmisch.jpg` | ICE2 Garmisch.JPG | https://commons.wikimedia.org/wiki/File:ICE2_Garmisch.JPG | ArtVandelay13 | Public domain | power car 402 016: the split flap, guide horn, the stripe sweeping from the flap up to the side |
| `photo-ice2-koln-bonn-airport.jpg` | ICE2 Köln-Bonn Airport.JPG | https://commons.wikimedia.org/wiki/File:ICE2_K%C3%B6ln-Bonn_Airport.JPG | Mike Stephan, User:Mikosch | Public domain | power car front three-quarter: the face, the stripe's sweep |
| `photo-ice-2-auf-linie-10.jpg` | ICE 2 auf Linie 10.jpg | https://commons.wikimedia.org/wiki/File:ICE_2_auf_Linie_10.jpg | Finn 2509 | CC BY-SA 4.0 | power car and coaches side-on (oblique): stripe height against the window band |
| `photo-ice2-hilpodrom.jpg` | ICE2 Hilpodrom.jpg | https://commons.wikimedia.org/wiki/File:ICE2_Hilpodrom.jpg | Sebastian Terfloth User:Sese_Ingolstadt | CC BY-SA 2.5 | the half train from above: power car roof and pantograph, coaches |

## Published figures

- **Lengths** - de.wikipedia "ICE 2": power car 20.56 m over the couplers, half train (power car, six
  coaches, driving trailer) 205.36 m, so with the ICE 1's 26.40 m coaches the driving trailer is 26.40 m
  (the 26.58 m used before is not published there); width 3.07 m (power car) and 3.02 m (coaches),
  height 3.84 m, wheels 920 mm, coach bogie wheelbase 2.5 m.
- **Running number** - 808 001 (the first driving trailer; prototype of the 2010-2013 redesign).
- **Power, speed** - as the design states them (`generator/deIce2.ts`, `generator/openttdTable.ts`).
