# RER MI 09 source references

**Covers** - provenance of the RER MI 09 model (`proc-vehicle-ratp-mi09`): the photographs and the published figures.
**Code** - `generator/frMi09.ts`, `generator/frUnits.ts`
**See also** - [the reference](../../docs/models/france-trains.md)

## Photographs

Downloaded from Wikimedia Commons at 1280 px wide (`pnpm refs:fetch`). The units photographed: 1626
(Nanterre), 1610 (Charles-de-Gaulle - Etoile), 1622 (Houilles), 1858 (Fontenay-sous-Bois), 1759 (Noisy-Champs).
Scales: the Ile Corbiere side view about 10.9 px/m along the end car (5 % perspective over a door pitch);
1858 about 47 - 50 px/m up the side; 1622 head-on 140 px/m across the 2.9 m face.

| file | original | URL | author | licence | use |
|---|---|---|---|---|---|
| `photo-ligne-de-nanterre-a-sartrouville-viaduc-de-nante.jpg` | Ligne de Nanterre a Sartrouville - Viaduc de Nanterre - MI09 - Avril 2012 (4) cropped.jpg | https://commons.wikimedia.org/wiki/File:Ligne_de_Nanterre_a_Sartrouville_-_Viaduc_de_Nanterre_-_MI09_-_Avril_2012_(4)_cropped.jpg | Ligne_de_Nanterre_a_Sartrouville_-_Viaduc_de_Nanterre_-_MI09_-_Avril_2012_(4).jp | CC BY-SA 3.0 | 1626: the middle car's end sections and doors, the raised pantograph on the end car, the grey band |
| `photo-rame-mi09-du-rer-a-cdg-img-1593.jpg` | Rame MI09 du RER A - CDG - IMG 1593.jpg | https://commons.wikimedia.org/wiki/File:Rame_MI09_du_RER_A_-_CDG_-_IMG_1593.jpg | Poudou99 | CC BY 3.0 | 1610's cab side: the face's rake, the cab door and its window, the door leaves (window over the jade stripe) |
| `photo-mi09-exterieur-20111208.jpg` | MI09 - Exterieur 20111208.jpg | https://commons.wikimedia.org/wiki/File:MI09_-_Exterieur_20111208.jpg | Gonioul | CC BY-SA 3.0 | the sides along the platform: the windows' corners, the grey band, the gangways |
| `photo-mi-09-rer-a-arrivant-voie-b-en-gare-de-houilles-carrieres-su.jpg` | MI 09 RER A arrivant voie B en gare de Houilles - Carrières-sur-Seine.jpg | https://commons.wikimedia.org/wiki/File:MI_09_RER_A_arrivant_voie_B_en_gare_de_Houilles_-_Carri%C3%A8res-sur-Seine.jpg | Remontees | CC BY-SA 4.0 | 1622 head-on: the face's mask, windscreen, cheeks, lamps, emblem and bumper |
| `photo-deux-mi-09-gare-de-noisy-champs.jpg` | Deux MI 09 — Gare de Noisy-Champs.jpg | https://commons.wikimedia.org/wiki/File:Deux_MI_09_%E2%80%94_Gare_de_Noisy-Champs.jpg | Skililipappa | CC BY-SA 4.0 | the faces from above: the plan's corners, the roof lamp |
| `photo-train-mi09-pres-gare-fontenay-bois-4.jpg` | Train MI09 près Gare Fontenay Bois 4.jpg | https://commons.wikimedia.org/wiki/File:Train_MI09_pr%C3%A8s_Gare_Fontenay_Bois_4.jpg | Chabe01 | CC BY-SA 4.0 | 1858 three-quarter: heights of windows, doors and grey band; the 1-D fit over the doors; the cab's white ahead of the cab door |
| `photo-rame-mi09-du-rer-a-def-img-1560.jpg` | Rame MI09 du RER A - DEF - IMG 1560.jpg | https://commons.wikimedia.org/wiki/File:Rame_MI09_du_RER_A_-_DEF_-_IMG_1560.jpg | Poudou99 | CC BY 3.0 | the door leaves, the jade stripe carried to the roof, the grey band across the leaves |
| `photo-ligne-rer-a-pres-gare-parc-st-maur-fosses-5.jpg` | Ligne RER A près Gare Parc St Maur Fossés 5.jpg | https://commons.wikimedia.org/wiki/File:Ligne_RER_A_pr%C3%A8s_Gare_Parc_St_Maur_Foss%C3%A9s_5.jpg | Chabe01 | CC BY-SA 4.0 | the roof: grilles and equipment boxes |
| `photo-mi-09-a-la-voie-b-de-la-gare-rer-a-de-la-defense-vu-depuis-l.jpg` | MI 09 à la voie B de la gare RER A de La Défense vu depuis la voie A.jpg | https://commons.wikimedia.org/wiki/File:MI_09_%C3%A0_la_voie_B_de_la_gare_RER_A_de_La_D%C3%A9fense_vu_depuis_la_voie_A.jpg | Remontees | CC BY-SA 4.0 | the grey band's edges, the door stripe's width, the lower windows |
| `photo-pantographe-d-un-mi09.jpg` | Pantographe d'un MI09.jpg | https://commons.wikimedia.org/wiki/File:Pantographe_d%27un_MI09.jpg | Remontees | CC BY-SA 4.0 | pantograph type and its place on the roof |
| `photo-rer-a-sur-l-ile-corbiere.jpg` | RER A SUR L'ILE CORBIERE.jpg | https://commons.wikimedia.org/wiki/File:RER_A_SUR_L%27ILE_CORBIERE.jpg | Homère plus | CC BY-SA 4.0 | the end car side-on: every door, window and the cab door along the car, the pantograph over the inner door |

## Published figures

- **Figures** - Wikipedia, [MI 09](https://en.wikipedia.org/wiki/MI_09) and fr.wikipedia "MI 09" / "MI 2N": 112.0 m over the couplers in five cars R+M+M+M+R (end cars 24.5 m, motor cars 21.0 m), 2.90 m wide, 4.32 m high, bogie centres 16.7 m, bogie wheelbase 2.45 m, 288 t, 3,900 kW, 120 km/h, 474 seats, three 2 m doors a side (`generator/frMi09.ts`, `generator/openttdTable.ts`, [france-trains.md](../../docs/models/france-trains.md)).
