# Documentation

**Covers** - the index of this repository's documentation, one row per file.
**Code** - none
**See also** - [../README.md](../README.md), [../AGENTS.md](../CLAUDE.md)

| File | What it covers |
|---|---|
| [guide/setup-and-build.md](guide/setup-and-build.md) | installing, the scripts, what `pnpm build` produces, tests |
| [guide/deploy.md](guide/deploy.md) | the Cloudflare Worker, the GitHub Actions workflows, secrets |
| [models/skyscrapers.md](models/skyscrapers.md) | the ten skyscraper designs, the mesh builder, adding a design |
| [models/vehicles.md](models/vehicles.md) | the procedural road and rail vehicles, budgets, articulation, pantograph operating poses, native-reference calibration and adding a vehicle |
| [models/parameters.md](models/parameters.md) | parametric models: enum parameters, the default-only GLB, `params` in the meta entries and the JS model, the site's picker |
| [models/csd-coaches.md](models/csd-coaches.md) | the CSD coaches from vlakosimdb: sources, the shared coach builder, deviations, the native-raster comparison and tests |
| [models/cd-green-white.md](models/cd-green-white.md) | the parametric CD green and white coach: nine vlakosimdb coaches as one `variant` parameter |
| [models/bmo-double-deck.md](models/bmo-double-deck.md) | the parametric Bmo double-deck coach: the CSD and three CD liveries as one `livery` parameter |
| [models/js-format.md](models/js-format.md) | the standalone JS model (`export/js/<id>.js`, `build(THREE)`), how it is bundled, the sizes |
| [models/source-tree.md](models/source-tree.md) | the procedural source tree: scopes, `export/tree/<id>.json`, highlight and picking |
| [models/export.md](models/export.md) | the export folder: GLBs, thumbnails, `skyscrapers.meta.json`, `vehicles.meta.json`, `catalog.json` |
| [site/catalog-site.md](site/catalog-site.md) | the factory.railisland.com site: listing, sorting, search, 3D preview |

`docs/specs/` and `docs/impl/` are planning records (a spec and the notes on how
it was built), not reference.

## Workflow skills

- [Road vehicle](../.agents/skills/road-vehicle/SKILL.md): road geometry and articulation.
- [Railroad vehicle](../.agents/skills/railroad-vehicle/SKILL.md): rail geometry, operating pantographs and verification.
- [Vlakosimdb transfer](../.agents/skills/vlakosimdb-transfer/SKILL.md): XML profiles, native-pixel comparison tables, optimization and user-facing evidence.
