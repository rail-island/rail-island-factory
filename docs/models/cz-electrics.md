# Czech electric locomotives from vlakosimdb

**Covers** - `veh-cd-110` (CD 110 / 111 / 210), `veh-cd-130` (CD 123 / 130), `veh-cd-140` (CD 140 040) and `veh-cd-169` (CD 169 001): what each design covers, the shared kit (the lofted shell, panels laid on it, bogies, buffers, both pantograph kinds), the native comparison, deviations, what was left out and the tests. The CD 242 is a livery of `veh-cd-230` ([cd-230.md](cd-230.md)).
**Code** - `generator/czElectrics.ts` (`CZ_ELECTRICS`), `generator/czElectricKit.ts`, `generator/cd110.ts`, `generator/cd130.ts`, `generator/cd140.ts`, `generator/cd169.ts`, `generator/czElectricComparison.ts`, `generator/czElectricReport.ts`, `test/czElectrics.test.ts`, `assets/cd-110/`, `assets/cd-130/`, `assets/cd-140/`, `assets/cd-169/`
**See also** - [vehicles.md](vehicles.md), [parameters.md](parameters.md), [cd-230.md](cd-230.md), [loco-liveries.md](loco-liveries.md), [the railroad-vehicle skill](../../.agents/skills/railroad-vehicle/SKILL.md), [the vlakosimdb-transfer skill](../../.agents/skills/vlakosimdb-transfer/SKILL.md)

## The designs

All four are rigid Bo'Bo' rail vehicles in `ELECTRIC_LOCO_CATALOG` (group `loco`, traction `electric`),
registered as one family in `generate.ts` (`czElectrics.ts`, which also exports
their build functions for the JS models).

| id | `livery` | vlakosimdb model | number | look |
|---|---|---|---|---|
| `veh-cd-110` | `cd110` (default) | `cd_110 046-0` | 110 046-0 | red, cream cab and hood band |
| | `cd111` | `cd_111` | 111 006-3 | green, cream cab, orange hood ends |
| | `cd210` | `cd_210` | 210 021-2 | blue, cream cab and hood band; the AC breaker on the cab roof |
| `veh-cd-130` | `cd130` (default) | `cd_130` | 130 036-7 | cream over green, yellow nose band; single-arm pantographs, 3.20 m bogies |
| | `cd123` | `cd_123` | 123 008-5 | pale and dark green, yellow lines; diamond pantographs, 3.33 m bogies |
| | `cd123No019` | `cd_123-019-2` | 123 019-2 | two greens, salmon line; diamond pantographs, 3.33 m bogies |
| `veh-cd-140` | - | `cd_140_040` | 140 040-7 | blue and light blue with stripes, the white "whiskers" on the noses |
| `veh-cd-169` | - | `cd_169` | 169 001-5 | red, white-blue-white stripe, ribbed sides |

| id | over buffers | body | pivots | wheelbase | wheels | collectors | triangles |
|---|---|---|---|---|---|---|---|
| `veh-cd-110` | 14.40 m | 13.16 m frame | 6.30 m | 2.80 m | 1.05 m | one half pantograph, raised to 5.87 m | 9,700 to 10,000 |
| `veh-cd-130` | 17.21 m | 15.97 m | 8.17 m | 3.20 / 3.33 m | 1.25 m | rear raised to 5.87 m, front folded | 11,100 to 11,300 |
| `veh-cd-140` | 15.74 m | 14.50 m | 8.17 m | 3.33 m | 1.25 m | diamond, rear raised, front folded | 11,200 |
| `veh-cd-169` | 18.00 m | 16.70 m | 8.70 m | 2.50 m | 1.25 m | single-arm, rear raised, front folded | 9,700 |

Dimensions are the published ones (atlaslokomotiv.net, cs.wikipedia; each
folder's `SOURCES.md`); where a vlakosimdb body disagrees (the 140 is 11 % and
the 169 3 % too long) its x is scaled to the published body and the scale is
part of the native mapping.

## The kit (`czElectricKit.ts`)

