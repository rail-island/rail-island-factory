# Trees

**Covers** - the fourteen tree species the game plants: one design per species (the
two larches one design with a season), three levels of detail (high, low, coarse),
the geometry kit they are built with, the stylised look (baked light and shade,
ragged crowns), budgets and tests.
**Code** - `generator/trees.ts`, `generator/treeGeo.ts`, `generator/meshCore.ts`
(`triShaded`), `test/trees.test.ts`, `test/fixtures/tree-baseline.json`,
`assets/trees/SOURCES.md`
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
  11% of its footprint, and grounded at y = 0.
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
the JS model's `buildCoarse` ([../site/catalog-site.md](../site/catalog-site.md)).

## Budgets and tests

`test/trees.test.ts`: the species list; the game's budgets (`low` at most 5% over the
fixture, `high` and `coarse` not at all); light and shade baked at every level, the
crown's top lighter than its underside; coarse at most 20 and at least three times
cheaper than low, high at least three times low; grounded, same size at every level,
coarse box equal to low; closed coarse solids; only palm and willow foliage
double-sided; `trees.js` building every species and level with the designs' own
triangle counts. The catalog sweep builds every tree in JS as in the generator.

References: `assets/trees/SOURCES.md` (written descriptions and OpenTTD's sprites,
looked at, nothing downloaded).
