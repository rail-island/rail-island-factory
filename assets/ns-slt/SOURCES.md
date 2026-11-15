# NS SLT source references

**Covers** - provenance of the NS SLT model (`proc-vehicle-ns-slt`): the photographs it was matched to and the published figures.
**Code** - `generator/nlSlt.ts`, `generator/nlUnits.ts`
**See also** - [the reference](../../docs/models/netherlands-trains.md)

## Photographs

Downloaded from Wikimedia Commons (`pnpm refs:fetch`). The model's side number, 2463, is the unit
in the first photograph.

| file | original | URL | author | licence | unit | use |
|---|---|---|---|---|---|---|
| `photo-ns2463-t-harde-20180908.jpg` | NS2463 -- 't Harde 20180908.jpg | https://commons.wikimedia.org/wiki/File:NS2463_--_%27t_Harde_20180908.jpg | Jan Derk Remmers | CC BY-SA 4.0 | 2463 (SLT-IV) | front three-quarter: the blue U round the windscreen and its sweep onto the cab side and roof, the band's pointed front, the cab door, the bumper, the roof grilles, the emblem |
| `photo-a12-woudenberg-slt-2632-naar-rhenen-11716348975.jpg` | A12 Woudenberg SLT 2632 naar Rhenen (11716348975).jpg | https://commons.wikimedia.org/wiki/File:A12_Woudenberg_SLT_2632_naar_Rhenen_(11716348975).jpg | Rob Dammers | CC BY 2.0 | 2632 (SLT-VI) | the side: a projective fit on the five joints (residuals under 0.25 px) gives the window, door and bogie positions of the end and the intermediate cars; heights from the face (235 px/m) |
| `photo-ns-slt.jpg` | NS SLT.jpg | https://commons.wikimedia.org/wiki/File:NS_SLT.jpg | Bart from Amstelveen, Holland | CC BY 2.0 | an SLT-VI | head-on (45 px/m from the 2.84 m width): the face's heights - bumper, lamps, windscreen, cap - and widths |
| `photo-ns-2401-schiedam-centrum.jpg` | NS 2401 Schiedam Centrum.jpg | https://commons.wikimedia.org/wiki/File:NS_2401_Schiedam_Centrum.jpg | User:Willem_90 | Public domain | 2401 (SLT-IV) | front three-quarter: the face's plan, the windscreen's rake, the bumper and the coupler's recess |
| `photo-amsterdam-amstel-2607.jpg` | Amsterdam Amstel 2607.jpg | https://commons.wikimedia.org/wiki/File:Amsterdam_Amstel_2607.jpg | Mauritsvink | Public domain | 2607 (SLT-VI) | the raised single-arm pantograph on the second car behind its front joint |
| `photo-slt-iv-baambrugge.jpg` | SLT IV,Baambrugge.jpg | https://commons.wikimedia.org/wiki/File:SLT_IV,Baambrugge.jpg | Bart from Amstelveen, Holland | CC BY 2.0 | an SLT-IV | the four-car formation: one door a side on the end cars, two on the intermediate cars |

## Published figures

- **Figures** - nl.wikipedia [Sprinter Lighttrain](https://nl.wikipedia.org/wiki/Sprinter_Lighttrain) and de.wikipedia [NS-Baureihe SLT](https://de.wikipedia.org/wiki/NS-Baureihe_SLT): 69.36 m (SLT-IV) and 100.54 m (SLT-VI) over the couplers, 2.84 m wide, 4.21 m high, 850 mm wheels, 2.3 m wheelbase, Bo'(Bo)'(2)'(2)'Bo' on Jacobs bogies, 6 doors a side (SLT-IV) and 10 (SLT-VI), 160 km/h. The two lengths give the intermediate car 15.59 m joint to joint and the end car 19.09 m from its coupler to the joint. Power, top speed and first year as the design states them (`generator/nlSlt.ts`, `generator/openttdTable.ts`, [netherlands-trains.md](../../docs/models/netherlands-trains.md)).
