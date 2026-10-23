# Factory structures and textures

Status: draft
Date: 2026-10-23
Area: rail-island-factory (structure, cross-section and surface exports, localization of exported
text, site previews), rail-island-webapp (structure builders, rail and road types, catenary,
textures, city presets and block types, collection and gating, i18n, import pipeline)

## Context of the change

The factory (this repository) builds every vehicle, building and tree the game draws. Since the
trees and woods move (docs/specs/2026-10-19-factory-trees-and-woods.md) it also exports **code,
not only models**: woods types are distribution functions keyed by stable names, bundled into
one import-free `woods.js` that the game imports synchronously. Everything else the game draws
is still authored in the game, `rail-island-webapp`:

- **Structures are mostly box lists.** For bridges, stations, stops, road stations, ports and
  cable-car stations, a pure module in `src/core/rail/` (airports in `src/core/air/`; no
  Three.js) writes world-space box descriptors. A thin `src/render/*Mesh.ts` merges them by
  material, using LOD tags (`part` on bridges, `lod: shell/support` on stations and ports,
  `detail` on stops). Dams, line decorations and the lake-spring cottage build their geometry
  in `src/render/`.
  - bridges: `Bridge.ts` (1,278 lines, 14 types). About 880 lines are type-independent path,
    frame and pier code; each type is a 5-50 line builder. The span policy, boundary pier style
    and overhead members (where catenary attaches) are per-type switches outside the builders.
  - rail stations: `Station.ts` (1,444 lines, 8 types): a layout recipe per track count plus a
    furnish function over length and layout.
  - bus and tram stops: `BusStop.ts` (3 types, nearly fixed size, one assembly per road side);
    road stations: `RoadStation.ts` (6 types x 3 layouts, a solver plus per-type dressing).
  - ports (6), airports (3), cable-car stations (4, fixed size per type), dams (5), tunnels
    (1), line decorations (wall, fence, guardrail, gallery).
- **Rail types (3) and road types (10)** are entry tables in `Rail.ts` and `Road.ts`: a
  cross-section swept along the line. Widths, corridor half-widths, tram offsets and wire
  heights are derived from the type id at runtime, not saved. **Catenary** (`Catenary.ts`,
  `TramCatenary.ts`) is a planner that places masts, cantilevers, portals and tram poles; it
  saves nothing.
- **Gameplay reads that geometry**: bridge piers steer ship navigation, overhead members carry
  catenary, station layouts give track offsets, road widths drive junctions and flattening. The
  builders run synchronously on every hover move, in Vitest and in the headless simulations.
- **Textures** are photo PBR sets in the game's `public/textures/` (15 sets x albedo, normal and
  rough at 512 px, about 4 MB, Poly Haven CC0, plus a three.js water normal map; fetched by a
  macOS-only script). `pbrTextures.ts` binds them by file name. Tint, fill and tile tables are
  scattered over the bridge, tunnel, dam, road, rail, tram, bus-stop, airport, house-plinth and
  line-decoration code. Terrain uses 11 of them as splat layers bound to the material ids
  stored in each map's terrain grid. The factory has **no textures or UVs**: `MaterialSpec`
  is a colour plus optional metallic, roughness, `doubleSided` and a `lamp` role; vertex
  colours are a mesh attribute, not part of the material. Earlier factory specs excluded
  textures explicitly.
- **City block definitions** live in the game's `src/core/city/`: `BlockTypes.ts` (15 block
  types: placement, facade style, weighted factory pools), `cityTypes.json` (village, town,
  city), `CityProfiles.ts`, and `cityPresets.ts`, a per-pool list of `{design, params, weight}`
  naming factory designs. The factory already owns each building's pool (`group`) and its plaza
  and block-shape rules (`game.plaza`, `game.block`).
- **Type ids are stored in many places**: saved maps, D1 collection keys
  `structure:<kind>:<type>` (`Rewards.ts` `STRUCTURE_TYPES`, imported by the Worker; the Worker
  also compiles the bridge and station geometry modules in through `PassLimits`), FREE/PLUS
  gating (`DEFAULT_STRUCTURES`), localStorage tool prefs, simulation, tutorial and test
  fixtures, and i18n keys in 14 catalogs (mostly `<kind>.type.<id>`, plus
  `cablecar.station_type.*`, `decoration.kind.*`, `rail.type.*`, `road.type.*`; the tunnel
  type has none). Unknown ids are handled inconsistently: a bridge draws as a beam, a bus stop
  is rewritten to `shelter` on load, a road station renders bare, an unknown decoration kind is
  dropped on load.
