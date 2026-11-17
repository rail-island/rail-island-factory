# Parade ships, aircraft and cable cars

Status: agreed
Date: 2026-11-17
Area: rail-island-factory (parade list, parade.json, parade renderer, overview page), web-railisland-com (hero TrainParade)

## Context of the change

railisland.com's hero runs one vehicle chain at a time across a thin landscape strip
(`TrainParade.astro` in web-railisland-com). The factory picks and draws the chains:
`TRAIN_PARADE` in `generator/trainParade.ts` lists a hundred rail and road chains,
`generator/writeParade.ts` renders every car as a side-view WebP and writes
`parade.json` (docs/site/train-parade.md). The caption under the track already counts
ships, aircraft and cable cars (`fleet.types`), but none of them ever runs.

What stands in the way today:

- Every image covers one fixed 6.3 m window (0.3 m below the rail to 6.0 m above) at
  32 px/m, and the site draws every chain at one scale so lengths compare. Confirmed
  ships are 33-290 m long and up to 70 m tall, aircraft 9-79 m long and up to 23.5 m
  tall; cable cabins are 2-4 m long but 5-7 m tall with their hanger.
- `resolveTrains` accepts only the catalog's side-view categories (Rail and Road
  vehicles); widening `SIDE_VIEW_CATEGORIES` would change every catalog thumbnail.
- The website reads a single global `pxPerM` / `heightM`, treats every ground that is
  not `road` as rails, and rejects any `version` but 1.
- Cable car stations exist as a set (`generator/sets/cableCarStation.ts`, four types
  with a rope head, bull wheel and platform; docs/models/cable-car-stations.md) and the
  cabins are measured for the rope by `generator/cableCarLine.ts`.

No game data and no saved-map ids are involved: the parade is site decoration only.

## User request

"Suggest how to add to parade in web hero ships, aircrafts and cable cars."
After the suggestion: "Add all. Cable cars with stations. Brainstorm it."
After the spec: "Cable car should be 6th, ship 7th, aircraft 8th. Implement the spec"
(this replaces the earlier hold-back of the new kinds until the sixth place).

## Decisions

### How should ships, aircraft and cable cars be scaled against the trains in the hero parade?
| Option | What it means |
|---|---|
| Scale per kind (Recommended) | Ships share one scale, aircraft another, cable cars keep the trains' scale. Lengths compare within a kind; images stay about 200 px tall. |
| Scale per chain | Each chain zoomed to fill the strip; a tug and a liner look the same size. |
| One shared scale | Everything at the trains' scale; only small craft could be listed. |

**Answer: Scale per kind.**

### How should parade.json carry the new vehicles so the live railisland.com does not break before it is updated?
| Option | What it means |
|---|---|
| New craft[] array (Recommended) | Keep version 1; old site ignores the new array. |
| Version 2, coordinated | Bump to version 2 with per-chain scale in one list; live site shows an empty track until the website deploys. |
| Separate file | A second file beside parade.json. |

**Answer: "Don't care about it, 10 minutes downtime is ok. Make it clean"** - read as
version 2 with one list of chains, deployed factory first, website right after; a short
empty track in between is accepted.

### How should cable car stations appear in the parade?
| Option | What it means |
|---|---|
| Stations at both ends (Recommended) | A station stands at each end of the strip in place of the tunnel portals; cabins leave the right one, cross on the rope past a pylon or two, enter the left one. Stations are scenery images rendered by the factory from the set. |
| Station passes mid-strip | The view follows the rope; a station scrolls past and cabins stop at its platform. Needs dwell timing the parade never had. |
| One station, cabins depart | One station at the right end; cabins vanish into the left fade. |

**Answer: Stations at both ends.**

### What does a cable car chain carry?
| Option | What it means |
|---|---|
| By ropeway kind (Recommended) | A gondola or chairlift chain is a string of cabins at a fixed spacing; an aerial tramway is a single big car. Follows the cabin's own ropeway field. |
| Always a string | Several cabins at a spacing, even the aerial tramway car. |
| Always one cabin | One cabin per chain. |

**Answer: By ropeway kind.**

### What scenery should a ship run in?
| Option | What it means |
|---|---|
| Sea band over the ground (Recommended) | Water fades in over grass and rail while a ship passes; the hills stay as the far shore. Ship cut at its waterline, drifting waves, bow wave and wake from new wake emitters, funnel smoke as today. |
| Open sea scene | The whole strip turns to sea with a horizon line. |
| River/canal | A narrow river in front of the landscape. |

**Answer: Sea band over the ground.**

### How should aircraft fly across the strip?
| Option | What it means |
|---|---|
| Level flight, gear up (Recommended) | Level flight in the sky band over the hills, gear retracted, propellers and rotor as a time-driven sprite; rail and grass stay empty. |
| Low pass / landing | Descends with gear down toward the ground line. |
| Taxi on the ground | Rolls on its wheels like a bus. |

**Answer: Level flight, gear up.**

