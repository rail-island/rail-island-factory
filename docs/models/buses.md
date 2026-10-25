# Buses

**Covers** - the buses transferred from vlakosimdb's `db/motocar`: the two parametric Karosa families (short and articulated), the Karosa-Renault City Bus 12M and 18M, the Mercedes-Benz Citaro (two liveries) and O 345 G, the Solaris Urbino 15 and Bus 1; how a bus is built (the clipped shell, the fittings, the assembly into parts), where every measure comes from, and the tests.
**Code** - `generator/buses.ts`, `generator/karosa.ts`, `generator/cityBuses.ts`, `generator/busAssembly.ts`, `generator/busBody.ts`, `generator/busKit.ts`, `test/buses.test.ts`
**See also** - [vehicle-rig.md](vehicle-rig.md) (steered wheels, sections, the joint), [vehicles.md](vehicles.md), [parameters.md](parameters.md), [../../.agents/skills/road-vehicle/SKILL.md](../../.agents/skills/road-vehicle/SKILL.md), [../../.agents/skills/vlakosimdb-transfer/SKILL.md](../../.agents/skills/vlakosimdb-transfer/SKILL.md)

## The designs

Every bus of vlakosimdb (commit `b170acf`, `db/motocar`) is a factory model. The
Karosas are two parametric families, one body each; the others are single models.
All are road vehicles in the `bus` group (`BUS_CATALOG`), with steered front wheels,
and the articulated ones with sections and a joint ([vehicle-rig.md](vehicle-rig.md)).

| id | title | vlakosimdb | real bus | triangles |
|---|---|---|---|---|
| `veh-karosa-short` | Karosa Short | `variant`: `b731` (default), `b732`, `c734`, `lc735`, `b931`, `b931e`, `b951e` = `bus_kar_*` | 700 series 10.975 m, 900 series 11.345 m, B 951 11.32 m | 2,800-3,650 |
| `veh-karosa-long` | Karosa Long | `variant`: `b741` (default), `b941`, `b941e`, `b961` | articulated, 17.355 / 17.615 / 17.59 m | 4,100-5,000 |
| `veh-karosa-renault-citybus-12m` | Karosa Renault City Bus 12M | `bus_karrencity12m` | low floor, 11.99 m | 2,600 |
| `veh-karosa-renault-citybus-18m` | Karosa Renault City Bus 18M | `bus_karrencity18m` | articulated low floor, 17.80 m | 3,850 |
| `veh-mb-citaro` | Mercedes-Benz Citaro | `bus_mb_citaro` | O 530, 11.95 m, white and teal | 2,650 |
| `veh-mb-citaro-blue` | Mercedes-Benz Citaro (blue) | `bus_mb_citarob` | the same bus in dark blue | 2,650 |
| `veh-mb-o345-g` | Mercedes-Benz O 345 G | `bus_mb_o345` | articulated, 17.94 m, 2-2-2-2 doors | 4,250 |
| `veh-solaris-urbino-15` | Solaris Urbino 15 | `solaris_urbino_15` | three axles, 14.59 m | 3,600 |
| `veh-bus-1` | Bus 1 | `bus_1` | vlakosimdb's generic coach, 11.3 m | 2,840 |

The Karosa variants differ in series (front mask, rear, length), doors and livery:

| variant | series | doors (right side) | livery |
|---|---|---|---|
| `b731`, `b732` | 700 | 2-2-2, the front one narrower | white, red belt and skirt |
| `c734` | 700 | front and middle | white, blue (CSAD) |
| `lc735` | 700 | double front, single behind the rear axle | white, orange |
| `b931` | 900 | 2-2-2 | white, red; grey bumpers (its native files) |
| `b931e` | 900 | 2-2-2 | white, red |
| `b951e` | 951 | 2-2-2; roof air-conditioning | white, red |
| `b741` | 700 | 2-2-2-2 | white, red |
| `b941`, `b941e` | 900 | 2-2-2-2; the E's roof grey (its native left side greys the roof's edge) | white, red |
| `b961` | 951 | 2-2-2-2; roof air-conditioning | white, red |

## Where the measures come from