- **Factory text is English.** The game renders factory model titles and parameter titles
  verbatim; game-side keys exist only for woods names, tree species, building categories and
  the structure, rail and road type names.

Adding one bridge type today touches about ten places in the game. The goal is that adding or
changing a structure, a cross-section, a texture or a city building preset is factory work,
previewed on the factory site, followed only by an import.

## User request

"I want to move textures, structures (bridges, stations, stops, city block definitions, suggest
other extensible sets) from webapp into factory, to improve extendebility and simpler development
of objects/structures. Similar effort like for woods."

Later, answering how type names get translated: "Add localization to factory. Factory should
support the same languages as the game".

Later, extending the scope: "Add to plan: Rail and road types and their cross-sections,
catenary, dams and locks. - this should be also defined in factory".

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
the game".** Context, not the user's words: this ends the factory's "no i18n layer" rule for
exported text; the next decision keeps the site UI English.

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

**Answer: All 14 at export.**

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

**Answer: Fix in the phase that touches them.** Correction found later: the paired list exists
twice under two names, `PAIRED_STATION_TYPES` in `Catenary.ts` and `PAIRED_TYPES` in
`StationLayout.ts`.

### Factory localization covers model titles. Many are proper nouns ("CD 043", "Karosa", "Eiffel Tower") and some are descriptive ("Classic Cottage", "Container Wagon"). How are titles handled?
| Option | What it means |
|---|---|
| Proper nouns verbatim | A title may be marked as a proper noun and is then copied unchanged into every language, which the completeness check accepts. Descriptive titles, parameter titles and values are translated. |
| Translate every title | All titles get 14 translations, including type designations and brand names, where the translator decides what to keep. |

**Answer: Proper nouns verbatim.**

### Ports (6 types), airports (3) and cable-car stations (4) are collectible types whose layouts stay in the game. Who owns their type ids and names?
| Option | What it means |
|---|---|
| Factory owns all three | Each type becomes a factory definition: the props, terminal, shed and surfaces it uses, plus its name, in the set registry. The game's layout and berth/taxi solvers read it. A new port or airport style is factory-only. |
| Cable-car only | Cable-car station types move with their sheds. Port and airport type ids stay game-owned; the factory only supplies props and the terminal. |
| All stay game-owned | The factory supplies parts only; all three type lists, names and gating stay in the game. |

**Answer: Factory owns all three.**

### Where does the factory's 14-language completeness check run?
| Option | What it means |
|---|---|
| Tests and game import | `pnpm test` fails on missing or outdated translations, and the game import refuses an export with gaps. The site still builds and deploys, so a model can be previewed before its translations are done. |
| Model build | The export itself refuses to build with gaps, so the site deploy also stops until all 14 languages exist. |

**Answer: Tests and game import.**

### Follow-up: rail and road types, catenary, dams and locks
The user decided this directly: "Add to plan: Rail and road types and their cross-sections,
catenary, dams and locks. - this should be also defined in factory". These were out of scope in
the first draft.

### Rail types (3) and road types (10) move to the factory. What does a type definition hold?
| Option | What it means |
|---|---|
| Full type incl. widths | The cross-section (widths, lanes, shoulders, corridor half-width, tram track offsets), surfaces, sleeper and marking style, and names. The game keeps routing, junctions, terrain flattening and tunnel bores. Widths are not saved, so a change redraws every existing road; the import pins catch it. |
| Appearance only | Surfaces, sleepers, markings and names move. Widths, corridors and tram offsets stay game constants keyed by type. |

**Answer: Full type incl. widths.**

### Catenary has no saved ids today. What does the factory define?
| Option | What it means |
|---|---|
| Styles with parts | Catenary styles become a set: mast, cantilever, portal and tram pole as functions of height and offsets, with each rail or road type naming its style. The game keeps the planner (mast spacing, wire runs) and passes wire heights and clearances in as its constants. |
| Parts only | Today's single look as factory part functions, with no style set. |
| Parts + planner rules | The factory also owns mast spacing and wire heights, which must match pantographs and bridge clearance. |

**Answer: Styles with parts.**

