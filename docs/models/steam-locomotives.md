# Steam locomotives

**Covers** - the nine steam designs transferred from vlakosimdb (`db/train/loco/steam`): their ids, the `unit` parameter that makes a locomotive and its tender two variants of one design, the shared builder, measurements and deliberate deviations, the native comparison and the tests.
**Code** - `generator/steamLocos.ts` (the specs, `STEAM_DESIGNS`, `STEAM_LOCOS`, `UNIT_PARAM`, `steamSpec`), `generator/steamLoco.ts` (`buildLoco`, `LocoSpec`), `generator/steamParts.ts` (`Steam`: boiler, chimney, domes, cab, prisms, volumes, running board, deflectors, draw gear, lamps, plates), `generator/steamGear.ts` (running gear and its animation), `generator/steamComparison.ts`, `generator/steamReport.ts`, `generator/strokeFont.ts`, `test/steam.test.ts`
**See also** - [animation.md](animation.md) (the running-gear animation), [vehicles.md](vehicles.md), [parameters.md](parameters.md), [wagons.md](wagons.md) (the comparison method), the sources under `assets/steam-<name>/` (`SOURCES.md`, `COMPARISON-<key>.md`)

## The designs

Sixteen vlakosimdb vehicles become nine designs, registered as their own family
(`STEAM_LOCOS` in `generate.ts`, source module `steamLocos.ts`), all
`category: "Rail vehicles"`, `group: "loco"`, `traction: "steam"`
(`STEAM_CATALOG`); the M 112.0 railcar is `group: "unit"` (`STEAM_RAILCAR_CATALOG`). A locomotive
that runs with a tender is **one design with a `unit` parameter** - `locomotive`
(the default, the exported GLB) or `tender` (built by the JS model,
[parameters.md](parameters.md)); the tender variant is +X toward the
locomotive, as coupled behind it.

| id | vlakosimdb | parameters | locomotive | tender | triangles |
|---|---|---|---|---|---|
| `veh-csd-433-0` | `csd_433_0`, `csd_433_0#2` (`csd_433`: same texture, simpler XML) | `livery`: `black`, `redLining` | 1'D1' tank, 12.06 m | - | 10,700 / 10,900 |
| `veh-csd-456-0` | `csd_456_0` | - | 1'D2' tank, 14.95 m | - | 11,200 |
| `veh-csd-475-1` | `csd_475_179#l`, `#t` | `unit` | 2'D1', 13.0 m | 4 axles on bogies, 7.4 m | 11,900 / 3,500 |
| `veh-csd-477-0` | `csd_477_0` | - | 2'D2' tank, 16.9 m | - | 12,200 |
| `veh-csd-498-1` | `csd_498_1`, `csd_498_1#t` | `unit` | 2'D1', 18.05 m | 4 axles on bogies, 8.9 m | 12,400 / 3,500 |
| `veh-csd-556-0` | `csd_556_0`, `csd_556_0#t` | `unit` | 1'E, 14.95 m | 5 axles, 8.4 m | 11,400 / 4,500 |
| `veh-csd-636` | `csd_636`, `tender/csd_636tend` | `unit` | 1'C C Mallet, 15.1 m | 4 axles on bogies, 8.1 m | 14,400 / 3,000 |
| `veh-csd-386` | `csd_386`, `tender/csd_386tend` | `unit` | streamlined 2'C1', 15.0 m | streamlined, 4 axles, 8.6 m | 9,500 / 3,300 |
| `veh-csd-m112` | `csd_m112` | - | two-axle steam railcar, 8.4 m | - | 4,400 |

Running numbers (`number` in each spec, on both cab sides and the smokebox
door): `433.049`, `456.008` (illustrative), `475.179`, `477.013`, `498.106`,
`556.0510`, `636.001` and `386.001` (illustrative: the vlakosimdb titles name no
unit) and `M 112.001` (illustrative). Steam locomotives carry the pre-1988 class
number with a dot and no check digit; the stroke font gained `.` and `M`.

## Source and coordinates

Every source is a JT7 `simplemodel`: clip polygons in three views (`alongx`
section, `alongy` plan, `alongz` elevation) and BMP colorizes at 0.1 m a pixel,
`z_both.bmp` painting both sides. Source x runs from the front buffer rearward;
the model is **X = centre - x** (+X forward), centred between the buffer heads
(`heads` in the spec), y up from the rail, z across. The XML sets the volumes:
boiler (`kotel`, `boiler`, `base`), cab, tanks and bunkers (`cab`, `tendr`,
`pas`), smoke deflectors (`air`, `pas`, `gear`), chimney and domes (`k1`..`k4`,
`other`, `funnel`, `domes`), cylinders (`cylinder`, `steam`, `cyl`, `fore`);
wheel positions come from the XML's ground notches where it has them (556.0,
477.0, 636, 386, M112) and from the BMP otherwise. Wheel diameters and strokes
are the classes' published dimensions where the texture allows them
(`SOURCES.md` in each folder).

