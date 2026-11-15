# Hero train parade (POC)

Spec: docs/specs/2026-11-15-hero-train-parade.md
Date: 2026-11-15
Status: implemented
Area: rail-island-factory (generator, build, Worker headers, docs); web-railisland-com (hero, consts, docs)

## What was done

**Factory** (`rail-island-factory`, branch `claude/quirky-ramanujan-9zuykc`):

- `generator/trainParade.ts` - the hand-picked list `TRAIN_PARADE` (the ten trains from
  the spec: six OpenTTD formations and four hand-composed trains), and the pure logic:
  `resolveTrains` (expands a formation, checks every car is a confirmed side-view model with
  values it offers, drops default values, fails the build on the first fault), `layOutTrain`
  (cars end to end, couplers touching, offsets in metres) and the image naming.
- `generator/writeTrains.ts` - `pnpm build:trains`, now part of `pnpm build` after
  `build:models`: builds every distinct car in memory, turns a backwards car half round
  about the vertical axis, renders it with the thumbnails' side view into
  `export/trains/*.png` (replaced every run, never committed or cached) and writes
  `export/trains.json` in the spec's format (plus `lengthM` per train). The ten trains are
  45 distinct cars and take about 12 s.
- `renderSide` in `generator/writeTrains.ts` - the thumbnails' side view for triangles already
  moved (turned) or framed on a stretch; it reuses `rasterize` and `sideFrame` and repeats the
  light, because editing `renderGlbThumb.ts` would change every design's build-cache key. A
  test checks it draws a car byte for byte as `renderGlbSideThumb` does.
- `vite.config.ts` - emits `dist/_headers` with `Access-Control-Allow-Origin: *` on
  `/trains.json` for the assets-only Worker.
- Docs: new `docs/site/train-parade.md` (indexed in `docs/README.md`); rows in
  `docs/models/export.md`, `docs/guide/setup-and-build.md`; the header in `docs/guide/deploy.md`.
- Tests: `test/trainParade.test.ts` (15 tests: the real list resolves; every kind of bad entry
  is refused; layout, naming and turning; a three-car render whose trains.json matches the
  images).

**Website** (`web-railisland-com`, branch `claude/quirky-ramanujan-9zuykc`; see also
*Follow-up changes*):

- `src/components/TrainParade.astro`, placed in `Hero.astro` between the play button row
  and the island strip: a full-width strip (56 px tall, 72 px from `sm`) with a thin rail.
  After the page's `load` it fetches `TRAINS_URL`, picks a random train (never the same twice
  in a row), waits for its images to decode, and moves it from beyond the right edge to
  beyond the left at 22 model metres per second, then pauses 2.5 s. Reduced motion shows
  one train standing still; the animation pauses while the tab is hidden; a failed fetch
  or images that never load leave the strip hidden.
- `src/consts.ts` - `TRAINS_URL`, overridable at build with `PUBLIC_TRAINS_URL`.
- `CLAUDE.md` (new "Train parade" section) and `README.md`.

**Checks.** Factory: `pnpm typecheck` clean; `pnpm test` - 187 files, 11,059 passed,
11 skipped, 6 min 42 s wall on this 4-core container (the parade's own file is 20 tests,
about 3 s); `pnpm build:trains` - 10 trains, 44 images, 13.5 s; `build-cache/` untouched.
`vite build` emits `dist/_headers`, and `wrangler dev` on it answers `/trains.json` with
`Access-Control-Allow-Origin: *` and other files without it. A full `pnpm build` was not
completed here: with no cached export it regenerates every model (over 15 minutes in this
container); the deploy restores its export cache.
Website: `astro build` succeeds; `scripts/check-translations.ts` passes; driven headlessly in Chromium against a local server with
the factory's real export: the train runs on desktop (1280 px) and phone (390 px) widths
with no horizontal scroll and no console errors; reduced motion shows a still train; with
the CORS header removed the strip stays hidden.

The spec asked for a new branch per feature; this session may only push its own branch,
`claude/quirky-ramanujan-9zuykc`, in both repositories, so the work is there.

## Follow-up changes

1. **Fix the TGV's doubled bogies.** The TGV Duplex is now listed as its whole-train model
   (`unit: "train"`, 8 cars), which draws one Jacobs bogie per joint; any car over 40 m is
   rendered in equal sections at the parade's scale (`carSections`, `renderSide` with an
   X range), each a `trains.json` entry with `section`, overlapping so no seam shows.