### Where do the added sets go in the phase order?
| Option | What it means |
|---|---|
| Kits + catenary last | Rail and road types and dams join phase 4 (kits and cross-sections; the dam body solver stays in the game, while its lock, arcade bays and type definitions move). Catenary becomes phase 7, after bridges and stations, because it reads both. |
| Appended at the end | The agreed order is untouched: 7 rail and road types, 8 catenary, 9 dams. |
| Rail/road right after textures | Cross-sections move first (phase 2) because bridges, stations and stops read their widths; the rest shift by one. |

**Answer: Kits + catenary last.**

## High-level plan

Every phase ships on its own. Within a phase the factory work comes first, then the game's
import, then the deletion of the game's in-code definitions. Every set moves 1:1. Points marked
*(derived)* were not asked as questions; they follow from the decisions and stay open for review
while this spec is a draft.

**The sets at a glance.** Ids and text are factory-owned for every set below. "Collectible"
follows today's structure kinds; a new type in such a set is a reward unless the game's FREE
list names it.

| Set | Phase | The factory delivers | Collectible |
|---|---|---|---|
| Textures and surfaces | 1 | photo library, surface presets, named surfaces on materials | no |
| City presets | 2 | presets on building designs | no |
| Block types | 2 | block type data | no |
| Bus and tram stops | 3 | stop side function | yes |
| Cable-car stations | 3 | type definitions, shed models, pylon function | yes |
| Ports | 3 | type definitions, prop models | yes |
| Airports | 3 | type definitions, terminal function, tower and windsock models | yes |
| Line decorations | 4 | per-kind functions with envelope metadata | no *(derived)* |
| Tunnel portal styles | 4 | portal functions of the bore half-width | no *(derived)* |
| Rail and road types | 4 | full cross-section type definitions | no |
| Dams and locks | 4 | type definitions, lock, arcade bay and turret parts | yes |
| Rail stations | 5 | layout recipes and furnish functions | yes |
| Road stations | 5 | dressing functions | yes |
| Bridges | 6 | per-span functions over the kit | yes |
| Catenary styles | 7 | mast, cantilever, portal and tram-pole functions | no *(derived)* |

**Phase 0 - foundations.**
- *Factory localization.*
  - The factory gains catalogs in the game's 14 languages for every text it exports that the
    game shows: type names and descriptions, model titles, parameter titles and values, woods
    and species names, block type names, and the grouping labels taken from factory data
    (building categories, vehicle traction and subcategories). Game-only labels (the archive
    tab, `city.block.auto` and `.empty`) stay in the game.
  - Titles marked as proper nouns are copied verbatim into every language.
  - English stays on the designs as the source. The other 13 languages are keyed by content and
    carry a fingerprint of the English, so a reworded English text shows as outdated
    *(derived)*.
  - A change that adds or rewords exported text carries all 14 languages, written by a new
    factory translation skill. `pnpm test` and the game import fail on missing or outdated
    entries; the site still builds and deploys.
  - The factory keeps a copy of the 14 language codes, which the game import checks against
    its own list *(derived)*.
  - The site UI, OpenTTD names and the GLB ZIP stay English, and designs that are not exported
    are exempt *(derived)*.
  - The catalogs are seeded from the game's existing translations, and those game keys are
    deleted.
  - The export writes one text file per language. The game registers it into its synchronous
    translator under its own key space, with English in the main chunk and the other 13 loaded
    on demand next to the game catalog. The offline build packs them like its own catalogs. One
    English source serves core, MCP and debug output, and the Worker needs no factory text
    *(derived)*.
  - The woods UI moves to factory text: woods names, species and the variant names that used to
    be types (Autumn Larch Woodland) get factory entries *(derived)*.
- *Set registry.*
  - Every set in the table has a meta file with frozen ids, picker order, retired aliases and
    per-type metadata, pinned by factory tests. Phase 0 publishes metas and text for every set,
    with ids frozen to today's lists, and a factory test refuses new ids in a set until that
    set's phase has landed *(derived)*.
  - The game derives its collection list, gating lists, prefs validation and generated TS
    unions from the metas. The Worker reads the meta files only, never a bundle or a geometry
    module.
  - The FREE default list stays in the game; every other type in a collectible set is a
    reward. Block types additionally get a default type for unknown ids *(derived)*.
- *One unknown-id policy.* Stored ids are kept verbatim through load and save. Readers resolve
  them through retired aliases, then to the set's default type. Decorations are no longer
  dropped, bus stops no longer rewritten, and road stations get a default.
