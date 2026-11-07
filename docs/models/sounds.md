# Sounds

**Covers** - which sound each model makes: the slots (a vehicle's horn and
engine, a building's bell), the table that states them by hand and what is
derived from a vehicle's traction, weight and hull length, the character parameters a slot pins and
the runtime ones the game sets, the variants' overrides, the checks, the export,
the bells, and the factory's committed copy of the sound designs
(`pnpm import:sounds`).
**Code** - `generator/soundMapping.ts`, `generator/soundTable.ts`,
`generator/importSounds.ts`, `generator/draftAnimals.ts` (the team's figures the hoof beat pins), `generator/catalog.ts` (`gameWithSounds`,
`ExportedGame`), `sounds/`,
`test/soundMapping.test.ts`
**See also** - [game-properties.md](game-properties.md),
[../site/catalog-site.md](../site/catalog-site.md) (the Sounds column and block),
[export.md](export.md); in rail-island-music, `docs/sounds/sounds.md` (the
designs); in the game, `docs/gameplay/sounds.md` (when each slot plays)

## The split

Three repositories share the sounds:

| Repository | Owns |
|---|---|
| rail-island-music | how each sound sounds: the design, its parameters and ranges |
| the factory (here) | which design each model plays in each slot, and the character values pinned for it |
| the game | when a slot plays and the values it sets as it plays: a horn's call, an engine's revs |

The game imports the designs from rail-island-music itself (its
`pnpm import:sounds`) and the mapping from here (its `pnpm import:factory`).
The two imports are separate: the game warns about a slot naming a design it
does not have, and plays nothing there.

## Slots

| Slot | On | Plays | The game sets |
|---|---|---|---|
| `horn` | rail and road vehicles, ships | a one-shot | `call` (why it sounds), where the design has one |
| `engine` | rail and road vehicles, helicopters | a loop | `rpm`, `load`, `state` (a diesel's revs, effort and whether it runs), `rate`, `intensity` (a steam beat), `speed`, `load` (an electric's share of its top speed and effort) or `spin`, `load` (a helicopter rotor's speed and effort), whichever the design has |
| `bell` | buildings | a one-shot | nothing |
| `call` | animal-drawn vehicles | a one-shot, played only by the player's Horn (in place of `horn`) | nothing |

A slot is `{ id, params?, calls? }`: a rail-island-music design id and the
values of its **character** parameters pinned for this model (pitch, size,
strikes, chime, level, ...). The runtime parameters above are the game's; pinning
one fails the build.

`calls` is a horn's list of the calls the game makes on it **by itself**:
`departure` (moving off from a platform, or a tram from a stop), `crossing`, `tunnel`. A call the model
does not list is silent: the game plays nothing for it, so a model with no
`calls` sounds no horn of its own accord. The player's Horn (`player`) always
sounds and is never listed. The check refuses a call the design's `call`
parameter lacks, `player`, a duplicate, and `calls` on a design with no `call`
(a ship's horn, a bell).

## Stated by hand: `generator/soundTable.ts`

`SOUND_TABLE` states every slot that is not derived, keyed by the exported model
id, with per-variant overrides keyed by the variant's non-default parameters (the second entry is an illustration, not in the table):

```ts
"proc-building-tower-bigben": { sounds: { bell: { id: "big-ben", params: { chime: "quarters" } } } },
"proc-vehicle-cd-750": {
  sounds: { engine: { id: "diesel-engine-two-stroke", params: { size: 0.9 } } },
  variants: [{ params: { livery: "cd753" }, sounds: { horn: { id: "loco-horn", params: { pitch: 240 } } } }],
},
```

The table sits apart from the designs on purpose. A design module is bundled into
each of its models' JS files, so a sound stated on the design would rewrite every
model of that module (all eight towers for Big Ben's bell) though none of them
changed. For the same reason the sound types (`SoundSlot`, `SoundMapping`,
`SoundOverride`) live in `soundTable.ts`, not `design.ts`: `design.ts` is bundled
into every model, and even a type added to it changes how esbuild names the
minified identifiers of all of them. A model's JS therefore never changes for its
sounds. A design that sets `game.sounds` itself fails the build.

The four helicopters run rail-island-music's `helicopter` loop in their engine slot, stated
in the table with their rotor `size` (0 a 10.2 m rotor, 1 a 21.3 m one: the Bell 206 0, the
H145 0.07, the S-92 0.63, the Mi-8 1) and their main `blades` (2, 5, 4, 5). The game sets
`spin` (the rotor's speed, 0 stopped to 1 full; a runtime engine parameter, never pinned)
and `load`.

## Derived defaults

The table lists only the slots that differ. Every other vehicle slot is derived
at export (`derivedSounds`), so every exported vehicle carries explicit sounds and
the game keeps no rule of its own:

| Vehicle | Horn | Engine |
|---|---|---|
| rail, `traction: "steam"` | `steam-whistle`, pitch 880 Hz (40 t) to 520 Hz (140 t); calls `departure`, `crossing`, `tunnel` | `steam-chuff` |
| rail, `traction: "diesel"`, group `unit` (a railcar, a DMU) | `loco-horn` by weight, as below; calls `crossing`, `tunnel` | `diesel-engine-railcar`, size 0 (40 t) to 1 (140 t) |
| rail, `traction: "diesel"`, any other group (a locomotive) | `loco-horn`, pitch 370 Hz (40 t) to 220 Hz (140 t); calls `crossing`, `tunnel` | `diesel-engine-shunter` under 80 t (`MAINLINE_TONNES`), `diesel-engine-mainline` from 80 t; size 0 (40 t) to 1 (140 t) |
| rail, `traction: "electric"`, top speed 200 km/h or more (`HIGH_SPEED_KMH`) | `loco-horn` by weight; calls `crossing`, `tunnel` | `electric-engine-shinkansen` (the TGVs, the Shinkansen) |
| rail, `traction: "electric"`, group `unit` | `loco-horn` by weight; calls `crossing`, `tunnel` | `electric-engine-converter` (three-phase converters) |
| rail, `traction: "electric"`, any other group (a locomotive) | `loco-horn` by weight; calls `crossing`, `tunnel` | `electric-engine-resistor` (blowers, gears, the controller's notches) |
| rail, group `tram` | `tram-bell`; calls `departure` | none |
| every other rail vehicle (metro, coaches, wagons) | `loco-horn` by weight; calls `crossing`, `tunnel` | none |
| ship | `ship-horn`, pitch 196 Hz (20 studs) to 70 Hz (120 studs), 0.7 to 2.2 s; the world fleet's steamships state a `steam-whistle` in the table ([world-ships.md](world-ships.md)) | - |
| road vehicle, group `bus` | none | `diesel-engine-bus`, as measured (no size) |
| road vehicle, group `truck` | none | `diesel-engine-truck`, as measured (no size) |
| aircraft, cable cars | none | none (the helicopters state theirs in the table, below) |

Only a steam locomotive whistles as it leaves a platform (`STEAM_CALLS`) and a
tram rings its bell as it moves off from a stop (`TRAM_CALLS`, the two short
rings of a Czech tram driver); every other rail vehicle leaves quietly
(`HORN_CALLS`). The tram bell has no `crossing` or `tunnel` call, so a tram
rings for nothing else by itself.

An electric's motors are derived from its group and its top speed
(`electricEngine`; a variant's own `maxspeed` re-derives it). The table states
the electrics whose equipment differs: the three-phase CD 169 and OBB 1012 and
the ICE 1 (whose converters the design was measured from) run
`electric-engine-converter`, the 1960s resistor unit CD 451
`electric-engine-resistor`. The game sets `speed` (its share of the vehicle's
top speed) and `load`; nothing is pinned.

The horns, whistles and steam beats are the rules the game used to apply itself
(its `hornSpecFor`, `dieselDriveFor` and `shipHornFor`), moved here unchanged.
A diesel's engine is one rail-island-music design per engine (`dieselEngine`,
`roadEngine`): the catalog group and the weight pick which one; a model whose
engine is another kind (a big two-stroke, `diesel-engine-two-stroke`) states it
in the table. By that rule CD 749 (72 t), CD 750 (74 t) and T 499.0 (76 t) run
the shunter's six. The engines' `state` (whether it runs) is the game's, like
their revs, and never pinned. A coach has a horn because a consist without a locomotive sounds its
first car's. A ship's hull is measured as the game draws it
(`shipHullStuds`): a ship standing in for an old model takes the old model's
length (the legacy table scales it to that, [legacy-mapping.md](legacy-mapping.md)),
any other its own length at its `game.scale`, at 1.5 studs to the metre.

### Animal-drawn vehicles

A design with the team's two parameters (`animal`, `team`; [draft-animals.md](draft-animals.md))
takes its slots from its team, per selection (`teamSounds`, `withTeamSounds`): its `engine` is
rail-island-music's `hoof-beat` with the species' `foot` (`hoof`, `cloven`, `padded`), `size` and
`stride` and the team's `count` pinned - the game sets the footfall `rate` from the speed and the
stride - and its `call` is `animal-call` with the species pinned, which the game plays only on the
player's Horn. A tram keeps the derived tram bell on departure; a horse railway's car and a road
coach have no `horn`. The trailer (team `none`) has neither engine nor call. Every other species
and team selection carries a variant with the slots that differ from the default's.

## Variants

The export writes a variant's sounds into its `game.variants` entry
([game-properties.md](game-properties.md)): the slots that change for that
selection, `null` dropping one (`withSounds`):

- `game.sounds` holds every slot of the default model, stated or derived;
- a variant whose weight differs gets the slots that re-derive differently, such
  as a heavier livery's deeper horn (CD 163's `cd362`, 87 t);
- a slot the table states for the design is not re-derived per variant;
- a variant the table lists wins over both; one that `game.variants` lacks is
  appended with its parameters and sounds alone.

`soundsFor(game, selection)` applies the override of the variant matching a
selection, the way the game and the site read it.

## Bells

Every church, cathedral and bell tower has its bell in the table:

| Model | Bell |
|---|---|
| Baroque Church | `church-bell` 440 Hz, 3 strikes |
| Vrchlabi Church | `church-bell` 494 Hz, 3 strikes |
| Twin-Tower Baroque Church | `church-bell` 392 Hz, 4 strikes, 1.8 s apart |
| St Nicholas Church | `church-bell` 330 Hz, 4 strikes |
| St Basil's Cathedral | `church-bell` 262 Hz, 5 strikes, 1.4 s apart |
| Prague Castle (St Vitus) | `church-bell` 220 Hz, 4 strikes, 3 s apart, ring 1.4 |
| Notre-Dame | `notre-dame-bell` |
| Bell Tower | `church-bell` 587 Hz, 3 strikes |
| Big Ben | `big-ben`, the Westminster Quarters first |

The bigger the church, the deeper the bell. The game tolls one when the building
comes into view near the camera.

## Checks

`checkDesignSounds` runs with `checkGameProperties` for every design when the
meta is built:

- a design must not set `game.sounds` itself;
- a vehicle may use only `horn` and `engine`, a building only `bell`, and a
  building's bell has no variants;
- a slot's design must be in the factory's copy of the sounds, of the slot's kind;
- a pinned parameter must exist, be in range (or a listed choice) and not be a
  runtime one;
- a table variant must be a real, non-default parameter selection.

A full export also fails on a table id that names no model (`unknownTableIds`).
The build fails, naming the design and the slot. `test/soundMapping.test.ts`
covers each refusal, the derived defaults, the variants and the bells.

## The factory's copy of the designs

`pnpm import:sounds` builds the sibling rail-island-music checkout
(`../rail-island-music`, or `MUSIC_DIR`) and mirrors its `export/sounds/` onto
the committed `sounds/`:

| File | Read by |
|---|---|
| `sounds.meta.json` | the build's checks (`generator/soundMapping.ts`) |
| `sounds.js` | the site, which plays a model's slots on its page |
| `sounds.d.ts` | both, for the types |

Nothing else needs the music checkout. Never edit `sounds/` by hand: change the
design in rail-island-music and re-import. After an import, `pnpm build:models`
checks the mapping against it.

## Exported

Each meta entry's `game` carries `sounds`, and each variant's the slots that
change:

```json
"game": {
  "weight": 85, "power": 3480, "maxspeed": 120, "accel": null,
  "sounds": { "horn": { "id": "loco-horn", "params": { "pitch": 303 } } },
  "variants": [
    { "params": { "livery": "cd162" }, "maxspeed": 140 },
    { "params": { "livery": "cd362" }, "weight": 87, "power": 3060, "maxspeed": 140,
      "sounds": { "horn": { "id": "loco-horn", "params": { "pitch": 300 } } } }
  ]
}
```

(the CD 163: its 87 t livery's horn is 3 Hz deeper)

Every vehicle's entry has `sounds`, possibly `{}`; a building's only when it
has a bell. `catalog.json` inherits it.
