# Draft animals

**Covers** - the six draft animals that pull the animal-drawn vehicles (horse, donkey, mule, cow,
camel, elephant): the species table (measures, colours, harness, foot, gait, stride, hitch, counts,
pace, power, weight), how an animal is drawn and jointed, the harness, the team's hitch layouts
and draft gear, the team's two parameters and the game figures derived per variant, the `gait`
clip, the detail levels, the distant model and the Animals catalog category.
**Code** - `generator/draftAnimals.ts` (`SPECIES_SPECS`, `teamParams`, `teamOf`, `teamFigures`,
`teamGame`, `gradeSpeed`, `rowsOf`, `placeTeam`, `drawAnimal`, `drawTeam`, `addGait`, `gaitPose`,
`teamLod`), `generator/animalDesigns.ts` (`DRAFT_ANIMALS`, `ANIMAL_CATALOG`),
`generator/generate.ts` (`ANIMAL_DESIGNS`, the `animals` family), `src/catalogQuery.ts` (the
Animals chip), `test/animalDrawn.test.ts`
**See also** - [animal-drawn-vehicles.md](animal-drawn-vehicles.md), [animation.md](animation.md),
[characters.md](characters.md) (the walk mode's blocky animals, a different thing), [sounds.md](sounds.md)

## The species

The animals are drawn true to size, unlike the characters' animals, which stand in the avatar's
1.8 m height class. One record per species (`SPECIES_SPECS`), in metres, animal coordinates (x
along the animal from its middle, y up from the ground, z to its right):

| Species | Height (withers) | Harness | Foot | Gait | Stride | Counts | Pace | Power / head | Weight |
|---|---|---|---|---|---|---|---|---|---|
| `horse` (a bay Clydesdale, the former horse tram's) | 1.7 m | collar, hames, traces | `hoof` | trot | 2.4 m | 1, 2, 4, 6 | 12 km/h | 6 kW | 0.8 t |
| `donkey` | 1.1 m | collar | `hoof` | trot | 1.5 m | 1, 2, 4, 6 | 6 km/h | 2.5 kW | 0.25 t |
| `mule` | 1.45 m | collar | `hoof` | trot | 2.0 m | 1, 2, 4, 6 | 9 km/h | 5 kW | 0.45 t |
| `cow` | 1.4 m | neck yoke | `cloven` | walk | 1.3 m | 1, 2, 4, 6 | 4 km/h | 3.5 kW | 0.6 t |
| `camel` (dromedary) | 1.9 m (hump 2.2 m) | breast band, saddle pad | `padded` | pace | 2.6 m | 1, 2, 3 | 8 km/h | 4.5 kW | 0.5 t |
| `elephant` (Asian) | 2.9 m | breast band, pad | `padded` | walk | 2.4 m | 1, 2 | 6 km/h | 12 kW | 4 t |

The power is what the game's physics reads, not a measured draft: the horse's 6 kW holds its pace
with a light car up a 5 % grade, as the horse tram's 10 kW for a pair did.

## One animal

`drawAnimal(m, species, prefix, x, z, detail)` draws one animal at (x, z): the barrel skinned
through its stations, the neck and head along their axes (the muzzle in its own colour), the ears
(an elephant's as flaps), the species' feature (a cow's horns, a camel's hump, an elephant's trunk
and tusks), the mane, the tail (a hair tail or a tuft), the legs in two parts down to a hoof, a
cloven hoof or a broad padded sole (the Clydesdale's white feathering), and the harness on the body
(a collar with hames, back pad, girth and breeching; or a breast band, girth and pad). Its moving
parts, every one a `spin` part:

- `<prefix>` the body, pivot at its middle, at the height of the legs' tops;
- `<prefix>-head` (pivot at the neck's root) and `<prefix>-tail`, children of the body;
- per leg `<prefix>-leg-<front|hind>-<left|right>` (pivot at the shoulder or hip) with its child
  `<prefix>-shin-...` (pivot at the knee or hock).

A team's animals are `animal-1` (a leader) to `animal-<n>`. **Detail** (`detailFor`): the full
rings for one or two animals, lighter for four, lightest for six, so a six-horse team fits.

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
then swung forward with the knee folded; the head nods, the tail swishes, and each body is lifted
so the lowest planted sole stands on the ground (`gaitPose`). Each animal steps at its own phase
(`teamPhase`: a pair out of step, each row a little behind), deterministic.

## Distant model and the Animals category

`teamLod` draws each animal as two side boxes, the body and legs and the neck and head.

`animalDesigns.ts` gives each species a design of its own, `proc-animal-<species>`, standing in its
harness and walking its gait: the catalog's **Animals** category (group `animal`), on the site
only - no game meta lists them, as the game meets them only in the vehicles they pull. Their
references are `assets/draft-animals/`.