- *Import and baselines.* The import mirrors bundles, metas, textures and text files.
  - Before a set's phase, the game writes a baseline (fixture inputs, output hashes, triangle
    counts, invariant expectations), committed into the factory's test fixtures like the tree
    baseline. The hash is defined once for both repos, including the fields, tags and float
    rounding it covers *(derived)*.
  - The game keeps pins that fail when an import changes a shipped type's output, until the
    pin is updated on purpose.
  - The factory pins the default station layout and the layout row signatures.
  - Preview designs and per-set pins start in each set's own phase. Preview designs stay out
    of the game's metas and the GLB and OpenTTD exports.
- *Rules and skills.* The factory's agent rules state that the site UI stays English, that
  exported text carries 14 languages, and that a shared texture library sits beside the
  per-model reference folders. They name the translation skill, and every model skill gains a
  translation step. The game's agent rules and i18n reference state that factory content text
  is authored only in the factory, and they scope `update-translations`, `i18n:check` and
  `create-release` to the game's own catalogs *(derived)*.
- *Defects:* the bus-stop commit path gets the collection check; road-station types resolve on
  load.

**Phase 1 - texture library and named surfaces.**
- The photo sets move to the factory with their sources and licences, and the fetch script moves
  with them, ported off macOS *(derived)*.
- A surface preset table (texture, tile, tint, fill, honest average colour) replaces the game's
  scattered tint and tile tables. Every game consumer that binds photos by name switches to
  the surface lookup, including rail, tram and house plinths.
- Factory materials on structures and buildings may name a surface, opt-in. The export generates
  UVs and keeps the flat colour, so thumbnails, the far LOD band and tests still work
  untextured.
- The factory site viewer shows the photos. The game binds them after a model is deserialized.
- Terrain keeps its material enum and layer order and picks its photos by name.
- The water normal map stays tracked in the game, outside the generated folder *(derived)*.
- The offline build ships every imported photo.
- The number of photo sets is capped by a test *(derived)*.

**Phase 2 - city presets and block types (data only).**
- Each building design declares its city presets: a family default plus per-design overrides,
  strictly validated against its parameters.
- Block types become a registry set of factory data: pool mix, centrepiece, placement, a named
  facade style, which city types and rings use them, and family and decoration flags that
  replace the hard-coded ids.
- The import fails when block data names a city type, ring or facade style the game does not
  know *(derived)*.
- The game keeps CityGen, the facade numbers per named style, city types and profiles. It first
  consolidates its four copies of the type-choice logic so they read block types as data.
- *Defect:* the tenement anti-noise wall rule is fixed.

**Phase 3 - fixed props, stops, cable-car, port and airport types.**
- Cable-car, port and airport types become factory definitions: the props, terminal, shed and
  surfaces each uses, plus its name. The game's layout, berth, taxiway and rope solvers read
  them.
- Truly fixed props are ordinary factory models through the async model pipeline: cable-car
  station sheds, port crane, container stack, hut, floodlight, bollard and mooring post, and
  the airport tower and windsock.
  - Their dimensions and anchors (rope head, wheel node, footprint) are in meta, so layout
    never waits.
  - They are listed apart from buildings and vehicles, so the game keeps them out of pickers,
    rewards, plan limits and used-model counts, and the offline build ships all of them
    *(derived)*.
- Sized parts are functions in their set's sync bundle: the cable-car pylon (height), the
  airport terminal (pad width and depth), and the bus-stop side assembly. The side assembly
  tags its parts as following the road grade, standing level, or fitted supports.

**Phase 4 - kits and cross-sections.**
- Line decorations become per-kind functions with envelope metadata: top, margin, spacing,
  domain, sides, anchor, spans-corridor.
- Tunnel portals become a set of portal styles, each a function of the bore half-width.
- Rail and road types become full factory definitions: cross-section widths, lanes, shoulders,
  corridor half-width, tram track offsets, surfaces, sleeper and marking style, and the
  catenary style each one names. Bridges, stations and stops then read these widths through
  the game.
- Dam types become factory definitions: body style and masonry, arcade bay and turret parts,
  and the lock with its gate leaves as named nodes.
- The game keeps routing, placement, clearance, tile batching, junctions, terrain flattening,
  the tunnel bore and cover, and the dam body solver, crest, spillways and water.

**Phase 5 - rail and road stations.**
- A rail station type is a layout recipe per track count plus a furnish function over length
  and layout.
