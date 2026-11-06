# SBB IC 2000 coach source references

**Covers** - provenance of the SBB IC 2000 coach model (`proc-vehicle-sbb-ic2000`): four photographs and the published figures.
**Code** - `generator/worldCoaches.ts`
**See also** - [the reference](../../docs/models/switzerland-trains.md)

## Photographs

Downloaded from Wikimedia Commons (`pnpm refs:fetch`), the files the de.wikipedia article "IC2000" shows.

| file | original | URL | author | licence | use |
|---|---|---|---|---|---|
| `photo-ic2000-z-rich-luzern.jpg` | IC2000 Zürich - Luzern.jpg | https://commons.wikimedia.org/wiki/File:IC2000_Z%C3%BCrich_-_Luzern.jpg | Kabelleger / David Gubler (http://www.bahnbilder.ch) | Public domain | three-quarter view from above: the stepped bottom of the end sections, the coral door strips and the three roof dashes over each door, the stair slits, the gangway seal round the end's outline, the window rows |
| `photo-ic-2000-zehn-wagen-cropped-20080330y222a.jpg` | IC 2000 (zehn Wagen), cropped, 20080330Y222a.jpg | https://commons.wikimedia.org/wiki/File:IC_2000_(zehn_Wagen),_cropped,_20080330Y222a.jpg | Markus Giger | CC BY-SA 2.5 ch | side view of a ten-car train: door positions at both ends of each car, the end sections' windows |
| `photo-ic-bei-siegershausen.jpg` | IC bei Siegershausen.jpg | https://commons.wikimedia.org/wiki/File:IC_bei_Siegershausen.jpg | Plutowiki | CC0 | the near side-on view measured at true scale (one A car, coupling plane to coupling plane): door strips 7.0 m from the coupling planes and 1.7 m wide, three upper windows over each end section and five between the doors on a 2.0 m pitch, the band heights, the first class car's yellow line across the door strips |
| `photo-familienwagen-ic-2000-bt5085-26-94-925-2-april2013.jpg` | Familienwagen IC 2000 Bt5085 26-94 925-2 April2013.jpg | https://commons.wikimedia.org/wiki/File:Familienwagen_IC_2000_Bt5085_26-94_925-2_April2013.jpg | Markus Giger | CC BY-SA 4.0 | the close side view (Bt 50 85 26-94 925-2): heights at 115 px/m of the paint edges, the windows of both decks and the blue class strip with its numerals; the lettering of 26.80 m over the buffers and 20.00 m between the bogie centres; the running number's place on the lower body |

## Running numbers

The model's cars carry illustrative numbers in the real series with valid UIC check digits: the
first class car `50 85 16-94 073-3` (the A car 16-94 073 the article names as rebuilt to an AS),
the second class car `50 85 26-94 101-0`. The photographed Bt is 50 85 26-94 925-2.

## Published figures

- **Figures** - Wikipedia, [IC 2000](https://en.wikipedia.org/wiki/IC_2000) and de.wikipedia
  [IC2000](https://de.wikipedia.org/wiki/IC2000): length, top speed and first year as the design
  states them; the window counts (A 13 upper a side, B 14 upper and 5 lower), the gangways in the
  upper deck, the equipment over the bogies and the entrances in the lower deck
  (`generator/worldCoaches.ts`, `generator/openttdTable.ts`,
  [switzerland-trains.md](../../docs/models/switzerland-trains.md)).
