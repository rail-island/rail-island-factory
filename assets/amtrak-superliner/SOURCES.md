# Amtrak Superliner source references

**Covers** - provenance of the Amtrak Superliner model (`proc-vehicle-amtrak-superliner`): the user's reference, photographs, the measurements taken from them and published dimensions.
**Code** - `generator/usCarbodies.ts`
**See also** - [the reference](../../docs/models/us-carbodies.md)

## The user's reference

| file | origin | use |
|---|---|---|
| `user-screenshot-superliner.png` | a phone screenshot of an image search (US Train Travel Guide, Fox News, Seat 61 results) sent by the user in the chat, 5 November 2026; the photographs' own licences are not stated | reference only: the Phase IV stripes (two red lines over the blue band under the upper windows, a red line low), the fluted lower body, the window rows of both decks, the door, the low floor's skirt between the trucks |

## Photographs

Downloaded from Wikimedia Commons (`pnpm refs:fetch`), scaled to 1600 px or less on the long side.

| file | original | URL | author | licence | use |
|---|---|---|---|---|---|
| `photo-amtk-34515.jpg` | AMTK 34515.jpg | https://commons.wikimedia.org/wiki/File:AMTK_34515.jpg | Wheresmything | CC BY-SA 4.0 | the coach's right side, nearly side-on (Phase IVb): the main measured view - window rows, door, grille, lockers, stripes, the low floor; the running number 34515 |
| `photo-superliner-48142611.jpg` | Superliner (48142611).jpg | https://commons.wikimedia.org/wiki/File:Superliner_(48142611).jpg | Mike Knell from Zurich, Switzerland | CC BY-SA 2.0 | a sleeper's right side, nearly side-on (Phase IV): the sleeper's roomette, stairwell and bedroom windows, the lower deck, door and grille |
| `photo-amtrak-34122-at-sanford.jpg` | Amtrak 34122 at Sanford.jpg | https://commons.wikimedia.org/wiki/File:Amtrak_34122_at_Sanford.jpg | WillMcC | CC BY-SA 4.0 | the end of coach 34122: the roof's section and corners, the diaphragm's face plate with the end door's window, collision posts, red markers, end sill |
| `photo-superliner-sleepers-on-the-california-zephyr-june-2022-sarah.jpg` | Superliner sleepers on the California Zephyr - June 2022 - Sarah Stierch.jpg | https://commons.wikimedia.org/wiki/File:Superliner_sleepers_on_the_California_Zephyr_-_June_2022_-_Sarah_Stierch.jpg | Missvain | CC BY 4.0 | the ends of sleepers 32112 and 32038 close up: the stripes' widths, "Superliner" in the band, the numbers, the big and the narrow louvre, lockers, the corner steps; the running number 32038 |
| `photo-amtk-32058-4594330230.jpg` | AMTK 32058 (4594330230).jpg | https://commons.wikimedia.org/wiki/File:AMTK_32058_(4594330230).jpg | vxla from Chicago, US | CC BY 2.0 | a sleeper's end: the narrow vertical louvre and lockers on the other side |
| `photo-southbound-coast-starlight-at-salinas-station-october-2021.jpg` | Southbound Coast Starlight at Salinas station, October 2021.jpg | https://commons.wikimedia.org/wiki/File:Southbound_Coast_Starlight_at_Salinas_station,_October_2021.jpg | Pi.1415926535 | CC BY-SA 4.0 | sleeper 32011 at a grazing angle: confirms the sleeper's window groups |
| `photo-superliner-coach-on-capitol-corridor-train-at-davis-november.jpg` | Superliner coach on Capitol Corridor train at Davis, November 2017.JPG | https://commons.wikimedia.org/wiki/File:Superliner_coach_on_Capitol_Corridor_train_at_Davis,_November_2017.JPG | Pi.1415926535 | CC BY-SA 3.0 | shape only (Capitol Corridor paint): the low floor between the trucks, the raised ends, the end grille |
| `photo-auto-train-platform.jpg` | Auto Train Platform.jpg | https://commons.wikimedia.org/wiki/File:Auto_Train_Platform.jpg | Rails at English Wikipedia | CC BY-SA 3.0 | the car ends between coupled cars: the diaphragms at the upper deck, the end grille |
| `photo-superliner-33035.jpg` | An Amtrak Superliner 33035 at Portland Union Station.jpg | https://commons.wikimedia.org/wiki/File:An_Amtrak_Superliner_33035_at_Portland_Union_Station.jpg | Bobjgalindo | CC BY-SA 4.0 | the train behind the locomotive: the bi-level body |
| `photo-superliner-empire-builder.jpg` | Amtrak Empire Builder at Portland Union Station.jpg | https://commons.wikimedia.org/wiki/File:Amtrak_Empire_Builder_at_Portland_Union_Station.jpg | Bobjgalindo | CC BY-SA 4.0 | the train behind the locomotive: the bi-level body |

## Measurements

- **Coach 34515** - a projective fit along the side (x = (a u + b) / (c u + 1)) over the body's
  ends (u = -12.6, +12.6 m) and the truck centres (+-9.07 m); the vertical scale at the door about
  75 px/m. Upper windows 11, about 1.62 m wide at a 1.97 m pitch, 3.36 - 4.13 m high; lower windows
  1.08 - 1.80 m: a narrow one and two pairs under the 3rd to 5th upper window; the door 2.1 m past
  the second pair (1.2 m frame, narrow window 1.25 - 2.1 m); the grille u 9.8 - 11.5; the low floor's
  skirt u -7.8 to 6.6, down to about 0.25 m; over the trucks the body ends at about 0.88 m. Stripes:
  red line 0.96 - 1.0 m; blue band 2.40 - 2.60 m, red pinstripes 2.64 - 2.675 and 2.71 - 2.745 m (their
  widths in proportion from the 32112 close-up).
- **Sleeper (48142611)** - the same fit: five roomette windows (1.42 m, 1.8 m pitch, centred u -6.9),
  the stairwell's narrow window (u -1.25 to -0.5), five bedroom windows (1.66 m, 2.22 m pitch,
  centred u 5.19); lower: narrow window and two pairs under the 3rd to 5th roomette, the door
  u -0.15 to 0.95, a small window u 4.17 - 4.94, the grille u 9.6 - 11.35. The perspective leaves about
  +-0.3 m along the car.
- **End (34122)** - about 104 px/m: the face plate 1.36 m wide from 2.45 m to the roof, its window
  0.44 x 0.52 m; the roof's corners about 0.4 m round on a nearly flat crown; markers about 3.4 m up.
- Not photographed here: the left sides. Their windows are drawn at the right side's places (seats or
  rooms on both sides of the aisle); the sleeper's corridor beside the bedrooms has narrower
  windows (assumed), the ends a narrow louvre and lockers (32038, 32058).

## Published figures

- **Dimensions** - Wikipedia "Superliner (railcar)": 85 ft 0 in long, 16 ft 2 in high, 10 ft 2 in wide, about 165,000 lb; built from 1979 (Superliner I) and 1993 (II); a coach seats 74, a sleeper holds 44.
- **Paint** - Phase IVb: stainless steel, a red line under the lower windows, two red pinstripes over the blue band under the upper windows, "Superliner" in white in the band and the number over it near the right-hand end, the Amtrak travel mark beside the door. Running numbers 34515 (coach) and 32038 (sleeper) from the photographs.
