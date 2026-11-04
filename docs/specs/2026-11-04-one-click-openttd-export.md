# One-click OpenTTD export

Status: agreed
Date: 2026-11-04
Area: catalog site (model page, OpenTTD export in `src/openttd/`), design metadata (`openttd` block on every exportable vehicle, `catalog.json`), a one-off OpenTTD prerender of a preview scene, docs

## Context of the change

The catalog site already exports to OpenTTD (docs/site/openttd-export.md, spec
docs/specs/2026-10-17-openttd-grf-export.md). Each model page has an **Add to export**
button that adds the variant on screen to an export list. The list is kept in
localStorage under `factory.openttdExport`. The app bar's Export panel builds either a
NewGRF or a ZIP of GLBs in the browser (`src/exportList.ts`, `src/ExportPanel.tsx`,
`src/exportRun.ts`, `src/openttd/*`). The sprites are drawn with WebGL in OpenTTD's
dimetric projection, at a fixed scale of 8 m of model per full OpenTTD length (8/8). A
longer vehicle becomes an articulated OpenTTD vehicle of equal parts of at most 8/8.

What it lacks:

- **Exporting one model takes many clicks.** The user picks every variant (livery, car)
  on screen and adds each one to the list. No model says which of its variants are
  worth exporting.
- **The OpenTTD figures are almost empty.** Only 1 of the 123 vehicle designs
  (`proc-vehicle-cd-163`) declares an `openttd` block (introduction year, lives, costs,
  capacity, cargo, climates, rail type, refits). The other 122 get the category
  defaults in `src/openttd/properties.ts`. Every non-steam vehicle appears in 1960, every
  coach carries 60 passengers, and so on. Weight, power and speed already come from
  `game`.
- **Trains of several cars are exported badly.**
  - 22 designs have a `unit` parameter (one car per value).
  - Four of them (Shinkansen 0, TGV Duplex, MTR M-Train, DR VT 18.16) also have a
    `unit: train` value, an articulated whole train with `cars`.
  - The export cuts such a train into equal slices by total length. The cuts ignore
    the car boundaries, and all the power sits on the head.
- **The site cannot show how a model looks in OpenTTD.** The user sees that only after
  downloading the GRF and loading it in the game.

## User request

Analyse the OpenTTD export. Which attributes are specific to OpenTTD? For how many
models are these attributes set? Suggest how to add a dedicated one-click export button
to models - they could select for OpenTTD the most reasonable parameter combinations.
How about articulated trains? Could they be exported to the GRF directly, or every chain
item separately? (Analysis given: one design declares `openttd`; per-car export
suggested.)

