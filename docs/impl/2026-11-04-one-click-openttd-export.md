# One-click OpenTTD export

Spec: docs/specs/2026-11-04-one-click-openttd-export.md
Date: 2026-11-04
Status: implemented
Area: catalog site (model page stage bar, OpenTTD view, GRF encoder and export run), design metadata (`openttd` block, `catalog.json`), the OpenTTD scene prerender, docs

## What was done

- **OpenTTD facts for every vehicle a GRF can hold.** All 119 such vehicles (every
  vehicle but the 4 cable cars) state their introduction year, capacity, cargo,
  refits, climates and a train's rail type in `generator/openttdTable.ts`, with 42
  estimates marked `// approx.`.
  - The table is keyed by model id and put on the designs by `generator/generate.ts`.
  - The CD 163's block moved there from `generator/vehicles.ts`.
  - The build fails without the facts or presets (`checkOpenttdDesign`); a cable
    car or building may not carry the block.
  - Every figure is listed in docs/models/openttd-figures.md.
- **Balance formula and resolved catalog block** (`generator/openttd.ts`).
  `deriveBalance` derives the purchase and running cost factors, the lives and the
  reliability decay from power, speed, capacity and type, unless a design or
  variant states them. `catalogOpenttd` writes the block resolved into
  `catalog.json`, with a variant entry for each preset, variant and formation car
  whose figures differ.
- **Presets and formations.** Each design lists its presets (default first, never
  `unit: train`). 24 designs have formations: the steam locomotives with tenders,
  every multiple unit, the TGVs, ICE 1, Shinkansen, MTR and two push-pull sets.
  The build measures each formation's cars and checks the 32-part cap.
- **GRF** (`src/openttd/grf.ts`, `src/exportRun.ts`, `src/openttd/properties.ts`):
  - a formation is one articulated engine, cut car by car, a turned car drawn
    rotated, power and costs summed;
  - every articulated vehicle carries its capacity spread over its parts (with each
    part's cargo, refits and a later car's weight);
  - presets and formations are grouped under the default as engine variants
    (property 2F / 26 / 20 / 20).
- **Bug fix found on the way:** exported aircraft had acceleration 0 and never left
  their hangar. They now get 18..50 (property 0D), and a regression test pins it.
- **One-click download.** The model page's stage bar has "Download for OpenTTD" for
  every vehicle a GRF can hold: a GRF of its presets and formations, GRF id from
  the model id, file `<id>.grf`, with progress and Cancel.
- **OpenTTD view.** The same bar's "3D / OpenTTD" switch shows `src/OpenttdPreview.tsx`:
  one vehicle of the one-click pack (every preset and formation, listed by name), drawn with the
  export's own sprite renderer into the prerendered scene of its track kind. It
  draws background, sprites, then foreground, with a 4x zoom checkbox. The
  placement math is in `src/openttd/scene.ts`.
- **Prerendered scenes** (`src/openttd/scenes/{railway,road,harbour,airport}/`): the
  background and foreground PNGs at 1x and 4x, `placement.json` and the two saved
  games, about 770 KB in all, made by `generator/openttdScenes/prerender.ts` with
  OpenTTD 13.4 and OpenGFX 7.1. It uses:
  - a marker GRF of magenta masks with colour-coded anchor pixels;
  - a scene AI (`ai/RIScenes`) that builds each scene and parks the markers;
  - a money game script (`game/RIMoney`);
  - Xvfb screenshots;
  - foreground taken from the mask pixels the scene covers;
  - palette PNGs, lossless and checked.
- **Headless preview** (`generator/openttdScenes/previewSheet.ts`): the OpenTTD view
  drawn with a software rasterizer, for checks and images.
- **Docs:** docs/site/openttd-export.md (one-click download, the `openttd` block,
  balance formula, formations, capacity on parts, OpenTTD view, preview scenes and
  prerender); new docs/models/openttd-figures.md (indexed); game-properties.md,
  export.md, catalog-site.md, docs/README.md and AGENTS.md (a new rule) updated.
