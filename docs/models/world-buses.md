# World buses

**Covers** - the buses from around the world on the world bus kit, first batch of 25 (city buses with high and low floors, coaches, double-deckers, articulated buses, trolleybuses): the kit's `WorldBusSpec` and its four shapes, what it draws on every bus, the trolley poles, the parameters, game properties, OpenTTD figures and sounds, references, deviations and tests.
**Code** - `generator/worldBusKit.ts`, `generator/worldBuses.ts`, `generator/cityBuses.ts` (`cityBus`, `roofBox`, the mirrors), `generator/busAssembly.ts`, `generator/busBody.ts`, `generator/busKit.ts`, `generator/liftable.ts`, `generator/openttdTable.ts`, `generator/soundTable.ts`, `test/worldBuses.test.ts`, `test/worldFleet.test.ts`
**See also** - [buses.md](buses.md) (the vlakosimdb buses and the shell builder), [world-buses-detail.md](world-buses-detail.md) (the ten refined ones), [world-buses-2.md](world-buses-2.md) (the later 75 buses and the kit's bonnet, half cab, raised deck and minibus shape), [world-fleet.md](world-fleet.md) (references, data checks, the sweep sample), [vehicle-rig.md](vehicle-rig.md), [doors.md](doors.md), [interiors.md](interiors.md), [animation.md](animation.md) (liftable mechanisms), [openttd-figures.md](openttd-figures.md), [sounds.md](sounds.md)

## The designs

All at their real size, in the `bus` group (`BUS_CATALOG`, category `Road vehicles`),
modelled on the photographs in `assets/<references>/` (the folder named like the id
without `veh-`), whose `SOURCES.md` gives the published figures and marks the estimates.
**The ids are stored in saved maps: never rename one.** Sizes are over the body (length x
width x roof crown, pods and poles aside), axles in metres from the nose, the OpenTTD
introduction year and capacity (seats and standing room), exterior triangles at the defaults.

| id | title | kind | size (m) | axles (m from the nose) | doors | OpenTTD year / capacity | triangles |
|---|---|---|---|---|---|---|---|
| `veh-new-routemaster` | New Routemaster | double | 11.23 x 2.52 x 4.39 | 2.6 / 8.5 | 3 | 2012 / 87 | 7,298 |
| `veh-adl-enviro200` | Alexander Dennis Enviro200 | city | 10.8 x 2.44 x 2.95 | 2.45 / 7.75 | 2 | 2006 / 70 | 2,796 |
| `veh-adl-enviro400` | Alexander Dennis Enviro400 | double | 10.8 x 2.55 x 4.3 | 2.5 / 7.85 | 2 | 2005 / 87 | 7,292 |
| `veh-adl-enviro500` | Alexander Dennis Enviro500 | double | 12 x 2.55 x 4.4 | 2.65 / 8.4 / 9.75 | 2 | 2002 / 130 | 3,794 |
| `veh-leyland-national` | Leyland National | city | 11.3 x 2.5 x 3.05 | 2.35 / 8 | 2 | 1972 / 80 | 7,168 |
| `veh-mb-o305` | Mercedes-Benz O 305 | city | 11 x 2.5 x 2.94 | 2.6 / 8.2 | 3 | 1967 / 100 | 7,326 |
| `veh-mb-o405` | Mercedes-Benz O 405 | city | 11.7 x 2.5 x 2.96 | 2.65 / 8.5 | 3 | 1984 / 100 | 3,118 |
| `veh-mb-ecitaro` | Mercedes-Benz eCitaro | city | 12.135 x 2.55 x 2.95 | 2.85 / 8.725 | 3 | 2018 / 88 | 2,968 |
| `veh-man-lions-city` | MAN Lion's City | city | 12.2 x 2.55 x 3 | 2.7 / 8.5 | 3 | 2018 / 90 | 2,968 |
| `veh-mb-tourismo` | Mercedes-Benz Tourismo | coach | 12.14 x 2.55 x 3.68 | 2.75 / 8.75 | 2 | 1994 / 53 | 2,684 |
| `veh-setra-s515` | Setra S 515 HD | coach | 12.2 x 2.55 x 3.73 | 2.65 / 8.85 | 2 | 2012 / 53 | 2,672 |
| `veh-neoplan-skyliner` | Neoplan Skyliner | double | 13.8 x 2.55 x 4 | 2.8 / 9.3 / 10.65 | 2 | 2004 / 83 | 9,243 |
| `veh-volvo-7900e` | Volvo 7900 Electric | city | 12 x 2.55 x 2.95 | 2.7 / 8.6 | 3 | 2018 / 85 | 2,968 |
| `veh-scania-citywide` | Scania Citywide | city | 12 x 2.55 x 3 | 2.7 / 8.65 | 3 | 2011 / 95 | 2,956 |
| `veh-van-hool-exquicity` | Van Hool Exqui.City | city, articulated | 18.6 x 2.55 x 3.05 | 3.3 / 9 / 15.3 | 4 | 2011 / 120 | 10,470 |
| `veh-skoda-14tr` | Skoda 14Tr | city, trolley | 11.34 x 2.5 x 3.05 | 2.6 / 8 | 3 | 1982 / 90 | 7,356 |
| `veh-skoda-15tr` | Skoda 15Tr | city, trolley, articulated | 17.4 x 2.5 x 3.05 | 2.6 / 8.1 / 14.2 | 4 | 1988 / 160 | 10,312 |
| `veh-ikarus-260` | Ikarus 260 | city | 11 x 2.5 x 3 | 2.4 / 7.8 | 3 | 1971 / 100 | 7,290 |
| `veh-ikarus-280` | Ikarus 280 | city, articulated | 16.5 x 2.5 x 3.16 | 2.4 / 7.8 / 13.6 | 4 | 1973 / 160 | 10,258 |
| `veh-solaris-trollino` | Solaris Trollino 18 | city, trolley, articulated | 18 x 2.55 x 3 | 2.7 / 8.5 / 14.6 | 4 | 2001 / 150 | 4,432 |
| `veh-gillig-low-floor` | Gillig Low Floor | city | 12.2 x 2.59 x 3.1 | 2.1 / 9.25 | 2 | 1997 / 75 | 2,820 |
| `veh-new-flyer-xcelsior` | New Flyer Xcelsior | city | 12.5 x 2.59 x 3.05 | 2.2 / 9.36 | 2 | 2008 / 80 | 2,820 |
| `veh-mci-d4505` | MCI D4505 | coach | 13.7 x 2.59 x 3.5 | 2.35 / 9.6 / 10.95 | 1 | 2001 / 57 | 3,162 |
| `veh-byd-k9` | BYD K9 | city | 12 x 2.55 x 3.05 | 2.65 / 8.65 | 2 | 2010 / 80 | 2,820 |
| `veh-hyundai-universe` | Hyundai Universe | coach | 12 x 2.49 x 3.5 | 2.55 / 8.65 | 1 | 2006 / 45 | 2,524 |

Parameters (defaults first):

| design | parameter | values |
|---|---|---|
| Alexander Dennis Enviro400 | `livery` | `londonRed`, `stagecoach` (white, the rear swoosh as three bands) |
| Alexander Dennis Enviro500 | `livery` (finish) | `kmb` ("KMB Hong Kong": Kowloon Motor Bus cream and red), `mta` (MTA New York white and blue) |
| Mercedes-Benz O 405 | `length` | `solo` ("Solo", 11.7 m), `articulated` ("O 405 G", 17.9 m) |
| MAN Lion's City | `length` | `12`, `18` (articulated) |
| New Flyer Xcelsior | `length` | `40` (ft), `60` (ft, articulated) |
| Ikarus 260, Ikarus 280 | `livery` (finish) | `yellow`, `bkv` (Budapest blue) |

The three length parameters turn a rigid bus into an articulated one, so those designs state
`lodTriangles: 200`, two sections' budget ([lod.md](lod.md)). Game properties: `weight`
(tonnes, empty), `power` (kW), `maxspeed` (km/h), with the articulated variants' figures
as `variants`.

## The kit

`worldBus(spec)` turns a `WorldBusSpec` into the city bus builder's description
(`worldCitySpec`, u = metres from the nose, nose 0 and tail the length) and builds it with
`cityBus`: the convex shell clipped from a section, a side elevation and a plan, the paint
cells, the wheel arches, the plug doors cut into the shell with the generic cabin behind them,
the steered front wheels and, for an articulated bus, the sections and the bellows joint
([buses.md](buses.md), [vehicle-rig.md](vehicle-rig.md)). The kit derives the rest from the
spec's figures: the tyre spans from the width, the arches from the wheel radius, the bellows'
profile from the width, floor, eave and roof, the steering lock (50 degrees, a coach's 45).

The designs build their specs with four shapes in `worldBuses.ts`:

| shape | floor | glazing | doors | front |
|---|---|---|---|---|
| `lowFloor` | 0.27 m | deep bonded glazing in a dark band from 1.06 m to the eave | two-leaf plug doors from 0.30 m | the windscreen under the destination display, corner lamps, a grille; "rabbit ear" mirrors |
| `highFloor` | 0.35 m | framed windows over a tall skirt from 1.55 m | two leaves with a lower pane, from the step at 0.36 m | a tall windscreen, round head lamps; arm mirrors |
| `coach` | 0.35 m | the passengers' windows high over the luggage bays, from 1.85 m | a front door (and a middle one) of narrow leaves | a deep raked windscreen, wide corner lamps |
| `doubleDeck` | 0.30 m (a coach's 0.35) | the lower deck's band and the upper deck's, both sides, round the front | the lower deck's | the windscreen, the display between the decks, the upper deck's front windows |

What every bus gets from the spec (`details` in `worldBusKit.ts`): the windscreen in its
frame with two wipers, the destination display and its text; an upper deck's front windows;
the head lamps (rectangles in the lower corners or round pairs in a housing) with their
indicators; the grille; the front and rear plates; the rear window; the engine's grille at
the rear; the tail lamp columns (reversing, two red, amber); the roof pods (air conditioning,
batteries, gas tanks); the mirrors; a trolleybus's poles. Each is noted for the distant model
as the city buses' are ([buses.md](buses.md)), so the LOD comes from the same description.
A bus whose spec sets `detail` gets the confirmed buses' detail and the kit's detailed ends
instead, and its own fittings (`extras`): [world-buses-detail.md](world-buses-detail.md).

### Trolley poles

A trolleybus (`trolley.at`, the bases' position) has two poles 6.0 m long on a base frame on
the roof, 0.6 m apart (the two wires), each a `liftable` mechanism named `trolleypole`
([animation.md](animation.md)): lowered (lift 0) it lies back almost flat over the roof; raised
(lift 1, the rest pose) its shoe's top is at the game's trolley wire, 5.50 m
(`TRAM_COLLECTOR_TOP`, collector.ts). The shoe stays level as the pole swings. The poles are
not in the LOD; their base is.

## OpenTTD and sounds

Every bus has its entry in `openttdTable.ts` (`pax`: introduction year, capacity, presets:
the defaults and each length or livery variant worth exporting) and its ids in
`openttdIds.json` (`pnpm openttd:ids`). Capacities are seats plus standing room as the
makers state them, marked approx. where taken from a sister type. A bus 12 m long or longer
is two OpenTTD parts. The battery buses (eCitaro, Volvo 7900 Electric, BYD K9, Exqui.City) and
the Solaris Trollino state the inverter engine sound (`electric-engine-converter`), the Skoda
14Tr and 15Tr the resistor one, in `soundTable.ts`; the rest keep the derived bus diesel.

## Deviations

- **Doors on the right.** Every bus has its passenger doors on the right (+z), the game's kerb
  side, also the British and Hong Kong double-deckers whose real doors are on the left.
- The shell is convex, so a bus's curves are a few flat panels: the New Routemaster's
  asymmetric wrap-round glazing and the Exqui.City's tram-like nose are approximated by the
  raked front, a wide plan curve and the dark glazing band (its rear wheels' covers are
  panels; [world-buses-detail.md](world-buses-detail.md)).
- Liveries are one operator's colours as plain bands; no wordmarks, logos or advertising.
- Wheelbases not published in the sources are read off the photographs (approx.).
- The trolley poles are always drawn raised at rest (the game lowers them through the clip).

## Checking

`pnpm exec vitest run test/worldBuses.test.ts test/worldFleet.test.ts`; the shared vehicle
suites (`test/doors*.test.ts`, `test/interiors.test.ts`, `test/rig.test.ts`,
`test/pantographs.test.ts` (the lamp roles)) cover every bus, and the catalog sweep the sampled ones. Render the
batch with `pnpm exec tsx generator/contactSheet.ts <out.png> --cols 5 <ids...>`.
