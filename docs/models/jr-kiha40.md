# JR KiHa 40

**Covers** - the JNR / JR KiHa 40 diesel railcar as JR Hokkaido runs it (`veh-jr-kiha40`): its references, dimensions, the `livery` parameter, how it is built on the railcar kit, the gauge, the deviations and the tests.
**Code** - `generator/jrKiha40.ts`, `generator/dmuKit.ts`, `generator/csdCoachParts.ts`, `generator/emuParts.ts` (`centreCoupler`), `test/jrKiha40.test.ts`, `assets/jr-kiha40/`
**See also** - [czech-dmus.md](czech-dmus.md) (the railcar kit), [vehicles.md](vehicles.md), [parameters.md](parameters.md), [vehicle-rig.md](vehicle-rig.md), [the source notes](../../assets/jr-kiha40/SOURCES.md)

## The design

| id | title | parameter | values (default first) | triangles |
|---|---|---|---|---|
| `veh-jr-kiha40` | JR KiHa 40 | `livery` | `hokkaido`, `tarako`, `jnr` | about 6,200 to 7,000 |

The KiHa 40 is the 1977-82 JNR single-car railcar with a cab at each end; 888
cars of the KiHa 40 family were built. The model follows the JR Hokkaido cars
(KiHa 40 1700 / 1800, rebuilt from the cold-climate KiHa 40-100) in the photo of
40 1800 at Hakodate (`assets/jr-kiha40/photo-kiha40-1800-hakodate.jpg`).

- `hokkaido` - the JR Hokkaido paint of the photo: off-white body, a light-green
  band with a thin blue line under it below the windows, a blue stripe under the
  roof along the sides only (the cab front stays white), number `40 1800`.
- `tarako` - the all-over JNR vermilion (the "tarako" colour) the cars were
  delivered in, number `40 545`.
- `jnr` - the JNR general diesel scheme, cream with a red window band (the
  retro paint several JR companies revived), number `40 2022`.

The livery is a finish parameter (`finishParams`): it changes colours and the
painted number only. The catalog fields are the railcar kit's `DMU_CATALOG`
(rail vehicles, group `unit`, traction `diesel`).

## Dimensions

| quantity | model | source |
|---|---|---|
| over the couplers | 21.30 m | published (21.3 m) |
| body | 20.80 m | published |
| width | 2.90 m | published 2.9 m class body |
| roof | 3.66 m, exhaust to 3.98 m | estimated from the photo against the width |
| bogie centres | 14.3 m | estimated from the photo |
| wheelbase, wheels | 2.1 m, 860 mm | DT44 / TR227 class air-spring bogies |
| coupler height | 0.88 m | Japanese close coupler height |

The heights of the window band, the paint lines, the cab windows, the headlights
and the tail lamps were read off the photo's cab front, scaled by the known width
and the solebar-to-roof height. The published figures above came from web
searches; the network policy of the session that built the model did not allow
Wikimedia downloads, so `assets/jr-kiha40/` holds only the user's photo (see
SOURCES.md for what to add).

## Construction

`jrKiha40.ts` uses the Czech railcar kit (`Car`, `sideItems`, `endItems`,
`underBoxes`, `exhaust`, `handrails`, `step`) with a unit frame (`kx = ky = kz =
1`), so the kit's decimetre "pixel" boxes are metres times ten; the helpers
`sb()` (side) and `fb()` (end, z seen from outside) take metres.

- **Body** - one loft: vertical sides, the roof's shoulders and crown, rounded
  plan corners and the roof falling to the flat cab ends over the last 0.3 m. The
  paint bands of the livery wrap the ends too.
- **Sides** - a cab side window at each end, a door right behind each cab with
  its window, grab handrails and a step, and ten passenger windows between the
  doors (1.55 m apart) with the Hokkaido double sash. The running number
  is painted mid-car under the band.
- **Ends** - two cab windows, the central gangway door with its window, the
  destination sign over it, two round headlights, two tail lamps, the yellow
  marker plates, a buffer beam, the centre coupler (`centreCoupler`, no side
  buffers: Japanese cars have none) and a snow plough.
- **Running gear** - two bogies (`Coach.bogie`) at 3.25 and 17.55 m, so the rig's
  supports come from them. Under the floor: engine, transmission, fuel tank, air
  tanks and the battery box.
- **Roof** - the roof radiator with its slats, eight ventilators and the exhaust
  stack, which carries the smoke emitter.

## Deviations

- **Gauge.** The prototype runs on the 1,067 mm Cape gauge. The game has one
  track gauge, so the model uses the factory's standard-gauge wheelsets
  (`Coach.wheelset`) like every other rail vehicle; the body keeps its real width.
- The bogies are the coach builder's generic two-axle bogie, not a detailed
  DT44 / TR227. The front's air hoses, jumper cables, wipers and the lettering of
  the destination sign ("rapid one-man" in the photo) are left out; the sign shows a
  green bar.
- Roof equipment and underfloor boxes are placed by eye from the photo.

## Checking

`pnpm exec vitest run test/jrKiha40.test.ts` (ids and parameters, the 16,000
triangle cap, the 4.7 m / 3.1 m envelope, the length over the couplers, no
coplanar faces, the two bogies and their axles, doors, headlights, the exhaust
emitter, deterministic bytes, the distant model). Views:
`pnpm exec tsx generator/orthoViews.ts proc-vehicle-jr-kiha40 <dir> livery=<value>`.
