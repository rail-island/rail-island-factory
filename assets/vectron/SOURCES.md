# Siemens Vectron source references

**Covers** - the reference photos, the dimensions and their sources, the liveries' units and running numbers.
**Code** - `generator/vectron.ts`.
**See also** - [the model's reference](../../docs/models/vectron.md).

## Photographs

All downloaded from Wikimedia Commons (1600 px thumbnails, saved as JPEG quality 85), but
`photo-193-295-cd-eurocity-side.jpg` and `photo-193-293-cd-eurocity.jpg`, supplied by the user.

| File | Commons page | Author | Licence | Used for |
|---|---|---|---|---|
| `photo-193-298-cd-eurocity.jpg` | https://commons.wikimedia.org/wiki/File:CD_193_298_Hamburg_1907190851.jpg | Clic | CC BY-SA 4.0 | the CD Eurocity livery (193 298, 91 80 6193 298-7 D-ELOC, Hamburg Hbf, 19 July 2019): the navy nose and cab, the light blue lower half and its foot under the nose, white stripes and emblem; the nose, windscreen and lamps |
| `photo-193-295-cd-eurocity-side.jpg` | supplied by the user (a web screenshot, 816 x 368 px; origin not recorded) | unknown | unknown - reference only, not redistributed in the export | the Eurocity's full side (193 295): light blue from the frame to mid height, white above, the navy cab sections and their sweep over the cab door, the navy emblem and "České dráhy" behind the cab door; its cities, skylines and slogan are left out |
| `photo-193-293-cd-eurocity.jpg` | supplied by the user (a phone screenshot of an image search, origin cysnews / vlaky.net / Transport-logistika; 1080 x 2400 px) | unknown | unknown - reference only, not redistributed in the export | the Eurocity's continuous bands (193 293 at Dresden, 193 295 and 193 292): the white strip and the navy cant running cab to cab, the white sweeping down to the nose's lower corner, the navy over the cab sides and noses |
| `photo-193-289-cd-eurocity-side.jpg` | https://commons.wikimedia.org/wiki/File:J36_539_Bf_Prag_Hbf,_193_289.jpg | Falk2 | CC BY-SA 4.0 | the Eurocity's side and cab (193 289 "Flora", Praha hl. n., 29 June 2019): the white strip turning down in front of the cab door and running out into the navy two thirds of the way down, the light blue carried under the lamps into the nose's foot, the navy cant |
| `photo-193-205-regiojet.jpg` | https://commons.wikimedia.org/wiki/File:193_205_Vectron_RegioJet.jpg | Rainerhaufe | CC BY-SA 4.0 | the RegioJet livery (193 205, Praha-Smichov, 16 December 2017): the yellow, the white cab cap, the black windscreen surround and stripes; the three-quarter shape |
| `photo-193-574-cd-white.jpg` | https://commons.wikimedia.org/wiki/File:%C4%8CD_193_574-1_in_Berlin_Hauptbahnhof,_2024_(01).jpg | Bahnfrend | CC BY-SA 4.0 | the white RSL unit 193 574-1 in CD service (Berlin Hbf, 4 August 2024): the plain white livery, the V lamp grille, the pantographs folded |
| `photo-193-227-regiojet-cab-side.jpg` | https://commons.wikimedia.org/wiki/File:193_227_ELL_in_Regiojet_livery_Praha-Smichov_2017-05-17_1.jpg | PetrS. | CC BY-SA 4.0 | the cab side: the corner, the cab door, its window and handrails, the frame and steps |
| `photo-193-227-regiojet-side.jpg` | https://commons.wikimedia.org/wiki/File:193_227_ELL_in_Regiojet_livery_Praha-Smichov_2017-05-17_4.jpg | PetrS. | CC BY-SA 4.0 | the machine room's side, the cant grille, the bogie; the data panel's 89 t and the "18.98 m" length marking |

## Dimensions

From de.wikipedia and en.wikipedia (Siemens Vectron, electric versions): 18.98 m
over the buffers, 3.01 m wide, 4.25 m high, 9.5 m between the bogie pivots, 3.0 m
bogie wheelbase, 1.25 m wheels (new); 6.4 MW under AC, 160 / 200 / 230 km/h by
package. The service mass, 89 t, is on the 193 227's data panel. The nose
profile, the corner setbacks, the band heights, the door and the grille stripes
are measured off the photographs above; the length marking on the 193 227
("18.98 m") confirms the scale.

## Liveries and units

- **CD Eurocity**: ELL's 193 289 - 298, leased by CD from 2017 for the
  Eurocity trains Praha - Berlin - Hamburg (railcolornews.com, 23 November
  2017); the model's unit is 193 298-7.
- **RegioJet**: ELL's 193 205, 206, 214, 226 and 227, painted for RegioJet's
  long-term lease; the last one went back to ELL in July 2024 (railvolution.net,
  3 August 2024). The model's unit is 193 205-2 (the Commons photo of 27 June
  2016 at Pardubice gives its check digit).
- **CD white**: RSL's units in CD service in the plain white scheme with CD's
  markings (193 574-1, Berlin, 2024).

Every number is checked by the 1988 CSD/CD scheme in `test/vectron.test.ts`; the
German UIC numbers (91 80 6193 nnn-c) end in the same check digit.
