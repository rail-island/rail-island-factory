---
name: bridge
description: Create or change a bridge type in Rail Island Factory (generator/sets/bridge.ts) - the per-length triangle budget tiers, the shared kit (deck section, piers, abutments, lateral frame), structural spans and the cable types' shared towers, overhead members for the catenary, pins and headless checks. Use whenever a bridge type, the bridge kit or its site preview is added or changed.
---

# Bridges

A bridge type is a function the GAME runs over the path a player draws, so it must
work for any length, any bend and any terrain - not only for the site's preview.
Paths below are relative to the repository root. Read `docs/models/bridges.md`
(the contract) and `docs/models/sets.md` (landed sets, pins) before editing.

## Rules

- `generator/sets/bridge.ts` imports nothing and types every export; it is
  bundled into `export/sets/bridge.js` for the game.
- Never rename a type id; retire one with an alias in the registry
  (`generator/sets/registry.ts`). A new type needs its label translated
  (`translate-text`) and a tier in `test/bridgeBudget.test.ts`.
- Units are studs (1.5 a metre). Lateral offsets go through `pathWorldPoint` /
  `pathRightAt` (mitred frame); ribbon and wall sections are in the game's sweep
  frame (`pushRibbon`, `pushWall` flip the sign - copy them, do not hand-roll).
- Keep sections convex; never put two materials' faces in one plane (the site's
  coplanar check fails, the game flickers).
- Every box whose foot is on the terrain is tagged `ground`, and only those.
- Tag parts: `deck`, `support`, `frame` (the silhouette), `detail` (what a middle
  level may drop).
- A member crossing over the track must clear `clearanceY`; if the catenary may
  hang from it, list it in `overheadMembers` at the same place.

## Triangle budgets

Per length, counted as the site draws it (`bridgeMesh`), on straight 60/160/400
studs, a road deck at 400 and a 160-stud arc with a vertex every 4 studs:

| Tier | Per 100 studs | Ends |
|---|---:|---:|
| plain (beam, box girder) | 2,000 | 1,000 |
| framed (girders, trusses, trestle, arches) | 4,000 | 1,000 |
| signature (cantilever, tied/network arch, suspension, cable-stayed) | 6,000 | 1,500 |

Spend triangles on what reads from the game's camera: silhouette, depth, shadow
lines (cornices, copings, caps), real member rhythm. Every path vertex costs each
ribbon a joint, so keep the ribbon count modest and leave a margin for bends.

## Checks

1. `pnpm typecheck`; `pnpm exec vitest run test/bridgeSet.test.ts test/bridgeBudget.test.ts test/previews.test.ts`.
2. The catalog sweep on the bridge pages (`TEST_ALL_VARIANTS=1 pnpm test`, or a
   scratch test calling `sweep()` on the `proc-preview-bridge-*` ids).
3. `pnpm sets:pins` - read which cases redraw; only the types you meant to change
   may move.
4. Every bug fix gets a regression test in `test/bridgeSet.test.ts` (the kit) or
   `test/previews.test.ts` (the site drawing).
5. Show the user: a contact sheet of the changed types
   (`pnpm exec tsx generator/contactSheet.ts <out.png> 'proc-preview-bridge-*'`,
   with `?length=long&deck=double` for long two-track decks), before/after, and
   close-ups of what changed (a scratch copy of `generator/renderGlbThumb.ts` with
   another `VIEW_DIR`). Write images to the scratchpad, never the repository.
