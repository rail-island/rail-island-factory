# Factory structures and textures

Status: draft
Date: 2026-10-23
Area: rail-island-factory (new structure and surface exports, site previews), rail-island-webapp
(structure builders, textures, city presets, collection and gating, import pipeline)

## Context of the change

The factory (this repository) builds every vehicle, building and tree the game draws, and since
the trees and woods move (docs/specs/2026-10-19-factory-trees-and-woods.md) it also exports
**code, not only models**: woods types are distribution functions keyed by stable names, bundled
into one import-free `woods.js` that the game imports synchronously. Everything else the game
draws as "structures" is still authored in the game, `rail-island-webapp`:

- **Structures are box lists.** A pure module per kind in the game's `src/core/rail/` (no Three.js)
  writes world-space box descriptors, and a thin `src/render/*Mesh.ts` merges them by material
  with `shell`/`support` LOD tags:
  - bridges: `Bridge.ts` (1,278 lines, 14 types). About 880 lines are type-independent path
    planning, framing and pier helpers; each type is a 5-45 line builder over shared helpers.
    The span policy, boundary pier style and overhead members (where catenary attaches) are
    per-type switches outside the builders.
  - rail stations: `Station.ts` (1,444 lines, 8 types), `StationLayout.ts`. A type is a layout
    recipe (rows of platform/rail/building) plus a furnish function over length and layout.
  - bus and tram stops: `BusStop.ts` (3 types, nearly fixed-size, one assembly per road side);
    road stations: `RoadStation.ts` (6 types x 3 layouts, a solver plus per-type dressing).
  - ports (6), airports (3), cable-car stations (4, fixed size per type), dams (5), tunnels (1),
    line decorations (wall, fence, guardrail, gallery), catenary parts, semaphores, road signs,
    crossing signals, the watchtower balloon and the lake-spring cottage.
- **Gameplay reads that geometry**, not only the renderer: bridge pier footprints feed ship
  navigation, bridge overhead members feed catenary, station layouts give track offsets. These
  builders run synchronously on every hover move of their tools, in Vitest and in the headless
  simulation runner.
- **Textures** are photo PBR sets in the game's `public/textures/` (15 sets x albedo/normal/rough
  at 512 px, about 4 MB, Poly Haven CC0, fetched by a macOS-only script). `pbrTextures.ts` binds
  them by file name, with per-consumer tint, fill and tile tables in `BridgeMesh`, `TunnelMesh`,
  `DamMesh`, `RoadMesh`, `BusStopMesh`, `AirportMesh` and `LineDecorationLayer`. Terrain uses
  11 of them as splat array layers bound to the material ids stored in each map's terrain grid.
  The factory has **no textures or UVs**: `MaterialSpec` is colour, metallic, roughness and
  optional vertex colours, and earlier factory specs excluded textures explicitly.
- **City block definitions** live in the game's `src/core/city/`: `BlockTypes.ts` (15 block
  types: placement, facade style, weighted factory pools), `cityTypes.json` (village, town,
  city), `CityProfiles.ts`, and `cityPresets.ts`, a per-pool list of `{design, params, weight}`
  naming factory designs. The factory already owns each building's pool (`group`) and its plaza
  and block-shape rules (`game.plaza`, `game.block`).
- **Type ids are stored in many places**: saved maps (`bridgeType`, `stationType`,
  `busStopType`, `portType`, ...), D1 collection keys `structure:<kind>:<type>`
  (`Rewards.ts` `STRUCTURE_TYPES`, also compiled into the Worker through `PassLimits`), FREE/PLUS
  gating (`DEFAULT_STRUCTURES`), localStorage tool prefs, simulation and tutorial definitions,
  and i18n keys `<kind>.type.<id>` in 14 catalogs. Unknown ids are handled inconsistently: a
  bridge becomes a beam, a road station renders bare, an unknown decoration kind is dropped on
  load.

Adding one bridge type today touches about ten places in the game (type union, entry table,
builder, overhead and pier switches, rewards, i18n, tests, docs). The goal is that adding or
changing a structure, a texture or a city building preset is factory work, previewed on the
factory site, followed only by an import.

## User request

