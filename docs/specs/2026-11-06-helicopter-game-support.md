# Helicopter game support

Status: agreed
Date: 2026-11-06
Area: rotor kit and world rotorcraft, game properties and vehicle meta export, airport set (and any new heliport set or props), OpenTTD GRF export, catalog confirmation; the game (`rail-island-webapp`) consumes the result

## Context of the change

The factory already draws four helicopters on the rotor kit (`generator/rotorKit.ts`,
`generator/worldRotorcraft.ts`): Sikorsky S-92, Airbus H145, Mil Mi-8 and Bell 206
JetRanger. Their main rotor and tail rotor (or fenestron) are the parts `rotor` and
`tailrotor`, turned by the `time` clip `rotor` (docs/models/world-aircraft.md,
docs/models/animation.md). All four are drafts: none of their ids is in
`generator/catalogModels.json`, so no game meta file carries them yet.

To the game they are ordinary aircraft. Their `game` block (`air()` in
`generator/worldAircraft.ts`) has the four running figures, `sizeClass: "small"` (the
smallest airport class) and `seatFrac`. Nothing says the vehicle takes off vertically,
hovers, or can land off-airport (docs/models/game-properties.md).

The `airport` set (`generator/sets/airport.ts`, registry in `generator/sets/registry.ts`)
has three types: `grass_field`, `regional` and `international`. There is no helipad or
heliport type and no helipad prop (docs/models/props.md).

The OpenTTD GRF encoder (`src/openttd/grf.ts`) writes every aircraft with property 09 = 2
(a plane). It has no helicopter subtype, so in OpenTTD the helicopters also need an
airport (docs/site/openttd-export.md).

rail-island-music has no rotor sound, and `soundMapping.ts` derives no aircraft sound
(docs/models/sounds.md).

The game repository is not part of this change. This spec covers what the factory exports
and what the game is expected to do with it.

## User request

"I want to support helicopters in the game."

## Decisions

### Four helicopter models already exist, but the game flies them like planes from airports. What should 'support helicopters' cover?
| Option | What it means |
|---|---|
| Full helicopter role | Helicopters become their own vehicle class: game properties for vertical take-off, landing and hover; heliports and helipads they use without a runway; the four models confirmed. The biggest change, touching both repositories. |
| Heliports only | Helipad and heliport structures so helicopters can operate off-airport; game properties unchanged. |
| Model-side only | A rotorcraft flag and figures in the export plus confirmation; the game decides later. |
| More helicopter models | Fleet breadth on the rotor kit. |

**Answer: Full helicopter role.**

### Should OpenTTD's helicopter subtype be part of this change?
| Option | What it means |
|---|---|
| Yes, write the subtype | Property 09 written as a helicopter, so they use OpenTTD heliports, oil rigs and helipads; the ids stored in saved games stay unchanged. |
| No, defer it | The OpenTTD export stays as it is. |

**Answer: Yes, write the subtype.**

### How should a helicopter's game properties tell the game it's a rotorcraft?
| Option | What it means |
|---|---|
| Kind flag + flight figures | `aircraftKind: "helicopter"` on the design plus a few stated figures (vertical climb rate, cruise height, the pad size it needs); the game flies vertical take-off, hover and landing from them; the build refuses the figures on anything but a helicopter. |
| Kind flag only | Only the flag; the game derives climb, height and pad size from weight and size. |
| New sizeClass value | `sizeClass: "heli"` next to small/medium/big; mixes which airport with how it flies. |

**Answer: Kind flag + flight figures.**

### Where should helicopters land, as structures in the game?
| Option | What it means |
|---|---|
| Heliport airport type | A new `heliport` type in the airport set: pads, a small terminal, a windsock, no runway; reuses the airport collectible and layout. |
| Helipad on buildings | A rooftop or ground pad the game attaches to chosen buildings (hospital, skyscraper, offshore platform) as a helicopter stop. |
| Pads at existing airports | Regional and international airports also get helipads, so helicopters do not take the runway. |
| Offshore platform | A standalone oil-rig helideck at sea, as OpenTTD has. |

**Answer (multi-select): all four - Heliport airport type, Helipad on buildings, Pads at existing airports, Offshore platform.**

