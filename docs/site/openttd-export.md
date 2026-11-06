# The export: OpenTTD GRF and GLB ZIP

**Covers** - the site's export list (the "Add to export" button, the app bar's Export panel, its browser storage), the two formats it writes in the browser (a NewGRF for OpenTTD and a ZIP of GLB files), the model page's one-click "Download for OpenTTD" and its OpenTTD view, how a vehicle becomes OpenTTD sprites, the GRF encoder, the `openttd` block every vehicle a GRF can hold states (facts, presets, formations) and the balance formula, the preview scenes prerendered in OpenTTD, and how the GRF was checked against nmlc and a real OpenTTD.
**Code** - `src/exportList.ts`, `src/ExportPanel.tsx`, `src/exportRun.ts`, `src/download.ts`, `src/modelModule.ts`, `src/zip.ts`, `src/ModelDetail.tsx` (the stage bar), `src/OpenttdPreview.tsx`, `src/openttd/properties.ts`, `src/openttd/projection.ts`, `src/openttd/spriteRenderer.ts`, `src/openttd/pixels.ts`, `src/openttd/grf.ts`, `src/openttd/scene.ts`, `src/openttd/scenes/`, `generator/design.ts` (`OpenttdProperties`, `checkOpenttdProperties`), `generator/openttd.ts`, `generator/openttdTable.ts`, `generator/openttdIds.ts`, `generator/openttdIds.json`, `generator/writeOpenttdIds.ts`, `generator/generate.ts` (`checkOpenttdDesign`), `generator/catalog.ts` (`catalogRecord`), `generator/openttdScenes/` (the prerender, its marker GRF, scene AI and game script, the headless preview), `test/openttdGrf.test.ts`, `test/openttdExport.test.ts`, `test/openttdOneClick.test.ts`, `test/openttdIds.test.ts`, `test/exportList.test.ts`
**See also** - [catalog-site.md](catalog-site.md), [../models/openttd-figures.md](../models/openttd-figures.md) (every vehicle's figures), [../models/game-properties.md](../models/game-properties.md), [../models/js-format.md](../models/js-format.md), [../specs/2026-10-17-openttd-grf-export.md](../specs/2026-10-17-openttd-grf-export.md), [../specs/2026-11-04-one-click-openttd-export.md](../specs/2026-11-04-one-click-openttd-export.md)

## The export list

Every model page has an **Add to export** button. It adds the model at the
parameter values on screen - the variant the preview shows - to the export
list; once that variant is listed the button reads "In the export". A model can
be listed several times, once per variant (a CD 163 in two liveries is two
entries). The button is on every model; the GRF takes only vehicles (below).

The app bar's **Export (n)** button opens the export panel over the listing or
the model page:

- the entries, each with the thumbnail of that variant (rendered in the browser
  and cached, as the thumbnail view's are: [catalog-site.md](catalog-site.md)), title and variant ("Livery: CD 162", or
  "Default variant"), and a remove button; an entry the chosen format cannot take
  is greyed with the reason;
- the **set name** (the GRF's name and the file name);
- the **format**: *GRF for OpenTTD* or *ZIP of GLB files*;
- for a GRF, its **GRF id**: "5249" (RI) and four hex digits of the users' half,
  8000..FFFF; until the user types one, the set name's hash in that half
  (`defaultSetGrfId`, shown in the field), and "From the set name" returns to it.
  Anything else is refused and Export disabled while it stands;
- **Export**: builds the file in the browser, one model at a time, with a progress
  bar and a Cancel button, then downloads it. Entries that were skipped are listed
  afterwards.

### Storage

The list lives in the browser's localStorage under one key,
`factory.openttdExport`; nothing reaches a server and each browser has its own.

| Field | Type | What |
|---|---|---|
| `version` | number | the value's format, 1 |
| `name` | string | the set name |
| `entries` | array | the list, in the order added |
| `entries[].id` | string | a model id |
| `entries[].params` | object | the variant's non-default parameter values, as the URL's `p.<name>` |
| `grfid` | number, optional | the GRF id's low 16 bits the user chose, 0x8000..0xFFFF; absent for the default (the name's hash) and in lists stored before it existed; one out of range is dropped on reading |

The site reads it once the catalog has loaded and writes it on every change.
On reading, an entry whose model is gone, or whose values the model no longer
takes (or a default value stored as if chosen), is dropped and the panel says how
many; duplicates collapse. An unreadable value or another `version` starts an
empty list. Storage that throws (a private window) only loses persistence.

## The one-click download

A vehicle OpenTTD can hold gets a bar over its model page's stage: a **3D model /
OpenTTD** switch (a segmented control on a solid surface, the view on screen
filled; the OpenTTD view, below) and **Download for OpenTTD**, a solid button
that becomes the filled primary action while the OpenTTD view is on screen
(on a phone, under 600 px, it shortens to its icon and "OpenTTD"). The switch is in the
URL (`?stage=openttd`, [catalog-site.md](catalog-site.md)), so a link opens the
OpenTTD view directly. The
button builds, in the browser and at once, a GRF of that one model
(`exportModelGrf`): every preset of its `openttd` block, the default first, then
every formation, with a progress line and Cancel. The export list is not touched.

- the set's name is the model's title; its GRF id is "RI" and the model's own
  number from the **id table** (below), so downloading it again after the model
  changed replaces the same GRF in a saved game; the file is `<id>.grf`;
- the presets and formations are **grouped under the default** in OpenTTD's
  purchase list: each one's head names the default's head as its engine variant
  (property 2F / 26 / 20 / 20; OpenTTD 13 and later show one row to unfold, older
  versions list them all).

## The ZIP of GLBs

Each entry's JS module ([../models/js-format.md](../models/js-format.md)) is
built with its values and written as binary glTF by three's `GLTFExporter`,
parts and animation clips included. The ZIP holds the GLBs only, stored (not
compressed), dated 1980-01-01, named `<id>.glb` for the defaults and
`<id>--<name>-<value>[--<name>-<value>...].glb` for a variant, names sorted.
The bytes differ from the build's in-memory GLB (`MeshBuilder.toGlb`,
[../models/export.md](../models/export.md)): the browser never runs generator
code, so it is the JS model's three objects that are exported. The export folder
itself still holds no GLB.