"I want to move textures, structures (bridges, stations, stops, city block definitions, suggest
other extensible sets) from webapp into factory, to improve extendebility and simpler development
of objects/structures. Similar effort like for woods."

## Decisions

### Besides the sets you named (textures, bridges, rail stations, bus/tram stops + road stations, city block definitions), which additional extensible sets should this spec cover?
| Option | What it means |
|---|---|
| Line decorations | Wall, fence, guardrail, gallery: repeating modules along a rail or road. The best kit candidate. The loader must keep unknown kinds instead of dropping them. |
| Cable-car stations + pylons | Fixed size per type (4 types), next to the 4 cabin designs the factory already owns. The cleanest fixed-model fit. |
| Tunnel portals | The portal face as a factory part with a bore-width input, opening "portal styles" as a new set (only `stone` today). |
| Port & airport props/terminal | Cranes, huts, floodlights, bollards and the airport terminal and tower as factory parts. Layouts, berths and taxiways stay in the game. |

**Answer: all four** - line decorations, cable-car stations + pylons, tunnel portals, port &
airport props/terminal.

### For world-fitted structures (bridges, stations, road stations), what should the factory own?
| Option | What it means |
|---|---|
| Type functions | Woods pattern: each type is a factory function keyed by a stable id that returns the game's box/part vocabulary for a given path or layout. The game keeps path planning, footprints, catenary, PBR binding and LOD merge. A new type needs only factory work and an import. |
| Parts library only | The factory exports fixed meshes (shelters, cranes, portal faces, station furniture), and the game's builders keep placing them. A new bridge or station type still needs game code. |
| Final meshes in factory | The factory produces finished, textured geometry and the game only places it. Footprints, overhead members and clearance come back as metadata. Highest risk. |

**Answer: Type functions.**

### How should the work be split into specs?
| Option | What it means |
|---|---|
| Umbrella + phased sets | This spec settles the shared contract once (ids, i18n, gating, materials, import, previews), then lists the sets as ordered phases, each shippable on its own. |
| Foundation + one pilot | The shared contract plus one pilot set; every other set gets its own later spec. |
| Everything at once | One spec, all sets moved in a single effort, no per-set phases. |

**Answer: Umbrella + phased sets.**

### Type functions need shared helpers (path frame, deck, piers, sweeps, the box writer). Where does that kit live?
| Option | What it means |
|---|---|
| In the factory bundle | The bundle holds the kit plus the type functions. The game passes plain inputs (path polyline, deck width, terrain height, game constants) and gets descriptors back with explicit tags (ground support, overhead member, name board, LOD). One implementation, shared by the site preview and the game. |
| Implemented by the game | The game hands a kit object to each type function. Frame conventions and pier tagging stay in the game, but the factory needs a second kit implementation for its previews. |
| No kit, raw descriptors | Each type function gets raw geometry and emits boxes itself. Every type duplicates the frame and pier code. |

**Answer: In the factory bundle.**

### Who owns the list of type ids per set (stored in maps, D1 collection keys, prefs, sims)?
| Option | What it means |
|---|---|
| Factory owns, game derives | A meta JSON per set lists frozen ids (test-pinned, with retired aliases), English labels and order. The game derives the picker order, collection list, gating lists, prefs validation and a generated TS union from it. The Worker reads the meta JSON, never the bundle. FREE defaults stay in the game. |
| Game keeps a registry | The game keeps its own id table and ignores factory types it does not list. Adding a type touches both repos, but the game controls the rollout. |

**Answer: Factory owns, game derives.**

### How do the factory exports reach the game at runtime?
| Option | What it means |
|---|---|
| Sync bundles + async models | Type functions ship in import-free bundles, one per set, imported synchronously by the game builder (the woods.js precedent). Fixed props (cable-car sheds, cranes, terminal) are ordinary factory models built in the async worker, with dimensions and anchors in meta so layout never waits. |
| Everything in sync bundles | Fixed props are also box/part emitters in the bundles. No async pop-in, but a larger main chunk, and props lose the model pipeline's thumbnails and LOD. |
| Everything as async models | Smallest main chunk, but hover previews, pier footprints and simulations would wait on the worker. Not workable for bridges and stations. |

