# World vehicle fleet

Spec: docs/specs/2026-11-05-world-vehicle-fleet.md
Date: 2026-11-05
Status: partially implemented
Area: generator/cabinKit.ts, generator/worldCabins.ts, generator/worldBusKit.ts, generator/worldBuses.ts, generator/openttdTable.ts, generator/openttdIds.json, generator/soundTable.ts, generator/worldFleet.ts, generator/fetchRefs.ts, generator/cableCabins.ts, generator/generate.ts, test/catalogCache.ts, test/worldFleet.test.ts, test/worldCabins.test.ts, test/worldBuses.test.ts, assets/ (35 folders), text/, docs/models/world-cabins.md, docs/models/world-fleet.md, docs/models/world-buses.md, docs/guide/setup-and-build.md, AGENTS.md

## What was done

The user's answers set three things: real sizes, trolleybuses counted among the buses, and
about 250 MB of photos. The wave order was not answered, so the spec's order stands. This
change is **Phase 0 of the harness and the whole first wave, the cable car cabins** (10 of
510 models).

- **The harness**:
  - `generator/worldFleet.ts`: the fleet registry. It holds each design's kit options and the
    covering sample (`coverSample`, `FLEET_SWEEP_SAMPLE`).
  - `test/catalogCache.ts`: the catalog sweep now runs over `SWEPT_IDS`, which leaves out the
    fleet designs outside the sample.
  - `test/worldFleet.test.ts`: the data checks every fleet design gets. Each is in the
    catalog and on the spec's list, with its game properties and its own LOD. Its references
    are committed, every file is listed in `SOURCES.md`, every licence is free, and there is
    a published figures section.
  - `generator/fetchRefs.ts` (`pnpm refs:fetch`): downloads Commons photographs at the
    standard thumbnail widths Wikimedia serves, as JPEGs of about 250 KB. It takes free
    licences only and writes the rows into `SOURCES.md`.
- **The cabin kit**, `generator/cabinKit.ts`: builds a cabin, and its LOD, from one
  `CabinSpec`:
  - the shell, glazing posts, doors, roof equipment and an open top deck;
  - four hanger kinds: grip, funitel, carriage with one or two track ropes, and side hangers;
  - `cabinDatums`, from which the designs' `ropeFrac` and `boardFrac` are taken.

  The existing cabins keep their own code, unchanged. `cableCabins.ts` only exports five of
  its helpers; its output is byte-identical.
- **Ten cabins**, `generator/worldCabins.ts`, at their real size:
  - Doppelmayr Omega IV (six colours), Funitel Cabin, Peak 2 Peak Cabin (standard or glass
    floor), Stanserhorn Cabrio, Titlis Rotair, Vanoise Express;
  - Roosevelt Island Tramway, Sugarloaf Cable Car, Medellin Metrocable and Ngong Ping 360
    Cabin (standard or crystal).

  They have 1,044 to 4,108 triangles (budget 8,000) and LODs of 64 to 100 triangles (budget
  100). Each has its folder under `assets/` with two or three Commons photographs and its
  published figures. Their titles and values are in 14 languages.
- **Docs:**
  - new: `docs/models/world-cabins.md` and `docs/models/world-fleet.md`, both indexed;
  - updated: the setup guide (the `refs:fetch` script and the sampled fleet designs),
    `cable-cabins.md` (See also) and AGENTS.md (a pointer to `refs:fetch`);
  - the list file corrects two entries: the Ngong Ping title, and the Sugarloaf cabins'
    year, now that of the photographed current cabins.

**Checks:**

| check | result |
|---|---|
| `pnpm typecheck` | passes |
| `pnpm test` | 144 files, 7,555 tests pass in 4m52s on this 4-core container |
| master, in a clean worktree on the same machine | 142 files, 7,429 tests in 5m11s, so the change adds no measurable time; see Known problems |
| `pnpm build` | passes, 386 models exported in 5m34s |

The images of all ten cabins and their variants were sent to the user (contact sheets from
`generator/contactSheet.ts`).

## Follow-up changes