### How should a building say it has a helipad the game can use as a helicopter stop?
| Option | What it means |
|---|---|
| Declared on the building | A building with a pad states a `helipad` game property (the pad's centre, size and height on the model) and draws the pad itself (H marking, edge lights); the game finds it in the exported meta, as it does party walls. |
| Prop the game places | A `proc-prop-helipad` model the game puts on any flat roof it picks; any building, but it may not fit the roofline. |
| Both | Chosen landmarks declare a drawn pad; other flat roofs may get the prop. |

**Answer: Declared on the building.**

### How should the rotors animate in the game?
| Option | What it means |
|---|---|
| State drive: stopped to spinning | Keep the time clip for turning and add a `spin` state drive (0 stopped, blades drooping a little; 1 full speed); the game spins up before lift-off and down after landing. |
| Keep the time clip | The rotors always turn; the game only starts and stops the clip. |
| Add rotor blur discs | A state drive plus a translucent blur disc at full speed, to cut flicker at a distance. |

**Answer: Add rotor blur discs** - the state drive from stopped to spinning, plus a translucent blur disc shown at full speed.

### Which vehicles count as helicopters, and do the four models get confirmed?
| Option | What it means |
|---|---|
| The four, confirmed | S-92, H145, Mi-8 and Bell 206 get the helicopter kind and are confirmed into the catalog; the Zeppelin NT stays an aircraft; no new models. |
| The four + Zeppelin as VTOL | The airship also uses heliports and pads, with its own kind `airship`. |
| The four + new types | Also add more helicopters (Chinook, EC135, Mi-26) in this change. |

**Answer: The four, confirmed.**

### There's no hospital or oil rig in the factory yet. Which buildings should carry a declared helipad?
| Option | What it means |
|---|---|
| Skyscrapers via a parameter | Flat-roofed skyscrapers get a `helipad` parameter (none / roof pad); a new parameter value leaves a shipped model's defaults unchanged. |
| New hospital building | A new hospital model (a draft first) with a ground or roof pad, the air-ambulance stop. |
| New offshore platform model | The oil-rig helideck as a new model (an industry building at sea) with a declared pad, rather than an airport type. |

**Answer (multi-select): all three - Skyscrapers via a parameter, New hospital building, New offshore platform model.** This settles the earlier "Offshore platform" landing choice: it is a model with a declared helipad, not an airport type.

### Who draws the helipads at regional and international airports, and the pads of the heliport type?
| Option | What it means |
|---|---|
| The airport set module | The airport set gains a helipad function (pad boxes, H marking, lights in the set's box vocabulary) placed by the module; the game's layout solver reserves the space; the set's pins move on purpose. |
| The game's layout solver | The factory exports only a `proc-prop-helipad` prop; the game places it. |

**Answer: The airport set module.**

### Helicopters have no sound today (rail-island-music has no rotor design). What about sound?
| Option | What it means |
|---|---|
| Request a rotor design, wire the slot | Record a request to rail-island-music; once a design exists, wire an engine slot through the sound table; silent until then. |
| Out of scope | Sound is a separate change later. |

**Answer: "create sound, I added music repo"** - the rotor sound is designed in rail-island-music as part of this work (the repository is now attached to the session), not merely requested.

### What should a game build that doesn't yet know `aircraftKind` do with the helicopters?
| Option | What it means |
|---|---|
| Keep sizeClass small as fallback | Helicopters keep `sizeClass: "small"`; an older game still flies them from airports like planes; a newer game ignores it for helicopters. |
| Drop sizeClass for helicopters | Cleaner data, but the factory export and the game update must land together. |

**Answer: Drop sizeClass for helicopters.**

### rail-island-music has no aircraft sounds or category yet. What should the helicopter sound be?
| Option | What it means |
|---|---|
| One 'helicopter' loop, sized | A new `aircraft` category with one `helicopter` engine loop (blade slap plus turbine whine); `size` and `blades` pinned per model; the game drives `spin` (0..1 rotor speed) and `load` (climb effort); all four share it. |
| Separate rotor and turbine | Two designs in two slots; mixes better up close, but a new slot kind in the game. |
| Per-model designs | One design per type; most authentic, four times the work. |

**Answer: One 'helicopter' loop, sized.**

### Should the game's own flight changes be specified here, or only the factory and music contract?
| Option | What it means |
|---|---|
| Include game plan | The spec also plans the game side at a high level: helicopter legs, helipad stops, reading the new properties. |
| Factory and music only | The spec stops at the export; the game gets its own spec later. |

**Answer: Include game plan.**

### How should a helicopter's save point at helipads on buildings and airports?
| Option | What it means |
|---|---|
| Tagged stops | A `stops` list of `{ kind, id, pad }` beside `airports`; old saves converted on load; airport layouts gain a persisted `pads` list. |
| Pads as stands | A helipad is another stand; a building pad gets a synthetic airport record. |
| Separate helicopter record | Helicopters save in their own `helicopters` list with their own fields; a clean split. |

**Answer: "Separate helicopter record, make it clean. Helicopters don't exist now, don't solve migration"** - no game save holds a helicopter today (the four models are drafts, so the game never received them), so the new record needs no migration.

### Today's OpenTTD saved games may hold the four helicopters as planes. With the subtype written, what about those players?
| Option | What it means |
|---|---|
| Same ids, new subtype | Keep each helicopter's OpenTTD id and write property 09 as a helicopter; OpenTTD re-reads the GRF on load; one in flight may need re-routing; the ids file is unchanged. |
| New ids, old ones hidden | New ids for the helicopter versions, the plane versions hidden from purchase; spends ids and leaves duplicates. |

**Answer: Same ids, new subtype** - then refined by the user: "make it clean, now there are no helicopters exports to OpenTTD". The helicopters are drafts, so no released GRF and no player's saved game holds them. They are written as helicopters from the start, with no compatibility handling for a plane version.

## High-level plan

1. **Helicopter properties (factory).** Helicopters become their own aircraft kind in the
   game properties: `aircraftKind: "helicopter"` with stated flight figures (vertical climb
   rate, cruise height, the pad size it needs), and no `sizeClass`. The build checks that
   every helicopter states them and refuses them on anything else. The four designs (S-92,
   H145, Mi-8, Bell 206) state their figures from their published data. The Zeppelin NT
   stays an ordinary small aircraft. The figures are exported in the vehicle meta and
   documented in the game properties document.
2. **Rotor animation (factory).** A `spin` state drive on the rotor kit, from stopped
   (blades drooping slightly, not turning) to full speed. The existing time clip still
   turns the blades, and at full speed a translucent blur disc shows over each rotor so it
   does not flicker at a distance. The low level of detail carries the disc. Depends on 1
   only for documentation.
3. **Helicopter sound (music, then factory).** rail-island-music gains an `aircraft`
   category and one `helicopter` engine loop: blade slap plus turbine whine, with `size`
   and `blades` as character parameters and `spin` and `load` as runtime ones. The factory
   imports it and derives or states each helicopter's engine slot with its pinned
   character values. The engine slot on aircraft is new to the sound slot table.
4. **Landing places (factory).**
   - The airport set gains a `heliport` type: pads with an H marking and edge lights, a
     small terminal and a windsock, no runway. Regional and international airports also
     get helipads beside their terminal. All pads are drawn by the set module, and the
     game's layout solver reserves their space. The set's pins move on purpose.
   - Flat-roofed skyscrapers get a `helipad` parameter (none, the default, or a roof pad)
     that draws the pad and declares it.
   - A new hospital building (a draft) with a pad, and a new offshore platform model (an
     industry building at sea with a helideck, a draft). Both declare their pad.
   - A declared pad is a `helipad` game property on the building (centre, size and height
     on the model), exported in the building meta like party walls.
   All new exported text carries the 13 translations.
5. **OpenTTD (factory).** The GRF encoder writes the four helicopters with the
   helicopter subtype (property 09) from their first export, with no plane version and
   no compatibility handling. Everything else stays a plane.
   The OpenTTD export document drops its "helicopters are planes" note.
6. **Confirmation (factory).** Once 1-5 are in and the user has seen the images, the four
   helicopters, and later the hospital and the platform, are confirmed into the catalog
   list, which is when the game first receives them.
7. **Game (rail-island-webapp).** Helicopters become their own simulated vehicle with
   their own saved record. The legs are spin-up, vertical lift-off, transit at the stated
   cruise height, approach, hover, vertical landing and spin-down. The stops are pads:
   heliport and airport pads, and the declared pads on buildings. The game reads the kind
   and flight figures, picks pads that fit the stated pad size, drives the `spin` clip and
   the sound's `spin` and `load`, and lays out the airport set's pads. The game's own
   aircraft documents gain the helicopter rules. This depends on 1, 2, 4 and 6, and on 3
   for sound.

## Database and persistent storage

There is no database. The data below persists in exports, saved maps and saved games,
and that persistence is the cost of the change:

- **Game saved maps: a new `helicopters` list** (rail-island-webapp), beside the aircraft
  list. Each record: `id` (number), `name` (string | null), `vehicleKey` (model id),
  `stops` (ordered list of `{ kind: "airport" | "building", id, pad }`: an airport id
  or a placed building's id, plus the pad's index on it), `stopWaitTimes` (per stop, or
  null), `running` (bool), position `x`, `y`, `z`, `heading`, `pitch`, and `padStop`
  (the stop it is parked on, or null). Written and read by the game's save. Lives as long
  as the map. **No migration**: no save holds a helicopter today.
- **Game saved maps: airport layouts** gain a persisted `pads` list beside `stands`
  (each pad's position, heading and size), written by the layout solver. Old layouts
  without it read as having no pads until they are solved again.
- **Set ids stored in saved maps:** the new airport type id `heliport`. Never renamed
  once shipped.
- **Model ids stored in saved maps:** the hospital and the offshore platform (ids chosen
  when they are built). Never renamed once shipped.
- **Parameter values stored in saved maps:** the skyscrapers' `helipad` parameter
  (`none` / `roof`). Its default `none` keeps every placed skyscraper as it is.
- **Factory export (vehicle and building meta, read by the game's import):** the
  helicopters' `aircraftKind` and flight figures, no `sizeClass`; the buildings'
  `helipad` property; the helicopters' `sounds.engine` slot.
- **Factory `build-cache/`:** refreshed for every changed design (a generated cache).
- **rail-island-music export (sounds meta and module, imported by factory and game):** the
  new design id `helicopter` and category `aircraft`. Never renamed once shipped.
- **OpenTTD saved games:** none holds a helicopter yet, because no GRF has exported
  them. Their ids in `generator/openttdIds.json` stay as assigned (ids are never
  edited), and they ship as helicopters from the start.

## Architecture decisions

- **A kind with flight figures instead of a new size class.** How a vehicle flies is
  separate from which field fits it. A `sizeClass: "heli"` would have put two meanings in
  one field and still left the game guessing climb rate and pad size.
- **No `sizeClass` on helicopters.** Cleaner data, chosen over a fallback for older
  games. The factory export and the game update are meant to land together (see risks).
- **The set module draws the pads.** Pads at airports follow the same rule as the
  terminal: the module says what a type is and the game's solver says where it fits.
  Pads therefore stay deterministic, pinned and shared with the site preview, and the
  game never has to invent geometry.
- **Building pads are declared on the building, not dropped in as a prop.** A drawn pad
  fits its roofline, and the game finds it from meta exactly as it finds party walls.
- **The offshore platform is a model, not an airport type.** It is a destination at sea
  with one helideck, not an airfield, so it fits the building and industry pattern.
- **A separate helicopter record in the save.** Helicopters fly different legs and stop
  at different places from aircraft. Sharing the aircraft record would have meant
  synthetic airports for building pads. With no saves to migrate, the clean split costs
  nothing now.
- **One shared sound design with pinned character.** The four types sound distinct
  through `size` and `blades`, with one design to tune, instead of four designs or a new
  slot kind.
- **Helicopters from their first OpenTTD export.** No GRF has carried them, so there is
  no plane version to stay compatible with. The subtype is simply written, and the ids
  already assigned are kept, as the ids rule requires.

## Weaknesses and risks

- **Dropped `sizeClass` versus an older game.** If the factory export reaches the game
  before the game knows `aircraftKind`, the game derives a class from the measured span,
  the rotor diameter of 10 to 21 m (`aircraftSize`), and keeps flying helicopters as
  planes. This is likely only if confirmation (step 6) happens before step 7. The cost is
  low and visible. Mitigation: confirm the helicopters only once the game side is ready,
  or ship both together.
- **Game work dominates.** New legs, pad routing, building stops and a new saved record
  in AircraftSim (about 6,500 lines in the air module) are far more work than the factory
  side. It may need its own spec in the game repository when implementation starts.
- **The OpenTTD helicopter subtype.** The encoder has never written it. Open question:
  whether the preview prerender (which places an aircraft at a small airport's terminal)
  should show helicopters at a heliport instead.
- **Rotor blur disc.** A translucent disc can sort wrongly against glass and water and
  adds draw calls. Medium likelihood. Mitigation: one disc per rotor, drawn in the
  existing transparent pass and checked headlessly at several distances.
- **Set pins and skyscraper models move.** The airport types' pins move on purpose. The
  skyscrapers' default models must not change, because the new parameter defaults to
  `none`, and the build-cache check guards that.
- **Pad size versus layout.** The pad size each helicopter states has to agree with the
  pads that the airport module and the buildings draw. Open question: one pad size class
  per pad (small / large), or a size in studs matched against the helicopter's figure?
- **Sound scope.** The music repository's checkout in this session is on a `claude/*`
  branch, not master. The design lands on master there, and the factory then runs its
  sound import.
- **Open questions:** the hospital's and the platform's ids and looks (a separate model
  brief each), the flight figures' units and ranges, and whether the airship should later
  share the pads.

## Out of scope

- New helicopter types (Chinook, EC135, Mi-26) and new helicopter liveries.
- The Zeppelin NT as a vertical-landing vehicle; it stays an ordinary small aircraft.
- Migrating game saves: no save holds a helicopter.
- Publishing to the game (the webapp's import of the export folder) as part of a
  factory change.
- A helipad prop that the game places on arbitrary roofs.
