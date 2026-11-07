# Helicopter game support (with rotor and propeller animation)

Spec: docs/specs/2026-11-06-helicopter-game-support.md
Date: 2026-11-06
Status: implemented
Area: rail-island-factory (game properties and export, the rotor kit, the propellers, the airframe kit and the original aircraft, the mesh and three builders, the thumbnail rasterizer, the airport set and its previews, skyscrapers, two new draft buildings, the OpenTTD GRF, the sound mapping, the site viewer, text, build-cache); rail-island-music (the `helicopter` design); rail-island-webapp (the helicopter vehicle, airports, renderer, sound, UI, storage). Every repository's work is on its branch `claude/gallant-franklin-cw8nwy`.

## What was done

All work is on `claude/gallant-franklin-cw8nwy` in each repository, and it is pushed. The
session's branch was used instead of a new `claude/<slug>-<hex>` branch: the session must
push to that branch only.

**Factory (rail-island-factory)**

1. *Helicopter properties.*
   - `GameProperties` gains `aircraftKind: "helicopter"` and `flight: { climb, cruiseHeight, pad }`. The checks are in `generator/design.ts`.
   - `HELIPAD_D` gives each pad class its largest D-value: small 16 m, large 26 m.
   - A helicopter states no `sizeClass`, and the build refuses one, including in its variants. The build also refuses `flight` on anything but a helicopter.
   - The four helicopters use `heli()` in `worldAircraft.ts` with published rates of climb. Their sources are added to `assets/*/SOURCES.md`. Transit heights are 150 m and 300 m.
   - A test checks that each helicopter's pad class fits its D-value.
   - The four ids are confirmed in `generator/catalogModels.json`.
2. *Spin and blur discs.*
   - Every rotor and propeller has a see-through blur disc. The disc is a `<part>-disc` node made with `seeThrough`. Its opacity is `alphaMode` BLEND in the GLB and `jsMaterial` options in the JS model.
   - Every rotor and propeller has the state clip `spin`: a new drive `spin`, times 0 to 1, with time 1 the rest pose (full speed).
   - A new animation track path `scale` grows the discs in and out.
   - The helicopters' main blades are their own nodes and droop 3 degrees when stopped.
   - The Aero A.10's propeller is now a part on the `propellers` clip. Before this change it never turned.
   - The distant levels draw the disc too.
   - The site's viewer gains Spin up and Spin down buttons.
   - The software thumbnail rasterizer now blends see-through materials.
3. *Sound.*
   - rail-island-music adds the `aircraft` category and the `helicopter` loop:
     - runtime parameters `spin` and `load`;
     - character parameters `size` and `blades`;
     - matched to two CC0 USC "Gold Tape" recordings, which are kept in `references/`.
   - The factory imports it (`sounds/`). `soundTable.ts` pins each helicopter's rotor size and blade count, and `spin` becomes a runtime engine parameter.
4. *Landing places.*
   - **Airport set:**
     - The `heliport` type has pads and an operations building, and no runway.
     - `TYPE_META` gives each type `runways` and `helipads` (count and class): regional 1 large pad, international 2, heliport 4.
     - `HELIPAD_SIDE` and `helipad(site, type)` draw one pad's boxes.
     - The pins are moved on purpose, the previews show the pads, and the registry lists the new type.
   - **Building helipads:**
     - A building declares `game.helipad: { material, pad, when? }`.
     - The export measures the pad on the model and writes `{ material, pad, when?, centre, size }` (`generator/helipad.ts`).
   - **Glass office tower:** a new `helipad` parameter (`none` or `roof`) draws a 17 m rooftop helideck in place of the mast.
   - **New drafts, not confirmed:**
     - the hospital `proc-building-hospital`, with a 20 m small pad;
     - the offshore platform `proc-building-industry-offshore-platform`, with a 27 m large helideck. It is kept out of cities.
   - All new text is in the 13 phrasebooks.
