# Characters

**Covers** - the characters the game's walk mode moves: the avatar `proc-char-avatar`, its
frame and measures, the posable parts and their pivots, the six clips (`idle`, `walk`, `run`,
`jump`, `fall`, `sit`) with their drives, durations and paces, the foot contact the clips are
solved for, the seat height, the low detail, `characters.meta.json`, the site's motion buttons
and the tests.
**Code** - `generator/characters.ts` (`avatar`, `avatarLod`, `AVATAR`, `AVATAR_SEAT_HEIGHT`,
`CHARACTERS`), `generator/design.ts` (`CharacterProperties`), `generator/catalog.ts`
(`exportCharacterMeta`, `CHARACTERS_META_FILE`, `sceneryOf`), `generator/generate.ts`
(`CHARACTER_DESIGNS`), `generator/meshCore.ts` (`ClipDrive` `motion`), `src/viewerMotions.ts`,
`src/ModelViewer.tsx`, `src/viewerScenery.ts`, `test/characters.test.ts`
**See also** - [animation.md](animation.md) (clips and drives), [export.md](export.md),
[lod.md](lod.md), [text.md](text.md), [../site/catalog-site.md](../site/catalog-site.md), the
game's walk mode (`docs/specs/2026-10-31-walking-avatar.md` in the webapp)

## What a character is

A character is an ordinary design (thumbnail, JS model, LOD, catalog page) that the game never
places on a map or offers in a picker: its walk mode shows it and moves it. Ids are
`proc-char-<name>` and permanent like every model id. A character's title is exported game
text in all 14 languages (`model.<id>`, [text.md](text.md)). It is listed only in
`characters.meta.json`, never in the building, village, vehicle or prop metas.

## The avatar

`proc-char-avatar`, title "Avatar": a blocky, Roblox-like figure of closed boxes - a big,
slightly bevelled head with hair, eyes, brows, a nose and a mouth on its face; a box torso in a
blue shirt with a trouser waistband; sleeved arms with hands; thighs, shins and shoes in dark
trousers and shoes. About 330 triangles; no parameters.

- **Units and frame**: metres, like the vehicles (the game scales it by its 1.5 studs a metre).
  **+X forward** - the face looks along +X, as a vehicle's nose does - +Y up, +Z to the
  figure's right (so its left side is -Z). Feet at y = 0, the origin between the feet.
- **Measures** (`AVATAR`): 1.81 m to the top of the hair; hips 0.78 m, knees 0.39 m, shoulders
  1.30 m, neck 1.41 m; 0.95 m across the arms, 0.43 m front to back.
- **Default bounds at rest**: min (-0.21, 0, -0.475), max (0.22, 1.81, 0.475).

### Parts

Every limb is a part (`MeshCore.part`): its own node, named for three.js to bind, turned
about its joint. The JS model's group holds them as:

| Node | Parent | Pivot (rest, world) | Holds |
|---|---|---|---|
| `torso` | - | (0, 0.78, 0), the hips | shirt, collar, waist; root of the upper body |
| `head` | `torso` | (0, 1.41, 0), the neck | neck, head, hair, face |
| `leftArm`, `rightArm` | `torso` | (0, 1.30, -/+0.36), the shoulder | sleeve, arm, hand |
| `leftLeg`, `rightLeg` | - | (0, 0.78, -/+0.12), the hip | the thigh |
| `leftShin`, `rightShin` | `leftLeg`, `rightLeg` | (0, 0.39, -/+0.12), the knee | shin and shoe |

A child node's position is its pivot less its parent's (`partOffset`). The legs are top-level
nodes beside the torso, so a clip that lowers the hips moves three nodes by the same height.

## The clips

| Clip | Drive | Duration | What it is |
|---|---|---|---|
| `idle` | `time` | 2 s, 24 steps | breathing: the torso rocks, the arms sway a little away and back, the head nods |
| `walk` | `distance`, `speed` 1.4 m/s | 1.6 / 1.4 = 1.1429 s, 32 steps | one stride cycle (two steps) covering 1.6 m: thighs swing +-0.53 rad, the swinging knee folds, arms swing against the legs, a slight forward lean and twist |
| `run` | `distance`, `speed` 4 m/s | 3.2 / 4 = 0.8 s, 32 steps | one cycle covering 3.2 m: longer swing, knees folded high, arms pumping, a stronger lean, a short flight after each push-off |
| `jump` | `motion` | 0.9 s, 27 steps | one shot: crouch (0.2 s), push off with the arms thrown up (0.34 s), tuck (0.55 s), open (0.75 s), land with the knees a little bent - near, not at, the rest pose |
| `fall` | `motion` | 0.8 s, 24 steps | a loop: arms up overhead and flailing, legs kicking, the hips 6 cm up |
| `sit` | `motion` | 0.8 s, 24 steps | from standing to seated: the clip's end is the seated pose - thighs level forward, shins straight down, shoes on the ground, the hands on the thighs |