## The GRF

### Which models

| Catalog | OpenTTD |
|---|---|
| Rail vehicles (not trams) | train |
| Rail vehicles, `tram` group; Road vehicles | road vehicle (a tram with the tram flag) |
| Ships | ship |
| Aircraft | aircraft |
| Cable cars, buildings | not in a GRF (skipped with a notice) |

### Figures

`resolveVehicle` (`properties.ts`) layers, later winning:

1. **category defaults** (`defaultOpenttdFields`): introduced 1960 (steam 1900),
   30-year vehicle life (aircraft 25), 60-year model life, reliability decay 20,
   temperate, sub-arctic and sub-tropical climates, rail type ELRL for electric
   traction and metro (else RAIL), and per group a cost factor, running cost
   factor, capacity and cargo: coach 60, unit 120, metro 150, tram 100 and bus 60
   passengers; wagon 30 and truck 20 goods, refittable to bulk, piece, liquid and
   covered cargo; ship 300 and aircraft 150 passengers;
2. the design's declared **`openttd`** block (below);
3. that block's **variant** entry matching the exported values exactly.

Weight, power and top speed are the record's `game` figures, with the matching
`game.variants` entry ([../models/game-properties.md](../models/game-properties.md)).
A train vehicle with power 0 is a wagon in OpenTTD. The name is the title, with
a variant's value titles in brackets: "CD 163 / 363 (CD 162)".

### The `openttd` block

Every vehicle a GRF can hold (rail, tram, road, ship, aircraft) states its
`openttd` block (`generator/design.ts` `OpenttdProperties`) in one table,
`generator/openttdTable.ts`, keyed by model id; the build puts each entry on its
design, so no source module - and none of its JS models - changes for it. Its
figures are listed in [../models/openttd-figures.md](../models/openttd-figures.md).