**Answer: Sync bundles + async models.**

### Where does the photo texture library (15 PBR sets, ~4 MB, CC0) live after the move?
| Option | What it means |
|---|---|
| Factory owns library | All photo sets move to the factory's `assets/textures` with `SOURCES.md`, plus a named surface preset table (texture, tile, tint, fill, average colour). The import writes them into the game's `db/textures` (git-tracked), and the asset build copies them to public. Terrain keeps its id enum and layer binding in the game but picks textures by name. The water normal map stays in the game. |
| Split library | Structure surfaces move to the factory and terrain-only sets stay in the game. Two libraries, and the photos both use (cobblestone, concrete, pavement) are duplicated or cross-referenced. |
| Game keeps photos | Images stay in the game's `public/textures`. The factory only references surface ids from a shared list, so adding a photo still needs a game change. |

**Answer: Factory owns library.**

### A saved map names a type id the current export lacks (removed, renamed, or from a newer client). What is the single policy for every set?
| Option | What it means |
|---|---|
| Keep raw id, draw default | The stored id is kept as-is on disk, so it survives a round trip. Render, footprints and sims resolve it through retired aliases, then to the set's default type. Decorations stop being dropped, and road stations get a default. |
| Rewrite to default | Resolve on load and save the default back. Simpler, but a type removed and later restored is lost, and an older client erases newer types. |
| Keep per-set behaviour | Bridge to beam, road station bare, decoration dropped: as today. |

**Answer: Keep raw id, draw default.**

### Nothing per box is saved, so a factory change to a shipped type moves piers (ship routes), catenary fixings and default-station widths on existing islands and in simulations. How to handle that?
| Option | What it means |
|---|---|
| Accept, flag on import | Like woods, existing islands redraw with the new geometry. The game pins hashes of each type's output for fixed inputs, so an import that changes a shipped type fails a test until it is re-pinned on purpose. The factory pins the default station layout and the layout row signatures. |
| Freeze shipped types | A shipped type's geometry never changes; improvements ship as new ids. Safest for saves, but the pickers fill up with near-duplicates. |
| Version per record | Each saved structure stores a type version, and old records keep the old geometry. Both versions stay in the bundle forever. |

**Answer: Accept, flag on import.**

### Factory materials gain a named surface (photo + tile + tint, with UVs generated in the export). Which factory content may use it?
| Option | What it means |
|---|---|
| Structures + buildings | Opt-in per material for structure bundles, fixed props and building designs. Each material keeps an honest flat colour, so thumbnails, the far LOD band and tests still work untextured. Vehicles and trees stay untextured, so existing designs do not change. |
| Structures only | Only the moved structures bind photos. Factory buildings stay flat-coloured. Smallest change to the JS model format. |
| Everything | Vehicles and trees may use surfaces too. Most GPU memory risk and module churn; trees were kept texture-free for mobile. |

**Answer: Structures + buildings.**

### A new structure type arrives from the factory. How is it gated in the game (FREE/PLUS, collection rewards)?
| Option | What it means |
|---|---|
| Reward by default | Any type outside the game's FREE default list is automatically a collectible reward in gift draws, as non-default types are today. The FREE list stays game-owned, and the bus-stop commit path gets the missing collection check. |
| Factory declares tier | Each type's meta carries free, reward or plus, so the factory decides monetisation per type. |
| Hidden until listed | New types stay invisible until the game adds them to an allow list. Every new type touches the game again. |

**Answer: Reward by default.**

### The factory site is English-only. How do names and descriptions of factory types get translated in the game?
| Option | What it means |
|---|---|
| Label fallback, key wins | The woods precedent: the game shows its own key when present and the factory's English label otherwise. `i18n:check` reports factory types that lack a key. |
| Import generates keys | The import writes factory labels and descriptions into a generated English catalog part, so `update-translations` picks them up and the type modals keep typed keys. |
| Keys required at import | The import fails while a factory type lacks English and Czech keys in the game. |

