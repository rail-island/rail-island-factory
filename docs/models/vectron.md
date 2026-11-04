# Siemens Vectron

**Covers** - `veh-vectron` (Siemens Vectron MS): its liveries of the Czech operators, the body on the box-cab kit, the paint, the emblems and the lamp grille, the game properties, deviations and the tests.
**Code** - `generator/vectron.ts` (`VECTRON_LIVERIES`, `VECTRON_PARAMS`, `VECTRON_DESIGNS`, `vectron`, `vectronLod`), `generator/boxLocoKit.ts`, `generator/letters.ts`, `generator/soundTable.ts`, `test/vectron.test.ts`, `assets/vectron/`
**See also** - [mainline-electrics.md](mainline-electrics.md) (the box-cab kit), [lettering.md](lettering.md), [loco-liveries.md](loco-liveries.md), [vehicles.md](vehicles.md), [game-properties.md](game-properties.md), [the railroad-vehicle skill](../../.agents/skills/railroad-vehicle/SKILL.md)

## The design

One rigid Bo'Bo' locomotive in `ELECTRIC_LOCO_CATALOG` (group `loco`, traction
`electric`), registered as its own family in `generate.ts` (`vectron.ts`), so its
JS model does not share a module with the mainline electrics. The Czech
operators run Vectron MS units registered in Germany or Austria (UIC class 193),
leased from ELL and RSL; the paint scheme is the `livery` enum:

| `livery` | title | unit | look |
|---|---|---|---|
| `cdEurocity` (default) | CD Eurocity | 193 298-7 (ELL, 2017 on) | three bands the whole length over the dark grey frame - light blue to 2.55 m, the white strip to 3.5 m, navy along the cant - the white strip turning down forward over each cab side, of an even width, and running round the corner into the nose's white at the lamps (1.58 - 2.15 m, hidden there by the grille's navy field and the lamps), the navy over the cab side above it and over the nose, the light blue below it into the nose's light blue foot; white stripes and the white emblem on the navy nose; the navy emblem and "České dráhy" behind the reader's left cab door |
| `regiojet` | RegioJet | 193 205-2 (ELL, 2015-2024) | golden yellow, the white cap over the windscreens and the cab roofs, the black windscreen surround and stripes, "\|\| REGIO" red and "JET" navy behind the cab door and small under the windscreen |
| `cdWhite` | CD white | 193 574-1 (RSL, 2024) | white, the grey frame, the black windscreen surround and stripes, the blue CD emblem on the sides |

Each number is the photographed unit's, valid in the 1988 scheme (the DB scheme
has the same check digit; [vehicles.md](vehicles.md), "Running numbers").

| over buffers | body width | height (collectors down) | pivots | wheelbase | wheels | collectors | triangles |
|---|---|---|---|---|---|---|---|
| 18.98 m | 3.0 m | 4.25 m | 9.5 m | 3.0 m | 1.25 m | single-arm | 13,300 to 14,000 |

Game properties (`game` on the design): 89 t (the 193 227's data panel), 6,400
kW (the MS under AC), 200 km/h; one set for every livery. Its engine sound is the
converter one (`soundTable.ts`), as for the other three-phase locomotives.

## The body

`buildBoxLoco` ([mainline-electrics.md](mainline-electrics.md)) from a `LocoSpec`
of profile tables measured on the reference photos:

- **elevation** (`TIP`): the lower nose almost upright from the frame (1.3 m)
  to the windscreen's foot (2.5 m), the windscreen raked 0.68 m back to 3.55 m,
  the roof's front rolling over to 4.0 m;
- **section** (`HW`): 3.0 m wide and upright to 3.4 m, the cant rounding in to
  2.2 m at the roof;
- **plan** (`endPlan`): flat across the middle, wide rounded corners set back
  0.5 m at the nose's foot and 0.75 m from the windscreen's top up, so the cab
  narrows toward the roof (the corner takes the end's paint);
- **ends**: the windscreen of two panes with wipers, the top headlight, the
  headlights and tail lamps in the lower corners, the V lamp grille (five
  stripes either side of a navy V widening upward from 0.2 m at its foot to 0.5 m at the top, `vGrille`, as 193 289's photographs show), the number plate (on the Eurocity right of the nose emblem, which sits in the middle over the V);
- **sides**: a cab door with its window, handrails and steps behind each
  corner, louvred grilles along the cant, the side number plate;
- **running gear and roof**: the kit's two-axle bogies at 4.75 m, the deep
  grey frame with the buffer beam and plough, the transformer between the
  bogies, the roof covers and the main switch's hood, two single-arm
  pantographs over the bogies (the rear raised to the game's contact wire, the
  front folded) with the roof line between them.

## The paint

The side and end bands are the livery's `side` and `end`; what the bands cannot
draw is side paint: `cabSidePaint` lays a colour over the side's cab section from
a rear edge forward to the side's front edge, which follows the rounded corners
height by height (convex, so the kit's panel takes it) - the Eurocity's navy
cabs (`cabSweep`: the white strip's lower edge and the navy's edge across the cab section, each a chain of convex pieces from the edge forward to the corner, the navy a layer further out) and the RegioJet's white cab caps. The CD emblem
(`cdLogo.ts`) is drawn after the kit's build, on the noses (white, Eurocity) or
on the machine room's sides (blue on the white livery; navy on the Eurocity,
placed by `emblem.sideAt` at the reader's u behind the left cab door, with
"České dráhy" lettered after it), read from outside at either end and side. RegioJet's wordmark is
lettered ([lettering.md](lettering.md)) after the kit's build in the same way,
0.5 m high on the sides and 0.1 m on the ends.

## Deviations

- The lessors' lettering (ELL, RSL), the Eurocity's slogan ("We connect people
  and places"), its cities and their skylines and the "Národní dopravce" line are
  not drawn; the Eurocity's "České dráhy" and RegioJet's wordmark are, in the
  factory's stroke font rather than the operators' own typefaces.
- The windscreen does not wrap round the corners, and the side windows of the
  real cab corners are left out; the nose's lamp housings are plain lamps.
- The Eurocity's curved cab edges are chains of three to five straight pieces; the promotion artwork of some
  units (RegioJet's summer advertising on 193 227, the RSL units' service
  advertising) is not modelled.
- The new CD class 384 (230 km/h, delivered from 2025) carries corporate decals
  without a published description; it is not a livery yet.

## Tests

`test/vectron.test.ts`: the design, its liveries and game properties; the valid
running numbers; for every livery the length over the buffers, the axles at the
pivots and wheelbase, wheel contact and gauge, the 3.1 m width, the fixed body
within 4.25 m and the 6.5 m operating height, the 16,000-triangle budget, the
collectors (rear raised to 5.88 m, front folded, level strips); each livery's
emblems, grille stripes and cab paint; the distant model within 100 triangles.
`test/letters.test.ts` checks the RegioJet wordmark's two colours on both sides
and both ends.
The catalog sweep (`test/catalogSweep.ts`) covers determinism, flicker and the JS
model with the other designs.
