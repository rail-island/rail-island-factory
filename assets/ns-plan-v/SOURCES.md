# NS Plan V source references

**Covers** - provenance of the NS Plan V model (`proc-vehicle-ns-plan-v`): photographs and the published figures.
**Code** - `generator/nlPlanV.ts`, `generator/nlUnits.ts`
**See also** - [the reference](../../docs/models/netherlands-trains.md)

## Photographs

Downloaded from Wikimedia Commons (at most 1280 px on the long side). The model is the sub-series
V4 - V6 (441 - 483, Bk + ABk, no luggage or mail room); units of other sub-series are used only for
what they share (the nose, the paint, the roof).

| file | original | URL | author | licence | use |
|---|---|---|---|---|---|
| `photo-treinstel-type-mat-64-station-haarlem.jpg` | Treinstel type Mat'64 station Haarlem.jpg | https://commons.wikimedia.org/wiki/File:Treinstel_type_Mat%2764_station_Haarlem.jpg | Koplopermau | CC BY-SA 4.0 | museum unit 876 (V9) restored: front three-quarter (lamp band, grille, housing, panes, chin), the darker blue stripes and glazed corner windows of `yellowGrey`, the NS logo, the pantograph near the inner end |
| `photo-plan-v-454-te-deventer.jpg` | Plan V 454 te Deventer.JPG | https://commons.wikimedia.org/wiki/File:Plan_V_454_te_Deventer.JPG | Martijnvanvulpen | CC BY-SA 3.0 | unit 454 (V4): the side's layout (cab door, 2 windows, door, 5 + narrow window, door, 3 windows) by a projective fit, the light blue stripes and painted corner windows of `yellowBlue`, the single-arm pantograph on the leading car, the bogies |
| `photo-planv-uitgeest.jpg` | PlanV-Uitgeest.JPG | https://commons.wikimedia.org/wiki/File:PlanV-Uitgeest.JPG | Combino at Dutch Wikipedia | CC BY-SA 3.0 | the near side-on view: the layout's positions (projective fit, 26 m car), the nose's profile (about 64 px/m), window and door heights, the roof grilles, both cars alike |
| `photo-441-in-vlissingen.jpg` | 441 in Vlissingen.jpg | https://commons.wikimedia.org/wiki/File:441_in_Vlissingen.jpg | Koffiekopje | CC BY-SA 3.0 | unit 441 head-on (about 189 px/m at the band): heights and widths of the band, lamps, grille, recess, chin, head lamp housing, windscreen and roof |
| `photo-mat-64-plan-v-844-1.jpg` | Mat '64 Plan V 844 (1).jpg | https://commons.wikimedia.org/wiki/File:Mat_%2764_Plan_V_844_(1).jpg | Itsramon | CC BY 3.0 | unit 844 (Connexxion sticker, not modelled): the nose's profile close up - the bulge, the band wrapping round, the D-shaped corner window, the cab door |
| `photo-dutch-railways-emu-mat64-plan-v-utrecht-centraal.jpg` | Dutch Railways EMU Mat64 - Plan V - Utrecht Centraal.jpg | https://commons.wikimedia.org/wiki/File:Dutch_Railways_EMU_Mat64_-_Plan_V_-_Utrecht_Centraal.jpg | G. Wirken | CC BY-SA 2.5 | the front nearly head-on: the three panes and their wipers, the coupler and its red cover |
| `photo-spoorwegmuseum-treinstel-ns-876.jpg` | Spoorwegmuseum treinstel NS 876.jpg | https://commons.wikimedia.org/wiki/File:Spoorwegmuseum_treinstel_NS_876.jpg | Eriksw | CC BY-SA 4.0 | unit 876 three-quarter: the nose's plan and the chin's shape |
| `photo-mat-64-rotterdam-centraal-26-maart-2017.jpg` | Mat ’64 - Rotterdam Centraal - 26 Maart 2017.jpg | https://commons.wikimedia.org/wiki/File:Mat_%E2%80%9964_-_Rotterdam_Centraal_-_26_Maart_2017.jpg | Metrophil | CC BY 3.0 | the pantograph's place near the inner end, the roof grilles over the first door |

## Published figures

- **Figures** - Wikipedia, [Mat '64](https://nl.wikipedia.org/wiki/Mat_%2764): 52.1 m over the couplers for the two cars (26.05 m a car), floor 1.23 m, 2'Bo'+Bo'2', doors 1300 mm, Scharfenberg couplers, 140 km/h; the 1968 house style "geel met grijs en schuine blauwe reclamebanen", the corner windows painted yellow in the last years; power and first year as the design states them (`generator/nlPlanV.ts`, `generator/openttdTable.ts`).
- **Estimated** - the body's heights (crown 3.95 m, eaves 3.32 m, windows 1.95 - 2.9 m), the nose (windscreen foot 1.0 m, head 1.5 m, cab door 4.3 m behind the tip, from projective fits on the two side photographs) and the bogie centres (5.0 and 22.0 m behind the tip) are measured on the photographs, not published.