**Answer (free text): "Add localization to factory. Factory should support the same languages as
the game".** This reverses the factory's current rule that the site is English-only with no i18n
layer. Today the game renders factory model titles and parameter titles verbatim in English
(`src/ui/woodsNames.ts`: "Parameter titles are the factory's data and render verbatim, as a
model's do"); only woods names and structure types have game-side keys. Its scope is settled in
the follow-up below.

### Factory localization: what does it cover?
| Option | What it means |
|---|---|
| All exported text | Everything the factory exports that the game shows: structure type names and descriptions, model titles, parameter titles and values, woods and species names, building categories. The factory site UI stays English. |
| Exported text + site UI | The same, and the factory site itself also gets a language switch in the 14 languages. |
| Structure types only | Only the moved structure sets' names and descriptions. Model and parameter titles keep rendering in English. |

**Answer: All exported text.**

### How are the factory's translations written and maintained?
| Option | What it means |
|---|---|
| Mirror the game's rule | English and Czech by hand with each change; a factory copy of `update-translations` fills the other 12 languages, with fingerprints for outdated wording; the export fails only on missing English or Czech. |
| All 14 at export | A skill translates every language in the same change that adds the text. Always complete, but every model change carries 13 translations. |
| English only, later | Build the catalog structure now with English only; translations come later. |

**Answer: All 14 at export.** In the factory, a change that adds or rewords exported text
carries all 14 languages; the export fails on any missing language.

### The game already has translations for structure type names (bridge.type.*, station.type.*, ...), woods names and species in 14 catalogs. What happens to them?
| Option | What it means |
|---|---|
| Move into the factory | They seed the factory catalogs, so no language loses a translation, and the game's keys for exported content are deleted. Game UI text (buttons, toasts, tool names) stays in the game's catalogs. |
| Game keys keep winning | The game keeps its keys and uses the factory's translation only where it has none. Two sources of truth for the same names. |

**Answer: Move into the factory.**

### City block definitions: what moves into the factory?
| Option | What it means |
|---|---|
| Presets + block types | Each building design declares its city presets (family default plus overrides), and block types become factory data: pool mix, centrepiece, placement, a named facade style, which city types and rings use them, family and decoration flags instead of hard-coded ids. The game keeps CityGen, facade numbers, city types and profiles. A new district is factory-only. Reverses the 2026-10-16 "tune cities without a factory release" decision. |
| Presets only | Building presets move onto the designs, and the factory exports its pool list for validation. Block types, city types and profiles stay game code. |
| Everything incl. city types | Village, town and city (road types, density, plaza budget, shapes, fountain odds) also become factory data. City types name game road types and drive grading. |

**Answer: Presets + block types.**

### How does the factory's translated text (14 languages) reach the game?
| Option | What it means |
|---|---|
| Per-language files | The export writes one text file per language, keyed by content (type, model, param). The game loads it together with its own catalog for the chosen language; English ships in the main chunk, the other 13 load on demand. |
| Inline in meta | Every meta entry carries its text in all 14 languages. Every client downloads all languages, and the meta files grow about 14x. |

**Answer: Per-language files.**

### How does the factory site show structure types (which are functions, not fixed models)?
| Option | What it means |
|---|---|
| Preview designs | The woods-grove precedent: each type gets a catalog page that runs its function on fixture paths and layouts, with enum params for fixture sizes (short or long span, 1/2/4 tracks, lanes). Textures show in the viewer. The pages are kept out of the game's metas, the GLB ZIP and the OpenTTD export. |
| Interactive structure lab | A dedicated site section with sliders for span, grade, curvature, tracks and length, running the bundle live. New site code beyond the catalog. |

**Answer: Preview designs.**

### How does each set move: same look first, or improved during the move?
| Option | What it means |
|---|---|
| 1:1 first, improve later | Each set's phase ports today's geometry, textures and data unchanged, proven by pinned box-list hashes and triangle counts taken before the move. Visual improvements are later factory work. |
| Improve during the move | Redesign types as they move. No clean before/after, and save-visible geometry (piers, station widths) changes in the same step. |

**Answer: 1:1 first, improve later.**

### Some parts need a continuous input or a synchronous build: tunnel portal (bore width), cable-car pylon (height 12-60), airport terminal (pad width/depth), bus-stop side assembly (built on every hover). Where do they go?
| Option | What it means |
|---|---|
| Functions in set bundles | Anything sized by the world or needed synchronously is a function in its set's sync bundle: portal(halfWidth), pylon(height), terminal(w, d), stop side. Only truly fixed props (cable-car sheds, cranes, huts, floodlights, bollards, tower, windsock) are async models. Factory parameters stay enum-only. |
| Numeric params on models | The factory parameter system gains numeric parameters; these parts become async models built per value, with a box fallback while they load. Model cache entries multiply with every distinct value. |

**Answer: Functions in set bundles.**

### In what order do the phases ship? (Each phase is shippable on its own.)
| Option | What it means |
|---|---|
| Foundations, then easy to hard | 0 foundations; 1 texture library and named surfaces; 2 city presets and block types; 3 fixed props and stops; 4 kits (line decorations, tunnel portals); 5 rail and road stations; 6 bridges last. |
| Bridges as pilot | Foundations, then bridges first: the hardest set proves the contract early. |
| By player value | Foundations, then stations, bridges and city blocks first; props, decorations and textures after. |

**Answer: Foundations, then easy to hard.**

### The research found existing game defects: the bus-stop commit path skips the collection check; a pool id is compared with a block-type id, so the tenement anti-noise wall is never generated; road-station types are not resolved on load; PAIRED_STATION_TYPES is defined twice. How are they handled?
| Option | What it means |
|---|---|
| Fix in the phase that touches them | Each defect is fixed, with its regression test, in the phase that moves its code: the gate and road-station resolve in foundations, the tenement wall with block types, the duplicate with stations. |
| Separate fix first | One bugfix change in the game before any phase starts. |
| Leave them | Out of scope; current behaviour kept. |

**Answer: Fix in the phase that touches them.**

## High-level plan

Every phase ships on its own. Within a phase the factory work comes first, then the game's import,
then the deletion of the game's in-code definitions. Every set moves 1:1: before a set moves, the
game pins its output (box-list hashes, triangle counts) for fixed inputs, and the factory version
must reproduce the pins.

**Phase 0 - foundations.**
- *Factory localization.* The factory gains catalogs in the game's 14 languages for every text
  it exports that the game shows: structure type names and descriptions, model titles,
  parameter titles and values, woods and species names, building categories, block type names.
  The catalogs are seeded from the game's existing translations, and those game keys are then
  deleted. A change that adds or rewords exported text carries all 14 languages (a factory
  translation skill does it), and the export fails on any gap. The export writes one text file
  per language. The game loads English in its main chunk and the other 13 on demand together
  with its own catalog. The factory site UI stays English.
- *Set registry.* Each set has a meta file with frozen ids, picker order, retired aliases and
  per-type metadata. Factory tests pin the shipped ids. The game derives its collection list,
  gating lists, prefs validation and generated TS unions from the metas. The Worker reads the
  meta files only, never a bundle or a geometry module. The FREE default list stays in the game;
  every other type is a collectible reward.
- *One unknown-id policy.* Stored ids are kept verbatim through load and save. Readers resolve
  them through retired aliases, then to the set's default type. Decorations stop being dropped,
  and road stations get a default.
- *Import and checks.* The import mirrors bundles, metas, textures and text files. The game gains
  a pin harness that fails when an import changes a shipped type's output, until it is re-pinned
  on purpose. Preview designs (a type function on fixture paths and layouts, with enum sizes)
  appear on the factory site but stay out of the game's metas and the GLB and OpenTTD exports.
- *Defects:* the bus-stop commit path gets the collection check; road-station types resolve on load.

**Phase 1 - texture library and named surfaces.** The photo sets move to the factory with their
sources and licences, plus a surface preset table (texture, tile, tint, fill, honest average
colour). It replaces the per-consumer knob tables in the game's structure meshes, which read it
from the import. Factory materials on structures and buildings may name a surface, opt-in. The
export generates UVs and keeps the flat colour, so thumbnails, the far LOD band and tests still
work untextured. The game binds the photos after a model is deserialized. Terrain keeps its
material enum and layer order and picks its photos by name. The water normal map stays in the game.

**Phase 2 - city presets and block types (data only).** Each building design declares its city
presets: a family default plus per-design overrides, strictly validated against its parameters.
Block types become factory data: pool mix, centrepiece, placement, a named facade style, which
city types and rings use them, and family and decoration flags that replace the hard-coded ids.
The game keeps CityGen, the facade numbers per named style, city types and profiles. It first
consolidates its four copies of the type-choice logic so they read block types as data.
*Defect:* the tenement anti-noise wall rule is fixed.

**Phase 3 - fixed props and stops.** Cable-car station sheds, port props (crane, container stack,
hut, floodlight, bollard, mooring post) and the airport tower and windsock become ordinary factory
models. They load through the async model pipeline, with dimensions and anchors (rope head,
wheel node, footprint) in meta so layout never waits. Sized parts are functions in their set's
sync bundle: the cable-car pylon (height), the airport terminal (pad width and depth), and the
bus-stop side assembly. The side assembly tags its parts as following the road grade, standing
level, or fitted supports.

**Phase 4 - kits.** Line decorations become per-kind functions with envelope metadata (top,
margin, spacing, domain, sides, anchor, spans-corridor). Tunnel portals become a set of portal
styles, each a function of the bore half-width. The game keeps routing, placement, clearance,
tile batching and the tunnel bore and cover.

**Phase 5 - rail and road stations.** A rail station type is a layout recipe per track count plus
a furnish function over length and layout. A road station type is a dressing function over the
game's solved layout. The game keeps track generation, the road-station solver, name-board
painting and material semantics (glass, light). *Defect:* the duplicated paired-type list goes.

**Phase 6 - bridges.** A bridge type is a per-span function over the bundle's kit, with its span
policy, boundary pier style and overhead members alongside it. Ground supports are tagged
explicitly instead of detected by height. The game keeps path planning, profiles, pier
footprints, catenary fixing and the far LOD.

## Database and persistent storage

- **Saved maps (R2 `objects.json` and the grids):** no format change and no migration. Type ids
  stay strings where they are today: `bridgeType`, `stationType` and `layout`, `busStopType`,
  road-station `stationType`, `portType`, `airportType`, cable-car `stationType`, `tunnelType`,
  `damType`, `segment.decorations[].kind`, `CityData.blocks[].type`, `CityData.typeId`,
  `HouseData.key`. **Behaviour change:** an id unknown to the current export is now kept
  verbatim on save (decorations were dropped before), and drawn via retired aliases or the set's
  default. Persisted layouts and road-station geometry stay authoritative. A changed factory
  type redraws existing islands (accepted).
- **D1 `user_collection.item` and `pending_gifts` offers:** key format
  `structure:<kind>:<type>` unchanged. The set of valid types comes from the factory metas, so a
  new factory type adds new keys. Ids are never renamed, only retired with an alias. No schema
  change.
- **localStorage tool prefs:** unchanged keys; validated against the derived lists (unknown
  values dropped, as today).
- **Factory repository (git):** the photo library moves in, with `SOURCES.md` (origin, author,
  licence, use per file). New: 14-language catalogs of exported text; the surface preset table;
  block type data; city presets on building designs; one source module per set with its kit.
- **Factory export (generated, gitignored):** per set a bundle plus meta (ids, order, retired
  aliases, per-type metadata); a surfaces meta and the textures; one text file per language;
  block types; `game.city` presets on building entries.
- **Game repository (git):** the import writes the per-set bundles, metas and generated type
  declarations under `db/procedural`, the per-language text files, and the photos under
  `db/textures`, replacing `public/textures` as the tracked source (`public/textures` becomes
  generated, like the models). The game's catalogs lose the keys for exported content, and their
  translation fingerprints are regenerated. Committed pin fixtures hold each type's output hashes.

## Architecture decisions

- **Type functions in import-free sync bundles, kit included.** Builders run on every hover, in
  Node tests and in headless simulations, so they cannot wait for the model worker. Shipping the
  kit with the functions gives one implementation of the path frame and pier rules, used by both
  the site preview and the game. A game-implemented kit would need a second copy in the factory.
- **Plain inputs in, tagged descriptors out.** The game passes paths, layouts, terrain height and
  its own constants (clearances, wire heights, platform height), so gameplay numbers stay
  game-owned. The bundle returns descriptors with explicit roles (ground support, overhead
  member, name board, LOD), so pier footprints, catenary and the far LOD never rely on geometric
  coincidence.
- **The factory owns ids; the game derives.** A type added in the factory reaches the picker,
  collection and gating with no game edit. The Worker reads meta JSON only, which also stops it
  compiling the geometry modules in as it does today.
- **Text belongs to whoever owns the content.** Moving the translations into the factory makes
  model, parameter and type names translatable for the first time, and removes the double source
  for structure and woods names. The cost: every factory text change carries 14 languages.
- **Named surfaces with an honest flat colour.** The flat colour keeps every untextured path
  correct (thumbnails, far band, tests, OpenTTD sprites). Photos are a binding in the game, and
  one preset table replaces scattered per-consumer tuning.
- **Block types as data, CityGen as code.** Pools, mixes and usage are content and move; grading,
  facade numbers and city types are engine rules and stay.
- **Accept redraws, but make them visible.** Freezing types would clutter the pickers, and
  per-record versions would keep dead code forever. Hash pins turn every geometry change into a
  deliberate, reviewable act.

## Weaknesses and risks

- **Hover hot path and bundle size.** Bridges and stops rebuild on every pointer move, so the
  functions must stay allocation-light. Several bundles in the main chunk grow the download and
  the offline build. Mitigation: per-type timing tests in the factory, plus the embedded
  bundle-size guard.
- **Silent gameplay drift.** A factory edit moves piers (ship routes), catenary fixings, station
  widths and the default station layout (which stores no layout) on every island and in the
  simulations, whose islands regenerate cities from the live catalog. Mitigation: the game's
  pins, factory pins of layout signatures, and explicit roles. The cost lands on whoever re-pins.
- **Subtle frame conventions** (lateral sign flip, builder-owned piers, the "under" drop, masonry
  pier widening) can regress multi-lane decks during the port. Mitigation: the 1:1 hash proof.
- **Invariants change owner.** Gauge clearance, mast columns, overhead clearance, road clearance
  and LOD ratios are tested in the game today. They must move into factory tests against fixture
  inputs the game exports, or regressions surface only after import.
- **Translation load.** Every model, parameter value and type change carries 13 translations, and
  the first seeding covers hundreds of titles and values that were never translated. Machine
  wording quality and review effort are open. The game's English factory text file also enters
  the main chunk.
- **Textures:**
  - GPU memory: there are no compressed textures, and buildings may now bind photos.
  - Photos render dark when tint and photo multiply.
  - A white far band appears if a material's colour is not honest.
  - Model-space UVs rotate with buildings and do not continue into roads or plazas.
  - Mitigation: a cap on the number of sets, tested; one preset table; a colour-to-average check.
- **City drift.** Old cities infer block types from presets, and block type ids are stored, so
  preset or block-type edits change old maps and simulations. This reverses the 2026-10-16
  decision that city tuning needs no factory release.
- **Cross-repo friction remains.** A new type still needs an import, a game build and a Worker
  redeploy. It is factory-only in authoring, not in shipping.
- **Previews approximate.** The site shows glass opaque, cannot paint station names, and runs
  types on fixtures, not real terrain.
- **Open questions:**
  - Whether the facade style names form a frozen game-owned list the factory validates against.
  - What an owned collection item for a retired type shows.
  - Whether the public API or the marketing site will ever want factory text in other languages.

## Out of scope

- Rail and road types and their cross-sections, catenary, dams and locks.
- Small fixed props with no type set: semaphores, road signs, crossing signals, the watchtower
  balloon and the lake-spring cottage.
- The terrain material enum, palette, classifier and splat pipeline; the water normal map.
- City types, city profiles, CityGen and grading; all world solvers (station tracks, road-station
  solver, port and airport layouts, berths, taxiways, rope plan, tunnel bore and cover).
- Localizing the factory site UI.
- Visual improvements of moved sets beyond the 1:1 port.
- Publishing the factory export to the game outside the implementation of each phase.
