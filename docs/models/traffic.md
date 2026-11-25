# Passengers and cargo

**Covers** - the numbers the game's passenger and cargo engine reads from each model:
a building's residents, jobs, the cargo it produces and the classes it accepts
(`game.traffic`), a vehicle's seats and cargo space (`game.capacity`); the cargo
classes and their unit, which designs must state them, variants and how they match,
the checks, the export and where the numbers came from.
**Code** - `generator/traffic.ts` (types, `mustCarry`, `trafficProblems`,
`exportedBlock`, `resolvedNumbers`), `generator/trafficTable.ts` (buildings),
`generator/capacityTable.ts` and `generator/capacity/*.ts` (vehicles),
`generator/catalog.ts` (`withTraffic`, `checkTraffic`), `generator/generate.ts` (the
stray-id check), `test/traffic.test.ts`, `test/export.test.ts`
**See also** - [game-properties.md](game-properties.md) (the rest of `game`),
[sounds.md](sounds.md) (the other table kept apart from the designs), [export.md](export.md),
[../site/workshop.md](../site/workshop.md) (drafts)

## What the game does with them

The game's traffic engine (its `docs/gameplay/traffic.md`) makes every placed building
generate groups of passengers and cargo with a target building, and carries them on
the player's vehicles up to their capacity. A building generates
`0.5 x residents + 0.25 x jobs` passenger trips per hour of game time and its `produces`
rates of cargo; it attracts passengers by its jobs and residents and takes in the
cargo classes it `accepts`. Until a design carried these numbers, the game guessed
them from the building's category and the vehicle's group and title; it keeps that
guess only for model ids this export no longer carries.

## The classes and the unit

Besides passengers there are five cargo classes:

| Class | What |
|---|---|
| `goods` | manufactured and packaged goods, containers, vehicles |
| `bulk` | coal, ore, grain, gravel, sand |
| `liquids` | oil, fuel, chemicals |
| `food` | perishables, refrigerated |
| `mail` | post and parcels |

The ids are stored in players' saved games (the game's `traffic.json`): never rename one.
**A cargo unit is one tonne.** Passengers are people: a vehicle's `seats` count every
passenger it takes, seated and standing.

## Where they live

Not on the design. A design module, and `design.ts` with its types, is bundled into
each of its models' JS files, so a number stated there would rewrite every model of the
module. The numbers live in two tables keyed by the exported model id, read only by
the export, the way the sounds do ([sounds.md](sounds.md)):

- `generator/trafficTable.ts` (`BUILDING_TRAFFIC`): `residents`, `jobs` (whole
  people), `produces` (tonnes per hour by class), `accepts` (classes);
- `generator/capacityTable.ts` (`VEHICLE_CAPACITY`), split by family under
  `generator/capacity/` (rail units, rail cars, road / water / air): `seats` (whole
  people), `cargo` (tonnes by class).

Each entry also has a `source`, which is not exported: where a vehicle's figures came
from (a real type's published capacity) or `size: ...` when they were judged from the
model's size, floors and use. A design's numbers are for the model **at its default
parameters and at scale 1**. The game scales a building's numbers by its on-map size
itself, so a variant states what a parameter changes, not what the size changes.

## Which designs must state them

| Kind | Must state | Exported as |
|---|---|---|
| Building of any category but Station and Decor | `trafficTable.ts` entry | `game.traffic` |
| Station or Decor building | nothing | `game.traffic: {}` |
| Vehicle of any group but `loco` and `cablecar` (the cable car machinery) | `capacityTable.ts` entry | `game.capacity` |
| Locomotive, cable car machinery | nothing | `game.capacity: {}` |

A design that must state its numbers needs an entry that carries something at its
defaults or in one of its variants: a building that generates or accepts something, a
vehicle with seats or cargo (a high-speed set's power car seats nobody, but its
trailers and the whole set do). A design of such a group that truly carries nothing -
a harbour tug among the ships, a caboose among the wagons - says so with
`{ nothing: true, source: "<why>" }`, exported as `{}`. A table may still give a quiet design numbers (a locomotive with a mail room);
then they are exported as stated. The game reads an empty block as "nothing" and
never guesses for a design that has one. A draft states nothing until it is confirmed:
the check skips drafts, and no game meta file carries them.

## Variants

An entry may list `variants`, each `{ params, ...fields }`. A variant applies where
**every listed parameter has the listed value**; the design's other parameters (a
livery, a colour, a party wall) do not matter. The design's fields come first, then
each matching variant in listed order, later ones winning field by field
(`resolvedNumbers`, which the game copies). So a unit states its default car, then
`{ unit: "train" }` for the whole set at its default car count and
`{ unit: "train", cars: "2" }` for another count; a tower states `{ size: "compact" }`;
a house `{ storeys: "one" }`.

This is not the exact-selection matching of `game.variants` (the running figures):
there a variant names a whole non-default selection, which would multiply a capacity
by every livery and colour. The capacity's variants therefore travel inside the block,
`game.capacity.variants`, not in `game.variants`.

## Checks

`exportMeta` and `exportVehicleMeta` run `trafficProblems` on every confirmed design
and fail the build on any problem: a missing entry where one is needed, a block that
carries nothing at its defaults, an unknown field or class, a class at 0 (leave it
out), a number below 0 or above the sanity bounds (people above 20,000 per building
field or 3,000 seats, production above 2,000 t/h, cargo above 250,000 t), a fraction of
a person, a class accepted twice, an empty `source`, and a variant without
parameters or numbers, with a parameter or value the design does not have, with
parameters that do not apply together, or listed twice. A whole build also fails
when a table names a model that does not exist. `test/traffic.test.ts` runs the same
checks over every confirmed design.

## The export

`withTraffic` (catalog.ts) writes the block last into the entry's `game`, after the
sounds and the city use: `game.traffic` on buildings (`skyscrapers.meta.json`,
`village.meta.json`), `game.capacity` on vehicles (`vehicles.meta.json`), and both in
the site's `catalog.json` records, drafts included where a table names them. The
`source` is dropped. A building without other game properties gets a `game` block
holding only `traffic`.

The webapp's `master` accepts `traffic` among a building's `game` keys, and its
`vehicleGame` passes a vehicle's `capacity` through untouched, so this export imports
into a webapp that has no traffic engine as well as into one that has.

## Where the numbers came from

- **Vehicles:** published capacity of the real type where the model is one (a
  multiple unit's seats and standing places, a tram's total capacity, a wagon's or
  lorry's payload, an aircraft's typical seating, a ship's passengers or cargo
  deadweight), named in `source`; otherwise judged from the body's size, doors and
  interior. A unit's single cars and whole sets per car count are stated separately.
- **Buildings:** judged from the model's size, floors and use: about 2.5 people per
  flat, an office job per 15-20 m2, landmarks a staff and few or no residents,
  industry producing a few to about 150 t/h by its kind and size.

Real figures sit beside the game's own tuning (queue caps, patience, token
milestones), which was made against its old guesses; a liner's or a freighter's real
capacity is far above what one stop gathers. Balancing is the game's.
