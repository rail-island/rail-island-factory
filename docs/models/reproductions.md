# Reproductions of the webapp's models

**Covers** - the 25 procedural models that reproduce hand-authored GLBs of the webapp's
model database: which photo and which webapp model each comes from, the ids, the shared
rules (same axes and size as the reference, triangle budgets), and what a later webapp
import has to change.
**Code** - `generator/churches.ts`, `generator/cathedrals.ts`, `generator/gothicCathedrals.ts`, `generator/gothicParts.ts`, `generator/landmarks.ts`,
`generator/stations.ts`, `generator/aircraft.ts`, `generator/ships.ts`,
`generator/cableCabins.ts`, `generator/trucks.ts`, `generator/generate.ts` (`FAMILIES`,
`BUILDINGS`, `ALL_VEHICLES`, `designSource`), `test/referenceModels.test.ts`, `assets/<model>/`
**See also** - [churches.md](churches.md), [cathedrals.md](cathedrals.md),
[gothic-cathedrals.md](gothic-cathedrals.md),
[landmarks.md](landmarks.md), [stations.md](stations.md), [aircraft.md](aircraft.md),
[ships.md](ships.md), [cable-cabins.md](cable-cabins.md), [trucks.md](trucks.md),
[export.md](export.md)

The eight third-party Towers are documented separately in [towers.md](towers.md).
They retain their existing `tower-*` ids and convert authoring units to metres.

## Where they come from

The webapp (`rail-island-webapp`) ships a set of models authored as GLB by hand from
photos: landmarks and stations in `db/buildings/glb/`, and the aircraft, ships, cable car
cabins and trucks in `db/aircraft/`, `db/ships/`, `db/cablecar/` and `db/trucks/`. The
photos they were made from live here, one folder per model under `assets/`, named after
the webapp model; the site shows them on each model's Images tab. The factory rebuilds
each of those models from code, so it can be changed, measured and regenerated like the
rest of the catalog.

| Factory id | Webapp model | Photos (`assets/`) | Module |
|---|---|---|---|
| `bld-baroque-church` | `buildings/baroque-church` | `baroque-church/` | `churches.ts` |
| `bld-church-vrchlabi` | `buildings/church-vrchlabi` | `church-vrchlabi/` | `churches.ts` |
| `bld-twin-tower-baroque-church` | `buildings/twin-tower-baroque-church` | `twin-tower-baroque-church/` | `churches.ts` |
| `bld-st-basils-cathedral` | `buildings/st-basils-cathedral` | `st-basils-cathedral/` | `cathedrals.ts` |
| `bld-st-nicholas-church` | `buildings/st-nicholas-church` | `st-nicholas-church/` | `cathedrals.ts` |
| `bld-notre-dame` | `buildings/notre-dame` | `notre-dame/` | `gothicCathedrals.ts` |
| `bld-prague-castle-st-vitus` | `buildings/prague-castle-st-vitus` | `prague-castle-st-vitus/` | `gothicCathedrals.ts` |
| `bld-brandenburg-gate` | `buildings/brandenburg-gate` | `brandenburg-gate/` | `landmarks.ts` |
| `bld-louvre-pyramid` | `buildings/louvre-pyramid` | `louvre-pyramid/` | `landmarks.ts` |
| `bld-white-house` | `buildings/white-house` | `white-house/` | `landmarks.ts` |
| `bld-prague-main-station` | `buildings/prague-main-station` | `prague-main-station/` | `stations.ts` |
| `bld-station-building` | `buildings/station-building` | `station-building/` | `stations.ts` |
| `bld-station-halt` | `buildings/station-halt` | `station-halt/` (Mikulasovice) | `stations.ts` |
| `bld-suburban-station` | `buildings/suburban-station` | `suburban-station/` | `stations.ts` |
| `veh-aero-a10` | `aircraft/aero-a10` | `aero-a10/` | `aircraft.ts` |
| `veh-airbus-a380` | `aircraft/airbus-a380` | `airbus-a380/` | `aircraft.ts` |
| `veh-light-jet` | `aircraft/light-jet` | `light-jet/` | `aircraft.ts` |
| `veh-cruise-ferry` | `ships/cruise-ferry` | `cruise-ferry/` | `ships.ts` |
| `veh-hydrofoil-ferry` | `ships/hydrofoil-ferry` | `hydrofoil-ferry/` | `ships.ts` |
| `veh-passenger-ferry` | `ships/passenger-ferry` | `passenger-ferry/` | `ships.ts` |
| `veh-cablecar-cabin` | `cablecar/cablecar-cabin` | `cablecar-cabin/` | `cableCabins.ts` |
| `veh-gondola-cabin` | `cablecar/gondola-cabin` | `gondola-cabin/` | `cableCabins.ts` |
| `veh-cistern-semi-truck` | `trucks/cistern-semi-truck` | `cistern-semi-truck/` | `trucks.ts` |
| `veh-mixer-truck` | `trucks/mixer-truck` | `mixer-truck/` | `trucks.ts` |
| `veh-reefer-semi-truck` | `trucks/reefer-semi-truck` | `reefer-semi-truck/` | `trucks.ts` |

