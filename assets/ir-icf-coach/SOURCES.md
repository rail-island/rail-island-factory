# ir-icf-coach references

**Covers** - provenance of the IR ICF coach model (`proc-vehicle-ir-icf-coach`): photographs and the published figures.
**Code** - `generator/inIcfCoach.ts`, `generator/worldCoaches.ts`
**See also** - [docs/models/india-trains.md](../../docs/models/india-trains.md), [docs/models/world-fleet.md](../../docs/models/world-fleet.md)

## Photographs

Downloaded from Wikimedia Commons by `pnpm refs:fetch` as standard thumbnails, at most 1280 px on the long side.
Running numbers legible: NR 05281/C (sleeper, `...-03`), NR 014133 (maroon). The model's numbers
(`NR 05281`, `WR 04555`) are drawn after them.

| file | original | URL | author | licence | use |
|---|---|---|---|---|---|
| `photo-22945-saurashtra-mail-sleeper-class-coach.jpg` | 22945 Saurashtra Mail - Sleeper Class coach.jpg | https://commons.wikimedia.org/wiki/File:22945_Saurashtra_Mail_-_Sleeper_Class_coach.jpg | Superfast1111 | CC BY-SA 4.0 | sleeper side close to square-on, about 200 px/m from the 0.91 m window pitch: window 0.63-0.66 m by 0.6 m, pale band 0.81 m deep with its foot 0.15 m under the sills, five bars, louvred shutters, route boards; the blue colours |
| `photo-blue-colored-icf-rail-coaches-in-india-03.jpg` | Blue colored ICF Rail Coaches in India 03.jpg | https://commons.wikimedia.org/wiki/File:Blue_colored_ICF_Rail_Coaches_in_India_03.jpg | Ravi Dwivedi | CC BY-SA 4.0 | sleeper NR 05281/C, whole side fitted projectively on its 18 windows (berth numbers every two windows, 9 bays of 8): 0.91 m pitch, first window centred 2.93 m from the end, toilet window 0.14-0.86 m, door 1.4-2.4 m (with its frame); band heights as fractions of the side; roof hatch over the door, yellow end stripe, steps, underframe box |
| `photo-blue-colored-icf-rail-coaches-in-india-01.jpg` | Blue colored ICF Rail Coaches in India 01.jpg | https://commons.wikimedia.org/wiki/File:Blue_colored_ICF_Rail_Coaches_in_India_01.jpg | Ravi Dwivedi | CC BY-SA 4.0 | two sleeper ends: door with the pale band and its louvred window, grab rails, three hanging steps, toilet window, yellow corner stripe, gangway, roof end and hatch, coil bogie |
| `photo-kanchan-kanya-express-sleeper-class-coach.jpg` | Kanchan Kanya Express Sleeper Class Coach.jpg | https://commons.wikimedia.org/wiki/File:Kanchan_Kanya_Express_Sleeper_Class_Coach.jpg | AwanGaz | CC BY-SA 4.0 | the window count along a whole sleeper side (18 between the doors), open windows with bars, grab rail, number and class panel |
| `photo-11023-sahyadri-express-general-coach.jpg` | 11023 Sahyadri Express - General coach.jpg | https://commons.wikimedia.org/wiki/File:11023_Sahyadri_Express_-_General_coach.jpg | Superfast1111 | CC BY-SA 3.0 | general (unreserved) coach side: the same window pitch and width (0.65 of the pitch), open windows with the shutter stowed in the head, more bars, route board, IR roundel on the lower body |
| `photo-red-colored-icf-coaches-of-indian-railways-in-delhi.jpg` | Red Colored ICF coaches of Indian Railways in Delhi.jpg | https://commons.wikimedia.org/wiki/File:Red_Colored_ICF_coaches_of_Indian_Railways_in_Delhi.jpg | Ravi Dwivedi | CC BY-SA 4.0 | the maroon livery (about #8a2329 in sun), silver roof, aluminium shutters, the number NR 014133 in cream, battery boxes, coil bogie |

## Published figures

- **Figures** - Wikipedia, [Integral Coach Factory](https://en.wikipedia.org/wiki/Integral_Coach_Factory) and the ICF coach
  data published by Indian Railways: body 21.337 m, about 22.3 m over buffers, width 3.25 m, height 4.025 m, bogie
  centres 14.783 m, ICF all-coil bogie with 2.896 m wheelbase and 915 mm wheels; top speed and first year as the design
  states them (`generator/worldCoaches.ts`, `generator/openttdTable.ts`, [india-trains.md](../../docs/models/india-trains.md)).
