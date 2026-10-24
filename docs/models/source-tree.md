# The procedural source tree

**Covers** - how a design records the tree of named scopes and primitive calls
that built it, the `export/tree/<id>.json` file, and how the site's Source tab
maps tree nodes to triangles for highlighting and picking.
**Code** - `generator/sourceTree.ts`, `generator/meshBuilder.ts` (`scope`, `sourceTree`; the geometry itself is `meshCore.ts`),
`generator/skyscrapers.ts`, `generator/vehicles.ts`, `generator/generate.ts` (`designTree`, `checkTreeSizes`), `generator/previews/index.ts`, `src/sourceTreeView.ts`,
`src/viewerHighlight.ts`, `src/SourceTreePanel.tsx`, `test/models.test.ts`,
`test/sourceTreeView.test.ts`, `test/viewerHighlight.test.ts`
**See also** - [skyscrapers.md](skyscrapers.md), [export.md](export.md), [previews.md](previews.md),
[../site/catalog-site.md](../site/catalog-site.md)

## What it is

A design is code: loops, helpers and `MeshBuilder` calls. The source tree is
that code's shape, recorded while it runs:

- a **scope** is a named block - a helper (`curtain wall`, `piers`, `mast`) or a
  part of a design (`podium`, `tier 3`, `segment 5`, `crown`);
- a **leaf** is one primitive call (`box`, `prism`, `loft`, `spire`, `sweep`,
  `slab`, `facets`, `cap`, `quad`, `tri`) with its material, its arguments and the
  triangles it drew.

Only the **outermost** call is a leaf: a `box` draws through `prism`, `loft`,
`quad`, `tri` and `cap`, and is still one leaf.

## Recording

```ts
m.scope("crown", () => {
  m.box("glassDark", 0, 0, 19, 19, 128, 136);
  floorBands(m, "steel", rect(19, 19), 128, 136, 2, 0.3, 0.3); // opens "floor bands"
});
```

`scope(name, fn)` runs `fn` inside a named node and returns its result. Scopes
nest; a loop opens one per iteration (`` m.scope(`tier ${i + 1}`, ...) ``).
Recording only observes: it never changes what is drawn or in which order, so
the GLB bytes are the same with or without scopes (tested).

**Every primitive must sit in a scope.** The catalog sweep (`test/catalogSweep.ts`) fails when a
design draws straight under its root, so a new design cannot ship an
unreadable tree. The shared helpers open their own scope, so calling one
directly from a design is enough for its primitives.

## The file: `export/tree/<id>.json`

Written by `pnpm build:models` beside the GLB and thumbnail, compact JSON,
deterministic, rewritten only when its text changed, pruned with its design.
It is **site-only**: not listed in either meta.json, not part of the
game's import contract, and free to change.

**City blocks have none.** A block preview (`proc-preview-block-*`,
[previews.md](previews.md)) draws dozens of buildings, and its tree ran to
15-40 MiB of JSON - over Cloudflare's 25 MiB per-asset limit, so the deploy
failed. Those designs set `sourceTree: false`: the build writes no file (and
removes an old one), the catalog record carries `noSourceTree: true`, the dev
server answers 404 and the site shows no Source tab. The tree is still recorded
in memory, so the catalog sweep checks it like any other. The build itself
refuses any tree file over 25 MiB (`checkTreeSizes`, `TREE_MAX_BYTES`), naming
the design, so the next oversized tree fails `pnpm build`, not the deploy.

```ts
{ version: 1, id, triangles, materials: string[], colors: string[], root: ScopeNode }
ScopeNode = { id, name, triangles, min?, max?, children: (ScopeNode | LeafNode)[] }
LeafNode  = { id, kind, material, args, tri: [first, count], triangles, min?, max? }
```

- `materials` is the GLB's primitive order (sorted by name); `colors` the sRGB
  hex of each, for the swatches.
- **Ids** are slash paths of slugged scope names: `tier-3/piers/box-4`. The root
  is `""`. A repeated sibling name gets `-2`, `-3`...; a leaf is `<kind>-<n>`
  counting that kind within its scope. Ids follow the code: renaming a scope or
  reordering calls changes them (and breaks shared `?node=` links, which then
  select nothing).
- **`tri`** is the leaf's triangles as a range **within its material's
  primitive**. Every call draws in one material and triangles are appended in
  call order, so the range is contiguous; a degenerate call has `count` 0.
  Because a scope's calls are consecutive, a scope's triangles are one run per
  material too. In a model with **parts** (an articulated vehicle's `truck` and
  `trailer`, [vehicles.md](vehicles.md)) a material has a primitive in each
  part's node; `tri` then counts across them in node order - the truck's
  triangles of that material first, then the trailer's. A part inside another
  part's node (a steered wheel inside its body, [vehicle-rig.md](vehicle-rig.md))
  is drawn right after its parent, so drawing order and depth-first node order
  agree. Each part is also a top-level scope. A rail bogie's node
  ([vehicle-rig.md](vehicle-rig.md#rail-supports-and-turning-bogies)) is drawn amid
  its body's triangles; a leaf never straddles two nodes, so `sourceTree()` moves
  each leaf's range as a block to where its node's triangles start.
- `args` are the call's arguments rounded to the millimetre; a ring is recorded
  as its point count (`ring`, `lower`, `upper`).
- `triangles`, `min`, `max` are the node's extent in metres (absent when it drew
  nothing); a scope's is the union of its children's.

The catalog sweep (`test/catalogSweep.ts`) checks, for every design, that the leaves' ranges tile
each material's primitive exactly and that each leaf's box matches the GLB's
triangles in its range.

## On the site

The model page's **Source** tab (see [../site/catalog-site.md](../site/catalog-site.md))
fetches the tree once the tab is open. `src/sourceTreeView.ts` indexes it: nodes
by id, and per material an array naming the leaf that owns each triangle.

- **Highlight** (`src/viewerHighlight.ts`): GLTFLoader gives one mesh per
  material (per material and part, with parts; each mesh then knows the
  `offset` of its first triangle in the tree's numbering). For a selection, each mesh gets draw groups - the node's ranges with
  a glowing copy of its material, the rest with a transparent ghost copy; a mesh
  the node does not touch is all ghost. Clearing the selection restores the
  built materials. Nothing is split or re-uploaded.
- **Picking**: a click that is not a drag raycasts the model; the hit mesh's
  material and the hit's face index (the triangle index, indexed or not), plus
  the mesh's offset, name the leaf. `test/viewerHighlight.test.ts` loads real GLBs
  with GLTFLoader in Node to pin both.
