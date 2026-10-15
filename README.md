# Rail Island Factory

The model factory for [Rail Island](https://railisland.com): Rail Island models
generated from code, and the catalog site that shows them at
[factory.railisland.com](https://factory.railisland.com).

Today it builds ten procedurally generated skyscrapers, an American truck with its trailer, the buses from vlakosimdb (steerable front wheels, articulated joints the game can bend), Czech locomotives, coaches and wagons, and procedural reproductions of the game's landmarks, stations, aircraft, ships, cable car cabins and trucks.
Every model is written as
a GLB with a thumbnail and a catalog entry, in an export folder that the game
(`rail-island-webapp`) can import.

## Tech stack

- **TypeScript (strict)**, run with `tsx` for the generator
- **[Solid](https://www.solidjs.com) + [Vite](https://vite.dev)** for the site,
  **[three.js](https://threejs.org)** for its 3D preview
- **[Vitest](https://vitest.dev)** for tests, **pnpm** as the package manager
- **Cloudflare Workers** (assets only) for hosting, deployed by GitHub Actions

## Quickstart

```bash
pnpm install
pnpm build:models   # generate export/ (GLBs, standalone JS models, thumbnails, meta.json, catalog.json)
pnpm dev            # the site on http://localhost:5173
pnpm test           # Vitest
pnpm build          # models + typecheck + production site in dist/
```

## Documentation

Everything else is in [`docs/`](docs/README.md).
