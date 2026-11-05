# World vehicle fleet

Status: proposed
Date: 2026-11-05
Area: new vehicle designs (aircraft, ships, buses, trucks, trams, cable car cabins), the
family kits they are built on, references under `assets/`, `generator/openttdTable.ts` and
`generator/openttdIds.json`, `text/`, `generator/soundTable.ts`, the test suite's sampling,
docs

The candidate list of the 510 models is in
[2026-11-05-world-vehicle-fleet-list.md](2026-11-05-world-vehicle-fleet-list.md).

## Context of the change

The factory holds few models in the six families the request names, mostly
reproductions of the webapp's hand-made GLBs or vlakosimdb transfers, all from Central
Europe or generic:

| family | today | built with | budget |
|---|---|---|---|
| aircraft | 8 (A.10, A380, 737-800, MD-11, 747-400, Beluga, light jet, small airplane) | `generator/aircraft.ts`, 2,750 lines; each airframe drawn by hand from shared helpers (`body`, `wing`, `fin`, `nacelle`, `wheel`, liveries) | 10,000 |
| ships | 3 (cruise ferry, hydrofoil, passenger ferry) | `generator/ships.ts`, station-and-band hull per ship | 40,000 family cap |
| buses | 9 designs (two Karosa families with 11 variants, Citaro, O 345 G, Urbino 15, ...) | `busKit.ts`, `busBody.ts`, `busAssembly.ts`, driven by vlakosimdb shapes | 10,000 |
| trucks | 4 (cistern semi, mixer, reefer semi, American truck) | `trucks.ts`, `photoTrucks.ts`, one cab-over shell | 10,000 |
| trams | 5 trams + the metro car and the San Francisco cable car | `tramKit.ts`, a vlakosimdb drawing-to-dimension map | about 15,000 (rail) |
| cable cabins | 3 (aerial tramway car, small gondola, chairlift chair) | `cableCabins.ts` | 8,000 |

Every new vehicle costs more than its geometry. The repository rules (AGENTS.md) require:

- a `game` block (weight, power, maxspeed, accel; draft or rope datums);
- its own `buildLod`;
- an OpenTTD entry (intro year, capacity, cargo, refits, presets) with ids from
  `pnpm openttd:ids`. That covers every family but cable cabins, which OpenTTD cannot hold;
- its title and parameter values in 14 languages;
- sound slots (derived, or stated in `soundTable.ts`);
- references committed under `assets/<name>/` with `SOURCES.md`;
- a regression-free `pnpm test` that stays **under five minutes**. Today it takes about
  four and a half (docs/guide/setup-and-build.md).

Hand-building 510 models the way the current 8 aircraft were built is not feasible: the
aircraft module alone would pass 100,000 lines, and the test suite would take more than
twice its limit.

## User request

Plan adding new models from around the world: 100 aircraft, 100 ships, 100 buses,
100 trucks/lorries, 100 trams, 10 cable car cabins.

## Decisions

### One model per real type, liveries and lengths as parameters

Each entry in the list is one design with its own id (`veh-<maker>-<type>`, e.g.
`veh-boeing-787-9`), because:

- the game's saved maps store model ids;
- each OpenTTD vehicle needs an id;
- each type gets its own catalog page.

Operators' liveries, body lengths of one type (A320 / A321), cab and trailer choices
and door counts are enum parameters ([../models/parameters.md](../models/parameters.md)),
with the OpenTTD presets picking the interesting ones. So "100 aircraft" is 100 ids,
with liveries on top. **Ids are frozen the day they ship**: a list entry that changes
before shipping is renamed in the list, never after.

### Data-driven kits: a model is a spec record, not a module

Each family gets a kit that builds a whole vehicle from a typed spec. The spec holds
dimensions, stations, part choices and liveries. It may add a small `extra(m)` hook for
what the kit cannot say (the Beluga's bulge, a junk's sails). The kits are extracted
from today's code, and the existing designs are moved onto them only where their
bytes stay identical (deterministic output rule). Otherwise the existing designs keep
their own code.

