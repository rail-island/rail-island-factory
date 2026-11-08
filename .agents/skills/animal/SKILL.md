---
name: animal
description: Create or change a draft animal (horse, donkey, mule, cow, camel, elephant) in generator/draftAnimals.ts - the animals that pull the animal-drawn trams, railway vehicles and road coaches and stand in the Animals catalog - the triangle budget (5,000 an animal alone or in a pair, a team's animals at most 10,000 together), the jointed legs (a knee or hock and a fetlock on every leg), the face every animal must show (eyes with lids, nostrils or a trunk, the mouth), the gait, the harness and the headless checks. Use whenever a draft animal, its detail levels, its gait or the team drawing is added or changed. Not for the walk mode's blocky character animals (generator/animals.ts, characters).
---

# Draft animal

How to add or change a draft animal in `generator/draftAnimals.ts`. The reference for
the code is `docs/models/draft-animals.md`; this skill is the checklist. The vehicles
the animals pull are `docs/models/animal-drawn-vehicles.md`.

The animal-like **characters** of the walk mode (`generator/animals.ts`,
`generator/characterKit.ts`, docs/models/characters.md) are a different thing: blocky,
in the avatar's height class. Do not change them under this skill.

## Budget

- **5,000 triangles** for one animal, its harness included, drawn alone (its catalog
  design `proc-animal-<species>`) or in a team of one or two (`FULL` detail).
- A bigger team's animals share **10,000** triangles: `animalBudget(count)` gives
  3,333 an animal in a team of three, 2,500 in four, 1,666 in six; `detailFor(count)`
  picks the detail (`LIGHT` for three or four, `LIGHTEST` for six) that keeps within it.
- An animal-drawn vehicle may have its own **10,000** and its team's budget on top:
  `10,000 + count x animalBudget(count)`, at most 20,000.
- The distant model stays at **100** triangles an animal (`teamLod`).

`test/animalDrawn.test.ts` enforces every one of them, at every species and count. Spend
the triangles where they read from the game's camera: the head and face, the legs'
joints, the silhouette of the back and neck. Barrel rings are cheap to cut with `sub`.

## What every animal has

- **Jointed legs.** Each leg is three moving parts: `<prefix>-leg-<leg>` (pivot at the
  shoulder or hip), its child `-shin-` (pivot at the **knee**, or the **hock** of a hind
  leg; an elephant's hind joint is a true knee) and its child `-foot-` (pivot at the
  **fetlock**). The joints are where `legChain` puts them (the species' `legs.knee`,
  `hock`, `fetlock` and the x offsets `fore`/`rear`): a hind leg slopes back from the hip
  to the hock. Draw a knob at each joint, and overlap the parts there so a fold opens no gap.
- **A face.** Two eyes, every detail level, each a dark eyeball in a lid of its own colour
  (`<species>Lid`, the donkey's pale ring) with a glint at full detail - large enough to
  read from the game's camera (about 3-5 cm radius). Nostrils (`nostril`) on an equine's
  muzzle, a bovine's broad pad (`<species>Nose`), a camel's slits with its split upper lip
  and hanging lower lip, the elephant's trunk tip; the mouth's line back from the muzzle.
  Ears with their inside coloured (`<species>Inner`). No blinkers: they hide the eyes.
- **The species' marks.** A horse's forelock, flowing mane and blaze, the Clydesdale's
  feathering; a donkey's long ears and pale muzzle; an ox's short face with a broad flat
  forehead (`CREST`), horns, poll ridge, dewlap and hip bones, cloven hooves; a camel's heavy
  brow (`BROW`), domed forehead, bulbous snout, hump, knee calluses and broad pads; an
  elephant's twin-domed forehead, wrinkled eye socket, curved ear flaps (`flap`), trunk,
  tusks, lower lip and toenails.
- **The harness** of its kind (`harness`): collar and hames, a breast band and pad, the
  cow's yoke drawn with the team; the bridle (head band, noseband, cheek pieces).

## Rules

- Animal coordinates: metres, +X forward, +Y up, +Z right, the soles on y 0 at rest.
- Place a feature on the head through `hs(a)` (the head's stations as drawn at that
  detail), never on the raw stations, or it floats or sinks where the spline bulges.
- No z-fighting between materials: a mark (a blaze, a nostril, an eye) stands a few
  millimetres proud or is a blob half sunk into the skin; a tube's end cap must not lie in
  the plane of another material's cap (the mane starts 3 cm up the neck). The build
  refuses a flickering model and the test checks every vehicle at every team.
- The gait (`gaitPose`, `addGait`) folds every knee and fetlock in the swing, at once after
  the foot leaves the ground; a trotter's `duty` stays under 0.5 so the swinging pair is
  tucked while the other carries the body (tested); the body is
  lifted so the lowest point of any foot (`footOutline`, through the three joints) stands
  on the ground. A new foot shape adds its outline there.
- Parameters, ids, sounds and game figures belong to the team (`teamParams`, `teamGame`):
  a species' look changes none of them.

## Steps

1. Look at the references in `assets/draft-animals/` (fetch more with `pnpm refs:fetch`,
   listed in its `SOURCES.md`).
2. Change the species record (`SPECIES_SPECS`) or the drawing functions.
3. Count: a scratch script drawing `drawAnimal` at `FULL`, `LIGHT`, `LIGHTEST` for every
   species, against `animalBudget(1 | 4 | 6)`.
4. Render headlessly: `pnpm build:models` for `export/thumbs/proc-animal-<species>.png`;
   a side view, a head close-up (front, side, three-quarter) and the gait at four phases
   (pose the GLB's nodes from the `gait` clip, then rasterize with `rasterize` from
   `generator/renderGlbThumb.ts`), and one vehicle with its biggest team.
5. `pnpm typecheck`, `pnpm test` (test/animalDrawn.test.ts), commit `build-cache/`.
6. Send the user the images (AGENTS.md, "Show the user the model") and update
   `docs/models/draft-animals.md`.
