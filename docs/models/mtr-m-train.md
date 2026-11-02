# MTR M-Train

**Covers** - the Metro-Cammell electric units of Hong Kong's MTR urban lines and the Disneyland Resort Line (`veh-mtr-m-train`): their references, dimensions, the `unit` parameter (the A cab car, the B motor car, the C pantograph car, the D trailer, the articulated full train with its `cars`), the three liveries - the Disneyland one offered only on the cars that line ran - and the three cab fronts, the retired Disneyland units, the slice body, the formations, the game properties, the deviations and the tests.
**Code** - `generator/mtrMTrain.ts`, `generator/sliceBody.ts`, `generator/unitParts.ts` (`unitBogie`), `generator/emuParts.ts` (`centreCoupler`), `generator/czElectricKit.ts` (`diamond`), `generator/tramKit.ts` (`articulate`), `generator/doors.ts`, `test/mtrMTrain.test.ts`, `assets/mtr-m-train/`
**See also** - [shinkansen-0.md](shinkansen-0.md) (the same slice body and train), [vehicles.md](vehicles.md), [parameters.md](parameters.md), [vehicle-rig.md](vehicle-rig.md), [doors.md](doors.md), [lod.md](lod.md), [the source notes](../../assets/mtr-m-train/SOURCES.md)

## The design

| id | title | parameter | values (default first) | triangles |
|---|---|---|---|---|
| `veh-mtr-m-train` | MTR M-Train | `unit` | `aCar`, `bCar`, `cCar`, `dCar`, `train` | about 7,000 to 8,000 a cab car, 5,000 to 6,500 the others |
| | | `livery` | `refurbished`, `retro`, `disneyland` (with `aCar`, `cCar` and `train` only) | |
| | | `cars` (with `train` only) | `4` (default), `3`, `5` .. `8`, in every livery | the cars added up: about 20,000 (3) to 47,500 (8); the Disneyland train about 29,000 at four cars |

The parameters come in that order. The Disneyland livery carries a `when` (a
conditional value, [parameters.md](parameters.md)) on the car, so a Disneyland
Resort Line B or D car is in no picker, combination or test, and resolving one
throws. Its train, like the urban ones, comes in every length (`cars`): a P car at
each end and Q cars between them - four cars, P-Q+Q-P, is the set the line ran.

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

In the `disneyland` livery the A car is drawn as the Disneyland Resort Line's P cab
car (22.85 m: the Disneyland front, three doors a side, Mickey-head windows), the C
car as its Q pantograph car (22.0 m) and the train as the line's P-Q..Q-P of `cars`
cars, the rear P car turned (`mtrCarOf`). They were `unit` values of their own for a day
(`pCar`, `qCar`, `drlTrain`): those are `retired` and resolve to `aCar`, `cCar` and
`train` in the `disneyland` livery, so a key that names one still builds the same car.

Every urban car has five double-leaf sliding doors a side, 1.4 m wide and 4.5 m
apart, the last 2.0 m from the inner end; a window with its upper hopper midway
between two doors. A Disneyland car has three, the last 3.75 m from the inner end,
their leaves with oval lights, and between and beyond them as many Mickey-head
windows (a head and two ears, red-rimmed) as fit at 1.45 m. Every car has the running number on the body under the middle window; two low
air-conditioning units on the roof (on the C car clear of the pantograph); the
rain gutter's rib where the roof starts. Each door's two leaves step out 3 cm and
slide apart (`plugMove`, docs/models/doors.md) over the doorway cut through the
shell into the car's cabin (`sliceCabin`, docs/models/interiors.md).

Each car is centred between its coupling planes (the A car's front coupler face,
a plane 0.25 m beyond each inner end wall), so the game can couple them in any
order; a lone car has a gangway frame and a coupler at each inner end. The catalog
fields are `EMU_CATALOG` (rail vehicles, group `unit`).

## Liveries and fronts

The `livery` picks the paint, and with it the cab car's front (`mtrFront`).

