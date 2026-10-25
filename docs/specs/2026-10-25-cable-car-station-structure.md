# Cable car station as one structure

Status: draft
Date: 2026-10-25
Area: factory `cableCarStation` set and `proc-prop-cablecar-shed` prop; the webapp's cable car station builder, mesh and factory import

## Context of the change

Today a cable car station comes from three places:

- **The factory set module** `generator/sets/cableCarStation.ts` holds `TYPE_META` (footprint
  `w x d`, rope-head height `ropeHeadY` and a reference to the shed prop) and `buildPylon(height)`.
- **The factory prop** `proc-prop-cablecar-shed` (`generator/props/cableCarSheds.ts`, about 750
  lines, `type` = gantry / chalet / glass / drive) draws the station hall and the roof it carries
  forward over the platform. It is an ordinary JS model listed in `props.meta.json`, within 5,000
  triangles and a 200-triangle low level of detail. The factory test `shedFouls` keeps it out of
  everything the game builds: the cabin sweep ring, the head, the rope, the platform and the stairs.
- **The game** (`rail-island-webapp`, `src/core/rail/CableCarStation.ts` and
  `src/render/CableCarMesh.ts`) builds the head pedestal, the rotating bull wheel (its own
  `cablecar-wheel` node), the boarding platform and its stairs, and places the shed prop. The
  platform height follows the chosen cabin's door sill (`sillDrop`) and its inner radius the
  cabin's half width (`VehicleCatalog.cabinBoarding`, a 8.3 / 2.0 default before a cabin is
  chosen). Its plan follows the cabin count: three or more cabins circulate and get a curved
  annular sector; one or two get a U of straight slabs.

The platform, its railings, legs and stairs are the same grey deck and steel for every station
type, so they do not match the shed they stand beside (the user's screenshot: a red steel gantry
with a separate grey ring platform on thin posts). The station's look is split between two repos
and tied together only by clearance tests.

## User request

Refactor and simplify the cable car station's factory profile. Now there is a prop, Cable car
station shed, which is probably used in the cable car station structure. There is no need for it;
it should be directly in the structure. Also move the cable car platform and the wheel into the
cable car station structure; now they are probably rendered by the game. So the station structure
should have view parameters passed by the game, settling whether the platform is rectangular or
circular and the height of the platform (according to the cabins). Now the platform does not match
the station very well: each station should have platforms that match the station nicely.

Later: do not save `w`, `d` and `ropeHeadY` to the map. Ignore them in old saves and do not
write them in new saves.

## Decisions

### In what form should the factory hand the whole station (hall, head, wheel, platform, stairs) to the game?
| Option | What it means |
|---|---|
| Set function | The `cableCarStation` set module gains `buildStation(type, view)` returning boxes (and sectors for the curved deck), like `station.furnish()` and `roadStation.dress()`; the game passes the view and draws the result; the shed prop is removed |
| Parametric model | A JS model whose parameters include the platform shape and height; parameters are discrete, so the sill height would be quantized |
| Hybrid | The hall stays a fixed model; the set module only gains the platform, head and wheel, styled per type |

**Answer: Set function.**

### Which view parameters should the game pass?
| Option | What it means |
|---|---|
| Shape, sill, width | `circulating` (ring vs rectangular), `sillDrop` (platform height) and cabin `halfWidth` (deck inner edge); the factory owns the defaults used before a cabin is chosen |
| Shape and sill only | The factory picks a deck inner edge wide enough for every catalog cabin |
| Add cabin length | Also the cabin length, to size the rectangular platform's arms |

**Answer: Shape, sill, width.**

### How should each type's platform match its station?
| Option | What it means |
|---|---|
| Designed per type | Each type draws its own platform as part of the hall: gantry a steel grating with red railings on the red frame, chalet a timber deck on timber posts and brackets, glass a light deck with glass balustrades on the tree columns, concrete a slab on the portal frames; supports reuse the hall's columns, stairs come out of the hall's door, the roof is shaped to the actual platform |
| Shared kit, per-type style | One platform geometry for all types, only materials and colours swapped |

**Answer: Designed per type.**

### What about the bull wheel and head pedestal?
| Option | What it means |
|---|---|
| Factory, wheel tagged | The factory draws the pedestal and wheel in each type's style; wheel boxes carry a `wheel` tag and the pivot, so the game puts them in their own node and spins them |
| Factory, one shared head | One head and wheel for every type, shape unchanged; only ownership moves |

**Answer: Factory, wheel tagged.**

### How should the game draw the distant (low detail) station once the shed prop is gone?
| Option | What it means |
|---|---|
| Boxes tagged per level | `buildStation` tags each box full / low / both, as the shed does today; the game's structure LOD picks the level; the curved deck gets a low sector with fewer segments |
| Separate low function | A second export returns only the far silhouette |
| No low level | The game draws the full station at every distance or merges it itself |

