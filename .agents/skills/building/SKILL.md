---
name: building
description: Create or improve procedural buildings in Rail Island Factory, especially row houses and Historical landmarks. Use for building geometry, roof and facade detail, variants, triangle budgets and headless verification.
---

# Procedural buildings

- Inspect the existing generator, catalog parameters, reference GLB and thumbnail first. Preserve shipped IDs, parameter values, orientation, ground level and intended scale. Compare silhouette and architectural character, not raw vertex count; imported source units may need normalization.
- **Store the source inspiration in git**: a reference GLB or photo the user supplied (often in `assets/_tmp/`, which is only an inbox: `git mv` it) and any photos you download go to `assets/<name>/`, each listed in `assets/<name>/SOURCES.md` (file, origin or URL, author, licence, use), and the design sets `references: "<name>"`. Commit them with the model; downscale photos to about 1600 px on the long side.
- **Row houses: at most 10,000 triangles per complete building.** Prioritize coherent street frontage, party walls that join without gaps, floor/window rhythm, recessed entrances, cornices, roof profile, dormers and chimneys. Keep detail on visible facades; do not spend geometry on hidden interiors or party-wall decoration.
- **Large landmarks: 20,000-30,000 triangles per complete model, including every variant.** Spend the budget on distinctive massing, roof curvature, galleries, towers, real openings and readable structural detail. Do not reach the target through invisible subdivision or duplicated faces.
- Start with massing and silhouette, then structure, then restrained surface detail. Use a small coherent material palette. Thin details must remain legible from the game's camera. Render against the original before calling the improvement complete.
- Use deterministic `MeshBuilder` geometry in named `scope()` groups. Keep shared helpers Node-free for standalone JS export. Avoid coplanar overlays, degenerate triangles and floating parts; use actual depth for relief and openings for passages.
- Update the dedicated LOD silhouette with any massing change; Historical LOD stays within 500 triangles. Preserve full-detail/LOD parameter behavior.
- Register designs in the existing family and preserve catalog metadata. Update the owning English document and `docs/README.md`; factory changes do not implicitly authorize importing assets into the game.
- Test all shape variants: triangle budget, finite/nondegenerate geometry, grounded bounds, deterministic GLB bytes, coplanar overlap detection and important openings. Verify standalone JS/GLB parity where available. Run `pnpm typecheck`, `pnpm test`, `pnpm build`; inspect generated thumbnails headlessly. No real-browser automation for model work.

Reference: `docs/models/historical.md` and `docs/models/export.md`.

## Low level of detail

Every design needs its own `buildLod` (docs/models/lod.md); a design without one
does not compile. Extend the family's LOD adapter (`generator/lod*.ts`) or build on
the shared kit (`generator/lodKit.ts`): silhouette first, colours as bands, then
no windows (100 triangles; 500 for landmarks, towers and skyscrapers); keep every parameter combination within its budget, and review a full/LOD
contact sheet.
