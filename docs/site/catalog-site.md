# The catalog site (factory.railisland.com)

**Covers** - the Solid site that lists every model the factory builds: its data,
the table, card and thumbnail layouts, browser-rendered variant thumbnails, sorting and search, the model page with its 3D
preview (its passenger view on structure pages included), and the URL state.
**Code** - `src/main.tsx`, `src/App.tsx`, `src/catalogQuery.ts`, `src/ModelTable.tsx`,
`src/ModelCards.tsx`, `src/ModelDetail.tsx`, `src/ModelViewer.tsx`, `src/viewerHighlight.ts`, `src/viewerScenery.ts`, `src/viewerMotions.ts`, `src/viewerGlass.ts`, `src/viewerInteriors.ts`, `src/viewerPassenger.ts`, `src/viewerOverlays.ts`,
`src/SourceTreePanel.tsx`, `src/sourceTreeView.ts`, `src/Thumb.tsx`, `src/modelModule.ts`, `src/ExportPanel.tsx`,
`src/ModelVariants.tsx`, `src/VariantThumb.tsx`, `src/variantThumbs.ts`, `src/thumbRender.ts`,
`src/devCatalog.ts`, `src/devMeasure.ts`, `generator/devServer.ts`, `generator/devExport.ts`, `test/devExport.test.ts`,
`src/factory.css`, `src/favicon.svg`, `src/apple-touch-icon.png`, `src/social-preview.png`, `src/boot.ts`, `src/bootEntry.ts`, `index.html`, `vite.config.ts`,
`test/catalogQuery.test.ts`, `test/boot.test.ts`, `test/siteMeta.test.ts`, `test/rig.test.ts` (the Pose sliders), `test/scenery.test.ts`, `test/viewerInteriors.test.ts`, `test/viewerPassenger.test.ts`, `test/characters.test.ts` (the Characters chip, ground and motion buttons)
**See also** - [../models/export.md](../models/export.md), [../guide/deploy.md](../guide/deploy.md), [openttd-export.md](openttd-export.md)

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

The bar at the top opens with the Rail Island logo (`src/rail-island-logo.webp`,
the game's logo from www.railisland.com at 96 px), a link to the game at
`play.railisland.com` (`PLAY_URL`), then shows "Rail Island Factory" (on a model page, the model's title,
its id and a back arrow) and, on the right, an **Add your model** link to the
repository's README on GitHub - the landing page for someone who wants to make a
model (`ADD_MODEL_URL` in `App.tsx`) - and an **Export (n)** button, the number
of model variants on the export list, which opens the export panel: a GRF for
OpenTTD or a ZIP of GLBs, built in the browser ([openttd-export.md](openttd-export.md)).

The favicon (`src/favicon.svg`) is a sawtooth-roofed factory with a chimney on a
rail, in the site's colours; `src/apple-touch-icon.png` is the same drawing at
180 px for a phone's home screen. `index.html` links both, so Vite hashes them
into `dist/assets/` (the public folder is the generated export).

### Link previews

`index.html` carries the page's description and canonical URL and the Open Graph
and Twitter card tags that Facebook, Reddit, X, Slack and messengers read when a
link to the site is shared (they do not run the app, so every page of the site
shows the same preview). The image is `src/social-preview.png`, 1200 x 630 px:
the site's colours and favicon, the title and a one-line description, the Eiffel
Tower, Notre-Dame, the alpine hut, the twisted skyscraper and the Boeing 747
above a rail line with the CSD 475.1 steam locomotive, the CD 230, the Tatra T3 and
the 12 m Karosa/Renault city bus. It was composed from those models' transparent
`export/thumbs/` renders on an HTML page screenshotted headlessly; the vehicles'
side views share one scale and a ground line (row 183 of 192), so they are all drawn
at the same height and stand on the rail at their true relative lengths; redo it when the
site's look changes, not for every new model (it names no model count).
Crawlers need an absolute URL, which Vite does not rewrite, so the
`social-preview` plugin in `vite.config.ts` emits the file at the site root as
`social-preview.png`, unhashed; `test/siteMeta.test.ts` keeps the tags and the
image's size in step. After a change, re-scrape the page with Facebook's Sharing
Debugger, as its previews are cached.

A footer under the catalog links to www.railisland.com (`HOME_URL`) and to the
factory's GitHub repository (`REPO_URL`).

## Data

`App.tsx` fetches `/catalog.json` ([../models/export.md](../models/export.md))
once. A missing catalog - a checkout where `pnpm build:models` never ran - shows
"The catalog is missing" rather than an empty list (the dev server answers a
missing file with `index.html`, so the response type is checked too).

## Local dev (`pnpm dev`)

`pnpm dev` is plain `vite`: nothing is built before the server is up (about a
second), and there is no export folder in play (`publicDir` is off while
serving). The `dev-export` plugin (`generator/devServer.ts`) answers the site's
data URLs from the generator, loaded through Vite's SSR loader
(`generator/devExport.ts`) and warmed in the background once the server listens:

| URL | Served |
|---|---|
| `/catalog.json` | every design's meta entry, with `dev: true` and each record `pending`: zero counts and sizes, no JS hash, no rig, a placeholder side frame for a road or rail vehicle |
| `/js/<id>.js` | the design's JS model, bundled on first request and kept in memory - byte-identical to the build's |
| `/tree/<id>.json` | the source tree, built on request |
| `/refs/<id>/<name>` | the source image, straight from `assets/` |
| `/surfaces.meta.json` | the named surfaces, as the build writes them ([../models/surfaces.md](../models/surfaces.md)) |
| `/textures/<file>` | a photo of the texture library, straight from `assets/textures/` |
| `/thumbs/...` | 404: there are no thumbnail files |

An edited file under `generator/` makes Vite reload the generator's changed
modules, drops the bundled JS models and reloads the page, so the next request
builds the new design. No z-fighting, LOD or game-property check runs in dev:
`pnpm build` and the tests run them.

The page then does the build's measuring itself (development bundle only;
`import.meta.env.DEV` keeps it out of the deployed site):

