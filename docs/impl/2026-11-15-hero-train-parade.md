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
3. **No layout shift.** The strip and its caption line now take their full height in the
   page's markup from the first paint and are only filled after load (trains slide in, the
   caption fades in); a failed load leaves an empty track rather than collapsing it. The
   site's Google Fonts got metric-matched local Arial fallbacks per weight, so the font
   swap no longer reflows the news band and hero. Landing-page CLS with fonts delayed
   1.2 s, 360-1440 px: before 0.004-0.031, after 0.001-0.002.
4. **Incremental WebP, animation, thirty chains, a caption per kind of vehicle.**
   - Every image is lossless WebP whose name carries a hash of the design's build-cache
     key, its values, turned and `writeTrains.ts`; `export/.trains-keys.json` remembers
     what each hash rendered, so an unchanged car is not built again (all thirty chains
     from cold about 80 s, then about 2 s) and `/trains/*` is cached a year, immutable.
   - Cars with distance-driven clips (steam running gear and tenders, spoked wheels,
     horse teams) get a sprite of 12-16 frames of one cycle, holding only the rectangle
     that changes (`changedRect`) over a still image with it cleared; the sprite sheet
     is lossy WebP when that is smaller (the horses). `trains.json` gives each its
     place, frames and metres per cycle; the site picks the frame from the distance
     travelled, so wheels and legs do not slide.
   - `TRAIN_PARADE` holds thirty chains: the first ten, five steam trains (A4, Big Boy,
     4-4-0, C62 with the Blue Train, QJ with C70 wagons), the E5, ICE 3, Pioneer
     Zephyr, two metros, four trams, three buses and three horse-drawn vehicles. A car
     list may hold a formation ("with tender"). Buses and the stagecoach run on the
     road (`ground`): the rail line fades into a road edge while they pass.
   - `trains.json` carries `fleet`: confirmed vehicles of eight kinds (trains 248,
     trams 16, buses 28, trucks 6, horse-drawn 12, ships 15, aircraft 12, cable cars
     14) and all their variants (1,103). The site's caption is "Available in Rail
     Island:", an icon chip per kind and "Variants: 1,103", in all fourteen locales,
     every number in a fixed-width slot so filling it moves nothing.
   - The fallback fonts are now measured in the browser over the hero copy of all
     eleven Latin-script locales (kerning included).

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
   is there from the first paint.
2. Watch it: a whole chain (several cars, couplers touching) enters from the right edge,
   runs to the left and leaves; after about 2.5 s another, different one follows.
3. Check a TGV Duplex, ICE 1 or Acela: the last power car faces backwards (nose on the right);
   on the TGV Duplex every joint between two trailers sits on a single bogie.
4. Wait for a steam train (ČSD 498.1, A4, Big Boy, 4-4-0, C62, QJ): its rods, crossheads and
   valve gear move with the wheels, and the wheels roll without sliding; a horse tram or
   the stagecoach: the horses walk. A bus or the stagecoach: the thin rail fades into a
   slightly wider road edge while it passes.
5. Under the track: "Available in Rail Island:", eight chips (icon and count; hover one for
   its name) and "Variants: 1,103", in the page's language on every locale.
6. Narrow the window to a phone width (390 px): the strip shrinks to 56 px, the chips wrap
   into rows, the page does not scroll sideways.
7. Run `pnpm build:trains` twice in the factory: the second run renders 0 cars and reuses all.

**Also worth trying.**
- Emulate `prefers-reduced-motion: reduce`: one train stands still, centred if it fits.
- Switch to another tab for a while and back: the train continues where it was.
- Serve `trains.json` without the CORS header, or stop the server: the empty track
  stays where it is and the caption line stays blank; nothing on the page moves.
- Record a performance trace (DevTools > Performance, or a `layout-shift`
  PerformanceObserver) while loading the page with slow fonts: CLS stays about 0.001.
- In the factory, add a car with an unknown livery to `TRAIN_PARADE`: `pnpm build:trains`
  fails naming the train and car.

## What is missing

Nothing - the spec is implemented in full.

## Known problems

- An articulated train on Jacobs bogies has to be listed as its whole-train model; listed as its OpenTTD formation it would show every shared bogie twice.
- A car whose clips never come round together (the Budweis coach's wheels against its horses' stride) jumps once per loop in the shorter clip.
- The horse sprites are the heaviest images (30-80 KiB); the parade's teams are of two horses for that reason.
- Spoked wheels at 12 frames a turn can strobe (look still or turn backwards) at the parade's speed; rods and legs read clearly.
- The hero still shifts slightly (0.01-0.05, under Google's 0.1 "good") in a few locale and width combinations - Czech at 1024-1440 px, Korean at 1024-1440 px, Spanish and Polish at 360 px, Chinese at 390 px - where a line of the hero title, body or news band ends within a fraction of a percent of its box and breaks differently once the web font arrives; the parade and the caption are not among the shifted elements.
- The TGV Duplex's whole-train model has at most 8 cars (2 power cars, 6 trailers), so the parade's TGV is shorter than the OpenTTD formation the spec named.
- A train without `stats` (an old file) shows no caption; the caption is hidden with the strip when every image fails.
- The CD 680's car ends show their own end walls and bellows, so the joints look heavier than on the real unit.
- `_headers` was checked with `wrangler dev` locally; confirm on the first deploy with `curl -I https://factory.railisland.com/trains.json`.
- `pnpm test` took 7 min 41 s here (with browser checks running beside it), over the 5-minute target; the parade's file takes about 15 s of it.
- The parade shows nothing until the factory branch is deployed (production has no `trains.json` yet).
- `pnpm dev` (the factory's dev server) does not serve the train files; use `pnpm build:trains` and a static server.

## Recommended follow-ups

- Remove the remaining font-swap shifts for good: `display=optional` (a first visit on a slow connection keeps the metric-matched fallback for that page), or self-hosted fonts preloaded.
- Prefetch the next chain's images during the pause, so a slow connection does not lengthen the gap.
- Drop `stats` from trains.json once the site's new caption is deployed.
- Grow the list (more countries, freight) once the look is approved, and consider the factory site showing the parade too.
- Consider a small caption or link per train, which the spec left out.

## Changelog

- The landing page shows Rail Island trains passing one at a time along a track in the hero.
- The landing page no longer jumps while it loads: the hero keeps its layout as the trains and fonts arrive.
- Under the trains, the page shows how many trains, trams, buses, trucks, horse-drawn vehicles, ships, aircraft and cable cars the game has, and how many variants.
- Steam locomotives, spoked wheels and horse teams move as the trains pass; buses and the stagecoach run on a road.
