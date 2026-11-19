# Regio 2N source references

**Covers** - provenance of the Regio 2N model (`proc-vehicle-sncf-regio2n`): the photographs, Bombardier's data sheet and the published figures.
**Code** - `generator/frRegio2n.ts`
**See also** - [the reference](../../docs/models/france-trains.md)

## Photographs

Downloaded from Wikimedia Commons (`pnpm refs:fetch`), at most 1280 px on the long side. The running
number of each photographed set is in the `use` column; the model's TER scheme carries Z 55505
(set 003XL, Hauts-de-France), its Transilien scheme Z 57015 (set 008R).

| file | original | URL | author | licence | use |
|---|---|---|---|---|---|
| `photo-regio2n-003xl-en-gare-de-longueau.jpg` | Regio2N 003XL en gare de Longueau.jpg | https://commons.wikimedia.org/wiki/File:Regio2N_003XL_en_gare_de_Longueau.jpg | Thierry Martel | CC BY-SA 4.0 | set 003XL (Z 55505), Hauts-de-France: the double-deck end car's layout (1-D projective fit over the face, the 1.6 m door and the joint), the single-deck car's doors and windows, heights (about 112 px/m on a 2x crop), the TER scheme (blue mask and upper band, green fields, blue doors), Jacobs bogies at the joints |
| `photo-regio-2n-z-55500-rame-117m-motrice-z-55733-gare-de-beauvais.jpg` | Regio 2N (Z 55500), rame 117M, motrice Z 55733, gare de Beauvais.jpg | https://commons.wikimedia.org/wiki/File:Regio_2N_(Z_55500),_rame_117M,_motrice_Z_55733,_gare_de_Beauvais.jpg | Kilyann Le Hen | CC BY-SA 4.0 | set 117M (Z 55733; the "train autonome" decals ignored): the face close up - windscreen, almond headlights, the band under the windscreen, the coupler's recess, the cab door over the leading bogie |
| `photo-z57000-regio-2n-ile-de-france-mobilite-en-gare-de-montereau.jpg` | Z57000 Régio 2n Ile de france mobilité en Gare de Montereau.jpg | https://commons.wikimedia.org/wiki/File:Z57000_R%C3%A9gio_2n_Ile_de_france_mobilit%C3%A9_en_Gare_de_Montereau.jpg | Andrixim | CC BY-SA 4.0 | set 008R (Z 57015): the Transilien face - white, the light blue arch, the black band with the number - and the cab side |
| `photo-sncf-z-55503.jpg` | SNCF Z 55503.jpg | https://commons.wikimedia.org/wiki/File:SNCF_Z_55503.jpg | Bahnfisch | CC BY-SA 3.0 | pre-series Z 55503 (test decals ignored): the single-deck end car (cab door, two windows, the toilet panel, the door, a window; 214 px/m up the door on a 3x crop), its roof equipment and pantograph |
| `photo-regio2n-n057l-au-ter16769-par-cramos.jpg` | Regio2N n°057L au TER16769 par Cramos.JPG | https://commons.wikimedia.org/wiki/File:Regio2N_n%C2%B0057L_au_TER16769_par_Cramos.JPG | Cramos | CC BY-SA 4.0 | set 057L, 8 cars, side-on: the formation (double-deck end car leading, the single-deck end car at the rear), the double-deck intermediate car's windows (six a deck, the stairs' panel, the mezzanine window), the single-deck car's layout; about 9.7 px/m along the train, 86 px/m up the double-deck car on a 4x crop |
| `photo-z-57000-livree-ile-de-france-mobilites-regio2n.jpg` | Z 57000, Livrée Île-de-France Mobilités Regio2n.jpg | https://commons.wikimedia.org/wiki/File:Z_57000,_Livr%C3%A9e_%C3%8Ele-de-France_Mobilit%C3%A9s_Regio2n.jpg | Adnane | CC BY-SA 4.0 | set 050R: the Transilien side - anthracite to the upper deck's sill, the light blue line, white above, the doors' blue frames |
| `photo-z-55500-ter-paca-a-quai-voie-1-en-gare-de-cannes.jpg` | Z 55500 TER PACA à quai voie 1 en gare de Cannes.jpg | https://commons.wikimedia.org/wiki/File:Z_55500_TER_PACA_%C3%A0_quai_voie_1_en_gare_de_Cannes.jpg | Remontees | CC BY-SA 4.0 | set 070L: the TER mask sweeping back over the cab side into the upper band, the nose three-quarter, the cab side's door and window |

## Published figures

- **Bombardier, "Regio 2N - Automotrice régionale à deux niveaux"** (data sheet, French): car lengths over the couplers - double-deck end car 19,215 mm, single-deck end car 14,300 mm, double-deck intermediate 15,445 mm (or 13,695 mm), single-deck intermediate 10,020 mm; the formations (courte 80.9 - 82.7 m, 6 cars; moyenne 95.0 m, 7 cars; longue 109.9 m, 8 cars; extra-longue 135.4 m, 10 cars); height 4,320 mm; widths 3,050 mm (single-deck) and 2,990 mm (double-deck); doors 1,600 mm, sill 600 mm; 2.4 / 3.2 MW, 160 km/h (200 km/h V200); axle load 19 / 20 t. Used for the car lengths, the train formations, the section and the game figures.
- **Wikipedia** fr ["Regio 2N"](https://fr.wikipedia.org/wiki/Regio_2N) and en ["Regio 2N"](https://en.wikipedia.org/wiki/Regio_2N): the alternating architecture, two double doors a side on the single-deck cars, two pantographs on the single-deck cars, 360 kW motors two to a motor bogie.
- The weights (about 263 t empty for 8 cars) are estimated from the axle load and the axle count; no published figure was found.
