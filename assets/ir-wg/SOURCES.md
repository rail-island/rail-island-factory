# IR WG source references

**Covers** - provenance of the IR WG model (`proc-vehicle-ir-wg`): four photographs and the published figures.
**Code** - `generator/inWg.ts`, `generator/worldSteamLocos.ts`
**See also** - [the reference](../../docs/models/india-trains.md)

## Photographs

Downloaded from Wikimedia Commons (`pnpm refs:fetch`), at most 1280 px on the long side.

| file | original | URL | author | licence | use |
|---|---|---|---|---|---|
| `photo-745-indiabareilly-19931227.jpg` | 745 IndiaBareilly 19931227.jpg | https://commons.wikimedia.org/wiki/File:745_IndiaBareilly_19931227.jpg | MaltaGC (Nigel Tout) | CC BY-SA 4.0 | 10491 (CLW 1966/7) front three-quarter: headlamp on its bracket at the smokebox top, flat round door and ring, front deck, buffer beam, grid cowcatcher, handrails; the running number |
| `photo-eth-bib-north-british-locomotive-company-glasgow-nbl-l978-in.jpg` | ETH-BIB North British Locomotive Company Glasgow (NBL) L978, Indian Government Railways, WG-class loco Ans 05373-3057-FL (cropped).tif | https://commons.wikimedia.org/wiki/File:ETH-BIB_North_British_Locomotive_Company_Glasgow_(NBL)_L978,_Indian_Government_Railways,_WG-class_loco_Ans_05373-3057-FL_(cropped).tif | Unknown photographer | Public domain | 8301 (NBL 1950) works side view, 51.6 px/m along (23.85 m over the buffers = 1231 px), about 52 px/m up (drivers 82 px): every axle, the smokebox, chimney, headlamp, dome casing, pop valves, running board and front deck, the cab and its chamfered side sheets, window and louvred shutter, the tender's cowl, louvres, stepped back and bogies |
| `photo-wg8082-with-barddhaman-passenger-train-at-kotshila-india-198.jpg` | WG8082 with Barddhaman passenger train at Kotshila, India, 1987 (15058051330).jpg | https://commons.wikimedia.org/wiki/File:WG8082_with_Barddhaman_passenger_train_at_Kotshila,_India,_1987_(15058051330).jpg | Wolfgang Gschnitzer | CC BY 2.0 | 8082 in service, side-on (about 46.7 px/m): white boiler bands, yellow lining on the cab and tender panels, the cab-side number plate, the tender's front cowl and coal pusher |
| `photo-747-indiabareilly-19931227.jpg` | 747 IndiaBareilly 19931227.jpg | https://commons.wikimedia.org/wiki/File:747_IndiaBareilly_19931227.jpg | MaltaGC (Nigel Tout) | CC BY-SA 4.0 | 10491 head-on (about 110 px/m at the buffers): smokebox front and headlamp, apron and marker lamps, red beam with the painted number, cowcatcher width |

## Published figures

- **Figures** - Wikipedia, [Indian locomotive class WG](https://en.wikipedia.org/wiki/Indian_locomotive_class_WG) and [IR-Klasse WG](https://de.wikipedia.org/wiki/IR-Klasse_WG): 2-8-2, 1,562 mm drivers, 23.85 m over the buffers (engine and tender), 21 7/8 x 28 in cylinders, tender 2'2' with 22.8 m3 of water and 18 t of coal; power, top speed and first year as the design states them (`generator/worldSteamLocos.ts`, `generator/openttdTable.ts`, [india-trains.md](../../docs/models/india-trains.md)). The German article's 1,092 mm carrying wheels are not borne out by the works photograph (both trucks' wheels 50 px against the drivers' 80, about 0.98 m), which the model follows.
