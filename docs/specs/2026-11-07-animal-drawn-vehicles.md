# Animal-drawn vehicles

Status: draft
Date: 2026-11-07
Area: rail-island-factory (draft animals, animal-drawn trams, trains and buses); rail-island-webapp (posing an animal team on rail and road, playing its sounds); rail-island-music (hoof beat and animal call sound designs)

## Context of the change

The only animal-drawn vehicle today is the factory's horse tram, `proc-vehicle-horse-tram`
(`generator/horseTram.ts`, `docs/models/world-trams.md` "The horse tram"): a Victor Harbor
double-deck car with one Clydesdale drawn by the same builder. The horse is jointed and trots
(clip `trot`, driven by distance), and the rig makes it the front section of a two-section car
with no joint, standing on two lone supports under its legs, so the game poses it on the
track's centre line (`test/horseTram.test.ts` in both repositories, `BusController`'s tram clip
player). Its game properties are a hand-set 10 kW / 10 km/h.

What it lacks:
- The horse is not reusable: it lives inside one tram's builder. There is no donkey, mule,
  cow/ox, camel or elephant to pull anything.
- Only a tram can be animal-drawn. A horse railway train or a horse omnibus / stagecoach on
  the road does not exist.
- The number of animals is fixed at one.

Related existing pieces:
- The factory's characters (`generator/animals.ts`, `docs/models/characters.md`): a dog, cat,
  pig and elephant for the game's walk mode, blocky and scaled to the avatar's 1.8 m height
  class, with idle/walk/run/jump/fall/sit clips. They are not true-size draft animals.
- Vehicle parameters reach the game (`docs/rendering/procedural-models.md`): a saved vehicle key
  carries its parameter selection and the boards' variant selector picks it; game properties
  may differ per variant (`game.variants`, `docs/models/game-properties.md`).
