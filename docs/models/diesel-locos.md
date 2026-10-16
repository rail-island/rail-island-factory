# Czech mainline diesel locomotives

**Covers** - the six diesel designs transferred from vlakosimdb: the T 478 "Brejlovec" `veh-cd-750` (CD 750 / 753 / 754) and "Bardotka" `veh-cd-749` (CD 749), two bodies drawn by one builder, the M62 `veh-cd-781`, the T 679.0 `veh-csd-t679-0`, the T 499.0 `veh-csd-t499` and the hood unit `veh-cd-771`; the shared diesel toolkit (the carbody lofted in plan, panels on its ends and sides, Bo'Bo' and Co'Co' bogies), liveries, the native comparison, deviations and tests.
**Code** - `generator/dieselLocos.ts` (`DIESEL_LOCOS`), `generator/dieselParts.ts`, `generator/cd750.ts`, `generator/cd749.ts`, `generator/cd781.ts`, `generator/csdT679.ts`, `generator/csdT499.ts`, `generator/cd771.ts`, `generator/dieselComparison.ts`, `generator/dieselReport.ts`, `test/dieselLocos.test.ts`, `assets/cd-750/`, `assets/cd-781/`, `assets/csd-t679/`, `assets/csd-t499/`, `assets/cd-771/`
**See also** - [vehicles.md](vehicles.md), [parameters.md](parameters.md), [loco-liveries.md](loco-liveries.md), [cd-230.md](cd-230.md), [the vlakosimdb-transfer skill](../../.agents/skills/vlakosimdb-transfer/SKILL.md), [the railroad-vehicle skill](../../.agents/skills/railroad-vehicle/SKILL.md)

## The designs

| id | title | `livery` values (vlakosimdb model) | over buffers | triangles |
|---|---|---|---|---|
| `veh-cd-750` | CD 750 / 753 / 754 Brejlovec | `cd750` (default, `cd_750`), `cd750No308` (`cd_750_308`), `cd753` (`cd_753`), `cd754` (`cd_754`), `cd754No013` (`cd_754_013`) | 16.54 m | 10,500 .. 11,000 |
| `veh-cd-749` | CD 749 Bardotka | `cd749` (default, `cd_749`), `cd749No264` and `cd749No121` (from photographs, on the `cd_749` body) | 16.50 m | 10,400 .. 10,600 |
| `veh-cd-781` | CD 781 Sergej | `cd781` (default, `cd_781`), `cd781No462` (`cd_781_462`) | 17.55 m | 12,500 .. 12,700 |
| `veh-csd-t679-0` | CSD T 679.0 Pomeranc | fixed (`csd_t_679`) | 18.00 m | 10,500 |
| `veh-csd-t499` | CSD T 499.0 / CD 759 Kyklop | fixed (`csd_t499`) | 17.84 m | 9,700 |
| `veh-cd-771` | CD 770 / 771 Cmelak | `cd771No235` (default, `cd_771.235`), `cd771` (`cd 771`), `cd771No421` (`cd_771.421`) | 17.25 m | 9,100 .. 9,300 |

All are rigid rail vehicles (one node, no parts), `DIESEL_LOCO_CATALOG` (`Rail
vehicles`, group `loco`, traction `diesel`), standard gauge, wheel contact at y = 0, within the
3.1 m by 4.7 m envelope. Diesel locomotives have no pantographs; each has its
exhaust, horns, roof fans or hatches, bogies with springs, brake cylinders and
traction motors, a fuel tank and air reservoirs. `DIESEL_LOCOS` is registered as
its own family in `generate.ts`; a design's standalone JS model imports its
builder by name from `dieselLocos.ts`.

Left out on purpose: `cd_751` (the T 478.1 with steam heating) is listed in the
webapp's `db/archived.json`. The vlakosimdb model `csd_t_679` turned out not to
be the T 679.1 (M62, `veh-cd-781`) but the T 679.0 "Pomeranc"
(`assets/csd-t679/SOURCES.md`), so it is its own design.

### Two designs, one builder

The T 478.3 / 478.4 "Brejlovec" (753, 750, 754) and the T 478.1 "Bardotka" (749)
share the frame, bogies and machine room but not the cab: the Brejlovec has a
square face with a 0.1 m V and the roof sloping down to a headlight housing; the
Bardotka's nose leans out 0.4 m under the windscreen and the roof's brow
overhangs it. A different body makes a different model, so they are two designs:
`veh-cd-750` (`cd750.ts`) and `veh-cd-749` (`cd749.ts`), each with its own
`livery` parameter. Both are drawn by `buildT478` in `cd750.ts`; each livery
names its body (`Cd750Livery.body`). The ids and values are contract.