| Field | Range | What |
|---|---|---|
| `introYear` | year | **required**: the year it entered service (1 January) |
| `capacity` | 0..65535 | **required**: seats (with standing room for a metro, tram or city bus), a freight vehicle's payload in tonnes, a tank's in kilolitres; in units of `cargo` |
| `cargo` | 4-letter label | **required**: PASS, MAIL, GOOD, COAL, OIL_, STEL, WOOD, GRAI, ... |
| `refitClasses` | list | **required** (may be empty): passengers, mail, express, armoured, bulk, piece, liquid, refrigerated, hazardous, covered |
| `climates` | list | **required**: temperate, arctic, tropical, toyland |
| `railType` | 4-letter label | **required on a train**, refused on anything else: RAIL, ELRL, MONO, MGLV |
| `costFactor`, `runningCostFactor` | 0..255 | derived (below) unless stated |
| `vehicleLife`, `modelLife` | 1..255 years | derived unless stated |
| `reliabilityDecay` | 0..255 | derived unless stated |
| `variants` | list | `{ params, ...fields }`: a selection's own figures (a livery's year, a class's seats), as `game.variants` |
| `presets` | list | **required**: the selections the one-click download exports, `{}` (the default) first |
| `formations` | list | `{ name, cars: [{ params, turned? }] }`: fixed formations of the design's own cars |

`checkOpenttdDesign` (`generator/generate.ts`) runs for every design when the
catalog is built and fails it when:

- a vehicle a GRF can hold has no block, or lacks a required fact or its presets;
  a cable car or a building has one;
- a figure is out of range or not an integer, a label not four printable
  characters;
- a variant, preset or formation car is not a real, offered, non-default
  selection, or names the whole articulated train (`unit: "train"`: formations
  stand in for it); a preset is listed twice or the default does not come first;
- a formation has fewer than two cars, shares another's name, or - its cars built
  and measured - more than 32 OpenTTD parts.

**The catalog's block.** The site's `catalog.json` record carries the block
resolved (`generator/openttd.ts` `catalogOpenttd`): every field at the default
selection, and a variant entry - only what differs - for each preset, declared
variant and formation car whose figures differ (its own facts, or balance figures
that follow its own power). Not in the game's `vehicles.meta.json`.

**The balance formula** (`deriveBalance`), from the selection's power (kW), top
speed (km/h) and capacity, each result rounded and clamped to 1..255:

| Type | Purchase cost factor | Running cost factor | Vehicle life | Model life | Reliability decay |
|---|---|---|---|---|---|
| train, powered | 20 + power/40 + speed/5 + capacity/4 | 10 + power/50 + capacity/6 | 35 (steam 40) | 40 | 20 (steam 25) |
| train, unpowered | 10 + capacity/3 + speed/10 | 5 + capacity/8 | 40 | 40 | 20 |
| road vehicle | 20 + power/5 + capacity/3 | 10 + power/10 + capacity/6 | 15 (tram 30) | 25 (tram 35) | 20 |
| ship | 40 + power/50 + capacity/10 | 20 + power/40 + capacity/20 | 30 | 40 | 20 |
| aircraft | 60 + power/100 + capacity/3 | 30 + power/80 + capacity/5 | 25 | 30 | 20 |

A 4,000 kW, 140 km/h locomotive costs 148 / 90, a 60-seat coach 44 / 13. A design
or variant may state any of them instead.

**Category defaults.** `defaultOpenttdFields` (`src/openttd/properties.ts`, the
first layer above) remain for a record without a block; since every vehicle a GRF
can hold states one, they no longer reach an export.

**Formations.** A formation is one articulated OpenTTD engine of its cars, front
first; a car marked `turned` is drawn facing backwards (its model turned about the
vertical axis), as the rear cab car of a unit. Each car is cut into its own parts
of at most 8/8 (below), so a cut never falls inside a car. Its head is the first
car's: its figures, the formation's name after the title ("TGV Duplex (power
cars, 8 trailers)"), the **sum** of the cars' power, purchase and running cost
factors, the lowest of their top speeds; each later car's weight goes on its first
part, and every car's capacity is spread over its parts (below). The 24
formations are in [../models/openttd-figures.md](../models/openttd-figures.md).

### Size and parts

OpenTTD has no 3D: a vehicle is 8 sprites, one per direction, drawn in its
dimetric projection (`sx = 2 (y - x)`, `sy = x + y - z` at normal zoom, 16 tile
units to a tile edge). A full-length (8/8) train or road vehicle is 8 units long,
half a tile.

