# SBB Giruno source references

**Covers** - provenance of the SBB Giruno model (`proc-vehicle-sbb-giruno`): photographs and the published figures.
**Code** - `generator/chUnits.ts` (`GIRUNO`, `GIRUNO_FACE`, `GIRUNO_SBB`)
**See also** - [the reference](../../docs/models/switzerland-trains.md)

## Photographs

Downloaded from Wikimedia Commons (the first at 1280 px wide, the others by `pnpm refs:fetch` as standard thumbnails).
The model carries the running number 501 029, the unit in the Zurich photograph.

| file | original | URL | author | licence | use |
|---|---|---|---|---|---|
| `photo-ec250-giruno-on-test-run.jpg` | EC250 "Giruno" on test run.jpg | https://commons.wikimedia.org/wiki/File:EC250_%22Giruno%22_on_test_run.jpg | Daniel Wipf | CC BY-SA 4.0 | three-quarter view: the nose's red, black field and windscreen, the lamps, the shoulder stripe, the bogies |
| `photo-ec250-giruno-close-to-erlen.jpg` | EC250 "Giruno" close to Erlen.jpg | https://commons.wikimedia.org/wiki/File:EC250_%22Giruno%22_close_to_Erlen.jpg | Daniel Wipf | CC BY-SA 4.0 | the near side view: the nose's profile and its paint edges, the cab window and door, the window band, doors and bogies along the car (perspective undone with the cars' 22.25 m and 17.5 m) |
| `photo-sbb-rabde-501-029-in-zurich-hb-2022.jpg` | SBB RABDe 501 029 in Zürich HB (2022).jpg | https://commons.wikimedia.org/wiki/File:SBB_RABDe_501_029_in_Z%C3%BCrich_HB_(2022).jpg | JoachimKohler-HB | CC BY-SA 4.0 | front three-quarter view: the face, muzzle, lamp housings, grille, emblem and wipers; the running number |
| `photo-stadler-ec250-innotrans-2016-3.jpg` | Stadler EC250 - innoTrans 2016 (3).jpg | https://commons.wikimedia.org/wiki/File:Stadler_EC250_-_innoTrans_2016_(3).jpg | ubahnverleih | CC0 | front view: the plan's bow, the white chin under the red muzzle, the windscreen's shape and its black field |
| `photo-sbb-rabe501.jpg` | SBB RABe501.jpg | https://commons.wikimedia.org/wiki/File:SBB_RABe501.jpg | Silesia711 | CC BY-SA 4.0 | the train: end and intermediate cars, the doors, the red stripe along every car, the dark roof |
| `photo-sbb-giruno-by-stadler-47824067432.jpg` | SBB Giruno by Stadler (47824067432).jpg | https://commons.wikimedia.org/wiki/File:SBB_Giruno_by_Stadler_(47824067432).jpg | Kecko from Rural area of Eastern Switzerland | CC BY 2.0 | a door close up: the red leaf and its window |

## Published figures

- **Figures** - Wikipedia, [Stadler SMILE](https://en.wikipedia.org/wiki/Stadler_SMILE): power, top speed and first year as the design states them (`generator/chUnits.ts`, `generator/openttdTable.ts`, [switzerland-trains.md](../../docs/models/switzerland-trains.md)).
- **Dimensions** - de.wikipedia, [SBB RABe 501](https://de.wikipedia.org/wiki/SBB_RABe_501): 202 m over 11 cars, end cars 22.25 m and intermediate cars 17.5 m (the formation table), height 4,255 mm, width 2,900 mm, Jacobs bogies between the cars and a leading bogie under each cab end (wheelbase 2,750 / 2,700 mm), wheels 920 mm.
