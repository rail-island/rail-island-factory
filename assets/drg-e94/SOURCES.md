# DRG E 94 source references

**Covers** - provenance of the DRG E 94 model (`proc-vehicle-drg-e94`): five photographs and the published figures.
**Code** - `generator/deE94.ts`
**See also** - [the reference](../../docs/models/germany-trains.md)

## Photographs

Downloaded from Wikimedia Commons (the photographs of the German article "DR-Baureihe E 94"). Lengths
along the side were measured in the three-quarter views with a 1-D projective fit over the hood fronts
(+-8.45 m) and the cab fronts (solved by the cross-ratio: +-5.04 m on E 94 192, +-5.29 m on E 94 279),
heights against the buffer height (1.06 m) and the roof.

| file | original | URL | author | licence | use |
|---|---|---|---|---|---|
| `photo-german-class-194-279.jpg` | German Class 194 279.JPG | https://commons.wikimedia.org/wiki/File:German_Class_194_279.JPG | Hans-Peter Scholz Ulenspiegel | CC BY-SA 2.0 de | side layout, roof ventilator, pantographs |
| `photo-e94-056-leipzig-hauptbahnhof.jpg` | E94 056 Leipzig-Hauptbahnhof.jpg | https://commons.wikimedia.org/wiki/File:E94_056_Leipzig-Hauptbahnhof.jpg | Rainerhaufe | CC BY-SA 4.0 | side and front: the hoods, the cab, paint |
| `photo-dr-e94-088-schiebend-dresden-freiberger-strae-04-26.jpg` | DR E94 088 schiebend Dresden Freiberger Straße 04 26.jpg | https://commons.wikimedia.org/wiki/File:DR_E94_088_schiebend_Dresden_Freiberger_Stra%C3%9Fe_04_26.jpg | Rainerhaufe | CC0 | E 94 088 (the modelled number): livery and front |
| `photo-e94279.jpg` | E94279.jpg | https://commons.wikimedia.org/wiki/File:E94279.jpg | ANDE9 at German Wikipedia | CC BY-SA 3.0 | side view: lengths, hoods, louvres, running gear |
| `photo-mueost08122012e94192c99.jpg` | Mueost08122012e94192c99.jpg | https://commons.wikimedia.org/wiki/File:Mueost08122012e94192c99.jpg | Fentriss | Public domain | side and roof |

## Published figures

- **Figures** - Wikipedia, [DRG Class E 94](https://en.wikipedia.org/wiki/DRG_Class_E_94) and [DR-Baureihe E 94](https://de.wikipedia.org/wiki/DR-Baureihe_E_94): length over buffers 18,600 mm, width 3,150 mm, height 4,650 mm (pantographs folded), bogie pivots 10,000 mm apart, bogie wheelbase 4,600 mm (2,450 + 2,150 mm), total wheelbase 13,700 mm, wheels 1,250 mm; power, top speed and first year as the design states them (`generator/deE94.ts`, `generator/deLocos.ts`, `generator/openttdTable.ts`, [germany-trains.md](../../docs/models/germany-trains.md)).
- **Running number** - E 94 088 (DR, preserved, photographed in Dresden): green body, black frame and running gear, red wheel centres and pantographs; the roof grey.