- A tram is a train-style consist of cars (`docs/gameplay/buses.md`); a bus is one model, which
  may have sections (articulated bus, the Havana camello's tractor and semi-trailer).

No game storage format changes are expected beyond model ids and parameter keys already stored
in saved maps (see *Database and persistent storage*).

## User request

There is already a horse tram now. I want support for vehicle types with animals - trams, and
also trains and buses. It will look similar to the horse tram, but it will go on road/railroad.
I also want to support more animals - donkeys/mules, cow, camel, elephants. Animals should have
a special category in the factory (or they could be added to characters). I also want more
animals to be able to pull one train/bus/tram - it will be a parameter of the vehicle. Suggest a
few vehicles for each transport type (tram, train, bus), and refactor the current horse tram for
this. The horse tram itself could be dropped, with no backward compatibility.

## Decisions

### How should the animal team be combined with the vehicle it pulls?
| Option | What it means |
|---|---|
| Baked into vehicle | The factory draws the team inside each animal-drawn vehicle as a front section on its own supports; animal count is a vehicle parameter; speed/power vary per count via `game.variants`; the game extends the horse tram's front-section handling to trains and buses. |
| Team is its own vehicle | On rail, a "horse team" is a separate consist vehicle coupled ahead of any coach or tram car; buses still need the baked form - two systems. |
| Game composes at runtime | A vehicle names an animal model and count; the game places and animates them; the team leaves the factory's model, thumbnail and LOD. |

**Answer: Baked into vehicle.**

### Where should the draft animals live in the factory?
| Option | What it means |
|---|---|
| New Animals category | True-size draft animals (horse, donkey, mule, ox/cow, camel, elephant) as own designs with catalog pages, harness and walk/trot clips, on a shared animal kit the vehicles draw from; separate from walk-mode characters. |
| Add to Characters | Draft animals join `proc-char-*` and walk mode, but characters are pinned to the avatar's 1.8 m class and six clips. |
| Kit only, no pages | A generator kit draws the animals inside vehicles; no catalog entries. |

**Answer: New Animals category.**

### Besides the count, which team parameters should an animal-drawn vehicle offer?
| Option | What it means |
|---|---|
| Count + curated species | Each vehicle lists its counts and the species that historically fit it; each count x species pair has its own power and speed. |
| Count only | Species fixed per design; a mule tram is a separate model. |
| Count + any species | Every animal-drawn vehicle accepts every animal; most freedom, odd pairings possible, more variants. |

**Answer: Count + any species.** Every animal-drawn vehicle carries two parameters, the
species and the count; any of the six animals can pull any of them.

### How should larger teams be arranged?
| Option | What it means |
|---|---|
| Standard hitches | Real hitch layouts per species: 1, 2 abreast, 4 as two pairs, 6 as three pairs (horse, mule, cow in yokes); tall animals (camel, elephant) single file. Each species states its allowed counts. |
| Always single file | Tandem; one gauge wide, very long teams. |
| Always side by side | One row abreast; wide teams overhang. |

**Answer: Standard hitches.** Combined with the previous answer, the count values offered
depend on the chosen species (the existing per-value `when` rule of parameters), so the
species parameter comes first.

### The roster includes horse, donkey, mule, cow, camel and elephant. Which of these should also be added?
| Option | What it means |
|---|---|
| Ox | Draft ox in a yoke, beside or instead of the cow. |
| Water buffalo | South/Southeast Asian draft bovine. |
| Bactrian camel | Two-humped camel beside the dromedary. |
| Nothing more | Only the six requested animals. |

**Answer: Nothing more.** The roster is horse, donkey, mule, cow, camel (dromedary) and
elephant.

### Which animal-drawn TRAMS should be in the first set?
| Option | What it means |
|---|---|
| Double-deck car | The current Victor Harbor double-deck car, redrawn on the animal kit under a new id; the old id is dropped. |
| Closed single-deck car | A small closed European horse car of the 1870s-1890s (Prague, Vienna, Berlin). |
| Open toastrack car | An open summer cross-bench car with a canopy (Douglas Bay Horse Tramway). |
| US bobtail car | A short American one-man car, single platform and fare box, 1880s. |

**Answer: all four** (multi-select).

### Which animal-drawn TRAINS (rail) should be in the first set?
| Option | What it means |
|---|---|
| Budweis-Linz coach | A stagecoach-bodied "Hannibal" coach of the Ceske Budejovice-Linz horse railway (1832). |
| Budweis-Linz goods wagon | The same railway's open salt/goods wagon as a lead wagon with its team; a plain one couples behind. |
| Mine tub train | A narrow-gauge mine or quarry tub with a pit-pony hitch; plain tubs follow. |
| Platelayers' trolley | A small flat inspection trolley with a bench, for an estate or plantation tramway. |

**Answer: all four** (multi-select). The lead vehicle carries the team; plain coaches and
wagons couple behind it in the ordinary consist.

### Which animal-drawn BUSES (road) should be in the first set?
| Option | What it means |
|---|---|
| London omnibus | A knifeboard double-deck horse omnibus (Tilling style, 1850s-1890s). |
| Stagecoach | An American Concord stagecoach with boot and rooftop seats. |
| Paris omnibus | The CGO three-window car with its imperiale top deck. |
| Wagonette / charabanc | An open excursion wagon with cross benches and a canvas roof. |

**Answer: all four** (multi-select).

### After a turnback the team would be pushed from behind. What should happen?
| Option | What it means |
|---|---|
| Team changes ends | While standing at the platform, the game moves the team to the new leading end; the rig marks the team section as re-hitchable at either end. New game logic for rail and tram consists. |
| No turnback | Animal-drawn consists run only on loops, balloon loops or wyes. |
| Pushed backwards | As today: the team walks backwards behind the car. |

**Answer: Team changes ends.**

### Should rail animal-drawn vehicles offer a count of 0 (a trailer without a team)?
| Option | What it means |
|---|---|
| Yes, 0 = trailer | Every rail and tram design offers "none" as the count: the plain coach or wagon that couples behind. One design per vehicle. Buses always have a team. |
| Separate trailer designs | Plain coaches and wagons are their own designs. |
| No trailers | Every animal-drawn vehicle runs alone. |

**Answer: Yes, 0 = trailer.**

### How should the game properties of each species and count be set?
| Option | What it means |
|---|---|
| Derived from species table | Each species states its pace and per-head pulling power (e.g. horse 12 km/h, mule 9, donkey 6, cow 4, camel 8, elephant 6); variants are computed (count x power, species pace as top speed, team weight added); the build checks each holds its speed on a 5 % grade. |
| Hand-stated per variant | Every species x count combination listed by hand. |
| Same for all | One speed and power for all teams (10 kW, 10 km/h). |

**Answer: Derived from species table.**

### Should the animal-drawn vehicles get sound beyond the tram bell?
| Option | What it means |
|---|---|
| Request hoof sounds | rail-island-music gets a hoof beat whose rate follows speed (hard hooves vs padded feet) and a call per species (neigh, bray, moo, camel grunt, trumpet) used as the vehicle's horn; the factory maps them through `game.sounds`. |
| Bell only | Trams ring the tram bell; buses and trains are silent. |
| Hooves, no calls | Only the speed-driven hoof beat. |

**Answer: Request hoof sounds.**

**Follow-up (user): "add implementing sounds into spec".** The sounds are not only requested
but implemented in this change: the new designs are built in rail-island-music, mapped to
every species x count variant in the factory and played by the game.

### What should the standalone Animals-category designs be used for in the game?
| Option | What it means |
|---|---|
| Factory catalog only | Browsable on factory.railisland.com and the kit the vehicles draw from; the game gets them only inside vehicles. |
| Also game decorations | Placeable idling animals; needs a picker and an idle clip in the game. |
| Also walk-mode characters | The player walks as a true-size animal; conflicts with the avatar's height class. |

**Answer: Factory catalog only.**

### Which repository should hold this spec?
| Option | What it means |
|---|---|
| rail-island-factory | Most of the work is in the factory; the game's part is a section of this spec. |
| rail-island-webapp | The spec lives with the game; the factory work is an upstream dependency. |
| Both, one each | A factory spec and a webapp spec linking each other. |

**Answer: rail-island-factory.**

### Backward compatibility of the current horse tram (from the request, not asked)
**Answer: dropped, no backward compatibility.** `proc-vehicle-horse-tram` is removed rather
than kept or aliased; the double-deck car returns under a new id on the animal kit.


## High-level plan

1. **The animal kit and the Animals category (factory).** A shared kit draws six true-size
   draft animals - horse, donkey, mule, cow, camel (dromedary), elephant - with their harness
   (collar and traces for equines, a yoke for the cow, a saddle-pad hitch for camel and
   elephant), each jointed like today's Clydesdale and animated by a distance-driven gait clip.
   Each species states its measures, its allowed team counts and hitch layout (1, 2 abreast, 4
   as two pairs, 6 as three pairs; camel and elephant single file), its walking pace, its
   per-head pulling power and its weight. Each animal is also its own design in a new
   **Animals** catalog category with a page, thumbnail, LOD and translated title; the game
   meta files do not list them. The Clydesdale moves out of the horse tram into the kit.
2. **The team as a section (factory).** One routine turns (species, count) into the team's
   section: the animals in their hitch, the swingletrees or yoke, the draw pole or traces to
   the vehicle, the team's own lone supports under its legs and its distant model. Every
   animal-drawn vehicle gets the two parameters (species first, then count, whose values
   depend on species); rail and tram designs also offer count "none", the trailer. The game
   properties of every species x count variant are derived from the species table, and the
   build checks each holds its top speed on a 5 % grade. The rig marks the team section as
   re-hitchable at either end of a rail or tram vehicle.
3. **The twelve vehicles (factory).** Trams: the Victor Harbor double-deck car (redrawn, new
   id), a closed European single-deck car, the Douglas-style open toastrack, a US bobtail
   car. Trains: the Budweis-Linz "Hannibal" coach, the Budweis-Linz goods wagon, a mine tub,
   a platelayers' trolley. Buses: a London knifeboard omnibus, a Concord stagecoach, a Paris
   CGO omnibus with imperiale, a wagonette/charabanc. Each with references, OpenTTD entry,
   text in 14 languages and the family skill's budgets and checks. The old horse tram design
   and its id are removed. Depends on 1-2.
4. **Sounds (rail-island-music, then the factory's mapping).** Part of this change, not a
   request for later.
   - **A new sound category, Animals** ("Draft animals: their hooves and their calls"),
     beside Trains, Ships and the others.
   - **The hoof beat** (proposed id `hoof-beat`): a loop, the animal counterpart of the steam
     beat. Its runtime parameter is the footfall `rate`, which the game sets from the vehicle's
     speed; standing still it falls silent. Its character parameters, pinned per variant by the
     factory, are the foot (`hard` hooves of horse, donkey and mule, the cloven hooves of the
     cow, the `padded` feet of camel and elephant), the animal's size (weight of each
     footfall, pony-light donkey to elephant), the stride (metres per footfall, from which the
     game derives the rate) and the team count (more animals: denser, slightly unsynchronised
     footfalls rather than one louder beat). Harness jingle and the creak of traces are part
     of it, quiet.
   - **The animal call** (proposed id `animal-call`): a one-shot with a `species` choice -
     horse neigh/whinny, donkey bray, mule (between the two), cow moo, camel groan, elephant
     trumpet - and a `pitch` scale; it takes the horn's `call` parameter like every horn, so
     the game sounds it on departure and on the player's Horn.
   - Each design is matched against downloaded recordings (CC0, Public Domain Mark or CC BY),
     kept as excerpts with their sources in the music repository, with what was measured and
     what was modelled stated in its documentation; MP3 renders are sent to the user.
   - **The factory's mapping.** The factory re-imports the designs into its copy of the sound
     designs. Every animal-drawn vehicle's slots are derived from its team, per variant: the
     `engine` slot is the hoof beat with the species' foot, size and stride and the team count
     pinned; the `horn` slot is the species' call with `departure` among its calls. The trailer
     (count "none") is silent. The factory's sound check covers every variant.
   Independent of 1-3 until the mapping step, which needs the vehicles' parameters.
5. **The game (rail-island-webapp).** Import the new export. Extend the horse tram's handling
   (team as a front section on its own supports, its gait played by distance) from trams to
   train consists and to buses on the road. Add the turnback rule: while a rail or tram
   consist with a team stands at a platform to turn back, the team moves to the new leading
   end. Remove what referred only to the old horse tram and move its regression tests to the
   new vehicles. Import the new sound designs; drive the hoof beat's footfall rate from the
   vehicle's speed and the pinned stride (the way the steam beat's rate follows the wheels),
   silent while standing, heard from the team's section; list the new ids among the sounds
   the game plays. Depends on 2-4.

