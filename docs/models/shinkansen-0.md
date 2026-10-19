# Shinkansen 0 series

**Covers** - the JNR's first high-speed train (`veh-shinkansen-0`): its references, dimensions, the `unit` parameter (the end car, the motor car, the pantograph car, the Green car, the buffet car and the full articulated train with its `cars`), the three liveries, how the bodies are lofted (the shared slice body), the nose, the formation, the deviations and the tests.
**Code** - `generator/shinkansen0.ts`, `generator/sliceBody.ts`, `generator/sliceLoft.ts`, `generator/unitParts.ts` (`unitBogie`), `generator/emuParts.ts` (`centreCoupler`), `generator/tramKit.ts` (`articulate`), `test/shinkansen0.test.ts`, `assets/shinkansen-0/`
**See also** - [tgv-duplex.md](tgv-duplex.md), [dr-vt1816.md](dr-vt1816.md), [vehicles.md](vehicles.md), [parameters.md](parameters.md), [vehicle-rig.md](vehicle-rig.md), [lod.md](lod.md), [the source notes](../../assets/shinkansen-0/SOURCES.md)

## The design

| id | title | parameter | values (default first) | triangles |
|---|---|---|---|---|
| `veh-shinkansen-0` | Shinkansen 0 series | `unit` | `endCar`, `motorCar`, `pantographCar`, `greenCar`, `buffetCar`, `train` | about 7,200 to 7,700 an end car, 5,000 to 6,000 an intermediate car |
| | | `cars` (with `train` only) | `8` (default), `2`, `4` .. `16` (even) | the cars added up: about 14,600 (2) to 92,500 (16) |
| | | `livery` | `jnr`, `freshGreen`, `doctorYellow` | |

Every 0 series car is a motor car: there is no unpowered trailer, so the
intermediate cars are the unit's other motor cars and its special cars.

- `endCar` - the end car (types 21 and 22, the default and the train's
  "locomotive"): the bullet nose with its translucent light-nose cap, the round
  headlights with the tail lamp inside, the blue plough, the windscreen and the
  cab's side windows; the window band ends behind the cab. The nose is at +X;
  the inner end carries the end door and a centre coupler.
- `motorCar` - the intermediate motor car (type 25): a door at each end, thirteen
  large windows.
- `pantographCar` - its partner (type 26), with the diamond pantograph (the
  PS200) raised to the 5.0 m contact wire.
- `greenCar` - the first-class Green car (type 15): seventeen smaller windows, the
  four-leaf clover emblems by the doors.
- `buffetCar` - the buffet car (type 35): the saloon's large windows, the
  buffet's counter windows on the right side, the corridor's small ones on the
  left.
- `train` - the whole train as one articulated vehicle of `cars` cars (below).

Each car is centred between its coupling planes (the nose tip of an end car, a
plane 0.25 m beyond each inner end wall), so the game can couple them in any
order. The catalog fields are `EMU_CATALOG` (rail vehicles, group `unit`).

## Liveries

The body colour, the cap, the apron, the skirts and the side stripes are a
`livery` (`Livery`: palette, the stripes' heights, where the end car's stripes
start and how they end):

- `jnr` - Ivory No. 1 and Blue No. 20: the blue window band, rounded at its front
  end behind the cab, the blue plough and skirts.
- `freshGreen` - JR West's 2002 renewal of the last Kodama sets: light grey, a
  dark grey window band and a fresh green line under it (approximate colours,
  see the source notes).
- `doctorYellow` - the 922 series test train built on the 0 series: yellow, a
  cream cap, the blue stripe under the windows tapering to a point into the nose.

## Dimensions

| quantity | end car | intermediate car |
|---|---|---|
| over the couplers | 25.15 m (nose tip to the plane) | 25.00 m |
| between two bodies | 0.50 m | 0.50 m |
| bogie centres | 17.5 m, 3.5 m in from the inner end | 17.5 m |
| bogies | DT200, 2.5 m wheelbase, 910 mm wheels, traction motors | the same |
| width, roof | 3.06 m (the real 3.383 m narrowed to the envelope), 3.975 m | the same |
| coupler height | 1.0 m | 1.0 m |

