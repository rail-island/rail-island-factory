# Twenty trains each from eight countries

Spec: docs/specs/2026-11-05-trains-of-eight-countries.md
Date: 2026-11-05
Status: partially implemented
Area: rail vehicles (`generator/deUnits.ts` ... `generator/cnLocos.ts`, `worldLocoKit.ts`, `steamWorld.ts`, `worldSteamLocos.ts`, `worldCoaches.ts`, `worldWagons.ts`, `seriesHelpers.ts`), the series kit (`shinkansen.ts`), the box locomotive kit (`boxLocoKit.ts`), the car builder (`usTransit.ts`), loading gauges, OpenTTD facts and ids, text, the country table and the site's country chips, tests, docs

## What was done

All 160 designs of the spec exist, twenty per country - Germany, France, the
Netherlands, Switzerland, Spain, the United Kingdom, India and China - each with its
game properties, OpenTTD facts, presets and ids (`generator/openttdIds.json`), its
country, titles in `text/verbatim.json` or translated into the 13 phrasebooks, a family
doc per country (`docs/models/<country>-trains.md`) and its rows in `openttd-figures.md`
and `vehicles.md`.

The spec's kits came out as compact statements on the kits the repository already had,
rather than new geometry per kit:

- **Units** are specs on the series kit (`shinkansen.ts`), which gained `traction`
  (`diesel`, `none`), `cars`, `single`, `endPantograph`, `endCoupler: "buffers"`, `metro`,
  single-axle trucks (`wheelbase: 0`) and a short car's bogie pulled in under its body, plus
  guards against coincident faces; `seriesHelpers.ts` holds the shared bodies the spec named
  as kits - `velaro()` (ICE 3, CRH3C, S-103), `flirt()` and `kiss()` (Stadler), `talgo()`.
- **Locomotives** are `worldLocoSpec` statements (`worldLocoKit.ts`) for the box locomotive
  kit, whose pantograph became optional and which draws diesel exhausts; nose types
  `flat`, `raked`, `streamlined`, `nezCasse`, `hoods` (crocodiles, centre cabs) and
  `bonnets`. The French bodies (`frLocos.ts`) carry the Dutch sisters and the Prima the
  WAG-12B. India's WDM-2, WDP-4D, WDG-4G and China's HXN5 ride the hood unit kit's US specs.
- **Steam** is a parametric generator (`steamWorld.ts`) for the steam kit: 26 engines and
  tenders from their wheel arrangement, wheels, boiler, deflectors and coupler.
- **Coaches** (`worldCoaches.ts`) and **wagons** (`worldWagons.ts`) are measures on the car
  builder (with a new `buffers` coupler) and on the US freight car's parts.
- A **`uk` loading gauge** (W6a, 2.82 x 4.0 m) holds the British stock to its real size.

The user asked mid-work for a country attribute and a country filter in the catalog:
`generator/countryTable.ts` states each model's country (kept off the designs, like the
sound table, so no model's bytes change); the catalog record carries its English name; the
site lists it on the model page, finds it in the search and offers a country chip row
beside the three chip rows (`?country=<slug>`, docs/site/catalog-site.md).

Every existing design's GLB and LOD bytes are unchanged by the kit edits: the 271 series and
car-builder combinations and the box locomotives' 19 were hashed before and after.

Checks: `pnpm typecheck` passes; `pnpm test` passes, 8,302 tests, in 4m44s on this
four-core machine (master: 4m23s). After the user chose "lean checks", the catalog sweep, the
door, rail-support, rig, pantograph and LOD suites check one design per kit-family module in
full and the later ones on what differs (`test/catalogCache.ts` `swept`), while
`test/worldTrains*.test.ts` runs the data checks on all 160 designs.

## Follow-up changes

