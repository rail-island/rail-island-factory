# TGV Duplex

**Covers** - SNCF's double-deck high-speed train (`veh-tgv-duplex`): its references, dimensions, the `unit` parameter (the power car, the end trailer, the intermediate trailer, the bar car and the full train with its `cars`), the four liveries, how the bodies are lofted (the shared slice body), the power car's nose and pantographs, the trailers' Jacobs bogies in the train, the deviations and the tests.
**Code** - `generator/tgvDuplex.ts`, `generator/sliceBody.ts`, `generator/sliceLoft.ts`, `generator/unitParts.ts` (`unitBogie`, with `sections` for a Jacobs bogie), `generator/emuParts.ts` (`pantograph`, `centreCoupler`), `generator/tramKit.ts` (`articulate`), `test/tgvDuplex.test.ts`, `assets/tgv-duplex/`
**See also** - [foreign-units.md](foreign-units.md) (the single-deck TGV), [shinkansen-0.md](shinkansen-0.md), [vehicles.md](vehicles.md), [parameters.md](parameters.md), [vehicle-rig.md](vehicle-rig.md), [lod.md](lod.md), [the source notes](../../assets/tgv-duplex/SOURCES.md)

## The design

| id | title | parameter | values (default first) | triangles |
|---|---|---|---|---|
| `veh-tgv-duplex` | TGV Duplex | `unit` | `powerCar`, `endTrailer`, `trailer`, `bar`, `train` | about 8,100 a power car, 3,900 to 4,900 a trailer |
| | | `cars` (with `train` only) | `4` (default), `5` .. `8` | about 24,500 (4) to 35,500 (8) |
| | | `livery` | `carmillon`, `original`, `inoui`, `ouigo` | |

- `powerCar` - the power car (the default, the train's locomotive): the beak with
  its lamp band, the windscreen and its louvred sill, the cab door, the machine
  room's dark side panel and roof grilles, two pantographs - the rear one raised,
  the front one folded. The nose is at +X; the rear end has a centre coupler.
- `endTrailer` - the end trailer (R1 and R8, first class): coupled to a power
  car at +X on its own bogie, the door by that end, six lower-deck and ten
  upper-deck windows; its roof fairs down to the power car's height.
- `trailer` - an intermediate double-deck trailer (second class): the door over
  the +X joint, six lower-deck and nine upper-deck windows.
- `bar` - the bar car R4: four wide upper-deck windows, two on the lower deck.
- `train` - the whole train of `cars` vehicles (below).

A lone trailer stands on two bogies of its own 2.0 m in from its coupling planes,
with couplers and gangway frames at both ends, so it can be placed by itself; in
the train its joints sit on Jacobs bogies instead.

## Liveries

The power car's paint is four colours on paint edges of its slices - below the
swoosh, the machine-room panel, the line along the swoosh, above it - and a
trailer's seven bands between fixed edges (the lower deck's band, the line under
the upper deck, the upper deck's window band):

- `carmillon` - the 2008 refit: silver, blue rising from the beak over a white
  line to the roof behind the cab, the navy machine-room panel, the SNCF logo and
  the set number 249; trailers with the blue lower deck and a navy upper window
  band.
- `original` - 1996: silver, navy window bands on both decks, a navy band along
  the power car, the DUPLEX lettering.
- `inoui` - 2017: light grey over an anthracite lower body, a carmine line,
  carmine doors.
- `ouigo` - sky blue, the magenta disc with the white OUIGO on the power car, a
  magenta line and magenta doors on the trailers.

The original and Ouigo trailers' paint lines are approximate (see the source
notes).

## Dimensions

| quantity | power car | end trailer | trailer |
|---|---|---|---|
| length | 22.15 m nose to coupling plane | 21.845 m coupling plane to joint | 18.70 m joint to joint |
| gaps | 0.70 m at the coupler | 0.30 m at a joint | 0.30 m |
| bogies | two, 14 m apart (5.2 m and 19.2 m behind the nose) | its own 3.4 m behind the coupling plane, a Jacobs bogie at the joint | Jacobs bogies at both joints |
| wheelbase, wheels | 3.0 m, 920 mm | 3.0 m, 920 mm | 3.0 m, 920 mm |
| width, height | 2.814 m, 4.05 m | 2.896 m, 4.32 m | 2.896 m, 4.32 m |

