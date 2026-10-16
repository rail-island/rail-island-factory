# Low level of detail

**Covers** - distant geometry for every standalone JS export, triangle budgets and the factory preview switch.
**Code** - `generator/lod.ts`, `generator/meshCore.ts`, `generator/jsModel.ts`, `generator/towers.ts`, `src/ModelDetail.tsx`, `src/ModelViewer.tsx`, `test/lod.test.ts`.
**See also** - [js-format.md](js-format.md), [parameters.md](parameters.md), [vehicle-rig.md](vehicle-rig.md), [../site/catalog-site.md](../site/catalog-site.md).

## Consumer API

Every `export/js/<id>.js` accepts the optional third boolean argument `lod`:

```js
import build, { lodTriangleBudget } from './proc-vehicle-karosa-short.js';
const full = build(THREE);                    // Existing API, full resolution
const low = build(THREE, undefined, true);    // Default variant, low detail
// A parameterized LOD: pass any valid selection from the exported params.
const variant = build(THREE, chosenParameters, true);
```

Use the module's exported `params` to discover valid enum values. The third argument
is independent of those values and must be a boolean. Omitting it or passing `false`
keeps the original geometry. Each returned group records the choice in `userData.lod`.
`lodTriangleBudget` is the limit for the **entire model**, summed across all parts
and materials, including a complete articulated bus. It is not a per-mesh allowance.

| Models | Maximum triangles |
| --- | ---: |
| Rail and road vehicles, ordinary buildings, village houses, ships, cabins and other ordinary models | 100 |
| Aircraft | 200 |
| Historical buildings (including the castle), towers and skyscrapers | 500 |

A design can set `lodTriangles` to override its family policy. Stable model ids,
scale, coordinates and parameter choices stay the same. The exported GLB, thumbnail,
metadata and source tree remain the full-resolution defaults.

## Geometry

The generic path builds the chosen design, welds coincident vertices within each
movable part, selects connected components by spatial significance, and collapses
edges using area-weighted quadric errors. Open edges have perpendicular constraints
to retain facade panels. Endpoint-only collapse stays within the original bounds;
flat normals are recomputed. Small details may disappear. Materials of surviving
faces are retained, but lettering, individual windows and running gear are not
promised at these distant-view budgets.

The process is deterministic and has no browser or Node dependencies. The generated
module includes the simplifier, so all parameter combinations can produce LOD. It
currently builds full geometry before reducing it; the saving is in rendered
triangles, not in initial generation time. Consumers should cache built variants.

A design may supply `buildLod`, exported by the same source module, for a dedicated
silhouette. Eiffel Tower uses this path: solid tapered piers, observation decks and
a continuous upper tower replace individual lattice beams. Its LOD does not build
the full model first.

Part names, pivots and animation tracks survive simplification. Steering and joint
posing are intentionally static in LOD: `pose` and `renderJoint` return without
changing it. This prevents a joint redraw from recreating full-detail bellows or
requiring a mesh that simplification removed. Rebuild at full resolution to pose
these rigs. Animation clips that only transform existing nodes retain their counts.

## Factory GUI

The model detail panel has a **Low level of detail** checkbox, off initially.
It persists while stepping between models in that detail view. Enabling it loads
the model's JS export even at default parameters. Switching resolution keeps the
camera position and current enum choices; asynchronous stale loads are discarded.
The preview shows its actual triangle count. The Specs tab still describes the
full-resolution downloadable files.

Source-tree highlighting/picking and rig pose controls are disabled in LOD because
the source tree addresses full-detail triangle ranges. Returning to full detail
restores them. No browser automation is required for headless verification.

## Verification

`test/lod.test.ts` builds every default LOD through its standalone export and checks
the global budget, finite geometry, normals, bounds and node preservation. It also
checks every individual non-default enum value, the static rig contract, preview
identity and invalid budgets. Existing JS tests continue to compare default export
geometry against the unchanged GLBs. Review representative full/LOD renders when
changing simplification or adding a dedicated silhouette.
