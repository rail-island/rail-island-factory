# OpenTTD GRF export

Status: agreed
Date: 2026-10-17
Area: catalog site (`src/`: model page, app bar, export panel, browser rendering and GRF encoding), design metadata (`generator/design.ts` `openttd` block, `catalog.json`), docs

## Context of the change

The factory builds every model as a standalone JS module (`export/js/<id>.js`,
`build(THREE, params, lod)`, docs/models/js-format.md) and lists them on the
catalog site (`src/App.tsx`, `src/ModelTable.tsx`, `src/ModelCards.tsx`,
`src/catalogQuery.ts`, docs/site/catalog-site.md). The site already loads a
model's module in the browser and builds it with three.js for the preview
(`src/ModelViewer.tsx`, lazily imported). The listing has a search box and up to
three rows of filter chips (fleet, group, traction); all state is in the URL.

Every vehicle carries game properties (`game`: weight t, power kW, maxspeed
km/h, accel m/s2, per-variant overrides; docs/models/game-properties.md), and the
catalog record (`catalog.json`) inherits them, so the browser already has the
running figures an OpenTTD vehicle needs.

OpenTTD cannot load 3D models. Its add-on format is the NewGRF (`.grf`): 2D
sprites in a dimetric projection, 8 view directions per vehicle, plus properties
set by binary "actions". Sets are normally compiled from NML with the Python
`nmlc`, which cannot run in the browser.

Nothing in the repository writes sprites in OpenTTD's projection, encodes a
GRF, or lets the user select several models in the listing. The listing has no
selection state at all.

## User request

Is it possible to export models from Rail Island Factory into a format OpenTTD
accepts? (Analysis given: yes, by rendering sprites and building a NewGRF.)

Then: I want GRF export from the factory UI. It should run on the frontend. Add
checkboxes to models (with the ability to check all filtered); an Export button
creates a GRF for OpenTTD with the checked models.

Later, replacing the checkboxes: make it differently. Don't add checkboxes; on
the model detail there should be an "Add to export" button, which adds the
current variant to the export. The export can contain more variants of the
same model. (This supersedes the checkbox and check-all-filtered request.)

## Decisions

### Which kinds of models can be checked and exported to the GRF? / What does the Export button produce? / How are parametric models exported?
| Option | What it means |
|---|---|
| Checkboxes in the listing, check all filtered | Selection in the table and cards (the original request) |
| "Add to export" on the model page | The model page adds the variant on screen (its current parameter values) to an export list |
| Default variant only / every variant / current variant | How liveries and other parameters reach the GRF |

**Answer: "Don't add checkboxes, on model detail should be 'Add to export'
button, which will add current variant to export. Export could contain more
variants of the same model."** - The export is a list of (model, parameter
values) entries built one by one from the model page; the same model may appear
several times with different variants. Scope and output format were not
answered in that round and are asked again.

### Which models get the "Add to export" button?
| Option | What it means |
|---|---|
| All vehicles | Trains, trams, road vehicles, ships and aircraft map to OpenTTD vehicle types; buildings and cable cars show no button |
| Rail vehicles only | Locomotives, units, coaches, wagons, metro first |
| Vehicles + buildings | Also buildings as OpenTTD objects: per-tile slicing, ground sprites |

**Answer: All vehicles.**

### What does the Export button produce?
| Option | What it means |
|---|---|
| A ready .grf | The site encodes the binary GRF itself (container v2, 32bpp sprites); one file for OpenTTD's newgrf folder |
| Zip of NML + PNG | The user compiles it with Python `nmlc` |
| Both | The .grf plus an optional source zip |

**Answer: A ready .grf.**

### Where does the export list live between page loads?
| Option | What it means |
|---|---|
| localStorage | One browser key with the list of {model id, params}; survives reloads, private to the browser |
| Memory only | Lost on reload |
| In the URL | Shareable, but long with many variants |

**Answer: localStorage.**

### Where is the export list shown and the Export button placed?
| Option | What it means |
|---|---|
| App bar badge + panel | An "Export (n)" button in the app bar opens a side panel with the entries (thumbnail, title, variant), each removable, the GRF name and Export .grf |
| Own page (`?export`) | A separate view in the URL state |
| Only on model page | A block on the model page, no global indicator |

**Answer: App bar badge + panel.**

