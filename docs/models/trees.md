# Trees

**Covers** - the fourteen tree species the game plants: one design per species (the
two larches one design with a season), three levels of detail (high, low, coarse),
the geometry kit they are built with, the stylised look (baked light and shade,
ragged crowns), budgets and tests.
**Code** - `generator/trees.ts`, `generator/oak.ts`, `generator/treeGeo.ts`, `generator/meshCore.ts`
(`triShaded`), `test/trees.test.ts`, `test/fixtures/tree-baseline.json`,
`assets/trees/SOURCES.md`, `assets/oak/SOURCES.md`, `test/oak.test.ts`
**See also** - [woods.md](woods.md), [lod.md](lod.md), [js-format.md](js-format.md),
[export.md](export.md), the game's `docs/rendering/woods.md`

## What they are

The game draws every forest from fourteen species: `pine`, `spruce`, `oak`, `birch`,
`aspen`, `willow`, `palm`, `bush`, `deadtree`, `scotspine`, `larch`, `autumnlarch`,
`hazel` and `orchard`. Each is a design, `proc-tree-<species>`, in the **Trees**
category of the catalog -- except the two larches, one design `proc-tree-larch` with a
`season` parameter: `summer` (default) draws `larch`, `autumn` draws `autumnlarch`
(`treeModelOf` names a species' design and values; `woods.meta.json` lists them). The
species keys are what the woods types name
([woods.md](woods.md)), so a shipped key is never renamed; `test/trees.test.ts` pins
the list.

The trees were authored in the game (`render/TreeGeometry.ts`) and moved here
unchanged: the port reproduced every species at every level to the triangle and to
float32 precision against the game's own builder, measured before the move
(`test/fixtures/tree-baseline.json`). They were then restyled here (below); the
fixture stays as the budget the restyle had to fit.
The oak's later full-detail redesign has an explicit 2,000-triangle allowance;
its rebuilt low and coarse levels retain their original budgets.

A tree is **base-anchored at y = 0** and has exactly **two materials**, `trunk` and
`foliage`: the game merges a species into one geometry with two groups and draws a
whole forest of it as one InstancedMesh per tile. Units are the game's studs,
numerically (a pine is 9.2 tall); the game scales each tree to the height its woods
type asks for, so only proportions matter.

## Three levels

| Level | Built by | Exported as | Triangles |
|---|---|---|---|
| `high` | the design's `build` | `build(THREE)` | 296-2,772 |
| `low` | `buildLod` | `build(THREE, {}, true)` | 64-294 |
| `coarse` | `buildCoarse` | `buildCoarse(THREE)` | 10-20 |

`buildCoarse` is a field of `ProceduralDesign` only the trees set; the build checks
it like a LOD (at most `COARSE_TRIANGLES`, 20, and no z-fighting) and `jsModel.ts`
exports it. The game's quality ladder picks a level per distance band, so one island
draws all three at once, and two rules keep a band flip invisible:

- **A level may change how a tree is made, never how big it is.** The high tree is
  measured and stretched onto the low tree's envelope (`fitToLow`), per axis about
  the trunk's foot; tests hold every level within 10% of the low tree's height and
  11% of its footprint, and grounded at y = 0. Oak instead fits both simplified
  levels onto the new high model, preserving the origin and exact axis extents.
- **The coarse tree fills the low tree's box exactly**: every coarse dimension is
  measured off the low tree (`lowBoxOf`), so the two boxes agree to four decimals.

The coarse level is **closed convex solids**, not a billboard: alpha-tested foliage
breaks early-Z on the tiled mobile GPUs the level exists for, and a flat quad goes
edge-on to the game's low camera. Tests check every coarse part is closed and wound
outward.

## The geometry kit

`treeGeo.ts` is a non-indexed triangle list (`Geo`) with the three.js primitives the
game's builder used -- `CylinderGeometry`, `ConeGeometry`, `IcosahedronGeometry`, the
transforms and `setFromUnitVectors` -- re-implemented on plain arrays with three's
r160 vertex layouts, so per-vertex deformations land on the same points and a tree's
JS model needs no three.js geometry classes. `buildTree` emits the lists into a
MeshBuilder: degenerate triangles (a cone's tip) are dropped and every face gets its
own normal.

The builders (`trees.ts`) are the game's: `coniferCrown` (whorls of closed
`branchFan` plates bunching toward the apex, each whorl turned 2.4 rad), `leafShell`
(lobes on a golden-angle spiral around a buried core), `clusteredCrown`, ribbons for
palm fronds and willow sprays (`ribbons: true`, the foliage material is
`doubleSided`), and a lean field shared by wood and leaves so branch joints hold.

## The stylised look

Why OpenTTD's trees read better than the game's did: painted light and shade on
every clump, colour varying between trees, overlapping canopies, crowns drawn a size
larger than life and ragged outlines. The trees take the parts a mesh can carry:

- **Baked light and shade** (`paint`): a colour per corner, a multiplier of the
  material colour written with `MeshCore.triShaded` -- the GLB's `COLOR_0`, the JS
  model's `color` attribute with `vertexColors`. Occlusion from the corner's height
  in the crown and its distance from the crown's axis (deep and low is dark, high and
  outer is lit), a lift on the most exposed corners, and per **clump** -- each lobe,
  branch fan or frond -- its own brightness and a slight warm or cool cast. Bark is
  darker at the foot and under the crown. No runtime cost.
