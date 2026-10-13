# Procedural source tree

Spec: docs/specs/2026-10-13-procedural-source-tree.md
Date: 2026-10-13
Status: implemented
Area: generator (MeshBuilder, the ten designs, the build/export), catalog site (model page, 3D preview, URL state)

## What was done

- **Recording.** `MeshBuilder.scope(name, fn)` opens a named node. Every
  outermost primitive call becomes a leaf with its kind, material, arguments
  (rounded to the millimetre, rings as point counts) and its triangle range
  inside its material's GLB primitive. `sourceTree(id, title)` returns the tree
  with slash-path ids, triangle counts and bounding boxes. The types live in
  the new `generator/sourceTree.ts`, which has no `node:` imports.
- **Scoping.** Every helper (`curtain wall`, `floor bands`, `piers`, `mast`)
  opens its own scope, and all ten designs wrap their parts (podium, tiers,
  segments, drums, floors, crown, spire...). The SHA-256 of all ten GLBs is
  the same before and after the change, checked by hand and pinned by a unit
  test.
- **Export.** `pnpm build:models` writes `export/tree/<id>.json` (12-70 kB),
  rewrites it only when its text changes, and prunes trees of removed designs.
  `designTree(id)` is exported for tests. The file is site-only.
- **Site.** The model page's side panel has Specs and Source tabs.
  - `SourceTreePanel.tsx` shows the collapsible tree with the root open, and a
    detail block for the selected node.
  - `viewerHighlight.ts` makes the selected node glow and ghosts the rest using
    draw groups on the per-material meshes.
  - `ModelViewer.tsx` picks the leaf under a click by its face index.
  - `?tab=source` and `?node=` are part of `ViewState`. The pure logic is in
    `sourceTreeView.ts`.
- **Docs.** A new `docs/models/source-tree.md` with a row in the index;
  updates to `skyscrapers.md`, `export.md`, `catalog-site.md` and
  `setup-and-build.md`.
- **Checks.** `pnpm typecheck` is clean, `pnpm test` passes (80 tests in 5
  files) and `pnpm build` passes.
  - New tests: scope recording and ids; the GLB staying the same with scopes;
    every design scoped; leaf ranges tiling each GLB primitive, with each
    leaf's box matching its triangles; tree determinism; tree writing and
    pruning.
  - Also: the tree index, ranges and labels; the URL keys; highlight groups
    and raycast picking on real GLBs loaded with GLTFLoader in Node.
- **Branch.** The work is on the session's designated branch,
  `claude/focused-keller-gruky4`, not a new `claude/<slug>-xxxxxx` branch. The
  session requires all pushes to go to that branch.

## How to test

**Automated coverage.** There is no E2E test: the repository has no E2E
framework, and CLAUDE.md asks for headless verification only. The behaviour
under the UI is covered by `pnpm test`, including `test/viewerHighlight.test.ts`
for highlight and picking on real GLBs.

**Setup.** `pnpm install`, then `pnpm dev` (it runs `pnpm build:models` first).
Open the printed local URL. No account or flags are needed.

**Steps.**
1. Open "Art Deco Tower" from the list. The side panel shows the tabs "Specs"
   (selected) and "Source".
2. Click "Source". The URL gains `&tab=source`. A hint reads "Select a part in
   the tree or click the model.", and the tree shows "Art Deco Tower" opened to
   plinth, tier 1..5 and crown, each with a triangle count.
3. Click the caret next to "tier 3", then click the "piers" label. The row is
   highlighted, the URL gains `&node=tier-3%2Fpiers`, and in the preview the
   tier-3 piers glow orange while the rest of the tower turns faint.
4. Read the detail block: title "piers", id `tier-3/piers`, Parts, Triangles
   with a percentage, Size (w x d x h) and Height span.
5. Click a leaf such as "box stone" under piers. The detail shows Call "box",
   Material with a swatch, and cx, cz, w, d, y0, y1, ry, top.
6. Click (do not drag) the red light on top of the "Glass Office Tower" mast,
   after stepping to it with the arrows and opening Source. The tree opens to
   `mast` and the `prism red` row is selected and scrolled into view.
7. Click empty background in the preview. The selection clears and the model
   shows its normal colours.
8. Press the x in the detail block after selecting something. The selection
   clears.
9. Reload the page with `?model=sky-art-deco&tab=source&node=crown`. The crown
   is selected and highlighted.

**Also worth trying.**
- `?model=sky-art-deco&tab=source&node=tier-9`: nothing is selected and no
  error is shown.
- Drag to orbit: this never changes the selection.
- Step to the next model with the arrows: the tab stays on Source and the
  selection is dropped.
- Switch back to Specs: the highlight clears, and the node disappears from the
  URL.
- Narrow window (< 900 px): the tabs sit under the preview.
- Delete `export/tree/` and reload a Source tab: "This model has no source
  tree - run `pnpm build:models`."

## What is missing

Nothing - the spec is implemented in full.

## Known problems

- Picking works only while the Source tab is open. On Specs no tree is loaded,
  so a click does nothing.
- Ghost triangles are pickable too: a click on a faint part in front of the
  highlighted one selects the faint part.
- Ghosting uses depthWrite-off transparency on one mesh per material, so faint
  surfaces may draw in a slightly wrong order. This is cosmetic.
- Node ids change when a scope is renamed or calls are reordered. Shared
  `?node=` links then select nothing, as the spec accepts.
- The tree has no keyboard navigation (arrow keys still step between models).
  Rows are plain buttons reachable with Tab.
- The tree format adds fields beyond the spec's sketch: `colors` (for the
  swatch), and `triangles`/`min`/`max` on every node (for the stats, so the
  site needs no geometry work). Booleans such as `top` are recorded as
  booleans.

## Recommended follow-ups

- Keyboard navigation in the tree (up/down/left/right on rows), so it is usable
  without a pointer.
- An option to make ghosted triangles unpickable, so a click lands on the
  highlighted part behind them.
- A tree search box for the bigger trees (the brick tower has about 300
  leaves).

## Changelog

- A model's page now has a Source tab that shows how the model was built: a
  tree of named parts down to each shape the code drew.
- Selecting a part in the tree highlights it in the 3D preview and fades the
  rest of the model.
- Clicking the 3D model selects the part under the cursor and opens the tree to
  it.
- The selected part shows its shape type, material, dimensions, triangle count
  and size.
- The open tab and the selected part are kept in the page address, so a link
  opens the same view.