### How many ships, aircraft and cable car chains should join the hundred rail/road chains?
| Option | What it means |
|---|---|
| About 8 / 6 / 4 (Recommended) | 8 ships (mid-size picks plus one or two liners), 6 aircraft (light plane, helicopter, airliners), 4 cable car lines (one per station type). About one chain in six is not on rails or road. |
| Every confirmed one | All 15 ships, 8 aircraft, every cabin; a third of the parade stops being trains. |
| Token few: 3 / 2 / 2 | A taste only. |

**Answer: About 8 / 6 / 4.**

### How should the first round a visitor sees treat the new kinds?
| Option | What it means |
|---|---|
| Keep trains first (Recommended) | The five-train opening stays; ships, aircraft and cable cars are held back until the 6th place, then spread normally. |
| Show one early | One new kind as the 6th chain. |
| No special rule | Spread like any other category after the opening. |

**Answer: Keep trains first.** Revised by the user before implementation: "Cable car
should be 6th, ship 7th, aircraft 8th" - the first round opens with the five trains,
then a cable car line, a ship and an aircraft.

## High-level plan

1. **Contract (factory).** parade.json becomes version 2: one list of chains, each with
   its own ground (`rail`, `road`, `water`, `air`, `rope`) and its own picture window
   (height, bottom edge, pixels per metre) taken from its kind. Three new categories,
   `ship`, `aircraft`, `cableCar`, with speeds, join the play order and the opening's
   hold-back. The list grows by 8 ships, 6 aircraft and 4 cable car lines. The overview
   page at `/parade/` shows the new kinds and their scenery.
2. **Rendering (factory).** The side-view renderer takes a vertical window as well as a
   horizontal one. Ships are drawn above their waterline and carry wake emitters at bow
   and stern; aircraft are posed in flight (gear up) with propellers or rotor as a
   sprite cycled by time; cabins are drawn hanging from the rope. Each cable car line
   also brings its two station images (one station type, drawn from the set at the
   parade's scale, its rope head marked) and a pylon image.
3. **Hero (website).** `TrainParade.astro` reads version 2: scales each chain by its own
   window, fades in the scene its ground asks for - sea band with waves and wake for
   water, empty ground with the plane in the sky for air, the rope line with the two
   stations in place of the tunnel portals and the pylons for rope - and hides the
   portals for water and air. The copied `playOrder` and `carEmitters` are copied again.
4. **Release.** Factory deploys first, website right after; the empty track in between
   is accepted.

Phase 1 comes first; 2 and 3 can proceed in parallel against an agreed version 2 sample.

## Database and persistent storage

Nothing in a database. Two generated files change shape:

- **`parade.json` (factory export, served at factory.railisland.com)** - version 2.
  Global `pxPerM`, `heightM`, `bottomM` move onto each chain (or onto a per-kind table
  each chain names); `ground` gains `water`, `air`, `rope`; `category` gains `ship`,
  `aircraft`, `cableCar`; a rope chain adds the rope height, the cabin spacing and its
  station and pylon images; emitters gain kind `wake`; a sprite may be cycled by time
  (seconds) instead of distance. Read only by railisland.com's hero and the overview
  page; regenerated on every factory build; no migration - version 1 simply stops
  being written.
- **`export/.parade-keys.json` (incremental render cache)** - gains the station and
  pylon images and the per-kind window in each hash. Pure cache, rebuilt when stale.

## Architecture decisions

- **Per-kind scale, not per-chain.** Lengths still compare inside a kind (a tug beside a
  liner reads right), and each kind's window is chosen so images stay about 200 px tall.
  Cable cars keep the trains' scale because cabins and stations fit near it.
- **Version 2 with one list, not a side array.** One shape for every chain, no
  "trains vs craft" split in either repository; the short outage is accepted.
- **The parade gets its own category permission** instead of widening the catalog's
  side-view list, so catalog thumbnails and the build cache of every design stay as
  they are.
- **Stations are factory-rendered scenery**, not drawn in the website, so they match
  the game's set exactly and the website stays a placer of images.
- **On-screen speed is held similar across kinds**: a kind drawn at a smaller scale runs
  proportionally more metres per second, otherwise a liner would crawl.

## Weaknesses and risks

- **Small ships and planes at their kind's scale** may be only a few pixels tall (the
  8 m passenger ferry, the light plane). Mitigation: pick vehicles that read at the
  chosen window; split a kind into two windows only if needed.
- **Time-driven propeller sprites** are new to the parade (all sprites today follow
  distance); a blur disc may look better than frames at this size. Open.
- **Station width at the trains' scale**: a 30-stud station at both ends eats strip
  width on phones; may need to stand partly in the edge fade. Open.
- **Ships' waterline cut** relies on each hull's `draftFrac`; a wrong one shows a hull
  floating or sunk. Visible on the overview page before release.
- **The outage window** between factory and website deploys shows an empty track
  (accepted).
- **Image budget**: 18 new chains plus station images add to the first-load-free lazy
  set; only the running chain's images load, so the cost is per chain, not up front.

## Out of scope

- Any change to the game, its saved data, or the catalog's thumbnails.
- Ships docking at a port, aircraft landing or taxiing, cabins stopping at a platform.
- Making the hero strip taller.
- New ship, aircraft or cabin models; the parade uses confirmed ones only.