The export draws a model **at its true proportions** at one scale: **one eighth
of length per metre** (`METRES_PER_FULL_LENGTH = 8`), the width at the same scale
and the height at twice it (a z unit is one pixel, half a ground unit on screen).
At that scale a model is as wide as OpenTTD's own vehicles. So a vehicle is
long: a 16.4 m locomotive is 16/8 (one tile), a 26.4 m coach 26/8. A vehicle
longer than 8/8 becomes an **articulated** OpenTTD vehicle of up to 32 parts of
at most 8/8, as equal as possible, longer first (`partLengths`); each part is the
slice of the model it covers, drawn about its own centre (OpenTTD places a
vehicle at its middle, the front `ceil(length / 2)` ahead), cut by two clipping
planes. On a diagonal a train or road vehicle of n units spans n steps of (1, 1),
as OpenTTD spaces vehicles there, so its diagonal views are longer by the square
root of two, as OpenTTD's own are. Ships and aircraft have no length in OpenTTD:
they are scaled whole to fit their longer plan side into one tile, keep that
length in every direction, and a ship is lowered by its `draftFrac`.

**Capacity on the parts.** An articulated vehicle - a long single car or a
formation - carries its capacity on its parts: each car's capacity split as evenly
as possible over its parts (`shares`), in its own cargo with its own refits, the
head's share in place of the vehicle's. OpenTTD adds the parts up in the purchase
list, and a train can so carry more than the 255 one part holds.

Trains therefore need long stations and, for more than a few cars, a higher
`max_train_length` in OpenTTD's settings than its default 7 tiles. The scale was
chosen by comparing renders in OpenTTD: OpenTTD's own convention (lengths
squeezed about three times against width) looked stubby, true proportions at
OpenTTD's lengths too thin.

### Sprites

`spriteViews` (`projection.ts`) gives, per part and direction, the model-to-tile
matrix, the orthographic projection of the sprite's frame (the slice's box on
screen, padded a pixel and widened to whole normal-zoom pixels) and the clipping
planes. The offsets count from where OpenTTD anchors a vehicle's sprite, which is not
the vehicle's position but a corner of its bounding box, moved by direction and,
for a train, by length (`spriteAnchor`, from each vehicle type's
`UpdateDeltaXY` in OpenTTD 13 and 14; version 15 keeps the same point). Without
it a train sat beside its rails and an articulated coach's slices of different
lengths did not line up. A tram's offsets also take it from its lane onto its
rails (`TRAM_LANE_SHIFT`): OpenTTD drives a tram along a road vehicle's lane
(13.4 `table/roadveh_movement.h`: on the default right-hand side y 5 heading SW,
y 9 NE, x 9 SE, x 5 NW), while the tram track lies at 8 like a train's; the
curve views take the mean of their neighbours. Without it a tram sat beside its
track, the near rail showing below its body. A game driving on the left puts the
lanes on the other side, which a sprite cannot know. `SpriteRenderer` draws it with WebGL: the materials swapped for flat
diffuse ones of the same colour, an ambient (1.2) and a directional (1.5) light
from the screen's upper left, an antialiased premultiplied canvas at twice the
4x size. `zoomImages` (`pixels.ts`) box-filters it to OpenTTD's 4x, 2x and
normal zoom images, straight RGBA. There is no company colour: the sprites keep
the factory livery.

### The encoder

`encodeGrf` (`grf.ts`) writes GRF container version 2 by hand: the signature,
the data section (pseudo sprites; real sprites as references by id) and the
sprite section (each sprite's three zoom images, type RGBA, GRF-compressed: literal
runs and back references of up to 16 bytes, so transparent pixels cost 2 bytes in
16). The actions, laid out as nmlc 0.9 lays out the same NML:

| Action | What |
|---|---|
| 14 | INFO: palette D, BLTR 32 (OpenTTD switches to a 32bpp blitter itself) |
| 8 | GRF version 8, the GRF id, name and description |
| 0 (feature 08) | the rail type table (RAIL first) and the cargo table (PASS first) |
| 0 | per vehicle the head's properties (long intro date, lives, speed, power in hp, weight, running cost base and engine class by traction, capacity and cargo by table index, refit classes, the tractive effort coefficient 0.3, an aircraft's acceleration, length as "shorten by", custom sprites, the engine variant it is grouped under); each hidden articulated part (no climate, its length, the head's rail type; its share of the capacity with its cargo and refits, its own weight) |
| 4 | the name, plain ASCII or UTF-8 marked as such |
| 1 | one sprite set of 8 directions per part |
| 2 | a basic set per part; an articulated vehicle's callback switch (var 0C: callback 16 to the part switch) and part switch (var 10: part n's id, then "no more parts") |
| 3 | the head's graphics (the callback switch, or its set), each part's own set |