## Database and persistent storage

No new database table, bucket, KV key or browser storage.

- **Saved maps (existing format, R2 map files).** A consist entry and a bus already store a
  `vehicleKey` with its parameter selection (`{ vehicleKey, reversed, params }`). The new
  vehicles store their species and count there, e.g. `params: { animal: "mule", team: "4" }`;
  nothing new in the schema. Which end the team is hitched to is **not** stored: it follows
  the consist's running direction and is recomputed after load.
- **Removed id.** `proc-vehicle-horse-tram` disappears from `vehicles.meta.json` with no
  legacy mapping. Maps that name it lose the vehicle (whatever the game does today for an
  unknown model id); no migration is written, as decided.
- **Imported files (git-tracked, generated).** `db/procedural/vehicles.meta.json` gains the
  twelve vehicles, their `game.variants` per species x count, and a rig marker for the
  re-hitchable team section; `db/procedural/text/` gains their texts; `db/sounds/` gains the
  hoof and call designs (re-imported from rail-island-music). The animals are in the factory's `catalog.json` only, in no game
  meta file.
- **Sound designs (rail-island-music, git-tracked source; its export is generated).** Two new
  designs in a new Animals category. Their ids and parameter names are **permanent once the
  game plays them**, so `hoof-beat`, `animal-call` and their parameter names (`rate`, foot,
  size, stride, count, `species`, `pitch`, `call`) are decided here. Reference recordings are
  stored in git as excerpts with their licences. The factory's committed copy of the designs
  is refreshed by its own sound import.
