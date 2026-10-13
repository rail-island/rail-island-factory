# The catalog site (factory.railisland.com)

**Covers** - the Solid site that lists every model the factory builds: its data,
the table and card layouts, sorting and search, the model page with its 3D
preview, and the URL state.
**Code** - `src/main.tsx`, `src/App.tsx`, `src/catalogQuery.ts`, `src/ModelTable.tsx`,
`src/ModelCards.tsx`, `src/ModelDetail.tsx`, `src/ModelViewer.tsx`, `src/Thumb.tsx`,
`src/factory.css`, `index.html`, `test/catalogQuery.test.ts`
**See also** - [../models/export.md](../models/export.md), [../guide/deploy.md](../guide/deploy.md)

The site is the factory's counterpart of the webapp Creator's model listing,
copied and trimmed: no sign-in, uploads, woods or packages, and English only.

## Data

`App.tsx` fetches `/catalog.json` ([../models/export.md](../models/export.md))
once. A missing catalog - a checkout where `pnpm build:models` never ran - shows
"The catalog is missing" rather than an empty list (the dev server answers a
missing file with `index.html`, so the response type is checked too).

## The listing

- **Wide (900 px and up): a table.** Thumbnail, title with the id beneath it, city
  pool, triangles, vertices, GLB size, primitives, materials, width, depth,
  height and license. Every header sorts; a second click flips the direction.
- **Narrow: cards.** Title and pool chip, then triangles, vertices and GLB size -
  plus the sorted-by column when it is something else, so a reorder never hides
  the number behind it.
- **The toolbar** (sticky) holds the search box, a sort `<select>` over every
  column, a direction toggle and the totals (models and triangles listed).

**Columns are data** (`COLUMNS` in `catalogQuery.ts`): the table, the cards, the
sort control, the comparator and the model page's spec list all read the one
list. Text columns start ascending, numbers descending; a missing value sorts
last in both directions; ties fall back to title, then id.

**Search** matches every whitespace-separated word, case-insensitively, against
title, id, category, pool, author, license and source.

## The model page

Clicking a row or card opens the model page: the interactive preview (drag to
orbit, wheel or pinch to zoom, no pan), the build's thumbnail and every column as
a spec list. Arrows step through the **current** filtered and sorted list;
Escape, the app bar's back arrow or the browser's Back return to it.

`ModelViewer.tsx` is the only module importing three (plus `GLTFLoader` and
`OrbitControls`), reached through a lazy import, so the list loads ~30 kB of
script and the renderer arrives only when a model opens. It renders on demand
(no damping, no idle loop), follows its pane with a ResizeObserver, frames the
model on each selection, and discards a load that resolves after the selection
moved on. On each framing it also fits the camera's `near`/`far` to the model
(near a twentieth of the closest zoom, far past the farthest): depth precision
goes with far/near, and a fixed 0.1..5000 range wasted it and let surfaces a few
centimetres apart flicker. It shows the GLB exactly as built - no `defaultScale` applied.

## URL state

All state is in the query string (`parseView`/`serializeView` in
`catalogQuery.ts`): `?q=` search, `?sort=` and `?dir=` ordering, `?model=` the
open model. Defaults are left out, so the plain list is the bare URL. Opening and
closing a model push a history entry; typing, sorting and stepping replace the
current one, so Back does not replay keystrokes. An unknown `?model=` shows
"No model" with a link back.