### OpenTTD needs properties the factory lacks (intro year, lifetime, cost, running cost, capacity/cargo, reliability, climate, track type). How are they set?
| Option | What it means |
|---|---|
| Defaults, editable per entry | Derived from category, editable in the export panel, stored with the entry |
| Fixed defaults only | Derived by rule, no editing |
| Declared in the factory | Each design gains an `openttd` block next to `game` |

**Answer: Declared in the factory.**

### Which sprite zoom levels and colour depth go into the GRF?
| Option | What it means |
|---|---|
| 32bpp, 4x + 2x + 1x | Rendered at 4x, downscaled for 2x and 1x, each with a company-colour mask |
| 32bpp 4x only | OpenTTD downscales itself |
| 8bpp palette, 1x | Classic look, quantized, little detail |

**Answer: 32bpp, 4x + 2x + 1x.**

### The `openttd` block is declared on designs. Is it required for every vehicle?
| Option | What it means |
|---|---|
| Optional, button only if declared | Undeclared vehicles cannot be exported |
| Required, build fails | Like `game`, every vehicle before the change lands |
| Optional with category fallback | Declared values win; missing fields fall back to category defaults |

**Answer: Optional with category fallback.** Every vehicle is exportable from
the first version.

### How do parts of the model become the player's company colour in OpenTTD?
| Option | What it means |
|---|---|
| No company colours | Sprites keep the factory livery; the mask is empty |
| Materials tagged as livery | Tagged materials follow the player's colours |
| Per entry choice | Fixed livery or company colour per entry |

**Answer: No company colours.**

### How are the GRF's identity and the vehicles' ids inside it fixed, so saved OpenTTD games keep working after a re-export?
| Option | What it means |
|---|---|
| Hashed from content | GRF id from the set name; vehicle id hashed from model id + params; collisions resolved deterministically |
| Sequential | List order; removing an entry renumbers vehicles |
| Fixed id table in factory | Permanent ids in the `openttd` block |

**Answer: Hashed from content.**

### How are the sprites rendered in the browser?
| Option | What it means |
|---|---|
| three.js WebGL offscreen | Build the JS module as the preview does, orthographic camera at OpenTTD's angle, 8 views to an offscreen canvas |
| Port the software rasterizer | Share `generator/renderGlbThumb.ts` with the browser; identical pixels, slower |

**Answer: three.js WebGL offscreen.**

### How long is a vehicle in OpenTTD (lengths are 1/8 tile, max 8/8 per unit)?
| Option | What it means |
|---|---|
| Fixed metres per tile | One tile stands for a fixed vehicle length (about 24 m); longer vehicles become articulated chains of 8/8 parts |
| Always one full unit | Every vehicle 8/8, scaled to fit |
| Declared in openttd block | Length per design with a category fallback |

**Answer: Fixed metres per tile.**

## High-level plan

1. **OpenTTD metadata.** Designs may carry an optional `openttd` block next to
   `game` (introduction year, lifetime, reliability decay, purchase and running
   cost, capacity and cargo, climates, track or road type, refits; per-variant
   overrides like `game.variants`). A category/traction fallback fills every
   missing field, so every vehicle resolves to a complete OpenTTD record. The
   build checks the declared values and carries the block into `catalog.json`.
   Depends on nothing; the rest reads it.
2. **Export list and UI.** The model page of every vehicle (trains, trams, road
   vehicles, ships, aircraft; not buildings or cable cars) gets an "Add to
   export" button that adds the model with its current parameter values; adding
   an identical entry again is a no-op, a different variant of the same model is
   a new entry. The app bar shows "Export (n)" from both the listing and the
   model page; it opens a side panel listing entries (thumbnail, title, variant
   values) with remove, the set name and the Export .grf button. The list lives
   in localStorage.
3. **Sprite rendering.** On export, each entry's JS module is loaded and built
   with its params; an offscreen three.js WebGL renderer with an orthographic
   camera at OpenTTD's dimetric angle renders the 8 view directions at 4x zoom,
   with fixed lighting, at a fixed metres-per-tile scale; 2x and 1x are
   downscaled from it. A vehicle longer than one tile is cut into articulated
   parts of at most 8/8. Rendering runs entry by entry with a progress line and
   can be cancelled.
4. **GRF encoder.** A pure TypeScript module (no DOM, testable in Vitest) writes
   a GRF container v2: the header actions (Action 8 with GRF id and name, Action
   14 info), 32bpp sprites for the three zoom levels, and per vehicle the
   property, sprite-set and graphics actions (Actions 0, 1, 2, 3, 4), including
   articulated parts. Vehicle ids are hashed from model id and params. The
   result is offered as a download `<set-name>.grf`.