| kit (new module) | from | spec covers |
|---|---|---|
| `airframeKit.ts` | `aircraft.ts` helpers (`body`, `wing`, `fin`, `nacelle`, `wheel`, `paintedBody`, `liveryFin`, decals) | fuselage stations (nose type, tube, tail cone, double deck), wing planform (span, sweep, dihedral, position low/mid/high), engines (wing pods, rear fuselage, tail, props, turboprop nacelles; count), empennage (conventional, T, cruciform, twin), gear (tricycle, taildragger, floats, hull), windows, livery decals |
| `rotorKit.ts` | new, on `airframeKit` | helicopter pod-and-boom, main and tail rotor as parts with a `time` spin clip ([../models/animation.md](../models/animation.md)), skids or wheels |
| `hullKit.ts` | `ships.ts` station-and-band builder | hull form (bow: raked, bulbous, ice, barge, canoe; stern: transom, cruiser, sternwheel), sheer, waterline band, deck furniture blocks (superstructure tiers, bridge wings, funnels, masts, cranes, hatch covers, container stacks, tank domes, LNG spheres), sails (square, gaff, lateen, junk) |
| `busKit.ts` (extended) | today's kit, freed from vlakosimdb shapes | length, height, floor (high, low, low-entry), single or double deck, axles, articulation (`assembleBus`), front and rear masks from a mask library, doors, window band, roof pods (AC, batteries, CNG), trolley poles as a `liftable` mechanism |
| `truckKit.ts` | `trucks.ts`, `photoTrucks.ts` | cab library (EU cab-over day/sleeper/high-roof, US conventional long/short hood, US cab-over, Japanese/Chinese narrow cab-over, bonneted historic, kei, off-highway), chassis axles (4x2 .. 8x8), bodies (box, curtain, reefer, tank, tipper, flatbed, logs, mixer, refuse, crane, car carrier, fire), semi-trailers and full trailers behind the `truck`/`trailer` split, road trains as further trailers |
| `tramKitSpec` (in `tramKit.ts`) | today's tram kit, a dimension-driven path beside the vlakosimdb map | car sections and modules (rigid, two- and three-section articulated, multi-articulated low-floor on floating modules, Jacobs bogies), ends from a front library (Tatra, PCC, Duewag, Citadis-like, retro), single or double deck, open sides, trolley pole or pantograph, bogie types |
| `cabinKit.ts` | `cableCabins.ts` | cabin shell (gondola, funitel, 3S, large aerial tram, double-deck, open-top, rotating floor), hanger and grip, glazing, seats, livery; the rope and sill datums |

Each kit ships with its family's LOD adapter (docs/models/lod.md), so every spec gets its
`buildLod` from the kit. That satisfies the "every design supplies its own low level"
rule without a generic fallback: the adapter reads the same spec.

### Budgets per family

| family | budget | note |
|---|---|---|
| aircraft, helicopters | 10,000 (as today) | jumbo jets near the cap, light aircraft about 3,000 |
| ships | 20,000 for ocean ships over 150 m, 10,000 below, 4,000 for small craft | under today's 40,000 family cap; container stacks as boxes |
| buses | 10,000 | articulated and double-deck included |
| trucks | 10,000 | a road train with three trailers included |
| trams | 15,000 | multi-section low-floor included |
| cable cabins | 8,000 | as today |

### References: committed, small, licensed

Every model gets `assets/<name>/` with:

- **one or two photographs** from Wikimedia Commons or the maker's press kit, each with
  a free licence or explicit permission;
- **a published dimension source** (data sheet, Wikipedia infobox, drawing);
- `SOURCES.md` recording each file, its origin, author, licence and use.

Photos are stored as JPEGs at no more than 1,280 px on the long side and about 250 KB
each. That keeps the 510 folders near 150 to 250 MB in total. A new script, `pnpm
refs:fetch <name> <commons-file> ...`, downloads Commons files with their licence
metadata and writes the `SOURCES.md` rows. No reference stays only in a scratch
directory.

