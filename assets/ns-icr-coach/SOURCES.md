# NS ICR coach source references

**Covers** - provenance of the NS ICR coach model (`proc-vehicle-ns-icr-coach`): the photographs it was laid out from and the published figures.
**Code** - `generator/nlIcrCoach.ts`
**See also** - [the reference](../../docs/models/netherlands-trains.md)

## Photographs

Downloaded from Wikimedia Commons (`pnpm refs:fetch`), from the Dutch article Intercityrijtuig and the German article NS-Baureihe 1700.
The side measurements are 1-D projective fits over each photograph's ten equal windows, scaled to the 25.1 m body
(`generator/nlIcrCoach.ts` states the figures).

| file | original | URL | author | licence | use |
|---|---|---|---|---|---|
| `photo-icr-2e-klasse-amsterdam-2017.jpg` | ICR 2e klasse Amsterdam 2017.jpg | https://commons.wikimedia.org/wiki/File:ICR_2e_klasse_Amsterdam_2017.jpg | TGr_79 | CC BY-SA 2.0 | ICRm B 61 84 20-70 208-5 (Bpmez10), side: the window and door layout, the heights, the yellowBlue paint, the class numerals, the NS logo and the class ring, the roof intake, the bogie |
| `photo-ns-intercityrijtuig-intercity-plus-1e-klasse.jpg` | NS Intercityrijtuig Intercity Plus 1e klasse.jpg | https://commons.wikimedia.org/wiki/File:NS_Intercityrijtuig_Intercity_Plus_1e_klasse.jpg | TGr_79 | CC BY 2.0 | an A before the refurbishment (Intercity Plus paint, not modelled), side: the first class's layout (the same shell as the B), every window with its top light, the toilet window |
| `photo-ns-1771-met-intercityrijtuig.jpg` | NS 1771 met intercityrijtuig.jpg | https://commons.wikimedia.org/wiki/File:NS_1771_met_intercityrijtuig.jpg | TahR78 at Dutch Wikipedia | CC BY-SA 3.0 | ICRm B behind 1771, three-quarter close-up of the toilet end: the narrow door, its two leaf windows, the toilet window, the end wall's paint |
| `photo-icrm-diepenveen.jpg` | ICRM Diepenveen.JPG | https://commons.wikimedia.org/wiki/File:ICRM_Diepenveen.JPG | Martijnvanvulpen | CC BY-SA 3.0 | an ICRm train led by a Bs driving trailer (not modelled), three-quarter: the roof's profile and the band's run along a train |
| `photo-icr-50-8420-70-581-8.jpg` | ICR 50 8420-70 581-8.jpg | https://commons.wikimedia.org/wiki/File:ICR_50_8420-70_581-8.jpg | Erik Baas | CC BY-SA 3.0 | ICR B 50 84 20-70 581-8 in NS International paint (not modelled): the toilet end's door, the roof's end |

## Published figures

- **Figures** - Wikipedia, [Intercityrijtuig](https://nl.wikipedia.org/wiki/Intercityrijtuig): 26.4 m, Y32 bogies, 160 km/h, built by Talbot from 1980; the usual blue band round the windows (the Benelux coaches had it in bordeaux red); the ICRm refurbishment (2000-06) with air conditioning and a slightly changed scheme (`generator/nlIcrCoach.ts`, `generator/openttdTable.ts`, [netherlands-trains.md](../../docs/models/netherlands-trains.md)).
- **The delivered paint** - no free photograph of an ICR before 2000 in NS yellow was found; `yellowGrey` follows the article (the blue band round the windows) with a dark grey foot line, and keeps the fold-down top lights the Intercity Plus photograph shows.