A train or road vehicle always gets OpenTTD's tractive effort coefficient, 0.3:
a GRF's new engine otherwise has none, and with realistic acceleration an engine
with no tractive effort barely moves whatever its power.

An aircraft's subtype (property 09) is 0 for a helicopter (`game.aircraftKind:
"helicopter"`; `ResolvedVehicle.helicopter`), which lands at OpenTTD's heliports, helipads
and oil rigs and is never large, and 2 for every other aircraft, large (property 0A) unless
its `sizeClass` is `small`.

An aircraft gets an acceleration (property 0D) of speed / 20, clamped to 18..50,
OpenTTD's own aircraft's range: a GRF's new aircraft otherwise has 0 and never
leaves its hangar (found when the preview prerender's marker aircraft stayed in
theirs; `test/openttdGrf.test.ts` pins it).

An aircraft is always refittable to passengers: OpenTTD has no default-cargo
property for aircraft and disables one with no refittable cargo.

**Ids.** An OpenTTD saved game finds a GRF by its GRF id and its vehicles by
their local ids, so both stay fixed:

| GRF id ("RI" and 16 bits) | Whose | Assigned by |
|---|---|---|
| 0000 | nobody | reserved |
| 0001..7FFF | a model's one-click GRF | the id table, in order |
| 8000..FFFF | a user's set (the export list) | the user, in the Export panel; by default the set name's hash in this half |

| Local id, per vehicle type | Whose | Assigned by |
|---|---|---|
| 0100..2FFF | every preset's and formation's block of part ids, unique across all models | the id table |
| 3000..3FFF | an export-list entry that is no preset (any other selection) | the hash of its model id, sorted values and part index (`partKey`), placed in sorted key order with linear probing (`assignIds`) |

Above OpenTTD's original vehicles, below the 14 bits an articulated part's id
has. Every OpenTTD part needs its own id, and a single car longer than 8 m is
already several parts (a 26.8 m coach is 4), so each preset and formation
reserves a **block** of consecutive ids, its parts taking them in order, the head
first:

- a block's size is fixed when its ids are first assigned: **twice the parts** its
  built cars measure, at least 4 (`MIN_BLOCK`), at most 32 (`blockSizeFor`) - a
  locomotive of 3 parts reserves 6, a coach of 4 parts 8, an 8-car formation 32 -
  so a model may grow a little without its ids moving;
- the 314 blocks assigned on 4 November 2026, before vehicles were measured, keep
  the sizes they were given then: 16 for a preset, 32 for a formation;
- a vehicle that outgrows its block refuses to export (a formation fails the
  build); give the item a new key - a new name or values - so it gets a new block,
  its old one retired.
An export-list entry that is one of its model's presets takes that preset's block,
so it has the same ids in the user's set as in the model's own GRF.

**The id table** is `generator/openttdIds.json` (`generator/openttdIds.ts`),
committed: `grf` (model id -> number), `vehicles` (per vehicle type, item key ->
`{ id, size, retired? }`; a preset's key is `<model id>?<sorted values>`, a
formation's `<model id>?formation=<name>`) and `aliases` (a renamed item's new key
-> its old key). `pnpm openttd:ids` gives every new model, preset and formation the
next free number and block, measuring only the new items (building their cars);
ids are only ever appended:

- a key no longer exported stays, marked `retired`, and its ids are never given
  again; exported again, it is revived with them;
- a renamed preset or formation keeps its vehicles: add an alias from the new key
  to the old one before running the script, and the new key takes the old block;
- the build fails while an exported model, preset or formation has no id
  (`checkOpenttdDesign`), and `test/openttdIds.test.ts` while the table is not up
  to date.

The catalog record's block carries a model's ids (`ids`: its GRF number and each
preset's and formation's block, `{ id, size }`, in their order). In November 2026
the 119 models used 251 train blocks (4,400 ids, 0100..122F of the trains' 12,032
in 0100..2FFF), 32 road, 4 ship and 27 aircraft blocks; at a measured block's
usual 6 to 8 ids the trains' remaining 7,632 hold about a thousand more presets.

## The OpenTTD view

The stage's **OpenTTD** switch (`src/OpenttdPreview.tsx`, loaded with three only
when chosen) draws the model's **whole one-click pack** - every preset, then every
formation, exactly what the downloaded GRF holds (`oneClickItems`) - as the GRF
would draw it, into a scene prerendered in OpenTTD (below), each vehicle labelled:

1. the pack's kind picks the scene (`src/openttd/scene.ts` `kindOf`, `sceneName`):
   a train with rail type ELRL the electrified yard, any other train the plain
   one, a tram the tram yard, a bus or truck the road yard - each the yard of
   **exactly as many tracks as the pack has vehicles** (1..10), so no track stands
   empty - a ship the harbour, an aircraft the airport;
2. vehicle i stands at slot i: the default on the track nearest the viewer, the
   presets and formations behind it, all heading south-west (an aircraft as its
   small airport's terminal turns it), their fronts in a line;
3. the sprites come from the export's own renderer (`exportRun.ts`
   `previewSprites`): the same parts, views and zoom filter, in the slot's
   direction, at normal zoom and 4x; at each slot the vehicle stands where OpenTTD
   drew the marker (`placeParts`): its front where the 8/8 marker's was, its
   head's position ceil(L / 2) units behind it and each next part floor(L / 2) +
   ceil(L' / 2) behind the one ahead, each sprite at its part's OpenTTD anchor
   (`spriteAnchor`) plus the image's offsets; the nearest part is drawn last;
4. the canvas draws the scene's background, the sprites, its foreground (the
   catenary and fences over the vehicles), then the **labels**: the vehicle's
   OpenTTD name and, below, its local id ("0x0190"), light text on a dark box like
   OpenTTD's signs - ahead of a train's or road vehicle's nose, over the empty
   track there, above a ship or aircraft (`frontPoint`, `labelRect`);
5. the view shows the part of the scene the vehicles and labels cover, with a
   tile's margin (`viewRect`): a yard of short vehicles shows no track behind them.

**Fitting the space.** The Zoom choice is **Auto** by default; "4x zoom" and
"Normal zoom" show those at their own pixels (scrolling where larger). Auto
measures the space the view has (less its foot's controls) and takes the most
detailed view that fits (`chooseView`), in this order:

| | View | When |
|---|---|---|
| 1 | the whole pack at 4x, shrunk to no less than 0.7 (`MIN_4X_SCALE`), never enlarged | it fits so |
| 2 | 4x **cut to the fronts**: the vehicles' first parts and labels (a long train's rear left out), widened to fill the space, at 0.5 or more (`MIN_FRONT_SCALE`) | a few vehicles on a small screen |
| 3 | the whole pack at 4x, smoothly shrunk to no less than 0.25 (`MIN_SHRUNK_SCALE`: still normal zoom's size) | |
| 4 | the whole pack at **normal zoom**, shrunk to fit (to 0.5; below, it scrolls) | a large pack on a small screen |

Shrunk images are drawn smoothed, others pixel for pixel. The labels keep about
12 CSS pixels whatever the scale (drawn larger as the view shrinks; the choice is
made again with them at that size). Where they would overlap - normal zoom puts
the tracks 16 pixels apart - or where leaving them out lets the vehicles be shown
a sixth larger or more (unless the labelled view is already 4x at 0.7 or more:
`preferTags`), the vehicles carry **number tags** instead and a **legend** under
the picture names them (the OpenTTD name and the id, a row each, at most half the
height, scrolling beyond); the choice is then made for the space the legend
leaves. Picture and legend are centred as one block. The view is chosen again
whenever its space changes size.

A pack of more than 10 vehicles is shown 10 at a time, with a button per page. A line names the
GRF id ("GRF 52490007") and the pack's size; the note, the OpenTTD and OpenGFX
versions the scene was made with. The view's choices are not stored.

`generator/openttdScenes/previewSheet.ts` draws the same headlessly, with a small
software rasterizer in place of WebGL (flat Lambert, the same lights) and SVG
labels, for checks and for images of a model's pack in OpenTTD:

    pnpm exec tsx generator/openttdScenes/previewSheet.ts <model id> <out.png> [--zoom 4x|1x] [--page n] [--fit <width>x<height>]

`--fit` draws the view as Auto fits it to a stage of that size (with the tags and
legend where Auto would use them) and says what it chose.

## The preview scenes

`src/openttd/scenes/<scene>/` holds, per scene: `background-1x.png`,
`background-4x.png`, `foreground-1x.png`, `foreground-4x.png` (transparent but for
what covers a vehicle) and `placement.json`; `src/openttd/scenes/saves/` the
OpenTTD saved games they were rendered from (per kind, the scenes without and
with the markers). The site imports the PNGs and JSON as Vite assets and loads
only the scene it shows. 42 scenes, about 5.8 MB:

| Scene | What |
|---|---|
| `rail-1` .. `rail-10` | a yard of k parallel plain tracks along x, each 20 tiles from its depot, the vehicles heading south-west |
| `electric-1` .. `electric-10` | the same, electrified (the catenary in the foreground) |
| `road-1` .. `road-10` | k parallel roads |
| `tram-1` .. `tram-10` | k parallel tram tracks |
| `harbour` | ten ship lanes, two tiles apart, on a canal basin |
| `airport` | ten small airports, an aircraft at each one's terminal |

`placement.json`: `version` 2, `scene`, `kind` (rail, electric, road, tram, harbour
or airport), `openttd` and `opengfx` (the versions), `sizes` (per zoom, width and
height) and `slots`: `{ id (0 nearest the viewer), direction (OpenTTD's
Direction), maxLength (tile units of straight track behind the front: 256 in a
yard), anchors: { "1x": [x, y], "4x": [x, y] } }`, the anchor being the pixel
where OpenTTD anchored a full-length marker part's sprite stopped at the slot. A
yard's slots are lined up: each exactly one track behind the one ahead, its front
level with slot 0's (the markers stop a few units apart along their tracks).

**The prerender** (`generator/openttdScenes/prerender.ts`) is run by hand, never by
the build, the tests or CI, only to change a scene; it needs Linux, Xvfb, curl,
tar and unzip:

    pnpm exec tsx generator/openttdScenes/prerender.ts [--only <kind>] [--keep <dir> [--reuse]]

It downloads OpenTTD 13.4 (the version the encoder was checked against) and
OpenGFX 7.1 (GPL-2) once into `~/.cache/rail-island-factory/`, then per kind - six
games, 42 views (`GAMES`):

1. writes an OpenTTD personal directory: a config for a flat 256 x 256 map of one
   town (a permissive council, airports that never expire), the **marker GRF**
   (`markers.ts`, encoded by the site's own encoder), the **scene AI**
   (`ai/RIScenes`, its `scene` setting naming the kind) and a game script that
   pays for everything (`game/RIMoney`);
2. runs OpenTTD headless until the AI has built the kind's scenes - a yard kind's
   ten yards of 1..10 tracks, far enough apart that no screenshot sees two
   (`yardOrigin`) - trying the next map seed while the town stands within 12 tiles
   of them, and saves the game on exit; loads it again, where the AI buys the
   markers, drives each to its slot and stops it (the aircraft wait for a full
   load at their terminals), and saves again;
3. loads each save under Xvfb and screenshots each view at normal zoom and at 4x
   (`scrollto instant`, a zoom in and out so the view moves at once, then
   `screenshot normal` and `screenshot big`);
4. finds each marker part's **anchor**: a marker's sprite is a magenta mask with
   its anchor pixel - and four copies 3 pixels off, so a catenary wire hides at
   most some - in a colour telling slot, direction, part and copy, and holes where
   the neighbouring parts' anchors fall; a train marker has 32 full-length parts
   (16 tiles, a yard track's length), and only its south-west sprites are masks
   (the others a pixel, to keep the GRF small); the parts' 8-unit spacing is
   checked against every visible anchor (within a pixel);
5. takes as **foreground** every pixel of a mask that shows not the mask but the
   scene, unchanged from the save without markers: what OpenTTD drew over the
   vehicle;
6. crops a yard to its whole tracks - three tiles ahead of the fronts (the labels'
   room) to the depots - and the harbour and airport to their slots, and writes
   palette PNGs (OpenGFX uses at most 256 colours: lossless, checked) and
   `placement.json`. `--reuse` re-analyses a kept run's screenshots without
   OpenTTD.

### How it was checked

The property numbers and action layouts were compared with nmlc 0.9's output for
the equivalent NML (`test/openttdGrf.test.ts` pins them). A GRF of real models
built by the same encoder and projection, with a software rasterizer standing in
for WebGL, was loaded in OpenTTD 13.4: it loads without warnings, every engine
appears with the right name, figures and dates, articulated trains and buses are
built from their parts, and the sprites sit on the track at 4x zoom. The WebGL
renderer itself is browser-only and is checked by the user in the browser.