- **Measuring.** `App.tsx` hands the pending records to `src/devCatalog.ts`,
  which measures them one at a time - the open model first, then the rows in
  their listed order - and swaps them in every 300 ms. `src/devMeasure.ts`
  loads the record's JS model, hashes its text (the `jsHash` the thumbnail cache
  keys on), gzips it with the browser's `CompressionStream`, builds the default
  and counts triangles, vertices, meshes and materials, the bounding box, the
  rig (`userData.rig`) and a vehicle's side frame - the build's figures
  (`test/devExport.test.ts`), except the gzip level and no thumbnail size. A
  measurement is kept in `localStorage` under the model's id and JS hash, so a
  reload rebuilds only the models whose code changed (their JS is still fetched,
  to hash it).
- **Thumbnails.** Every thumbnail - the listing's, the model page's - is the
  browser render of the default variant (`VariantThumb`, the IndexedDB cache
  below), drawn once the record is measured; a pending record shows the empty
  placeholder.

To see what deploys - the build's thumbnails and figures - run `pnpm build` and
`pnpm preview`.

## The listing

- **Thumbnails** (`src/Thumb.tsx`) are the build's (under `pnpm dev`, the browser's - "Local dev" above): a road or rail vehicle's is a
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
- **The toolbar** holds the search box, a sort `<select>` over every
  column, a direction toggle, the **Table / Thumbnails** layout switch, the
  filter chip rows and the totals (models and triangles listed). On a wide screen
  it is sticky; on a narrow one it scrolls away with the list, since its chip rows
  would leave too little room for the models.
- **Characters.** The characters (category `Characters`, the avatar) have a
  first-row chip of their own, with no second row
  ([../models/characters.md](../models/characters.md)).
- **Trees and Woods.** The tree species (category `Trees`) have a first-row chip
  of their own; a tree's page also offers a *Coarse (distant forest)* level of
  detail ([../models/lod.md](../models/lod.md)). The **Woods** chip (category
  `Woods`) lists the woods types as grove models, `proc-woods-<name>`: a model page
  shows a type's grove in 3D with the usual parameter selector (density and the
  type's own parameter), and the thumbnail view shows every parameter combination
  ([../models/woods.md](../models/woods.md)).

## The thumbnail view

