# MTR M-Train

**Covers** - the Metro-Cammell electric units of Hong Kong's MTR urban lines (`veh-mtr-m-train`): their references, dimensions, the `unit` parameter (the A cab car, the B motor car, the C pantograph car, the D trailer and the articulated full train with its `cars`), the two liveries, the slice body and the cab face, the formation, the game properties, the deviations and the tests.
**Code** - `generator/mtrMTrain.ts`, `generator/sliceBody.ts`, `generator/unitParts.ts` (`unitBogie`), `generator/emuParts.ts` (`centreCoupler`), `generator/czElectricKit.ts` (`diamond`), `generator/tramKit.ts` (`articulate`), `generator/doors.ts`, `test/mtrMTrain.test.ts`, `assets/mtr-m-train/`
**See also** - [shinkansen-0.md](shinkansen-0.md) (the same slice body and train), [vehicles.md](vehicles.md), [parameters.md](parameters.md), [vehicle-rig.md](vehicle-rig.md), [doors.md](doors.md), [lod.md](lod.md), [the source notes](../../assets/mtr-m-train/SOURCES.md)

## The design

| id | title | parameter | values (default first) | triangles |
|---|---|---|---|---|
| `veh-mtr-m-train` | MTR M-Train | `unit` | `aCar`, `bCar`, `cCar`, `dCar`, `train` | about 7,300 the A car, 5,000 to 5,900 the others |
| | | `cars` (with `train` only) | `4` (default), `3`, `5` .. `8` | the cars added up: about 20,500 (3) to 47,500 (8) |
| | | `livery` | `refurbished`, `retro` | |

- `aCar` - "Cab car A", the default and the train's "locomotive": a motor car with
  the driving cab. Its flat cab face at +X has corners rounded in plan (0.32 m) and
  its crown curves down to the face; on it the mask with the two windscreens and
  their destination and number displays, the emergency door between them, the red
  bands with the MTR roundel, the header's two small lamps and round lamp, the
  bumper's head and tail lamps, the anticlimber and a centre coupler 0.35 m ahead.
  The cab's side window stands behind the corner.
- `bCar` - "Motor car B": a motor car without a pantograph.
- `cCar` - "Pantograph car C": a motor car with the diamond pantograph 3.2 m behind
  its +X end, raised to the game's contact wire (5.88 m, `RAIL_COLLECTOR_TOP`).
- `dCar` - "Trailer D": the unpowered trailer (its bogies without motors).
- `train` - the whole train as one articulated vehicle of `cars` cars (below).

Every car has five double-leaf sliding doors a side, 1.4 m wide and 4.5 m apart,
the last 2.0 m from the inner end; a window with its upper hopper midway between
two doors; the running number on the body under the middle window; two low
air-conditioning units on the roof (on the C car clear of the pantograph); the
rain gutter's rib where the roof starts. Each door's two leaves step out 3 cm and
slide apart (`plugMove`, docs/models/doors.md) over the doorway cut through the
shell into the car's cabin (`sliceCabin`, docs/models/interiors.md).

Each car is centred between its coupling planes (the A car's front coupler face,
a plane 0.25 m beyond each inner end wall), so the game can couple them in any
order; a lone car has a gangway frame and a coupler at each inner end. The catalog
fields are `EMU_CATALOG` (rail vehicles, group `unit`).

## Liveries

- `refurbished` - the trains as refurbished in 1998-2001: brushed aluminium sides,
  the black glass-fibre mask and emergency door, one red band with the roundel, the
  brown-grey roof.
- `retro` - the white, red-striped look of the 1979 trains, as the 2024 45th
  anniversary train (A161/A162) wears it: a white body and cab end, a wide red
  stripe and a thin one under it; the cab face keeps the refurbished shape.

## Dimensions

| quantity | A car | B, C, D cars |
|---|---|---|
| body | 22.85 m | 22.0 m |
| over the coupling planes | 23.45 m (0.35 m front coupler, 0.25 m at the inner end) | 22.5 m |
| width, height | 3.06 m (3.11 m real), 3.7 m crown | the same |
| floor, door sills | 1.1 m above the rail | the same |
| bogie centres | 15.6 m (estimated), symmetric about the body's middle | the same |
| bogies | SF2100, 2.5 m wheelbase, 850 mm wheels, motors (none on the D car), air springs | |

The body is lofted through vertical slices (`sliceBody.ts`): the bottom at 0.92 m,
the lower body curving in under the 1.2 m belly, the nearly upright side to the
3.28 m shoulder, a low quarter arc to the crown.

## The formation

`mtrTrain(n)` lays out the cars front to back from `MTR_FORMATIONS`, the 8-car urban
formation A-C+D+B-C+D+C-A shortened from its middle; the rear A car is drawn turned.

| cars | formation |
|---|---|
| 3 | A C A |
| 4 | A C C A (the Disneyland Resort line's sets, P-Q+Q-P) |
| 5 | A C D C A |
| 6 | A C D B C A |
| 7 | A C D B C C A |
| 8 | A C D B C D C A |

Each car is a section (`articulate`) hinged at the coupling plane ahead of it, on its
own two bogies; a bellows joint closes each 0.5 m gap, bending at most 10 degrees. The
cars carry the running numbers of the A164 set (A169, C169, D602, B456, C456, D619,
C164, A164); the retro train's A cars are A162 and A161.

## Game properties

A, B and C cars are motor cars with four 85 kW traction motors (340 kW); the D car is a
trailer (0 kW). 80 km/h in service, 1.0 m/s2. The car weights are estimates (37 t A,
36 t B, 37 t C, 27 t D); a train's weight and power are its cars added up, a variant
per car and train length in each livery (`mtrGame`).

## Distant model

`mtrMTrainLod` builds on `lodUnits.ts`: the body section, the silver sides and the roof,
the window band; the A car's flat face with its rounded corners, the mask and the
windscreens; the bogies and the C car's pantograph as a block. 100 triangles a car, 300
at most for a train.

## Tests

`test/mtrMTrain.test.ts`: every car in both liveries within 16,000 triangles, the
envelope and its length over the couplers without coplanar faces; the bogies and axles;
five opening doors a side of two leaves each; the cab face and only the C car's
pantograph at the wire; the formation of every length and its running numbers; the
sections, joints and supports of every train; deterministic bytes and the distant model
of every car and train. `test/lod-units.test.ts` checks the distant models with the other units.