Following the [vlakosimdb-transfer](../../.agents/skills/vlakosimdb-transfer/SKILL.md)
skill: the **XML** gives the shell's outlines, the **native BMPs** (10 pixels a metre;
never the `_4x` upscales) the layout of doors, windows, wheels and paint, and the
**photographs and published dimensions** (`assets/<folder>/SOURCES.md`) the real
length, overhangs, wheelbases, height and every fitting the 3 by 4 m textures cannot
resolve - the front masks, lamps, mirrors, grilles, the joint.

- A layout is written in the source's own frame - `u`, metres from the nose, as the
  texture columns run - and carried into the factory's (+X forward, the tail at
  x = 0) by `x(u)`, which also stretches the source to the real length.
- **Axles are placed from the published dimensions** where they are known (every
  Karosa, both City Buses, the Citaro, the O 345 G, the Urbino), not from the
  texture: e.g. the B 731's 2.29 m front overhang and 5.60 m wheelbase, the
  articulated Karosas' 6.27 m from the middle to the driven rear axle (they are
  pushers), the City Bus 18M's 2.71 + 5.355 + 6.575 m, the Citaro's 5.845 m, the
  O 345 G's 5.725 m (its second, 6.415 m, is measured off the photographs; it
  is a pusher too). Bus 1 keeps the texture's.
- Widths are the real 2.50 m (the Citaro 2.54 m, the Urbino 2.55 m), not the
  source's 2.6 m; Bus 1, which is no real bus, keeps 2.40 m.
  Heights follow the sources: the Karosas' roof crown at the XML's 3.10 m, the
  hatches bringing them to the quoted 3.165 m; the City Bus at 2.924 m, its 18M's
  joint fairings to 3.185 m; the Citaro's roof at 2.869 m, its pod to 3.1 m; the
  O 345 G's at 2.994 m; the Urbino's roof at 2.85 m without its pods.
- The vlakosimdb side textures put each bus's door side on `z_inc`, which is the
  factory's right (+Z). The Citaro's source draws its doors on `z_dec`; the factory
  puts them on the right, as on the real bus.
- The native files are kept in `assets/<folder>/native/<key>/` (`index.xml`, the
  model XML as `model.xml`, the BMPs); the site shows them on the Images tab.

## How a bus is built

**The shell** (`busBody.ts`, `drawShell`) is the vlakosimdb shell exactly: the solid
inside a cross-section, a side elevation and a plan, each convex. As that is a convex
polyhedron it is built by clipping a large box by every edge plane of the three
outlines. It is then cut into paint cells - the livery's bands and panels, so every
colour is its own faces - and into the wheel arches, notches out of the bottom with
a rounded crown (six straight pieces). Cells of one colour along a band merge; faces
between cells are never drawn, except an end that looks into an arch; the underside
and the arches' crowns are the `under` material. A cell is dropped only where the
crown lies above it at both ends; one the crown rises through is clipped by the crown,
so the arch's steep feet leave no gap. A section of an articulated bus is
the same shell cut at its own ends, which become the end walls the joint meets.

**The fittings** (`busKit.ts`, `BusDraft` in `busAssembly.ts`) are slabs laid on the
shell: side panes and surrounds follow the section's lean (`sideSlab`), front and rear
panels the end's rake (`endSlab`, `endLamp`), bending with the outline where they
cross one of its corners (one closed solid, `bentSlab`); doors are double-leaf (two
leaves with panes; the LC 735's rear door one), the shell cut open behind them into
the bus's cabin, a frame round the doorway ([interiors.md](interiors.md)). A slab
stands a centimetre or two proud and sinks into the shell by more the prouder it is,
so stacked slabs never share a face (no flicker, see vehicles.md). Mirrors hang ahead
of the nose's corners on an arm that starts inside the body at its height (a raked
front recedes) and a stem down into the head, and reach at most 1.345 m out (the
road-width rule).

**The assembly** (`assembleBus`) draws each rigid body as a part with its shell, axles,
twin or single tyres and the fittings whose x falls in it, then the two steered front
wheels (`steeredWheels`) inside the front body, then one joint part per gap, drawn by
the rig's joint renderer ([vehicle-rig.md](vehicle-rig.md)), and sets the rig: the
steering's wheelbase to the axle the bus turns about (the front section's rear axle),
the inner wheel's 50 degree lock (Bus 1's 45), the sections hinged in the middle of each gap,
0.6 m above the road, and a 50 degree bend.

