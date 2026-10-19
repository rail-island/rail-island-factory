# Woods types

**Covers** - the woods types the game paints: distribution functions keyed by a
stable name, their parameters (density on every type, and one of each type's own),
the contract the game calls them with (the cell context, the output
slots, the four-tree limit, the hash), the forest rule they are written in, their
standalone modules, `woods.meta.json`, the grove previews and the tests.
**Code** - `generator/woods.ts`, `generator/woodsApi.ts`, `generator/woodsExport.ts`,
`generator/woodsGrove.ts`, `generator/woodsModels.ts`, `test/woods.test.ts`
**See also** - [trees.md](trees.md), [export.md](export.md),
[../site/catalog-site.md](../site/catalog-site.md), the game's
`docs/rendering/woods.md` and `docs/tooling/factory-import.md`, [parameters.md](parameters.md)

## A woods type is a function

A painted cell in the game stores one woods id. What grows on it is decided here: a
woods type is a **distribution function** the game calls for every painted cell
(`woodsApi.ts`):

```ts
distribute(ctx: CellContext, out: TreeSlot[]): number // fills out[0..n), returns n <= 4
sample(u: number, v: number, out: TreeSlot): void     // one tree for a row along a line
```

`CellContext` is the cell (`gx`, `gz`), the map's `seed`, a 25-bit **mask** of which
cells of its 5x5 neighbourhood carry the same woods type (bit `(dz + 2) * 5 + dx + 2`,
read with `same`), the terrain's `slope` in degrees and its `height` in studs above
the water. A `TreeSlot` is a species key, an offset from the cell's centre in cell
widths (-0.5..0.5), a rotation in degrees, a height in studs, and the tree's look:
`width` (crown stretch), `lean` (radians), `shade` (brightness) and `hue` (-1 cool ..
1 warm). The slots are the caller's and reused, so a function allocates nothing per
cell; the game calls it tens of thousands of times a tile.

**Four trees a cell is a hard limit** (`MAX_TREES_PER_CELL`): the tests fail any woods
type that returns more, and the game clamps only as a safety net.

**Deterministic**: the same context gives the same trees, so the game saves nothing
per tree. Every random number comes from `draw(cellSeed(gx, gz, seed), i)`, the hash
the game's placement has always used (the tests pin it with fixed vectors), and
`field(gx, gz, scale, seed, salt)`, smooth value noise over the cell grid that every
cell reads independently -- so a forest does not depend on tile borders or on the
order cells are built in.

Each type also has a stable **name** (`pine-forest`: the game's maps store it, so a
shipped name is never renamed or removed -- the tests pin them), an English `label`,
a `swatch` (the picker chip and the game's far-distance ground tint) and a `floor`
colour (the ground under its trees, at every range).

## The forest rule

Every woods type is written with `forest(spec)`, which plants a small stand per cell
from what is around it:

| Spec | What it does |
|---|---|
| `trees`, `edgeTrees` | expected trees per cell deep inside the wood and at its very edge (`edgeness(mask)`: 0 inside, 1 for a lone cell); the fraction is rolled |
| `glades` | a broad field thins the wood into clearings over many cells |
| `slopeThin` | fewer trees on steep ground |
| `canopy`, `groves` | the big trees by weight; `groves` gathers one species into groves by a field (golden and green larch, oak and pine stands) |
| `under`, `underShare`, `edgeUnder` | shrubs and young trees taking a share of the slots that grows toward the edge, only ever beside a canopy tree |
| `edgeShrink`, `altitude` | shorter trees at the edge and on high ground (a treeline) |
| `rows` | an orchard: one tree on each cell's centre, the odd one missing |
| `floor` | the ground colour, when it is not the derived leaf litter (a park's mown grass) |

Trees stand on the quarters of the cell, each jittered within its quarter, so crowns
overlap into a canopy without stacking; each gets its own width, lean, shade and hue,
and a grove shares a tone from the same field. Trees are planted at the game's
classic heights: the specs are written about 15% taller and drawn at `HEIGHT`
(1/1.15), so a tree is as big as the classic woods' ([trees.md](trees.md)).

The twelve types are the ones the game shipped -- `pine-forest`, `oak-woods`,
`mixed-woods`, `scrub`, `palms`, `tropical-forest`, `high-mountain-forest`, `park`,
`scots-pine-woodland`, `larch-woodland`, `hazel-woodland-edge`, `village-orchard`
-- rewritten with relations: young pines and bushes at a pine forest's edge, a park
thin so the lawn shows, the mountain forest shrinking with height. The game's
thirteenth, `autumn-larch-woodland`, is merged into `larch-woodland` as its
`season`: the game reads the old name as `larch-woodland` at peak autumn without
spruce, which plants the same trees (its `docs/rendering/woods.md`).

**Density.** A spec's tree counts give the shape of the wood (denser inside than at
the edge, glades); each type's **scale** (`woodsType`'s third argument) brings its
normal grade to the classic woods' density -- the game's density percent before the
factory, as trees per cell averaged over a large wood's interior, glades included:
pine 40%, oak 30%, mixed 50%, scrub 22%, palms 40%, tropical 100%, mountain 34%,
park 18%, Scots pine 28%, larch 30%, hazel 24%, orchard 24%. The scales are
calibrated by measurement; the tests hold every type within 10% of its figure.

## Parameters

A woods type has enum **parameters**, in the same shape as a model's (`name`,
`title`, `values` of `{ value, title }`, `default`; [parameters.md](parameters.md)):

