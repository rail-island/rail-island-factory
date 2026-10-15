# Trucks

**Covers** - the procedural European trucks that replace the webapp's hand-authored truck GLBs: the
MAN cistern semi-truck, the 8x4 concrete mixer and the white reefer semi-truck - their references,
dimensions, datums, articulation, budget and deviations, and the cab-over shell they share.
**Code** - `generator/trucks.ts`, `generator/vehicleParts.ts` (`steeredWheels`), `generator/rig.ts`, `generator/meshCore.ts` (`loft`, `sweep`, `slab`, `facets`, `part`), `test/referenceModels.test.ts`, `test/models.test.ts`, `.agents/skills/road-vehicle/SKILL.md`
**See also** - [vehicles.md](vehicles.md) (the American truck, articulation, `sweep`), [vehicle-rig.md](vehicle-rig.md) (steered wheels and the trailer hinge), [skyscrapers.md](skyscrapers.md) (the mesh builder, "Flicker"), [export.md](export.md), [source-tree.md](source-tree.md)

## The designs

| id | title | reference GLB / photos | look | size (L x H x W) | triangles |
|---|---|---|---|---|---|
| `veh-cistern-semi-truck` | Cistern Semi-Truck | `cistern-semi-truck.glb` / `assets/cistern-semi-truck/` | articulated: a copper MAN TGX day cab (black trapezoid grille under a chrome bar, LED headlights in the bumper corners, copper side skirts) and a polished stainless tank trailer on three axles (dished heads, six bands, four manholes, railed walkway, discharge manifold, side guards and cabinets) | 15.72 x 4.04 x 3.10 m | about 7,100 |
| `veh-mixer-truck` | Concrete Mixer Truck | `mixer-truck.glb` / `assets/mixer-truck/` | rigid: a white MAN TGS 8x4 cab with a grey lower band, grey corner covers, bumper and step wells, two steered front axles under grey arches, a tandem drive; the tilted double-cone drum with a yellow and green stripe, emblems and a roller track, the water tank, the hopper, the chute and its orange-banded extensions, the ladder | 10.14 x 4.57 x 3.40 m | about 8,000 |
| `veh-reefer-semi-truck` | Reefer Semi-Truck | `reefer-semi-truck.glb` / `assets/reefer-semi-truck/` | articulated: a white high-roof cab-over tractor (tinted visor band, black slatted grille, black window frames, blue skirts, aluminium fuel tank) and a white refrigerated box trailer (aluminium rails and corner posts, the refrigeration unit on the front wall, a red reflector stripe, side guards, three axles) | 16.94 x 4.07 x 3.00 m | about 6,000 |

The reference GLBs live in the webapp at `db/trucks/glb/`, with their catalog entries (yaw 180,
articulation node names, speed, weight, power) in `db/trucks/trucks.meta.json`. `TRUCKS` lists the
designs with `TRUCK_CATALOG` (Road vehicles, group `truck`).

## Datums

As every factory vehicle: metres, **+X forward** (the nose at max X, which is what the webapp's
yaw 180 expects), +Y up, centred on z = 0, the wheels standing on y = 0 - a tyre is a 20-gon with a
flat side down, its axle at `r * cos(pi / 20)`. Each bounding box matches the reference's to within
2 cm per axis; the widths include the mirrors (the mixer's wide-angle mirrors reach z = +-1.70, as in
the reference).

| | front axle(s) | rear axle(s) | wheel radius | king pin (trailer pivot) |
|---|---|---|---|---|
| cistern | 6.20 | drive 2.60; trailer -4.35, -5.65, -6.95 | 0.50 | (3.10, 1.15, 0) |
| mixer | 3.87, 2.02 | -1.53, -2.93 | 0.535 | - |
| reefer | 7.18 | drive 3.58; trailer -4.82, -6.13, -7.44 | 0.50 | (3.73, 1.14, 0) |

## Articulation

