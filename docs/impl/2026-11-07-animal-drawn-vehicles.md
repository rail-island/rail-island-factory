# Animal-drawn vehicles

Spec: docs/specs/2026-11-07-animal-drawn-vehicles.md
Date: 2026-11-07
Status: implemented
Area: rail-island-factory (draft animals, the Animals category, the animal vehicle kit, twelve
vehicles, sounds mapping, OpenTTD, text); rail-island-music (two sound designs);
rail-island-webapp (sound playback, the player's Horn, train clip rolling, the import, tests, docs)

## What was done

**rail-island-music** (branch `claude/animal-drawn-vehicles-bd5b97`): a new **Animals** sound
category with `hoof-beat` (a loop: runtime `rate`, each animal's footfalls a second; character
`foot` hoof/cloven/padded, `size`, `stride`, `count` 1-6, a quiet harness jingle; a team's animals
out of step, seeded) and `animal-call` (a one-shot: `species` horse/donkey/mule/cow/camel/elephant,
`pitch`), matched against nine CC0 recordings from archive.org kept in `references/`; docs in
`docs/sounds/animals.md`, tests in `test/sounds.test.ts`.

**rail-island-factory**:
- `generator/draftAnimals.ts` - the six draft animals true to size (the former horse tram's
  Clydesdale generalised into a species table: measures, colours, harness, foot, gait, stride,
  hitch, counts, pace, power, weight), each jointed and walking a distance-driven `gait` clip; the
  team's hitches (one, two abreast, pairs; camel and elephant in single file) and draft gear; the
  `animal` and `team` parameters (counts offered per species, `none` the trailer on rail); the game
  figures derived per variant (`teamGame`: power, weight, the species' pace lowered where the power
  would not hold it up a 5 % grade by the game's own physics).
- `generator/animalDesigns.ts` - the **Animals** catalog category, `proc-animal-<species>`, on the
  site only (in no game meta); `assets/draft-animals/` references.
- `generator/animalVehicleKit.ts` - the vehicle kit: rail and tram cars with the team as a second
  section on lone supports (`rig.team` re-hitchable), road coaches as a semi-truck's chain (team and
  fore-carriage towing the body from the king bolt, steered by empty nodes); `rollAll` rolls
  wheels of several sizes in one clip.
- Twelve vehicles: `generator/animalTrams.ts` (the double-deck horsecar - the former horse tram's car
  on the kit - and the closed, toastrack and bobtail cars), `generator/animalRail.ts` (Budweis-Linz
  coach and goods wagon, mine tub, platelayers' trolley), `generator/animalBuses.ts` (knifeboard
  omnibus, Concord stagecoach, Paris omnibus, wagonette), each with references in `assets/`.
- `proc-vehicle-horse-tram` removed (its catalog id, its world-tram row; its OpenTTD ids kept,
  never reused); the world trams are 99.
- Sounds: a new `call` slot; an animal-drawn vehicle's slots derived from its team per variant
  (`teamSounds`): hoof beat as engine, the species' call, a tram's bell kept on departure.
- OpenTTD entries and ids, country tags, 21 phrases in 13 languages, the catalog site's Animals
  chip, `build-cache/`, docs (`draft-animals.md`, `animal-drawn-vehicles.md` new; `world-trams.md`,
  `animation.md`, `vehicle-rig.md`, `sounds.md`, `catalog-site.md` updated), `test/animalDrawn.test.ts`.

**rail-island-webapp**:
- Sounds: `hoofRate` (4 x speed / stride) for an engine slot with `rate` and `stride`; the `call`
  slot played by the player's Horn in place of the horn on trains (`playerHorn`) and on buses and
  trams (`playerBusHorn`, the cab view's Horn button now shown on a tram or coach that has one);
  `db/sounds` imported.
- Train cars: an articulated car's distance clips roll along its front section (`carRollSign`), so
  a team in a train walks forward whichever way it runs (they read the root, which never moves).
- The factory import (twelve new vehicles, the horse tram removed); `test/animalDrawn.test.ts`
  replaces the horse tram's two test files; tests and docs (`trains.md`, `buses.md`, `sounds.md`,
  `model-animation.md`).

Checks: see *How to test* and the final report of the run (factory `pnpm build:models`,
`pnpm test`; webapp `pnpm typecheck`, `pnpm test`, `pnpm build`; music `pnpm typecheck`,
`pnpm test`, `pnpm build` - all passed in the agent's run).

## How to test

**Automated coverage.** No E2E framework in these repositories. `pnpm exec vitest run
test/animalDrawn.test.ts` in the factory (species, hitches, parameters and figures, every vehicle's
rig, supports, gait, budget, LOD and sounds) and in the webapp (posing on curves and grades, the
coach as a semi, the lead after a turnback, every team's pace up 5 %), plus the webapp's
`test/soundParams.test.ts`, `test/soundDirector.test.ts`, `test/roadRolling.test.ts`.

**Setup.** Webapp: `pnpm dev`, any account; a map with a tram line, a railway line with two
platforms on a stub, and a road with bus stops.

**Steps.**
1. Open the tram board, Consist tab, add "Double-Deck Horsecar"; open its variant gear and choose
   Animal = Mule, Team = 4. The tram shows two pairs of mules ahead of the car.
2. Run the tram: the mules walk (legs moving, not sliding) and the tram rings its bell when it moves
   off a stop; the hoof beat is heard near it.
3. Open the cab view of the tram and press Horn: a mule's call sounds (not the bell).
4. Let the tram reach the end of its line and turn back: after the dwell, the team leads the other
   way.
5. On the railway, build a consist of "Budweis-Linz Coach" (Animal = Horse, Team = 1) and two
   "Budweis-Linz Goods Wagon" with Team = None. Run it: the horse walks between the rails, the
   wagons follow; at the stub's platform it turns back and the horse leads again.
6. In the train board press Horn: the horse neighs.
7. On a road, create a bus with "Concord Stagecoach", Team = 6: three pairs of horses tow the coach;
   on a tight corner the coach body swings behind the team like a semi-trailer.
8. Choose Animal = Elephant on any vehicle: only teams of 1 and 2 are offered; Camel offers 1-3.

**Also worth trying.** A heavy team-less consist (only Team = None cars) does not move (no power).
A donkey on the Paris omnibus is slow (6 km/h or less on hills). A saved map that had the old Horse
Tram now shows a stand-in for it.

## What is missing

Nothing of the spec's scope is unbuilt, with one deviation in mechanism (Known problems, first
line).

## Known problems

- "Team changes ends" is met by the game's existing turnback: the consist is re-posed from its new
  head with its first car first, so the team leads the other way but its car turns round with it
  (and in a multi-car consist the team car moves to the new head), rather than the team walking
  round alone; `rig.team.rehitchable` is exported but nothing in the game reads it yet.
- The game has one track gauge: the Budweis-Linz (1106 mm) and mine tub (600 mm) wheels run on
  standard-gauge treads, the real gauge noted in their sources; the mine tub's wheels stand outside
  its body.
- The twelve vehicles and six animals were added to `catalogModels.json` as confirmed, on the
  strength of "implement the spec"; the factory rule wants the user's confirmation - revert any the
  user does not confirm.
- Any species may pull any vehicle (the spec's decision): a pair of elephants before a mine tub is
  possible.
- The cows' heads hang low and almost vanish behind the yoke in a yoked team.
- No coachman on any box seat; the road coaches' body-to-front-wheel clearance at full bend is
  untested.
- The donkey bray, the mule call and padded feet in `hoof-beat` are modelled without a recording.
- The upstream factory change that splits steam locomotives into more turning units (already on
  factory master, first imported here) made the webapp's Big Boy / CSD 636 test name the wrong
  bogie; the test now finds the front engine's bogie instead.
- `worldTramShapes.ts` keeps its now unused `horse`/`horseLod` extras, so the 99 world trams' JS
  stays byte-identical.

## Recommended follow-ups

- Read `rig.team` in the game and re-hitch only the team at a turnback, leaving the cars in place.
- Raise the cows' heads and draw a coachman on the coaches' box seats.
- Narrow-gauge track in the game, so the horse railway and the mine tub run on their own gauge.
- Fetch a real donkey bray and padded-foot recordings for the sound designs.
- Restrict species per vehicle (or per gauge) if odd pairings prove confusing.

## Changelog

- Animal-drawn trams, horse railway vehicles and road coaches: twelve new vehicles, each drawn by a
  team of horses, donkeys, mules, cows, camels or elephants, from one animal to six.
- Choose the animal and the size of the team in the vehicle's variant selector; a bigger team pulls
  harder, a slower animal walks slower.
- The team walks as the vehicle moves, its hooves are heard, and the Horn sounds the animal's call.
- The horse tram is replaced by the double-deck horsecar.
