# The catalog site (factory.railisland.com)

**Covers** - the Solid site that lists every model the factory builds: its data,
the table and card layouts, sorting and search, the model page with its 3D
preview, and the URL state.
**Code** - `src/main.tsx`, `src/App.tsx`, `src/catalogQuery.ts`, `src/ModelTable.tsx`,
`src/ModelCards.tsx`, `src/ModelDetail.tsx`, `src/ModelViewer.tsx`, `src/viewerHighlight.ts`,
`src/SourceTreePanel.tsx`, `src/sourceTreeView.ts`, `src/Thumb.tsx`,
`src/factory.css`, `src/favicon.svg`, `src/apple-touch-icon.png`, `src/boot.ts`, `src/bootEntry.ts`, `index.html`, `vite.config.ts`,
`test/catalogQuery.test.ts`, `test/boot.test.ts`, `test/rig.test.ts` (the Pose sliders)
**See also** - [../models/export.md](../models/export.md), [../guide/deploy.md](../guide/deploy.md)

The site is the factory's counterpart of the webapp Creator's model listing,
copied and trimmed: no sign-in, uploads, woods or packages, and English only.

## Loading and errors

The page must say something before the app bundle runs - on a slow phone link the
stylesheet and bundle can take a minute, and a failed load used to leave a blank
white page. So `index.html` carries, without waiting for anything else:

- an inline `<style>` with the dark background and the styles of the two items
  below, so neither depends on `factory.css` arriving;
- a **loading line** inside `#root` ("Loading Rail Island Factory..."). After 8 s
  it changes to say the connection looks slow. `main.tsx` empties `#root` before
  rendering, which removes it;
- the **boot script** (`src/boot.ts`), inlined as a classic script ahead of
  everything else by the `inline-boot` plugin in `vite.config.ts` (esbuild
  compiles `src/bootEntry.ts`; Vite itself bundles only module scripts). It
  lists every script error, unhandled rejection and failed script or stylesheet
  load in an **error box** at the bottom of the page, with Reload and Close.
  Failed images (a missing thumbnail) and the browsers' benign "ResizeObserver
  loop" notice are left out; each message shows once, at most ten.

## The app bar

The bar at the top shows "Rail Island Factory" (on a model page, the model's title,
its id and a back arrow) and, on the right, an **Add your model** link to the
repository's README on GitHub - the landing page for someone who wants to make a
model (`ADD_MODEL_URL` in `App.tsx`).

The favicon (`src/favicon.svg`) is a sawtooth-roofed factory with a chimney on a
rail, in the site's colours; `src/apple-touch-icon.png` is the same drawing at
180 px for a phone's home screen. `index.html` links both, so Vite hashes them
into `dist/assets/` (the public folder is the generated export).

## Data

`App.tsx` fetches `/catalog.json` ([../models/export.md](../models/export.md))
once. A missing catalog - a checkout where `pnpm build:models` never ran - shows
"The catalog is missing" rather than an empty list (the dev server answers a
missing file with `index.html`, so the response type is checked too).

## The listing

- **Thumbnails** (`src/Thumb.tsx`) are the build's: a road or rail vehicle's is a
  side view (the record's `thumbSide`, [../models/export.md](../models/export.md)), shown in a
  144 x 60 box standing on its bottom edge; everything else's is square, in a
  96 x 60 box. The model page shows a side view at 16 px per metre (half its
  pixels, never wider than the panel), so vehicles compare by length.
- **Wide (900 px and up): a table.** Thumbnail, title with the id beneath it, city
  pool, triangles, vertices, JS size, primitives, materials, width, depth,
  height and license. Every header sorts; a second click flips the direction.
  **The JS size is a link**: a click downloads the model's file (`js/<id>.js`,
  [../models/js-format.md](../models/js-format.md)) without opening the model. The model page's
  spec list links it too and adds the gzip size. There is no GLB to download.
- **Narrow: cards.** Title and pool chip, then triangles, vertices and JS size -
  plus the sorted-by column when it is something else, so a reorder never hides
  the number behind it.
- **The toolbar** (sticky) holds the search box, a sort `<select>` over every
  column, a direction toggle, the filter chip rows and the totals (models and triangles listed).

**Columns are data** (`COLUMNS` in `catalogQuery.ts`): the table, the cards, the
sort control, the comparator and the model page's spec list all read the one
list. Text columns start ascending, numbers descending; a missing value sorts
last in both directions; ties fall back to title, then id.

**Filter chips** (`GROUPS`, `chipRows` in `catalogQuery.ts`) are the webapp
Creator's, without its origin row (Common / Mine / Community / Archive): the
factory has one origin. The first row is All plus one chip per fleet - Trains,
Road vehicles, Trams, Ships, Aircraft, Cable cars, Buildings - offered only when
it has models. A record's category picks its fleet (`Rail vehicles` is Trains,
except a `tram` group, which is Trams; `Road vehicles` is Road vehicles; `Cable
car` is Cable cars; any category that is not a vehicle one is a building's).
Under a pick, a second row splits it by the vehicle's `group` (Locomotive, Unit,
Coach, Wagon, Metro, Bus, Truck) or the building's category; Ships, Aircraft,
Cable cars and Trams have no second row. A third row splits a Locomotive or a
Unit by its `traction` (Electric, Diesel, Steam); buildings have no city-pool
row. A lower row appears only when it offers a choice,
leads with its own All, and is cleared when the row above changes; picking the
picked chip clears it. The chips are derived from every model, not the searched
ones, so they hold still while somebody types; a picked chip that matches nothing
(an old link) is still offered so it can be switched off. Values the Creator
names get its label (`loco` reads Locomotive); any other reads as itself.