The webapp's `boeing-737`, `ocean-liner` and `cabin-classic` have no source photo here
and no reproduction yet.

**Ids.** The factory's prefix (`bld-` for a building, `veh-` for a vehicle) plus the
webapp model's GLB name, as `veh-american-truck` stands for the webapp's
`american-semi-truck`. The ids are stored in saved maps once imported, so they are never
renamed.

## The rules they share

- **Same axes, same size.** Each design keeps its reference GLB's orientation (front,
  nose or bow on the same axis and side) and bounding box. The webapp's catalog fields are
  measured off those bounds - a building's `defaultScale`, an aircraft's or ship's `yaw`
  and `targetLength`, a ship's `draftFrac`, a cabin's `ropeFrac` and `boardFrac` - so they
  stay valid for the reproduction. `test/referenceModels.test.ts` holds the references'
  boxes and fails any axis more than 10 % off; most designs are within about 1 %.
  St Vitus's more articulated transept is about 4 % wider than its reference.
- **Triangle budgets** (same test): trucks 12,000, cable cabins 8,000, aircraft 20,000,
  Notre-Dame and St Vitus 30,000, everything else 40,000. Most reproductions use well under half of their reference's count
  (the Brandenburg Gate's reference has 217,000).
- **Look.** The reference's massing and colour scheme, with detail taken from the photos
  where the reference lacks it; each family doc lists its deviations.
- The usual factory rules: every primitive in a named scope, no z-fighting, deterministic.

## Catalog fields

The buildings go into `skyscrapers.meta.json` with the category, pool and `defaultScale`
of the webapp entry they reproduce (`Historical` / `hist_center`, or `Station` / `station`);
the vehicles into `vehicles.meta.json` as `Aircraft`, `Ships`, `Cable car` and
`Road vehicles` ([export.md](export.md)).

## What a webapp import has to change

The factory's GLB has one node per part, not the reference's named sub-nodes, so entries
that name nodes must be rewritten when these models are imported:

- **Trucks.** `trucks.meta.json`'s `articulation` names nodes such as `kingpin`,
  `front_wheel_L`, `axle_0`. The semi-trucks here have two parts, `truck` and `trailer`
  (the trailer node's pivot is the king pin); the mixer is rigid.
- **Aircraft.** The A380 and the light jet have parts `airframe` and `gear`, which is the
  node name the webapp retracts in flight. The Aero A.10's gear is fixed.
- **Gondola.** The reference GLB itself disagrees with its `ropeFrac`/`boardFrac` (they were
  measured off an older, taller model); the reproduction follows the meta numbers, so the
  rope runs through the grip and the door sill meets the platform
  ([cable-cabins.md](cable-cabins.md)).