### Tests: every check stays, run on a covering sample of each kit family

510 designs at today's per-design cost would take the suite to about ten minutes. The
rule is to test fewer designs, never to drop a check. So:

- **Every spec, every run, without a build:** data checks over the spec records. These
  cover:
  - dimensions in range for the family;
  - the OpenTTD entry and ids;
  - text in all languages;
  - the `assets/<name>/SOURCES.md` file;
  - the game properties;
  - a livery for each value of each parameter.

  They take milliseconds each.
- **A covering sample gets the full catalog sweep** (flicker, determinism, the JS model
  against the generator, LOD, rig poses, doors). The sample is fixed and chosen so that
  every value of every spec field and kit option appears at least once (a greedy cover in
  `test/catalogCache.ts` beside `variantsUnderTest`). It also always includes each
  family's largest design. That is about 10 to 15 % of each kit family. A kit change
  that adds an option adds a design to the cover automatically.
- **`pnpm build` keeps checking every design** (budget, z-fighting guard, envelope), as
  it does for the whole-export tests today. A design outside the sample can still fail
  the build, so nothing goes unchecked.
- Phase 0 measures the cost per design first. It also moves `test/catalog-*.test.ts`
  from 16 to more shards if a shard becomes the long pole.

### OpenTTD

Each aircraft, ship, bus, truck and tram gets:

- its `openttdTable.ts` entry: real introduction year, capacity, cargo (a container
  ship carries `GOOD`, a tanker `OIL_`, a bulker `COAL`/`IORE`/`GRAI` by refit, a
  reefer ship `FOOD`, a car carrier `VEHI` where the climate has it);
- presets for the liveries worth exporting;
- ids from `pnpm openttd:ids`.

Cable cabins have no OpenTTD feature and are left out. The GRF today holds 607 ids.
Phase 0 checks that the encoder and OpenTTD's per-feature engine limits take another
about 900 (types plus presets), and splits the export into one GRF per family if not.

### Text

Most titles are proper nouns and go to `text/verbatim.json` (`Boeing 787-9`,
`Routemaster`). Generic ones are translated with the `translate-text` skill in the same
wave, as are livery and parameter values (`Container ship`, `double-deck`). Among them
are `Panamax container ship`, `Stern trawler`, `Horse tram` and the operators' livery
names that are not proper nouns.

### Sounds and game properties

- **Sounds:** a vehicle's horn, engine or bell slots are derived from its traction and
  weight. A ship's slots come from its hull length. Exceptions go to `soundTable.ts`:
  steam ships, sailing ships, horse trams, trolleybuses and helicopters, which need a
  rotor sound. Phase 0 checks that rail-island-music has a design for each new
  character, and lists the missing ones as requests to that repository.
- **Game properties:** weight, power, maximum speed and acceleration come from the
  same published data as the dimensions. A ship states its `draftFrac`, a cabin its
  `ropeFrac` and `boardFrac`.

### Rollout in waves

- **Phase 0, kits and harness.** For each family it delivers:
  - the kit and its LOD adapter;
  - the test cover;
  - `refs:fetch`;
  - the OpenTTD capacity check;
  - three pilot models, sent to the user as images.

  Order: cable cabins, buses, trucks, trams, aircraft, ships. That runs from the
  smallest kit to the largest, and from the most to the least reusable code.
- **Waves of 10 to 25 models**, one family per wave, one branch and one spec record
  per wave. Each wave carries everything for its models:
  - specs and references;
  - OpenTTD entries and ids;
  - translations;
  - the family doc's table rows;
  - a contact sheet per family (`generator/contactSheet.ts --variants`) and the
    three-quarter and side views sent to the user.

  That makes about 25 waves after Phase 0. The `vjp-night-worker` skill can run the
  queue once the wave specs are agreed.