- **Checks:**
  - `pnpm typecheck` passes.
  - New tests: test/openttdOneClick.test.ts (18) and 4 more in
    test/openttdGrf.test.ts (acceleration regression, engine variants, capacity on
    parts), all passing.
  - `pnpm test` passes: 7,563 tests in 283 s. That is close to the 5-minute limit;
    the formation measuring adds about 10 s.
  - `pnpm build` passes; `catalog.json` carries 119 resolved OpenTTD blocks.
  - A Shinkansen one-click GRF built headlessly loaded in OpenTTD 13.4: 8 engines
    with their own seats and years. The 8-car formation is one articulated engine
    of 32 parts, 654 seats, 5,920 kW, 200 units long, noses at both ends, and it
    runs.
  - In the prerender, the marker parts' 8-unit spacing matched OpenTTD to within
    a pixel in every scene.

## Follow-up changes

1. Make the OpenTTD view's list hold exactly what the one-click GRF holds, without
   "This variant". The list now names every preset and formation by its OpenTTD
   name (`oneClickItems`, `resolveItem`) and opens on the preset the page's
   parameters select (`oneClickIndex`, test/openttdOneClick.test.ts), else the
   default; a pack of one vehicle shows no list.

2. Keep OpenTTD ids in a committed table and let the user choose a set's GRF id;
   show the ids in the OpenTTD view. `generator/openttdIds.json` (written by
   `pnpm openttd:ids`, append-only, with retired keys and aliases) gives each model
   its GRF id's low 16 bits (0001..7FFF) and each preset and formation a block of
   16 or 32 local ids (0100..2FFF), unique across models; other export-list entries
   are hashed into 3000..3FFF. The Export panel has a GRF id field (8000..FFFF,
   stored as `grfid` with the list, by default the set name's hash). The OpenTTD
   view lists each vehicle's id and shows the GRF id and the drawn vehicle's part
   ids. Tests: test/openttdIds.test.ts, test/exportList.test.ts,
   test/openttdExport.test.ts. All ids changed once with this: GRFs downloaded
   before it do not match the new ones (see Known problems).

3. Size each new id block to the vehicle, for a much larger model database. A new
   preset or formation now reserves twice the parts its built cars measure (at
   least 4, at most 32; `blockSizeFor`) instead of 16 or 32; `pnpm openttd:ids`
   measures only new items, and the 314 existing blocks keep their sizes, so no id
   changed. The catalog's `ids` carry each block's size, the export refuses a
   vehicle that outgrows its block, and the build a formation that does. The
   trains' remaining ids now hold about a thousand more presets instead of about
   480. Tests: test/openttdIds.test.ts.

## How to test

**Automated coverage.** No E2E framework exists in the repository (AGENTS.md asks
for headless checks); `pnpm test` covers the logic (test/openttdOneClick.test.ts,
test/openttdGrf.test.ts, test/openttdExport.test.ts).

**Setup.** `pnpm install`, then `pnpm build && pnpm preview` (or `pnpm dev`). Use
OpenTTD 13 or 14 with any base set.

**Steps.**
1. Open a vehicle's model page, e.g. "CD 163 / 363". The stage shows a bar at its
   top right: "3D", "OpenTTD" and "Download for OpenTTD".
2. Click "OpenTTD". After "Drawing the OpenTTD sprites..." the railway scene
   appears with the locomotive on the three electrified slots: the station's lower
   platform, the line going down-right and the diagonal. The catenary wires and
   platform canopies are drawn over it. The "Vehicle in the GRF" list holds the six
   names the GRF will: "CD 163 / 363", "CD 163 / 363 (CD 162)", ... "(CD 162 blue)",
   and no "This variant".
3. Tick "4x zoom": the scene redraws at OpenTTD's 4x zoom, scrolled to the station.
4. Change the Livery parameter to "CD 362": the list follows to "CD 163 / 363 (CD 362)"
   and the view redraws in that livery. Choose "CD 163 022" (no preset): the view
   shows the default, the list stays on "CD 163 / 363".
5. Open "Shinkansen 0 series", choose OpenTTD, then "Shinkansen 0 series (8 cars)"
   in the list: the whole train stands on each slot, the rear end car turned.
6. Open a steam locomotive (e.g. "CSD 475.1"): it stands on the plain tracks (upper
   platform, the upper line, the left diagonal), not the electrified ones.
7. Open a bus, a tram, a ship and an aircraft: the road scene (road or tram slots),
   the harbour and the airport's terminals.
8. Click "Download for OpenTTD" on the Shinkansen: a progress line, then
   `proc-vehicle-shinkansen-0.grf` downloads.
9. Put it in OpenTTD's `newgrf` folder, enable it and start a game in 2000 or
   later. The train list shows "Shinkansen 0 series" as one row; unfold it to see
   the cars, liveries and "Shinkansen 0 series (8 cars)". The formation's details
   say 654 passengers.
10. Download for OpenTTD on an aircraft (e.g. Boeing 737-800). In OpenTTD it leaves
    the hangar and flies.

11. In the OpenTTD view, the list entries end in their ids ("- 0x0110") and the
    line under the scene reads e.g. "GRF 52490007 - vehicle 0x0100 (parts
    0x0100-0x0101 of 16 reserved)". In the Export panel, choose GRF: the GRF id
    field shows 5249 and four hex digits from 8000 up; type "7000" (refused,
    Export disabled), then "8A3F" (kept after a reload), then "From the set name".