The layout switch's **Thumbnails** (`?view=thumbs`; **Table**, the default,
is the table or cards above) lists one row per model, on any screen width
(`src/ModelVariants.tsx`): title, pool chip, id and the number of variants
(`variantCount` - every combination of the parameters' values, a conditional
parameter counted only where it applies; 1 for a fixed model), then the
thumbnails of up to ten of them (`MAX_SHOWN_VARIANTS`), each captioned with its
non-default values. Which ten (`representativeVariants` in `catalogQuery.ts`):
the defaults first, then every other value of each parameter with the rest at
their defaults, taken in turns across the parameters (each one's second value,
then each one's third...), a conditional parameter under the first value that
enables it; slots still left are filled with combinations spread evenly over all
variants. The title opens the model; a thumbnail opens it at that variant
(its values in `?p.<name>=`).

**Variant thumbnails are rendered in the browser**, on demand
(`src/VariantThumb.tsx`, `src/variantThumbs.ts`, `src/thumbRender.ts`) - the
build ships only the default's picture. A thumbnail is asked for when its box
comes within 200 px of the viewport and released when it leaves; renders run
one at a time in the order asked, and one released before its turn is skipped.
`thumbRender.ts` builds the variant from its JS module and draws it with one
shared offscreen `WebGLRenderer` into a WebP (PNG where WebP cannot be written):
a road or rail vehicle in the build's side view (orthographic, nose on the left,
24 px per metre over the fixed -0.3..6.0 m window, so every vehicle shares one
scale and one rail line; shown 90 px tall), everything else in the three-quarter
view at 256 px. Each image is cached in IndexedDB (database
`factory-variant-thumbs`), keyed by `variantThumbKey`: the model id, its
`jsHash` ([../models/export.md](../models/export.md)), the resolved values and
`VARIANT_THUMB_VERSION` - so a rebuilt model draws afresh, and changing the
framing or lighting means bumping the version. The cache is a pure cache: no
IndexedDB, a full quota or a blocked open only means rendering again; past 4,000
images the oldest written go first. The export panel shows its entries with the
same thumbnails, each at its own variant ([openttd-export.md](openttd-export.md)).
The table and cards keep the build's thumbnails.

**Columns are data** (`COLUMNS` in `catalogQuery.ts`): the table, the cards, the
sort control, the comparator and the model page's spec list all read the one
list. Text columns start ascending, numbers descending; a missing value sorts
last in both directions; ties fall back to title, then id.

**Filter chips** (`GROUPS`, `chipRows` in `catalogQuery.ts`) are the webapp
Creator's, without its origin row (Common / Mine / Community / Archive): the
factory has one origin. The first row is All plus one chip per fleet - Trains,
Road vehicles, Trams, Ships, Aircraft, Cable cars, Buildings, Trees, Woods, then
Structures, Rails and roads, City blocks, Props and Textures (the site's preview pages and the
props, [../models/previews.md](../models/previews.md)) - offered only when it has models. A record's category picks its fleet (`Rail vehicles` is Trains,
except a `tram` group, which is Trams; `Road vehicles` is Road vehicles; `Cable
car` is Cable cars; any category that is not a vehicle one is a building's).
Under a pick, a second row splits it by the vehicle's `group` (Locomotive, Unit,
Coach, Wagon, Metro, Bus, Truck), the building's category, a structure's or a way's set
(Bridges, Railway stations, Dams, Rail types, ...) or a city block's district; Ships, Aircraft,
Cable cars, Trams, Trees, Woods, Props and Textures have no second row. A third row splits a Locomotive or a
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
a spec list. Its **Add to export** button puts the model, at the parameter values
on screen, on the export list ("In the export" once that variant is listed;
[openttd-export.md](openttd-export.md)). Arrows step through the **current** filtered and sorted list;
Escape, the app bar's back arrow or the browser's Back return to it.

A model page always opens at its top, however far the list was scrolled, and
closing it returns the list to where it was (`show` in `App.tsx`; the browser's
own scroll restoration is off). On a wide screen the page fills the window and
does not scroll: the preview takes the rest of the width and only the side panel
scrolls, in its own column (`.factory--detail`). A narrow screen scrolls the whole
page, preview first.

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
return ([../models/parameters.md](../models/parameters.md)). A parameter marked `preview` - a
fixture of a site preview that the game takes from the world, such as a bridge's span or a block's
size - is listed apart, under **Preview parameters**
([../models/previews.md](../models/previews.md)). A site preview (`proc-preview-*`) has no
**Add to export** button, and its `proc-preview-*` id is never shown: wherever the site shows a
model's id (beneath the title, in the bar, in the specs' Id) a preview shows its set type id
exactly as a saved game stores it (`gameId`, e.g. `platforms_shared`), or nothing when it draws
no set type (a texture, the cable-car pylon); `shownId` in `src/catalogQuery.ts`.

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

