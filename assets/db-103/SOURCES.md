# DB 103 source references

**Covers** - provenance of the DB 103 model (`proc-vehicle-db-103`): photographs, measurements and published figures.
**Code** - `generator/deBr103.ts`, `generator/deLocos.ts`
**See also** - [the reference](../../docs/models/germany-trains.md)

## Photographs

Downloaded from Wikimedia Commons at 1280 px wide (`pnpm refs:fetch`). Where the author column
repeats the file page's attribution line, see the file page for the uploader.

| file | original | URL | author | licence | use |
|---|---|---|---|---|---|
| `photo-103-113-7-munchen-hbf.jpg` | 103-113-7 München Hbf.jpg | https://commons.wikimedia.org/wiki/File:103-113-7_M%C3%BCnchen_Hbf.jpg | Sunstarfire | CC BY-SA 4.0 | the side (TEE, 103 113): the five window bays in two rows, the body joints, the door and cab window positions (1-D projective fit over the bays), the stripe round the nose ending at the cab joint, the cream line over the skirt, the lamp housings |
| `photo-103-113-luetzel-03042010.jpg` | 103 113 Luetzel 03042010.jpg | https://commons.wikimedia.org/wiki/File:103_113_Luetzel_03042010.jpg | Commons file page (uploader) | CC BY-SA 3.0 | head-on front (TEE): every height (skirt, buffers, lamps, stripe, emblem, top lamp, windscreen, crown; 175 px/m from rail to crown), lamp spacing, windscreen width, the single-arm pantographs |
| `photo-103233-koblenz-luetzel-06052006.jpg` | 103233 Koblenz-Luetzel 06052006.jpg | https://commons.wikimedia.org/wiki/File:103233_Koblenz-Luetzel_06052006.jpg | Commons file page (uploader) | CC BY-SA 3.0 | the long-cab side (103 233): cab window and door positions of 103 216 - 245; the traffic red livery (white front band, grey skirt) and its number |
| `photo-db-103-228-3-in-flensburg.jpg` | DB 103 228-3 in Flensburg.jpg | https://commons.wikimedia.org/wiki/File:DB_103_228-3_in_Flensburg.jpg | Peter L. Svendsen | CC BY-SA 3.0 | the orient red livery (the light grey bib), its number 103 228-3 |
| `photo-103-245-munchen.jpg` | 103 245 München.jpg | https://commons.wikimedia.org/wiki/File:103_245_M%C3%BCnchen.jpg | Sebastian Terfloth (User:Sese_Ingolstadt) | CC BY 2.5 | the TEE livery's number 103 245-7 (long cab), the grey roof hood and its louvres, the grey skirt |
| `photo-drei-elektrolokomotiven-der-baureihe-103-im-bahnhof-bremen-h.jpg` | Drei Elektrolokomotiven der Baureihe 103 im Bahnhof Bremen-Hemelingen.jpg | https://commons.wikimedia.org/wiki/File:Drei_Elektrolokomotiven_der_Baureihe_103_im_Bahnhof_Bremen-Hemelingen.jpg | Benedikt Dohmen (user Benedictus), Archiv-Nr. 60/12 | CC BY-SA 4.0 | the original TEE scheme with the grey skirt and the single-arm pantographs (103 222, 230) |
| `photo-103-184-db-nahe-osterm-nchen-bayern-1.jpg` | 103 184 DB nahe Ostermünchen - Bayern (1).JPG | https://commons.wikimedia.org/wiki/File:103_184_DB_nahe_Osterm%C3%BCnchen_-_Bayern_(1).JPG | Steffs88 | CC BY-SA 4.0 | the TEE paint (stripe, cream line, grey skirt), the pantograph positions (rear raised) |
| `photo-db-103-226-7.jpg` | DB 103 226 7.JPG | https://commons.wikimedia.org/wiki/File:DB_103_226_7.JPG | Wiki05 | CC0 | front close-up: windscreen frame and pillar, top lamp, emblem, lamp housings, buffers |

## Measurements (model metres)

- Heights from the head-on photo: skirt 0.86, buffers 1.03, cream line 1.13 - 1.17, lower lamps 1.59,
  waist 1.76, stripe 1.81 - 1.94, emblem 2.0 - 2.37, top lamp 2.66, windscreen 2.87 - 3.42, crown 3.81.
- Side (projective fit over the five bays): bays 1.74 m wide at a 1.88 m pitch, rows 2.02 - 2.53 and
  2.62 - 3.19; door 5.3 - 6.0; cab joint 6.4; cab window from 6.85 (long cab; 6.48 on the short one).

## Published figures

- Length over buffers 20.2 m (103 216 - 245; 19.5 m for 103 101 - 215), width 3.09 m, Co'Co', 1.25 m
  wheels, 114 t, 7,440 kW, 200 km/h; the class's Wikipedia article and the table in
  [germany-trains.md](../../docs/models/germany-trains.md) (`generator/openttdTable.ts`).
- Running numbers (all long-cab locomotives, check digits valid): TEE 103 245-7, orient red 103 228-3,
  traffic red 103 233-3.
