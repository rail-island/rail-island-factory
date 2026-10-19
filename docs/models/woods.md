# Woods types

**Covers** - the woods types the game paints: distribution functions keyed by a
stable name, the contract the game calls them with (the cell context, the output
slots, the four-tree limit, the hash), the forest rule they are written in, their
standalone modules, `woods.meta.json`, the grove previews and the tests.
**Code** - `generator/woods.ts`, `generator/woodsApi.ts`, `generator/woodsExport.ts`,
`generator/woodsGrove.ts`, `src/WoodsGallery.tsx`, `test/woods.test.ts`
**See also** - [trees.md](trees.md), [export.md](export.md),
[../site/catalog-site.md](../site/catalog-site.md), the game's
`docs/rendering/woods.md` and `docs/tooling/factory-import.md`

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
and a grove shares a tone from the same field. Heights are about 15% taller than the
game's old presets, part of the stylised look ([trees.md](trees.md)).

The thirteen types are the ones the game shipped -- `pine-forest`, `oak-woods`,
`mixed-woods`, `scrub`, `palms`, `tropical-forest`, `high-mountain-forest`, `park`,
`scots-pine-woodland`, `larch-woodland`, `autumn-larch-woodland`,
`hazel-woodland-edge`, `village-orchard` -- rewritten with relations: a pine forest
grows 1.7 trees a cell inside and young pines and bushes at its edge, a park stays a
quarter tree a cell so the lawn shows, the mountain forest shrinks with height.

## The export

`woodsExport.ts` writes, for a whole export only:

- `woods/<name>.js`: one standalone ES module per type, no imports, exporting
  `woods` (name, label, swatch, floor), `distribute`, `sample`, `MAX_TREES_PER_CELL`
  and `MASK_RADIUS` (esbuild; the types are marked pure so a module carries only its
  own);
- `woods.meta.json`: `maxTreesPerCell`, every tree species (`species`, `id`) and every
  woods type (`name`, `label`, `swatch`, `floor`, `module`), each list sorted by key, no
  numeric ids -- the game maps names to the ids its maps store;
- `thumbs/woods-<name>.png`: the grove preview (below), re-rendered only when its
  model's hash changes (`thumbs/.woods.json`).

The game imports all of it with `pnpm import:factory` (its
`docs/tooling/factory-import.md`).

## The grove previews

`woodsGrove.ts` runs a woods type over a 14-cell patch -- a rounded wood with a
ragged edge on flat ground, grass around it -- and bakes every tree into one model
the way the game places it: the cell's centre plus the slot's offset, scaled to its
height against the species' height at that level, stretched by `width`, tilted by
`lean` about the tree's own X axis after its turn, and coloured by `shade` and `hue`
with the game's instance-colour formula (`instanceTint`). The ground is the woods
type's floor under the wood and grass outside it. The site shows the groves above the
tree species when the **Trees** chip is picked (`src/WoodsGallery.tsx`), each with its
name, swatch and floor colour.

## Tests

`test/woods.test.ts`: the hash vectors and the mask; every shipped name present,
unique and kebab-case; for every type, over a sweep of interiors, edges, lone cells,
slopes and heights, at most four trees a cell, each a known species inside its cell
with a sane height, width, lean, shade and hue; determinism; `sample`; the relations
(denser inside than at the edge, more shrubs at the edge, a pine forest above one tree
a cell, a thin park, a treeline, orchard rows, larch groves); the meta; and a bundled
module growing the same trees as the source.
