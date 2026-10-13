# Procedural source tree

Status: agreed
Date: 2026-10-13
Area: generator (MeshBuilder, designs, build/export), catalog site (model page, 3D preview)

## Context of the change

Each of the ten skyscrapers is a plain TypeScript function in
`generator/skyscrapers.ts` that calls `MeshBuilder` primitives (`box`, `prism`,
`loft`, `spire`, `cap` in `generator/meshBuilder.ts`), partly through shared
helpers (`curtainWall` -> `floorBands` + `piers`, `mast`) and partly inside loops
(art-deco tiers, pagoda segments, terraced steps). `MeshBuilder` collects
triangles per material only, and `toGlb` writes one node, one mesh and one
primitive per material (materials in name order). Once a model is built, nothing
records which call produced which triangle.

The site (`src/ModelDetail.tsx`, `src/ModelViewer.tsx`) shows a lazily loaded
three.js preview of the GLB and a spec list read from `catalog.json`. There is
no way to see how a model was made without reading the generator source, and no
way to answer "which line drew this ledge?" from the preview.

Constraints from the repository: GLB bytes must not change unless the design
changes; output is deterministic; `src/` may import only types from
`generator/`; `export/` is generated and gitignored; model ids are never renamed.

## User request

In the web model browser, add some method to visualise the procedural source of a
model. The idea is a tree, with nodes mapped to procedural items.

## Decisions

### What does a node in the tree represent, and how is the tree captured?
| Option | What it means |
|---|---|
| Named scopes + primitives (Recommended) | MeshBuilder gets a scope stack. Helpers (curtainWall, piers, mast...) and loop bodies ("tier 3", "segment 5") open a named scope; every primitive call (box/prism/loft/spire) is a leaf with its parameters. Small edits in designs/helpers; meaningful names; loop iterations distinct. |
| Automatic from call stack | A stack trace per primitive call, tree from function names. No design edits, but loop iterations collapse, names are bare function names, fragile. |
| Flat primitive list | One row per primitive call, no hierarchy. Simplest; hundreds of unstructured rows for some designs. |

**Answer: Named scopes + primitives (Recommended)**

### What should selecting a node in the tree do in the 3D preview?
| Option | What it means |
|---|---|
| Highlight + dim the rest (Recommended) | The node's triangles get a highlight; everything else turns into a semi-transparent ghost, keeping context. |
| Isolate | Show only the selected subtree. Clearer for hidden inner parts, loses context. |
| Both, toggleable | Highlight by default, a switch to isolate. More UI. |

**Answer: Highlight + dim the rest (Recommended)**

### Where does the tree data live? (The GLB has to stay byte-identical, so the tree records triangle ranges inside each material primitive.)
| Option | What it means |
|---|---|
| Sidecar JSON per model (Recommended) | A generated `export/tree/<id>.json`: scope tree, leaf parameters, per-leaf triangle ranges into the GLB's material primitives. Deterministic, gitignored, loaded lazily by the model page. GLB and catalog.json unchanged. |
| Inside catalog.json | Each record carries its tree. No extra fetch, but the listing download grows for every visitor. |
| In the GLB (extras / named nodes) | Self-contained, but changes the GLB bytes the game imports and adds draw calls. |

**Answer: Sidecar JSON per model (Recommended)**

### Is the tree part of the export contract that the game imports?
| Option | What it means |
|---|---|
| Site-only (Recommended) | Served next to the GLBs, not listed in `skyscrapers.meta.json`; the game ignores it; the format may change freely. |
| Part of export contract | Documented as a stable file the webapp may read; needs versioning. |

**Answer: Site-only (Recommended)**