Then (brainstorm): I want one-click OpenTTD export. It should export 1 selected model.
It should automatically choose interesting variants (preconfigured for each model).
Also, on the factory UI there should be a preview of how the model looks in OpenTTD.
Render it with OpenTTD and make a script which places sprites into a prerendered image
(OpenTTD is used only for prerendering; don't download OpenTTD for each new model).
Also I want to fill all OpenTTD parameters for all models exportable to OpenTTD.

## Decisions

### How does the one-click OpenTTD export relate to the existing export list ("Add to export" + Export panel with GRF/ZIP)?
| Option | What it means |
|---|---|
| Add alongside (Recommended) | A new "Download for OpenTTD" button on the model page builds a GRF of that one model's preset variants immediately. The export list, its localStorage and the multi-model GRF/ZIP stay as they are. |
| Replace the export list | Remove "Add to export", the panel and its localStorage. The factory exports only one model at a time; the GLB ZIP would need a new home or go away. |
| Feed the export list | One click adds the model's preset variants to the existing list and opens the panel. There is no direct download. |

**Answer: Add alongside.**

### Where are each model's "interesting variants" preconfigured?
| Option | What it means |
|---|---|
| Declared per design (Recommended) | A list of parameter selections in the design's `openttd` block (`openttd.presets`), written by hand for every exportable model and checked at build time. A test fails if an exportable vehicle has none. |
| Rule + optional override | A generic rule picks the variants (every livery x every car, defaults for the rest, capped). A design may override it with a declared list. |
| Rule only | No per-model data; the rule alone decides. |

**Answer: Declared per design.**

### How are trains made of several cars (the unit parameter; Shinkansen, TGV Duplex, MTR, DR VT 18.16 'train') exported?
| Option | What it means |
|---|---|
| Each car separately (Recommended) | Every preset `unit` value is its own OpenTTD engine or wagon, cut into parts at car length. The player couples them in the depot. `unit: train` is never exported. |
| Cars + fixed formation | As above, plus one articulated engine per train design built from its cars, cut at the car joints (rig sections), with the rear end car turned. |
| Whole train only | Only the articulated `train` value, cut at the car joints instead of in equal slices. |

**Answer: Cars + fixed formation.**

### Where are the model's sprites drawn and composited into the prerendered OpenTTD image?
| Option | What it means |
|---|---|
| In the browser (Recommended) | The model page reuses the export's WebGL sprite renderer for the variant on screen and paints the sprites onto the prerendered background in a canvas. It works for any parameter values and adds nothing to the build or the export folder. |
| At build time, headless | `pnpm build` renders each preset's sprites with a Node rasterizer and writes composited PNGs. Only presets can be previewed, the build gets slower, and the Node and WebGL sprites could differ. |
| Both | A build-time PNG for the cards and listing, and live browser compositing on the model page. |

**Answer: In the browser.**

### What does the prerendered OpenTTD scene show?
| Option | What it means |
|---|---|
| One scene per vehicle type (Recommended) | A railway scene (straight and diagonal track, a curve, a station platform), a road scene (straight, diagonal, a tram line), a harbour with water and an airport. A vehicle is placed in its type's scene in several directions at fixed slots. |
| One shared scene | A single landscape with rail, road, water and an airport; every vehicle is drawn at its own slots in it. |
| Plain track only | Minimal: straight and diagonal track or road on grass; ships and aircraft on a plain tile. |

**Answer: One scene per vehicle type.**

### Which zoom level does the preview show?
| Option | What it means |
|---|---|
| Normal, with 4x toggle (Recommended) | OpenTTD's default 1x zoom, as the player usually sees it, plus a toggle to the 4x (32bpp extra zoom) images. The background is prerendered at both zooms. |
| Normal zoom only | One background, the smallest, closest to what most players see. |
| 4x only | Shows the sprites' detail; a big image. |

**Answer: Normal, with 4x toggle.**

### Which OpenTTD base graphics are the scenes prerendered with? (The images are committed to the repository and served on the public site.)
| Option | What it means |
|---|---|
| OpenGFX (Recommended) | OpenTTD's free GPL-2 base set. It can be redistributed, so the images can be committed and published with a SOURCES.md. It looks a little different from the original TTD art. |
| Original TTD graphics | The look of Transport Tycoon Deluxe, but the art is copyrighted: committing and publishing screenshots of it is a licensing risk. |
| OpenGFX 2 / other free set | Another free base set, if its licence allows redistribution. |

**Answer: OpenGFX.**

### How does the script know where to put each sprite in the prerendered image?
| Option | What it means |
|---|---|
| Marker vehicles (Recommended) | The one-off prerender places vehicles from a small marker GRF at every slot. A second screenshot with the markers is diffed against the first to find each slot's exact pixel anchor, saved in a placement JSON. The committed background is the screenshot without them. |
| Computed from tile coordinates | The scene lists each slot's tile, direction and track piece. Anchors come from the dimetric projection and the screenshot's known viewport origin: no marker pass, but any offset error shows. |
| Hand-placed | Slots are picked by hand on the image and stored in the JSON. |

**Answer: Marker vehicles.**

### Do things in front of a vehicle (station roofs, signals, trees, catenary) cover it in the preview?
| Option | What it means |
|---|---|
| Foreground layer (Recommended) | The prerender also exports, per scene, the objects in front of the slots as a transparent overlay drawn after the vehicle. The catenary over electric track is part of it. |
| Vehicle always on top | Sprites are painted over the background, and slots are chosen where nothing stands in front. Simpler, slightly less true. |

**Answer: Foreground layer.**

### Which OpenTTD fields must every exportable vehicle state (the build fails without them)?
| Option | What it means |
|---|---|
| Facts stated, balance derived (Recommended) | Each design states the real facts: introYear, capacity, cargo, railType, refitClasses, climates, and the presets. costFactor, runningCostFactor, vehicleLife, modelLife and reliabilityDecay are derived by one documented formula from power, weight, speed, capacity and category; a design can override them. |
| Every field stated | All twelve fields written by hand on each of about 120 designs. The most control, and the most data to maintain and keep balanced. |
| Facts optional, defaults stay | Fill the fields now for every design but keep them optional; a missing one still falls back to the category default. |

**Answer: Facts stated, balance derived.**

### Where do the figures (introduction year, capacity) come from?
| Option | What it means |
|---|---|
| Real-world, researched (Recommended) | First service year, and real seats (passengers) or payload (freight, in OpenTTD cargo units), from the design's references and docs. Uncertain values are marked in a comment, and each family's doc lists them. |
| Gameplay-scaled | Years and capacities chosen to fit OpenTTD's balance against its original vehicles, loosely based on reality. |

**Answer: Real-world, researched.**

### How is a fixed formation (the articulated train engine) defined?
| Option | What it means |
|---|---|
| Declared car list (Recommended) | `openttd.formations` on the design: a name and an ordered list of unit values (the rear end car marked turned), e.g. Shinkansen 4-car = endCar, motorCar, motorCar, endCar (turned). Power and weight are the sums of the cars' game figures. |
| From the 'train' value | Use the model's own `unit: train` with its default `cars`, cut at its rig sections; only the 4 designs that have a train value get a formation. |

**Answer: Declared car list.**

### How do a model's preset variants (liveries, cars, formations) appear in OpenTTD's purchase list?
| Option | What it means |
|---|---|
| Grouped variants (Recommended) | One engine per preset, grouped under the model's default with OpenTTD's variant-group property, so the list shows one expandable row per model. Needs OpenTTD 13 or newer; older versions show them flat. |
| Separate engines | Every preset is its own row, named "Title (Livery)" as today. |

**Answer: Grouped variants.**

### Where on the model page does the OpenTTD preview live?
| Option | What it means |
|---|---|
| Viewer tab (Recommended) | A "3D / OpenTTD" switch on the existing viewer. The OpenTTD view shows the variant currently on screen in its scene, with the 1x/4x toggle; the download button sits next to it. |
| Separate section | A block below the viewer, always visible for exportable vehicles. |
| Preview of all presets | The OpenTTD view shows every preset the one-click GRF will contain, side by side in the scene's slots, not only the variant on screen. |

**Answer: Viewer tab.**

### What GRF identity does the one-click download have?
| Option | What it means |
|---|---|
| From the model id (Recommended) | Set name = model title, GRF id hashed from the model id, file `<id>.grf`. Downloading again after the model changes replaces the same GRF in a saved game. |
| Ask for a set name | A small dialog asks for the set name, as the Export panel does. |

**Answer: From the model id.**

## High-level plan

1. **OpenTTD data for every exportable vehicle.**
   - Every vehicle design the GRF can hold (rail, tram, road, ship, aircraft; not cable
     cars or buildings) states the facts: introduction year, capacity, cargo, rail
     type, refit classes, climates.
   - The figures are researched from the design's references (first service year, real
     seats or payload). Uncertain values are marked, and each family doc lists them.
   - Cost, running cost, vehicle and model life and reliability decay come from one
     documented formula over the vehicle's power, weight, speed, capacity and category.
     A design may override any of them.
   - The build fails when an exportable vehicle lacks a stated fact or presets.
   - The category defaults stop being a fallback for stated facts.
