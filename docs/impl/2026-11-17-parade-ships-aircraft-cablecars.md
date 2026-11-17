# Parade ships, aircraft and cable cars

Spec: docs/specs/2026-11-17-parade-ships-aircraft-cablecars.md
Date: 2026-11-17
Status: implemented
Area: rail-island-factory (parade list, parade.json v2, parade renderer, overview page), web-railisland-com (hero TrainParade)

## What was done

**Factory.** The parade list (`generator/trainParade.ts`) grows from 100 to 118 chains:
4 cable car lines (one per station type: Omega gondola on `open_gantry`, classic cabin on
`alpine_chalet`, Peak 2 Peak on `glass_modern`, Sugarloaf bondinho on `concrete_drive`),
8 ships (harbour tug, Swiss and Elbe paddle steamers, Cutty Sark, SS Great Britain,
feeder container ship, product tanker, ocean liner) and 6 aircraft (Aero A.10, Airbus
H145, Boeing 737 Ryanair, Airbus Beluga, Boeing 747 KLM, Airbus A380 Emirates). New
categories `cableCar`, `ship`, `aircraft` with speeds; new grounds `water`, `air`, `rope`;
`PARADE_VIEWS` gives each ground its own scale and height window. The first round opens
electric loco, steam, electric unit, diesel loco, diesel unit, cable car, ship, aircraft.

parade.json is **version 2**: a per-ground `views` table replaces the global `pxPerM`,
`heightM`, `bottomM`; sprites carry `cycleM` or `cycleS`; emitters gain `wake`; a cable car
chain carries `rope` (rope heights, a station image for each end, a pylon image and its
spacing).

`generator/paradeScenery.ts` (new) turns ships and aircraft into the parade's frame (catalog
yaw, then half round), finds a ship's waterline (`draftFrac`), removes an aircraft's `gear`
node, hangs a cabin from its station type's rope head in the game's own frame
(`cableCarLine.ts`, studs to metres at 1/1.5), and draws the stations and the pylon from the
station set. `generator/writeParade.ts` renders each ground in its view, clears a ship's
hull below the waterline, adds bow and stern wakes and funnel smoke, animates propellers and
rotors on time (`cycleS`), sections long craft by pixels, and caches the line scenery
beside the cars (`.parade-keys.json` version 2). The writer's text is part of every hash,
so the first deploy renders every chain again (about 4 to 5 minutes), later ones only what
changed. The overview page draws every view: sea, sky, ropes,
pylons and stations.

**Website.** `TrainParade.astro` reads version 2 only, scales each chain by its ground's
view, and fades scenery per ground: a sea band with drifting crests and wake foam for ships,
an empty rail for aircraft, ropes, pylons and the two stations (over the cabins, in place of
the portals) for cable cars; the portals fade out for all three. Smoke is sized by the rail
scale, so it looks the same on every ground. CLAUDE.md describes it.

**Checks.** Factory: `pnpm typecheck` clean; `test/trainParade.test.ts` 57 passed (new tests
for grounds, refusals, spacing, views, turning, gear, waterline and wake, time sprites, and a
cable car line's scenery and reuse); full `pnpm test` 192 files, 11,186 passed, 11 skipped,
in 6 min 52 s on this container - over the 5-minute rule, but the parade file itself went from
31.3 s to 35 s, so the rest is the existing suite on this machine; `pnpm build` passed
(3 min 17 s) and left `build-cache/` unchanged;
`pnpm build:parade` rendered all 118 chains (279 images, 260 s from cold). Website:
`npm run build` complete (311 pages); the component's script typechecks under `tsc --strict`.

## How to test

**Automated coverage.** `pnpm exec vitest run test/trainParade.test.ts` in the factory. No E2E
test: the factory forbids driving a browser without agreement, and the website has no E2E
framework.

**Setup.** Factory: `pnpm install`, `pnpm build:models && pnpm build:parade`, then serve
`export/` with a CORS header (for example `npx http-server export --cors -p 8787`). Website:
`PUBLIC_PARADE_URL=http://localhost:8787/parade.json npm run dev`.

**Steps.**
1. Open `http://localhost:8787/parade/` - the overview page lists 118 chains; Sort by
   category shows Cable car (4), Ship (8), Aircraft (6) last.
2. On a cable car row, see the two stations at both ends, the rope, the pylon and the cabins
   hanging from the rope; on a ship row the sea up to the waterline; on an aircraft row no
   ground line, and the A.10's propeller and the H145's rotor turning.
3. Open the website at `http://localhost:4321/?parade=omega-gondola` - the tunnel portals
   fade out, the ropes, pylons and two stations fade in, four red gondolas come out of the
   right station and go into the left one.
4. `?parade=ocean-liner` - the rail fades, a sea band rises to the waterline with drifting
   crests, the liner sails across with foam at its bow and stern and haze from its funnels.
5. `?parade=airbus-h145` - the helicopter flies above the near hills, its rotor turning
   while it moves; the rail stays empty.
6. Without `?parade`, reload: the first eight chains are electric loco, steam, electric
   unit, diesel loco, diesel unit, cable car, ship, aircraft, in that order.

**Also worth trying.** A phone-width window (360 px): the stations take nearly half the
strip; `prefers-reduced-motion`: one chain stands still with its scenery; an old version 1
file: the track stays empty and the caption hidden, nothing moves.

## What is missing

Nothing - the spec is implemented in full.

## Known problems

- The spec's suggestion that cable cars keep the trains' scale does not fit stations of up to 24.5 m in the strip; the rope ground got its own view (8 px/m, 26 m window) under the agreed "scale per kind".
- The Aero A.10 and the H145 are about a tenth of the air window's height: a few pixels tall on a phone.
- The ropes are drawn straight (no sag) and every pylon at the stations' rope height.
- On a phone the two stations cover close to half the strip's width.
- Propeller and rotor sprites loop at 0.24 s / 0.48 s per turn in 12 frames; at 60 fps that strobes rather than blurs.
- The website was verified by build and typecheck only, not in a browser (the factory's rule: headless only).

## Recommended follow-ups

- Look at the hero in a browser on a phone and a desktop and tune the air window and the station widths if they crowd the strip.
- Give the ropes a slight sag between pylons (one SVG path per span), as the overhead line does.
- Consider a second, larger air view for small aircraft so the light plane and helicopter read better.

## Changelog

- The landing page's parade now also shows ships sailing on the sea, aircraft flying over the hills and cable car lines with their stations and pylons.
- The first parade a visitor sees now includes a cable car, a ship and an aircraft right after the opening trains.