1. **Continue with the buses wave.** The first batch of the buses: 25 of the list's 100 on
   a new world bus kit, `generator/worldBusKit.ts`. The kit is a data layer over the city
   bus builder (`cityBus`): a `WorldBusSpec` in metres from the nose; the shapes `lowFloor`,
   `highFloor`, `coach` and `doubleDeck`; generic fronts, rears, roof pods and mirrors; an
   upper deck's glazing; and trolley poles as `liftable` mechanisms raised to the 5.5 m wire.
   - The 25 buses are in `generator/worldBuses.ts`. The batch covers every kit option:
     - city buses with high and low floors, coaches, double-deckers (two- and three-axle);
     - articulated buses, battery buses and three trolleybuses;
     - length and livery parameters.
   - Each has its OpenTTD entry with presets, and its ids in `openttdIds.json`.
   - Each has two Commons photographs (one or three for a few) and its published figures in
     `assets/<name>/`, and its titles in 14 languages.
   - The electric ones state their motor sound.
   - Tests: `test/worldBuses.test.ts` covers size, axles, sections, trolley poles and
     variants. The fleet's data checks now also require the OpenTTD entry and ids of every
     family but the cabins, and check that the GRF's ids stay in the extended byte's word.
   - Docs: `docs/models/world-buses.md`, and the world fleet page's landed table.
   - The Phase 0 checks that moved here are done. OpenTTD's capacity: road ids are at about
     920 and the highest id is 5,860, out of 65,535. The sounds: the bus diesel and both
     electric engine designs already exist.
   - `refs:fetch` now also accepts the Free Art Licence.
   - Checks rerun:

     | check | result |
     |---|---|
     | `pnpm typecheck` | passes |
     | `pnpm test` | 145 files, 7,909 tests pass in 4m09s |
     | `pnpm build` | passes, 411 models exported in 2m46s |

## How to test

**Automated coverage.**
- `pnpm exec vitest run test/worldCabins.test.ts test/worldFleet.test.ts` covers the datums,
  budgets, variants, references and the covering sample.
- `pnpm exec vitest run catalog -t "omega|funitel|peak-2|cabrio|rotair|vanoise|ngong"` covers
  the sampled cabins' catalog sweep.
- No E2E test: the repository has none, and AGENTS.md asks for headless checks only.

**Setup.** `pnpm install`, `pnpm build:models`, `pnpm dev`; open the site locally.

**Steps.**
1. Open the catalog and filter the category **Cable car**: thirteen cabins are listed, ten of
   them new.
2. Open **Doppelmayr Omega IV** and switch **Colour** through Red, Orange, Silver, Blue,
   Green and Black: only the body colour changes.
3. Open **Peak 2 Peak Cabin** and set **Variant** to Glass floor: the cabin turns silver,
   and its underside, seen from below in the 3D preview, is glass.
4. Open **Stanserhorn Cabrio**: the top deck is open, with a railing, and the cabin hangs
   from carriages on both of its sides.
5. Open **Poma Funitel**: two grips ride each of two ropes 3.2 m apart.
6. In each cabin's page, compare the model with its references (the folder named in the page)
   and toggle the low detail: the far model keeps the height, colours and hanger.

7. Filter the category **Road vehicles**, group buses. The 25 new buses are listed by their
   makers' names, among them the New Routemaster, the Enviro500, the Ikarus 280 and the
   Skoda 14Tr.
8. Open **Skoda 14Tr** and press the pantograph **Up/Down** button: the two trolley poles
   fold onto the roof and rise back to the wire.
9. Open **MAN Lion's City** and set **Length** to 18 m: the bus becomes articulated, with a
   bellows joint, and the **Joint** pose slider bends it.
10. Open **Alexander Dennis Enviro400** and switch **Livery** to Stagecoach: the body turns
    white, with the rear swoosh as three bands.
11. Open any bus and press **Open right**: the doors on the +z side slide open onto the cabin.

**Also worth trying.**
- Run `pnpm refs:fetch test-folder --list "Vanoise Express"`. It prints the article's Commons
  files and writes nothing; delete the empty `assets/test-folder` if one is left.
- Fetch a file with a non-free licence, e.g. a CC BY-NC one: the script refuses it and names
  the licence.

## What is missing

- **75 buses of the list.** Many are bonneted, and the convex bus shell cannot draw a bonnet:
  the school buses, the jeepney, the Saurer postbus, the Magirus Saturn, the AEC Routemaster.
  They need a bonnet fitting in front of the shell, with fenders around the steered wheels.
  The rest are straightforward kit data in later batches.
- **Waves 3 to 6: 400 models.** The trucks, trams, aircraft and ships, each with its kit
  (`truckKit`, the dimension-driven tram kit, `airframeKit` and `rotorKit`, `hullKit`), LOD
  adapter, OpenTTD entries and ids, translations, references and docs. None was started.