1. **Missing reference photos and web links.** The lead image of each class's Wikipedia
   article, fetched through batched Commons queries, for the designs without references;
   156 designs got their web links in `generator/linkTable.ts` (the article - en, or nl / de
   Wikipedia - and each photo's Commons page), shown on the model page's Sources tab.

## How to test

**Automated coverage.** No E2E framework in the repository. `pnpm test` covers the designs
(`test/worldTrains*.test.ts`, the sweep) and the country chips (`test/catalogQuery.test.ts`,
`test/countryTable.test.ts`); `TEST_ALL_DESIGNS=1 pnpm test` runs the full sweep on every
design (much longer).

**Setup.** `pnpm install`, `pnpm build:models` (or `pnpm build`), then `pnpm dev` and open the
site.

**Steps.**
1. Open the catalog root. Below the chip rows, a dashed rule and a row "All countries,
   Austria, China, Czechia, France, Germany, ..." appears.
2. Click **Germany**: the list shows only German models; the URL gains `?country=germany`.
3. Click **Trains**, then **Locomotive**: the country pick stays; the list shows German
   locomotives (DB 101, 103, 111, 120, 212, 218, ...).
4. Click **Germany** again: the pick clears and every country's locomotives show.
5. Type `india` in the search: the Indian models are found by their country.
6. Open `proc-vehicle-db-ice3`: its spec list shows **Country: Germany**; switch `unit` to
   *Full train* and `cars` to 8.
7. Open `proc-vehicle-renfe-s102` with *Full train*: short Talgo cars on single axles,
   pantographs on the end cars.
8. Open `proc-vehicle-br-class-37` and compare its width with a German locomotive: the
   British one is narrower (the `uk` gauge).

**Also worth trying.** `/?country=nowhere` lists nothing and keeps a "nowhere" chip to switch
off; a model page reached from a country-filtered list keeps `?country=` for Back; the OpenTTD
view of `proc-vehicle-ns-virm` offers its 6-car formation.

## What is missing

- **References.** Commons throttled every session (HTTP 429): 78 of the 160 designs have their
  photographs and `SOURCES.md` in `assets/<name>/` (the second pass took one photo each: the
  lead image of the class's Wikipedia article); the other 82 name a `references` folder
  that does not exist yet. AGENTS.md wants every model's references committed with it.
- **A4 streamlining.** The LNER A4 is drawn without its casing (the steam kit's volumes
  were not used).
- **Headless thumbnails of every design** were rendered as contact sheets for the user, not
  inspected design by design at the side and front views.

## Known problems

- Power cars of HST, IC225, Eurostar, TGV M, S-102, S-106, S-130 and CR200J are the series
  kit's end cars, with windows.
- `hoods` locomotives (E 94, 218, Ce 6/8 II, Ge 6/6 I, NS 2200) draw their hoods at the cab's width.
- The Talgo cars stand on two single axles each, 3.5 m in from their ends, not on shared ones.
- The E 18 and the Ae 8/14 lose their pony and guiding axles (the game's supports need 2 - 3
  axles together); the box kit draws buffers on Chinese locomotives that have automatic couplers.
- The country chip row is not part of the prerendered category pages' paths (it is a query
  parameter), so search engines see no per-country pages.
- Several designs' liveries are plausible period schemes rather than researched to the paint
  code; the families' docs say which.

## Recommended follow-ups

- Finish the Commons references (rerun the fetcher, review each photo) and draw against them.
- Power cars as their own `unit` (no windows) on the series kit for the HST, IC225, Eurostar
  and the Talgo trains.
- A narrower hood option for the box locomotive kit (two half widths along the body).
- The A4's streamlined casing with the steam kit's `volumes`.
- Country pages for the prerendered site (`/category/<group>/?country=` or `/country/<slug>/`).
- An OpenTTD pack per country in the one-click download.

## Changelog

- Adds 160 trains from Germany, France, the Netherlands, Switzerland, Spain, the United
  Kingdom, India and China, each with its liveries, cars and OpenTTD presets.
- Adds a country to every vehicle and a country filter row to the catalog; the model page
  shows the country and the search finds it.
- British trains keep their real, smaller size.
