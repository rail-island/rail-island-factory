# Rail token prices

**Covers** - the price in rail tokens (RT) the game charges to unlock a design for an account's
collection: how a vehicle's price is worked out from its figures, its size and its looks, the
stated prices of the landmarks, the draught animals and the structure types, where the export
carries them and what the build checks.
**Code** - `generator/tokenPrices.ts`, `generator/catalog.ts` (`withTokenPrice`,
`exportVehicleMeta`, `exportMeta`), `generator/generate.ts` (the sizes, the whole-export check),
`generator/sets/setsExport.ts` (`setMeta`), `test/tokenPrices.test.ts`
**See also** - [game-properties.md](game-properties.md), [export.md](export.md), [sets.md](sets.md),
[parameters.md](parameters.md), [draft-animals.md](draft-animals.md)

## What is sold

The game's tokens come from badges and gameplay events (rail-island-webapp,
`docs/gameplay/badges-and-tokens.md`). Spending them unlocks one **whole design**: every
variant of it, every livery and look at once, the same `model:<id>` or
`structure:<kind>:<type>` row a gift grants. **A single look is never sold on its own**; the
looks are why a design costs more, not something to buy apart.

The factory prices everything collectible, the game's default package included: which items
are free is the game's decision (its `db/defaultPackage.ts`), not the factory's. Ordinary city
buildings, trees, woods, textures, props, characters, and rail, road and other
non-collectible set types carry no price.

| What | Where the price is | Exported as |
|---|---|---|
| every vehicle | worked out (below) | `tokenPrice` on its `vehicles.meta.json` entry and its `catalog.json` record |
| landmarks (the plaza landmarks, Big Ben, the Eiffel Tower, Prague Main Station) | `LANDMARK_TOKEN_PRICES` | `tokenPrice` on its `skyscrapers.meta.json` entry and record |
| draught animals | `ANIMAL_TOKEN_PRICES` | `tokenPrice` on its `catalog.json` record, and on every animal-drawn vehicle's `animal` parameter value (`vehicles.meta.json` and the records), which is where the game reads it |
| every type of a collectible set | `STRUCTURE_TOKEN_PRICES` | `tokenPrice` on the type in `export/sets/<set>.meta.json`, and on its site preview's record |

Every price is a step of `TOKEN_LADDER`: 50, 75, 100, 150, 200, 250, 300, 400, 500, 650, 800,
1000, 1250, 1500, 2000, 2500, 3000.

## A vehicle's price

`vehicleTokenPrice` takes the single-look price below, multiplies it by the looks' multiplier
and snaps it to the ladder. Speeds are the design's `game.maxspeed` (km/h), power `game.power`
(kW), weight `game.weight` (t); length is the longer horizontal extent of the default build and
height its vertical one, metres, from the build's own stats (no extra build).

| Kind | Single-look price, RT |
|---|---|
| locomotive, unit, metro | 100, + 50 / 100 / 200 / 350 / 550 / 800 above 60 / 100 / 140 / 180 / 230 / 280 km/h, + 50 / 100 / 150 from 1 / 3 / 6 MW; steam + 150, and + 100 more from 2 MW or 200 t |
| coach | 75, + 50 from 160 km/h, + 25 more from 200 km/h |
| wagon | 50; 75 from 40 t or 18 m |
| tram | 125, + 50 from 80 km/h, + 50 / 100 from 20 / 30 m |
| animal-drawn (rail or road) | 150 |
| bus | 125, + 100 from 15 m, + 50 from 4 m high, + 50 from 22 m; under 7 m 75 |
| truck | 75, + 50 from 300 kW, + 50 from 40 t, + 50 from 18 m, + 150 from 100 t |
| ship | by length: 100 under 15 m, 200 under 40, 350 under 100, 550 under 200, 800 under 300, else 1100 (on the ladder: 300, 500 and 1000) |
| aircraft | helicopter 400; supersonic (1500 km/h) 1500; big 1000, 1250 from 400 t; medium 650; small 300, 250 before 1950 |
| cable car cabin | 150; an aerial tramway's (jigback) 250; a signature cabin (`SIGNATURE_CABINS`) 300 |

A vehicle the rules cannot price states its single-look price in `VEHICLE_BASE_OVERRIDES`: the
three legacy airliners that declare no airport class. An aircraft without a class and
without an override fails the build.

### Looks

A design's **looks** are the product of the value counts of its look parameters,
`LOOK_PARAMS`: livery, body, colour, variant, version, operator, cover, length, seats (a freight vehicle's load is no parameter, [loads.md](loads.md)).
A train's length and car position (`unit`, `cars`, `trainCars`), loaded or empty (`load`), the
harnessed animal (`animal`, `team`) and a pose (`gear`) are the same vehicle and do not count.
Each look beyond the first adds 15 % (`LOOK_STEP`), at most x2.5 (`LOOK_CAP`): 2 looks x1.15,
5 looks x1.6, 11 and more x2.5. The CD 163's 13 liveries take a 300 RT locomotive to 800 RT.

## Checks

- A whole export fails when a vehicle, a landmark or an animal of the catalog has no price, a
  price is off the ladder, or a table names a model that does not exist
  (`tokenPriceProblems`).
- The sets' export fails when a collectible set's type has no price in
  `STRUCTURE_TOKEN_PRICES`, or the table names a set or type that is not collectible.
- `test/tokenPrices.test.ts` checks the rules, the looks, the ladder and the tables against the
  catalog and the set registry, and that every animal-drawn vehicle's `animal` values carry
  their species' price.

A new vehicle needs nothing: its figures price it. A new landmark, draught animal or set type
adds its price to the table in the same change. Prices are first guesses, tuned with the game's
token income; changing one is not a contract break (the game stores what was bought, not what
it cost).