- **Ragged crowns**: lobes of unequal size, the odd lobe left out (never one that
  carries the crown's height), branch fans of unequal length with the odd one
  missing, stronger undulation on the low crowns and cones -- a broken outline with
  sky through it, inside the old budgets.
- **Classic size**: the crowns are drawn as modelled, as wide as the game's own trees
  were, and the woods types plant them at the game's classic heights
  ([woods.md](woods.md)). An earlier restyle drew them 6-12% wider and 15% taller,
  which read as too big next to the track.
- **Brighter, more saturated colours** (`TREE_COLORS`), since the shading now darkens
  most of the crown below them.

The **oak** is rebuilt from the user-provided visual brief in `assets/oak/`.
`oak.ts` derives sixteen terminal foliage pads from seven staggered, bent boughs
and the central leader. Each pad carries three small foliage cores and fifteen
folded, six-sided leaf blades. The lower right bough reaches almost horizontally;
upper limbs rise into staggered foliage tiers, leaving visible wood and daylight
between the pads. A continuous faceted trunk loft and four root buttresses anchor
it. Per-face vertex colours shade the underside dark green, exposed leaves medium
green, and the uppermost leaves yellow-green, with warm brown wood.

| Oak geometry | Full foliage | Airy foliage |
|---|---:|---:|
| Wood (trunk, roots, boughs and forks) | 402 | 402 |
| Closed foliage cores | 48 / 576 triangles | 40 / 480 triangles |
| Leaf blades | 240 / 960 triangles | 200 / 800 triangles |
| Total high detail | **1,938** | **1,682** |
| Low / coarse detail | 212 / 20 | 212 / 20 |

Both densities use two merged material groups, hence two draw calls per tree.
The high oak's foliage material is double-sided for its leaf blades, without
transparency or duplicated backfaces; the core volumes remain closed. Low and
coarse foliage use closed single-sided geometry. The low model derives the same
branches and pads; both simplified models fit the selected high model's exact
bounds. The foot stays at y = 0 and centred on the trunk origin.

The shipped ID remains `proc-tree-oak`. Its five enum controls produce 80 combinations:

| Parameter | Values (default first) |
|---|---|
| `seed` | `1`, `2`, `3`, `4`, `5` |
| `height` | `standard`, `tall` (1.15 times as high) |
| `canopy` | `broad`, `compact` (0.83 times as wide) |
| `branches` | `spreading`, `upright` (0.8 times the reach, with extra rise) |
| `foliage` | `full`, `airy` |

Seeds 1 and 2 retain the earlier seeds 7 and 19, respectively. Those old tokens
remain accepted aliases in both generator calls and saved catalog URLs. The five
labels map to deterministic internal seeds 7, 19, 83, 173 and 431.

Oak also supplies **Max detail** through `treeOakMax` / `buildMax`, with a hard
10,000-triangle cap. It preserves the corresponding full-detail tree's bounding
box and branch layout, while increasing stem and branch cross-sections, replacing
its foliage cores with icosahedra and distributing smaller lobed leaf blades over
each core's surface. The default full-detail geometry remains unchanged.

| Max detail geometry | Full foliage | Airy foliage |
|---|---:|---:|
| Wood | 590 | 590 |
| Foliage cores | 48 / 960 triangles | 40 / 800 triangles |
| Lobed leaf blades | 816 / 8,160 triangles | 680 / 6,800 triangles |
| Total | **9,710** | **8,190** |

Max detail still uses two materials and two draw calls. It is optional and is
currently available only for oak; the default forest quality remains `high`.
The shared `trees.js` also accepts `buildTree(THREE, "oak", "max")` and rejects
Max detail for unsupported species.

`oakOptions(values)` resolves catalog parameters. `oakParts(detail, options)` also
accepts numeric `seed`, `height`, `width`, `spread`, and `density` overrides for
procedural callers. Height and width scale the whole tree about its origin;
density below 0.9 selects airy foliage, otherwise full. Seeded randomness varies
bough angles, reach, cluster placement, leaf orientation and colours; the same
seed and options always produce identical geometry. The shared forest module
continues to draw the default oak when given only its species key and detail.

The game adds the rest per instance: the woods type's `width`, `lean`, `shade` and
`hue` per tree ([woods.md](woods.md)).

## One module for the game

Each `js/proc-tree-<species>.js` carries the whole of `trees.ts` -- `buildTree` picks
the species at run time, so nothing can be shaken out -- which is right for the
catalog and the site, which build one tree at a time, and wasteful for the game,
which needs all fourteen. The export therefore also writes **`trees.js`**
(`woodsExport.ts` `bundleTrees`): every species in one standalone module,
`buildTree(THREE, species, "high" | "low" | "coarse")` returning the same Group of
`trunk` and `foliage` the per-species modules build, and `SPECIES`. It is about 32 KB
(12 KB gzipped) against fourteen times that; `woods.meta.json` names it
(`treesModule`), and the game imports it instead of the per-species files.

## The coarse preview

A tree's catalog record carries `coarse: true`, and the site's model page offers a
third **Level of detail**, *Coarse (distant forest)*, beside full and low: it builds
the JS model's `buildCoarse` ([../site/catalog-site.md](../site/catalog-site.md)). Oak additionally advertises
`maxDetail: true`, enabling *Max detail* through `buildMax`. Other trees do not
show this option.

## Budgets and tests

For new or reworked trees, follow the [tree authoring skill](../../.agents/skills/tree/SKILL.md):
expose five deterministic seeds labelled `1` through `5`, defaulting to `1`, and
resolve the same seed at every detail level. New trees target at most 2,000
full-detail triangles, 300 low-detail triangles and 20 coarse triangles; optional
Max detail is capped at 10,000. Existing species retain their tighter fixture
budgets, and existing non-oak full-detail allowances remain unchanged. Oak's low
cap is 218. This authoring policy does not add seeds or Max detail to legacy
species automatically; currently only oak exposes them.

`test/trees.test.ts`: the species list; the game's budgets (`low` at most 5% over the
fixture, `high` and `coarse` not at all, except oak `high` capped at 2,000); light and
shade baked at every level, the crown's top lighter than its underside; coarse at
most 20 and at least three times
cheaper than low, high at least three times low; grounded, same size at every level,
coarse box equal to low; closed coarse solids; palm and willow ribbon foliage
and the high oak's leaf blades double-sided; `trees.js` building every species and level with the designs' own
triangle counts. The catalog sweep builds every tree in JS as in the generator.

`test/oak.test.ts` checks all 80 oak combinations at all four detail levels:
triangle budgets, two materials and draw calls, grounding, matching bounds,
determinism, normals and no coplanar flicker. It also checks that each control
affects geometry and that the standalone JS preserves the oak's leaf material.

References: `assets/trees/SOURCES.md` (written descriptions and OpenTTD's sprites)
and `assets/oak/SOURCES.md` (the user brief and inline visual reference).
