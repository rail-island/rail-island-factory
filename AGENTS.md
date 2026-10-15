# Agent Instructions

This is **Rail Island Factory**: Rail Island models generated from code, and the
catalog site that shows them at `factory.railisland.com`. Today it builds ten
procedural skyscrapers, road vehicles (an American truck with a trailer, the
vlakosimdb buses) and rail vehicles (locomotives, coaches). The build writes an
export folder (GLBs, thumbnails, `skyscrapers.meta.json`, `vehicles.meta.json`) that the game repository, `rail-island-webapp`, is meant
to import - the factory is the source of these models, the game a consumer.

## Documentation (`docs/`)

All documentation lives in **`docs/`**, indexed by hand in `docs/README.md`; the
root `README.md` is a landing page only. **When you change behaviour, update the
document that owns it in the same change.** Conventions:

- One file, one subsystem, about 600 lines at most.
- Every file opens with `# Title` and three lines - **Covers**, **Code** (the
  source paths it documents) and **See also**.
- A new file gets a row in `docs/README.md` in the same change.
- Cross-references are relative paths between documents. English only.
- `docs/specs/` and `docs/impl/` are planning records, not reference.

## Stack

- **TypeScript (strict)**. `generator/` is Node-only, run with `tsx`.
- The site is **Solid** (`solid-js`) + **Vite**, three.js for the 3D preview. Do
  not use React APIs; use signals, `createEffect`/`onMount`/`onCleanup`,
  `<Show>`/`<For>`/`<Switch>`, do not destructure props, `class` not `className`.
- Tests are **Vitest** under `test/`. Package manager is **pnpm**.
- Hosting is an assets-only **Cloudflare Worker** (`wrangler.jsonc`), deployed by
  `.github/workflows/deploy.yml` on every push to `master`.

## Rules

- **`src/` may import only types from `generator/`** (`generator/catalog.ts` has
  no `node:` imports). Generator code must never reach the browser bundle.
- **Model ids are stored in the game's saved maps** - never rename a shipped one.
- **Output stays deterministic**: no timestamps, no unordered iteration in what is
  written. A design's GLB bytes must not change unless the design changed.
- **`export/` and `dist/` are generated and gitignored.** Never commit them.
- The site is **English only**; there is no i18n layer.
- Every bug fix ships with a regression test in the suite that owns the behaviour.
- Use ASCII in code and comments; no emoji.

## Git

- **Commit and push straight to `master`.** Do not create `claude/...` or other
  feature branches, and do not open pull requests. The factory is not public:
  a push to `master` deploys the catalog site, it does not ship anything to
  players.
- **Publishing to the game is a separate, standalone step** (the webapp's
  import of the export folder). Never do it as part of a factory change unless
  asked to.

## Skills

- **`road-vehicle`** (`.agents/skills/road-vehicle/`) - use it whenever a road
  vehicle model is added or changed: triangle budget, steered front wheels, the
  truck/trailer split, an articulated bus's sections and joints, checks.
- **`railroad-vehicle`** (`.agents/skills/railroad-vehicle/`) - use it whenever a
  railway vehicle is added or changed: rail dimensions, running gear, one raised
  pantograph on two-pantograph electric locomotives, and headless checks.
- **`vlakosimdb-transfer`** (`.agents/skills/vlakosimdb-transfer/`) - use it when
  reconstructing or correcting a vehicle from vlakosimdb: XML shapes, original
  BMP measurements, comparison-table optimization and presentation to the user.

## Verify changes

`pnpm typecheck`, `pnpm test` and `pnpm build`. For a model change, also look at
`export/thumbs/<id>.png` after `pnpm build:models`.

**Headless verification only**: do not drive a real browser (no dev server +
browser automation) unless the task is about browser tooling and the user agreed
first. The user runs the browser checks.
