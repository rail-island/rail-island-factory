# Low level of detail

**Covers** - distant geometry for every standalone JS export, triangle budgets and the factory preview switch.
**Code** - `generator/lod.ts`, `generator/lodHull.ts`, `generator/lodModel.ts`, `generator/lodPrimitives.ts`, `generator/meshCore.ts`, `generator/jsModel.ts`, `generator/towers.ts`, `src/ModelDetail.tsx`, `src/ModelViewer.tsx`, `test/lod.test.ts`.
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

LOD uses reviewed structural recipes rather than polygon decimation. Each catalog
family is explicitly mapped in `lod.ts`; adding an unknown family fails until its
silhouette is defined. Recipes select complete bodies, roofs, hoods, boilers,
wings and building masses using the generator's named scopes. Windows, logos,
lettering, posts, railings and small fixtures are discarded before reconstruction.
Vehicle wheels, bogies, underframes, couplers, pantographs and moving equipment are
excluded. An empty flat wagon is represented by a single thin cargo deck. The CD 810's and CD 812 / 912's cab ends are painted
noses of their own (`cabNose.ts`), so their recipe takes the shell and both
noses' skins as three masses, tip to tip.

Each selected mass becomes a new closed convex envelope, sampled in 8, 14 or 26
support directions. Whole planar faces have one finish; roof materials take
precedence over horizontal trim. Coplanar structural surfaces receive a common
finish, preventing different colours from competing in the depth buffer. No
random subset of original triangles survives. Multiple volumes preserve the
separate hoods of shunters, articulated vehicle bodies and architectural tiers.

A design can instead supply `buildLod`, exported from the same source module.
Dedicated silhouettes cover the Boeing, ocean liner, cruise ferry, industrial models, castle,
Colosseum, pagoda, palace, station hotel, Brandenburg Gate, St Basil's Cathedral,
transmission tower and Eiffel Tower. Open courtyards, the Colosseum arena,
individual rotor blades, wings, chimneys and domes remain distinct. Power and
chemical plants and Prague main station use the large-complex-building budget
of 500 triangles. Dedicated builders resolve the same parameters as full detail.

The process is deterministic. Generic recipes build the full geometry first,
then reconstruct the silhouette; their saving is in rendering, not initial
generation time. Dedicated builders construct only the low-detail geometry.
Consumers should cache built variants.

LOD is entirely static: no rig, part nodes or animation clips remain. `pose` and
`renderJoint` return without changing it. Rebuild at full resolution to animate or
pose a vehicle. Full-detail geometry, source trees and the existing API are unchanged.

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

`test/lod.test.ts` compares every standalone default LOD with its generator
geometry and checks deterministic output, unit normals and the static rig contract.
It builds every combination of shape parameters, plus each finish choice, and
checks triangle budgets, finite coordinates, missing detail materials and the
same coplanar-overlap detector used for full models. Regressions specifically
cover omitted hoods/boilers, excluded running gear and the open Colosseum arena.

`generateModels` checks both full detail and LOD for flickering surfaces before
writing any export file. Tests also inject a valid full model with a deliberately
flickering LOD to verify that this guard cannot silently skip the low variant.
Existing JS tests continue to compare full-detail geometry with its GLB.
Review full/LOD contact sheets for all models and representative non-default
variants when changing recipes; triangle counts alone do not establish visual quality.
