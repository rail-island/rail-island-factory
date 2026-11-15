# NS SNG source references

**Covers** - provenance of the NS SNG model (`proc-vehicle-ns-sng`): the photographs and the published figures.
**Code** - `generator/nlSng.ts`, `generator/nlUnits.ts`
**See also** - [the reference](../../docs/models/netherlands-trains.md)

## Photographs

Downloaded from Wikimedia Commons at 1280 px wide (`pnpm refs:fetch`). Every unit has worn the yellow
front since August 2022 (2741 first, May 2021); 2302, 2348 and 2710 show the original dark blue
front, which shares every other paint edge with the yellow one. The model shows 2324.

| file | original | URL | author | licence | use |
|---|---|---|---|---|---|
| `photo-zutphen-sng-caf-2710-flickr-rob-dammers-2.jpg` | Zutphen SNG (CAF) 2710 - Flickr - Rob Dammers (2).jpg | https://commons.wikimedia.org/wiki/File:Zutphen_SNG_(CAF)_2710_-_Flickr_-_Rob_Dammers_(2).jpg | Rob Dammers | CC BY 2.0 | four-car 2710 (blue front), three-quarter: the face's paint fields, the lamp clusters, the open coupler recess, the window and door layout of all four cars, the roof covers and the pantograph over the end car's inner end |
| `photo-arnhem-centraal-sng-2348-sprinter-zutphen-51036118801.jpg` | Arnhem Centraal SNG 2348 Sprinter Zutphen (51036118801).jpg | https://commons.wikimedia.org/wiki/File:Arnhem_Centraal_SNG_2348_Sprinter_Zutphen_(51036118801).jpg | Rob Dammers | CC BY 2.0 | three-car 2348 (blue front), three-quarter: the joints, two doors a side on every car, the intermediate car's 2 - door - 3 - door - 2 windows, the pantograph positions |
| `photo-20240726-niederlande-hengelo-sng-caf-civity-sprinter.jpg` | 20240726 Niederlande Hengelo SNG CAF Civity Sprinter.jpg | https://commons.wikimedia.org/wiki/File:20240726_Niederlande_Hengelo_SNG_CAF_Civity_Sprinter.jpg | Bvcmz248.5 | CC0 | end car of 2340, side: the first-class windows, the white bar over them, the cab door, the paint bands and the yellow line rising over the motor bogie |
| `photo-ns-sng-2302.jpg` | NS SNG 2302.jpg | https://commons.wikimedia.org/wiki/File:NS_SNG_2302.jpg | Plutowiki | CC0 | end car of 2302, near side-on: the window, door and cab door positions along the car (projective fit on the doors), the motor bogie, the band heights, the swoosh and the raked cab side window, the face's profile |
| `photo-ns-sng-2324-at-hfd-07-2023.jpg` | NS SNG 2324 at Hfd, 07-2023.jpg | https://commons.wikimedia.org/wiki/File:NS_SNG_2324_at_Hfd,_07-2023.jpg | Styyx | CC BY-SA 4.0 | 2324 in the yellow-front scheme, three-quarter: the yellow front and pillars, the light grey cap, the white swoosh and the blue wedge, the lamps, the bumper (the modelled unit) |
| `photo-sng-op-station-lelystad-centrum-2024-1.jpg` | SNG op station Lelystad Centrum (2024)-1.jpg | https://commons.wikimedia.org/wiki/File:SNG_op_station_Lelystad_Centrum_(2024)-1.jpg | Sneeuwvlakte | CC BY-SA 4.0 | a yellow-front SNG nearly head-on: the face's widths, the windscreen, the lamp clusters, the white band and wedges, the bumper and coupler |

## Published figures

- **nl.wikipedia, "Sprinter Nieuwe Generatie"** (citing CAF and ERA's ERATV entry): 59.56 m (SNG-III,
  mABk + B + mBk, Bo'(2)'(2)'Bo') and 75.76 m (SNG-IV, mABk + mB + mBz + mABk, Bo'(2)'(Bo)'(2)'Bo') over
  the couplers, 2.88 m wide, 4.30 m high, 850 mm wheels, 760 mm floor at the doors, 1.30 m doors, six
  and eight a side, 110 t and 138 t, 160 km/h, the yellow fronts from 2021. The car lengths follow from the
  two totals: the intermediate car 16.2 m joint to joint, the end car 21.68 m from the coupling plane to its
  joint; the weights give 41 t an end car and 28 t an intermediate car.
- **en.wikipedia, [Sprinter New Generation](https://en.wikipedia.org/wiki/Sprinter_New_Generation)**: power,
  top speed and first year (`generator/openttdTable.ts`, [netherlands-trains.md](../../docs/models/netherlands-trains.md)).
