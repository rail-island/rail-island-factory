# Refined world buses

**Covers** - the twenty world buses refined to the confirmed buses' level of detail (two batches of ten): what `WorldBusSpec.detail` turns on, the kit's detailed ends (`EndFinish`), each design's own fittings (`extras`) and the shared toolkit (staircases, open platforms, roof racks, trolley gear, wheel covers, service flaps), the triangle counts, and the tests.
**Code** - `generator/worldBusDetail.ts`, `generator/worldBusRefined.ts`, `generator/worldBusKit.ts` (`detail`, `finish`, `extras`), `generator/worldBuses.ts`, `generator/worldBuses2.ts`, `generator/worldBuses3.ts`, `generator/worldBuses4.ts`, `generator/busAssembly.ts` (`DoorStyle.open`, `platformAlcove`), `test/rolling.test.ts`, `test/worldBuses2.test.ts`, `test/doorsSuite.ts`
**See also** - [world-buses.md](world-buses.md) (the kit), [world-buses-2.md](world-buses-2.md), [buses.md](buses.md) (the detail layer of the confirmed buses: `busDetail.ts`, the end kit in `busKit.ts`), [doors.md](doors.md), [interiors.md](interiors.md), [animation.md](animation.md#rolling-wheels), [../../.agents/skills/road-vehicle/SKILL.md](../../.agents/skills/road-vehicle/SKILL.md)

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
strips cut round the arches and doors, names read from afar, flat outlines on a side, and:

- `staircase` - a double-decker's glazed staircase, a band of glass rising diagonally from
  the lower deck's windows to the upper deck's;
- `platformPole` - the chrome pole in an open rear platform. The platform itself is the door
  style's `open` (busAssembly.ts): the doorway and its frame with no leaves, and behind it a
  fixed alcove (floor, back wall, ends, ceiling) in place of the cabin, since no door clip
  can reveal one ([doors.md](doors.md), [interiors.md](interiors.md));
- `rearRouteBox`, `noseName` (with the dark band the head lamps sit in);
- `roofRack` - two rails on posts and a ladder up the tail;
- `trolleyGear` - a trolleybus's converter box with grilles, the two rope retrievers' reels
  and the hooks the lowered poles rest in. The ropes themselves are not drawn: the poles'
  `trolleypole` clip moves rigid pieces only (liftable.ts), and a rope from a fixed reel to
  a moving pole tip changes length;
- `spats` - covers over the rear wheels' arches, their backs 5 mm into the shell, clear of
  the tyres and hub caps; the steered wheels stay open;
- `serviceFlaps` - two flaps low on the left between the axles and the fuel filler's cap.

Proud of the shell: housings 8 mm, lamps and slats 1.6-2 cm, round lenses 3 cm, the bumper
3 cm, what sits on it 3.8-4.5 cm, so no two faces share a plane (no flicker).

## The designs

Exterior triangles at the defaults (budget: 10,000 rigid, 15,000 with one joint, 20,000
with two; [buses.md](buses.md)).

| id | was | now | its own fittings |
|---|---|---|---|
| `veh-new-routemaster` | 3,174 | 7,298 | the two glazed staircases (1.25 m bands) rising diagonally from deck to deck (front left, rear right), the route number over the middle door, hatches, gutters |
| `veh-aec-routemaster` | 2,706 | 5,924 | solid front wings and an apron under the bonnet (the kit's bonnet on a detailed bus), the lower saloon's front window over the bonnet, the chrome radiator surround and the maker's triangle, the route number box over the cab, the split upper front windows with their vents, the roof dome's vents, the rear route box, the open rear platform with its pole |
| `veh-neoplan-skyliner` | 3,663 | 9,250 | luggage bays both sides with handles, the rear corners' engine louvres, a chrome strip, roof air conditioning, hatches |
| `veh-ikarus-280` | 4,498 | 10,260 | rain gutters, three hatches, the underfloor engine's grille on the left, the dark lamp panel and the name on the nose |
| `veh-skoda-15tr` | 4,520 | 10,312 | the trolley gear (converter box, rope reels, pole hooks), hatches, gutters, the traction motor's grille |
| `veh-van-hool-exquicity` | 4,346 | 10,470 | the roof fairings ramped at their ends, a light strip across the nose, the chin spoiler, the rear wheels behind covers, the nose's plan rounded wide (0.95 m along the side, 0.55 m across), the driver's door and window on the left |
| `veh-blue-bird-vision` | 2,938 | 8,646 | solid black front wings and an apron, the eight-way warning lamps (amber, red) and the SCHOOL BUS sign on both caps (the windscreen lowered under the front one), the stop arm folded on the left, the crossing arm on the bumper, cross-view mirrors on stalks, the rear emergency door, the district's name, clearance lamps, hatches |
| `veh-gm-scenicruiser` | 3,686 | 9,190 | the fluted aluminium sides (chrome strips cut round the arches and the door), the windscreen's pillar, clearance lamps front and rear, a hatch |
| `veh-skoda-706-rto` | 3,520 | 8,520 | the chrome bars across the grille and the name over it, a chrome belt strip, the roof rack on posts and the ladder up the rear, a hatch, gutters |
| `veh-curitiba-biarticulado` | 5,797 | 13,240 | the boarding flaps folded under the doors' high sills (the tube stations), three air-conditioning units, hatches, gutters, the name on the nose |
| `veh-ikarus-260` | 3,118 | 7,290 | gutters, hatches, the rear engine's grille on the left, the dark lamp band and the name, service flaps |
| `veh-leyland-national` | 3,088 | 7,168 | the rear roof pod faired at its front and slatted along its sides, hatches, gutters, the engine's louvres, service flaps |
| `veh-mb-o305` | 2,994 | 7,326 | the dark lamp band, the star on the nose and the tail, hatches in the red roof, gutters, the engine's louvres, service flaps |
| `veh-skoda-14tr` | 3,152 | 7,356 | the trolley gear (converter box, rope reels, pole hooks), hatches, gutters, the motor's grille, service flaps |
| `veh-adl-enviro400` | 3,020 | 7,292 | the staircase window behind the driver, the engine bay's louvres at both rear corners, the rear route box, hatches, gutters |
| `veh-karosa-sm11` | 3,000 | 7,184 | the dark lamp band and the name, three hatches, gutters, the engine's grille behind the rear axle, service flaps |
| `veh-liaz-677` | 2,908 | 7,552 | the glazed roof edge (skylights over every window, both sides), a chrome bar across the nose, hatches, the engine's louvres, service flaps; the rear door moved 10 cm back, clear of the rear arch's trim |
| `veh-bristol-lodekka` | 3,030 | 7,104 | the radiator in a chrome surround with the badge, the open rear platform with its pole, the rear route box, hatches, gutters |
| `veh-bussing-d2u` | 3,246 | 7,350 | the staircase window behind the driver, the engine's louvres, the rear route box, hatches, gutters |
| `veh-tatra-500-hb` | 2,736 | 7,476 | chrome strips at the skirt, the rear engine's air intakes both sides, the roof rack and ladder, chrome bars across the nose, a hatch, service flaps |

The school bus's warning lamps are their own colours (`warnAmber`, `warnRed`) with no lamp
role, so the game never blinks them as indicators.

## Tests

`test/rolling.test.ts` lists the twenty with their rolling nodes; the door suite lists the two open-platform buses with the jeepney among those with no doors to open; the world bus suites check the
budget, the size (a refined bus's bumpers, plates, displays and badges stand proud of its
ends, so they are left out of the length) and the rest as for every world bus; the shared
flicker, rig and catalog suites cover the rest.
