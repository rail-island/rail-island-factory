# Glacier Express coach source references

**Covers** - provenance of the Glacier Express coach model (`proc-vehicle-glacier-express`): photographs of the panorama coaches and the builder's figures.
**Code** - `generator/worldCoaches.ts`
**See also** - [the reference](../../docs/models/switzerland-trains.md)

## Photographs

Downloaded from Wikimedia Commons at 1280 px wide (`pnpm refs:fetch`): the images of the Glacier Express
articles (de, en, fr). They show the Stadler panorama coaches of 2006-2011 in the Glacier Express livery;
no running number is legible in them, so the model's `A 4021` / `B 4041` stand for an MGB first- and
second-class car without naming a photographed one.

| file | original | URL | author | licence | use |
|---|---|---|---|---|---|
| `photo-ch-landwasser-2.jpg` | CH Landwasser 2.jpg | https://commons.wikimedia.org/wiki/File:CH_Landwasser_2.jpg | Daniel Schwen | CC BY-SA 2.5 | three coaches from the side: the window band's six panes, the roof panes over them, the red ends, the white flags, the class digit, the door at one end only |
| `photo-glacier-express-in-swiss-alps-bound-for-zermatt.jpg` | Glacier Express in Swiss Alps bound for Zermatt.jpg | https://commons.wikimedia.org/wiki/File:Glacier_Express_in_Swiss_Alps_bound_for_Zermatt.jpg | Tim Adams | CC BY 3.0 | close three-quarter view: the glass running from the sill over the roof's curve, the slanted ends of the red zones and of the roof glass, the white door and its narrow window, the red lower band, the heights (sill 1.8 m, white from 1.2 m) |
| `photo-glacier-express-disentis-2021d.jpg` | Glacier Express Disentis 2021d.jpg | https://commons.wikimedia.org/wiki/File:Glacier_Express_Disentis_2021d.jpg | Whgler | CC BY-SA 4.0 | the train from the side and above: the glass band's length and place (3.7 m from the door end, 2.2 m from the other), the roof's white crown strip, the paint layout |
| `photo-1-klasse-glacier-express-panoramia-wagen-2014.jpg` | 1. Klasse Glacier-Express Panoramia-Wagen (2014).jpg | https://commons.wikimedia.org/wiki/File:1._Klasse_Glacier-Express_Panoramia-Wagen_(2014).jpg | JoachimKohler-HB | CC BY-SA 4.0 | the first-class car inside: the side glass and the roof glass as two panes per bay, the rail between them, the pillars, the opaque ceiling strip (about a third of the width) |

## Published figures

- **Builder's datasheet** - Stadler, *Glacier Express panorama carriages* (WGEX0123e, 2023),
  https://stadlerrail.com/api/docs/x/a09db4186b/wgex0123e-datasheet.pdf: length over buffers 18,500 mm,
  body 17,700 mm, height 3,695 mm, width 2,680 mm, bogie pivots 12,830 mm, bogie wheelbase 1,800 mm,
  wheels 685 mm, floor 950 mm, entrance 850 mm, 100 km/h. The model's body, crown, width, pivots,
  wheels and entrance follow it (`generator/worldCoaches.ts`); not stored here (all rights reserved).
- **Figures** - Wikipedia, [Glacier Express](https://en.wikipedia.org/wiki/Glacier_Express): first year and
  the seating as the design states them (`generator/openttdTable.ts`, [switzerland-trains.md](../../docs/models/switzerland-trains.md)).