- A road station type is a dressing function over the game's solved layout.
- The game keeps track generation, the road-station solver, name-board painting and material
  semantics (glass, light).
- *Defect:* the duplicated paired-type list goes.

**Phase 6 - bridges.**
- A bridge type is a per-span function over the bundle's kit, with its span policy, boundary
  pier style and overhead members alongside it.
- Ground supports are tagged explicitly instead of detected by height.
- The game keeps path planning, profiles, pier footprints, catenary fixing and the far LOD.

**Phase 7 - catenary styles.**
- Catenary styles become a set: mast, cantilever, portal and tram pole as functions of height
  and offsets.
- The game keeps the planner (mast spacing, wire runs) and passes in wire heights and
  clearances. It reads bridge overhead members and paired station types from phases 5 and 6.

## Database and persistent storage

- **Saved maps (R2 `objects.json`, `rail.json`, `road.json` and the grids):** no format change
  and no migration. Type ids stay strings where they are today:
  - in `objects.json`: `bridgeType`, `stationType` (its `layout` is a persisted rows object,
    not an id), `busStopType`, road-station `stationType` and `layout`, `portType`,
    `airportType`, cable-car `stationType`, `tunnelType`, `damType`, `CityData.blocks[].type`,
    `CityData.typeId`, `HouseData.key`;
  - in `rail.json` and `road.json`: `railType`, `roadType` and `segment.decorations[].kind`.

  **Behaviour change:** an id unknown to the current export is now kept verbatim on save. Before,
  decorations were dropped and bus-stop types rewritten to `shelter`. The unknown id draws via
  retired aliases or the set's default. Persisted layouts and road-station geometry stay
  authoritative. Widths and per-box geometry are not saved, so a changed factory type redraws
  existing islands, roads included (accepted).
- **D1 `user_collection.item` and `pending_gifts` offers:** key format
  `structure:<kind>:<type>` unchanged. The valid types per collectible set come from the
  factory metas, so a new factory type adds new keys. Ids are never renamed, only retired with
  an alias. No schema change.
- **localStorage tool prefs:** keys unchanged (`railType`, `roadType`, `bridgeType`,
  `tunnelType`, `stationType`, ...), validated against the derived lists; unknown values are
  dropped, as today.
- **Factory repository (git):**
  - the photo library and its fetch script, with `SOURCES.md` (origin, author, licence, use);
  - 14-language catalogs of exported text with English fingerprints;
  - the surface preset table, block type data, and city presets on building designs;
  - one source module per set with its kit;
  - per-set baselines written by the game, and pins of the default station layout and row
    signatures.
- **Factory export (generated, gitignored):**
  - per set, a bundle plus a meta (ids, order, retired aliases, per-type metadata);
  - a props meta, a surfaces meta and the textures;
  - one text file per language;
  - `game.city` presets on building entries.
- **Game repository (git):**
  - The import writes the per-set bundles, metas and generated type declarations under
    `db/procedural`, the per-language text files, and the photos under `db/textures`.
  - `db/textures` replaces `public/textures` as the tracked source, and `public/textures`
    becomes generated like the models. The water normal map keeps a tracked game location.
  - The game's catalogs lose the keys for exported content, and their translation fingerprints
    are regenerated.
  - Committed pin fixtures hold each type's output hashes.

## Architecture decisions

- **Type functions in import-free sync bundles, kit included.** Builders run on every hover, in
  Node tests and in headless simulations, so they cannot wait for the model worker. Shipping the
  kit with the functions gives one implementation of the path frame and pier rules, used by both
  the site preview and the game. A game-implemented kit would need a second copy in the factory.
- **Plain inputs in, tagged descriptors out.** The game passes paths, layouts, terrain height
  and its engine-wide constants (clearances, wire heights, platform height). Per-type
  dimensions (road widths, rail cross-sections, station rows) belong to the type definitions in
  the factory. The bundle returns descriptors with explicit roles (ground support, overhead
  member, name board, LOD), so pier footprints, catenary and the far LOD never rely on geometric
  coincidence.
- **Factory parameters stay enum-only.** Anything sized by the world (portal half-width, pylon
  height, terminal pad, stop side, catenary mast height) is a function in its set's bundle, not
  a model built per numeric value. The model cache and the variant tests stay bounded.
- **The factory owns ids; the game derives.** A type added in the factory reaches the picker,
  collection and gating with no game edit. The Worker reads meta JSON only, which also stops it
  compiling geometry modules in as it does today.