2. **Presets and formations.**
   - Each exportable design declares its presets: the parameter selections worth
     exporting, with the default first. Multi-car designs list their car values,
     never `unit: train`.
   - Train designs may declare formations: a name and an ordered list of their own car
     values, the rear end car marked turned.
   - The build checks that every preset and every formation car is a real, offered
     selection.
3. **GRF changes.**
   - A formation becomes one articulated engine. Its parts are cut at the car
     boundaries (each car split into parts of at most 8/8, as one car is today). Its
     power and weight are the sums of its cars' game figures, and the turned car is
     drawn rotated.
   - Presets of one model are grouped under the default engine with OpenTTD's
     variant-group property.
   - The existing multi-model export keeps working and gains these encoder abilities.
   - Depends on 2.
4. **One-click download.** A "Download for OpenTTD" button on the model page of every
   exportable vehicle builds, in the browser, a GRF of that model's presets and
   formations: set name = title, GRF id from the model id, file `<id>.grf`, with the
   same progress and cancel as the Export panel. Depends on 2 and 3.
5. **Prerendered scenes (one-off, outside the build).**
   - A committed script drives OpenTTD with OpenGFX to render one scene per vehicle
     type: railway (straight, diagonal, a curve, a station platform; electrified and
     plain track), road (straight, diagonal, a tram line), harbour, airport.
   - For each scene and each zoom (1x and 4x) it saves three things: the background, a
     foreground overlay of what stands in front of the slots, and a placement JSON. The
     placement JSON gives each slot's pixel anchor, direction and track kind.
   - Anchors are found by a second pass with marker vehicles from a small marker GRF,
     diffed against the clean background.
   - The outputs, the scene savegames, the script and SOURCES.md (OpenGFX, GPL-2) are
     committed. OpenTTD is downloaded only when the script is re-run to change a scene,
     never for a new model.
