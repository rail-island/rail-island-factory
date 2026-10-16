# CD 812 / 912 Esmeralda source references

**Covers** - provenance, coordinate conversion, dimensions and reconstruction choices of `veh-cd-812`.
**Code** - `generator/dmu812.ts`, `generator/cabNose.ts`, `generator/dmuKit.ts`, `generator/dmuComparison.ts`, `native/cd_812_613/landmarks.json`.
**See also** - [comparison (812)](COMPARISON.md), [photos](PHOTOS.md), [CD 810](../cd-810/SOURCES.md), [Czech diesel railcars](../../docs/models/czech-dmus.md).

## Original evidence

All native files come from `janproch/vlakosimdb` revision `b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`:

| folder | vlakosimdb (db/train/dmu/...) | author (index.xml) | model |
|---|---|---|---|
| `native/cd_812_613/` | 812/cd_812.613 ("CD Esmeralda", 240 kW) | Borek Hudak | `unit` motorCar (the default) |
| `native/cd_912_001/` | 812/cd_912.001 ("CD Esmeralda ridici") | Borek Hudak | drivingTrailer |

Each holds `vehicle.xml`, `index.xml` (unchanged) and the original BMPs (0.1 m a pixel). Until this design was split off, the two cars were `variant` values of `veh-cd-810`; the game's legacy ids `train-dmu-812-cd-812-613` and `train-dmu-812-cd-912-001` now map here.

## Dimensions and history

- CD 812 613-8: the 810 613 rebuilt by Pars nova Sumperk from spring to September 2001 with laminate cab noses that make it about 0.5 m longer: 14,470 mm over the buffers, 20.7 t, LIAZ M 1.2C engine of 242 kW, Voith hydromechanical transmission, 80 km/h; in passenger service from April 2003 (cs.wikipedia "Motorovy vuz 812"). The only one of its class; since 2026 it runs for AZD (PHOTOS.md) in the same green, white and grey with AZD lettering.
- 912 001-5: the matching driving trailer of 2002, redesignated Bfbdtanx 792 in 2010 and later used in the Cyklohracek trains. Same nose and length; a double door in a lowered centre section.
- The 812 / 912 are the concept the 814 / 914 Regionova followed; they are not Regionova themselves.

## Coordinates and reconstruction

- z_dec = z_inc 160 x 60 px on 16 x 6 m, x_both 30 x 60 px (x_dec and x_inc are empty). The XML runs 0 to 15 m over the buffers: x is scaled by 14.47 / 15 (`K812`) about 7.5 m.
- The body between the noses: the XML section with the skirt tucked in below 1.2 m, the roof rounding from 3.45 m to the 3.7 m crown; the skirt's foot at 0.5 m, cut up to 1.0 m over the wheels. Windows, doors, emblem, display and number from the z_dec boxes; the livery's lines from the BMP: the grey skirt to 1.12 m, a dark grey line to 1.19 m, white to 1.9 m, green above.
- The noses follow the photographs (PHOTOS.md); the 30 px front BMP is far from the real face. The nose runs 1.2 m from its tip to the body: the apron upright to 1.2 m, the face raked 0.15 m up to the lamp mask's top (2.26 m), the windscreen at about 21 degrees up to 3.38 m, the roof rounding back to the crown; plan corners of 0.36 m and a 40 mm bulge. Painted on it: the windscreen nearly the face's width (2.6 m) with rounded corners and its top falling toward the corners, in a black frame; the silver roof cap over it with the top lamp; the silver lamp mask (1.55 to 2.26 m, 2.5 m wide) wrapping into the corners, with the larger upper and smaller lower lamps at each side, the CD emblem and a small plate; the green under the mask with the running number; the white sweeping down from 1.9 m at the cab door to 1.32 m round the corner; the grey line and skirt; the cab side window behind the corner. Under it the grey apron down to 0.24 m with the yellow edge between the buffers and the coupling slot; small red tail lamps low on the corners; the mirrors folded against the cab sides (inside the 3.1 m envelope).
- Axles at the XML's 3.35 and 11.6 m (7.96 m apart scaled), 840 mm wheels.

## Running numbers

- 812 613-8 and 912 001-5, both photographed (PHOTOS.md).
