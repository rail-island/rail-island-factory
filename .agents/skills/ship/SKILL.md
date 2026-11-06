---
name: ship
description: Create or change a procedural ship (container ship, tanker, bulker, ferry, cruise ship, tug, sailing ship, small craft) on the hull kit (generator/hullKit.ts, generator/worldShips*.ts) - the triangle budgets (25,000 over 150 m, 15,000 below, 4,000 small craft), the hull form, the superstructure and deck detail every ship carries, axes, the waterline and draftFrac, OpenTTD and sounds, references and headless checks. Use whenever a ship model is added or changed in this repository.
---

# Ships

How to add or improve a ship. The reference for the code is
`docs/models/world-ships.md` (the kit) with its two design tables,
`docs/models/world-ships-cargo.md` and `docs/models/world-ships-passenger.md`; this
skill is the checklist. The three older ships in `generator/ships.ts`
(`docs/models/ships.md`) reproduce the webapp's GLBs and are not on the kit.

## Budget

| ship | full detail | distant model |
|---|---:|---:|
| ocean ships over 150 m | **25,000** | 100 |
| ships up to 150 m | **15,000** | 100 |
| small craft (`small: true`: rowing boats, dinghies, runabouts) | 4,000 | 100 |

`shipBudget(spec)` in `hullKit.ts` gives it; `test/worldShips.test.ts` checks every
sampled parameter combination. A budget is a ceiling, not a target, but a big ship
at 3,000 triangles is a bare hull with a box on it: **aim for about half the
budget or more** (a detailed container ship is 15,000-17,000 with its load, a
tanker or bulker 6,000-9,000, a 135 m general cargo ship 5,000-6,000). Spend the
triangles on what reads from the game's camera: the stacks' rows, the house's
decks and windows, the deck gear, the bow.

## A ship is a spec, not drawn by hand

A ship is a `ShipSpec` on the hull kit: a `HullForm` (metres, from the stern) and
a list of deck `items`. Add a new one to the module of its kind
(`worldShipsCargo.ts`, `worldShipsService.ts`, `worldShipsPassenger.ts`,
`worldShipsSmall.ts`): its spec function (`fooSpec(p?)`), the two named builders
(`shipFoo(p?)` = `worldShip(fooSpec(p))`, `shipFooLod(p?)` = `shipLod(fooSpec(p))`)
and its row in the module's list with `game` (displacement t, power kW, speed
km/h) and `references`. Extend the kit for what it cannot say; a new item kind
needs its `drawItem` case, its `lodItem` case if it is large, and a line in the
kit doc.

### Axes and the waterline

- Metres, **+X to the bow**, +Y up, +Z starboard, centred on length and beam, the
  keel on y = 0, catalog yaw 180. `u` in a spec is metres from the stern.
- The waterline is `draft`: the edge between the `bottom` paint and the `boot`
  top. `game.draftFrac` is measured off the built model; the suite checks it lands
  on that edge. A parameter that changes the draft or the height (a load) gets its
  own `draftFrac` automatically.
- Real size from the published figures: length over all, beam, depth to the
  main deck, draft, the house's decks (about 2.8-3 m each).

### The hull

- Pick the bow (`bulbous` for modern ocean ships, `raked`, `ice`, `barge`,
  `clipper`, `canoe`, `plumb`) and stern (`transom`, `cruiser`, `sternwheel`,
  `canoe`), the section (`round`, `vee`, `flat`, `keel`), `entry` and `run`
  (fuller for tankers and bulkers, finer for container ships and liners), the
  `sheer`, a `forecastle` and `poop` where the ship has them.
- Set **`fine: true`** on a detailed ship: twice the stations, a smooth entry
  and flare. It costs a few hundred triangles.
- Paint: `bottom`, `boot`, `hull`, optional `stripe`, `deck`; set them in
  `livery`. No lettering, names or company logos (trade marks); funnel colours
  and hull colours only.

## Detail every ship carries

A ship without these looks like a toy. The helpers are in `worldShips.ts`:

1. **The house** - `deckhouse({ ..., detail: true })` or `aftHouse({ ...,
   detail: true })`: deck edges overhanging each deck (`lip`), windows on the
   sides **and the front** of every deck, the wheelhouse's windows all round,
   bridge wings out to the ship's side. `aftHouse` also puts exhaust pipes in the
   funnel's mouth (`exhausts`), a mast with yard and radar, and with `freefall:
   <length>` the modern freefall lifeboat on its ramp over the stern plus a
   rescue boat (older ships: lifeboats in davits, the default).
2. **The fittings** - `fittings({ L, B, D, fc, aft, draft })`: the forecastle's
   bulwark, the anchors in their pockets each side of the bow, windlasses and
   bollards on the forecastle, mooring winches aft, the railing along the deck's
   edge (`rail`: its span, or false where a bulwark or crash rail runs), the draft
   marks and the bow thruster sign on the hull. A passenger ship takes
   `detailed(items)` (deck edges, front windows) and `passengerFittings()`; small
   craft use the items directly (`bulwark`, `edgeRail`, `strakes`, `anchors`,
   `mooring`, `marks`).
3. **The cargo gear of the type** - what makes the type recognisable:
   - container ships: hatch covers on coamings, `containers` with `rows: 2.5`
     (one stack per row of boxes, two colours each), `lashing` bridges in the bay
     gaps (`stacks()` and `bayGaps()` in `worldShipsCargo.ts`), a breakwater;
   - tankers: `tankDeck()` - cargo lines on their supports, the fire main, the
     `catwalk` on posts, the manifold and its crossovers, hose cranes, tank
     hatches, vent risers (`vents`);
   - gas carriers: Moss `spheres` with their domes and the walkway over them, or
     the membrane trunk deck with domes, vent masts and the compressor house;
   - bulkers: `bulkHatches()` - covers on coamings, ridged and ribbed; cranes on
     pedestals with their cabs; hold vents;
   - general cargo and wartime ships: derricks with their mast houses, cowl
     ventilators (`vents` with `cowl: true`), bulwarks along the well decks;
   - passenger ships: rows of windows and balconies, lifeboats along the boat
     deck, open decks with `rail`s, funnels in the line's colours.
4. **Masts, radar and lights** on the wheelhouse and the forecastle.

Check each against the reference photographs: count the decks, the hatches, the
cranes, where the house stands.

## The distant model

`shipLod(spec)` draws it from the same spec (100 triangles): the hull's plan
rings, then the largest blocks that fit. Small detail items have no LOD case and
are left out on purpose. Never let two LOD faces share a plane (the suite runs
`findCoplanarOverlaps`).

## OpenTTD, sounds, text

- Every ship has its OpenTTD entry in `generator/openttdTable.ts` (introduction
  year, capacity, cargo by type: containers `GOOD`, tankers `OIL_`, bulkers
  bulk, reefers `FOOD`, passenger ships `PASS`) and presets; run
  `pnpm openttd:ids` for a new ship or preset and commit `openttdIds.json`.
  **OpenTTD ids and model ids are stored in saved games: never rename one.**
- Sounds: the horn comes from the hull length; a steamship's whistle is stated in
  `generator/soundTable.ts`.
- A new title, parameter or value is exported text: finish with the
  `translate-text` skill.

## References

Every ship has `assets/ship-<name>/` (the id without `veh-`) with Commons
photographs (`pnpm refs:fetch`) and `SOURCES.md` with a `## Published figures`
section (dimensions, tonnage, power, speed; figures read off photographs marked
approx.). User uploads in `assets/_tmp/` are `git mv`ed into the ship's folder.

## Checking and showing

1. `pnpm exec vitest run test/worldShips.test.ts` (size, keel, waterline, budgets,
   LOD) and `pnpm exec vitest run test/worldFleet.test.ts` (registry, references,
   ids).
2. Render headlessly: `pnpm exec tsx generator/contactSheet.ts <out.png> --view 3q
   proc-vehicle-ship-<id>...` (variants with `--variants`), and close-ups of the
   bow, the house and the deck with a scratch script calling `renderGlbThumb(glb,
   768, { xRange: [x0, x1] })` (x in metres, bow +X). No browser.
3. `pnpm typecheck`, `pnpm test`, `pnpm build`; look at `export/thumbs/<id>.png`.
4. Send the user the three-quarter view, a side view and the close-ups, a
   before/after pair for a change, every variant (AGENTS.md, "Show the user the
   model"), and update the design table's triangle counts in the family doc.