## The builder

`buildLoco(spec)` draws a static part `body` - boiler with smokebox, door and
bands, chimney, domes, safety valves, handrails, plate frames, running board
with valance, cab (the XML section swept along x, a roof overhanging it, glass
on its sloped sides), tanks, bunkers and coal, streamlined `volumes` (the
coaches' loft: section scaled by the plan and clamped by the elevation, in paint
bands), smoke deflectors, bogie side frames, buffer beams with buffers and
coupling (4 mm proud of the body end, a shorter draw gear between a locomotive
and its tender), lamps and number plates, cylinders with valve chests, slide
bars, motion brackets and expansion-link brackets - and then the moving parts
of `RunningGear` and the `running` clip ([animation.md](animation.md)).

## Deliberate deviations

- **475.1**: the vlakosimdb body is 12.8 m (the class 15.25 m) and its texture
  paints coupled wheels about 1.45 m across at 1.55 m centres; 1.75 m wheels
  would overlap, so the model keeps 1.45 m.
- **498.1, 386**: chimney and casing tops above the 4.7 m envelope (5.0 and
  4.8 m in vlakosimdb) are lowered to 4.65 and 4.62 m. The 498.1 cab follows the
  XML clip to 17.8 m where the BMP paints it to 16.9 m.
- **456.0, 636**: 1.32 m / 1.3 m coupled wheels and the strokes are read from
  the texture and the XML notches; no class article could be checked.
- **Rigid**: the 636's front engine is articulated on the real locomotive and
  rigid here; three-cylinder classes (477.0, 498.1) show only their outside
  cylinders.
- **386**: the skirts reach 0.2 m above the rail as in the XML, so most of the
  motion is hidden; it is drawn and animated without valve gear.
- Smoke deflector plates that lean inward in the XML are drawn upright; a
  concave plate is drawn as two convex slabs.

## Measured comparison

`STEAM_TRANSFERS` (`steamComparison.ts`) lists the fifteen vlakosimdb vehicles
with the design and parameters that build them. Each `native/<key>/` folder holds
the unchanged `vehicle.xml`, model `index.xml`, the original BMPs (never the
`_4x` remasters) and `landmarks.json`: native pixel boxes on `z_both.bmp` -
wheels, boiler, chimney, domes, tanks, cab, bunker, deflectors, buffers - with
the source-tree scopes they compare against, a tolerance and the uncertainty.
`pnpm exec tsx generator/steamReport.ts [key ...]` rewrites
`COMPARISON-<key>.md` (percent-of-canvas boxes, deltas, mean absolute error).
Most boxes follow the XML clips the model was built from, so they match to the
pixel; the residuals are the roof overhangs the BMPs do not paint, dome and
chimney feet buried in the boiler, and the deviations above.

| vehicle | boxes | MAE (pp) |
|---|---:|---:|
| 433.0 / 433.0#2 | 9 / 9 | 0.672 / 0.672 |
| 456.0 | 8 | 0.484 |
| 475.179 L / T | 7 / 3 | 0.604 / 0.329 |
| 477.0 | 8 | 0.228 |
| 498.1 / T | 7 / 3 | 0.963 / 0.829 |
| 556.0 / T | 7 / 3 | 0.255 / 0.255 |
| 636 / tender | 6 / 3 | 0.427 / 0.436 |
| 386 / tender | 4 / 2 | 0.984 / 0.000 |
| M112 | 6 | 0.840 |

These are the first authored geometry's measurements; no landmark was moved to
improve a score. Three annotations were corrected after the first run because
their bottom edges had been guessed where a chimney or dome foot is hidden in the
boiler (636 chimney and domes, M112 dome); the uncertainty column says so.

## Tests

`test/steam.test.ts`: the ids and catalog fields; the `unit` parameter on the
five tender locomotives (default locomotive, the tender has no boiler); every
wheel standing on the rail with flat-topped tyres at standard back-to-back;
every landmark within its tolerance; the running numbers; and the animation
([animation.md](animation.md)). `test/models.test.ts` and
`test/params.test.ts` cover determinism, flicker, the 3.1 m by 4.7 m envelope
and the 16,000-triangle budget for every combination, `test/jsModel.test.ts` the
JS model's triangles and clips.
