# World fleet

**Covers** - the harness the world vehicle fleet is built with: the fleet registry and the kit options of each design, the covering sample the catalog sweep checks in full, the data checks every fleet design gets, the reference fetch script `pnpm refs:fetch` and the reference rules; which families have landed.
**Code** - `generator/worldFleet.ts`, `generator/fetchRefs.ts`, `test/worldFleet.test.ts`, `test/catalogCache.ts` (`SWEPT_IDS`, `shard`)
**See also** - [../specs/2026-11-05-world-vehicle-fleet.md](../specs/2026-11-05-world-vehicle-fleet.md) (the plan), [../specs/2026-11-05-world-vehicle-fleet-list.md](../specs/2026-11-05-world-vehicle-fleet-list.md) (the candidate list and ids), [world-cabins.md](world-cabins.md), [../guide/setup-and-build.md](../guide/setup-and-build.md)

## What has landed

| family | kit | designs | doc |
|---|---|---|---|
| cable car cabins | `cabinKit.ts` | 10 of 10 | [world-cabins.md](world-cabins.md) |
| buses | `worldBusKit.ts` (on `cityBuses.ts`) | 25 of 100 (first batch) | [world-buses.md](world-buses.md) |
| trucks, trams, aircraft, ships | - | 0 of 100 each | - |

The waves and their order are the spec's. A design's id is the list's; once shipped it is
frozen like every model id.

## The registry

`WORLD_FLEET` (`worldFleet.ts`) holds one `FleetEntry` per fleet design: its catalog id, its
family, the **kit options** it uses and a size by which the family's largest is found. A kit
derives the options from the spec (`cabinFeatures`: the hanger kind, single or double track,
a yoke, the number of glazed decks, a top deck, a round plan, doors on one or both sides, roof
equipment, a glass floor, each parameter; `busFeatures`: the shape, the sections, the axles,
the floor, the lamps, the mirrors, an upper deck, trolley poles, a rear window, a grille, roof
pods, each parameter). A new family adds its entries here, with its own feature function.

## The covering sample

`coverSample(entries)` picks, greedily and in list order, the design that adds the most kit
options not yet covered, until every option of every family is covered, then adds each
family's largest design. The result, `FLEET_SWEEP_SAMPLE`, is fixed for a given list.

`test/catalogCache.ts` sweeps `SWEPT_IDS`: every catalog design except the fleet designs
outside the sample (with `TEST_ALL_VARIANTS=1`, every design). The fleet's other designs are
still checked:

- by **`test/worldFleet.test.ts`**, on every run, without building them;
- by their **family suite** (`test/worldCabins.test.ts` builds all ten cabins,
  `test/worldBuses.test.ts` every bus's sampled variants: they are cheap);
- by the **shared vehicle suites** (doors, interiors, the rig, lamps), which still build every
  vehicle;
- by **`pnpm build`**, which builds every design with its budget, z-fighting and envelope
  checks.

A kit change that adds an option adds a design to the sample by itself;
`test/worldFleet.test.ts` checks that the sample covers every option and each family's largest.

## The data checks

`test/worldFleet.test.ts`, for every fleet design:

- it is in the catalog, once, and its id is on the spec's list;
- it states its game properties (a line or top speed at least) and its own `buildLod`;
- a bus, truck, tram, aircraft or ship has its OpenTTD entry (`openttdTable.ts`);
- each of its `references` folders has a `SOURCES.md` with a title and a `## Published figures`
  section, lists every file in the folder and no missing one, and every photograph's licence is
  free (CC0, public domain, CC BY, CC BY-SA).

It also checks `coverSample` and `refs:fetch`'s helpers. Later families add their OpenTTD
entries to the same file's checks.

## References: `pnpm refs:fetch`

```
pnpm refs:fetch <name> --list "<Wikipedia article>"
pnpm refs:fetch <name> "File:<Commons title>" ... [--use "<what it informs>"]
```

The first lists the Commons files an article shows. The second downloads each file into
`assets/<name>/` and appends a row (file, original, URL, author, licence, use) to the
`## Photographs` table of its `SOURCES.md`, creating the file with its heading if needed:

- it asks Wikimedia (through `en.wikipedia.org`'s API, Commons being its file repository) for
  one of the **standard thumbnail widths** (330, 500, 960, 1280), the widest narrower than the
  original whose long side stays within 1,280 px: other widths and originals are refused or
  rate-limited;
- it re-encodes the photo as a JPEG of about 250 KB or less (`sharp`);
- it refuses a file whose licence is not free (CC0, public domain, CC BY, CC BY-SA, the Free
  Art Licence).

It runs `curl`, so the session's HTTPS proxy applies; Wikimedia rate-limits bursts, so leave a
few seconds between calls. After fetching, add the `## Published figures` section by hand:
the line, the published capacity and speed, the dimensions, and which figures are estimates.

The user accepted about 250 MB of references for the whole fleet (two or three photos per
design at this size are 300 to 600 KB).