The CD 749 was once a `cd749` livery of `veh-cd-750`; the legacy models
`train-loco-diesel-cd-749` and `cd-751` now map to `veh-cd-749` with its default
livery (`generator/legacyTargets.json`). Of its liveries, `cd749` (grey and red)
is the vlakosimdb `cd_749`; `cd749No264` (green and cream with the maroon roof,
749 264-8) and `cd749No121` (navy, red and cream, 749 121-0) were read from
photographs (`assets/cd-750/SOURCES.md`, `PHOTOS.md`).

## The diesel toolkit (`dieselParts.ts`)

- `planBody`: the carbody lofted in plan. At every height its ring is the +X
  end from the centre line out to the side (`end(y)`: setbacks and z, a fixed
  count), the straight sides and the mirrored -X end; `tip(y)` comes from the
  XML `alongz` elevation, `half(y)` from the `alongx` section, the corners from
  `alongy`. Rings are cut at the profile's heights and every band edge, and
  each painted strip is one leaf (`body/shell/front/band-<i>`,
  `side right/band-<i>`, `cab right/band-<i>`); `cabX` splits the sides into
  cab sections with their own bands.
- `endPanel` lays a panel on a sloped or pointed end (columns at the plan's
  corners, rows at the profile's heights, offset along the surface normal), the
  windscreens (`endWindscreen`), lamps, headlights, emblems and plates on it;
  `u` there is the viewer's left-to-right, so a scope named `left` is on the
  viewer's left at both ends.
- `sidePanel`, `sideDecal`, `sideWindow`, `sideGrille`, `sidePlate`,
  `sideHandrail`: flat panels and decals on a wall whose half width may change
  with height.
- `bogie`: wheelsets with discs, axle boxes, a cast side frame dipping into
  pedestals round each axle, coil or leaf primary springs, secondary coils,
  transoms, brake cylinders and nose-suspended traction motors; two or three
  axles. `buffers`, `coupling`, `plough`, `faceLamp`, `facePlate`, `tankX`,
  `exhaust`, `horn`, `roofFan`.

The CD 771 is a hood unit and builds its hoods, cab, walkway and rails from
sweeps rather than `planBody`.

## Liveries

Bands were read row by row from each model's `x_both` and `z_both` BMPs (a row r
spans canvas height - (r + 1) / 10 to canvas height - r / 10 m), as in
[loco-liveries.md](loco-liveries.md). The 750 liveries add the yellow sweep
(low at the cabs, high along the machine room, diagonals between); the
781 462 its cream sweep up the cab sides; the T 499 its yellow louvred bays with
a leaning edge on the blue machine room. Running numbers are valid 1988 numbers
with their check digit (the T 679.0 and T 499.0 carry their Kryspin numbers,
T 679.001 and T 499.0002); see each `SOURCES.md` for where each comes from.

## Comparison

`dieselComparison.ts` projects the actual GLB vertices of named scopes onto the
native canvases - both faces against `x_both`, the sides against `z_both` - for
the default build of each design, with one mapping per design (the T 679.0 and
CD 771 drawings are scaled along x to their published lengths). `pnpm exec tsx
generator/dieselReport.ts` writes each `assets/<folder>/COMPARISON.md` and
annotated views under `export/review/<folder>/`; `--baseline` stores the current
model as `native/baseline.json`. Mean absolute error, baseline to final:

| design | boxes | baseline MAE (pp) | final MAE (pp) |
|---|---:|---:|---:|
| `veh-cd-750` | 60 | 0.697 | 0.53 |
| `veh-cd-781` | 35 | 1.408 | 0.86 |
| `veh-csd-t679-0` | 27 | 0.746 | 0.72 |
| `veh-csd-t499` | 29 | 0.815 | 0.78 |
| `veh-cd-771` | 14 | 1.524 | 1.01 |

The remaining larger rows are the deliberate departures below.

## Deviations

- Published dimensions over the drawn ones: length over buffers, pivots,
  wheelbase and wheels; the standard 1.75 m buffer spacing and 1.0 .. 1.03 m
  buffer height.
- The 781's tank hangs under its frame; the T 679.0's head lamps stand inboard of
  the buffers; the 781's roof headlight is an oval on the slope.
- The right cab of the 750 side BMP is drawn 2 px off the left cab's mirror
  image; the model mirrors the left cab.
- `cd 771` is drawn on its own, lower body (17.6 x 4.7 m canvas); its colours are
  painted on the common body.
- Not modelled: printed data panels, the side ribs of the 749 and 781, emblems
  the BMPs do not show.

## Tests

`test/dieselLocos.test.ts`: ids, titles and parameters; every livery within the
envelope and the 16,000 triangle cap, on the rails and centred; the published
length over buffers, pivots, axle positions, wheel size and gauge; the
Bardotka's nose and brow against its windscreen in every 749 livery and the
Brejlovec body in every 750 one; the 749 liveries' nose and side colours; every native landmark within
its stated pixel tolerance and each design's MAE under 1.1 pp; valid running
numbers. `test/models.test.ts` and `test/params.test.ts` cover the designs with
the other models (determinism, flicker, envelope, the JS model).