```ts
params: WoodsParam[]                       // density first
variant(values?): { distribute, sample, swatch?, floor? }   // one choice of them, compiled once
```

`variant` resolves the values leniently (`resolveWoodsParams`): a missing parameter,
an unknown one or an unknown value reads as the default, so a game map written
against a later or earlier factory still grows a forest. Each choice is compiled
into its own planter once and kept, so the game's per-cell calls cost nothing more.
The type's own `distribute` and `sample` are its defaults'. A variant whose values
change the wood's colour carries its own `swatch` and `floor` (a larch wood in autumn
is gold); the game uses them for the picker and the ground tint.

Every type has **`density`**: `sparse`, `normal` (default) or `dense`, the expected
trees per cell (inside and at the edge) times 0.5, 1 or 2.5 of the classic density
above, kept within the four-tree limit; an orchard's row probability likewise, at
most one tree a cell. Dense is the full stylised forest, two or three trees a cell.
Each type adds one parameter of its own (the larch woodland two):

| Woods type | Parameter | Values (default in bold) |
|---|---|---|
| `pine-forest` | `age` | `young` (more, shorter pines), **`mature`**, `old` (fewer, taller, more glades and undergrowth) |
| `oak-woods` | `undergrowth` | `none`, **`some`**, `thick` |
| `mixed-woods` | `mix` | `broadleaf`, **`balanced`**, `conifer` |
| `scrub` | `trees` | `none` (bushes only), **`few`**, `many` |
| `palms` | `undergrowth` | `none`, **`some`**, `thick` |
| `tropical-forest` | `palms` | `few`, **`some`**, `many` |
| `high-mountain-forest` | `conifer` | `pine`, **`mixed`**, `spruce` |
| `park` | `planting` | **`mixed`**, `birch` (birch and aspen), `oak`, `conifer` (spruce and Scots pine) |
| `scots-pine-woodland` | `birch` | `none`, **`some`**, `many` |
| `larch-woodland` | `season`, `spruce` | **`summer`**, `early` (autumn, mostly green), `peak`, `late` (all golden); `none`, **`some`**, `many` |
| `hazel-woodland-edge` | `oaks` | `none`, **`few`**, `many` |
| `village-orchard` | `layout` | **`rows`**, `scattered` (an old meadow orchard) |

The game stores a woods type with its non-default values in a map's table (its
`docs/rendering/woods.md`), so **a parameter name and a value token are as stable as
a woods name**: never rename or remove a shipped one. Titles are display text.

## The export

`woodsExport.ts` writes, for a whole export only:

- `woods/<name>.js`: one standalone ES module per type, no imports, exporting
  `woods` (name, label, swatch, floor), `params`, `variant(values)`, the defaults'
  `distribute` and `sample`, `MAX_TREES_PER_CELL` and `MASK_RADIUS` (esbuild; the types are marked pure so a module carries only its
  own);
- `trees.js`: every tree species in one module, which the game imports
  ([trees.md](trees.md));
- `woods.meta.json`: `maxTreesPerCell`, `treesModule`, every tree species (`species`, `id`) and every
  woods type (`name`, `label`, `swatch`, `floor`, `params`, `module`), each list sorted by key, no
  numeric ids -- the game maps names to the ids its maps store;

The game imports all of it with `pnpm import:factory` (its
`docs/tooling/factory-import.md`).

## The grove previews

`woodsGrove.ts` runs a woods type over a 14-cell patch -- a rounded wood with a
ragged edge on flat ground, grass around it -- and bakes every tree into one model
the way the game places it: the cell's centre plus the slot's offset, scaled to its
height against the species' height at that level, stretched by `width`, tilted by
`lean` about the tree's own X axis after its turn, and coloured by `shade` and `hue`
with the game's instance-colour formula (`instanceTint`). The ground is the woods
type's floor under the wood and grass outside it.

## The woods models

`woodsModels.ts` makes every woods type a catalog design, `proc-woods-<name>`
(category and group `Woods`), whose model is its grove: so the site browses the
woods like any other model -- the **Woods** chip, a model page with the 3D preview
and the parameter selector, the variant thumbnails
([../site/catalog-site.md](../site/catalog-site.md)). The design's parameters are
the woods type's (density first), and `build(params)` runs `buildGrove` with them.
A grove plants a few hundred trees, so the full model draws them at the species'
`low` level and its LOD at `coarse` (at most 12,000 triangles, the dense
combinations included); the species' own pages show the `high` tree.

These designs are the site's. They get a JS model and a thumbnail like every
design, but no game meta lists them: the game plants its woods from the woods
modules above, not from a grove model.

## Tests

`test/woods.test.ts`: the hash vectors and the mask; every shipped name present,
unique and kebab-case; for every type, over a sweep of interiors, edges, lone cells,
slopes and heights, at most four trees a cell, each a known species inside its cell
with a sane height, width, lean, shade and hue; determinism; `sample`; the relations
(denser inside than at the edge, more shrubs at the edge, every type's normal
density within 10% of the classic one and its dense and sparse grades around it, a
thin park, a treeline, orchard rows, larch groves in autumn); the parameters (density
first with three grades, more trees the denser the grade for every type, the
four-tree limit for every combination of every type, lenient resolution, each type's
own parameter changing what grows); the meta; a bundled module growing the same
trees as the source, at its defaults and through `variant`; and the woods models
(one per type, the type's parameters, every combination built, denser with
density and within the LOD budget).
