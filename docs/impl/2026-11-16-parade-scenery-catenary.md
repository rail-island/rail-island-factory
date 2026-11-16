# Parade scenery, catenary and a hundred chains

Spec: docs/specs/2026-11-16-parade-scenery-catenary.md
Date: 2026-11-16
Status: implemented
Area: rail-island-factory (parade list, parade.json, overview page); web-railisland-com (`src/components/TrainParade.astro`)

## What was done

**Factory** (`generator/trainParade.ts`, `generator/writeParade.ts`, `generator/paradePage.ts`):

- `TRAIN_PARADE` holds 100 chains: electricUnit 22, electricLoco 16, dieselLoco 12,
  dieselUnit 8, steamLoco 14, tram 8, metro 3, bus 9, horse 4, truck 4. Fifteen of
  the 42 locomotive chains are freight (one of them the mixed `american-440`),
  a little over the spec's quarter.
- New category `truck` (a Road vehicle in group `truck`).
- parade.json stays `version: 1` and gains, per chain, `speedMps` (fixed table
  `PARADE_SPEED_MPS`) and `wireM` (`trainWire`: 5.88 m for an electric railway
  vehicle, 5.5 m for an electric tram, from the first powered car; absent
  otherwise). Per image it gains `emitters` (`carEmitters`): the `smoke` mouths of
  a steam or diesel car, in metres on that image, turned with a turned car and
  placed in the right section of a sectioned one.
- The overview page shows each chain's wire, smoke and speed.
- docs/site/train-parade.md documents the fields, the table and the new list.

**Site** (`TrainParade.astro`, `CLAUDE.md`):

- The track keeps its 56 px / 72 px height and becomes a landscape band: dusk sky
  from the site tokens, two drifting landscape layers (hills, trees, a small town
  and church) as inline SVG symbols repeated ten times, grass under the line, sides
  faded with a mask. From `sm` up a tunnel portal (hill with a stone headwall)
  stands at each end over the train.
- Overhead line: masts every 40 m, messenger wire with sag, droppers (only at >= 10
  px/m, i.e. from `sm`), contact wire at `wireM`, one SVG pattern rebuilt only
  when height or wire changes; drawn behind the train, fades in during the pause
  before a wired chain and out after it.
- Per-chain speed with a 22 m/s fallback; smoke from a pool of 16 elements
  (steam four puffs per driving-wheel cycle, diesel a faint haze every 4 m), none
  under reduced motion.
- An IntersectionObserver plus the visibility API pause the train, sprites, smoke
  and drift (`data-paused`) and hold the next chain's image loads.
- Everything outside the box is absolutely positioned; the track clips only
  horizontally (`overflow-x-clip`), so there is no layout shift.

**Checks**

- Factory: `pnpm typecheck` clean; `pnpm test` 188 files, 11,096 passed (11
  skipped), 6 min 48 s here. `pnpm build:parade` from cold: 252 cars rendered in 228 s, 2.3 MB of
  images; 33 chains smoke, 46 run under a wire.
- Site: `npm run build` completes. Visual check with Playwright against a local
  export (`PUBLIC_PARADE_URL`) at 1280 px and 390 px: LNER A4 (steam puffs), ICE 3
  (catenary, pantographs on the wire), PCC (tram wire), Tatra 815 (road), DF4.

## Follow-up changes

1. **A fixed opening for the parade.** The first round now starts with an
   electric locomotive and train, a steam train, an electric unit, a diesel
   locomotive and train and a diesel unit, in that order, and no horse-drawn chain
   runs before the tenth. The factory owns the rule (`PARADE_OPENING`, written to
   parade.json as `opening`) and `playOrder` takes it as an optional fourth
   argument; the site passes it for its first round only, so later rounds are the
   plain spread. Tested over 2,000 seeded first rounds; checked in a browser (six
   loads, each opened with an electric locomotive chain).

## How to test