**Search** matches every whitespace-separated word, case-insensitively, against
title, id, category, pool, traction, author, license and source, and against
every parameter value's title and token - so `green cream` finds the CD 749
Bardotka, whose `livery` parameter draws it.

## The model page

Clicking a row or card opens the model page: the interactive preview (drag to
orbit, wheel or pinch to zoom, no pan), the build's thumbnail and every column as
a spec list. Arrows step through the **current** filtered and sorted list;
Escape, the app bar's back arrow or the browser's Back return to it.

The side panel has up to three tabs: **Specs** (the thumbnail and the spec list),
**Source** (below) and **Images** - the source images the model was made from
(photos, drawings, native textures; the record's `references`,
[../models/export.md](../models/export.md)). The Images tab appears only for a
model that has any; each image is shown at the panel's width with its path and
size and opens full size in a new tab. Low-resolution `.bmp`/`.gif` textures are
scaled with `image-rendering: pixelated`, so their pixels stay sharp.

A **parametric** model (one whose record has `params`) shows a Parameters block
above the tabs: a `<select>` per enum parameter, its default marked. Each choice
is built in the browser from the model's JS module, keeping the camera; the thumbnail, specs and source tree stay
the default build's, so tree highlight and picking pause until the defaults
return ([../models/parameters.md](../models/parameters.md)).

A **rigged** vehicle (its record has `rig`: every road vehicle) shows a **Pose**
block: a Steering slider and one per hinge of an articulated body ("Trailer",
"Joint", "Joint 1"...), in degrees, positive counter-clockwise seen from above, with a Reset button.
Moving one loads the model's JS module once and calls its `pose()` on the preview
- its JS build - which turns the steered wheels,
swings the sections about their hinges and re-draws the joints: the same code the
game is to call ([../models/vehicle-rig.md](../models/vehicle-rig.md)). It poses
with the preview's own rig (`posePreview`): a non-default variant's hinges are its
own, not the record's (the default build's), which only sets the sliders' limits.
Only the model on screen is posed - after a step the previous one stays until the
next lands - and a failed module load shows the error until a pose succeeds. The
pose is page state only, back to rest for every model, and never in the URL. While
a slider (or a parameter's select) has the focus the arrow keys are its own; they
step through the list only otherwise (`pageKey`).

A model with animation clips (the steam locomotives' running gear) gets
**Start** and **Stop** buttons over the preview: Start plays the clips in a loop
with a render loop that runs only while they play, Stop halts them in place, and
another model or parameter choice stops them
([../models/animation.md](../models/animation.md)).

`ModelViewer.tsx` (with its helper `viewerHighlight.ts`) is the only code
importing three (plus `OrbitControls`), reached through a lazy import, so the list loads ~30 kB of
script and the renderer arrives only when a model opens. It renders on demand
(no damping, no idle loop), follows its pane with a ResizeObserver, frames the
model on each selection, and discards a load that resolves after the selection
moved on. On each framing it also fits the camera's `near`/`far` to the model
(near a twentieth of the closest zoom, far past the farthest): depth precision
goes with far/near, and a fixed 0.1..5000 range wasted it and let surfaces a few
centimetres apart flicker. It shows the model exactly as its JS module builds it - every model, at any
parameters, the same file the game draws; no `defaultScale` applied.

## The Source tab

The model's procedural source tree ([../models/source-tree.md](../models/source-tree.md)):
named scopes - podium, tier 3, piers - down to the `MeshBuilder` calls that drew
the triangles. `tree/<id>.json` is fetched only when the tab opens; a missing
file says to run `pnpm build:models`.

- **The tree** starts with the root open. Each row shows the scope name (or a
  leaf's call kind and material, with a colour swatch) and its triangle count;
  the caret opens and closes a scope, the label selects the node.
- **Selecting** a node highlights it in the preview: its triangles glow, the
  rest of the model turns into a faint ghost.
- **Clicking the model** (a click, not a drag) selects the call under the cursor;
  the tree opens down to it and scrolls it into view. A click on empty space
  clears the selection. Picking works only while the Source tab is open.
- **The detail block** above the tree shows the selection: for a call its kind,
  material and arguments; for a scope its number of parts; for both the
  triangle count with its share of the model, the bounding-box size and the
  height span. The x button clears it.

## URL state

All state is in the query string (`parseView`/`serializeView` in
`catalogQuery.ts`): `?q=` search, `?cat=`, `?sub=` and `?sub2=` the three chip
rows (the Creator's names; a lower one only under the one above), `?sort=` and `?dir=` ordering, `?model=` the
open model, `?tab=source` or `?tab=references` its Source or Images tab and `?node=` the selected tree node (kept
only with the Source tab; a node id no longer in the tree selects nothing), and
`?p.<name>=<value>` a parametric model's non-default values (an unknown name or value falls back to the default). Defaults are left out, so the plain list is the bare URL. Opening and
closing a model push a history entry and reset the tab and node; typing,
sorting, stepping (which drops the node), switching tabs and selecting replace
the current one, so Back does not replay keystrokes. An unknown `?model=` shows
"No model" with a link back.

## Low level of detail

Every standalone JS model accepts `build(THREE, params, lod = false)`. Set the third
argument to `true` for its budgeted distant mesh. The factory detail view exposes
this through **Low level of detail** and reports the preview triangle count.
LOD rig posing is static; full-detail models and source trees are unchanged.
See [../models/lod.md](../models/lod.md) for budgets, geometry and verification.