A model with looping animation clips (the steam locomotives' running gear, the
rolling wheels of the CD 150 and the photo trucks) gets
**Start** and **Stop** buttons over the preview: Start plays the clips in a loop
with a render loop that runs only while they play, Stop halts them in place, and
another model or parameter choice stops them
([../models/animation.md](../models/animation.md)). A model with pantographs
(`state` clips) gets **Up** and **Down** instead: they raise or lower every
working collector over 1.5 s from wherever it stands, as the game does at a stop;
the model always arrives with them raised, its rest pose. A model with opening
doors (`door` clips) gets **Open left** and **Open right** - each only where it has
doors on that side - and **Close**, which move each side's doors between shut and
open over 2 s, eased, from wherever they stand; the model always arrives shut
([../models/doors.md](../models/doors.md)). Behind the doors each car's cabin
shows only while one of its doors opens or stands open; **Interior on / Interior
off** shows every cabin with the doors shut and cuts the model away just under the
ceilings, so the seat layout shows from above, and the triangle count is the
exterior's ([../models/interiors.md](../models/interiors.md)). A model with lamps gets a
**Lights on / Lights off** button beside them that shows every tagged lamp lit,
indicators blinking ([../models/lamps.md](../models/lamps.md)).

A **character** (a model with a `motion` clip: the avatar,
[../models/characters.md](../models/characters.md)) gets no Start and Stop but one
button per clip, named after the clip - **Idle**, **Walk**, **Run**, **Jump**,
**Fall**, **Sit** - and **Stop**. The buttons come from the clips' drives and shapes
(`viewerMotions.ts` `motionButtons`), not from the avatar's clip names: a `time` or
`distance` clip and a `motion` clip whose last sample repeats its first loop until
another button or Stop; a `motion` clip that ends near its start (jump) plays once
and hands over to the first `time` clip (idle); one that ends in another pose (sit)
eases into its end - the clip carries the easing - and holds it. Walk and run play
in place at the pace their `distance` drive states (their tooltip names it). Each
change cross-fades over 0.25 s from the motion before; Stop fades back to the rest
pose. The button playing is pressed (`aria-pressed`). A character is framed close
(its height is a person's), and the render loop runs only while a motion plays or
fades - not while a held pose stands.

A road or rail vehicle stands in its **scenery** (`viewerScenery.ts`), drawn from its
record's `scenery` (`generator/catalog.ts` `sceneryOf`): a rail vehicle on a
ballasted standard-gauge track, a tram on the game's narrow asphalt road with its
track embedded, a road vehicle on that road (8 studs, 5.33 m, across, kerbs
included). Over an electric vehicle (`traction` electric) and every tram hangs the
game's wire - a railway's contact and messenger wires on masts, a tram's single
trolley wire on poles - its underside at `scenery.wireTop`, the one height every
raised collector reaches (`generator/collector.ts`,
[../models/animation.md](../models/animation.md)). So a design's wheels can be
checked against the rails and its collector against the wire by eye. Everything
runs along x from 8 m before the model to 8 m past it, at y = 0 the running
surface; it is neither picked nor highlighted and adds nothing to the triangle
count. A character stands on a strip of grass with a paved path along x (its
walking direction), 3 m past it either way, its surface at y = 0 the soles, beside a
**height marker**: a pole as tall as the game's vehicle doors (`DOOR_HEIGHT`, 2 m;
`scenery.marker`), banded red and white every quarter metre, ticked every half
(longer each metre), with a crossbar at the top - so the figure's height reads
against the scale the game expects. The marker is scenery too. A **Scenery**
checkbox beside the buttons hides it, for every model until it is ticked again.

### Passenger view

Every **Structures** page (bridges, bus stops, railway stations, bus and truck
stations, cable car stations, ports, airports, dams, tunnel portals) gets a
**Passenger view** button over the preview (`viewerPassenger.ts`): the camera
drops to a passenger's eye on the model and stays there until **Orbit view** or
Esc puts the orbit camera back exactly where it was. OrbitControls is off
meanwhile, and Esc and the arrow keys belong to the walk, not to the page.

- **Where one can stand** is found from the drawn triangles, not from per-family
  data: an upward face (normal y > 0.7) with the eye height plus 0.25 free above
  it. The triangles are indexed once per build in an x/z grid (`Ground`), so a
  floor or a wall test reads a cell or two. The eye height is the preview's
  `userData.passenger.eye`, else 2.55 studs
  ([../models/previews.md](../models/previews.md), "Passenger view hints").
- **Viewpoints** (a select beside the button; the first is where the view
  opens): a grid over the model, floors no higher than four eye heights over its
  lowest point, joined into the areas one can walk between (a step or a stair
  apart). Roof tops (over another floor) and flat tops more than an eye height
  over the deck are left out; raised decks - track beds over the ground,
  platforms over the beds, islands, quays - are preferred to the ground between
  them; a stated track is never stood on. From those, in this order and at least
  two eye heights apart: **End** (on a station: **Platform end**), **Middle**,
  **Under the roof** (a spot with a cover above), **Side**, **Far end** (**Other
  platform end**) and **Upper level** where one stands an eye height above the
  rest. Deterministic: the same build gives the same list.