- **Factory permanent registries.** New ids in `generator/catalogModels.json` once confirmed
  and in `generator/openttdIds.json` via `pnpm openttd:ids`. The horse tram's OpenTTD ids stay
  reserved and are never reused, though its model is gone.

## Architecture decisions

- **Team baked into the vehicle, not a separate consist vehicle or a runtime composition.**
  One mechanism covers rail, tram and bus, keeps thumbnail, LOD and catalog page showing the
  real team, and reuses the existing parameter and `game.variants` machinery the game already
  reads. The cost: every animal-drawn design carries species x count variants, and the turnback
  needs new game logic.
- **Species and count as parameters on every vehicle.** Maximum freedom for the player, at
  the price of odd pairings (an elephant before a mine tub) and many variants to build and
  test.
- **Derived game properties.** Twelve designs x six species x up to five counts are too many
  to state by hand; one species table keeps them consistent and testable.
- **Animals as their own category, not characters.** True-size draft animals and harness
  conflict with the characters' 1.8 m height class and six walk-mode clips.
- **Team changes ends at turnback** instead of forbidding stub lines or letting a horse be
  pushed: historically correct and keeps every existing track layout usable.
- **The hoof beat is an engine-slot loop driven by a rate**, the steam beat's pattern, so the
  game's existing engine playback (runtime `rate`, distance from the listener, voice limit)
  carries it; only the rate's source (speed over stride) is new. One parametric design for
  all six species, not one per species: fewer permanent ids, and the species differences are
  character values the factory pins.
