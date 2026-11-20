# SNCF Grand Confort source references

**Covers** - provenance of the SNCF Grand Confort model (`proc-vehicle-sncf-grand-confort`): photographs and the published figures.
**Code** - `generator/frGrandConfort.ts`, `generator/worldCoaches.ts`
**See also** - [the reference](../../docs/models/france-trains.md)

## Photographs

Downloaded from Wikimedia Commons (`pnpm refs:fetch`). Scales and fits are in the header of `generator/frGrandConfort.ts`.

| file | original | URL | author | licence | use |
|---|---|---|---|---|---|
| `photo-a3rtu-cite-du-train.jpg` | A3RTU Cite du Train.jpg | https://commons.wikimedia.org/wiki/File:A3RTU_Cite_du_Train.jpg | BB 22385 | CC BY-SA 4.0 | A3rtu bar car (`a7d`), original "Grand Confort" paint (`capitole`): window stack, door and eight-window layout (projective fit), band heights at the end wall (189 px/m), roof intakes, end wall, gangway, apron, BAR plate |
| `photo-ex-tee-cars-in-rapide-le-capitole-limoges-1988.jpg` | Ex-TEE cars in Rapide Le Capitole, Limoges (1988).jpg | https://commons.wikimedia.org/wiki/File:Ex-TEE_cars_in_Rapide_Le_Capitole,_Limoges_(1988).jpg | Steve Morgan | CC BY-SA 3.0 | A8u 61 87 18-99 037-6 (`a8u`), TEE "bande jaune" paint (`tee`): window pitch and width (equal-pitch fit), window sill and head, the band heights (235 px/m), the TRANS EUROP EXPRESS cartouche, the SNCF logo and number, the end door |
| `photo-gc-a8tu.jpg` | GC A8tu.jpg | https://commons.wikimedia.org/wiki/File:GC_A8tu.jpg | Jean-Pierre Vergez-Larrouy | CC BY-SA 3.0 | A8tu (a sister type) nearly side-on: the paint's order along the whole car, the window stack and door at the end, the roof hatches, the painted-out cartouche |

## Published figures

- **fr.wikipedia, [Voiture Grand Confort](https://fr.wikipedia.org/wiki/Voiture_Grand_Confort)**: 25.50 m long, Y 28 F bogies, sliding doors, 200 km/h, De Dietrich 1969 - 1974; the types (40 A8u with eight compartments and 48 seats, numbers 61 87 18-99; 6 A3rtu bar cars, 61 87 84-99 001 - 006); Arzens's livery (inox grey, later gris beton, rouge Capitole 602, orange lines each side of the windows, roof and bogies gris ardoise 807); the TEE variants (TRANS EUROP EXPRESS lettering; the yellow upper line on first class, not on the bar).
- The `a7d` key (kept from the first draft) is the A3rtu bar car. Its number 61 87 84-99 003-7 is illustrative (a valid number in the series; the museum car's own is not legible).
- Not found: bogie centres and wheelbase (measured about 18.2 m; 2.5 m assumed), the A8u's corridor side (drawn like the photographed side).
