# CD 843 / 943 / 043 source references

**Covers** - provenance, coordinate conversion, the three cars, dimensions and reconstruction choices of `veh-cd-843`.
**Code** - `generator/dmu843.ts`, `generator/dmuKit.ts`, `generator/dmuComparison.ts`, `native/cd_843/landmarks.json`.
**See also** - [comparison (843 motor car)](COMPARISON.md), [photos](PHOTOS.md), [Czech diesel railcars](../../docs/models/czech-dmus.md).

## Original evidence

All native files come from `janproch/vlakosimdb` revision `b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`:

| folder | vlakosimdb (db/train/dmu/...) | author (index.xml) | `unit` |
|---|---|---|---|
| `native/cd_843/` | cd_843 (CD 843, 56 t, 423 kW, 100 km/h) | Jan Prochazka | motorCar (default) |
| `native/cd_943/` | 843/cd_943 (CD 943, 120 km/h) | Borek Hudak | drivingTrailer |
| `native/cd_043/` | 843/cd_btn753-043 (CD 043) | Borek Hudak | trailer |

Each holds `vehicle.xml`, `index.xml` (unchanged, Windows-1250) and the original BMPs (0.1 m a pixel). No 4x texture was used. dmu/843 holds no motor car of its own: cd_843 is the only one.

## Dimensions

CD 843 (MSV Studenka, 1995-97, Bo'Bo', 2 x 300 kW diesel-electric): 25,200 mm over the buffers, 56 t (cs.wikipedia "Motorovy vuz 843"). The 943 and 043 share the body. Bogie pivots 17.2 m and 2.4 m wheelbase are model choices consistent with the body and the photographs (no published figure was found); 920 mm motor and 840 mm trailer wheels as the Czech railcars of the period.

## Coordinates and reconstruction

- cd_843: 843_z_both 250 x 50 px on 25 x 5 m, 843_x_both 30 x 50 px. Source x = column / 10, y = 5 - row / 10; the body is the XML's 0 to 24.1 m, unscaled (24.1 m + two 0.55 m buffers = the published 25.2 m).
- cd_943 / cd_043: z_both 200 x 60 px on 20 x 6 m (y = 6 - row / 10), the bodies 0.2 to 19.5 m and 0.3 to 19.7 m. vlakosimdb draws them about 4.7 m short; x is scaled by 24.1 / 19.3 and 24.1 / 19.4 to the common body (the windows and doors stretch with it).
- Section: the 943's XML (`alongx` base), walls 0.8 to 3.2 m, its roof above 3.2 m raised 1.5 times to a 3.95 m crown: every native side view (843 and 943) draws the roof line at 3.9 to 4.0 m, the 943 XML stops at 3.7 m and the 843's plain box at 4.1 m.
- Cab ends: the roof rounds down to 3.55 m over the last 0.6 m (the 843 XML: 0.8 m from 3.5 m). The cab front is 843_x_both; the 943's x_inc draws the same front 10 rows lower on its 6 m canvas. The gangway end is the 943's x_dec.
- The cab ends' deep red apron with the yellow edge is taken from the photographs; vlakosimdb's body stops at 0.8 m.

## Running numbers

843 024-1 and 943 002-6 (both photographed, PHOTOS.md), 043 001-7 (the first of the class); in the blue see below.

## CD blue livery

The `livery` value `cdBlue` (every car in CD's current blue, the Najbrt scheme) is read from three photographs from Wikimedia Commons, downscaled to 1600 px and saved as JPEG (quality 85):

| file | Commons page | author | licence | use |
|---|---|---|---|---|
| `photo-843-007-cd-blue.jpg` | https://commons.wikimedia.org/wiki/File:CD_843_007_Liberec.jpg (2020-07-18) | Rainerhaufe | CC BY-SA 4.0 | the motor car 843 007-6: the light blue cab front up over the roof's rounding, the windows and door in one black surround, the navy line across the front with the white number, a red and a white lamp each side over it, the navy emblem on the white under the door, the navy apron; the side's emblem with "Ceske drahy" near the -X end, the navy doors |
| `photo-943-010-cd-blue.jpg` | https://commons.wikimedia.org/wiki/File:Liberec,_n%C3%A1dra%C5%BE%C3%AD,_%C5%99%C3%ADd%C3%ADc%C3%AD_v%C5%AFz_943.jpg (2014-12-21) | PatrikPaprika | CC BY-SA 4.0 | the driving trailer, lettered 80-29 010-3 (the former 943 010-9, the model's number): the cab front without the black surround, the emblem with the wordmark near the gangway end |
| `photo-043-liberec-cd-blue.jpg` | https://commons.wikimedia.org/wiki/File:Liberec,_v%C5%AFz_Btn.jpg (2013-11-02) | SJu (Commons user "ŠJů") | CC BY-SA 3.0 | the band heights on the side (white to 1.58 m, the navy line to 1.74 m, light blue to the eave, the grey roof) and the trailer's emblem without a wordmark, the number small under it; its number reads "...29 007", taken as 043 007-4 |

Running numbers in the blue: 843 007-6 and 943 010-9 (photographed), 043 007-4 (read from the trailer's photograph, uncertain). Simplified: the cars keep the red livery's cab front layout (vlakosimdb's) with the lamps moved up to where the photographs show them; the class pictograms on the doors and the UIC number's prefix are left out; the roof is one grey on every car (the motor car's looks darker in its photograph).

The roof headlamp box over the cab windows (every cab end, in both liveries: 0.82 m wide, 0.3 m tall, a black face with three lamps) is read from `photo-843-007-cd-blue.jpg`, `photo-943-010-cd-blue.jpg` and `photo-843-024-holasovice.jpg` (PHOTOS.md); its housing takes the end's paint around it (grey in the red and cream, where the model's end is grey above the eave, though the photographed red cars are red there).
