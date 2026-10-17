# Dedicated LODs for every model

Spec: docs/specs/2026-10-17-dedicated-model-lods.md
Date: 2026-10-17
Status: partially implemented
Area: generator (lodKit, cd163, boxLocoKit, mainline electrics), tests, docs/models/lod.md

## What was done

Phase 1 and the first rail batch of the spec's plan; the spec's review gate
(user approves each batch's contact sheets) stops here until the batch is approved.

- **Shared vehicle LOD kit**, `generator/lodKit.ts`: the painted shell
  (`lodShell`: plan rings from a family's own profile tables, vee noses, colour
  bands, cab paint, windows), the one LOD glass material (`LOD_GLASS`), parts
  (`lodBogie`, `lodSideBox`, `lodRoofBox`, `lodRod`, `lodPantograph`),
  `windowBands`, band clipping and merging, and `fitLod` with the shared fitting
  order: optional parts, profile detail, least visible band, windows; optional
  parts come back when room is made.
- **CD 163 / 263 moved onto the kit** (`cd163LodBody`), now with windscreens.
- **Batch 1: the mainline electrics** - CD 180 / 181 / 182, DNT 184.5, DB 111,
  DR 243 / DB 143 / 112, OBB 1012, OBB 1040 - through one adapter, `boxLocoLod`
  in `boxLocoKit.ts`, reading the same `LocoSpec` the full model is built from;
  each design gets a `buildLod` (`cd181Lod`, ...).
- **Test rule relaxed** as the spec decided: a vehicle LOD may use exactly the
  `lodGlass` material; all other detail materials stay banned.
- Every livery of the 8 designs: 84-100 triangles, no coplanar overlaps.
- Docs: `docs/models/lod.md` ("The shared vehicle kit").
- Checks: `pnpm typecheck` clean, `pnpm test` 53 files / 5103 tests passed, `pnpm build` succeeded.

## How to test

**Automated coverage.** No E2E framework exists (headless only, AGENTS.md).
`test/lodKit.test.ts` covers the kit (tables, window bands, shell painting, vee
noses, cab paint, the fitting order, determinism); `test/lod.test.ts` checks every
design's LOD budget, flicker and materials for every parameter combination;
`test/cd163Family.test.ts` checks the CD 163 family's bands, cab paint and
windscreens. Run `pnpm test`.

**Setup.** `pnpm install`, `pnpm build:models`, `pnpm dev`.

**Steps.**
1. Open the catalog, choose Rail vehicles, open "CD 180 / 181 / 182".
2. Tick **Low level of detail** in the model detail panel.
3. Observe: the body in the livery's colour bands, a dark windscreen band on
   each end, bogie blocks down to the rail, the rear pantograph raised; the
   triangle count shown is at most 100.
4. Switch the Livery to each value; the LOD repaints and stays within 100.
5. Repeat for DNT 184.5, DB 111, DR 243 / DB 143 / 112, OBB 1012, OBB 1040,
   CD 163 / 363 and CD 263 / 371 / 372.

**Also worth trying.** A many-band livery (CD 182, CD 363 037, CD 371 002): thin
lines give way first, the windscreen stays. Every other vehicle still shows the
old one-colour hull: its batch is not done yet.

## What is missing

- Phase 1's rig extension (articulated LODs keeping section nodes and joints):
  deferred to the batch with the first articulated vehicles (trams, units,
  articulated buses), where it can be tested on real sections.
- Budgets of 100 per section with a cap of 300: come with the same batch.
- Phases 2-7 except batch 1: the other rail families, road vehicles, aircraft,
  ships, cable cars, ordinary buildings, landmarks / towers / skyscrapers, and
  removing the generic hull. Gated on the user's approval of each batch.

## Known problems

- Session rules required work on the session branch `claude/relaxed-lovelace-uc67bc`,
  not a fresh `claude/<feature>-xxxxxx` branch.
- Thin livery lines (CD 371 002's yellow line, DB 111's grey skirt) give way
  before windows because the spec puts windows last.
- The spec's fitting order does not name profile detail; the kit inserts it
  between optional parts and bands (a profile kink costs as much as a band).
- Small side windows are treated as optional parts, not windows, so a 100-triangle
  loco does not give up all its paint for a 0.4 m2 cab window.
- Paint that is not a horizontal band (OBB 1012's red side swoosh) cannot be shown.
- Buffers and couplers are not drawn: a LOD loco is about 1 m shorter over its body.

## Recommended follow-ups

- Approve or correct batch 1, then continue with the Czech electrics (CD 110 / 130 / 140 / 169, CD 150, CD 230).
- Implement the section rig for LOD together with the trams batch, and tell the webapp to pose LOD models.
- Consider a slanted-band shell primitive for swoosh liveries (1012, Taurus-like units).

## Changelog

- Distant views of the CD 163 / 263 and the mainline electric locomotives show
  their livery, windscreens, bogies and raised pantograph instead of a one-colour block.
