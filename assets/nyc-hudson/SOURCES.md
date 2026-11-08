# NYC J-3a Hudson source references

**Covers** - provenance of the NYC J-3a Hudson model (`proc-vehicle-nyc-hudson`): photographs, published dimensions, measurements and running numbers.
**Code** - `generator/usSteam.ts`
**See also** - [the reference](../../docs/models/us-steam.md)

## Photographs

Downloaded from Wikimedia Commons (`pnpm refs:fetch`). All show the 1938 Dreyfuss units 5445 - 5454.

| file | original | URL | author | licence | use |
|---|---|---|---|---|---|
| `photo-hudson-dreyfuss.jpg` | Hudson locomotive for the New York Central.jpg | https://commons.wikimedia.org/wiki/File:Hudson_locomotive_for_the_New_York_Central.jpg | Robert Yarnall Richie | No restrictions | No. 5453 (Wikipedia's caption): the nose and crest, the pilot's herald and slots, the cab's two windows, the number over the band, the tender's band and lettering |
| `photo-nyc-hudson2.jpg` | NYC Hudson2.jpg | https://commons.wikimedia.org/wiki/File:NYC_Hudson2.jpg | unknown | Public domain | the near-side view: axle spacing, the shelf over the drivers, the skirt's arch behind the last driver, the apron's slanted edge, aluminium drivers with round holes, black truck wheels |
| `photo-ny-worlds-fair-streamlined-hudson-lc-g613-t01-35339-dlc.jpg` | NY Worlds' Fair streamlined Hudson LC-G613-T01-35339 DLC.jpg | https://commons.wikimedia.org/wiki/File:NY_Worlds%27_Fair_streamlined_Hudson_LC-G613-T01-35339_DLC.jpg | Gottscho-Schleisner, Inc. | Public domain | front three-quarter: the nose's size, the crest and the headlight in it, the vent, the pilot's face, herald and slot heights, the ladder |
| `photo-test-run-of-streamlined-20th-century-limited-1938.jpg` | Test run of streamlined 20th Century Limited 1938.jpg | https://commons.wikimedia.org/wiki/File:Test_run_of_streamlined_20th_Century_Limited_1938.jpg | Associated Press | Public domain | front three-quarter at speed: the paint (aluminium pilot and apron, grey casing and nose), the access handles along the shoulder, the cab's band |
| `photo-new-york-central-20th-century-limited-1938.jpg` | New York Central 20th Century Limited 1938.jpg | https://commons.wikimedia.org/wiki/File:New_York_Central_20th_Century_Limited_1938.jpg | Leslie Ragan / New York Central System (?) | Public domain | the colours (the only colour image: greys, the dark blue herald) |

## Published figures

- **Dimensions** - Wikipedia "New York Central Hudson": 4-6-4; 36 in lead wheels, 79 in drivers, 36 in and 51 in
  trailing wheels; 83 ft 7.5 in wheelbase over engine and tender; 97 ft 2 3/8 in long; 10 ft 6 in wide; 15 ft 1 in
  high. NYC Hudson diagrams: 14 ft driving wheelbase, 40 ft 4 in engine wheelbase. Ten J-3a streamlined by Henry
  Dreyfuss in 1938 for the 20th Century Limited.
- **Running number** - 5453, the unit in Richie's photograph.

## Measurements

Photo scales from the 79 in (2.01 m) drivers, the published heights and the axles' published spacing
(source x from the front coupler face, as in the code):

- **Axles** - lead 2.5 / 4.85 m, drivers 6.8 / 8.93 / 11.07 m (14 ft), trailing 13.07 / 14.79 m: the 40 ft 4 in
  engine wheelbase; the near-side photo (about 44 px/m at the drivers, 1-D perspective fit over the three
  driver centres) puts the lead truck's 2.35 m wheelbase and 1.95 m to the first driver.
- **Lengths** - engine 16.3 m to the drawbar end, tender 13.24 m (axles 1.94 - 11.69 m): the published 25.49 m
  wheelbase and 29.6 m over the couplers.
- **Heights** - the casing's top 4.55 m (15 ft 1 in overall with the vent), the nose's axis 3.2 m, its radius
  1.12 m (the smokebox's), the shelf 2.45 m (0.45 m over the drivers; 0.52 of the height in the side photo),
  the skirt's foot over the trailing truck 1.42 m, the pilot's deck edge 2.06 m.
- **Nose** - the headlight about 0.6 m across (0.29 of the nose's width in the World's Fair photo), on the
  axis; the herald 0.9 x 0.5 m on the pilot's centre line at 1.66 m; three slots per cheek at 0.42, 0.83 and
  1.32 m; the apron's rear edge from the pilot's foot ahead of the first lead wheel to the shelf over the
  cylinders' front.
- **Cab and tender** - two cab windows (0.8 and 1.05 m), the dark band 2.15 - 2.75 m with two aluminium
  stripes from the cab's middle along the tender, NEW YORK CENTRAL over about half the tender's length.