2. **A caption with the fleet's size.** `trains.json` carries `stats: { models, variants }`
   for the confirmed rail vehicles (now 272 and 921): variants are every distinct parameter
   value added up per model (not combinations), without `cars` and preview fixtures. The
   site shows "{models} train models with {variants} variants available" under the track
   (`hero.fleet`), English in all thirteen other locales, marked `untranslated(en.hero.fleet)`.
   This changes the spec's "decoration only" decision at the user's request; the spec
   records it.

## How to test

**Automated coverage.** Factory: `pnpm exec vitest run test/trainParade.test.ts` (also part of
`pnpm test`). Website: none - the site has no test framework; the steps below replace it.

**Setup.**
1. In `rail-island-factory`: `pnpm install`, then `pnpm build:trains` (needs no
   `build:models` first). It writes `export/trains.json` and `export/trains/`.
2. Serve `export/` on port 8788 with `Access-Control-Allow-Origin: *` on `trains.json`
   (any static server that can add the header), or deploy the factory branch and use
   `https://factory.railisland.com/trains.json`.
3. In `web-railisland-com`: `npm install`, then
   `PUBLIC_TRAINS_URL=http://localhost:8788/trains.json npm run build` and `npm run preview`.

**Steps.**
1. Open `http://localhost:4321/`. Below "Plays right in your browser..." a thin rail line
   appears once the page has loaded.
2. Watch it: a whole train (several cars, couplers touching) enters from the right edge,
   runs to the left and leaves; after about 2.5 s another, different train follows.
3. Check a TGV Duplex, ICE 1 or Acela: the last power car faces backwards (nose on the right);
   on the TGV Duplex every joint between two trailers sits on a single bogie.
4. Under the track: "272 train models with 921 variants available" (the numbers from
   `trains.json` `stats`), on `/cs/` and every other locale in English.
5. Narrow the window to a phone width (390 px): the strip shrinks to 56 px, the page does
   not scroll sideways.
6. Open `/cs/` or any other locale: the same parade.

**Also worth trying.**
- Emulate `prefers-reduced-motion: reduce`: one train stands still, centred if it fits.
- Switch to another tab for a while and back: the train continues where it was.
- Serve `trains.json` without the CORS header, or stop the server: the strip stays
  hidden, the hero is otherwise unchanged, no console error but the failed request.
- In the factory, add a car with an unknown livery to `TRAIN_PARADE`: `pnpm build:trains`
  fails naming the train and car.

## What is missing

Nothing - the spec is implemented in full.

## Known problems

- An articulated train on Jacobs bogies has to be listed as its whole-train model; listed as its OpenTTD formation it would show every shared bogie twice.
- The TGV Duplex's whole-train model has at most 8 cars (2 power cars, 6 trailers), so the parade's TGV is shorter than the OpenTTD formation the spec named.
- The fleet counts cover rail vehicles only (the caption says "train models"); road vehicles, buildings and the rest are not counted.
- A train without `stats` (an old file) shows no caption; the caption is hidden with the strip when every image fails.
- The CD 680's car ends show their own end walls and bellows, so the joints look heavier than on the real unit.
- The images are PNG (about 20 KiB per car) with the Worker's `max-age=0, must-revalidate`; a train costs up to about 200 KiB the first time.
- `_headers` was checked with `wrangler dev` locally; confirm on the first deploy with `curl -I https://factory.railisland.com/trains.json`.
- `pnpm test` took 6 min 42 s here, over the 5-minute target; the parade adds about 3 s of it, so the rest is this container's speed or pre-existing.
- The parade shows nothing until the factory branch is deployed (production has no `trains.json` yet).
- `pnpm dev` (the factory's dev server) does not serve the train files; use `pnpm build:trains` and a static server.

## Recommended follow-ups

- Serve WebP with long, immutable caching (hash in the file name) to cut the per-train weight by about 60%.
- Translate `hero.fleet` into the thirteen other locales.
- Grow the list (more countries, freight) once the look is approved, and consider the factory site showing the parade too.
- Consider a small caption or link per train, which the spec left out.

## Changelog

- The landing page shows Rail Island trains passing one at a time along a track in the hero.
- Under the trains, the page says how many train models and variants the game has.
