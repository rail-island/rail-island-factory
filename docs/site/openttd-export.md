# The export: OpenTTD GRF and GLB ZIP

**Covers** - the site's export list (the "Add to export" button, the app bar's Export panel, its browser storage), the two formats it writes in the browser (a NewGRF for OpenTTD and a ZIP of GLB files), how a vehicle becomes OpenTTD sprites, the GRF encoder, the `openttd` block on a design and its category defaults, and how the GRF was checked against nmlc and a real OpenTTD.
**Code** - `src/exportList.ts`, `src/ExportPanel.tsx`, `src/exportRun.ts`, `src/modelModule.ts`, `src/zip.ts`, `src/openttd/properties.ts`, `src/openttd/projection.ts`, `src/openttd/spriteRenderer.ts`, `src/openttd/pixels.ts`, `src/openttd/grf.ts`, `generator/design.ts` (`OpenttdProperties`, `checkOpenttdProperties`), `generator/catalog.ts` (`catalogRecord`), `test/openttdGrf.test.ts`, `test/openttdExport.test.ts`, `test/exportList.test.ts`
**See also** - [catalog-site.md](catalog-site.md), [../models/game-properties.md](../models/game-properties.md), [../models/js-format.md](../models/js-format.md), [../specs/2026-10-17-openttd-grf-export.md](../specs/2026-10-17-openttd-grf-export.md)

## The export list

Every model page has an **Add to export** button. It adds the model at the
parameter values on screen - the variant the preview shows - to the export
list; once that variant is listed the button reads "In the export". A model can
be listed several times, once per variant (a CD 163 in two liveries is two
entries). The button is on every model; the GRF takes only vehicles (below).

The app bar's **Export (n)** button opens the export panel over the listing or
the model page:

- the entries, each with its thumbnail, title and variant ("Livery: CD 162", or
  "Default variant"), and a remove button; an entry the chosen format cannot take
  is greyed with the reason;
- the **set name** (the GRF's name and the source of its GRF id; the file name);
- the **format**: *GRF for OpenTTD* or *ZIP of GLB files*;
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

The site reads it once the catalog has loaded and writes it on every change.
On reading, an entry whose model is gone, or whose values the model no longer
takes (or a default value stored as if chosen), is dropped and the panel says how
many; duplicates collapse. An unreadable value or another `version` starts an
empty list. Storage that throws (a private window) only loses persistence.

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

A vehicle design may declare `openttd` (`generator/design.ts`
`OpenttdProperties`) next to `game`; every field is optional:

| Field | Range | What |
|---|---|---|
| `introYear` | year | introduction date (1 January) |
| `vehicleLife`, `modelLife` | 1..255 years | how long one vehicle lasts; how long the model is offered |
| `reliabilityDecay` | 0..255 | |
| `costFactor`, `runningCostFactor` | 0..255 | |
| `capacity` | 0..255 (ships, aircraft 65535) | in units of `cargo` |
| `cargo` | 4-letter label | PASS, MAIL, GOOD, COAL, ... |
| `climates` | list | temperate, arctic, tropical, toyland |
| `railType` | 4-letter label | RAIL, ELRL, MONO, MGLV |
| `refitClasses` | list | passengers, mail, express, armoured, bulk, piece, liquid, refrigerated, hazardous, covered |
| `variants` | list | `{ params, ...fields }`, as `game.variants` |

`checkOpenttdProperties` runs for every design when the catalog is built: only
vehicles may carry the block, figures are integers in range, labels four
printable characters, and each variant names a real non-default selection once.
The block goes into the site's `catalog.json` record (`openttd`) only, not into
the game's `vehicles.meta.json`. The CD 163 declares one (introduced 1984, 40
years, ELRL; its CD 362 livery 1990).

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
lengths did not line up. `SpriteRenderer` draws it with WebGL: the materials swapped for flat
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
| 0 | per vehicle the head's properties (long intro date, lives, speed, power in hp, weight, running cost base and engine class by traction, capacity and cargo by table index, refit classes, the tractive effort coefficient 0.3, length as "shorten by", custom sprites); each hidden articulated part (no climate, its length, the head's rail type) |
| 4 | the name, plain ASCII or UTF-8 marked as such |
| 1 | one sprite set of 8 directions per part |
| 2 | a basic set per part; an articulated vehicle's callback switch (var 0C: callback 16 to the part switch) and part switch (var 10: part n's id, then "no more parts") |
| 3 | the head's graphics (the callback switch, or its set), each part's own set |

A train or road vehicle always gets OpenTTD's tractive effort coefficient, 0.3:
a GRF's new engine otherwise has none, and with realistic acceleration an engine
with no tractive effort barely moves whatever its power.

An aircraft is always refittable to passengers: OpenTTD has no default-cargo
property for aircraft and disables one with no refittable cargo.

**Ids.** The GRF id is "RI" and a 16-bit FNV-1a hash of the set name, so the
same name makes the same GRF. Each part's local id is a hash of its model id,
sorted non-default values and part index into 0x0100..0x3FFF (above OpenTTD's
original vehicles, below the 14 bits an articulated part's id has), placed in
sorted key order with linear probing on a collision (`assignIds`), so adding or
reordering entries keeps the other vehicles' ids and an OpenTTD saved game keeps
its vehicles.

### How it was checked

The property numbers and action layouts were compared with nmlc 0.9's output for
the equivalent NML (`test/openttdGrf.test.ts` pins them). A GRF of real models
built by the same encoder and projection, with a software rasterizer standing in
for WebGL, was loaded in OpenTTD 13.4: it loads without warnings, every engine
appears with the right name, figures and dates, articulated trains and buses are
built from their parts, and the sprites sit on the track at 4x zoom. The WebGL
renderer itself is browser-only and is checked by the user in the browser.
