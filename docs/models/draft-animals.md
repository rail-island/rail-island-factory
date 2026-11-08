# Draft animals

**Covers** - the six draft animals that pull the animal-drawn vehicles (horse, donkey, mule, cow,
camel, elephant): the species table (measures, colours, harness, foot, gait, stride, hitch, counts,
pace, power, weight), how an animal is drawn and jointed, the harness, the team's hitch layouts
and draft gear, the team's two parameters and the game figures derived per variant, the `gait`
clip, the detail levels, the distant model and the Animals catalog category.
**Code** - `generator/draftAnimals.ts` (`SPECIES_SPECS`, `teamParams`, `teamOf`, `teamFigures`,
`teamGame`, `gradeSpeed`, `rowsOf`, `placeTeam`, `drawAnimal`, `drawTeam`, `addGait`, `gaitPose`,
`teamLod`, `legChain`, `animalBudget`, `detailFor`), `generator/animalDesigns.ts` (`DRAFT_ANIMALS`, `ANIMAL_CATALOG`),
`generator/generate.ts` (`ANIMAL_DESIGNS`, the `animals` family), `src/catalogQuery.ts` (the
Animals chip), `test/animalDrawn.test.ts`
**See also** - [animal-drawn-vehicles.md](animal-drawn-vehicles.md), [animation.md](animation.md),
[characters.md](characters.md) (the walk mode's blocky animals, a different thing), [sounds.md](sounds.md),
the `animal` skill (`.agents/skills/animal/`)

## The species

The animals are drawn true to size, unlike the characters' animals, which stand in the avatar's
1.8 m height class. One record per species (`SPECIES_SPECS`), in metres, animal coordinates (x
along the animal from its middle, y up from the ground, z to its right):

| Species | Height (withers) | Harness | Foot | Gait | Stride | Counts | Pace | Power / head | Weight |
|---|---|---|---|---|---|---|---|---|---|
| `horse` (a bay Clydesdale, the former horse tram's) | 1.7 m | collar, hames, traces | `hoof` | trot | 2.4 m | 1, 2, 4, 6 | 12 km/h | 6 kW | 0.8 t |
| `donkey` | 1.1 m | collar | `hoof` | trot | 1.5 m | 1, 2, 4, 6 | 6 km/h | 2.5 kW | 0.25 t |
| `mule` | 1.45 m | collar | `hoof` | trot | 2.0 m | 1, 2, 4, 6 | 9 km/h | 5 kW | 0.45 t |
| `cow` (a draft ox: short face, flat forehead) | 1.4 m | neck yoke | `cloven` | walk | 1.3 m | 1, 2, 4, 6 | 4 km/h | 3.5 kW | 0.6 t |
| `camel` (dromedary) | 1.9 m (hump 2.2 m) | breast band, saddle pad | `padded` | pace | 2.6 m | 1, 2, 3 | 8 km/h | 4.5 kW | 0.5 t |
| `elephant` (Asian) | 2.9 m | breast band, pad | `padded` | walk | 2.4 m | 1, 2 | 6 km/h | 12 kW | 4 t |

The power is what the game's physics reads, not a measured draft: the horse's 6 kW holds its pace
with a light car up a 5 % grade, as the horse tram's 10 kW for a pair did.

## One animal

`drawAnimal(m, species, prefix, x, z, detail)` draws one animal at (x, z):

- **the body**: the barrel skinned through its stations (smoothed by a Catmull-Rom spline at
  full detail), a little narrower at the belly and the spine; a cow's hip bones, a camel's hump;
- **the neck** (a crest for a mane) with the mane, a cow's dewlap under the throat;
- **the head**: skinned along its stations from the poll to the muzzle (the last span in the
  muzzle's colour), its lower half narrowing to the jaw (`JAW`: deep and narrow on the equines
  and the camel, broad on the cow). On it the **face**, at every detail level: two eyes - a dark
  eyeball set in a lid of the species' `Lid` colour (the donkey's pale ring), a glint at full
  detail - placed by `face` (along the head, above its axis, the radius); the nose by `face.nose`
  (an equine's nostrils, a bovine's broad pink pad with its nostrils, a camel's slits, split upper
  lip and hanging lower lip, an elephant's trunk tip with its nostrils and its lower lip) and the
  mouth's line back from the muzzle; a heavy brow over the eye (`BROW`: the camel's, the
  elephant's wrinkled socket, the ox's lighter); the ears, flattened cones with their insides
  coloured (`Inner`; an elephant's a thick curved flap, `flap`, rooted down the side of the head,
  cupped away from it, its top edge rolled out and its lobe hanging below the jaw); the head's
  top by `CREST` (narrowed on the equines, squared into the ox's broad flat forehead on its short
  face); a horse's or mule's forelock, the horse's blaze, a cow's horns and poll ridge, the
  camel's domed forehead, an elephant's twin-domed forehead, trunk and tusks;
  the bridle (head band, noseband and cheek pieces; no blinkers, which would hide the eyes);
- **the tail**, a hair tail or a tuft, its dock inside the rump;
- **the legs**, each through the joints `legChain` gives (the species' `legs`): the root at the
  shoulder or hip, the **knee** (front) or **hock** (hind; an elephant's true knee), the
  **fetlock**, the sole. The upper leg (forearm, or thigh and gaskin sloping back to the hock)
  ends in the joint's knob, the shin is the cannon, the foot the fetlock's knob, the sloping
  pastern and a hoof (a cleft cloven one; the Clydesdale's white feathering), a camel's broad
  two-toed pad (with the callus on its front knees), or an elephant's round sole and toenails;
- **the harness** (a collar with hames, back pad, girth and breeching; or a breast band, girth
  and pad). The cow's yoke is the team's.

Its moving parts, every one a `spin` part (`animalNodes`):

- `<prefix>` the body, pivot at its middle, at the height of the legs' tops;
- `<prefix>-head` (pivot at the neck's root) and `<prefix>-tail`, children of the body;
- per leg `<prefix>-leg-<front|hind>-<left|right>` (pivot at the shoulder or hip), its child
  `<prefix>-shin-...` (pivot at the knee or hock) and that one's child `<prefix>-foot-...`
  (pivot at the fetlock): every leg bends at two joints.

A team's animals are `animal-1` (a leader) to `animal-<n>`.

**Budget and detail.** An animal has at most **5,000 triangles**, its harness included, alone
(its catalog design) or in a team of one or two; a bigger team's animals share **10,000**
(`animalBudget`: 3,333 each in three, 2,500 in four, 1,666 in six). `detailFor` picks the level
that keeps within it: `FULL` (22 sides round the barrel, smoothed stations, the glints, the
blaze, the feathering, toenails) for one or two, `LIGHT` for three or four, `LIGHTEST` for six -
fewer sides and leg rings, but always the eyes, the nostrils and the jointed legs. About 4,000 -
4,600 at `FULL`, 2,000 - 2,400 at `LIGHT`, 1,600 at `LIGHTEST` (`test/animalDrawn.test.ts`
checks each species at each count it is put to).

## The team

`rowsOf` gives the hitch front first: one alone, two abreast, two or three pairs; the camel and
the elephant in single file. `placeTeam` stands the rows ahead of the vehicle's hitch, each a
`rowLength` ahead of the next, a pair `pairWidth` apart, mirrored about the centre line.
`drawTeam` draws them in the current part with the draft gear: behind each animal a swingletree
(an evener behind a pair) and the traces from its collar or breast band, a chain from each row
back to the row behind and the rear row's to the hitch; a cow pair under a yoke with its bows, a
chain or the pole back; on a road coach (`draft: "pole"`) the pole from the fore-carriage between
the wheel pair; the reins from the leaders' heads to the driver; on rail two lone supports
(`axleAt`) under the rear row's hind legs and the leaders' forelegs.

## Parameters and game figures

`teamParams` declares `animal` (the six species, default `horse`) and then `team` (`1`, `2`, `3`,
`4`, `6`, each value offered only for the species put to it, `ParamValue.when`; on rail and tram
vehicles also `none`, the trailer). The default team is one horse, or a pair on a road coach.

`teamFigures` derives a team's figures on a vehicle of its own weight and top speed: power `count x
power`, weight the vehicle's and `count x weight`, top speed the least of the species' pace, the
vehicle's own and the speed that power holds up a 5 % grade in the game (`gradeSpeed`, the game's
physics: `1.5 P / (W v) = 9.8 x 0.05`, v in studs per second), never under 2 km/h. `teamGame`
writes the default's figures and a `game.variants` entry for every other selection whose figures
differ; the trailer has no power.

## The gait

`addGait` adds the clip **`gait`** (drive `distance` at `ROLLING_SPEED`, one loop one stride) for
the whole team: each leg's phase in the stride by the species' gait (trot: the diagonal pairs;
pace: the lateral pairs; walk: hind left, fore left, hind right, fore right a quarter apart), each
foot planted for the species' `duty` share and sliding back under the body by the stride's share,
then swung forward with its joints folded (`legPose`: the front knee and every fetlock tuck the
foot back, a hock brings it forward under the body, the elephant's hind knee back; padded feet
fold less). The joints fold at once as the foot leaves the ground and open again before it lands
(`sin(pi sqrt(t))` of the swing), and the trotters plant a foot for less than half the stride
(`duty` 0.42-0.45; the camel's pace 0.48), so one diagonal pair carries the body while the
other is tucked up, never all four legs straight and spread; the head nods, the tail swishes, and each body is lifted
so the lowest point of any foot - the sole's edges and the widest rings above it
(`footOutline`), carried through the three joints - stands on the ground (`gaitPose`). Each animal steps at its own phase
(`teamPhase`: a pair out of step, each row a little behind), deterministic.

## Distant model and the Animals category

`teamLod` draws each animal as two side boxes, the body and legs and the neck and head.

`animalDesigns.ts` gives each species a design of its own, `proc-animal-<species>`, standing in its
harness and walking its gait: the catalog's **Animals** category (group `animal`), on the site
only - no game meta lists them, as the game meets them only in the vehicles they pull. Their
references are `assets/draft-animals/`.