**Answer: Boxes tagged per level.**

### How should the change roll out across the two repos?
| Option | What it means |
|---|---|
| Clean cut, paired | The factory removes the shed prop and `TYPE_META.shed` in one go; the webapp change lands with the next factory import; prop ids are not stored in saved maps, so nothing needs an alias |
| Transition period | The factory exports both the old prop and the new function for a while; the prop is removed later |

**Answer: Clean cut, paired.**

### May the redesign change a type's footprint (w x d) or rope-head height?
| Option | What it means |
|---|---|
| Keep them fixed | Footprints and `ropeHeadY` stay as they are, so existing lines keep identical geometry |
| Allow changes | The redesign may resize a type |

**Answer: Allow changes.**

### Should the pylons change in this work?
| Option | What it means |
|---|---|
| No, unchanged | `buildPylon(height)` stays as it is |
| Style per station type | Pylons pick up the style of the line's station type |

**Answer: Style per station type** - later revised (next question).

### A line's two stations can be different types. Which style do its pylons take?
| Option | What it means |
|---|---|
| Station A's type | The pylons follow the line's first station |
| Nearest station | Each pylon takes the type of the station nearer to it |
| Own line setting | The line stores a pylon style of its own |

**Answer: "Hm, keep only 1 pyllon type (I change my previous answer). But improve shape of
this pyllon"** - one pylon design for every line, as today, but a better-looking one; still
`buildPylon(height)` with no station type passed.

### When a type's dimensions change, what happens to stations already in saved maps (they cache w, d, ropeHeadY)?
| Option | What it means |
|---|---|
| Keep cached numbers | Old stations keep their stored footprint and head height; the design accepts any reasonable size |
| Migrate to new numbers | On load, stations take the type's new dimensions and the line's rope and pylons are re-solved |

**Answer: "Migrate to new numers, but don't make any terrain changes. When designing new shapes,
try to make station with similar size as today - no big changes"** - old stations take the new
dimensions and their ropes are re-solved, the terrain is never touched by the migration, and
the new designs stay close to today's footprints and head heights.

### Should a station keep `w`, `d` and `ropeHeadY` in the saved map?
Raised by the user after the first draft, no options offered.

**Answer: "don't save w, d, ropeHeadY to map. Ignore the in old saves and don't use them in new
saves"** - the three fields leave the station record; a station's footprint and rope-head
height always come from its type in the factory set. This replaces the on-load migration of the
previous answer: there is nothing to overwrite, the values are simply not read. Its other
parts still hold: ropes follow the current dimensions, the terrain is never changed, sizes stay
close to today's.

## High-level plan