- **Docs:** each new family module gets its doc under `docs/models/`, at most about 600
  lines and indexed in `docs/README.md`. Large families are split by region or kind
  (`aircraft-jets.md`, `aircraft-props.md`, `helicopters.md`, `ships-cargo.md`,
  `ships-passenger.md`, `ships-small-craft.md`, `buses-world.md`, `trolleybuses.md`,
  `trucks-world.md`, `trams-world.md`). The existing docs keep their models.

## Database and persistent storage

- **New, frozen once shipped:**
  - 510 model ids;
  - their OpenTTD ids in `generator/openttdIds.json`, including the presets' ids;
  - their phrasebook keys.
- **Not changed:** no existing id, OpenTTD id or set id is renamed or reused.
- **Game import:** not part of this work (AGENTS.md: publishing is a separate step). The
  game may need new groups or behaviour, which is listed under risks.

## Architecture decisions

- **Spec records over modules.** 510 models are only maintainable as data on a few kits.
  A shape fix in a kit improves every model on it. The cost is that a kit change moves
  many models' bytes at once, which must be intended and visible in the contact sheets.
- **Existing designs stay put unless byte-identical.** Their ids, thumbnails and saved
  maps never move as a side effect of the kit extraction.
- **Covering sample over full sweep.** It keeps the five-minute rule. `pnpm build` still
  checks every design, so a failure outside the sample breaks the build, not the game.
- **Liveries as parameters.** They keep the id count at the requested 510, put an
  airline or operator on one page, and let the OpenTTD presets choose among them.

## Weaknesses and risks

- **Scale in the game.** Real sizes run from a 2 m kei truck to a 400 m container ship
  and an 84 m An-225. The game's ports, airports, roads and turning radii may not take
  the largest ones: road trains, Valemax, Triple E, BelAZ. They need a game-side size
  class, or the list drops them. **To decide with the user** before the ship and
  aircraft waves.
- **New game behaviour.** Helicopters (rotor spin, vertical take-off), trolleybuses
  (overhead wire, poles), hovercraft and hydrofoils, sailing ships, guided rubber-tyred
  trams (Translohr) and horse trams need behaviour the game may not have. The factory
  can model them, but the game may treat them as plain vehicles until it learns more.
- **Reference licences.** Not every type has a free photo. Some historic and regional
  types (a Pakistani jingle bus, the Havana camello) have few. Those are modelled from
  drawings and published dimensions, and the list is changed where nothing usable
  exists.
- **Repository size.** References add 150 to 250 MB. If that is too much, the policy
  needs to change: one photo per model, or git LFS for `assets/`.
- **Test time.** The covering sample keeps the suite under five minutes only if the
  per-design sweep cost stays where it is. Phase 0 measures it and adds shards first.
- **Build and site.** About 500 more thumbnails, JS models and SEO pages lengthen `pnpm
  build`, the listing and the sitemap. Phase 0 measures the build time and the listing's
  first render with 500 dummy entries.
- **OpenTTD limits.** About 900 more ids in one GRF may pass a per-feature limit.
  Splitting by family would change how players load the GRF, though not the ids.
- **Accuracy of the list.** The list is drawn from general knowledge. Years, makers and
  dimensions are checked against the references when each model is built, and an entry
  whose facts do not hold is corrected before it ships.
- **Brand and livery use.** Real operators' liveries and wordmarks are drawn as on the
  existing A380 and 737. Trademarked logos stay simplified, as today.

## Out of scope

- Publishing to the game (a separate step).
- Cars, vans and pickups outside the truck list, military vehicles and warships.
- New station, port or airport structures for the larger vehicles.
- Railway vehicles other than trams (metro and light rail appear only where they run as
  trams).

## Open questions for the user

1. Are very large vehicles wanted at their real size, or should the list stop at what
   the game can place today? These are ships over 300 m, the An-225, mining trucks and
   road trains.
2. Are trolleybuses part of the 100 buses, as the list proposes, or a separate family?
3. Is 150 to 250 MB of references in git acceptable, or should it be one photo per
   model or LFS?
4. Is the wave order right (cabins, buses, trucks, trams, aircraft, ships)?