The two semi-trucks are drawn as two parts, `truck` and `trailer`, the trailer's node translated to
the king pin on the fifth wheel's top (the road-vehicle skill's split). The trailer's underside
(saddle, gooseneck plate) starts 1 cm above the fifth wheel; nothing on the tractor between the fifth
wheel and the cab reaches above it (the reefer's fuel tank is kept to 1.12 m for that). Swing
clearance, measured in plan from the pivot:

| | trailer front corners | nearest tractor part above the fifth wheel |
|---|---|---|
| cistern | 1.98 m (the tank's front head) | 2.15 m (the cab's back) |
| reefer | 2.07 m (the refrigeration unit) | 2.52 m (the cab's back) |

What of a trailer hangs below the fifth wheel's top stays outside the circle the tractor's rear
corners sweep about the king pin (`C_SWING` 1.95 m for the cistern, whose light bar's corners reach
1.85 m; `R_SWING` 1.65 m for the reefer, whose mudflaps reach 1.55 m): the cistern's landing gear
and the front end of its discharge manifold (the side guards' front post stands behind the gear),
the reefer's landing gear. The reefer's frame rails start 1 cm above the fifth wheel, clear of the
tractor's mudguards and fuel tank below. `test/rig.test.ts` swings every semi's trailer to a third,
two thirds and all of its 75 degrees either way and finds no trailer triangle cutting a tractor or
wheel triangle. The webapp's current `articulation` entries name the reference GLBs' own nodes
(`kingpin`, `axle_0`...); a factory GLB has its part nodes and a `rig` naming them
([vehicle-rig.md](vehicle-rig.md)), which the import can read instead.

## Steering

Every truck's steered wheels are parts of their own inside the tractor's (or the mixer's) node,
each turning about its centre ([vehicle-rig.md](vehicle-rig.md)): the semis' front axle, and both
front axles of the 8x4 mixer, whose wheels aim at one turning centre on the line midway along the
rear tandem (wheelbases 6.10 and 4.25 m), the second axle turning less. The mixer is therefore
a `body` part with its four steered wheels inside, no longer a single node. Whatever this file's
comments call +Z, the steered nodes are named as on every road vehicle, in the factory's frame:
`wheel-front-left` at -Z (which the rig lists first), and a positive steering angle turns the
wheels toward -Z, counter-clockwise from above. Each inner wheel locks at 40 degrees, the tyre
clearing the engine block, which stands between the front wheels (the cistern's 1.10 m wide, the
reefer's 1.20 m); the semis' trailers swing 75 degrees either way.

## The cab-over shell

All three cabs are `cabShell`: a stack of lofts between `Level`s, each a plan ring
(`planRing`: rear wall at x0, front at `xf`, half-width `hw`, front corners rounded by `rf` in three
segments). The levels rake the front back toward the windscreen's top and round the roof edge in,
and a band may take its own material (the mixer's grey lower band). Between two levels the front
and the sides are planes, so the glass, visors, grilles and stripes are slabs laid a centimetre
proud of them (`frontSlab`, `sideSlab`, `frontAt`); `cornerSkin` wraps one band's rounded corners
in a second material (the mixer's grey corner covers). Keep a slab inside one level band, or it
leaves the plane.

## Deviations

- **Cistern**: the photo's hazard placards and the MAN lettering are left out; the lion badge is a
  small chrome plate. The tank and the drum are 32-gons.
- **Mixer**: the drum's yellow and green stripe is a band round its belly (the brief and the cab's
  stripes), with the reference's yellow emblems kept on both sides. The rear dual tyres reach
  z = +-1.31 (the reference's 1.34). The water tank is a little slimmer (0.34 m radius) so it clears
  the cab's back wall, which the reference's runs into.
- **Reefer**: the tractor's roof is a raised high roof as in the photo, not the reference's separate
  deflector; the trailer lines between cab and trailer are left out (they would cross the swing
  radius). The reference's lettered panels are plain white.

## Checks

`test/referenceModels.test.ts` holds each truck to its reference's bounding box (10% per axis) and to
the truck budget of **12,000 triangles**; `test/models.test.ts` checks the scopes, the source tree and
z-fighting. Look at a design with a compare render (reference left, procedural right) and at the
trailer swung, per the road-vehicle skill.
