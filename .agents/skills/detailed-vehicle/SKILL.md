---
name: detailed-vehicle
description: Make a vehicle model that matches the real one - characteristic nose and cab, correct window and door layout on every car, paint boundaries and roof equipment - by measuring at least three photographs and running a fixed render-and-compare check loop before reporting. Use whenever a vehicle model (rail, road, tram, ship, aircraft) is created or reshaped from references, when the user asks to "compare with real photos", "make the shape correct" or "improve the nose", and always when several vehicles are requested at once (then follow its subagent rule: one agent per vehicle). Use together with the vehicle family's own skill (railroad-vehicle, road-vehicle, ship, aircraft).
---

# Detailed vehicle

**Covers** - how to build a vehicle that a user who knows the prototype accepts: references, measuring
photos, the cab-end toolkit, the mandatory check loop, the mistakes it catches, and the rule for several
vehicles (one subagent each, reviewed and merged by the master agent).
**Code** - `.agents/skills/detailed-vehicle/scripts/` (views, distant model, photo sheets, Wikipedia file
lists, byte hashes); the vehicle's own module; for railway units `generator/shinkansen.ts` (series kit),
`generator/seriesCab.ts` and `generator/cabNose.ts` (cab faces), `generator/worldCoaches.ts` (coaches)
**See also** - the family skill ([railroad-vehicle](../railroad-vehicle/SKILL.md),
[road-vehicle](../road-vehicle/SKILL.md), [ship](../ship/SKILL.md), [aircraft](../aircraft/SKILL.md)),
[docs/models/switzerland-trains.md](../../../docs/models/switzerland-trains.md) (eleven models built this way),
[docs/models/shinkansen.md](../../../docs/models/shinkansen.md), [docs/models/czech-dmus.md](../../../docs/models/czech-dmus.md) (the cab nose surface)

The family skill says what a model must satisfy (budgets, gauge, rig, pantographs, LOD, translations).
This skill says how to make it *look like the real vehicle*, and how to prove that before the user looks.
A model that "has a nose" is not done: the user compares it with photos and finds every generic shape.

## 1. References first, one at a time