6. **OpenTTD preview on the model page.**
   - The viewer gets a "3D / OpenTTD" switch. The OpenTTD view renders the on-screen
     variant's sprites with the existing WebGL sprite renderer, in the directions its
     scene's slots need.
   - It paints background, sprites and foreground into a canvas at 1x, or at 4x with
     the toggle. A formation is shown when the on-screen selection is one; otherwise the
     single vehicle.
   - Depends on 5; independent of 1 to 4 except for the variant figures shown.
7. **Docs and tests.**
   - docs/site/openttd-export.md gains the presets, formations, one-click download,
     preview and prerender script; docs/models/game-properties.md gains the required
     fields.
   - New tests: required fields, presets, formation cutting, variant groups and
     placement JSON validity.

## Database and persistent storage

- **Design metadata (TypeScript, committed in `generator/`).** The `openttd` block on
  each exportable vehicle design gains:
  - required `introYear: number`, `capacity: number`, `cargo: string` (4-letter label),
    `railType: string` (trains), `refitClasses: OpenttdCargoClass[]` and
    `climates: OpenttdClimate[]`;
  - optional overrides `costFactor`, `runningCostFactor`, `vehicleLife`, `modelLife`
    and `reliabilityDecay` (else derived);
  - required `presets: ParamValues[]` (non-default selections; `{}` is the default
    variant, listed first);
  - optional `formations: Array<{ name: string; cars: Array<{ params: ParamValues;
    turned?: boolean }> }>`.

  Existing `variants` entries stay as they are. Written by hand; checked by
  `checkOpenttdProperties` at catalog build. Lifetime: the design's.

  Migration: `proc-vehicle-cd-163` keeps its values and gains the missing facts and
  presets. The other exportable designs get a block for the first time.
- **`catalog.json` (generated, not committed).** The record's `openttd` field carries the
  new fields, the derived balance figures resolved, presets and formations. Read by the
  site; rebuilt by every `pnpm build`.