5. *OpenTTD.* The GRF writes aircraft property 09 as 0 (helicopter, never large) for `aircraftKind: "helicopter"`, and 2 for every other aircraft. The OpenTTD ids are unchanged.
6. *Size guard.* The dead tree's JS was exactly at its GLB's size, so any byte added to the builder tipped it over.
   - The JS material options became palette data (`jsMaterial`).
   - Two build-time and test-time helpers moved to `generator/meshAudit.ts`.

Checks, factory:
- `pnpm typecheck`: passes.
- `pnpm test`: see Known problems for the run time. The run with the merged branch is recorded in the Changelog commit.
- `pnpm build:models`: passes; `build-cache/` refreshed and committed.

**Game (rail-island-webapp)**
- **Helicopter vehicle:**
  - `HelicopterSim` is deterministic. Its legs are spin-up, lift-off at `flight.climb`, climb to `flight.cruiseHeight`, transit, approach, descent, hover, landing and spin-down.
  - One helicopter per pad, with a hold when the pad is taken.
  - Pads that don't fit the helicopter's class are skipped.
- **Saved data:**
  - a `helicopters` list (`HelicopterData`, `nextHelicopterId`) in `vehicles.json`;
  - persisted `layout.pads` on airports.
- **Airports:**
  - A runway-less heliport layout (`buildHeliportLayout`).
  - Aeroplanes are never routed to a heliport.
- **Building helipads:** a building's helipad is a stop, placed from the building's placement transform.
- **Rendering and sound:**
  - The `spin` drive in `ClipController` scales the time clips by the spin value.
  - Aeroplanes' propellers ease down on the stand and up when taxiing or flying.
  - `SoundDirector` drives the helicopter loop's `spin` and `load`.
- **UI:**
  - `HelicopterBoard` with Control, Pads and Helicopter tabs.
  - A Helicopters section in the Vehicles window.
  - World picks for "Add pad" and "Place on a pad".
- **Docs:** new `docs/gameplay/helicopters.md`, plus updates to the aircraft, sounds, model-animation and storage docs.
- **Checks:** `pnpm typecheck`, `pnpm test` (654 files, 8,876 tests, 6 min 54 s) and `pnpm build` all pass.

**Music (rail-island-music)**: `pnpm typecheck`, `pnpm test` (75 tests, 2.3 s), `pnpm build`
and `pnpm build:music` pass.

## Follow-up changes

1. **Import into the game and merge to master** (asked after the hand-back).
   - The factory branch merged origin/master twice. `pnpm cache:resolve` rebuilt the conflicted `build-cache/`, and the factory's full `pnpm test` passed (171 files, 10,571 tests).
   - In rail-island-webapp, `pnpm import:factory` and `pnpm import:sounds` brought in:
     - the helicopters, the heliport type, the helipads and the spin clips;
     - the `helicopter` sound;
     - the moved airport pins (`pnpm sets:baseline`).
   - The import exposed one gap: the airport type picker had a hard-coded list of types. It now lists the registry's types, so the heliport can be chosen.
   - The game's tests now expect a building's `helipad` and a helicopter's engine sound. The unused `HELICOPTER_SOUND` constant is gone.
   - The game passes `pnpm typecheck`, `pnpm test` (654 files, 8,893 tests) and `pnpm build`.
   - All three repositories are merged into master: music fast-forwarded, the factory after merging master in, the game after merging master in.

## How to test

**Automated coverage.** No E2E test was written: the factory has no E2E framework, and the
game's rules forbid driving a browser without the user's agreement. Coverage:
- factory: `test/worldAircraft.test.ts` (kind, pad class, spin clip, discs, droop),
  `test/aircraft.test.ts` (the A.10 and Small Airplane propellers), `test/export.test.ts`
  (flight figures, helipad measuring), `test/soundMapping.test.ts`, `test/openttdGrf.test.ts`,
  `test/openttdExport.test.ts`, `test/hospital.test.ts`, `test/industry.test.ts`,
  `test/setPins.test.ts`;