The Karosas are one builder (`karosa.ts`, `karosaBus`) with per-series frames; the
other buses one more (`cityBuses.ts`, `cityBus`) fed by a `CitySpec` each:
outlines from a few numbers, paint panels, pane and door styles, door and window
runs, axles, and a `details` callback for the nose, the tail and the roof.

## The look, model by model

- **Karosa 700** (B 731 photographs): a near-upright windscreen down to 1.66 m over a
  white strip and a livery-coloured panel with louvres right of the centre; a black
  band with round headlamps in square housings and the grille between; a deep bumper
  in the livery colour with rubber blocks and the plate right of the centre. Two-leaf
  doors glazed in two panes; windows in a dark surround with top-hung vents. The tail:
  a big rear window, the belt across the back, a vent high on the left, the engine
  flap and tail lamp columns.
- **Karosa 900, 951** (B 941 E, B 961 E, B 941 photographs): a taller windscreen over
  a white panel - a slatted grille on the right for the 931 and 941, two slots for the
  951 and 961 - and a deep bumper carrying the headlamps and indicators; a smaller rear
  window with louvres in the belt; the 951 and 961 with a roof air-conditioning pod.
  All Karosas have the engine's grille low on the right of the tail, between the
  last door and the tail (0.6 m long behind a short three-door Karosa's rear door).
- **City Bus 12M / 18M** (photographs): a black band from the deep bonded windows to
  the roof's edge, a white belt, a red skirt under a black line; a raked windscreen
  under a destination box proud of the roof; headlamps in the red lower front; big
  louvred grilles on the rear corners and on the engine flap. The 18M's joint ends
  ramp up on the roof, as the XML's `roof2` outlines and the photographs show.
- **Citaro**: an upright box, a black glazing band ending short of the white tail
  (which carries the rear window and the engine grille), the destination display in a
  black panel over the windscreen, "rabbit ear" mirrors, a roof pod and the engine's
  intake tower at the rear left.
- **O 345 G** (photographs): a flat front with a one-piece windscreen to the roof,
  the destination display in its top, over a black band; lamp clusters low in the
  corners with fog lamps under them and a grey bumper; black-framed windows, a dark
  rubbing strip, four double doors 1.25 m wide (2-2-2-2, the last one in the trailer's tail), a
  roof air-conditioning box, the engine grille at the trailer's rear right.
- **Urbino 15**: a big windscreen under a black visor into the roof, "cat's-eye"
  clusters of three round lamps, a green skirt and roof band, a tandem of the driven
  axle and a trailing axle on single tyres, the engine tower in the rear left corner
  (no window there), round rear lamps.
- **Bus 1**: the source's generic coach: blue under a long window band, a mint sweep
  falling from under the windows to the foot of a mint tail (the native sides' outline,
  held above the rear arch's crown). Dressed beyond the native files as an intercity
  coach: a two-leaf front door 1.15 m wide ahead of the front axle, headlamp clusters
  with indicators in the corners, a louvred grille and a badge, fog lamps in the
  bumper; three luggage-bay hatches a side between the axles with chrome handles;
  amber side markers; a light air-conditioning unit and two hatches on the roof; a
  rear window over seven engine louvres, and a dark rear bumper with the plate.

## Tests

`test/buses.test.ts`: every vlakosimdb bus is here, in the `bus` group; each shell is
as long as the real bus in every variant; the axles of every bus but Bus 1 sit at
the published overhangs and wheelbases; the steered wheels are the frontmost
and every door is on the right; the front tyres turn inside their arches up to the
lock; every variant fits the road (2.7 m with mirrors, 3.45 m with roof equipment) and
the 10,000-triangle budget; the articulated buses have one joint per gap, hinged in
its middle, its faces on the sections' ends, its triangles the renderer's rest pose.
The bodies: no ray from outside meets the inside of a face (no gaps, `insideSeen` in
`test/collision.ts`); every mirror is one connected piece reaching into the body; the
doors are double (the LC 735's rear one single); nothing is laid over a wheel arch's
opening; a slab across a corner of the shell
stays on it (a Karosa door's surround, the O 345 G's and Bus 1's plates); the
grilles, bumpers and tails follow the native files.
The shared suites cover the rest: flicker, determinism, the source tree, the JS model
(the catalog sweep, `test/catalogSweep.ts`, which also poses every rigged bus) and
the joints (`test/rig.test.ts`).
