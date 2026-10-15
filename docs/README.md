# Documentation

**Covers** - the index of this repository's documentation, one row per file.
**Code** - none
**See also** - [../README.md](../README.md), [../AGENTS.md](../CLAUDE.md)

| File | What it covers |
|---|---|
| [guide/setup-and-build.md](guide/setup-and-build.md) | installing, the scripts, what `pnpm build` produces, tests |
| [guide/deploy.md](guide/deploy.md) | the Cloudflare Worker, the GitHub Actions workflows, secrets |
| [models/skyscrapers.md](models/skyscrapers.md) | the ten skyscraper designs, the mesh builder, adding a design |
| [models/village.md](models/village.md) | the five parametric village houses in the Kenney style: plan families, the house builder, finish parameters, scale and tests |
| [models/vehicles.md](models/vehicles.md) | the procedural road and rail vehicles, budgets, articulation, pantograph operating poses, native-reference calibration and adding a vehicle |
| [models/buses.md](models/buses.md) | the buses from vlakosimdb: the Karosa short and long families, the single models, the shared bus builder, sources and tests |
| [models/vehicle-rig.md](models/vehicle-rig.md) | what the game moves: steered front wheels, articulated sections and the joint renderer, the `rig`, `pose()` / `renderJoint()`, the Pose sliders |
| [models/parameters.md](models/parameters.md) | parametric models: enum parameters, the default-only GLB, `params` in the meta entries and the JS model, the site's picker |
| [models/csd-coaches.md](models/csd-coaches.md) | the CSD coaches from vlakosimdb: sources, the shared coach builder, deviations, the native-raster comparison and tests |
| [models/cd-green-white.md](models/cd-green-white.md) | the parametric CD green and white coach: nine vlakosimdb coaches as one `variant` parameter |
| [models/loco-liveries.md](models/loco-liveries.md) | the parametric locomotives: CD 150 / 151 / ZSR 350, CD 163 / 363 and CD 263 / 371 / 372 liveries, the livery model, cab paint, the 263's machine room |
| [models/cd-230.md](models/cd-230.md) | the parametric CD 230 / 240 / 340 "laminatka": the rounded nose, the face laid on the curved skin, four liveries, the native comparison |
| [models/bmo-double-deck.md](models/bmo-double-deck.md) | the parametric Bmo double-deck coach: the CSD and three CD liveries as one `livery` parameter |
| [models/wagons.md](models/wagons.md) | the five freight wagons from vlakosimdb (Nas, Ua, Eas, Raj, Rah), three of them parametric by `cargo`: sources, the shared wagon parts, the native-raster comparison and tests |
| [models/reproductions.md](models/reproductions.md) | the 23 reproductions of the webapp's hand-authored models: photos, ids, same-size rule, budgets, what a webapp import must change |
| [models/churches.md](models/churches.md) | the baroque church, the Vrchlabi church and the twin-tower baroque church |
| [models/cathedrals.md](models/cathedrals.md) | St Basil's Cathedral and St Nicholas Church |
| [models/landmarks.md](models/landmarks.md) | the Brandenburg Gate, the Louvre Pyramid and the White House |
| [models/stations.md](models/stations.md) | the four station buildings: Prague main station, the station building, the Mikulasovice halt, the suburban station |
| [models/aircraft.md](models/aircraft.md) | the Aero A.10, the Airbus A380 and the light jet, their gear parts |
| [models/ships.md](models/ships.md) | the cruise ferry, the hydrofoil and the passenger ferry, their waterlines |
| [models/cable-cabins.md](models/cable-cabins.md) | the aerial tramway car and the small gondola, their rope and sill datums |
| [models/trucks.md](models/trucks.md) | the cistern semi-truck, the concrete mixer and the reefer semi-truck |
| [models/js-format.md](models/js-format.md) | the standalone JS model (`export/js/<id>.js`, `build(THREE)`), how it is bundled, the sizes |
| [models/source-tree.md](models/source-tree.md) | the procedural source tree: scopes, `export/tree/<id>.json`, highlight and picking |
| [models/export.md](models/export.md) | the export folder: GLBs, thumbnails, `skyscrapers.meta.json`, `village.meta.json`, `vehicles.meta.json`, `catalog.json` |
| [site/catalog-site.md](site/catalog-site.md) | the factory.railisland.com site: listing, sorting, search, 3D preview |

`docs/specs/` and `docs/impl/` are planning records (a spec and the notes on how
it was built), not reference.

## Workflow skills

- [Road vehicle](../.agents/skills/road-vehicle/SKILL.md): road geometry and articulation.
- [Railroad vehicle](../.agents/skills/railroad-vehicle/SKILL.md): rail geometry, operating pantographs and verification.
- [Vlakosimdb transfer](../.agents/skills/vlakosimdb-transfer/SKILL.md): XML profiles, native-pixel comparison tables, optimization and user-facing evidence.
