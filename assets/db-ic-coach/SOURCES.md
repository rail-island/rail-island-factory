# DB Intercity coach source references

**Covers** - provenance of the DB Intercity coach model (`proc-vehicle-db-ic-coach`): photographs of the Avmz 111/109 and the Bpmz in the three liveries, and the published figures.
**Code** - `generator/deIcCoach.ts` (registered in `generator/worldCoaches.ts`)
**See also** - [the reference](../../docs/models/germany-trains.md)

## Photographs

Downloaded from Wikimedia Commons at 1280 px wide (`pnpm refs:fetch`). The earlier lead image (an IC2 double-deck
train behind a class 146, which showed no IC coach) was removed. Each side was laid out with a 1-D projective fit
over its equal window pitch (`generator/deIcCoach.ts` header).

| file | original | URL | author | licence | use |
|---|---|---|---|---|---|
| `photo-ake-avmz-56-80-19-94-011-9-d-ake-domodossola-280316.jpg` | AKE Avmz 56 80 19-94 011-9 D-AKE Domodossola 280316.jpg | https://commons.wikimedia.org/wiki/File:AKE_Avmz_56_80_19-94_011-9_D-AKE_Domodossola_280316.jpg | NAC | CC BY-SA 4.0 | Avmz compartment side (nine 1.4 m windows, frosted toilet windows, door, class numeral), all heights (75 px/m), the TEE paint (beige to the eaves, purple red belly, beige line, black-grey skirt), the rounded roof ends |
| `photo-hkx-1804-avmz-harburg-16-07-13.jpg` | HKX 1804 - Avmz - Harburg 16-07-13.JPG | https://commons.wikimedia.org/wiki/File:HKX_1804_-_Avmz_-_Harburg_16-07-13.JPG | Steinfurth (Nordlicht8) | CC BY-SA 3.0 | Avmz corridor side (nine windows on a 2.2 m pitch, the 0.8 m vestibule windows, the top lights), the folding door with its window in the inner leaf |
| `photo-db-avmz109-5-61-80-19-91-508-0-berlinhbf-190313.jpg` | DB Avmz109-5 61 80 19-91 508-0 BerlinHbf 190313.jpg | https://commons.wikimedia.org/wiki/File:DB_Avmz109-5_61_80_19-91_508-0_BerlinHbf_190313.jpg | NAC | CC BY-SA 4.0 | Avmz in the Intercity livery: the red band and its DB logo gap under the class numeral, the end wall with the rubber gangway and tail lamps; the running number 61 80 19-91 508-0 |
| `photo-bpmz-stralsund-15062013.jpg` | Bpmz Stralsund 15062013.JPG | https://commons.wikimedia.org/wiki/File:Bpmz_Stralsund_15062013.JPG | Steinfurth (Nordlicht8) | CC BY-SA 3.0 | Bpmz layout (door, toilet window, numeral over the logo, a narrow window, nine 1.42 m windows on 1.81 m), the red band's height (1.55-1.77 m), the grey door foot and skirt |
| `photo-db-bpmz.jpg` | DB Bpmz.jpg | https://commons.wikimedia.org/wiki/File:DB_Bpmz.jpg | ArtVandelay13 | CC BY-SA 3.0 | Bpmz swing-plug door (open) and its window, the window count from the other end |
| `photo-intercity-ozeanblau-beige-jenbach-1979.jpg` | Intercity ozeanblau-beige Jenbach 1979.jpg | https://commons.wikimedia.org/wiki/File:Intercity_ozeanblau-beige_Jenbach_1979.jpg | Roger Wollstadt | CC BY-SA 2.0 | the ocean blue and ivory split (ivory from the belt to the eaves, blue below), the grey roof |

The Bpmz's number (61 80 22-91 101-9) is illustrative: no number is legible on the photographs; its check digit is valid.

## Published figures

- de.wikipedia, "Avmz 111" and "TEE/IC-Wagen (DB)": 26.4 m over the buffers, 2.825 m wide, nine compartments 2.322 m wide with
  1.4 m windows, 0.8 m vestibule windows, Minden-Deutz MD 36 bogies, 200 km/h, the liveries (TEE purple red RAL 3004 and
  beige RAL 1001, the roof white aluminium; Intercity light grey RAL 7035 with traffic red RAL 3020 since 2001), the folding
  and swing-plug doors, the rubber-roll gangways.
- en.wikipedia, [Intercity (Deutsche Bahn)](https://en.wikipedia.org/wiki/Intercity_(Deutsche_Bahn)): top speed and first year
  (`generator/openttdTable.ts`).
