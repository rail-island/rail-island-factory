# World vehicle fleet

Spec: docs/specs/2026-11-05-world-vehicle-fleet.md
Date: 2026-11-05
Status: implemented
Area: the world fleet's kits and designs (generator/cabinKit.ts, worldCabins.ts, worldBusKit.ts, worldBuses*.ts, truckKit.ts, truckBodies.ts, worldTruck*.ts, worldTramKit.ts, worldTrams.ts, airframeKit.ts, airframeShapes.ts, rotorKit.ts, airlineSchemes.ts, worldAircraft.ts, worldJets.ts, worldProps.ts, worldRotorcraft.ts, hullKit.ts, worldShips*.ts), generator/worldFleet.ts, generator/fetchRefs.ts, generator/generate.ts, generator/openttdTable.ts, generator/openttdIds.json, generator/soundTable.ts, test/catalogCache.ts and the whole-catalog suites, test/world*.test.ts, test/rig.test.ts, test/doorsSuite.ts, test/soundMapping.test.ts, assets/ (510 folders), text/, docs/models/world-*.md, docs/models/world-fleet.md, docs/guide/setup-and-build.md, AGENTS.md

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

2. **Finish the whole spec.** The remaining 475 models: 75 buses, 100 trucks, 100 trams, 100
   aircraft and 100 ships.
   - **Test-time first.** The whole-catalog suites that build designs now build only the
     fleet's covering sample (`swept()` and `isSwept()` in `test/catalogCache.ts`, the same set
     the catalog sweep uses): doors, interiors, rig, pantographs and lamps, glass, the LOD's
     lamps and clips, and the rail supports. Every fleet design keeps its family suite, the
     data checks and `pnpm build`.
   - **Five families in parallel.** Each family was built by its own agent in its own git
     worktree, from a common brief (rules, required artifacts, shared-file protocol), then
     merged here.
   - **Merging.** At each merge:
     - the phrasebooks and `verbatim.json` were unioned, and the shared code blocks
       (`generate.ts`, `worldFleet.ts`, `soundTable.ts`, the docs index and the landed table)
       kept both sides;
     - `openttdIds.json` was regenerated from the already-merged version. No id that had been
       assigned before changed, and no two ids overlap.
   - **The families** (each family doc lists its designs, kit, deviations and checks):

     | family | kit | modules | doc |
     |---|---|---|---|
     | buses, 75 more | `worldBusKit.ts` with a bonnet, a half cab, a raised deck and a minibus shape; three bodies; the camello as tractor and semi-trailer | `worldBuses2.ts` to `worldBuses4.ts` | `docs/models/world-buses-2.md` |
     | trucks | `truckKit.ts`, `truckBodies.ts` | `worldTrucks.ts`, `worldTruckPresets.ts` | `docs/models/world-trucks.md` |
     | trams | `worldTramKit.ts` | `worldTrams.ts` | `docs/models/world-trams.md` |
     | aircraft | `airframeKit.ts` and `airframeShapes.ts` (copies of `aircraft.ts`'s helpers), `rotorKit.ts`, `airlineSchemes.ts` | `worldJets.ts`, `worldProps.ts`, `worldRotorcraft.ts` | `docs/models/world-aircraft.md` |
     | ships | `hullKit.ts` | `worldShipsCargo.ts`, `worldShipsService.ts`, `worldShipsPassenger.ts`, `worldShipsSmall.ts` | `docs/models/world-ships.md` and its two tables |

     - Buses: 25 kinds of body and cab, including school buses, jeepneys, double-articulated
       buses and trolleybuses.
     - Trucks: about 14 cab types and 25 bodies, from 4x2 to 8x8 with several steered axles,
       and trailer chains including a road train.
     - Trams: rigid, articulated and multi-section cars; double-deckers; open cars;
       pantograph, pole or no collector; a horse tram and a steam tram.
     - Aircraft: 56 jets, 39 propeller aircraft, freighters and flying boats, 4 helicopters
       with spinning rotors, and the Zeppelin NT; about 85 airline liveries.
     - Ships: cargo, service, passenger and sailing ships, at real size up to 458 m.
   - **The list's ids are kept.** No row was replaced. A few titles, years and kit hints were
     corrected in the list or the family doc where the references disagreed.
   - **References.** 510 folders. `assets/` grew from 246 MB to 347 MB in this branch (about
     100 MB for the 510 models), inside the agreed 250 MB.
   - **The container restarted twice.** The trams agent stopped while fetching its last
     references. Its 33 fetched folders were committed, the last 4 fetched, and the figures
     written with its own script; the Foshan hydrogen tram uses a sister type (Huai'an's CRRC
     tram). The buses agent had committed all its work.
   - **Checks on the merged fleet:**

     | check | result |
     |---|---|
     | `pnpm typecheck` | passes |
     | `pnpm test` | 150 files, 10,844 tests pass in 4m33s, on an idle 4-core container |
     | `pnpm build` | passes, 886 models exported in 7m51s |

     The covering sample is 103 of the 510 designs.

3. **Merge to master.** While the fleet was built, `master` gained the eight countries'
   160 trains, a country chip row in the catalog and its own test sampling (the catalog
   sweep and the door suite check the first design of each train kit module, `swept(id)`).
   `master` was merged into the branch first.
   - **Conflicts.** The phrasebooks were unioned and the OpenTTD table kept both sides.
     `openttdIds.json` was taken from `master` and regenerated: every id on `master` is
     unchanged, the fleet's never-shipped ids were reassigned, and none overlap.
   - **Countries.** `master`'s `test/countryTable.test.ts` requires a country for every
     tram. All 510 fleet designs now name one in `generator/countryTable.ts`, from the
     list's origin column. The fleet's generic types and Airbus's multinational types name
     none, and `su` (Soviet Union) and `dd` (East Germany) follow the list's years.
     `docs/site/catalog-site.md` says so.
   - **Test time.** The merged suite took 5m15s, against 4m10s for `master` alone, so the
     fleet is now checked the way `master` checks its train kits:
     - the catalog sweep and the secondary whole-catalog suites build, of the fleet, each
       family module's first design and each family's largest (`checkedBySuites` and
       `FLEET_SUITE_IDS` in `test/catalogCache.ts`), plus the camello, whose hinge the rig
       suite swings, on their defaults;
     - the family suites keep checking every design;
     - the aircraft suite checks a recolour-only combination through its defaults, and the
       livery palettes on the default and the last livery;
     - the LOD suite leaves out the fleet designs the suites do not build.

     `TEST_FLEET_COVER=1 pnpm test` sweeps the whole covering sample (every kit option at
     least once) after a kit change; it passes in 5m05s.

     | check | result |
     |---|---|
     | `pnpm typecheck` | passes |
     | `pnpm test` | 155 files, 10,225 tests pass in 4m41s (master alone: 4m10s) |
     | `TEST_FLEET_COVER=1 pnpm test` | 155 files, 11,344 tests pass in 5m05s |
     | `pnpm build` | passes, 1,046 models exported in 9m21s |

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

Nothing in the spec's models: all 510 are built. Two Phase 0 items are partial:
- **Sounds.** rail-island-music has no aircraft (jet, propeller, rotor) or ship's bell
  design. The aircraft have no engine sound, and the sailing craft use the ship horn as a
  foghorn. These are requests to that repository.
- **OpenTTD helicopters.** The GRF encoder writes every aircraft as a plane, so the
  helicopters and the airship need a full airport in OpenTTD.

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
- **Real sizes the game may not place:** 400 m container ships, the 84 m An-225, mining
  trucks (BelAZ 20.6 x 10.1 x 8.3 m), road trains with three trailers. The game needs size
  classes or limits for them.
- **Chains the game may not follow:** a road train's `trailer2` and `trailer3`, and the
  double-articulated buses. The game's truck import knows `truck` and `trailer`.
- **Doors on the kerb side.** Every bus and single-ended tram opens on the right, also those
  of left-hand-traffic countries.
- **Generic shapes.** Cabs, noses and hulls are generic per kit option, not traced per model
  from its photos: no logos, lettering or truck art. A few distinctive details are missing,
  among them the Concorde's droop nose, the Dreamlifter's swing tail and the Oasis's two
  towers.
- **Single hinges.** Drawbar trailers and road-train dollies have one hinge where the real
  ones have two.
- **No clips yet** for crane booms, ladders, tipper bins and aircraft propellers. The
  helicopter rotors spin on a time clip.
- **Trams ride standard-gauge wheelsets**, whatever their real gauge, which is recorded.
- **Weaker references.** Many folders hold one photograph. Some hold a sister type, a detail
  shot or a drawing where Commons had no free photograph of the type; each `SOURCES.md` row
  says what it informs. Most figures not in a source are marked approx.
- **Aircraft shape code is duplicated.** `aircraft.ts` keeps its own helpers (so the 8 older
  aircraft stay byte-identical), and `airframeShapes.ts` copies them. A shape fix has to be
  made in both files.
- **Test time is close to the limit.** `pnpm test` takes 4m41s on an idle container,
  against 4m10s for `master` alone.
- **Fewer fleet designs through the catalog sweep.** The default run sweeps 14 of the 510.
  The full covering sample runs only with `TEST_FLEET_COVER=1`.
- Wikimedia rate-limits this container's shared address heavily, so fetching two photos takes
  up to a minute with retries.

## Recommended follow-ups

- Decide how the game's cable car stations take real-size cabins: widen the station types'
  clearance ranges for every catalog cabin's view, or give the large and small cabins a
  `scale`. Then add every catalog cabin's view to `test/cableCarStation.test.ts`.
- Replace the weakest references (sister types, detail shots, single photos) with better
  photographs, family by family.
- Teach the game the fleet's chains, size classes, trolley wires and left-side doors.
- Add the missing sounds (aircraft engines and rotors, a ship's bell) in rail-island-music,
  and a helicopter subtype in the GRF encoder.
- Refine the most recognisable shapes per model (747 hump, Concorde droop, Oasis towers,
  famous cabs) and add clips for booms, ladders, tipper bins and propellers.
- Win back test time for the next additions: the collection phase (about 90 s of worker
  time) builds every vehicle's default at import in several suites.
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
- The rest of the fleet:
  - the other 75 buses: school buses, jeepneys, matatus, double-deckers and trolleybuses from
    every continent;
  - 100 trucks and lorries, from kei trucks to road trains and mining trucks;
  - 100 trams, from the horse tram to today's low-floor cars;
  - 100 aircraft, from the Ford Trimotor to the A350, with airline liveries, four helicopters
    and the Zeppelin NT;
  - 100 ships, from the Viking longship to the Triple E.
- Every new vehicle except the cable cabins can be exported to OpenTTD.
