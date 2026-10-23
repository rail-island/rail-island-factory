# Factory structures and textures

Spec: docs/specs/2026-10-23-factory-structures-and-textures.md
Date: 2026-10-23
Status: implemented
Area: rail-island-factory (generator/sets, generator/surfaces.ts, generator/props, text/,
assets/textures, the site's catalog); rail-island-webapp (core/sets.ts, every structure builder
in core/rail and core/air, core/city, core/hydrology/Dam.ts, render/surfaces.ts, render/propLayer.ts,
RailMesh, TramMesh, DamMesh, the import pipeline, i18n/factoryText.ts)

## What was done

All eight phases are built, each committed on its own in both repos, on the branch
`claude/compassionate-allen-r49vw5`. The harness fixed that branch name for the session, so the
skill's usual `claude/<feature-slug>-<hex>` branch was not cut.

- **Phase 0 - foundations.** The factory owns every content set: ids, picker order, defaults,
  retired aliases and collectibles (`generator/sets/registry.ts`). It exports
  `export/sets/<set>.meta.json` and, once a set lands, an import-free module with its `.d.ts`.
  The factory also exports every text the game shows from it in all 14 languages, from
  phrasebooks in `text/`, filled by the new `translate-text` skill and checked by
  `test/text.test.ts`.
  - The game generates `db/procedural/sets/registry.ts` from the metas. `core/sets.ts` serves
    the ids, unions, collection list, gating and every `resolveType` from it. The game reads
    names through `ft`; its own keys for factory text are gone.
  - Unknown ids now follow one policy: kept verbatim on save, drawn as their alias or as the
    set's default.
  - Defects fixed: the bus-stop commit path checks the collection, and road-station types
    resolve on load.
- **Phase 1 - textures.** The 15 photo sets, their sources and the fetch script (no longer
  macOS-only) live in the factory's `assets/textures`. `generator/surfaces.ts` names every look
  (photo, tile, tint, fill, flat colour), capped at 16 sets by a test.
  - The game mirrors them into `db/textures`. `render/surfaces.ts` replaces the scattered tint
    and tile tables at the same values.
  - Factory designs may name a surface on a material; the export then generates its UVs.
- **Phase 2 - city presets and block types.** City presets live on the building designs. Block
  types are a factory data set (pools, placement, facade style name, city weights and caps,
  families, decoration).
  - The import refuses block data that names an unknown facade, city type, ring or decoration.
  - Defect fixed: the tenement noise wall, with a regression test.
- **Phase 3 - props, stops, cable cars, ports, airports.** Fixed props are factory models
  (`proc-prop-*`, `props.meta.json`): cable-car sheds, port crane, container stack, hut,
  floodlight, bollard, mooring post, control tower, windsock. The game places them through
  `render/propLayer.ts`.
  - Sized parts are set functions: the bus-stop side assembly, the cable-car pylon, the airport
    terminal and furniture.
  - Site previews: `proc-preview-bus-stop` and `proc-preview-cablecar-pylon`.
- **Phase 4 - kits and cross-sections.**
  - Line decorations: envelope plus `buildPiece`.
  - Tunnel portals: `buildPortal` of the bore.
  - Rail and road types: full cross-sections; the road families are the set's groups.
  - Dams: body, surface, lock, arcade, gate leaves as named nodes.
  - A game test walks the Worker's import graph and fails if a set module becomes reachable from
    it (`test/workerSetBundles.test.ts`).
- **Phase 5 - stations.**
  - A rail station type is a layout recipe (TYPE_META) plus `furnish(type, length, layout)`.
  - A road station type is group, island width and `dress(type, site)` over the game's solved
    layout.
  - Defect fixed: the duplicated paired-type list. The catenary planner now asks the recipe
    (`test/catenaryPairedTypes.test.ts`).
  - Site previews: `proc-preview-station` and `proc-preview-road-station`.
- **Phase 6 - bridges.** The bridge set holds the kit and one function per type, run per span
  over a plain path that carries the game's deck support height and overhead clearance. It also
  holds the span policy, boundary piers, abutments and overhead members.
  - Ground supports are tagged `ground`, and `pierFootprints` charts by the tag. This fixes a
    steel detail that the old height test charted as a pier; regression test in
    `test/bridge.test.ts`.
  - Site preview: `proc-preview-bridge`, all 14 types drawn shape by shape.
- **Phase 7 - catenary styles.** `mast` and `pole` draw the railway mast and the tram pole from
  the heights the game passes. RailMesh and TramMesh hand each planned support to the style.
  - Site preview: `proc-preview-catenary`.

Every move is proven by pins:
- Before each move, the game hashed what every type draws from fixed inputs
  (`test/helpers/setPinCases.ts`, `test/fixtures/set-pins.json`), and the move kept every hash.
- The factory pins its own modules (`generator/sets/pinCases.ts`) and exports them in
  `sets/pins.json`; the game's import names every case it redraws.
- Three re-pins were deliberate, each in its own commit:
  - props removed from the port, airport and cable-car boxes, with the remaining boxes checked
    to be an unchanged, in-order subsequence;
  - the rail-type pin no longer hashing English titles;
  - one bridge footprint case, for the ground-tag fix.