- **The animal call as the horn slot**, so the player's Horn and the departure call work with
  no new game slot.
- **Count "none" as the trailer** instead of separate trailer designs: one design per vehicle.

## Weaknesses and risks

- **Variant explosion.** 6 species x up to 5 counts per vehicle across 12 vehicles means
  hundreds of combinations; the factory's test must sample them within its 5-minute limit and
  each must fit the family's triangle budget with six animals drawn. Mitigation: per-species
  LOD of the team, sampling like other parametric designs. Likelihood high, cost medium.
- **Team width.** Three pairs of oxen or two pairs of horses abreast are wider than a narrow
  gauge mine tub's track or a narrow road lane; they may overhang adjacent tracks. Open
  question: should the count values offered also depend on the vehicle (a mine tub limited
  to 1-2)?
- **Turnback re-hitch.** New consist logic in the game (which end, how the switch looks -
  instant or walked round, effect on the platform stop length and the train's total length).
  Likelihood medium of follow-up bugs; covered by the deterministic train harness.
- **Long teams and stations.** A 6-animal team adds 10+ m to a short car; platform fit and
  stopping position must count the team. The horse tram today already counts it as a section.
- **Animals walking on curves and switches.** The team is a front section on lone supports;
  on tight curves and points a long team may cut across. The horse tram's current tests only
  cover one horse.
- **Three-repository order for sound.** rail-island-music lands first, then the factory
  re-imports the designs and maps them, then the game imports both. Out of order, the game
  warns about a slot naming a design it lacks and plays nothing there; harmless but must be
  sequenced.
- **The tram bell.** The animal call takes the horn slot, so the animal-drawn trams lose the
  tram bell they ring today. Open question: keep the bell for trams and give the call only to
  the player's Horn?
- **Reference recordings.** Freely licensed camel and elephant recordings are scarcer than
  horse or cow; a call may end up modelled with fewer measurements (stated in its docs).
- **Many hooves.** A six-ox team or several teams in view may blur into noise or crowd the
  voice limit; the count parameter thins the footfalls rather than adding voices, and the
  design is one voice per vehicle whatever the count.
- **Dropped id.** Players with the horse tram on a saved map lose it without notice. Accepted
  by the user.
- **Factory rule exception.** The factory's rules forbid removing a shipped model id or a
  confirmed catalog id; this change removes `proc-vehicle-horse-tram` on the user's explicit
  decision. Its OpenTTD ids remain reserved.
- **Odd pairings** (any species on any vehicle) are allowed by design; not a defect.

## Out of scope

- Animals as game decorations (grazing, standing at stations) or as walk-mode characters.
- Ox, water buffalo and Bactrian camel; other draft animals (dogs, reindeer, llamas).
- Animal-drawn ships (canal boat towing) and cable-hauled or animal-powered machinery.
- Riding animals (a single horse with a rider on the road).
- Animal care, feeding or fatigue in the simulation.
- Backward compatibility for `proc-vehicle-horse-tram`.