## Construction

The bodies are lofted by the shared slice body (`sliceBody.ts`): each vertical
slice is the bottom, the skirt (or the plough), the lower body curving out to
the belly at 1.45 m, the side leaning in to the shoulder at 3.08 m with the
livery's stripe edges on it, and a quarter ellipse to the crown. On the end car
every quantity varies along the nose: the plan rounds from the tip to the full
width 4.7 m back, the crown rises over the dome (its tip at 1.62 m), the bonnet
and the windscreen to the roof 7.8 m back, the plough's bottom drops to 0.26 m and
is cut up over the leading bogie. Because paint edges are slice vertices, the
cap, the plough's line and the stripes stay exact on the curved nose.

- **Nose** - the headlights are discs laid tangent to the lofted surface
  (`surfaceDisc`); the windscreen's two panes and the cab's side windows are
  grids of facets on the surface (`crownPane`), so they follow its curvature.
- **Sides** - plug doors with their leaves painted in the bands, windows with a
  frame and glass (`sidePanel`, on the leaning side), the running numbers
  (`21-1` and so on), the Green car's clovers and the stripes' ends (`sideDecal`).
- **Roof** - a row of ventilators; the pantograph car's diamond pantograph on
  four insulators, its frames a rhombus either side, the collector at 5.0 m.
- **Running gear** - `unitBogie` with traction motors for every bogie; the
  underframe's equipment boxes between the bogies.

## The full train

`shinkansen0Train(n)` lays the cars out front to back, the train centred on x =
0: an end car at each end (the rear one drawn facing +X about its centre, then
turned), between them pairs of motor cars - every pair has one pantograph car
(the end cars pair with the pantograph car next to them). From eight cars the
buffet car takes the middle; from twelve two Green cars follow it, as in the
16-car Hikari (cars 8, 11 and 12). A Green car in a pantograph car's place
carries the pair's pantograph (the type 16).

Each car is a section (`articulate` from the tram kit) hinged at the coupling
plane ahead of it, one bellows joint over the 0.50 m between two bodies, a 10
degree bend. As in the VT 18.16, every car keeps its own two bogies, so the rig
has two supports per section; the joint only skins the gap. Inside the train the
cars leave out their gangway frames and keep their end doors and couplers.

## Distant model

`shinkansen0Lod` builds a `UnitBody` for `fitUnit` (lodUnits.ts): the section,
the skirt, body colour and window band; the end car's nose as the centre line
rising from the plough over the dome and the bonnet into the windscreen, its
cab painted without the band; the windows and the bogies; a pantograph car's
collector as a block. A single car has 100 triangles; the train keeps the full
model's sections and joints within 100 triangles a car and 500 at most
(`lodTriangles: 500`, so the 16-car train still fits), the intermediate cars'
bogies given up first.

## Game properties

Every car 740 kW (four 185 kW motors), 220 km/h. Weights are estimates: end car
60 t, pantograph and Green car 58 t, motor car 57 t, buffet car 56 t. The train
adds its cars up (`cars` x 740 kW). The liveries do not change the figures.

## Deviations

- The body is 3.06 m wide, not 3.383 m: the repository's 3.1 m rail envelope.
- The bogies are the shared two-axle bogie, not the DT200's exact frames.
- The end doors, the gangway bellows and the wipers are simplified; every
  intermediate car of a type has the same window layout.
- The Doctor Yellow keeps the passenger cars' windows; the real test cars have
  few windows and measuring equipment on the roof.

## Checking

`pnpm exec vitest run test/shinkansen0.test.ts` (ids and parameters, every car in
every livery: the 16,000 triangle cap, the 3.1 m and 4.7 m envelope, the length
over the couplers, no coplanar faces; the bogies 17.5 m apart; the nose's
fittings and the pantograph's height; the formation of every train size; the
articulated trains' sections, hinges, joints and two supports a car; deterministic
bytes, the distant models). Views: `pnpm exec tsx generator/orthoViews.ts proc-vehicle-shinkansen-0 <dir> unit=<value> [cars=<n>] [livery=<value>]`.
