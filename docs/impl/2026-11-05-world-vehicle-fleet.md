# World vehicle fleet

Spec: docs/specs/2026-11-05-world-vehicle-fleet.md
Date: 2026-11-05
Status: partially implemented
Area: generator/cabinKit.ts, generator/worldCabins.ts, generator/worldFleet.ts, generator/fetchRefs.ts, generator/cableCabins.ts, generator/generate.ts, test/catalogCache.ts, test/worldFleet.test.ts, test/worldCabins.test.ts, assets/ (ten folders), text/, docs/models/world-cabins.md, docs/models/world-fleet.md, docs/guide/setup-and-build.md, AGENTS.md

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

**Also worth trying.**
- Run `pnpm refs:fetch test-folder --list "Vanoise Express"`. It prints the article's Commons
  files and writes nothing; delete the empty `assets/test-folder` if one is left.
- Fetch a file with a non-free licence, e.g. a CC BY-NC one: the script refuses it and names
  the licence.

## What is missing

- **Waves 2 to 6: 500 models.** The buses, trucks, trams, aircraft and ships, each with its
  kit (the extended `busKit`, `truckKit`, the dimension-driven tram kit, `airframeKit` and
  `rotorKit`, `hullKit`), LOD adapter, OpenTTD entries and ids, translations, references and
  docs. These waves are the bulk of the spec, and each is far larger than one change. None
  was started, so no half-built family is left behind.
- **The OpenTTD capacity check** (Phase 0): cabins have no OpenTTD entries, so it belongs to
  the bus wave, the first family with entries.
- **The sound check** (Phase 0): cabins have no sound slots, so it moves to the bus wave too.

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
- `pnpm test` already runs past five minutes on master on this container (5m11s), and this
  branch's 4m52s is within the noise. The covering sample keeps the fleet's cost small, but
  the suite has no headroom left for the larger waves.
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
  and win back time in the suite before wave 2.
- Wave 2, the buses: extend `busKit` beyond the vlakosimdb shapes, add trolley poles as a
  `liftable` mechanism, and do the OpenTTD and sound capacity checks.
- Break the `renderGlbThumb.ts` and `generate.ts` import cycle, so the documented thumbnail
  CLI works again.

## Changelog

- Ten new cable car cabins from around the world: Doppelmayr Omega IV (six colours), a
  funitel, Peak 2 Peak (with its glass-floor cabin), Stanserhorn Cabrio with its open top
  deck, Titlis Rotair, Vanoise Express, Roosevelt Island Tramway, Sugarloaf Cable Car,
  Medellin Metrocable and Ngong Ping 360 (standard or crystal).
- Each new cabin is at its real size and has its reference photographs.
