# Passengers and cargo

**Covers** - the numbers the game's passenger and cargo engine reads from each model:
a building's residents, jobs and supply-chain role - what it makes from nothing,
consumes, or processes by a recipe (`game.traffic`) - and a vehicle's seats, tonnes
and the commodities it may carry (`game.capacity`); the commodities, the chain and
its check, which designs must state their numbers, variants and how they match, the
checks, the export and where the numbers came from.
**Code** - `generator/traffic.ts` (`COMMODITIES`, types, `mustCarry`,
`trafficProblems`, `exportedBlock`, `resolvedNumbers`, `chainOf`, `chainProblems`,
`PENDING_PRODUCERS`), `generator/trafficTable.ts` (buildings),
`generator/capacityTable.ts` and `generator/capacity/*.ts` (vehicles),
`generator/catalog.ts` (`withTraffic`, `checkTraffic`, `supplyChainProblems`),
`generator/generate.ts` (the stray-id and chain checks), `generator/text.ts`
(`COMMODITY_LABELS`), `test/traffic.test.ts`, `test/export.test.ts`
**See also** - [game-properties.md](game-properties.md) (the rest of `game`),
[sounds.md](sounds.md) (the other table kept apart from the designs), [export.md](export.md),
[text.md](text.md) (the commodity names),
[../site/workshop.md](../site/workshop.md) (drafts)

## What the game does with them

The game's traffic engine (its `docs/gameplay/traffic.md`) makes every placed building
generate groups of passengers and cargo with a target building, and carries them on
the player's vehicles up to their capacity. A building generates
`0.5 x residents + 0.25 x jobs` passenger trips per hour of game time and its `produces`
rates of raw commodities and mail; a processor turns delivered inputs into its
output by its recipe and makes nothing without them; a building attracts passengers
by its jobs and residents and takes in the commodities it `accepts` or its recipe
uses. Until a design carried these numbers, the game guessed
them from the building's category and the vehicle's group and title; it keeps that
guess only for model ids this export no longer carries.

## The commodities and the unit

Besides passengers there are ten commodities (`COMMODITIES`, in this order in every
list):

| Commodity | Kind | What |
|---|---|---|
| `grain` | raw | cereals from farms |
| `wood` | raw | logs from logging camps |
| `coal` | raw | coal from coal mines |
| `iron-ore` | raw | ore from iron mines |
| `oil` | raw | crude oil from wells and offshore platforms |
| `food` | processed | made from grain by a food plant |
| `steel` | processed | made from iron ore and coal by a steel mill |
| `fuel` | processed | made from oil by a refinery |
| `goods` | processed | made from steel and wood by a goods factory |
| `mail` | town | post and parcels, between houses, shops and offices |

The ids are stored in players' saved games (the game's `traffic.json`): never rename
one. A **raw** commodity is made from nothing at a fixed rate (`produces`), a
**processed** one only by a recipe (`processes`), and **mail** by and for towns.
**A unit is one tonne.** Passengers are people: a vehicle's `seats` count every
passenger it takes, seated and standing; they are not a commodity.

The names are exported text (`commodity.<id>`, `COMMODITY_LABELS` in
`generator/text.ts`, translated like the categories: [text.md](text.md)), so the game
shows them with `ft`.

## Roles and recipes

A building's `game.traffic`:

```ts
{
  residents?: number; jobs?: number;          // whole people
  produces?: { [commodity]: tonnesPerHour };  // made from nothing: raw commodities, mail
  accepts?: commodity[];                      // consumed on delivery: towns and sinks
  processes?: {                               // a processor's recipe
    output: commodity;                        // a processed commodity
    inputs: { [commodity]: tonnesPerTonneOfOutput };
    rate: number;                             // at most this many t of output an hour
    stock: number;                            // stockpile cap in t, per input
  };
  variants?: [{ params, ...fields }];
}
```

A recipe's inputs are accepted implicitly: they are not repeated in `accepts`. So a
building's role reads off its fields: a **primary industry** `produces` a raw
commodity, a **processor** `processes`, a **sink** or a **town** `accepts` (a town
also `produces` mail). A building may combine them (an offshore platform produces oil
and accepts food and goods for its crew).

A vehicle's `game.capacity`:

```ts
{ seats?: number; tonnes?: number; commodities?: commodity[]; variants?: [...] }
```