- **Prerendered scenes (committed binary assets).** One folder per scene type
  (railway, road, harbour, airport), each holding:
  - `background-1x.png`, `background-4x.png`;
  - `foreground-1x.png`, `foreground-4x.png` (transparent);
  - `placement.json`: version, image sizes per zoom, and slots. Each slot is
    `{ id, direction 0..7, zoom anchors {1x: [x, y], 4x: [x, y]}, track: rail | electric
    | road | tram | water | air, maxLength }`;
  - the OpenTTD savegame or scenario the scene was rendered from;
  - SOURCES.md naming OpenTTD's version, OpenGFX's version and licence.

  Written only by the prerender script; read by the site (copied into `dist/` by
  the site build). Changed only on purpose.
- **Browser storage.** Nothing new; `factory.openttdExport` is unchanged. The chosen
  "3D / OpenTTD" view and zoom may live in the URL like the other page state.

## Architecture decisions

- **Presets declared per design rather than chosen by a rule.** Which liveries and cars
  matter is a judgement about the real fleet. A rule would export dozens of cosmetic
  combinations. Declaring them costs one list per design, and the build keeps it valid.
- **Facts stated, balance derived.** Real years and capacities are facts a reference
  can confirm. Costs and lives are game balance, and one formula keeps about 120
  vehicles consistent with each other and with OpenTTD's originals. The facts are
  required, so the misleading 1960 default no longer applies to stated facts.
- **Formations as declared car lists, cut at car boundaries.** This reuses the single
  cars' sprites and figures instead of slicing the whole-train model. It works for all
  22 multi-car designs, not only the 4 with a `train` value. The cuts never fall
  mid-car.
- **Compositing in the browser with the export's own sprite renderer.** The preview
  then shows exactly the sprites the GRF will contain, for any parameter values. The
  build stays as fast and as GLB-free as today.
- **OpenTTD run once, outputs committed.** OpenTTD and OpenGFX are needed only to
  change a scene; neither the build, CI nor a new model needs them. Marker vehicles
  give anchors measured in the real game rather than derived from math that could be
  off by a pixel.
- **OpenGFX for the scenes.** It is GPL-2, so the screenshots can be committed and
  served; the original TTD art cannot.
- **GRF id from the model id.** Re-downloading a model updates the same GRF in a saved
  game. The multi-model export keeps its set-name id, so the two never collide in
  intent.

## Weaknesses and risks

- **Researching about 120 vehicles' years and capacities is large.**
  - Likely to take most of the effort.
  - Some figures (freight payload in OpenTTD units, historic seat counts) are
    uncertain.
  - Mitigation: mark uncertain values, list them per family doc, and allow the work in
    batches per family. The required-field check lands with the last batch, or each
    family turns required as it is filled.
- **The balance formula may feel off against OpenTTD's own vehicles.** Overrides per
  design exist; tune the formula against a few originals once.
- **The sprite anchors already differ by OpenTTD version (13/14/15).** Preview anchors
  measured in one version could disagree with the GRF's in-game placement elsewhere.
  Mitigation: render the scenes with the version the encoder was checked against,
  recorded in SOURCES.md.
- **Driving OpenTTD headlessly for screenshots.** It needs a video driver that can
  screenshot, a scripted scene and a marker GRF; this may need a desktop session.
  Acceptable, since it runs rarely; the script documents its requirements.
- **The variant-group property** requires OpenTTD 13+; older versions list the presets
  flat. Acceptable.
- **Articulated length limits.** An 8-car formation of 26 m cars is about 26 parts,
  within the 32-part cap. A longer formation must be refused at build time.
- **The 4x background images are large.** Mitigation: crop scenes tightly and load them
  only when the OpenTTD view opens.
- **Open question:** whether the listing cards ever show the OpenTTD view. Not part of
  this change.

## Out of scope

- Replacing or changing the export list, the Export panel or the GLB ZIP.
- Build-time OpenTTD preview PNGs, and the preview on listing cards.
- Original TTD graphics in the scenes.
- Company colour (recolouring) in the sprites.
- Exporting `unit: train` as a model; formations replace it in the GRF.
- Running OpenTTD in CI or in the build.
- Publishing GRFs to BaNaNaS or anywhere outside the user's download.
