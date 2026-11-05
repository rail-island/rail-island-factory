# Loading gauges

**Covers** - the largest body a rail vehicle may have, per design: the UIC gauge every European model keeps, the US gauge North American stock is drawn to at its real size, the Shinkansen gauge, and why each clears the game's platforms.
**Code** - `generator/loadingGauge.ts` (`LOADING_GAUGES`, `loadingGaugeOf`), `generator/design.ts` (`ProceduralDesign.loadingGauge`), `test/loadingGauge.test.ts`, `test/catalogSweep.ts`
**See also** - [vehicles.md](vehicles.md), [us-diesels.md](us-diesels.md), [sets.md](sets.md), [the railroad-vehicle skill](../../.agents/skills/railroad-vehicle/SKILL.md)

## The gauges

| `loadingGauge` | width | height | used by |
|---|---|---|---|
| `uic` (default) | 3.1 m | 4.7 m | every European model; a design that names none |
| `us` | 3.3 m | 4.95 m | North American rolling stock at its real size (AAR Plate F, the taller Plate H of the newest hood units) |
| `shinkansen` | 3.3 m | 4.7 m | the Shinkansen, narrowed from their real 3.35 - 3.38 m |

The width is the widest fixed part of the vehicle, centred on the track; the
height is the body's and its fixed roof equipment's above the rail. A raised
collector is checked on its own against the contact wire (`collector.ts`,
`test/pantographs.test.ts`). Every design sets the gauge it is drawn to with
`loadingGauge` on the design; the catalog sweep (`test/catalogSweep.ts`) holds
every combination of a rail design to its gauge's width, and each family's tests
check its heights.

The game has one track gauge (standard, 1,435 mm): a narrow-gauge prototype
(the Japanese conventional lines' 1,067 mm, docs/models/jr-kiha40.md) keeps its
real body on the factory's standard-gauge wheelsets.

## Why 3.3 m

The game's platforms start at the edge of the ballast bed, `BALLAST_WIDTH / 2`
= 2.5 studs from the track centre (`generator/sets/station.ts`), which at the
game's 1.5 studs a metre is 1.67 m. A body that reaches past it at the platform's
height (1.75 studs, 1.17 m) would stand in the platform. 3.3 m leaves 1.7 cm a
side; a Shinkansen at its real 3.38 m would cut 2.3 cm into the edge, so it is
narrowed. Tracks are 8 studs (5.33 m) apart, so two 3.3 m bodies still pass with
2 m between them. Overhead structures leave far more than any gauge's height:
station roofs stand 12.5 studs (8.3 m) over the rail and bridges 13.16 studs
(8.8 m). `test/loadingGauge.test.ts` holds every gauge inside the platform edge.
