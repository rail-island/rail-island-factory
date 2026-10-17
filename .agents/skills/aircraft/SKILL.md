---
name: aircraft
description: Create or change a procedural aircraft (airliner, business jet, historic aeroplane) in generator/aircraft.ts - the triangle budget it must meet (10,000 triangles), the body/decal technique, the airframe/gear parts, airline liveries, axes, and how to check the result headlessly. Use whenever an aircraft model or livery is added or changed in this repository.
---

# Aircraft

How to add or change an aircraft in `generator/aircraft.ts`. The reference for
the code is `docs/models/aircraft.md`; this skill is the checklist.

## Budget

**10,000 triangles** per aircraft, every livery included (hard cap, enforced by
`test/aircraft.test.ts` and `test/referenceModels.test.ts`). There is no
file-size budget. Spend triangles where they read from the game's camera: the
fuselage's nose and tail (dense stations where the profile curves), the
cockpit glazing, the engines, the wing and winglet outlines. A long parallel
cabin needs only two stations. The count is in the `pnpm build:models` output
and in `export/catalog.json` (`triangles`).

## How an aircraft is built

- **Bodies.** A fuselage, nacelle, fairing or wing is a list of equal-length
  convex sections (`oval`, `circle`, `foil`) at stations along an axis, joined
  by `body` (open sweeps) and closed by `fan` (a cone to a tip, or a flat cap).
  Fins and winglets are `fin` lofts through airfoil rings at rising heights.
- **A good nose** is not a cone from a point: give the crown, the sides and
  the keel their own superellipse closing curves (see `b737Nose()`), sample
  the stations densest near the tip, and close with a short `fan` to a tip only
  a few centimetres beyond the last station. Check it from the side, the front
  and three-quarters.
- **Decals.** Windows, doors, windscreens and cheatlines are one-sided `facets`
  laid 1.5 to 5 cm off the skin with `skinY` / `skinAng` / `skinEnd` /
  `skinDecal` / `skinStripe`; use a fine enough grid that a flat decal does not
  sink into a curved skin (the windscreen: about 6 x 4 cells).
- No two materials share a plane (`findCoplanarOverlaps`, the build refuses a
  flickering model): an axle ends inside its wheel's hub, not flush with a tyre.
- Every primitive sits in a named `m.scope` (fuselage / skin, cabin windows,
  wings / right wing / engine, tail / fin ...): the LOD recipe keys on
  `fuselage`, `wings`, `tail` and `engine(s)` scopes.

## Parts: retractable gear

An aircraft whose gear retracts is two `m.part`s with pivot `[0, 0, 0]`:
`airframe` (everything visible in flight) and `gear` (struts, wheels, doors).
The game hides the node named exactly `gear` in flight. Fixed gear: no parts.

## Axes and ids

- Real size in metres, +Y up, wheels on y = 0 (the light jet keeps its
  reference's datum). Keep the axes of the model a design replaces - the game's
  yaw is measured off them. The 737 is drawn nose +X in a `TurnedBuilder`,
  which turns it to the nose -X of the model it replaced (yaw 0).
- Ids are stored in saved maps: never rename one.
- State the game properties on the design: `game: { weight, power, maxspeed,
  accel }` and the airport class `sizeClass` (`small`, `medium`, `big`); the build
  fails without them (docs/models/game-properties.md).

## Liveries

An airliner has a `livery` parameter (`liveryParam`, `finishParams: ["livery"]`)
whose first value, `neutral`, is the default and must keep the design's GLB
unchanged. A `Livery` gives:

- `skin(s, a)` - the fuselage paint by section height (-1 keel .. 1 crown) and
  position; `paintedBody` colours whole triangles, so boundaries follow section
  edges (about 11 degrees apart on a 32-point oval). Thin lines go in `stripes`;
- `fin` bands by height, `finArt` convex shapes in (chord fraction, height)
  laid on both sides of the fin (`unionFlag`, `finDisc`);
- `cowl` and `winglet` materials.

Take the colours from the carrier's published scheme (search the web for the
livery and its colour names). Reproduce colour fields, stripes and a
simplified tail emblem; no titles, lettering or trademarked logos in detail.

## Steps

1. Find references (photos, dimension drawings) and the real dimensions:
   length, span (with winglets), height, fuselage width, gear track and base.
   Store them in git: a user-supplied GLB or photo (`git mv` it out of the
   `assets/_tmp/` inbox) and any downloaded photo go to `assets/<name>/`, each
   listed in `assets/<name>/SOURCES.md` (file, origin or URL, author, licence,
   use); set `references: "<name>"` on the design.
2. Write or change the design in `aircraft.ts`; add a new one to `AIRCRAFT`
   and its id to the `aircraft` family in `generator/lod.ts`.
3. Render views headlessly: a scratch copy of `generator/renderGlbThumb.ts`
   with a different `VIEW_DIR` (and a bounding box to zoom on the nose), every
   livery side by side. Do not use a browser.
4. `pnpm typecheck`, `pnpm test`, `pnpm build`; look at `export/thumbs/<id>.png`.
5. Update `docs/models/aircraft.md` in the same change.
