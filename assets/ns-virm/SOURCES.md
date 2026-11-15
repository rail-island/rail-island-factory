# NS VIRM source references

**Covers** - provenance of the NS VIRM model (`proc-vehicle-ns-virm`): photographs, NS's side drawings of the cars and the published figures.
**Code** - `generator/nlVirm.ts` (the registry row in `generator/nlUnits.ts`)
**See also** - [the reference](../../docs/models/netherlands-trains.md)

## Photographs

Downloaded from Wikimedia Commons (the class's Wikipedia articles, nl "VIRM" and en "NS VIRM").

| file | original | URL | author | licence | use |
|---|---|---|---|---|---|
| `photo-horst-sevenum-irm-9585-ic-13553-venlo-3252409394.jpg` | Horst-Sevenum IRM 9585 IC 13553 Venlo (32524093940) (2).jpg | https://commons.wikimedia.org/wiki/File:Horst-Sevenum_IRM_9585_IC_13553_Venlo_(32524093940)_(2).jpg | Rob Dammers | CC BY 2.0 | unit 9585 (six cars), original livery: the three-quarter view, the end sections' door and windows, the roof well with the raised single-arm pantograph over an intermediate car's end section, the upper band's sweep down to the first door |
| `photo-virm-9553-eindhoven.jpg` | VIRM 9553 Eindhoven.jpg | https://commons.wikimedia.org/wiki/File:VIRM_9553_Eindhoven.jpg | Mauritsvink | Public domain | unit 9553, nearly head on (178 px/m across the face): the hood's lower edge (1.89 m in the middle), the windscreen 2.56 - 3.49 m in its black frame, the round headlight and the slots, the four lamps at 1.75 m, the coupler's recess 1.45 m wide, 0.52 - 1.43 m |
| `photo-virm-8632.jpg` | VIRM 8632.jpg | https://commons.wikimedia.org/wiki/File:VIRM_8632.jpg | Jeroen74 | CC BY-SA 3.0 | unit 8632 (four cars, the default livery's running number), front three-quarter: the face's plan and the hood's corners |
| `photo-virm-culemborg.jpg` | VIRM Culemborg.jpg | https://commons.wikimedia.org/wiki/File:VIRM_Culemborg.jpg | User:Willem_90 | Public domain | a four-car unit (9412 on the second car) side on: the formation, the roof wells at the cars' ends, one raised pantograph on the second car, the window bands on every car (fitted to the published car lengths by a projective map) |
| `photo-ns-virm-m-treinen-in-verschillende-uitvoeringen.jpg` | NS VIRM(m) treinen in verschillende uitvoeringen.jpg | https://commons.wikimedia.org/wiki/File:NS_VIRM(m)_treinen_in_verschillende_uitvoeringen.jpg | Koplopermau | CC BY-SA 4.0 | the original VIRM and the refurbished VIRMm (9404, the `yellowGrey` key's running number) side by side: the VIRMm's stepped band, the upper band round its windows, the blue door frames |

## Drawings (measured, not stored)

- **NS, poster "Intercity (VIRM)"** - https://www.ns.nl/binaries/_ht_1533730718741/content/assets/ns-nl/overig/posters/poster-intercity-virm.pdf
  (linked from nl.wikipedia; NS's own material, not freely licensed, so not copied here). Its strip of side
  drawings of the cars (one per car type, 20.85 px/m, the end car mBvk 570 px over 27.28 m and 4.67 m high)
  gave the end car's profile (the face's centre line, the hood's edge on the cab side, the upper band's
  sweep), every window and door along the end car and the first-class pantograph car, the heights of the
  three window rows and the three blue bands, the roof wells (4.27 m, the side's top 3.68 m) and the bogie
  positions (3.33 m behind the tip, 20.1 m apart on the end car; 3.6 m from the ends on an intermediate car).

## Published figures

- **nl.wikipedia, [VIRM](https://nl.wikipedia.org/wiki/VIRM)** - car lengths (mBvk 27.28 m, ABv 26.50 / 27.50 m,
  mBv 27.00 m; VIRM-IV 108.56 m, VIRM-VI 162.06 m), width 3.02 m, height 4.67 m, floor heights (0.356 m,
  1.163 m, 2.444 m), door width 1.30 m, wheels 920 mm, formations, 1,608 / 2,412 kW, 234 / 349 t, 160 km/h.
- **Wikipedia, [NS VIRM](https://en.wikipedia.org/wiki/NS_VIRM)** - first year and service figures as the design states them (`generator/openttdTable.ts`, [netherlands-trains.md](../../docs/models/netherlands-trains.md)).
