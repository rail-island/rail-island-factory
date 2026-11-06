# Refined world buses

**Covers** - the ten world buses refined to the confirmed buses' level of detail: what `WorldBusSpec.detail` turns on, the kit's detailed ends (`EndFinish`), each design's own fittings (`extras`), the triangle counts, and the tests.
**Code** - `generator/worldBusDetail.ts`, `generator/worldBusRefined.ts`, `generator/worldBusKit.ts` (`detail`, `finish`, `extras`), `generator/worldBuses.ts`, `generator/worldBuses3.ts`, `generator/worldBuses4.ts`, `test/rolling.test.ts`, `test/worldBuses2.test.ts`
**See also** - [world-buses.md](world-buses.md) (the kit), [world-buses-2.md](world-buses-2.md), [buses.md](buses.md) (the detail layer of the confirmed buses: `busDetail.ts`, the end kit in `busKit.ts`), [animation.md](animation.md#rolling-wheels), [../../.agents/skills/road-vehicle/SKILL.md](../../.agents/skills/road-vehicle/SKILL.md)

## What `detail` turns on

A world bus whose spec sets `detail: true` is built like the confirmed buses
([buses.md](buses.md), "The detail"): the lathe-turned wheels with ten nuts whose rims,
hubs and nuts roll (`wheel-front-<side>-spin`, `wheel-rear-<axle>-<side>`), the arch trims,
mudflaps, amber side markers, the route displays in the first right-hand window and the
rear window, the roof and plan corners rounded in five pieces, the end fittings wrapped
round the plan's corners, and for an articulated bus the detailed bellows with their frames
and the turntable. The kit then draws the ends from `worldBusDetail.ts` instead of its
plain slabs:

- **the nose** (`detailedGlazing`, `detailedNose`): the windscreen in its frame, the display
  with the route number and the destination, two wipers at rest (`finish.wipers`), an upper
  deck's front windows split by a pillar; corner clusters with two round lenses in chrome
  rings and the indicator outside, or round lamps in chrome rings on a dark bezel; the grille
  as slats in a surround; the badge (`finish.badge`); the bumper (`finish.bumper`,
  `finish.bumperMat`) with its rubber strip, the plate, the tow eye's cover and fog lamps
  (`finish.fog`). A bonneted bus keeps its bonnet's lamps and grille.
- **the tail** (`detailedRear`): the rear window with a third brake lamp over it, the engine
  flap's seam, louvres and latches, the lamp columns in housings, the maker's name
  (`finish.name`), the bumper with the plate, its lamp and two red reflectors.

A design's own fittings are its `extras` (`worldBusRefined.ts`), drawn after the kit's,
with a small toolkit: roof hatches, rain gutters, louvres, hinged flaps with handles, side
strips cut round the arches and doors, names read from afar, flat outlines on a side.

Proud of the shell: housings 8 mm, lamps and slats 1.6-2 cm, round lenses 3 cm, the bumper
3 cm, what sits on it 3.8-4.5 cm, so no two faces share a plane (no flicker).

## The designs

Exterior triangles at the defaults (budget: 10,000 rigid, 15,000 with one joint, 20,000
with two; [buses.md](buses.md)).

| id | was | now | its own fittings |
|---|---|---|---|
| `veh-new-routemaster` | 3,174 | 7,300 | the two glazed staircases rising diagonally from deck to deck (front left, rear right), the route number over the middle door, hatches, gutters |
| `veh-aec-routemaster` | 2,706 | 5,834 | the chrome radiator surround and the maker's triangle, the route number box over the cab, the split upper front windows with their vents, the roof dome's vents, the rear route box, the platform's grab rail |
| `veh-neoplan-skyliner` | 3,663 | 9,250 | luggage bays both sides with handles, the rear corners' engine louvres, a chrome strip, roof air conditioning, hatches |
| `veh-ikarus-280` | 4,498 | 10,260 | rain gutters, three hatches, the underfloor engine's grille on the left, the dark lamp panel and the name on the nose |
| `veh-skoda-15tr` | 4,520 | 10,220 | the converter's roof box with its grilles, the hooks the lowered poles rest in, hatches, gutters, the traction motor's grille |
| `veh-van-hool-exquicity` | 4,346 | 10,050 | the roof fairings ramped at their ends, a light strip across the nose, the chin spoiler, the driver's door and window on the left |
| `veh-blue-bird-vision` | 2,938 | 8,560 | the eight-way warning lamps (amber, red) and the SCHOOL BUS sign on both caps (the windscreen lowered under the front one), the stop arm folded on the left, the crossing arm on the bumper, cross-view mirrors on stalks, the rear emergency door, the district's name, clearance lamps, hatches |
| `veh-gm-scenicruiser` | 3,686 | 9,190 | the fluted aluminium sides (chrome strips cut round the arches and the door), the windscreen's pillar, clearance lamps front and rear, a hatch |
| `veh-skoda-706-rto` | 3,520 | 8,520 | the chrome bars across the grille and the name over it, a chrome belt strip, the roof rack on posts and the ladder up the rear, a hatch, gutters |
| `veh-curitiba-biarticulado` | 5,797 | 13,240 | the boarding flaps folded under the doors' high sills (the tube stations), three air-conditioning units, hatches, gutters, the name on the nose |

The school bus's warning lamps are their own colours (`warnAmber`, `warnRed`) with no lamp
role, so the game never blinks them as indicators.

## Tests

`test/rolling.test.ts` lists the ten with their rolling nodes; the world bus suites check the
budget, the size (a refined bus's bumpers, plates, displays and badges stand proud of its
ends, so they are left out of the length) and the rest as for every world bus; the shared
flicker, rig and catalog suites cover the rest.
