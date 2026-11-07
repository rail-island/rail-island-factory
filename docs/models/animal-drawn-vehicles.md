# Animal-drawn vehicles

**Covers** - the twelve animal-drawn vehicles on the animal vehicle kit - four trams, four railway
vehicles, four road coaches: the kit and its `AnimalVehicleSpec`, how the team is sectioned and
hitched on rail and on the road, the trailer, the budget, the distant model, game figures,
sounds, OpenTTD, references, deviations and tests. The former horse tram is the double-deck car.
**Code** - `generator/animalVehicleKit.ts` (`AnimalVehicleSpec`, `buildAnimalVehicle`,
`buildAnimalVehicleLod`, `animalVehicleDesign`), `generator/animalTrams.ts`,
`generator/animalRail.ts`, `generator/animalBuses.ts`, `generator/draftAnimals.ts` (the team),
`generator/rig.ts` (`VehicleRig.team`), `generator/soundMapping.ts` (`teamSounds`),
`generator/openttdTable.ts`, `generator/countryTable.ts`, `test/animalDrawn.test.ts`
**See also** - [draft-animals.md](draft-animals.md), [vehicle-rig.md](vehicle-rig.md),
[sounds.md](sounds.md), [world-trams.md](world-trams.md), [buses.md](buses.md); in the game,
`docs/gameplay/trams.md`, `docs/gameplay/trains.md`, `docs/gameplay/buses.md`

## The designs

| Id (`proc-vehicle-...`) | Title | Kind | After | Size (m, car alone) | Weight, own top speed |
|---|---|---|---|---|---|
| `animal-tram-double-deck` | Double-Deck Horsecar | tram | Victor Harbor double-deck cars (the former horse tram) | 6.4 x 2.0 x 3.5 | 2.0 t, 15 km/h |
| `animal-tram-closed` | Closed Horsecar | tram | the Prague 1875-76 cars, Doebeln, Spiekeroog | 5.96 x 2.0 x 2.8 | 2.6 t, 15 km/h |
| `animal-tram-toastrack` | Toastrack Horsecar | tram | the Douglas Bay Horse Tramway's open cars | 7.6 x 2.0 x 2.9 | 2.2 t, 15 km/h |
| `animal-tram-bobtail` | Bobtail Horsecar | tram | Stephenson bobtail cars (Adelaide no. 18, Christchurch no. 1) | 4.37 x 1.9 x 2.57 | 1.6 t, 12 km/h |
| `animal-rail-budweis-coach` | Budweis-Linz Coach | rail, 1106 mm | the Ceske Budejovice - Linz horse railway's "Hannibal" (1832) | 4.24 x 1.6 x 3.35 | 1.8 t, 15 km/h |
| `animal-rail-budweis-wagon` | Budweis-Linz Goods Wagon | rail, 1106 mm | the same railway's open salt wagon (the Kerschbaum replica) | 3.8 x 1.68 x 1.63 | 1.0 t, 12 km/h |
| `animal-rail-mine-tub` | Mine Tub | rail, 600 mm | a pit-pony hauled coal tub | 1.75 x 0.9 x 1.1 | 0.35 t, 10 km/h |
| `animal-rail-trolley` | Platelayers' Trolley | rail, 1435 mm | a platelayers' trolley with benches for six | 2.45 x 1.84 x 1.54 | 0.45 t, 20 km/h |
| `animal-bus-knifeboard-omnibus` | Knifeboard Omnibus | road | the London knifeboard horse buses (1850s-1880s) | 4.4 x 1.9 x 3.05 | 1.4 t, 15 km/h |
| `animal-bus-stagecoach` | Concord Stagecoach | road | Abbot-Downing Concord coaches | 4.2 x 1.8 x 2.8 | 1.1 t, 20 km/h |
| `animal-bus-paris-omnibus` | Paris Omnibus | road | the Compagnie generale des omnibus cars with their imperiale | 5.35 x 2.0 x 3.6 | 2.6 t, 15 km/h |
| `animal-bus-wagonette` | Wagonette | road | an excursion wagonette / charabanc | 4.4 x 1.95 x 2.9 | 0.9 t, 18 km/h |

