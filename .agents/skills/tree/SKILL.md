---
name: tree
description: Create or improve procedural tree models in Rail Island Factory, with five numbered seeds, full/low/coarse triangle budgets, optional Max detail, consistent LOD silhouettes, and headless visual verification. Use for any tree species or tree variant.
---

# Trees

Create a recognisable species with connected branches, an irregular crown and
five deterministic shapes. This is a repository skill; paths below are relative
to the repository root. Read `docs/models/trees.md` for the geometry and forest
contract, and inspect the relevant species builder before editing it.

## Triangle budgets

Budgets apply to the entire built tree, summed across wood, foliage, materials
and parts, for every seed and parameter combination. Count emitted triangles
with `MeshBuilder.triangleCount()` and the in-memory GLB, not primitive estimates.

| Level | Budget | Builder and standalone API |
| --- | ---: | --- |
| Full (`high`) | 2,000 for new trees | `build` / default `build(THREE, values)` |
| Low (`low`) | 300 family ceiling; preserve tighter species limits | `buildLod` / default `build(THREE, values, true)` |
| Coarse (`coarse`) | 20 maximum; preserve tighter species limits | `buildCoarse` / `buildCoarse(THREE, values)` |
| Max detail (`max`, optional) | 10,000 | `buildMax` / `buildMax(THREE, values)` |

Existing species retain their full and coarse budgets from
`test/fixtures/tree-baseline.json`; their low limit is
`floor(baseline[species + ":low"].tris * 1.05)`, subject to the family ceiling.
Do not raise a shipped species' allowance just to fit a redesign. Species with
an explicitly documented redesign budget use that budget.
The 2,000 full-detail target for new trees does not retroactively change the
legacy models. User-specified budgets take precedence; update the corresponding
tests and reference documentation if an allowance changes.

Every tree needs dedicated low and coarse builders. Max detail is optional.
When requested for a species without it, add a real `buildMax` and extend the
shared module dispatch and tests; do not advertise unsupported levels.
`maxDetail: true` in the catalog is derived from `buildMax`.
Keep Max separate from the default tree used by forests.

## Five seeds

- For each new or reworked tree, expose a `seed` enum titled `Tree seed`, with
  values and visible labels `1`, `2`, `3`, `4`, `5`; default to `1`.
- Resolve the same selected seed and other parameters in every detail builder.
  A seed should vary branch angles, reach, crown asymmetry and clump placement,
  with leaf orientation and shading as secondary variation. Five recolours of
  identical geometry are not five tree shapes.
- Use a local seeded RNG or stable hashes. Separate structural randomness from
  detail randomness so adding leaves does not rearrange branches at another LOD.
- Keep shipped seed meanings stable. Use `ParamSpec.retired` for old tokens,
  retaining their geometry and saved URLs. For example, a former numeric seed
  can become the internal value for a numbered label while the old token stays
  an accepted alias.
- Test that all five full-detail geometries differ and that repeated builds are
  identical. Additional controls such as season remain independent of the seed.
  Do not migrate unrelated species as a side effect of editing one tree.

## Geometry and integration

- Keep the trunk foot at the origin, +Y up, ground at y = 0. Tree units are game
  studs, not a vehicle's metre convention. Preserve shipped species keys and ids.
- Use `Geo` helpers in `generator/treeGeo.ts` and the existing `buildTree` path.
  Retain the `trunk` and `foliage` material contract and merged material groups
  for instanced forests. Avoid a separate draw call for every leaf or branch.
- Spend full-detail triangles on the species silhouette: tapered connected
  boughs, visible forks, and foliage shapes appropriate to that species. Where
  the crown forms clumps, leave some daylight between them and attach them to
  branches. Shade exposed foliage lighter and inner foliage darker with vertex
  colours. Keep foliage untextured and opaque; thin leaves or fronds can be
  double-sided without duplicating backfaces.
- Low detail preserves the seed's main branch layout, crown masses and colours.
  Coarse uses closed, outward-wound convex solids, never billboards or alpha
  cards. Existing tests also require coarse to be at least three times cheaper
  than low, and high at least three times more detailed than low.
- LOD switching must not shift or resize a tree. Derive each level from the same
  layout and foot; for new builders, fit simplified and Max geometry to the
  selected full tree's exact axis extents. Preserve legacy fitting
  conventions when maintaining older species.
- Max detail refines visible species features within the selected tree's
  envelope. Extra hidden triangles alone do not improve the model.
- Register species builders and parameters in `generator/trees.ts`. Named
  builders must be exported for standalone bundling. Keep the game module's `buildTree`
  (`woods.js`, `generator/woodsExport.ts`) default call compatible when changing its
  API. Do not add Node imports to bundled tree geometry.
- Store source references in `assets/<name>/` with `SOURCES.md` and the design's
  `references` field, following `AGENTS.md`. Update `docs/models/trees.md` for
  geometry, parameters or budget changes.

## Verification and delivery

Use the relevant species suite and
`test/trees.test.ts`. Check every supported seed/parameter combination against
its budgets, finite positions, unit normals, grounding, matching extents,
deterministic output and absence of coplanar flicker. Check coarse solids are
closed and outward-facing, material groups are preserved, and standalone JS
matches the generator. Add regression coverage for compatibility changes.

Follow the repository verification policy, respecting the user's requested
test scope. If the user asks to skip the full suite, run focused checks and say
what was checked; do not silently run `pnpm test` or `TEST_ALL_VARIANTS=1 pnpm test`.

Render headlessly, with GLB bytes kept in memory. For full-detail seed previews:

```sh
pnpm exec tsx generator/contactSheet.ts /tmp/tree-seeds.png --vary seed --view 3q --cols 5 proc-tree-REPLACE_ME
```

Replace the id for the species being edited. For low, coarse and Max comparison
rows, use the respective builder's `toGlb()` bytes with `renderGlbThumb` and
`composeSheet` in a scratch script; the contact-sheet CLI has no LOD selector.
Inspect the generated thumbnail after `pnpm build:models`. Do not use a browser
for these checks or save GLB files to disk.

Send images in chat, not just filesystem paths: all five labelled seeds in
three-quarter view, a before/after pair for a redesign, and a comparison of the
changed LODs. Add a close-up when Max detail changes. Report actual triangle
counts and one useful next visual refinement. Keep scratch renders outside the
repository; do not publish to the game unless requested.