- **`shell(spec)`** lofts a body in plan, as the CD 230's shell does: at every
  height of the profile tables a ring whose sides stand `hw(y)` off the centre
  line and whose ends follow `endPlan(y)` from `tip(y)` - a flat face with
  chamfered corners (169, 110), rounded corners (130) or the 140's bowed nose.
  The XML's `alongz` gives `tip(y)` (the raked windscreens, the roofs rolling
  over), `alongx` gives `hw(y)` (tumblehome, roof curves) and `alongy` the end
  plan. Each strip between band edges is one leaf per region and band
  (`front`, `rear`, `side right|left`, `band <i>`); a design picks whether the
  corner segment takes the side's or the end's bands (the 140's stripes wrap
  round its nose, the 130's yellow nose band wraps round its corners). `ends`
  draws one end only (the 110's hoods, whose inner ends hide in the cab).
- **`surfacePanel(at, n, outline, d0, d1, uBreaks, vBreaks)`** lays a convex
  (u, v) outline on a surface - `onSide` (u = x) or `onEnd` (u = z) - cut into
  columns at the end plan's corners and into rows where the profile kinks, so a
  window on the raked or rounded face lies on the skin. `surfaceDecal` paints
  one-sided outlines (door seams, stripes); `numberOn` writes the running
  number with `lettering` from `cd163.ts`.
- **`bogie`**: two wheelsets with discs, hubs, axle boxes and coil pairs, plate
  side frames dipping between the axles, bolster coils, motors, brake
  cylinders; wheel radius, wheelbase and frame height per design.
- **`buffers`**: casings, plungers and round or rectangular heads at +-0.875 m,
  a hook and a hanging screw-coupling link.
- **`singleArm`** (from `cd163.ts`) and **`diamond`** (from `cd230.ts`): both keep
  their arm lengths in either pose; the single arm's knee is found by
  intersecting circles about the hinge and the head and points away from the
  hinge (the hinge toward the middle of the roof on two-pantograph locomotives).
  Two collectors: the rear (-X) raised to 5.87 m, the front folded, as on the
  CD 230 and 163. The 110 has one, raised.

## The bodies

- **CD 110 / 111 / 210**: the frame and deck (0.9 to 1.4 m), two 2.2 m hoods with
  leaning ends and cambered tops, the full-width cabinets beside the cab with
  the ramp falling toward the hoods, the full-width block under the cab windows,
  and the cab leaning in above 3.2 m (all from `cd_110 046-0`'s clips). Louvres,
  the cab door, plates and lamps from its native BMPs; railings and corner steps
  from photographs. The 210 adds the AC breaker on the cab roof.
- **CD 123 / 130**: the Skoda box body with a nearly flat raked end and rounded
  corners, the roof curving to a narrow crown and the raised louvred middle,
  four machine-room windows a side, cab doors with windows, the round roof
  headlight, the row of six lamps and the plough. A livery picks the
  pantograph kind and the bogie wheelbase.
- **CD 140**: the bowed nose, six portholes a side, cab doors, the long resistor
  box on the roof between the diamond pantographs, the white V on the noses.
- **CD 169**: the long raked windscreen above a vertical dark buffer band, the
  chamfered roof edge carrying the long grilles, ribbed side panels, the raised
  roof cover, one door per side diagonally across (the other end has a window
  and the maker's roundel), the twin headlight under the windscreen.

## Comparison

`czElectricComparison.ts` measures the default build of each design (actual GLB
vertices of named scopes, orthographically projected) against 14 to 16 boxes
per design annotated on the native BMPs (`assets/<folder>/native/landmarks.json`;
the front at the +X end and the +Z side). `pnpm exec tsx
generator/czElectricReport.ts` writes each folder's `COMPARISON.md`; the first
run recorded `native/baseline.json`. Mean absolute errors at this revision:
110 0.65, 130 0.86, 140 0.57, 169 0.43 percentage points; every box is within
its stated tolerance.

## Deviations

- The 110's cab roof at 4.3 m (native 4.4 to 4.5 m) so the folded collector
  stays near the published 4.65 m; its deck is one level (the XML steps it).
- Standard buffers (0.4 m heads at 1.75 m) where the natives draw them wider.
- The 130's roof headlight 0.5 m across (photographs; the native box includes
  the dome around it).
- The 169's front: plate between the lamps, twin headlight, rectangular buffer
  heads, from the 1987 photograph where the native front is ambiguous.
- Not modelled: emblems and lettering other than the running number, cab
  interiors, cables and hoses.

## Left out

Archived in the game (`rail-island-webapp/db/archived.json`) and not
converted on request: `cd_110`, `cd_140`, `cd_141`, `cd_141_017` and `csd_131`.

## Tests

`test/czElectrics.test.ts`: the ids, parameters and defaults; for every
parameter combination the length over the buffers, the axle positions, wheel
contact and gauge, the 3.1 m x 4.7 m envelope and 6.5 m operating height, the
triangle budget, and the collectors (two: the rear raised to 5.87 m and the
front folded, level strips; one: raised); constant single-arm arm lengths in
both poses; every native landmark within its tolerance; valid running numbers;
diamond pantographs on the 123 liveries and the breaker on the 210.
The catalog sweep (`test/catalogSweep.ts`) covers the designs with the
others (determinism, flicker, the JS model).