Every one carries the team's two parameters (`animal`, `team`; [draft-animals.md](draft-animals.md)):
any of the six species, in the counts it is put to; a tram or railway vehicle also `none`, the
trailer coupled behind. A road coach's default team is a pair, everything else one horse.

## The kit

A design module states one `AnimalVehicleSpec` per vehicle - its kind, catalog fields, palette,
weight and own top speed, the hitch, where the driver holds the reins, the body (and a road
coach's fore-carriage and king bolt), its rolling wheels, its distant model and its references -
and exports `buildAnimalVehicle(spec, p)` and `buildAnimalVehicleLod(spec, p)` under its own names
(the JS model imports build functions by name). `animalVehicleDesign` gives the design its
parameters and its game figures (`teamGame`).

### Rail and tram: the team a section ahead

The car is `section0`, the team `section1`, hinged at the car's draw hook (`hitch`) with no joint
- an articulated car whose front section is the team. The team stands on two lone supports
(`axleAt`) under its rear row's hind legs and its leaders' forelegs, so the game sets it on the
track's centre line and at the track's height wherever it is; the car rides its own wheelsets.
The rig's `team` is `{ section: 1, rehitchable: true }`. With the team `none` the vehicle is one
rigid car with neither sections nor gait.

### Road: the team and fore-carriage tow the body

A road coach is a semi-truck's two sections: `section0` is the team with the fore-carriage (the
front axle and its wheels on the turntable, the splinter bar and the pole), `section1` the body
with the rear axle, hinged at the turntable's king bolt (`kingpin`). The rig steers two empty nodes,
`wheel-front-left` and `wheel-front-right`, under the leaders' forelegs, its wheelbase back to the
king bolt: the game steers the team on its quarter mark and drags the body behind it as it drags
a semi-trailer. The rig's `team` is `{ section: 0, rehitchable: false }`.

## Budget

At most **10,000 triangles and 1,000 more for every animal after the first**, at the default team
and at each species' biggest (`test/animalDrawn.test.ts`): the body keeps to about 6,000, the
animals are drawn lighter in a team of four or six (`detailFor`). The distant model is the body's
boxes and the team's (`teamLod`), at most 500.

## Game figures, sounds and OpenTTD

The figures are derived per variant from the species table ([draft-animals.md](draft-animals.md)):
the team's power and weight, the species' pace as top speed, lowered where the power does not hold
it up a 5 % grade. The sounds are the team's (`teamSounds`, [sounds.md](sounds.md)): the hoof beat
as the engine, the species' call on the player's Horn, a tram's bell on departure; the trailer is
silent but for a tram's bell. Each has an OpenTTD entry (a passenger tram, train or road vehicle,
or a goods wagon) whose presets are the default, a pair or four-in-hand and the trailer.

## References and deviations

Each design's photographs and published figures are in `assets/<name>/SOURCES.md`; the weights
and seat counts are estimates (approx.). The trams all run on standard-gauge treads, the Douglas
car's 914 mm gauge noted only in its sources. A road coach's front wheels are sized so the rear
wheel's turn is a whole number of quarter turns of theirs (`rollAll`: one clip rolls both), so
they differ slightly from the photographs. The Budweis-Linz coach is one closed compartment with a
hooded seat at each end, as "Hannibal" is. The paired horses' collars touch a little in the
pair; any species may pull any vehicle, so some pairings are unhistorical by design.

## Checking

`pnpm exec vitest run test/animalDrawn.test.ts`: the species, hitches, parameters and derived
figures, and every vehicle at its default, each species' biggest team, a single elephant and the
trailer - rig, supports, gait, budget, distant model and sounds. Render one with
`pnpm exec tsx generator/renderGlbThumb.ts proc-vehicle-animal-tram-closed out.png side`.
