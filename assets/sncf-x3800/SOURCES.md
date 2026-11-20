# SNCF X 3800 Picasso source references

**Covers** - provenance of the SNCF X 3800 Picasso model (`proc-vehicle-sncf-x3800`): photographs, a drawing and the published figures.
**Code** - `generator/frX3800.ts`, `generator/frUnits.ts`
**See also** - [the reference](../../docs/models/france-trains.md)

## Photographs

Downloaded from Wikimedia Commons (`pnpm refs:fetch`). The model is drawn as the early cars X 3817 and
X 3853 (their two sides agree; the late cars X 3998, X 4039 and X 4042 have a cab door and grilles in place
of the first window and luggage door on the right side) and carries X 3817's number. Scales are in
`generator/frX3800.ts`'s header.

| file | original | URL | author | licence | use |
|---|---|---|---|---|---|
| `photo-mine-museum-diesel-locomotive-autorail-picasso-x.jpg` | Mine museum diesel locomotive autorail Picasso X4042 at Petite-Rosselle pic-005.JPG | https://commons.wikimedia.org/wiki/File:Mine_museum_diesel_locomotive_autorail_Picasso_X4042_at_Petite-Rosselle_pic-005.JPG | AlfvanBeem | CC0 | X 4042: the turret's shape and windows, the lamp housings, the roof (exhaust, horns) |
| `photo-p1190507-picasso-x-3817.jpg` | P1190507 - Picasso X 3817.JPG | https://commons.wikimedia.org/wiki/File:P1190507_-_Picasso_X_3817.JPG | Claude villetaneuse | CC BY-SA 3.0 | X 3817, right side (+Z): window and door spans (projective fit), the turret's length and side windows, the ventilators; the model's number |
| `photo-p1190506-picasso-x-3853.jpg` | P1190506 - Picasso X 3853.JPG | https://commons.wikimedia.org/wiki/File:P1190506_-_Picasso_X_3853.JPG | Claude villetaneuse | CC BY-SA 3.0 | X 3853, left side (-Z): window and door spans (projective fit), the second cab window, the louvred window, sill/head and the red/cream edge, the radiator housing on the roof |
| `photo-autorail-picasso-cfv3v-img-2352.jpg` | Autorail Picasso CFV3V IMG 2352.jpg | https://commons.wikimedia.org/wiki/File:Autorail_Picasso_CFV3V_IMG_2352.jpg | Roehrensee | CC BY-SA 4.0 | X 3998 head-on (249 px/m): the end's windows, lamps, V, number, crown and buffers |
| `photo-mine-museum-diesel-locomotive-autorail-picasso-x4042-at-peti.jpg` | Mine museum diesel locomotive autorail Picasso X4042 at Petite-Rosselle pic-006.JPG | https://commons.wikimedia.org/wiki/File:Mine_museum_diesel_locomotive_autorail_Picasso_X4042_at_Petite-Rosselle_pic-006.JPG | AlfvanBeem | CC0 | X 4042 three-quarter: the turret's arched windscreen and side windows, its offset to the right, the skirt's foot |
| `photo-x-3896.jpg` | X 3896.jpg | https://commons.wikimedia.org/wiki/File:X_3896.jpg | Joël Thibault | CC BY-SA 4.0 | elevation drawing of the turret end (110 px/m): the turret's length and height, the crown, the bogie |
| `photo-autorail-x4039.jpg` | Autorail X4039.jpg | https://commons.wikimedia.org/wiki/File:Autorail_X4039.jpg | Jean-François Azens | CC BY-SA 4.0 | X 4039 end close-up: the three panels of the end and their seams, the dome's seam, rounded window corners, the V |

## Published figures

- **Figures** - Wikipedia, [SNCF Class X 3800](https://en.wikipedia.org/wiki/SNCF_Class_X_3800) and fr.wikipedia [X 3800](https://fr.wikipedia.org/wiki/X_3800): 21.851 m over buffers, 3.09 m wide, 3.952 m high, bogie centres 14.201 m, bogie wheelbase 2.6 m, wheels 860 mm, 31.5 t, 250 kW, 120 km/h, 62 seats (`generator/frX3800.ts`, `generator/openttdTable.ts`, [france-trains.md](../../docs/models/france-trains.md)).