### Where does the tree appear on the model page?
| Option | What it means |
|---|---|
| Tab in the side panel (Recommended) | The side panel gets "Specs" (today's list) and "Source" (the tree) tabs; the 3D stage keeps its size; on narrow screens the tabs sit under the preview. |
| Third column | Tree, 3D, specs side by side. Squeezes the preview, does not fit phones. |
| Overlay over the 3D | A collapsible floating tree over the preview. Covers part of the model. |

**Answer: Tab in the side panel (Recommended)**

### Should it also work in reverse: click on the model in 3D to select its node in the tree?
| Option | What it means |
|---|---|
| Yes, click to pick (Recommended) | A click (not a drag) raycasts the GLB, maps the hit triangle to its leaf, selects it, expands and scrolls the tree to it. |
| Tree -> 3D only | Selection only from the tree. |
| Hover + click | Hover previews the node under the cursor, click selects. Needs rendering on every pointer move. |

**Answer: Yes, click to pick (Recommended)**

### What does the detail of a selected node show? (multi-select)
| Option | What it means |
|---|---|
| Primitive params | Call kind (box/prism/loft/spire/cap), material with a colour swatch, numeric arguments (centre, size, y0..y1, ring point count). |
| Stats | Triangle count and bounding box of the node's subtree, its share of the model's triangles. |
| Source link | Link to the design's source line on GitHub; needs call sites recorded at build time. |

**Answer: Primitive params, Stats** - no source link.

### How strict should scoping be for the designs?
| Option | What it means |
|---|---|
| Scope all ten now + test (Recommended) | Every helper and every design's logical parts get scopes in this change; a test fails if any primitive sits directly under a design's root. |
| Scope all ten, no rule | Same scoping now, but unscoped calls are allowed and land under the root. |
| Helpers only | Only shared helpers open scopes; design bodies untouched; loop iterations not split. |

**Answer: Scope all ten now + test (Recommended)**

### Should the selected node be part of the URL (shareable, survives reload)?
| Option | What it means |
|---|---|
| Yes, ?node= (Recommended) | The open tab and selected node go in the query string, using node ids built from the scope path; a stale id falls back to no selection. |
| No, transient | Selection lives in memory only and resets on model change or reload. |

**Answer: Yes, ?node= (Recommended)**

## High-level plan

1. **Recording in the generator.** `MeshBuilder` gains a scope stack: a design or
   helper opens a named scope around a block of calls; every outermost public
   primitive call (a `box` that internally calls `prism`/`loft`/`cap` is one leaf,
   not four) becomes a leaf with its kind, material and numeric arguments. Since
   each call emits into exactly one material and triangles are appended in order,
   a leaf's geometry is one contiguous triangle range within that material's
   primitive. Recording only observes; the triangle order and so the GLB bytes
   stay identical (the existing byte-stability checks prove it).
2. **Scoping the designs.** All shared helpers open scopes; every design wraps
   its logical parts (podium, each tier or segment by index, crown, spire, mast,
   wings...). A test fails when a primitive sits directly under a design root.
3. **Export.** The build writes `export/tree/<id>.json` per design beside the
   GLB and thumbnail, deterministically, and deletes trees of removed designs.
   The tree types live in a `node:`-free generator module so `src/` imports
   only the types. Not listed in `skyscrapers.meta.json`.
4. **Site.** The model page's side panel gets "Specs" and "Source" tabs. The
   Source tab lazily fetches the tree and shows it collapsible (top level open),
   with a detail block for the selected node: primitive params (kind, material
   swatch, arguments) and stats (subtree triangles, share of the model, bounding
   box). Selecting highlights the node's triangles in the preview and ghosts
   the rest; a click (not a drag) on the model raycasts, maps the hit triangle
   to its leaf, selects it and expands/scrolls the tree. `?tab=` and `?node=`
   join the URL state; a stale node id means no selection.
5. **Docs and tests.** Update `docs/models/skyscrapers.md` (scoping rule, how to
   scope a new design), `docs/models/export.md` (the tree file, site-only) and
   `docs/site/catalog-site.md` (Source tab, picking, URL keys). Tests cover tree
   determinism, triangle ranges matching the GLB primitives, the no-unscoped
   rule, and the new URL keys.

Phase 1 precedes 2 and 3; phase 4 depends on the tree format from 3.

## Database and persistent storage

- **`export/tree/<id>.json`** - a generated file per model, served by the site.
  Kind: static JSON in the gitignored export folder (Vite publicDir, deployed
  with the Worker assets). Structure: `{ version: 1, id, triangles, materials:
  string[] (GLB primitive order), root: Node }`; `Node` is either a scope
  `{ id, name, children: Node[] }` or a leaf `{ id, kind, material,
  args: Record<string, number | number[]>, tri: [first, count] }` where `tri`
  indexes triangles within that material's primitive. Node `id` is the slash
  path of slugged scope names (`tier-3/piers`); duplicate sibling names get a
  numeric suffix; leaves are `<kind>-<n>` within their scope. Written by the
  build, read by the model page only; regenerated on every build, lifetime of
  the export. No migration (new file).
- **URL** gains `?tab=source` and `?node=<id>` (not storage, but persisted in
  links). Nothing else is stored; no browser storage.

## Architecture decisions

- **Explicit scopes over stack traces.** Names are meaningful, loop iterations
  are distinct and nothing depends on runtime stack formats; the cost is that
  designs must call the scope API, enforced by a test.
- **Sidecar JSON over GLB changes.** The GLB is the game's import contract and
  must stay byte-identical; a sidecar keeps the tree free to evolve and out of
  the listing download.
- **Triangle ranges, not separate meshes.** The preview keeps one primitive per
  material; highlight and picking work through a triangle-to-leaf lookup built
  from the ranges, so draw calls do not grow.
- **Site-only format.** Not in the export contract, so it can change without
  coordinating with the webapp.

## Weaknesses and risks

- **Node ids change with the design.** Renaming a scope or reordering calls
  breaks shared `?node=` links; mitigated by falling back to no selection.
- **Ghosting cost.** Ghosting needs transparent materials or a per-vertex
  highlight attribute on the loaded GLB; transparency sorting on a single
  primitive may look rough. Likely low; the implementation picks the approach.
- **Ranges vs degenerate triangles.** `tri()` drops degenerate triangles, so
  ranges must count emitted triangles, not requested ones; covered by the
  range-vs-GLB test.
- **Tree size.** Pier-heavy designs produce hundreds of leaves; the JSON stays
  small (tens of kB) but the tree UI must stay usable collapsed.
- **Scoping discipline.** Adding scopes to all ten designs is manual work that
  must not change geometry; the byte-stability check guards it.

## Out of scope

- Links to source lines on GitHub (explicitly not chosen).
- Hover previews in 3D; isolate mode.
- Making the tree part of the export contract for the game.
- Editing parameters live in the browser (the site stays a viewer).