- **Walking**: W A S D or the arrow keys walk, Q and E turn, Shift runs; a drag
  looks around (pitch held within +-77 degrees); on a touch screen one finger
  looks and two fingers walk. The passenger keeps to a floor: a step up or down
  of at most 0.6 units is taken (stairs), a platform edge or a wall stops them
  (rays at knee, waist and eye height; a blocked move slides along the wall), and
  they never leave the model's bounds by more than an eye height. The render loop
  runs only while a key is held; a drag renders per move. A parameter change
  keeps the passenger where they stand when the floor is still there, else at the
  same viewpoint; another model brings the orbit view back.
- **Overlays** on a railway station page (its preview states its tracks): two
  checkboxes, off by default and kept across pages (`viewerOverlays.ts`). **Parked
  train** loads the UIC-Z coach's own JS model (`proc-vehicle-uic-z-coach`, as any
  page loads its model, `modelModule.ts`), scales it from metres to studs (x1.5),
  turns it along z and stands its wheels on the rail top of the first track with
  a platform beside it, coupling as many cars as fit (one to four), centred on the
  track. **Catenary** draws a mast beside every track every 15 studs or less,
  3.1 studs off its centre (outside the 5-stud ballast, on the side that keeps
  2.8 studs from every track - on a platform when that is where the room is, as
  the game does), with an arm and a register arm out over the track, a dropper, and
  the contact and messenger wires at the game's heights (8.86 and 10.6 studs over
  the rail top, `generator/previews/wayKit.ts`). Both are rebuilt with every build,
  so they follow the page's track count and length; neither counts triangles nor is
  walked on, and the station's JS and thumbnails are untouched.

`test/viewerPassenger.test.ts` covers the floors, the head room, the step limit,
the walls, the viewpoints, the hints reaching `userData` and the overlays' layout.

`ModelViewer.tsx` (with its helpers `viewerHighlight.ts`, `viewerLamps.ts` and `modelModule.ts`, which
fetches and builds a model's JS module with the subset of three it reads, `THREE_SUBSET`, constants such as
`DoubleSide` included; `test/modelModule.test.ts` checks it against the builder's code), the variant thumbnail renderer (`thumbRender.ts`) and the export (`exportRun.ts`) are the only
code importing three (plus `OrbitControls`, or the `GLTFExporter`), each reached
through a lazy import, so the list loads ~30 kB of script and the renderer arrives
only when a model opens, a variant thumbnail is needed or an export runs. It renders on demand
(no damping, no idle loop), follows its pane with a ResizeObserver, frames the
model on each selection, and discards a load that resolves after the selection
moved on. On each framing it also fits the camera's `near`/`far` to the model
(near a twentieth of the closest zoom, far past the farthest): depth precision
goes with far/near, and a fixed 0.1..5000 range wasted it and let surfaces a few
centimetres apart flicker. It shows the model exactly as its JS module builds it - every model, at any
parameters, the same file the game draws; no `defaultScale` applied. One exception
is the glazing of the structure previews and props: the drawing kit's glass
(`glass#rrggbb`, [../models/previews.md](../models/previews.md)) turns see-through
in the preview as the game draws a station's glass - opacity 0.28, double-sided, no
depth write (`viewerGlass.ts`, `test/viewerGlass.test.ts`). The JS model and the
thumbnails keep it opaque; a vehicle's windows (plain `glass`) stay opaque.

## The Source tab

The model's procedural source tree ([../models/source-tree.md](../models/source-tree.md)):
named scopes - podium, tier 3, piers - down to the `MeshBuilder` calls that drew
the triangles. `tree/<id>.json` is fetched only when the tab opens (under
`pnpm dev`, built then); a missing file says to run `pnpm build:models`. A city
block ships no tree (its record carries `noSourceTree`), so its page has no Source tab.

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
`catalogQuery.ts`): `?q=` search, `?view=thumbs` the thumbnail layout, `?cat=`, `?sub=` and `?sub2=` the three chip
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


## Optional Max detail

The model's level selector offers **Max detail** only when its catalog record
carries `maxDetail` (currently oak). The preview calls the JS module's `buildMax`
with the current parameter values and displays its actual triangle count.
Stepping to a model without that capability falls back to full detail. Source-tree
highlighting stays disabled outside full detail, since its triangle ranges belong
to the default build. Export-list selections retain the normal full-detail
behaviour; the downloaded JS module includes its optional Max detail builder.

Retired parameter values are resolved before enum validation, keeping earlier
URLs usable. Oak's old seed values `7` and `19` resolve to the numbered variants
`1` and `2`, respectively; its visible seed choices are `1` through `5`.