`tonnes` and `commodities` are stated together, and `tonnes > 0` exactly when
`commodities` is non-empty; the vehicle carries one commodity at a time. A variant
that empties a car's hold (a dining car of a set whose power car has a luggage room)
states `tonnes: 0, commodities: []`. The commodities follow the body
(`capacityTable.ts`): open wagons, hoppers and tippers coal, iron ore and grain (a
covered grain hopper grain alone); tanks oil and fuel (an LNG carrier too: gas is no
commodity); reefers food; box vans, covered wagons, curtainsiders and containers
goods and food; flat wagons and low loaders steel, wood and goods; an aircraft's hold
goods and mail; luggage vans and mail rooms mail. A vehicle with several holds (an
airliner's goods and mail) states their tonnes summed and the union of what they
take. A concrete mixer carries no commodity (`nothing`).

## The chain

| Commodity | Made by | Taken by |
|---|---|---|
| grain | farm (pending) | food plant (`ind-building-a`) |
| wood | logging camp (pending) | goods factories (`ind-building-h`, `ind-building-k`) |
| coal | coal mine (pending) | steel mill (`industry-factory-a`); power plant, coal type (a sink) |
| iron-ore | iron mine (pending) | steel mill |
| oil | oil pump (3 t/h, large 6), offshore platform (150 t/h) | refineries (`chemical-factory`, both types) |
| food | food plant: 1 t grain -> 1 t food, 15 t/h (extended 22) | homes, shops and landmarks, the warehouse (`ind-building-s`), the offshore platform |
| steel | steel mill: 1 t iron ore + 0.5 t coal -> 1 t steel, 30 t/h (extended 45) | goods factories |
| fuel | refinery: 1 t oil -> 1 t fuel, 40 t/h (refinery type 80) | shops (corner shop, market block, shop, annex), tank farm (`ind-detail-tank`), power plant (default oil and gas type) |
| goods | goods factory: 0.5 t steel + 0.5 t wood -> 1 t goods, 12 t/h (`h`, extended 18) and 10 t/h (`k`, extended 15) | homes, shops, offices and landmarks, the warehouse, the offshore platform |
| mail | homes, shops, offices, landmarks | homes, shops, offices, landmarks |

The model ids above drop their `proc-building-` prefix. A processor's stock cap is
about ten hours of its rate. Offices (the glass, bullet, dark slab, art deco, pagoda,
pyramid and twin-tower skyscrapers) take goods and mail; homes and shops food, goods
and mail; the nuclear power plant takes no commodity. The rates are first drafts;
balancing is the game's.

**The chain check.** A whole build (`generate.ts`, `supplyChainProblems`) fails when a
commodity has no confirmed building that makes it (`produces` or a recipe's
`output`), none that takes it (`accepts` or a recipe's input), or no confirmed vehicle
that carries it, over every confirmed design at its defaults and in each of its
variants (`chainOf`, `chainProblems`); `test/traffic.test.ts` runs it too.

`PENDING_PRODUCERS` (`traffic.ts`) is a **temporary** allowance: grain, wood, coal
and iron ore are excused from having a producer while their buildings - the farm,
the mine (coal, or iron ore with `type: "iron-ore"`) and the logging camp - are
modelled. The check fails once a pending commodity has a producer, so the list is
emptied when they land.

## Where they live

Not on the design. A design module, and `design.ts` with its types, is bundled into
each of its models' JS files, so a number stated there would rewrite every model of the
module. The numbers live in two tables keyed by the exported model id, read only by
the export, the way the sounds do ([sounds.md](sounds.md)):

- `generator/trafficTable.ts` (`BUILDING_TRAFFIC`): `residents`, `jobs` (whole
  people), `produces` (tonnes per hour by commodity), `accepts` (commodities),
  `processes` (a recipe);
- `generator/capacityTable.ts` (`VEHICLE_CAPACITY`), split by family under
  `generator/capacity/` (rail units, rail cars, road / water / air): `seats` (whole
  people), `tonnes` and `commodities`.

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
defaults or in one of its variants: a building that generates, accepts or processes
something, a vehicle with seats or tonnes (a high-speed set's power car seats nobody, but its
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
a house `{ storeys: "one" }`. Field by field means a variant's `processes` or
`produces` replaces the design's whole (the extended steel mill restates its recipe),
and a vehicle variant states `tonnes` and `commodities` together.

This is not the exact-selection matching of `game.variants` (the running figures):
there a variant names a whole non-default selection, which would multiply a capacity
by every livery and colour. The capacity's variants therefore travel inside the block,
`game.capacity.variants`, not in `game.variants`.

## Checks

`exportMeta` and `exportVehicleMeta` run `trafficProblems` on every confirmed design
and fail the build on any problem: a missing entry where one is needed, a block that
carries nothing at its defaults, an unknown field or commodity, a commodity at 0
(leave it out), a number below 0 or above the sanity bounds (people above 20,000 per
building field or 3,000 seats, production or a recipe's rate above 2,000 t/h, a stock
above 100,000 t, an input above 10 t per tonne, tonnes above 250,000), a fraction of a
person, a commodity listed twice, `tonnes` without `commodities` or the other way
round, tonnes above 0 with no commodity or a commodity with 0 tonnes, a processed
commodity produced from nothing, a recipe whose output is not a processed commodity
or among its inputs, with no inputs or a rate or stock of 0, a building that accepts
what its recipe already takes or produces what its recipe makes (checked for every
variant's selection), an empty `source`, and a variant without
parameters or numbers, with a parameter or value the design does not have, with
parameters that do not apply together, or listed twice. A whole build also fails
when a table names a model that does not exist. `test/traffic.test.ts` runs the same
checks over every confirmed design. The chain check is above ("The chain").

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
  industry producing a few to about 150 t/h by its kind and size. When the five cargo
  classes became commodities, each industry kept its old rate as its new rate or its
  recipe's rate.

Real figures sit beside the game's own tuning (queue caps, patience, token
milestones), which was made against its old guesses; a liner's or a freighter's real
capacity is far above what one stop gathers. Balancing is the game's.