A ten-car train is 2 x 22.15 + 2 x 21.845 + 6 x 18.70 = 200.19 m, the published
length. The design offers four to eight vehicles (the skill's limit for full
trains), four by default; the prototype's ten-car formation stays the reference
of `duplexTrain` and its tests, and the retired 9- to 12-car values resolve to
the eight-car train.

## Construction

All bodies are lofted by the shared slice body (`sliceBody.ts`, as the
Shinkansen 0 series). The power car's plan rounds from a 0.5 m wide beak to the
full width 3.7 m back; its crown rises from the beak's 1.42 m over the bonnet
(the windscreen's foot at 2.38 m, 2.6 m back) and the windscreen to the 4.05 m
roof 6.6 m back. The swoosh is a pair of paint edges whose height rises along
the car (1.2 m at the beak, the shoulder 9.6 m back); the machine-room panel is a
pair of edges collapsed onto the belly outside 9.8 .. 20.9 m. Lamps, windscreen
and cab windows are panes laid on the surface (`sidePane`, `crownPane`). The
pantographs are the shared single-arm pantograph (`emuParts.ts`), hinged toward
the middle of the roof; the rear one (19.4 m back) is raised to 5.34 m.

A trailer's bottom is 0.3 m over the rail between its bogies (the lower deck) and
1.0 m over each bogie, with short ramps; its sides carry the door (its leaf in
the bands, or the livery's door colour), two rows of windows and the class
numeral.

## The full train

`duplexTrain(n)` lays out a power car at each end, an end trailer behind each,
`n - 4` intermediate trailers between them, the fourth trailer the bar car when
there are six trailers or more; the rear end trailer and power car are drawn
facing +X about their centres, then turned. Each vehicle is a section
(`articulate`) hinged at the coupling or joint plane ahead of it. The power cars
ride on their own two bogies, the end trailers on their own bogie by the power
car; under every joint between two trailers is one Jacobs bogie (`unitBogie`
with `sections: [k, k + 1]`), carrying the two cars on either side, so an eight-car
train has 4 + 2 + 5 supports. Bellows skin every gap.

## Distant model

`tgvDuplexLod` builds `UnitBody`s for `fitUnit`: the power car's beak, bonnet and
windscreen as the end's centre line and setback, its livery as bands with the
cab painted without the panel, its raised pantograph and bogies; a trailer's two
window rows and its own bogies; in the train every inner end hidden under the
bellows and the Jacobs bogies as optional parts. 100 triangles a vehicle, 500 at
most (`lodTriangles: 500`).

## Game properties

Power car 68 t, 4,400 kW; 320 km/h. Trailers 33 t (end), 30.5 t (bar) and 29.5 t
by estimate, no power; the ten-car prototype 380 t; the default four-car train 202 t, the
eight-car train 321 t, each 8,800 kW. The liveries do not
change the figures.

## Deviations

- The power car's roof equipment besides the pantographs (the roof well, the
  breakers, the cables) is left out; the grilles are flat panels.
- The trailers' bogies are the shared two-axle bogie with air springs; the
  vestibules, stairs and the end trailer's luggage area are not shown in the
  window layout beyond the door.
- The single-deck TGV's design (`veh-tgv`) is separate and keeps its vlakosimdb
  reconstruction.

## Checking

`pnpm exec vitest run test/tgvDuplex.test.ts` (ids and parameters, the four- and
eight-car figures, the retired lengths, the 200.19 m ten-car formation, every car in every livery: the triangle cap, the
envelope, its length, no coplanar faces; one raised and one folded pantograph;
the bogies; both decks' windows; the trains' sections, hinges and Jacobs
bogies; deterministic bytes, the distant models). Views: `pnpm exec tsx generator/orthoViews.ts proc-vehicle-tgv-duplex <dir> unit=<value> [cars=<n>] [livery=<value>]`.