1. **One station builder in the factory.** The `cableCarStation` set module gains
   `buildStation(type, view)`. The view is `{ circulating, sillDrop, halfWidth }`; the module
   also exports the default view used before a line has a cabin (today's 8.3 / 2.0). It returns,
   in the station-local frame (+Z toward the first support, y = 0 the station's terrain level),
   everything the station is drawn from: the hall, its roof, the head pedestal and machinery,
   the bull wheel, the boarding platform with its railings, supports and stairs. Boxes carry the
   material vocabulary the game already draws (`steel`, `timber`, `glass`, `concrete`, `stone`,
   `deck`, `wheel`, ...), tilts where the shed uses them today, a level tag (full / low / both),
   a `wheel` tag on what spins with its pivot point, and a `ground` style tag on columns sunk
   below grade. The curved deck comes back as annular sectors. The shed's drawing code moves
   from the prop into the module, which still imports nothing.
2. **Per-type platform design.** Each of the four types draws its platform, stairs, head and
   wheel housing as part of its own structure (gantry: steel grating, red railings, wheel under
   the machine room; chalet: timber deck, posts and brackets; glass: light deck, glass
   balustrades, tree columns; concrete: slab on the portal frames), in both plans: the circular
   ring for circulating lines and the rectangular U for shuttle and jig-back lines. Platform
   height follows `sillDrop`, its inner edge `halfWidth`; the roof covers the platform it
   actually draws. Footprints and rope-head heights may be retuned, but stay close to today's.
3. **A better pylon.** `buildPylon(height)` keeps its signature and stays one design for every
   line, with an improved shape (for example a tapered or lattice mast, a proper cross-head and
   sheave assemblies), still sunk into the ground, still within the rope geometry the solver
   expects.
4. **Factory clean-up.** `proc-prop-cablecar-shed` is removed from the props, `props.meta.json`,
   `FAR_PROPS` and the catalog; `TYPE_META.shed` goes. The gauge rules move from "the shed must
   avoid what the game builds" to "the station keeps its own cabin ring, rope exit and stairs
   clear" across the view space (both plans, the catalog's sill and width range). The structure
   preview page draws the stations from the new function in both plans. Pins, budgets and
   documentation (sets, props, previews) follow.
5. **Webapp switch** (with the next factory import, as its own step). The game calls
   `buildStation` with the view it computes today (`cableCarBoarding`), transforms the result to
   world space and draws it; the wheel-tagged boxes become the rotating `cablecar-wheel` node.
   The game's own head, wheel geometry, platform and stair code and the shed prop placement are
   deleted. The station record drops `w`, `d` and `ropeHeadY`: the loader ignores them in old
   saves, the saver no longer writes them, and every reader (terrain pad, surface blocks, rope
   head, core passes) takes them from the station type. Lines whose stations changed size get
   their ropes and pylons re-solved; terrain is not touched.

Phases 1-4 are one factory change; phase 5 depends on its export.

## Database and persistent storage

No new store, table, field or file. One **field removal**, in the webapp's saved maps (R2 map
JSON, `CableCarStationData`):

- **Removed fields:** `w`, `d`, `ropeHeadY` (numbers, studs). New saves do not write them. Old
  saves may still contain them; the loader ignores them and they disappear from that map on its
  next save. There is no versioned migration step.
- **Kept fields:** `id`, `name`, `x`, `y`, `z`, `rot`, `stationType`. A station's footprint and
  rope-head height are always the current values of its type in the factory set.
- **Lines** (`CableCarData`) are unchanged. Where a station's dimensions now differ from what
  its line was solved with, the line's rope and pylons are re-solved, and the stored `pylons`
  list is rewritten with the next save.
- Terrain, the station's terrain pad and surface blocks are **not** changed; a station whose
  footprint is larger than its old levelled pad stands on the ground as it is (sunk columns
  hide small slopes).
- `stationType` ids are unchanged; no set id is renamed or retired.
- The view (`circulating`, `sillDrop`, `halfWidth`) is not stored; it is derived from the line's
  cabin and cabin count each time, as today.
- Prop ids are not stored in maps, so removing `proc-prop-cablecar-shed` needs no alias.

## Architecture decisions

- **Set function over a parametric model**: the sill height is continuous and the plan depends
  on game state; a set function takes both exactly, matches `station.furnish` and
  `roadStation.dress`, and needs no model build per combination.
- **The factory owns the whole station**: the hall, platform, stairs, head and wheel are
  designed together, so they can share columns and match; clearance between them becomes an
  internal property of one design rather than a cross-repo contract.
- **Wheel as tagged boxes with a pivot**: the game keeps animating it without knowing its shape.
- **Level tags in one result**: the far level is designed with the near one, as the shed's
  low level is today, without a second entry point.
- **One pylon design**: a line with two different station types never has to pick a style, and
  no line setting is stored.
- **Dimensions are not stored**: every station of a type looks the same and a retuned type
  reaches every map without a migration; the factory set is the one source of a station's size.
  Terrain is left alone, so loading a map never edits the player's ground. The cost is that any
  future resize of a type also moves existing stations; that is accepted.

## Weaknesses and risks

- **Set module size.** Four halls with platforms in a no-import module may grow past 1,500
  lines (`station.ts` is about 1,950); keep shared kit helpers inside the module and split by
  sections. The game bundles the module, so its size reaches the browser bundle.
- **Triangle budget.** The shed's 5,000 / 200 budget now has to cover platform, stairs, head
  and wheel too; a new budget per type (both plans) needs setting and a test.
- **Rendering vocabulary.** The game must draw tilted boxes and sectors from the module; it
  does both today (shed props, the curved deck) but through two paths that now merge.
- **Dimension changes reach old maps.** With no stored size, today's redesign and every later
  resize move existing stations: re-solving a rope can move pylons, and a larger footprint over
  an unlevelled pad can show a gap or bury the hall on steep ground. Keeping sizes close to
  today's limits this; a test should cover loading an old record that still carries the three
  fields, and a record without them.
- **Detecting when to re-solve.** With no stored `ropeHeadY`, the game cannot tell from the
  station record whether a line was solved for the old head height; it either re-solves every
  line on load or compares the stored pylons with a fresh solve. Re-solving every load would
  also move pylons whenever the solver's constants change, against the rule that stored pylon
  heights never move.
- **Collision with existing map objects.** A grown footprint or platform may overlap nearby
  buildings or track placed against the old size; nothing re-checks placement on load.
- **View space coverage.** The design must look right and stay clear of the cabin ring across
  the whole range of `sillDrop` and `halfWidth` a cabin can bring, including user cabins.
- **Paired rollout.** Until the webapp switches, a factory export without the shed prop breaks
  the game's import; the import must not be refreshed separately from the webapp change.
- Open: the exact new budgets, and whether the stairs may leave from a side other than the
  hall's front for some types.

## Out of scope

- Per-type or per-line pylon styles (one improved pylon only).
- Cabins, the rope solver's rules and the cabin modes.
- New station types, or any change to set ids.
- Terrain re-levelling under migrated stations.
- Publishing the export to the game (a separate, standalone step).
