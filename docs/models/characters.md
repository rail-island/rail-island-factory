# Characters

**Covers** - the characters the game's walk mode moves: the avatar `proc-char-avatar`, its
looks (parameters and the ten presets), the four animals (`proc-char-dog`, `-cat`, `-pig`,
`-elephant`), their frame and measures, the posable parts and their pivots, the six clips (`idle`, `walk`, `run`,
`jump`, `fall`, `sit`) with their drives, durations and paces, the foot contact the clips are
solved for, the seat height, the low detail, `characters.meta.json`, the site's motion buttons
and the tests.
**Code** - `generator/characters.ts` (`avatar`, `avatarLod`, `AVATAR`, `AVATAR_SEAT_HEIGHT`,
`AVATAR_PARAMS`, `AVATAR_PRESETS`, `CHARACTERS`), `generator/animals.ts` (`ANIMALS`,
`ANIMAL_PARTS`, `dog` ... `elephantLod`), `generator/characterKit.ts`, `generator/design.ts`
(`CharacterPreset`), `generator/design.ts` (`CharacterProperties`), `generator/catalog.ts`
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
`characters.meta.json`, never in the building, village, vehicle or prop metas. The avatar is
listed first, then the four animals.

## The avatar

`proc-char-avatar`, title "Avatar": a blocky, Roblox-like figure of closed boxes - a big,
slightly bevelled head with hair, eyes, brows, a nose and a mouth on its face; a box torso in a
blue shirt with a trouser waistband; sleeved arms with hands; thighs, shins and shoes in dark
trousers and shoes. About 330 triangles at its defaults, at most about 450 in any look.

- **Units and frame**: metres, like the vehicles (the game scales it by its 1.5 studs a metre).
  **+X forward** - the face looks along +X, as a vehicle's nose does - +Y up, +Z to the
  figure's right (so its left side is -Z). Feet at y = 0, the origin between the feet.
- **Measures** (`AVATAR`): 1.81 m to the top of the hair; hips 0.78 m, knees 0.39 m, shoulders
  1.30 m, neck 1.41 m; 0.95 m across the arms, 0.43 m front to back.
- **Default bounds at rest**: min (-0.21, 0, -0.475), max (0.22, 1.81, 0.475).

### Looks

The avatar is parametric ([parameters.md](parameters.md)); the defaults draw the original
figure. Five parameters change its shape and four only recolour it (`finishParams`, varied one
at a time by the tests). Names and values are stored in the game's saved maps.

| name | values (default first) |
|---|---|
| `hair` | short, curls, long, ponytail, bald |
| `headwear` | none, cap, hat, beanie, helmet (Hard hat), conductor (Conductor's cap) |
| `bag` | none, backpack, shoulderBag, suitcase (in the right hand, on the arm part) |
| `body` | standard, slim, broad - the torso's width and depth, the shoulders' spacing and the arms' thickness; the legs, the hips and every joint height stay, so the clips and the foot contact are the same for every body |
| `clothing` | tshirt, jacket (long sleeves, a white front), dress (a flared skirt on the torso, bare legs), vest (high-vis with two reflective bands) |
| `skin` | light, fair, tan, brown, dark |
| `shirtColour` | blue, red, green, yellow, white, black, orange, purple, navy |
| `trousersColour` | navy, black, grey, beige, denim, brown |
| `hairColour` | brown, black, blonde, red, grey |

Under any headwear the curls lose the bumps the headwear covers. Every accessory is a closed
box (or a rod) on the part it moves with, so the clips need no change.

**Presets** (`AVATAR_PRESETS`, `CharacterPreset`): ten named looks the game offers as avatar
types - Classic (the defaults), Conductor, Worker, Hiker, Tourist, Traveller, Student,
Business, Commuter, Pensioner. Each is a set of parameter values (the rest at their defaults),
an English title exported as `model.proc-char-avatar.preset.<id>` in all 14 languages, and a
`nameGender` (`female` / `male`): the grammatical gender of the first name the game gives a new
avatar of that look. Preset ids are stored in saved maps like parameter values.

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

## The animals

`generator/animals.ts`: a dog, a cat, a pig and an elephant, each its own design
(`proc-char-dog`, `proc-char-cat`, `proc-char-pig`, `proc-char-elephant`, titles Dog, Cat, Pig,
Elephant) built from one quadruped kit. They share the avatar's frame (metres, +X forward, feet
at y = 0) and its **height class**: each stands about 1.8 m to the top of its head or ears
(1.76 - 1.87 m), so the game's motion rules, follow camera and step heights serve every
character alike - a look, not realism.

- **One parameter**, `coat` (a finish parameter): dog brown, golden, black, white, grey; cat
  ginger, black, grey, white, cream; pig pink, black, brown; elephant grey, lightGrey, pink.
- **Skeleton** (`ANIMAL_PARTS`): `body` (the root, pivot at the legs' top height), `head` and
  `tail` (children of the body), and per leg - `frontLeft`, `frontRight`, `backLeft`,
  `backRight` - `<leg>Leg` (child of the body, pivot at the shoulder or hip) and `<leg>Shin`
  (child of its leg, pivot at the knee, holding the paw or hoof).
- **Clips**: the avatar's six names and drives. `walk` is a trot (diagonal pairs) at 1.4 m/s,
  `run` a gallop at 4 m/s with a short flight, the swinging knee folding so the foot clears the
  ground; `idle` breathes and wags the tail; `jump` crouches, pushes off, tucks and lands;
  `fall` splays the legs 6 cm over the ground; `sit` ends seated on the haunches with the head
  up. Every clip moves each part's rotation and the body's translation; the body's height is
  solved so the lowest corner of a leg or of the body touches y = 0 wherever it stands.
- **Seat**: the body pivot's height at the end of `sit` (about 0.5 - 0.65 m), exported as
  `seat`; the game puts that pivot that high above the floor of a vehicle it rides.
- **Low detail**: the body, the head and four whole legs, 72 triangles, static.
- About 300 - 350 triangles each.

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

A character with presets (the avatar) also carries `character.presets`:
`[{ id, title, nameGender, params }]`, each preset's `params` with every parameter resolved,
so the game can store a full look. Its `params` (the enum parameters) are in the entry like any
parametric model's.

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

`test/characters.test.ts`: every character in no other family or meta and its title exported;
the presets resolving with their exported titles and name genders; every preset and every
shape value on the default look keeping the skeleton, the budgets, no z-fighting and its feet
on the ground through every clip; each animal in every coat in the height class and its
budgets, its clips, drives and tracks, the walk's contact, the run's and jump's flight, its
seat, its JS model's nodes and its meta entry; its
height, feet, facing, centring, budgets and no z-fighting; every clip with its drive, walk and
run at their pace, the same tracks in every clip, the low detail static; closed
loops; feet at or above -0.02 m through every sample of `walk`, `run` and `idle` with a foot
touching, the run's flight; the jump lifting its feet, the seated pose and its seat height; the
JS model's nodes and drives; `characters.meta.json` as built and as the export writes it; and
the site's chip, scenery and motion buttons (`src/viewerMotions.ts`).
