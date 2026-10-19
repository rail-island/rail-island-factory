# Agent Instructions

**Rail Island Factory** generates procedural models for Rail Island and hosts their
catalog at `factory.railisland.com`. The game repository, `rail-island-webapp`,
imports the generated JS models, thumbnails and metadata from the export folder.
The factory owns the models and their game properties (docs/models/game-properties.md);
the game consumes them. **No GLB file is written**: GLB bytes are generated only
in memory for thumbnails, stats, checks and tests (docs/models/export.md).

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
  written. A design's JS model and in-memory GLB bytes must not change unless the
  design changed.
- **Every design supplies its own low level of detail** (`buildLod`, exported from
  its source module; docs/models/lod.md): there is no generic fallback. Reuse the
  family's LOD adapter or the shared kit (`generator/lodKit.ts`).
- **Every vehicle states its game properties** (`game` on the design: weight,
  power, maxspeed, accel); the build fails without them.
- **`export/` and `dist/` are generated and gitignored.** Never commit them.
- The site is **English only**; there is no i18n layer.
- Every bug fix ships with a regression test in the suite that owns the behaviour.
- Use ASCII in code and comments; no emoji.
- **Source inspiration is stored in git.** Every reference a model is built
  from - a user-supplied GLB or photo, a downloaded photo or drawing - lives in
  `assets/<name>/` (one folder per model, named after it), is listed in
  `assets/<name>/SOURCES.md` (file, origin or URL, author, licence, use) and is
  committed with the model; the design points at it with `references: "<name>"`.
  `assets/_tmp/` is only an inbox for user uploads: when you build a model from a
  file there, `git mv` it into the model's folder in the same change, and never
  leave downloaded references only in a scratch directory.

## Git

- **Publishing to the game is a separate, standalone step** (the webapp's
  import of the export folder). Never do it as part of a factory change unless
  asked to.

## Skills

- **`tree`** (`.agents/skills/tree/`) - use whenever a procedural tree is added or
  changed: five numbered seeds, full/low/coarse triangle budgets, optional Max
  detail, matching LOD silhouettes and headless previews.

- **`building`** (`.agents/skills/building/`) - use whenever a building is added or changed: row houses up to 10,000 triangles, large landmarks 20,000-30,000, references, structural detail and headless checks.

- **`road-vehicle`** (`.agents/skills/road-vehicle/`) - use it whenever a road
  vehicle model is added or changed: triangle budget, steered front wheels, the
  truck/trailer split, an articulated bus's sections and joints, checks.
- **`railroad-vehicle`** (`.agents/skills/railroad-vehicle/`) - use it whenever a
  railway vehicle is added or changed: rail dimensions, running gear, one raised
  pantograph on two-pantograph electric locomotives, and headless checks.
- **`aircraft`** (`.agents/skills/aircraft/`) - use it whenever an aircraft or an
  airline livery is added or changed: the 10,000-triangle budget, bodies and decals,
  the airframe/gear parts, liveries and headless checks.
- **`vlakosimdb-transfer`** (`.agents/skills/vlakosimdb-transfer/`) - use it when
  reconstructing or correcting a vehicle from vlakosimdb: XML shapes, original
  BMP measurements, comparison-table optimization and presentation to the user.

## Verify changes

`pnpm typecheck`, `pnpm test` and `pnpm build`. `pnpm test` takes about three
minutes: it checks each design's defaults and a fixed sample of its other
parameter combinations; after changing a design's parameters or a shared
builder, also run `TEST_ALL_VARIANTS=1 pnpm test`, which checks every one
(docs/guide/setup-and-build.md). For a model change, also look at
`export/thumbs/<id>.png` after `pnpm build:models`.

**Headless verification only**: do not drive a real browser (no dev server +
browser automation) unless the task is about browser tooling and the user agreed
first. The user runs the browser checks.

## Show the user the model

Whenever you create a model, change one or add variants (liveries, shapes,
parameter presets), **send the user images of the result in the chat** before
you finish. The user often works from the web or mobile chat with no
development environment, so the images you send are the only way they see the
model and decide what to improve; a path to `export/thumbs/` is not enough.

- Render headlessly (`pnpm build:models` for `export/thumbs/<id>.png`, plus
  `pnpm exec tsx generator/renderGlbThumb.ts <id> <out.png> 512|side` and
  scratch copies of it with another `VIEW_DIR` for front, rear, top or
  close-up views). Write the PNGs to your scratchpad or another directory the
  user can open, never into the repository.
- Send them as files with the chat's file-sending tool (in Claude Code:
  `SendUserFile`, `display: "render"`), not only as paths in the text.
- Send at least the three-quarter view and, for a vehicle, the side view; for
  a change, a before/after pair; for variants, every variant (one image each,
  or one labelled sheet from `generator/contactSheet.ts` when there are many:
  `--vary <param,...>` or `--variants`; docs/models/export.md). Add views the change is about
  (a steered or articulated pose, a raised pantograph, a detail close-up).
- Caption each image with the model id and the view, and say in the reply what
  you would improve next, so the user can pick from it.