Both urban liveries are a light silver (`#e8eaec` refurbished, `#eceeef` retro, only
slightly metallic so they do not read dark in the game's light) under a light
brown-grey roof.

- `refurbished` - the trains as refurbished in 1998-2001: brushed aluminium sides,
  the brown-grey roof; the **refurbished front**: corners rounded 0.32 m in plan,
  the crown curving down to the face at 3.42 m; the black glass-fibre mask with the
  two windscreens and their displays, the black emergency door, one red band with
  the roundel, the silver header's two small lamps and round lamp.
- `retro` - the 1979 trains as delivered: unpainted aluminium sides; the **original
  front**: tight 0.12 m corners and a near-square top (3.56 m at the face); the face
  in the very material of the sides (one light silver, so the train is the same colour
  seen from the front as from the side), the narrow windscreens with their displays, the wide emergency
  door, the wide red stripe and the thin one under it running unbroken round the
  corners to the hinged cab door (the face's stripes reach the face's edge, and their
  wrap follows the corner's quarter circle in plan at the same 12 mm offset,
  `stripeWrap`) that takes the cab's side window's place, the round lamp over
  the door.
- `disneyland` - the Disneyland Resort Line's P and Q cars: a white body and navy roof; the **Disneyland front**: rounder
  0.38 m corners, the top curving further back (3.38 m at the face); the navy mask
  edged in yellow, the large side windscreens (1.22 m tall, reaching the mask's edge,
  their outer corners rounded to follow it), the centre door's large window, the
  short red "smile" band with the roundel, round headlamps in chrome rings near the
  corners with small round tail lamps inboard; a navy and yellow sweep along
  the lower side behind the front.

## Dimensions

| quantity | A and P cars | B, C, D and Q cars |
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

## The formations

`mtrDrlTrain(n)` lays out the Disneyland train of `n` cars (`mtrDrlFormation`): a P car
at each end, Q cars between, numbered P503, Q503, Q504 .. and P504 at the rear (four:
P503-Q503+Q504-P504, the set the line ran);
`mtrTrain(n)` lays out the cars front to back from `MTR_FORMATIONS`, the 8-car urban
formation A-C+D+B-C+D+C-A shortened from its middle; the rear A car is drawn turned.

| cars | formation |
|---|---|
| 3 | A C A |
| 4 | A C C A |
| 5 | A C D C A |
| 6 | A C D B C A |
| 7 | A C D B C C A |
| 8 | A C D B C D C A |

Each car is a section (`articulate`) hinged at the coupling plane ahead of it, on its
own two bogies; a bellows joint closes each 0.5 m gap, bending at most 10 degrees. The
cars carry the running numbers of the A164 set (A169, C169, D602, B456, C456, D619,
C164, A164); the retro train's A cars are A162 and A161.

## Game properties

A, B, C, P and Q cars are motor cars with four 85 kW traction motors (340 kW); the D car is a
trailer (0 kW). 80 km/h in service, 1.0 m/s2. The car weights are estimates (37 t a cab
or pantograph car, 36 t B, 27 t D); a train's weight and power are its cars added up, a variant
per car and train length in each livery (`mtrGame`).

## Distant model

`mtrMTrainLod` builds on `lodUnits.ts`: the body section, the silver sides and the roof,
the window band; the A car's flat face with its rounded corners, the mask and the
windscreens; the bogies and the C car's pantograph as a block. 100 triangles a car, 300
at most for a train.

## Tests

`test/mtrMTrain.test.ts`: the parameters' order and conditional values - the
Disneyland livery only on the A car, C car and the train of every length, the retired Disneyland
units resolving to them; every urban car in both urban liveries and both Disneyland cars
within 16,000 triangles, the envelope and its length over the couplers without
coplanar faces; the bogies and axles; five (three) opening doors a side of two leaves
each; the cab faces, which front each car and livery draws, the 1979 stripes
unbroken from the face round the corners, the Disneyland windscreens' size, the Mickey-head windows,
and only the C and Q cars' pantographs at the wire; the Disneyland train at four, three and eight cars; the formation of every length and its running numbers; the
sections, joints and supports of every train; deterministic bytes and the distant model
of every car and train. `test/lod-units.test.ts` (which counts a fixed-length train's
cars by its sections) checks the distant models with the other units.
