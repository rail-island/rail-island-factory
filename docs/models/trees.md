# Trees

**Covers** - the fourteen tree species the game plants: one design per species (the
two larches one design with a season), four levels of detail (Max, high, low,
coarse), the tree kit every species is drawn with, seeds, the stylised look,
budgets and tests.
**Code** - `generator/trees.ts`, `generator/treeKit.ts`, `generator/oak.ts`,
`generator/leafyTrees.ts`, `generator/conifers.ts`, `generator/palm.ts`,
`generator/deadTree.ts`, `generator/treeGeo.ts`, `generator/meshCore.ts`
(`triShaded`), `test/trees.test.ts`, `test/treeSpecies.test.ts`, `test/oak.test.ts`,
`test/fixtures/tree-baseline.json`, `assets/trees/SOURCES.md`, `assets/oak/SOURCES.md`
**See also** - [woods.md](woods.md), [lod.md](lod.md), [js-format.md](js-format.md),
[export.md](export.md), the game's `docs/rendering/woods.md`

## What they are

The game draws every forest from fourteen species: `pine`, `spruce`, `oak`, `birch`,
`aspen`, `willow`, `palm`, `bush`, `deadtree`, `scotspine`, `larch`, `autumnlarch`,
`hazel` and `orchard`. Each is a design, `proc-tree-<species>`, in the **Trees**
category of the catalog -- except the two larches, one design `proc-tree-larch` with a
`season` parameter: `summer` (default) draws `larch`, `autumn` draws `autumnlarch`
(`treeModelOf` names a species' design and values; `woods.meta.json` lists them). The
species keys are what the woods types name ([woods.md](woods.md)), so a shipped key
is never renamed; `test/trees.test.ts` pins the list.

The trees were first ported from the game (`render/TreeGeometry.ts`); their
per-species triangle counts at that time are kept as budgets
(`test/fixtures/tree-baseline.json`). Every species has since been redrawn on the
tree kit (below) inside those budgets; the oak's full detail has an explicit
2,000-triangle allowance.

A tree is **base-anchored at y = 0** and has exactly **two materials**, `trunk` and
`foliage`: the game merges a species into one geometry with two groups and draws a
whole forest of it as one InstancedMesh per tile. Units are the game's studs,
numerically (a pine is 9.2 tall); the game scales each tree to the height its woods
type asks for, so only proportions matter. The game adds the rest per instance: the
woods type's `width`, `lean`, `shade` and `hue` per tree ([woods.md](woods.md)).

## Four levels

| Level | Built by | Exported as | Triangles |
|---|---|---|---|
| `max` | `buildMax` | `buildMax(THREE, params)` | 524-9,684 (at most 10,000) |
| `high` | the design's `build` | `build(THREE, params)` | 232-2,702 |
| `low` | `buildLod` | `build(THREE, params, true)` | 52-268 |
| `coarse` | `buildCoarse` | `buildCoarse(THREE, params)` | 10-20 |

`buildCoarse` and `buildMax` are `ProceduralDesign` fields only the trees set; the
build checks coarse like a LOD (at most `COARSE_TRIANGLES`, 20, and no z-fighting)
and `jsModel.ts` exports both. The game's quality ladder picks high, low or coarse
per distance band, so one island draws all three at once; Max is a close-up level
for the catalog and is never planted by forests. Two rules keep a level change
invisible:

- **A level may change how a tree is made, never how big it is.** Max and low are
  built from the same layout as high and fitted onto the high tree's exact axis
  extents, about the trunk's foot (`fit`); coarse is fitted onto low's. Tests hold
  every level grounded at y = 0 and within the high (and low) tree's box.
- **Nothing floats.** Leaves sit on their clump's core; at low detail every limb
  runs into a mass and every mass is held by wood (or rests in a held mass).

The coarse level is **closed convex solids**, not a billboard: alpha-tested foliage
breaks early-Z on the tiled mobile GPUs the level exists for, and a flat quad goes
edge-on to the game's low camera. Tests check every coarse part is closed and wound
outward.

## The tree kit

`treeGeo.ts` is a non-indexed triangle list (`Geo`) with the few three.js primitives
the trees need (icosahedron, transforms, `setFromUnitVectors`) re-implemented on plain
arrays, so a tree's JS model needs no three.js geometry classes. `treeMesh` (in
`trees.ts`) emits the lists into a MeshBuilder.

`treeKit.ts` draws a species from two things:

- **A layout** (`Layout`), drawn from the seed's structural random stream only: a
  lofted stem, limbs and twigs (continuous lofts, no caps at elbows), leaf
  **clumps** (centre, radius, outward direction, tone; optionally stretched and
  turned, as the Scots pine's flat pads), the **groups** of clumps each low-detail
  mass encloses, and optionally willow **strands**, palm **fronds**, conifer needle
  **sprays** and bark-coloured **knobs** (the palm's crown and coconuts).
- **A style** (`BroadleafStyle`): material colours, a leaf and a bark palette,
  optional bark marks, roots, tufts per clump and leaves per tuft at high and Max,
  leaf length, width and rise (narrow needles for conifers), the low mass shape
  (rounded or cone) and the coarse shape (dome, pyramid or bare wood).

From those every level is built the same way:

- **High**: a dark closed core (icosahedron) per clump under tufts of folded
  pointed leaves (two faces each); leaf placement uses a stream per clump, so it
  never moves the branches.
- **Max**: rounder wood (more sides, every station), two seeded bulges per clump
  each with its own core, dense tufts of faceted leaves (a raised midrib, four
  faces); birch and aspen get a finer-divided stem with dark bark marks.
- **Low**: the stem (three stations), the limbs that serve a mass, each run into its
  mass's centre, and one closed mass per group: a 20- or 24-face rounded solid, or
  for a conifer one 12-face cone per tier of sprays, from the tier's lowest needles
  up into the tier above. A leader through the crown (birch, aspen,
  conifers) or a stool rising into the mound (bush) holds the masses instead.
- **Coarse**: a 16-face dome over the low foliage's box (a six-face pyramid for the
  conifers, bare spikes for the dead tree) and a tetrahedral trunk whose base lies
  flat on the ground.

Per-corner colours (`MeshCore.triShaded`: the GLB's `COLOR_0`, the JS model's
`color` attribute) multiply the material colour: foliage is lit by height, by the
direction its tuft faces and by how far its clump stands out of the crown -- dark
inside and underneath, lighter on the sides, the palette's light tone on top; bark
is lit on one flank and towards the top. Single-layer leaves, needles, curtains and
fronds use a double-sided foliage material (`ribbons: true`) without duplicated
backfaces; cores and masses are closed.

## The species

| Species | Shape | Max | High | Low | Coarse |
|---|---|---:|---:|---:|---:|
| oak | flared trunk forking into three limbs and two side boughs, a dome of 13 clumps | 9,374 | 1,886 | 204 | 20 |
| birch | leaning white trunk through an oval crown of 8 clumps on rising branches | 9,020 | 752 | 64 | 20 |
| aspen | tall pale trunk, narrow column of 11 small clumps on short shoots | 9,536 | 936 | 140 | 20 |
| willow | stout trunk, 4 arching limbs, dome of 9 clumps, 24 hanging leaf curtains | 9,370 | 1,402 | 268 | 20 |
| bush | mound of 7 clumps on short stems from a low stool | 9,684 | 1,022 | 64 | 20 |
| hazel | 4 crooked stems from a stool, each ending in a clump and carrying one more | 9,586 | 776 | 144 | 20 |
| orchard | short trunk forking into 4 spreading limbs under 9 round clumps | 9,338 | 848 | 124-148 | 20 |
| pine | irregular open crown on a bare trunk: 6 whorls of rising branches with needle tufts at the tips | 8,838 | 2,324 | 68 | 10 |
| spruce | layered cone: 10 whorls of broad drooping fan plates with side branchlets, the trunk showing between tiers | 9,658 | 2,702 | 80 | 10 |
| larch | airy: 8 whorls of thin arching branches hung with soft needle plates (summer green, autumn gold) | 8,296 | 1,634 | 68 | 10 |
| scotspine | tall bare crooked orange trunk, four boughs with flat pads: an umbrella crown | 9,140 | 992 | 168 | 20 |
| palm | curving ringed trunk, crown knob and coconuts, 13 arching fronds of leaflet pairs | 5,108 | 774 | 137 | 20 |
| deadtree | leaning broken-topped trunk, roots, four bare limbs forking into twigs | 524 | 232 | 52 | 16 |

Notes per family:

- **Leafy species** (`leafyTrees.ts`): each clump hangs on its own limb or twig;
  low merges a limb's clumps into one mass. The willow's curtains are chains of
  leaves at high and Max and three-segment ribbons at low (so its low level stays
  double-sided).
- **Conifers** (`conifers.ts`): pine, spruce and larch carry **needle sprays**
  instead of leaf clumps -- closed volumes lofted along a bough (`Spray`), shaped by
  the style's spray settings: a thin plate whose sides droop (`droop`, a fan rather
  than a tube), notched at alternate outline corners (`scallop`, the sides only, so
  the faces stay smooth planes), its top broken into small tilted facets (`facet`)
  and its underside shallower than its top (`under`). Shading lights the upper face
  and darkens what hangs below the point where the bough leaves its branch, so each
  tier has a light top and a dark underside, with a warm or cool cast per spray.
  They follow the branch structure: the spruce's boughs start narrow at the trunk,
  run out level and droop toward the tip, broader low down, with two side
  branchlets just beneath (four, two smaller, at Max) and, at Max, the lower whorls'
  wood showing; the pine's thick visible branches rise and end in flattened tufts,
  with two tufted side twigs (five at Max); the larch's thin arching branches carry
  three hanging needle plates (ten, overlapping, at Max). Primary branches come from
  the structural stream and Max's extra shoots from their own, so Max never moves a
  branch; Max also draws each spray with more sides and stations. The two larch
  seasons share the shape and differ only in palette; the Scots pine keeps flat
  needle pads (clumps) on four boughs.