**Also worth trying.** Cancel during a download (no file, no error). A cable car
or building has no stage bar. The Export panel still exports the list as before;
its aircraft now fly too. `pnpm exec tsx generator/openttdScenes/previewSheet.ts
proc-vehicle-tgv-duplex out.png --formation "power cars, 8 trailers" --zoom 4x`
draws the view headlessly.

## What is missing

Nothing - the spec is implemented in full.

## Known problems

- The id table changed every GRF id and vehicle id once: a saved game made with a
  GRF downloaded before it loses its factory vehicles when the new GRF replaces it.

- The facts live in one table, `generator/openttdTable.ts`, put on the designs at
  build time, not in each design's source module, and the figures are listed in
  one doc (docs/models/openttd-figures.md) rather than in each family's doc. Both
  keep the source modules and their JS models unchanged, as the sounds table does.
- 42 of the 119 introduction years or capacities are estimates (marked);
  capacities of metros, trams and city buses include standing room.
- Some game figures make formations odd: the ICE 1's power car states 9,600 kW (the
  whole train's), so its formation has 19,200 kW; the CD 680's car 685 and the MAV
  driving trailer have power in `game`, so they count as powered.
- A TGV formation's 6-car trailer set is one model, cut into equal parts inside the
  set, not at its own car joints.
- The browser's WebGL rendering of the OpenTTD view was not run here (headless
  only). The headless stand-in's lighting is an approximation of three's, so
  colours in the browser may differ slightly.
- The scene slots are straight track only; the curve and station in the railway
  scene are scenery.
- The prerender needs Linux with Xvfb; the scenes were rendered with OpenTTD 13.4,
  and the anchors may differ by a pixel in other versions.

## Recommended follow-ups

- Replace the estimated years and capacities with sourced figures family by family,
  and move each family's figures into its own doc.
- Correct the ICE 1 power car's and the CD 680 / MAV cars' `game` power, so their
  formations' power is right.
- Cut a multi-car model (the TGV trailer set) at its own rig sections in the GRF.
- Show the OpenTTD view's scene choice and zoom in the URL, as the other page state.
- Add a curved-track slot (parts following the curve) to the railway scene.

## Changelog

- The OpenTTD view lists exactly the vehicles the downloaded GRF holds, each by its
  OpenTTD name and id, and shows the GRF's id.
- Each model's GRF and vehicle ids are fixed in a committed table, so a saved game
  keeps its vehicles; a user's set can be given its own GRF id in the Export panel.
- Every vehicle's model page has "Download for OpenTTD": a NewGRF of its liveries,
  cars and fixed formations in one click, grouped as one row in OpenTTD's purchase
  list.
- A new "OpenTTD" view on the model page shows the vehicle as it looks in OpenTTD,
  in a railway, road, harbour or airport scene, at normal or 4x zoom.
- Every exported vehicle has real introduction years, capacities and cargo instead
  of generic defaults, with costs that follow its power, speed and capacity.
- Multiple units and steam locomotives with tenders can be exported as one
  articulated train, cut at the cars.
- Exported aircraft now leave the hangar and fly.