**Automated coverage.** `pnpm exec vitest run test/trainParade.test.ts` in the
factory: list size and category mix, road chains, speed per category, `trainWire`
cases (electric loco/unit, tram, horse and cable tram, metro, diesel lead, road),
`carEmitters` (whole, turned, sectioned, non-smoking tractions), the opening of the
first round (order, random pick, horse-drawn not before the tenth), a real LNER A4
chimney, `writeParade` writing speed and wire. No E2E framework exists in the
site repository; the steps below replace it.

**Setup.**
1. In rail-island-factory: `pnpm build:parade` (about 4 minutes from cold).
2. Serve `export/` with `Access-Control-Allow-Origin: *` on port 8787 (any static
   server that adds the header).
3. In web-railisland-com: `PUBLIC_PARADE_URL=http://localhost:8787/parade.json npm run dev`.

**Steps.**
1. Open `http://localhost:4321/?parade=db-ice3` at 1280 px wide. Observe the dusk
   band, the drifting hills, a portal at each end, and the overhead line with
   masts; the train's pantographs touch the contact wire; the train comes out of
   the right portal and goes into the left one.
2. Open `/?parade=lner-a4-express`. No overhead line; white steam puffs rise from
   the chimney in time with the wheels and drift behind the train.
3. Open `/?parade=pcc-streamliner`. The wire hangs lower (5.5 m) and the trolley
   pole reaches it.
4. Open `/?parade=praga-rv` (or any bus). The rail fades into the road.
5. Open `/` and watch several chains: the wire fades in during the pause before an
   electric chain and fades out after it leaves; horses walk slowly, units run fast.
6. Scroll the hero out of view and back, and switch tabs: the train, the smoke and
   the hills stop while hidden and continue from where they were.
7. Resize to 390 px: no portals, both sides fade, no droppers on the wire.

8. Reload `/` a few times and watch the first five chains: electric locomotive
   and train, steam train, electric unit, diesel locomotive and train, diesel
   unit; no horse-drawn chain among the first nine. The factory overview page's
   Shuffle shows the same opening.

**Also worth trying.**
- With the production parade.json (no `PUBLIC_PARADE_URL`) before the factory
  deploys: trains run at 22 m/s with no wire and no smoke, the band still shows.
- `prefers-reduced-motion: reduce`: one train standing still, wire shown if it
  has one, no smoke, no drift.
- A missing parade.json: the band with an empty track, the caption invisible, no
  layout shift (Lighthouse CLS 0).

## What is missing

Nothing - the spec is implemented in full.

## Known problems

- The full factory suite takes 6 min 48 s on this 4-core container (1,482 s of test
  time in 188 files), over the 5-minute rule; the parade file is ~18 s of that and
  the tests added here under 2 s, so the overrun is the machine, not this change.
  Re-measure on CI.
- Drifting landscape against still masts and portals reads as slow haze rather
  than a camera pan (the spec's open question); the far layer moves at ~4 px/s.
- Trams get the same messenger-and-dropper catenary as railways; real tram lines
  mostly hang a single trolley wire.
- A diesel's haze is faint by design and barely visible on phones.
- Any change to `writeParade.ts` renames every image (the writer's text is in the
  hash), so such deploys pay the ~4-minute cold render.

## Recommended follow-ups

- Preload the next chain's images during the current run, so slow phones never
  start a train late.
- Show a chain's name on hover or tap, linking to the model on the factory.
- A simple trolley-wire drawing for trams (span wire, no messenger).
- A day/dusk/night tint following local time.

## Changelog

- The hero's train parade now runs through a landscape: a dusk sky, distant hills
  and a small town, and tunnels at both ends on larger screens.
- Electric trains and trams run under an overhead line that fades in for them.
- Steam engines puff smoke in time with their wheels; diesels leave a light haze.
- The parade has a hundred chains instead of thirty, now including trucks and more
  freight trains, and each kind runs at its own speed.
- The parade pauses while it is scrolled out of view.
- The parade always opens with an electric locomotive and its train, then a steam
  train, an electric unit, a diesel locomotive and its train and a diesel unit;
  horse-drawn vehicles come later.