- **Text belongs to whoever owns the content.** Model, parameter and value titles become
  translatable for the first time, and structure, rail, road and woods names lose their double
  source. The cost is that every factory text change carries 14 languages. The gate sits in
  tests and the import, not the build, so previews never wait for translations.
- **Named surfaces with an honest flat colour.** The flat colour keeps every untextured path
  correct: thumbnails, the far band, tests and OpenTTD sprites. Photos are a binding in the
  game, and one preset table replaces scattered per-consumer tuning.
- **Content as data, engines as code.** Block types, cross-sections and type definitions move;
  CityGen, grading, the road junction and flattening code, and the catenary planner stay.
- **Accept redraws, but make them visible.** Freezing types would clutter the pickers, and
  per-record versions would keep dead code forever. Hash pins turn every geometry change into a
  deliberate, reviewable act.

## Weaknesses and risks

- **Hover hot path and bundle size.** Bridges, stops and roads rebuild on every pointer move, so
  the functions must stay allocation-light. Several bundles plus the English text file grow
  the main chunk and the offline build, and the game has no size guard today. Mitigation:
  per-type timing tests in the factory and a new main-chunk size test in the game *(derived)*.
- **Silent gameplay drift.** A factory edit can move every island and every simulation, whose
  islands regenerate cities from the live catalog:
  - piers, and so ship routes;
  - catenary fixings;
  - station widths, and the default station layout, which stores no layout;
  - road widths, and with them junctions, terrain flattening and tunnel bores.

  Simulation and test fixtures also name road types. Mitigation: the game's pins, the
  factory's layout pins and explicit roles. The cost lands on whoever re-pins.
- **Subtle frame conventions** (lateral sign flip, builder-owned piers, the "under" drop, masonry
  pier widening) can regress multi-lane decks during the port. Mitigation: the 1:1 baselines.
- **Invariants change owner.** Gauge clearance, mast columns, overhead and road clearance, wire
  height against pantographs and LOD ratios are tested in the game today. They move into
  factory tests against the game's baselines *(derived)*. Otherwise regressions surface only
  after import.
- **Translation load.** The first seeding covers hundreds of titles and parameter values that
  were never translated. After that, every model, parameter value and type change carries 13
  translations, and every model skill gains a step. Machine wording quality and review effort
  are open.
- **Textures:**
  - GPU memory: there are no compressed textures, and buildings may now bind photos.
  - Photos render dark when tint and photo multiply.
  - A white far band appears if a material's colour is not honest.
  - Model-space UVs rotate with buildings and do not continue into roads or plazas.
  - Mitigation: the set cap, one preset table, and a check that each colour stays near its
    photo's average.
- **City drift.** Cities saved without block records infer their block types from their
  buildings' groups, weighted by the block types' pools, and block type ids are stored. So
  block-type and pool-mix edits change how old maps are read. Preset edits change new
  generation and the simulations, not placed buildings. This reverses the 2026-10-16 decision
  that city tuning needs no factory release.
- **Cross-repo friction remains.** A new type still needs an import, a game build and a Worker
  redeploy. Authoring becomes factory-only; shipping does not.
- **Previews approximate.** The site shows glass opaque, cannot paint station names, and runs
  types on fixtures, not real terrain.
- **Open questions:**
  - Whether facade style names form a frozen, game-owned list the factory validates against.
  - What an owned collection item for a retired type shows.
  - Whether line decorations, portal styles and catenary styles should become collectible.
  - Which block type an unknown block id draws as.
  - Whether the small props without a type set (below) join a later spec.
  - Whether the public API or the marketing site will want factory text in other languages.

## Out of scope

- Small fixed props with no type set: semaphores, road signs, crossing signals, the watchtower
  balloon and the lake-spring cottage. They were not offered as sets *(derived)*.
- The terrain material enum, palette, classifier and splat pipeline; the water normal map.
- City types, city profiles, CityGen and grading.
- All world solvers: station tracks, the road-station solver, port and airport layouts, berths,
  taxiways, the rope plan, the tunnel bore and cover, the dam body, the catenary planner, road
  junctions and terrain flattening.
- Numeric factory parameters.
- Localizing the factory site UI, OpenTTD names and the GLB ZIP.
- Visual improvements of moved sets beyond the 1:1 port.
- Publishing the factory export to the game outside the implementation of each phase.