- game: `test/helicopters.test.ts`, `test/airportPads.test.ts`, `test/clipController.test.ts`
  and the storage round trips;
- music: `test/sounds.test.ts` ("the helicopter").

**Setup.** The factory and music exports are imported into the game, and all three
repositories are on master (Follow-up changes 1). In rail-island-webapp: `pnpm build:assets`,
then `pnpm dev`.

**Steps.**
1. Factory site, Vehicles > Aircraft > Sikorsky S-92: press **Spin down**. The blur discs fade, the main blades droop, and the rotors slow to a stop. Press **Spin up** and the disc returns at full speed.
2. Factory site, Aero A.10: press Play. The propeller turns, and Spin down and Spin up work.
3. Factory site, Structures > Airport > Heliport: four pads with "H" markings and a small building.
4. Factory site, Glass Office Tower: set Helipad to **Roof pad**. A helideck replaces the mast.
5. Game: build an airport of type **Heliport**. It has no runway and four pads.
6. Game: open the Vehicles window > Helicopters > **New helicopter**. Choose the H145, add a pad of the heliport and a pad on a regional airport as stops, and start it. It spins up, lifts off vertically, flies at cruise height, hovers, lands and spins down. The rotor sound follows its speed.
7. Try to add the heliport as a stop of an aeroplane. A toast refuses it.

**Also worth trying.**
- Two helicopters to one pad: the second holds and hovers until the pad frees up.
- A large helicopter (S-92 or Mi-8) cannot use a small pad such as the hospital's: it is not offered, and placing it there is refused.
- Save and reload a map with a helicopter in flight: it resumes toward the next stop.
- A glass office with `helipad: none` offers no pad.

## What is missing

- The helicopters' transit height is above the higher of the two pads, not above the terrain in between (the game's sim worker has no terrain).
- The game does not yet include helicopters in cinematic scenarios, lines, vehicle cameras, the MCP debug dump or simulation recording. The spec's game plan does not name these, and the board works without them.

## Known problems

- Run time:
  - On a quiet machine the factory's full `pnpm test` takes 5 min 44 s. Master alone took 5 min 20 s on the same machine, so the suite was over the 5-minute limit before this change; this change adds 24 s (41 tests, including the four newly confirmed helicopters in the catalog sweep).
  - The game's full suite runs about 5.5 minutes; the game states no limit.
- Aircraft undo in the game does not apply aircraft definitions, and helicopters inherit that: helicopter edits are captured but cannot be undone.
- A helicopter reloaded mid-flight flies to the nearest stop ahead of it, because the saved record has no target.
- An airport's pads extend its footprint beyond the terminal's +Z end, so `footprint.cz` can sit off zero. The readers that were checked handle it.
- The `renderGlbThumb.ts` command line fails with an unsettled top-level await. This also happens on the base branch, and is not fixed here.
- Every model's build-cache key changed, because the shared mesh code changed. The refresh is committed.
- The helipad's diagonal stripes in the airport set are short box runs: the set's box vocabulary has no rotation about the vertical axis.

## Recommended follow-ups

- Check the helicopters, the heliport and the board in a browser.
- Bring the factory's full test run back under 5 minutes: it was over before this change.
- Give the game a working undo for aircraft and helicopters.
- Fly helicopters over the terrain between pads (a height probe in the sim).
- Add more helicopter types and give the airship the pads.
- Confirm the hospital and offshore platform once you have seen them, and give the game a sea placement for the platform.

## Changelog

- Helicopters fly in the game: they take off and land vertically on pads at airports, at the new heliports and on buildings with helipads.
- The new Heliport airport type has helipads and no runway; regional and international airports have helipads too.
- Rotors and propellers spin up and down, with a blur disc at full speed; the Aero A.10's propeller now turns.
- Helicopters have their own rotor and turbine sound.
- The Glass Office Tower can carry a rooftop helipad; a hospital and an offshore oil platform with helipads are in the workshop.
- In the OpenTTD download, the helicopters are helicopters and use OpenTTD's heliports and oil rigs.
