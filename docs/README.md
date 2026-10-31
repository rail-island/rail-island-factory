# Documentation

**Covers** - the index of this repository's documentation, one row per file.
**Code** - none
**See also** - [../README.md](../README.md), [../AGENTS.md](../CLAUDE.md)

| File | What it covers |
|---|---|
| [models/legacy-mapping.md](models/legacy-mapping.md) | Complete Creator mapping, canonical procedural IDs, metre units and runtime compatibility |
| [models/historical.md](models/historical.md) | Detailed Pagoda, parametric Castle and Palace, landmark budgets and authoring skill |
| [models/remaining-models.md](models/remaining-models.md) | Remaining fountains, historical buildings, aircraft, liner, cabin and freight variants |
| [guide/setup-and-build.md](guide/setup-and-build.md) | installing, the scripts, what `pnpm build` produces, tests |
| [guide/deploy.md](guide/deploy.md) | the Cloudflare Worker, the GitHub Actions workflows, secrets |
| [models/lod.md](models/lod.md) | Low-detail JS variants, triangle budgets, structural silhouettes, flicker checks and preview toggle |
| [models/skyscrapers.md](models/skyscrapers.md) | the ten skyscraper designs, their four sizes, the mesh builder, adding a design |
| [models/village.md](models/village.md) | the eight parametric village houses in the Kenney and Quaternius styles and the alpine hut: plan families, the house builder, finish parameters, scale and tests |
| [models/commercial-streets.md](models/commercial-streets.md) | eleven additional street and historic commercial families, the 82-object legacy inventory and provisional mapping |
| [models/panel-houses.md](models/panel-houses.md) | the panel houses of a housing estate (the slab and the point tower block): sections, storeys, facades, balconies, flat or pitched roofs, colours, party walls, city use and the `panel_estate` block type |
| [models/commercial.md](models/commercial.md) | five Kenney-style commercial families with 3,000 architectural and finish variants, a 10,000-triangle ceiling, catalog and export |
| [models/industry.md](models/industry.md) | Industry audit, eleven procedural families, budgets and future migration mapping |
| [models/vehicles.md](models/vehicles.md) | the procedural road and rail vehicles, budgets, articulation, pantograph operating poses, native-reference calibration and adding a vehicle |
| [models/buses.md](models/buses.md) | the buses from vlakosimdb: the Karosa short and long families, the single models, the shared bus builder, sources and tests |
| [models/vehicle-rig.md](models/vehicle-rig.md) | what the game moves: steered front wheels, articulated sections and the joint renderer, the `rig`, `pose()` / `renderJoint()`, the Pose sliders |
| [models/parameters.md](models/parameters.md) | parametric models: enum parameters, the default-only thumbnail, `params` in the meta entries and the JS model, the site's picker |
| [models/csd-coaches.md](models/csd-coaches.md) | the CSD coaches from vlakosimdb: sources, the shared coach builder, deviations, the native-raster comparison and tests |
| [models/cd-green-white.md](models/cd-green-white.md) | the parametric CD green and white coach: ten vlakosimdb coaches (the blue Bee 001 among them) as one `variant` parameter |
| [models/czsk-coaches.md](models/czsk-coaches.md) | the Czech and Slovak coaches in later liveries: `veh-cd-y-coach`, `veh-zsr-coach`, `veh-uic-z-coach` (with its DB IC and OBB operators), their livery builder and comparison |
| [models/loco-liveries.md](models/loco-liveries.md) | the parametric locomotives: CD 150 / 151 / ZSR 350, CD 163 / 363 and CD 263 / 371 / 372 liveries, the livery model, cab paint, the 263's machine room |
| [models/cd-230.md](models/cd-230.md) | the parametric CD 230 / 240 / 340 / 242 "laminatka": the rounded nose, the face laid on the curved skin, five liveries, the native comparison |
| [models/mainline-electrics.md](models/mainline-electrics.md) | the six-axle Czech and the German and Austrian electric locomotives from vlakosimdb: CD 180 / 181 / 182, DNT 184.5, DB 111, DR 243 / DB 143 / 112, OBB 1012 and 1040, the data-driven box-cab builder, the native comparison |
| [models/cz-electrics.md](models/cz-electrics.md) | the Czech electric locomotives from vlakosimdb: CD 110 / 111 / 210, CD 123 / 130, CD 140, CD 169, the shared shell and pantograph kit, the native comparison |
| [models/foreign-units.md](models/foreign-units.md) | the parametric foreign units from vlakosimdb: the DB 628 (two liveries), the MAV MDmot set, the ICE 1 and the TGV (three cars, two liveries; how the articulated coaches share their Jacobs bogies), the shared unit parts, the native comparison |
| [models/czech-emus.md](models/czech-emus.md) | the parametric Czech electric units: the CD 471 CityElefant (three cars, the vlakosimdb CD 675 as a variant) and the CD 680 Pendolino (four cars) as `unit` values, the shared EMU parts, the native comparison |
| [models/cd-230.md](models/cd-230.md) | the parametric CD 230 / 240 / 340 "laminatka": the rounded nose, the face laid on the curved skin, four liveries, the native comparison |
| [models/diesel-locos.md](models/diesel-locos.md) | the Czech mainline diesel locomotives from vlakosimdb: CD 749 / 750 / 753 / 754, CD 781, T 679.0, T 499.0 and CD 771; the shared diesel toolkit, liveries, the native comparison and tests |
| [models/czech-emus-classic.md](models/czech-emus-classic.md) | the older Czech electric units from vlakosimdb: the CD 451 "zabotlam" and the CD 470 double-deck prototype (motor car, trailer) and the CD 460 (motor car, trailer; four liveries), their shared kit, the scales and the native comparison |
| [models/czech-dmus.md](models/czech-dmus.md) | the Czech diesel railcars from vlakosimdb: CD 810, CD 812 / 912 Esmeralda, CD 843 / 943 / 043, CSD M 131.1 with its trailer, CSD M 240.0, CSD M 296.1 / CD 853 / 854; the railcar kit, the photographed cab faces, the native comparison |
| [models/small-diesels.md](models/small-diesels.md) | the small and shunting diesels from vlakosimdb: CD 704 / T 238.0, CD 710, CD 714, CD 740 / 742 / 743, DB V 100 / 212 and the MUV 69 track motor car, the shared hood and running-gear kit, the native comparison |
| [models/jr-kiha40.md](models/jr-kiha40.md) | the JR KiHa 40 diesel railcar in the JR Hokkaido, JNR vermilion and JNR general liveries: references, dimensions, the railcar kit with a metric frame, the gauge and the tests |
| [models/dr-vt1816.md](models/dr-vt1816.md) | the DR VT 18.16 "Delfin" diesel express unit: the power car, the VMc, VMd and VMe intermediate cars and the articulated full train (`cars` 2 .. 8) as `unit` values, the drawing's dimensions, the bodies lofted through vertical slices, the nose, the cockpit and the tests |
| [models/shinkansen-0.md](models/shinkansen-0.md) | the Shinkansen 0 series: the end car, the motor and pantograph cars, the Green and buffet cars and the articulated full train (`cars` 2 .. 16) as `unit` values, three liveries, the shared slice body, the nose, the formation and the tests |
| [models/tgv-duplex.md](models/tgv-duplex.md) | the TGV Duplex: the power car, the end, intermediate and bar trailers and the full train (`cars` 4 .. 12) on Jacobs bogies as `unit` values, four liveries, the shared slice body, the pantographs and the tests |
| [models/german-coaches.md](models/german-coaches.md) | the German coaches from vlakosimdb: the DB n-Wagen (Bn, ABn, the Karlsruher Kopf driving trailer; two liveries), the DB Regio and the DR double-deck coaches with their driving trailers; sloped-nose panels, the native comparison and tests |
| [models/bmo-double-deck.md](models/bmo-double-deck.md) | the parametric Bmo double-deck coach: the CSD and three CD liveries as one `livery` parameter |
| [models/steam-locomotives.md](models/steam-locomotives.md) | the nine steam locomotives from vlakosimdb, locomotive and tender as `unit` variants, the shared builder, deviations, the native comparison and tests |
| [models/trams.md](models/trams.md) | the trams and the metro car from vlakosimdb: Tatra T3, T6A5, KT8D5 and KT4, the GT4, the 81-71; the tram builder, the drawing-to-published map, articulated sections, pantographs, the native comparison and tests |
| [models/animation.md](models/animation.md) | animation clips of parts and what plays each (`clipDrives`: time, distance, state, door, motion), the wind turbine, the oil pumpjack's mechanism, the steam locomotives' running-gear clip and its timing contract, the pantographs as `liftable` mechanisms, the `rod` primitive and the collector heights, the site's Start/Stop, Up/Down and a character's motion buttons |
| [models/doors.md](models/doors.md) | the passenger doors that open on every tram, coach, unit and bus: the `door` clip drive and its side, the fold, swing and plug motions, `openable`, the coach kit's opening door, the doorways cut through the shell, the designs, the site's Open left / Open right / Close buttons |
| [models/interiors.md](models/interiors.md) | the generic cabin behind every passenger door: the interior part hidden while the doors are shut (`userData.interiors`), floor, walls, reveals and seat rows clear of the doors, each kit's doorway cut, the interior budget, the gap strips, the site's Interior toggle |
| [models/lamps.md](models/lamps.md) | the vehicles' lamps: lamp roles on palette entries (head, tail, brake, indicator), lit colours, the exported `lamps` table and how a consumer splits front from rear and left from right, marker materials, the site's Lights button |
| [models/wagons.md](models/wagons.md) | the five freight wagons from vlakosimdb (Nas, Ua, Eas, Raj, Rah), three of them parametric by `cargo`: sources, the shared wagon parts, the native-raster comparison and tests |
| [models/freight-wagons.md](models/freight-wagons.md) | the Sqns container, Pao flat, Habis sliding-wall, Hadgs covered hopper and Faccs, Falls and Wap hopper wagons from vlakosimdb, by `cargo` and `livery`: the JT7 clip solid, loads, deviations, the native comparison and tests |
| [models/reproductions.md](models/reproductions.md) | the 25 reproductions of the webapp's hand-authored models: photos, ids, same-size rule, budgets, what a webapp import must change |
| [models/churches.md](models/churches.md) | the baroque church, the Vrchlabi church and the twin-tower baroque church |
| [models/cathedrals.md](models/cathedrals.md) | St Basil's Cathedral and St Nicholas Church |
| [models/gothic-cathedrals.md](models/gothic-cathedrals.md) | Notre-Dame and Prague Castle's St Vitus: Gothic geometry, references, axes and the 30,000-triangle budget |
| [models/landmarks.md](models/landmarks.md) | the Brandenburg Gate, the Louvre Pyramid and the White House |
| [models/towers.md](models/towers.md) | all eight Towers: procedural designs, parameters, budgets, reference attribution and scale conversion |
| [models/stations.md](models/stations.md) | the five station buildings: Prague main station, the station building, the Mikulasovice halt, the suburban station, the station hotel; their triangle tiers |
| [models/station-types.md](models/station-types.md) | the eight railway station types of the `station` set: layouts, the deck (end ramps, island underpasses), the train sheds' vault, the village depot, the gauge rule and the triangle budgets |
| [models/aircraft.md](models/aircraft.md) | the Aero A.10, the Airbus A380, the Boeing 737-800, the MD-11, 747-400 and Beluga, the light jet and the small two-seat airplane, airline liveries, their gear parts |
| [models/ships.md](models/ships.md) | the cruise ferry, the hydrofoil and the passenger ferry, their waterlines |
| [models/cable-car-stations.md](models/cable-car-stations.md) | the four cable car station types: the whole station the set module draws for the game's view (hall, head, bull wheel, curved or rectangular platform, stairs), per-type platforms, levels, clearances, budget, the pylon |
| [models/cable-cabins.md](models/cable-cabins.md) | the aerial tramway car, the small gondola and the parametric chairlift chair (seats, bubble, colour), their rope, sill and seat datums |
| [models/trucks.md](models/trucks.md) | the cistern semi-truck, the concrete mixer and the reefer semi-truck |
| [models/emitters.md](models/emitters.md) | where models smoke, steam and flare, and a fountain's water: `emit`, `pool`, `jet`, the export |
| [models/js-format.md](models/js-format.md) | the standalone JS model (`export/js/<id>.js`, `build(THREE)`), how it is bundled, the sizes |
| [models/source-tree.md](models/source-tree.md) | the procedural source tree: scopes, `export/tree/<id>.json`, highlight and picking |
| [models/trees.md](models/trees.md) | the fourteen tree species the game plants: one design each, high, low and coarse levels, the geometry kit, the stylised look (baked light and shade, ragged and wide crowns), budgets |
| [models/woods.md](models/woods.md) | the woods types: distribution functions keyed by name, the cell context and the four-tree limit, the forest rule (edges, groves, glades, understorey), the modules, `woods.meta.json`, grove previews |
| [models/sets.md](models/sets.md) | the set registry: structure, rail and road, block and catenary sets, frozen ids, defaults and aliases, landed sets and what each module holds (the seven block archetypes, their parameters and the shared city fill), previews, pins, `export/sets/` metas, modules and declarations |
| [models/bridges.md](models/bridges.md) | the bridge types: what each builds over the game's path, the deck section, piers and abutments, structural spans and the cable types' shared towers, overhead members, part tags, triangle budgets per length |
| [models/previews.md](models/previews.md) | the site's preview designs: one page per structure, rail and road type, decoration, catenary style, city block and texture; categories, bound types, preview parameters, the drawing kit, the block composer |
| [models/characters.md](models/characters.md) | the characters the game's walk mode moves: the avatar, its frame, parts and pivots, the six clips (idle, walk, run, jump, fall, sit) and their drives, foot contact, the seat height, the low detail, `characters.meta.json`, the site's motion buttons |
| [models/props.md](models/props.md) | the fixed props the game's structures place: the box vocabulary and prop kit, `<kind>#<rrggbb>` materials, the port and airport props and the signals, `props.meta.json` |
| [models/text.md](models/text.md) | the exported text in the game's 14 languages: keys, phrasebooks keyed by English, verbatim titles, overrides, `export/text/`, the gap check |
| [models/surfaces.md](models/surfaces.md) | the texture library (photo sets, sources, the cap, the fetch script), named surfaces and their tint rule, opting a material in, the UVs and `userData.surfaces`, `export/textures/` and `surfaces.meta.json` |
| [models/export.md](models/export.md) | the export folder: JS models, thumbnails, `skyscrapers.meta.json`, `village.meta.json`, `vehicles.meta.json`, `characters.meta.json`, `catalog.json`; the in-memory GLB the build analyses |
| [site/openttd-export.md](site/openttd-export.md) | the site's export list ("Add to export", the Export panel, its localStorage key) and the two formats it writes in the browser: an OpenTTD NewGRF (true-proportion sprites, articulated parts, the `openttd` block and its defaults, the GRF encoder) and a ZIP of GLBs |
| [models/game-properties.md](models/game-properties.md) | what the game needs beyond geometry: vehicle weight, power, speed, draft and rope heights, per-variant figures, building plaza and block rules, city variants (shapes, colour palettes, height bands) and party walls; declared on each design, checked, exported |
| [site/catalog-site.md](site/catalog-site.md) | the factory.railisland.com site: listing (table, cards, variant thumbnails rendered in the browser), sorting, search, 3D preview (pantograph Up/Down, a character's motion buttons, the scenery under a vehicle or a character), local dev without a build |

`docs/specs/` and `docs/impl/` are planning records (a spec and the notes on how
it was built), not reference.

## Workflow skills

- [Tree](../.agents/skills/tree/SKILL.md): five seeds, tree LOD budgets and headless previews.
- [Road vehicle](../.agents/skills/road-vehicle/SKILL.md): road geometry and articulation.
- [Railroad vehicle](../.agents/skills/railroad-vehicle/SKILL.md): rail geometry, operating pantographs and verification.
- [Vlakosimdb transfer](../.agents/skills/vlakosimdb-transfer/SKILL.md): XML profiles, native-pixel comparison tables, optimization and user-facing evidence.