- **Same tracks in every clip**: the rotation of all eight parts and the translation of
  `torso`, `leftLeg` and `rightLeg` (the hips' height), so a consumer can cross-fade any clip
  into any other without a part snapping back to rest.
- **In place**: no clip moves the figure across the ground; the consumer moves it. Play `walk`
  and `run` at `timeScale = v / speed` for the figure's ground speed `v` (the `distance`
  drive, [animation.md](animation.md)); at `timeScale` 1 they show the pace they were made for.
- **Loops close**: `idle`, `walk`, `run` and `fall` end on a copy of their first sample.
- **Foot contact**: wherever the figure stands (`idle`, `walk`, `run`, the crouch and landing
  of `jump`, all of `sit`), each sample's hips are lowered from their rest height until the
  lowest corner of a thigh, shin or shoe touches y = 0 (`solveContact`): the planted foot is on
  the ground at every sample of the walk, and between the run's steps the hips rise up to 6 cm
  above it. In the air (`jump`'s tuck, `fall`) the hips follow the keyed poses.
- **Seat height**: `AVATAR_SEAT_HEIGHT` = **0.39 m**, the hips' (the leg joints') height at the
  end of `sit`. The game puts the hip joints that far above the floor a seated avatar rests on;
  the underside of the level thighs is then 0.115 m lower (0.275 m).
- **`motion` drive**: jump, fall and sit are motions the character chooses, so nothing in the
  model's own movement plays them; the game's walk mode plays each by its clip name, and a
  consumer that does not know the drive ignores it ([animation.md](animation.md)).

The keyed motions (`jump`, `sit`) are eased between their keys (smoothstep per joint angle) and
sampled every 1/30 s, so the clip itself carries the easing; a player only plays it.

## Low detail

`avatarLod`: the same skeleton as eight plain boxes - head, torso, two arms, two thighs, two
shins - in the rest pose, 92 triangles, under the 100-triangle budget of an ordinary model
([lod.md](lod.md)). Like every low detail it is one static mesh: no parts and no clips, so a
distant avatar stands still; a consumer animates the full model.

## characters.meta.json

`exportCharacterMeta` writes `export/characters.meta.json`: `{ note, count, characters }`, one
entry per character in the buildings' entry shape - `id`, `title`, `category` (`Characters`),
`group` (`character`), `js`, `thumb`, `license`, `author`, `source` (no `defaultScale`: metres,
like a vehicle; `params` when the design has any) - plus `character`:

```json
{
  "id": "proc-char-avatar", "title": "Avatar", "category": "Characters", "group": "character",
  "js": "proc-char-avatar.js", "thumb": "proc-char-avatar.png",
  "license": "CC0", "author": "Rail Island", "source": "Rail Island",
  "character": {
    "height": 1.81,
    "bounds": { "min": [-0.21, 0, -0.475], "max": [0.22, 1.81, 0.475] },
    "clips": ["idle", "walk", "run", "jump", "fall", "sit"],
    "facing": "+x",
    "seat": 0.39
  }
}
```

`height` is the top of the default build's bounds at rest (the feet are at 0), `bounds` that
build's extent about its origin in metres, `clips` the clip names in the model's order (each
clip's drive is in the JS model's `userData.clipDrives`), `facing` and `seat` the design's
`character` properties (`CharacterProperties`). A design listed as a character without them
fails the export.

## On the site

Characters have a first-row chip of their own, **Characters**. A character's model page
stands the figure on a strip of grass with a paved path along x beside a 2 m marker pole (a
vehicle door's height, banded every quarter metre, ticked every half, a crossbar at the top),
and puts one button per clip over the preview - Idle, Walk, Run, Jump, Fall, Sit - and Stop
([../site/catalog-site.md](../site/catalog-site.md)).

## Tests

`test/characters.test.ts`: the avatar in no other family or meta and its title exported; its
height, feet, facing, centring, budgets and no z-fighting; every clip with its drive, walk and
run at their pace, the same tracks in every clip, the low detail static; closed
loops; feet at or above -0.02 m through every sample of `walk`, `run` and `idle` with a foot
touching, the run's flight; the jump lifting its feet, the seated pose and its seat height; the
JS model's nodes and drives; `characters.meta.json` as built and as the export writes it; and
the site's chip, scenery and motion buttons (`src/viewerMotions.ts`).