5. **Docs and tests.** A new docs file for the OpenTTD export, a row in
   `docs/README.md`, catalog-site.md and game-properties.md updated; tests for
   the encoder (byte layout, deterministic output, id hashing and collisions),
   the fallback rules and the export-list storage round-trip.

## Database and persistent storage

**Browser localStorage, one key** (e.g. `factory.openttdExport`, versioned):

| Field | Type | What |
|---|---|---|
| `version` | number | format version of the stored value |
| `name` | string | the set name the user typed (also the GRF id source) |
| `entries` | array | ordered export list |
| `entries[].id` | string | model id (a shipped model id) |
| `entries[].params` | object string -> string | the variant's non-default parameter values, as the URL's `p.<name>` |

- Written by the site on add, remove and rename; read once on page load.
- An entry whose model id is no longer in the catalog, or whose params no longer
  validate, is dropped on load (with a notice in the panel). Duplicates (same id
  and params) are collapsed.
- Lifetime: until the user removes entries or clears site data. Private to that
  browser; nothing reaches a server.
- No migration: the key is new. A future format change bumps `version`; an
  unknown version is discarded.

**Design metadata:** the optional `openttd` block on `ProceduralDesign`, copied
into the vehicle's `catalog.json` record (site data, no game contract). The
game's `vehicles.meta.json` is not changed.

## Architecture decisions

- **Everything runs in the browser.** The GRF is encoded by the site, not by
  `nmlc` or the Node build, so the export follows exactly the variants the user
  picked without pre-rendering every combination. The encoder is a pure module so
  Vitest covers it without a browser.
- **Direct GRF writing instead of NML.** No Python toolchain; the cost is
  owning a binary encoder for a subset of NewGRF actions.
- **three.js WebGL for sprites,** reusing the preview's lazily loaded module
  and the exact JS build the game uses. Pixels may differ slightly between GPUs;
  determinism of the GRF bytes holds only for identical sprite pixels.
- **Hashed vehicle ids.** Re-exporting a grown or reordered list keeps existing
  vehicles' ids, so OpenTTD saved games keep their vehicles.
- **`openttd` metadata optional with fallback.** Every vehicle is exportable
  from day one; precision improves as designs declare data.
- **Fixed metres per tile.** Relative lengths stay true; long vehicles become
  articulated parts.
- **No company colours.** The mask is empty; liveries are the variants.

## Weaknesses and risks

- **GRF encoding correctness** (high likelihood of early bugs, medium cost): a
  malformed GRF fails to load or crashes silently in OpenTTD. Mitigation: encoder
  tests against known byte layouts and a manual check in OpenTTD before release;
  `grfcodec` decoding of a sample in tests if available.
- **Pixel look** (medium): soft, small renders next to hand-drawn sprites;
  articulated cutting at tile boundaries may show seams. Mitigation: tune
  lighting and downscaling filter on a few reference vehicles.
- **Export time and memory** (medium): 8 views x 3 zooms per part, many
  entries; WebGL context limits on phones. Mitigation: one entry at a time,
  progress and cancel, reuse one renderer.
- **GPU-dependent pixels** (low cost): two exports on different machines can
  differ in bytes; ids and behaviour do not.
- **Hash collisions in vehicle ids** (low): resolved deterministically, but a
  collision resolution can change when entries are removed. Mitigation: a large
  id space and probing that depends only on the colliding entries.
- **Fallback balance** (medium): category defaults for cost, capacity and
  dates may play poorly. Mitigation: declare `openttd` on the most used vehicles.
- **Licensing** (open question): distributing GRFs made from reproductions of
  hand-authored game models and vlakosimdb-derived vehicles; the GRF is a
  personal download, publishing on BaNaNaS is the user's call.
- **Open question:** the exact metres-per-tile value and how a multiple unit
  whose cars are separate models is grouped (each export entry is one OpenTTD
  vehicle; consists are built in the game).

## Out of scope

- Checkboxes in the listing and check-all-filtered (superseded by the model
  page button).
- Buildings, landmarks, stations and cable cars.
- 8bpp sprites and company-colour masks.
- Animated sprites (steam running gear), steered wheels and pose-dependent
  sprites.
- NML source export, Node-side or CI-side GRF builds, publishing to BaNaNaS.
- Sharing the export list by URL or across browsers.
