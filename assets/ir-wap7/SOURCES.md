# ir-wap7 references

**Covers** - provenance of the `ir-wap7` model's references: photographs and published figures.
**Code** - `generator/inWap7.ts` (the design `proc-vehicle-ir-wap7` in `generator/inLocos.ts` names `references: "ir-wap7"`)
**See also** - [docs/models/india-trains.md](../../docs/models/india-trains.md), [docs/models/world-fleet.md](../../docs/models/world-fleet.md)

## Photographs

Downloaded from Wikimedia Commons by `pnpm refs:fetch` as standard thumbnails, at most 1280 px on the long side.

| file | original | URL | author | licence | running number | use |
|---|---|---|---|---|---|---|
| `photo-a-valsad-els-based-wap-7-locomotive-of-the-indian-railways-a.jpg` | A Valsad ELS-based WAP-7 locomotive of the Indian Railways at Delhi Sarai Rohilla railway station (No. 30770).jpg | https://commons.wikimedia.org/wiki/File:A_Valsad_ELS-based_WAP-7_locomotive_of_the_Indian_Railways_at_Delhi_Sarai_Rohilla_railway_station_(No._30770).jpg | Kool Nerd 123 | CC BY-SA 4.0 | 30770 | the side, nearly broadside: positions of the cab windows, doors, louvre panels, bogies and pantographs (1-D projective fit, see Measurements) |
| `photo-charminar-wap7.jpg` | Charminar WAP7.JPG | https://commons.wikimedia.org/wiki/File:Charminar_WAP7.JPG | VtTN | CC BY-SA 3.0 | 30262 | the face head-on: windscreens, stripe, lamps, face foot, hip (about 166 px/m across the 3.15 m face) |
| `photo-sdah-based-wap-7-39207-pulling-13147-sealdahbamanhat-uttar-b.jpg` | SDAH based WAP-7 39207 pulling 13147 Sealdah–Bamanhat Uttar Banga Express 05.jpg | https://commons.wikimedia.org/wiki/File:SDAH_based_WAP-7_39207_pulling_13147_Sealdah%E2%80%93Bamanhat_Uttar_Banga_Express_05.jpg | Kingshuk Mondal | CC BY 4.0 | 39207 | front: stone guards, lamp handrail, headlight pod and horns on the cab roof |
| `photo-bza-wap7.jpg` | BZA WAP7.jpg | https://commons.wikimedia.org/wiki/File:BZA_WAP7.jpg | Raju2789 | CC0 | 39342 | front three-quarter: grey skirt band, stripe height on side and face, marker lamps |
| `photo-indian-electric-locomotive-wap-7-ed-39231.jpg` | Indian Electric Locomotive WAP-7 ED - 39231.jpg | https://commons.wikimedia.org/wiki/File:Indian_Electric_Locomotive_WAP-7_ED_-_39231.jpg | Sameer2905 | CC BY-SA 4.0 | 39231 | front three-quarter of the white/red livery: the louvre pairs behind the cab, colours |
| `photo-side-view-of-a-wap-7-class-locomotive-of-indian-railways.jpg` | Side view of a WAP 7 class Locomotive of Indian Railways.jpg | https://commons.wikimedia.org/wiki/File:Side_view_of_a_WAP_7_class_Locomotive_of_Indian_Railways.jpg | Adityamadhav83 | CC BY-SA 3.0 | - | the cab end from the side: face rake, hipped cab roof, cab window, door, large four-pane louvre |
| `photo-wag9hc-42630.jpg` | WAG9HC 42630.jpg | https://commons.wikimedia.org/wiki/File:WAG9HC_42630.jpg | Raju2789 | CC0 | 42630 (WAG-9HC) | the shared body's cab from the front three-quarter: the hip and its sloped sides (sister class, green livery not modelled) |
| `photo-wag-9-locomotive-at-vangaon-railway-station.jpg` | Wag-9 Locomotive at Vangaon Railway station.jpg | https://commons.wikimedia.org/wiki/File:Wag-9_Locomotive_at_Vangaon_Railway_station.jpg | Historical Trains | CC0 | 33091 (WAG-9HC) | the WAG-9's side: same body and stripe layout (green and yellow scheme, not modelled) |

## Published figures

Length over buffers 20.562 m, width 3.152 m, height about 4.26 m (pantographs down), wheels 1,092 mm,
Co-Co, 6,350 hp (4,500 kW at the wheel) (Wikipedia, "Indian locomotive class WAP-7" and "Indian locomotive
class WAG-9").

## Measurements

- Valsad photo (30770): the body's side height is 140 px at the left end and 113 px at the right,
  so the image's x is affine in the local height scale; X(u) = L (1/p(u) - 1/140) / (1/113 - 1/140)
  with L = 19.3 m body length at the sill. Gives: cab window 0.6 - 1.3 m behind the body's end,
  door 1.45 - 2.15 m, louvre pairs 3.05 - 4.46 m (upper y 3.03 - 3.62, lower 1.95 - 2.70 across
  the stripe), narrow louvre 7.24 - 7.89 m, large four-pane louvre 3.8 - 5.2 m behind the other
  end (moved to 3.6 - 5.0 from the cab-side photo), pantograph bases centred about 4.7 - 5.0 m from
  the middle, bogie centres about 11.5 m apart (axle spans 3.4 - 3.6 m).
- Charminar photo (30262), 166 px/m head-on, buffers at 1.105 m: face foot 1.71 m, stripe
  2.25 - 2.51 m, windscreens 1.16 m wide, 0.87 m high (2.84 - 3.71 m), centre pillar 0.19 m,
  twin headlamp 0.54 x 0.33 m on the stripe, marker housings 0.24 x 0.41 m at the stripe's ends,
  roof about 4.25 m.
- Cab-side photo: the face leans about 0.4 m back from the skirt to the windscreens' head; the
  hipped cab roof drops about 0.25 m over about 1 m.