- At least **three photographs of the modelled class and livery**: one **side-on** view (as close to
  orthographic as possible - it is the one that gives true lengths and the nose's rake), one **front or
  front three-quarter** view, and one more (the other end or side, the roof, a close-up of the cab
  corner). A works drawing with dimensions beats any photo - search for one (SBB Historic, museum
  archives on Commons are often CC0).
- Photos of a *sister* class only for what is shared, and say so in `SOURCES.md` (a lengthened or rebuilt
  unit differs: the RAe 2/4 1001 has a second cab window the CLe 2/4 never had).
- Find files with `scripts/article-files.sh "<Wikipedia article>" de` (the German, French or Italian
  article usually shows more photos than the English one; Commons' own API is rate-limited here).
  Download **one file at a time** with `pnpm refs:fetch <assets-name> "File:<title>" --use "<what it informs>"`,
  look at it (Read the image; crop and enlarge details with sharp), then decide whether you need the next.
  On HTTP 429 wait and retry - never fire many downloads at once.
- Fill every row's `use` column in `assets/<name>/SOURCES.md`, take the running number from a
  photographed unit and note it; delete downloads you do not use.

## 2. Measure, do not guess

- Pick a scale in each photo from a known dimension (body height over rail, door leaf width, car length,
  wheel diameter) and write the scale down in px/m. In a perspective photo measure along the side by a
  known pitch (equal windows, joints at known car lengths); a 1-D projective fit over three or more known
  points removes the foreshortening.
- Measure at several heights, not one: for a nose the profile (distance behind the tip at the coupler,
  the chin, the lamps, the windscreen's foot and head, where the roof reaches full height) and the plan
  (face width relative to the body width at each of those heights, how far back the corners reach full
  width). For the side: every window and door start/end along the car, sill and head, the paint edges.
- Look up the published figures (length over couplers or buffers, width, height, bogie centres,
  wheelbase, wheel diameter, car lengths of a unit) and let them override photo estimates.

## 3. Shapes that read as the prototype

- **Never a generic nose.** Prefer a cab face (`cabFace`, `SeriesCabFace`) to the lofted `nose(...)`
  tables: it gives a profile `[y, d]` from the bottom row to the crown, a plan corner radius by height
  (`corner`), elliptic corners swept back along the car (`cornerDepth`, m by height, or `cornerRatio`), a bow
  (`bulge`, a number or a table by height), and paint as exact boundaries: `fields` (polygons in
  [lat, y]), `masks`/`panes` (rounded rects), `decals`, `paint` (whole-nose fields between [y, d] edges),
  `lamps`, `pods` (housings standing off the face), `roofLamp`, `wipers`, `number`, `texts`.
- Livery sweeps over the side (`endSweeps` on the livery, [y, d] edges behind the tip, painted on the
  body and the cab face's sides); a shaped cab side window is a sweep in `cabGlass`.
- A shape the kit cannot express: extend the kit **additively** (an optional field, default behaviour
  unchanged) and prove every other design still builds byte-identical (`scripts/hash.mts --kit` before
  and after, `diff` the two files). Do not change a helper other designs use (`flirt()` also builds the NS
  FLIRT, `chLivery()` kinds are shared): give the model its own constants and keep its livery *key*
  (saved maps store it); never rename model ids or parameter values.
- Keep the triangle budget with headroom: a cab face's grid (`cols`, `rows`, `tolerance`) is the main
  cost - coarsen it until the look changes, not further.

## 4. The check loop (mandatory, at least three rounds)

Each round: render (`scripts/views.mts`, `scripts/lod.mts`), put model and photo **side by side**
(`scripts/sheet.cjs`), and go through the whole list, writing down each discrepancy before fixing any:

1. **Side view at true scale** against the side photo: nose length and rake, where the windscreen's foot
   and head sit along the car, chin and skirt, roof line, body height, bogie positions and wheelbase,
   length over couplers.
2. **Front view** (head-on and three-quarter): the face outline and its width at each height, the
   windscreen's shape (trapezoid? wrapping?), masks, lamp housings' shape and position, emblem, number,
   coupler, buffers, skirt or plough.
3. **Plan from above** (`ZOOM=x0,x1,0.01,1,0.01`): does the nose taper and round as in the photos?
4. **Windows and doors row by row, on every car** (end car, each intermediate type, the power car):
   where each row starts and stops, sills and heads, widths and pitch, door positions, the door's own
   window, the frontmost cab side window's outline, blank panels, service doors, lockers, grilles.
5. **Paint**: every colour boundary - band heights, which colour is between the windows, door colour,
   roof colour, sweeps and how they lean, the face's colour areas.
6. **Roof**: pantograph *type* (single arm or diamond), count, which car and where along it, the raised
   one; roof equipment (resistors, fairings, air conditioning).
7. **Running gear**: bogie type and position (under the cab? Jacobs bogies at the joints?).
8. **Distant model**: the same silhouette and colour fields.
9. **Close-ups** of the face-to-body join, sweeps and fittings: no cracks, no floating parts, no
   z-fighting (`findCoplanarOverlaps` on every unit and livery - `pnpm build:models` rejects any).

Then the family's tests (`pnpm exec tsc --noEmit -p .`, the vehicle's suites, `test/pantographs.test.ts`).
Only report when a full round finds nothing left that you can fix; list what still differs and why.

## 5. Mistakes the user caught (check them explicitly)

These all shipped once and were found by eye - the loop above exists to catch them first:

- **A nose drawn upright that is raked** (FV-Dosto: about 45 degrees, the windscreen running 3.3 m back
  to the roof) - only the true-scale side photo shows it.
- **A face as wide as the body**, where the real face is narrower and its corners sweep back (Allegra,
  ICN): check the plan and the head-on width at several heights.
- **A flat or boxy face where the real one bulges** (the RAe TEE's snout, the Giruno's white bumper, the
  FLIRT's rounded bumper), and lamp pods drawn as small lamps on the face where the real ones stand out.
- **Colour areas swapped or oversized**: a big red panel where the photo shows a red band framing the
  windscreen; red where the photo is white; a black field covering too much.
- **Windows and doors laid out by rule, not by photo**: doors over the bogies, the upper deck's window row
  starting after the door instead of running over it, lower-deck windows over the bogies, missing
  service doors and lockers, windows too wide or too few, both sides assumed the same.
- **Door windows full width** where the real door has a narrow window (or two, one per leaf).
- **The wrong upper band colour**: which band holds the upper windows - check against all photos and
  ask the user when they and the photos disagree.
- **The frontmost cab side window** as a plain rectangle where it is raked, rounded or set in a sweep.
- **Pantograph type** (a diamond on the Roter Pfeil and the TEE) and **which car carries it** (the FV-Dosto's
  and the KISS's sit on the end cars, not the middle cars).
- **A buffer beam sticking out** where the buffers come out of the bodywork.
- **Stale comparison sheets**: a sheet that was not re-rendered after the last change. Render fresh before
  you show anything.

## 6. Show the user

Send (SendUserFile, `display: "render"`) for each vehicle: a model-vs-photo sheet of the side, the
front and the three-quarter view, every other car, the train, the distant model, and a before/after.
Caption with the model id and the view; say what still differs and what you would improve next.

## 7. Several vehicles: one subagent per vehicle

When the user asks for more than one vehicle (a list, a fleet, "each model from the screenshot"):

1. **One agent per vehicle**, each in its own git worktree (`isolation: "worktree"`). A worktree may
   start from `master`, not the session's branch: the brief must tell the agent to first run
   `git checkout -B <its branch> <the session's branch>` (or `git reset --hard <branch>`) before working, and
   `pnpm install --frozen-lockfile`. Run about six at a time (Wikipedia rate limits); start the rest when
   earlier ones finish, or accept slower downloads.
2. **A shared brief file** in the scratchpad, read by every agent: the goal (match the photos), the
   references rule (section 1), the scripts, the kit's options and the rule to extend it additively with a
   hash check, "do not touch build-cache, do not run `pnpm build:models` or the full `pnpm test`, do not
   push, commit on your branch", the check loop (section 4) with "at least three rounds", the mistakes
   list (section 5), and the report format (what changed with measurements, sheet paths, checklist
   result, what still differs, branch and commits). Add each vehicle's own facts and every piece of user
   feedback so far to its prompt.
3. **The master reviews every report against the photos itself** before forwarding anything: open the
   sheets, compare, re-render from the agent's branch when a sheet looks unchanged (sheets go stale).
   Send the agent back (SendMessage to it, it keeps its context) with concrete, measured points until it
   matches; relay user feedback to the right agent (check which model the user means - a photo's file
   name, not a guess).
4. Send the user each finished vehicle's sheets as it arrives, marked interim or final.
5. **Merging**: merge the branches one by one into the session's branch. Docs conflicts are usually both
   sides' entries (keep both). Kit conflicts are agents adding the same idea under one name with
   different meanings (`cornerDepth` as metres vs as a ratio, `jacobs` as a flag vs an inset): give them
   distinct names so every design keeps its behaviour. For several hard merges delegate one merge agent
   with the acceptance check: each vehicle hashes (`scripts/hash.mts`) identically to its own branch tip
   and every other kit design identically to the base.
6. **Then once**: `pnpm build:models` (it also rejects z-fighting the agents' sampled tests missed), commit
   `build-cache/`, `pnpm exec tsc --noEmit -p .`, the full `pnpm test`, and compare its duration with the
   base branch on the same machine (the suite must stay under five minutes; heavier models cost time -
   speed the kit up, byte-identically, rather than drop checks). Look at every model once more in one
   overview sheet, then push. Merge to `master` only when the user asks; fetch it first and merge it in
   (`pnpm cache:resolve` for build-cache conflicts).
