# Passengers and cargo

**Covers** - the numbers the game's passenger and cargo engine reads from each model:
a building's residents, jobs and supply-chain role - what it makes from nothing,
consumes, or processes by a recipe, and a tourist destination's visitors (`game.traffic`) - and a vehicle's seats, tonnes
and the commodities it may carry (`game.capacity`); the commodities, the chain and
its check, the per-minute unit and its marker, the tuning, which designs must state
their numbers, variants and how they match, the checks, the export and where the
numbers came from.
**Code** - `generator/traffic.ts` (`COMMODITIES`, types, `mustCarry`,
`trafficProblems`, `TRAFFIC_UNIT`, `exportedBlock`, `exportedTraffic`, `resolvedNumbers`,
`chainOf`, `chainProblems`),
`generator/trafficTable.ts` (buildings),
`generator/capacityTable.ts` and `generator/capacity/*.ts` (vehicles),
`generator/catalog.ts` (`withTraffic`, `checkTraffic`, `supplyChainProblems`),
`generator/generate.ts` (the stray-id and chain checks), `generator/text.ts`
(`COMMODITY_LABELS`), `test/traffic.test.ts`, `test/export.test.ts`
**See also** - [game-properties.md](game-properties.md) (the rest of `game`),
[sounds.md](sounds.md) (the other table kept apart from the designs), [export.md](export.md),
[text.md](text.md) (the commodity names),
[../site/workshop.md](../site/workshop.md) (drafts), [../site/chains.md](../site/chains.md) (the site's Chains tab, drawn from these blocks)

## What the game does with them

The game's traffic engine (its `docs/gameplay/traffic.md`) makes every placed building
generate groups of passengers and cargo with a target building, and carries them on
the player's vehicles up to their capacity. A building generates
`5/60 x residents` passenger trips per minute of game time (the game's constant: the
factory states people, not trips) - to work, to a visitor site or elsewhere; a worker
and a tourist travel back home after their stay, so jobs and visitor sites start no
trips of their own - and its `produces` rates of
raw commodities and mail; a processor turns delivered inputs into its
output by its recipe and makes nothing without them; a building attracts passengers
by its free jobs, its free visitor places and its residents and takes in the commodities it `accepts` or its recipe
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
**A unit is one tonne, and every rate is per minute of game time** (see "The unit
marker" below). Passengers are people: a vehicle's `seats` count every
passenger it takes, seated and standing; they are not a commodity.

The names are exported text (`commodity.<id>`, `COMMODITY_LABELS` in
`generator/text.ts`, translated like the categories: [text.md](text.md)), so the game
shows them with `ft`.

## Roles and recipes

A building's `game.traffic`:

```ts
{
  residents?: number; jobs?: number;          // whole people
  unit?: "min";                               // the rates' unit; on every non-empty block (export only)
  produces?: { [commodity]: tonnesPerMinute }; // made from nothing: raw commodities, mail
  accepts?: commodity[];                      // consumed on delivery: towns and sinks
  processes?: {                               // a processor's recipe
    output: commodity;                        // a processed commodity
    inputs: { [commodity]: tonnesPerTonneOfOutput };
    rate: number;                             // at most this many t of output a minute
    stock: number;                            // stockpile cap in t, per input (about 10 minutes)
  };
  visitors?: { capacity: number; stayMin: number }; // a tourist destination (below)
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

## Visitor sites

A tourist destination - a cathedral, a castle, a monument, a lookout tower - states
`visitors`: `capacity`, how many tourists it holds **at once** (a whole number above
0, at most 20,000), and `stayMin`, their mean stay in minutes of game time (above 0,
at most 240). A variant replaces it whole (a castle's keep holds fewer than its
fortress). The game sends people from their homes to it, keeps them there for the stay
and sends them back home the way they came; its pull falls as it fills, so the
capacity is its absorption - independent of its staff, which stay `jobs`. Workplaces
need no field: the game treats every job the same way (a worker travels in, stays
and travels home), the job count being its capacity. Visitors alone are a role, so a
statue with no staff states only `visitors`.

The capacities follow the site's fame (`trafficTable.ts`): a village chapel or a
market cross 30-40, a parish church 100-150, a lookout tower 80, a town's main
church or town hall 300-800, a capital's monument 800-1,500, and the world's most
visited sites 2,000-3,000 (Notre-Dame, Hagia Sophia, the Colosseum, the Taj Mahal,
the Eiffel Tower, Prague Castle and the Louvre). A stay runs from 5 minutes (a
column, a gate) to 25 (a castle, a museum). Like every number here they are first
drafts; the balance is the game's.

## The chain

| Commodity | Made by | Taken by |
|---|---|---|
| grain | farm (`industry-farm`) | food plant (`ind-building-a`) |
| wood | logging camp (`industry-logging-camp`) | goods factories (`ind-building-h`, `ind-building-k`) |
| coal | mine (`industry-mine`) | steel mill (`industry-factory-a`); power plant, coal type (a sink) |
| iron-ore | mine, `type: iron` | steel mill |
| oil | oil pump (36 t/min, large 72), offshore platform (1,800 t/min) | refineries (`chemical-factory`, both types) |
| food | food plant: 1 t grain -> 1 t food, 180 t/min (extended 264) | homes, shops and landmarks, the warehouse (`ind-building-s`), the offshore platform |
| steel | steel mill: 1 t iron ore + 0.5 t coal -> 1 t steel, 360 t/min (extended 540) | goods factories |
| fuel | refinery: 1 t oil -> 1 t fuel, 480 t/min (refinery type 960) | shops (corner shop, market block, shop, annex), tank farm (`ind-detail-tank`), power plant (default oil and gas type) |
| goods | goods factory: 0.5 t steel + 0.5 t wood -> 1 t goods, 144 t/min (`h`, extended 216) and 120 t/min (`k`, extended 180) | homes, shops, offices and landmarks, the warehouse, the offshore platform |
| mail | homes, shops, offices, landmarks | homes, shops, offices, landmarks |

The model ids above drop their `proc-building-` prefix. The raw producers: farm
180 t/min (large 300), logging camp 144, coal mine 300, iron mine 360. A processor's
stock cap is ten minutes of its input ("The tuning"). Offices (the glass, bullet, dark slab, art deco, pagoda,
pyramid and twin-tower skyscrapers) take goods and mail; homes and shops food, goods
and mail; the nuclear power plant takes no commodity. The rates are first drafts;
balancing is the game's.

**The chain check.** A whole build (`generate.ts`, `supplyChainProblems`) fails when a
commodity has no confirmed building that makes it (`produces` or a recipe's
`output`), none that takes it (`accepts` or a recipe's input), or no confirmed vehicle
that carries it, over every confirmed design at its defaults and in each of its
variants (`chainOf`, `chainProblems`); `test/traffic.test.ts` runs it too.

## The unit marker

Every rate - `produces`, a recipe's `rate` - is **tonnes per minute of game time**;
a `stock` is tonnes. The export writes `unit: "min"` (`TRAFFIC_UNIT`,
`exportedTraffic`) as the first key of every **non-empty** building `game.traffic`
block; an empty `{}` stays `{}`, a variant carries no unit (the block's applies), and
a vehicle's `game.capacity` has none (seats and tonnes are no rates). The table does
not state it: `trafficTable.ts` is per minute throughout. A block without the marker
is an older per-hour export, and the game divides its rates by 60, so an old import
is never read 60 times too high.

## The tuning

The figures are game tuning, not real output. They were set per hour once and
retuned when the game moved to minutes (the webapp's travel-time demand spec), by
three rules applied to every design and variant:

- **The chain: x12 of the old hourly figure, per minute.** A raw `produces` and every
  recipe `rate` is the old t/h times 12, in t/min. The target is that a standard coal
  mine fills a 5-wagon train (5 x 58 t) in about a minute: 25 t/h -> 300 t/min. One
  factor for the whole chain keeps every ratio (farm : mine : oil, a recipe's rate
  against its suppliers).
- **Mail: x10/60.** Mail stays town-scale - a town of about 100 buildings makes about
  1 t a minute - so a house's 0.01 t/h became 0.0017 t/min (rounded to 4 decimals,
  never to 0). Any other commodity a town produces would follow mail.
- **Stock: 10 minutes of input.** `stock = 10 x rate x the largest input ratio`,
  rounded: a steel mill at 540 t/min with 1 t ore and 0.5 t coal per tonne keeps
  5,400 t.

Residents, jobs and `accepts` did not change; the game's per-minute passenger
constants (`5/60` a resident, `2.5/60` a job) carry the passengers' retune. The
sanity bounds below are per minute too.

## Where they live

Not on the design. A design module, and `design.ts` with its types, is bundled into
each of its models' JS files, so a number stated there would rewrite every model of the
module. The numbers live in two tables keyed by the exported model id, read only by
the export, the way the sounds do ([sounds.md](sounds.md)):

- `generator/trafficTable.ts` (`BUILDING_TRAFFIC`): `residents`, `jobs` (whole
  people), `produces` (tonnes per minute by commodity), `accepts` (commodities),
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
building field or 3,000 seats, production or a recipe's rate above 2,000 t/min, a stock
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
`source` is dropped, and a non-empty building block gains `unit: "min"` first ("The
unit marker"). The coal mine lands as:

```json
"traffic": {
  "unit": "min",
  "jobs": 120,
  "produces": { "coal": 300 },
  "accepts": ["fuel"],
  "variants": [{ "params": { "type": "iron" }, "produces": { "iron-ore": 360 } }]
}
```

A building without other game properties gets a `game` block holding only `traffic`.

The webapp reads `unit` and converts a block without it (an older per-hour export)
to per minute; its `master` accepts `traffic` among a building's `game` keys, and its
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
  industry first producing a few to about 150 t/h by its kind and size, now 36 to
  1,800 t/min ("The tuning"). When the five cargo classes became commodities, each
  industry kept its old rate as its new rate or its recipe's rate.

Real figures sit beside the game's own tuning (queue caps, patience, token
milestones), which was made against its old guesses; a liner's or a freighter's real
capacity is far above what one stop gathers. Balancing is the game's.