- **Palm** (`palm.ts`): fronds are midribs of long leaflets swept toward the tip so
  they overlap (11 pairs at high, 44 at Max); low draws each as a drooping ribbon.
- **Dead tree** (`deadTree.ts`): no leaves -- its limbs and twigs are the foliage
  group, in the bark colour, so the two-material layout holds.

## Seeds and parameters

Every design has `seed` (`Tree seed`, `1`-`5`, default `1`). It varies the lean,
bearings, spacing and size of limbs and clumps (or whorls and pads), and through each
clump's own stream the leaf placement; the same values always give identical
geometry. Internal seeds: oak 7, 19, 83, 173, 431 (the old tokens `7` and `19` stay
accepted aliases of seeds 1 and 2); leafy species 11, 29, 97, 211, 563; conifers
13, 37, 101, 223, 577; palm 17, 41, 109, 239, 593; dead tree 19, 43, 113, 241, 599.
`treeOptions(species, values)` resolves a design's values; `treeParts(species,
detail, options)` also takes numeric `seed`, `height`, `width`, `spread` and
`density` overrides. The larch also has `season`; the oak has four more controls:

| Oak parameter | Values (default first) |
|---|---|
| `height` | `standard`, `tall` (1.15 times as high) |
| `canopy` | `broad`, `compact` (0.83 times as wide) |
| `branches` | `spreading`, `upright` (0.8 times the reach, with extra rise) |
| `foliage` | `full`, `airy` (9 tufts a clump instead of 12; 23 instead of 30 at Max) |

## The oak

The oak follows the user's references in `assets/oak/` (`reference-max.png`, a
stylised low-poly oak, for its second redesign). Its layout (`oak.ts`): a leaning,
flared trunk forking at about y = 3.2 into three rising limbs, two low side boughs
leaving the trunk below the fork, and thirteen clumps as a broad dome -- one top
clump and rings of four, six and two (the two lowest hang from the side boughs, left
and right, so the trunk and fork stay visible). Each limb serves the clumps nearest
its bearing through a bowed twig ending inside the clump. High detail: 378 wood,
13 cores (260), 624 leaf blades (1,248) -- 1,886 (airy 1,574). Max: 794 wood,
39 cores, 1,950 faceted leaves -- 9,374 (airy 7,554). Low: the trunk, five limbs
and at most six masses (204). It keeps its fixed coarse crown (`coarseCrown`).

## The game's module

The game takes its trees from **`woods.js`**, one standalone module with every
woods type and every species (`woodsExport.ts` `bundleGame`, [woods.md](woods.md)):
`buildTree(THREE, species, "high" | "low" | "coarse" | "max", values?)` returns the
same Group of `trunk` and `foliage` the catalog design builds for those values (the
default seed when absent), and `SPECIES` lists the keys. Each catalog
`js/proc-tree-<species>.js` is built from that design's own builders, which call
only its species module and the kit, so it carries one species.

## The coarse and Max previews

A tree's catalog record carries `coarse: true` and `maxDetail: true`, and the
site's model page offers *Coarse (distant forest)* and *Max detail* beside full and
low ([../site/catalog-site.md](../site/catalog-site.md)): they build the JS model's
`buildCoarse` and `buildMax`.

## Budgets and tests

For new or reworked trees, follow the [tree authoring skill](../../.agents/skills/tree/SKILL.md):
five deterministic seeds labelled `1` through `5`, the same seed at every level, and
for new trees at most 2,000 full-detail, 300 low-detail and 20 coarse triangles, with
Max at most 10,000. Existing species keep their fixture budgets: high and coarse not
above the fixture (the oak's high 2,000), low at most 5% over it within 300 (the
oak's 218).

`test/trees.test.ts`: the species list; the fixture budgets; light and shade baked at
every level, the crown's top lighter than its underside; coarse at most 20 and at
least three times cheaper than low, high at least three times low; grounded, same
size at every level, coarse box equal to low; closed coarse solids; double-sided
foliage where leaves are single-layer; `woods.js` building every species at every
level, Max included, with the designs' own triangle counts and a seed's own shape.

`test/treeSpecies.test.ts` checks every seed of every kit species but the oak at all
four levels (budgets, two materials, grounding, matching bounds, determinism,
normals, no coplanar flicker), five distinct shapes, leaves rooted in their cores
(willow curtains hanging under a clump), every low limb ending in a mass and every
low mass held, and the standalone JS including `buildMax`. `test/oak.test.ts` checks
the oak's 80 combinations the same way, each control taking effect and the old seed
aliases. The catalog sweep builds every tree in JS as in the generator.

References: `assets/trees/SOURCES.md` (written descriptions and OpenTTD's sprites)
and `assets/oak/SOURCES.md` (the user brief and the stylised oak image).