## Known problems

- **At real size, most new cabins fall outside the cable car stations' clearances.** Checked
  with the station set's own `stationFouls`, at about 1.5 studs per metre, the ratio the
  catalog's views imply:
  - the gondolas (sill drop 4.7 to 7.5 studs) foul the stairs of most types;
  - the Rotair and the Vanoise Express (half widths 4.65 and 3.45) foul the shuttle
    platforms;
  - only Roosevelt Island and Sugarloaf are clear.

  The existing cabins pass because they carry a `scale` of 0.92 to 1.44. This is the "real
  sizes" decision meeting the out-of-scope station work.
- `pnpm test` already runs past five minutes on master on this container (5m11s), and its
  time varies by 40 s from run to run. With the cabins it took 4m52s, and with the 25 buses
  added 4m09s to 4m13s: the buses' own checks cost seconds. The covering sample sweeps 5 of
  the 25 buses in full.
- **Every bus has its doors on the right** (+z, the game's kerb side), including the British
  and Hong Kong double-deckers, whose real doors are on the left.
- The bus shell is convex. The New Routemaster's asymmetric glazing and the Exqui.City's nose
  and faired wheels are approximated.
- The trolley poles use the pantograph Up/Down mechanism (`state` clip, named
  `trolleypole<n>`). The game has no trolleybus wires yet, so it may show them raised with
  nothing above.
- The three length parameters (O 405, Lion's City, Xcelsior) state a 200-triangle LOD budget,
  because the budget is otherwise taken from the default's sections. The solo variants have
  more budget than they use.
- The repository's thumbnail CLI (`pnpm exec tsx generator/renderGlbThumb.ts <id> ...`) hangs
  on the import cycle with `generate.ts` and exits 13 on master too; renders used
  `generator/contactSheet.ts` and a scratch script instead.
- The cabins' dimensions and hanger heights are read off photographs, because no source
  publishes them. Each `SOURCES.md` marks them approx.
- The Rotair's turning floor is drawn, but has no clip: the game has no drive for it.
- Hangers are straight and centred; the real Omega and Peak 2 Peak hangers are curved or
  offset.
- Only `test/catalogCache.ts`'s sweep honours the sample. Other whole-catalog suites (doors,
  interiors, models) still iterate every vehicle, and must honour it too before the larger
  waves.
- Wikimedia rate-limits this container's shared address heavily, so fetching two photos takes
  up to a minute with retries.

## Recommended follow-ups

- Decide how the game's cable car stations take real-size cabins: widen the station types'
  clearance ranges for every catalog cabin's view, or give the large and small cabins a
  `scale`. Then add every catalog cabin's view to `test/cableCarStation.test.ts`.
- Make the remaining whole-catalog suites skip the fleet designs outside the covering sample,
  and win back time in the suite before the larger waves.
- A bonnet fitting for the bus kit, then the remaining 75 buses in batches of 25.
- Decide with the game whether British, Irish, Hong Kong, Japanese and Australian buses
  should open on the left. That would be a `doorSide` field on the spec.
- Break the `renderGlbThumb.ts` and `generate.ts` import cycle, so the documented thumbnail
  CLI works again.

## Changelog

- Ten new cable car cabins from around the world: Doppelmayr Omega IV (six colours), a
  funitel, Peak 2 Peak (with its glass-floor cabin), Stanserhorn Cabrio with its open top
  deck, Titlis Rotair, Vanoise Express, Roosevelt Island Tramway, Sugarloaf Cable Car,
  Medellin Metrocable and Ngong Ping 360 (standard or crystal).
- Each new cabin is at its real size and has its reference photographs.
- 25 buses from around the world: London's New Routemaster and Leyland National, the
  Alexander Dennis Enviro200, 400 and 500 double-deckers, the Mercedes-Benz O 305, O 405 (solo
  or articulated), eCitaro and Tourismo, MAN Lion's City (12 or 18 m), Setra S 515 HD, Neoplan
  Skyliner, Volvo 7900 Electric, Scania Citywide, Van Hool Exqui.City, Ikarus 260 and 280, the
  Skoda 14Tr and 15Tr and Solaris Trollino trolleybuses with poles that rise to the wire,
  Gillig Low Floor, New Flyer Xcelsior (40 or 60 ft), MCI D4505, BYD K9 and Hyundai Universe.
- Every new bus can be exported to OpenTTD.