Checks, run sequentially:

| Repo | `pnpm typecheck` | `pnpm test` | `pnpm build` |
|---|---|---|---|
| Game | clean | 561 files, 7414 tests | succeeds |
| Factory | clean | 96 files, 5422 tests, 11 skipped | succeeds |

- `TEST_ALL_VARIANTS=1` passes for every preview design.
- A full `pnpm import:factory` after the final factory build leaves the game's `db/procedural`
  unchanged.

## How to test

**Automated coverage.** None in a browser: neither repo has an E2E framework, and both
CLAUDE.md files restrict agents to headless checks. Coverage is the pins plus the suites above.
Run `pnpm test` in each repo; `test/setPins.test.ts` in both holds every shipped type's output.

**Setup.**
1. In `rail-island-factory`, run `pnpm build:models`.
2. In `rail-island-webapp`, run `pnpm import:factory`, then `pnpm build:assets`, then
   `pnpm dev`.
3. Sign in with a PLUS account (it owns every type), or use an account with the collection
   unlocked.
4. Open an existing island, preferably one with a city, a river, electric rails and trams.

**Steps.**
1. Open the rail tool's **Station** type picker. Build a 4-track station of each of the 8 types.
   - Each must look as it did before the change.
   - Paired types: one mast stands between the rails of each pair when the track is Electric.
2. Open the **Bridge** type picker. Build each of the 14 types across a valley, once on rails
   and once on a wide road.
   - Spans, piers, arches and towers must match the previous release.
   - Electric wires fix to truss bracing, tied-arch struts and cable towers.
3. Build electric track next to an existing line with **Multiple Rails**. A portal mast spans
   both tracks.
4. Build a tram road (Road tool, "Asphalt with tram"). Poles with bracket arms stand at the
   kerb.
5. Build a bus stop of each type, a road station of each of the 6 types in each layout, a
   cable car, a port of each type and an airport. The cranes, sheds, bollards, the tower and
   the windsock appear and match before.
6. Generate a city with tenements (city profile with a historic centre). A noise wall now runs
   along tenement frontages beside a rail line.
7. Place a dam of each type, including the lock variants. Run a ferry through a lock and watch
   the gate leaves swing outward.
8. Switch the UI language (Settings) to German and to Japanese. Station, bridge, road, rail and
   decoration type names are translated, and so are model titles in the pickers.
9. Load an island saved before the change. Nothing moves or disappears. A stored type the build
   does not know draws as its set's default.
10. Open the factory site (`pnpm dev` in the factory). The "Structure types" chip lists the six
    previews; each shows its types through the Type parameter.

**Also worth trying.**
- A deck-truss bridge over a sloping bank. Ships still route between its real piers; no phantom
  pier blocks the river.
- A station with an odd track count on a paired type. The lone track gets terminal masts only.
- The offline embedded build (`pnpm build:embedded`) still shows props and photos.

## What is missing

Nothing - the spec is implemented in full.

## Known problems

- The station module carries the rail pitch and ballast width as constants (8 and 5).
  `test/station.test.ts` holds them to the game's railType values, but they are not read from
  the railType set.
- Spec deviation on baselines: the game's pins live in the game's own fixtures, not the factory's
  test fixtures. The factory pins its own modules from its own inputs. Pins hash output only;
  there are no separate triangle-count or invariant baselines.
- The game's road and rail decks still read their ballast and deck bands from `Railroad`
  constants derived at module load from the default rail type's meta. A per-type ballast would
  need those reads moved per type.
- Site previews approximate:
  - glass is opaque and name boards stay blank;
  - the bridge preview's tapered tram pole is a straight prism;
  - bridge sweeps are drawn by a factory re-implementation of the game's mitred sweep.
- Set previews are held to 48 KB of JS (props to 24 KB), or to their GLBs when those are larger.
  They are never exported to the game.
- `catenaryStyle.mast` and `pole` ignore their style argument: each style draws one support kind.
  A second mast style needs real dispatch.
- The decoration, bridge and station modules keep the game's dimensions as module constants;
  only the heights the game must agree on are passed in.

## Recommended follow-ups

- Read the station module's rail pitch and ballast width from the railType set, then drop the
  guard test.
- Add a second catenary style (a concrete mast or a headspan) to exercise style dispatch.
- Let a rail type carry its own ballast bed per type, now that the cross-section is factory data.
- Show the photos on the bridge and station previews by naming surfaces on their materials.
- Run `update-translations` on the game's master: this change adds two keys in English and Czech
  (`toast.busstop_locked`, `city.block.named`) and drops the game keys the factory text replaced.

## Changelog

- The anti-noise wall along tenement frontages beside railways is generated again.
- Ships no longer steer around a phantom pier under some deck-truss bridges on sloping banks.
- Bus stops of a type you have not collected can no longer be placed.
- An island saved with a structure type this version does not know shows it as the default type
  instead of dropping or renaming it.
- Structure, rail, road and decoration type names, model titles and woods names are now
  translated into every supported language.
- The model catalog site previews every station, road station, bridge, bus stop, cable-car pylon
  and overhead-line support type.
