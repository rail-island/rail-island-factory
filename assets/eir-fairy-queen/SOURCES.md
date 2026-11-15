# Fairy Queen source references

**Covers** - provenance of the Fairy Queen model (`proc-vehicle-eir-fairy-queen`): three photographs of East Indian Railway No. 22 and the published figures.
**Code** - `generator/inFairyQueen.ts`, `generator/worldSteamLocos.ts`
**See also** - [the reference](../../docs/models/india-trains.md)

## Photographs

Downloaded from Wikimedia Commons at 1280 px wide (`pnpm refs:fetch`). All three show the one engine,
EIR No. 22, at the National Rail Museum, New Delhi. No free side-on photograph exists on Commons
(the class's article and its category hold these three and a builder's plate), so lengths come from
the published figures and the proportions from the three-quarter views.

| file | original | URL | author | licence | use |
|---|---|---|---|---|---|
| `photo-the-queen-in-a-somewhat-dilapidated-condition-ne.jpg` | The Queen in a somewhat dilapidated condition. Nevertheless, my tenth visit was of worth^^ - Flickr - Dr. Santulan Mahanta (cropped).jpg | https://commons.wikimedia.org/wiki/File:The_Queen_in_a_somewhat_dilapidated_condition._Nevertheless,_my_tenth_visit_was_of_worth%5E%5E_-_Flickr_-_Dr._Santulan_Mahanta_(cropped).jpg | Santulan Mahanta | CC BY 2.0 | right front three-quarter, out of steam: outside plate frames with arches and horn guides, the low footboard, the cylinder casings and covers, the bar guard, the splasher, canopy and cab sides, heights scaled from the buffer centres (1.09 m) |
| `photo-fairy-queen-engine.jpg` | Fairy Queen Engine.jpg | https://commons.wikimedia.org/wiki/File:Fairy_Queen_Engine.jpg | Ramesh lalwani | CC BY-SA 4.0 | left front three-quarter in the running livery: green casing and splasher with FAIRY QUEEN, black boiler with brass bands, copper dome and chimney top, blue bases, canopy with gold stars, yellow pillars, red beam; chimney height (1.32 smokebox diameters above it) |
| `photo-fairy-queen-in-hdr.jpg` | Fairy Queen in HDR.jpg | https://commons.wikimedia.org/wiki/File:Fairy_Queen_in_HDR.jpg | Dipsbarua | CC BY-SA 4.0 | head-on: the buffer beam lettered EIR 22, buffers and guard, the smokebox door, cylinder covers beside it, the headlamp before the chimney (about 289 px/m at the beam, buffer centres taken as 1.956 m apart) |

## Published figures

- **Figures** - Wikipedia, [Fairy Queen (locomotive)](https://en.wikipedia.org/wiki/Fairy_Queen_(locomotive)): 2-2-2WT (well tank) built 1855 by Kitson, Thompson and Hewitson (works no. 481), 5 ft 6 in gauge, 6 ft (1,829 mm) driving wheel, two outside cylinders 12 in x 22 in, 26 t, tender 2 t and 3,000 l, 130 hp, 40 km/h (`generator/inFairyQueen.ts`, `generator/worldSteamLocos.ts`, `generator/openttdTable.ts`, [india-trains.md](../../docs/models/india-trains.md)).
- **Estimated** - the carrying wheels (3 ft 6 in), the wheelbase (4.3 m), the length over buffers (7.7 m), the boiler (1.0 m barrel pitched at 1.95 m) and the small four-wheeled tender are not published; they are scaled from the photographs.
