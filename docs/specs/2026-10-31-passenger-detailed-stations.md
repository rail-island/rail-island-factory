# Passenger-detailed stations

Status: agreed
Date: 2026-10-31
Area: station set (`generator/sets/station.ts`), station previews, site 3D viewer, skills

## Context of the change

The game builds railway stations over its tracks from the `station` set
(`generator/sets/station.ts`, docs/models/station-types.md): eight types (`platforms_only`,
`platforms_shared`, `arch_shed`, `cantilever_wings`, `concourse`, `village_depot`,
`heritage_canopy`, `grand_terminus`), each a list of boxes (plus tilted boxes and gable
prisms) furnished over a layout of platform, island and rail rows. The game draws 12
triangles per box. Budgets are three tiers in `test/stationSet.test.ts` (open / canopy /
shed); at 4 tracks x 120 studs today `arch_shed` spends 22,088 (budget 46,000),
`heritage_canopy` 13,920, `platforms_shared` about 6,000, `platforms_only` 972.

Seen from where a player stands in the game - on a platform, at eye height - the stations
read as sparse: square posts and lamps, few objects between the platform edges, plain
stair wells and floors (see the user's in-game screenshot of an arch shed). The site only
shows stations from an orbiting camera above them (`src/ModelViewer.tsx`, OrbitControls),
so nobody checks them from the passenger's viewpoint. There is no `station` skill; the
closest analogue is the `bridge` skill (a set type with per-size budgets).

## User request

Make railway station models much more detailed. Optimize them from the perspective of the
passenger. Make the triangle limit for a 120-stud-long station with 4 rails 25k triangles,
and write it to the skills (do we have a skill for stations? if not, create one). In the
factory UI, add a passenger view, similar to the attached image (a passenger standing on a
platform inside a station with an arched glass roof, catenary masts, benches, lamps, a
stair entrance with a glass railing, platform edge lines).

## Decisions

### Which station types should get the passenger-level detail pass?
| Option | What it means |
|---|---|
| All 8 types | Every type of the station set, one passenger-level vocabulary everywhere |
| Roofed types only | The six canopy and shed types; `platforms_only` and `village_depot` unchanged |
| Train sheds first | `arch_shed` and `grand_terminus` only; the rest in a later spec |

**Answer: All 8 types.**

### How should the 25,000-triangle limit for a 120-stud, 4-track station work?
| Option | What it means |
|---|---|
| One formula, 25k at 4x120 | Replace the three tiers by one `ends + perStud x length x (tracks + 1)` calibrated to 25,000 at 4x120; same budget for every type, scales with size |
| Fixed cap 25k at 4x120 only | Check only that size; other sizes keep the tier formulas |
| Tiers rescaled, shed = 25k | Three tiers kept, the shed tier reaching 25k at 4x120 |

**Answer: One formula, 25k at 4x120.**

### Can the extra detail use new geometry primitives, or only the game's current box vocabulary?
| Option | What it means |
|---|---|
| Boxes only | Boxes, tilted boxes, gable prisms; no game change |
| Add new primitives | E.g. N-sided cylinders/prisms; needs a matching change in the game's station renderer |

**Answer: Add new primitives.**

### Which new station primitives should be added?
| Option | What it means |
|---|---|
| Cylinder (N sides) | Upright or rotated round prism with a chosen side count (6-12): posts, lamp poles, bins, column shafts, pipes, handrails |
| Sphere / dome (low poly) | Lamp globes, clock faces as rounded caps |
| Bar between two points | A square or round member from A to B: braces, truss diagonals, railings without rotX/rotZ |
| Swept arc / curved slab | A curved roof or vault segment as one piece instead of many flat slabs |

**Answer: all four - Cylinder (N sides), Sphere / dome (low poly), Bar between two points,
Swept arc / curved slab.**

### How should the game side of the new primitives be handled in this work?
| Option | What it means |
|---|---|
| Factory first, fallback | Factory adds primitives and a format version; the webapp change is a separate task; old game builds draw a new primitive as its bounding box |
| Factory + webapp together | This spec also covers the webapp's station renderer, landed in step with the factory |
| Factory only, game later | Factory and previews only; the game ignores them until a later spec, no fallback |

**Answer: Factory + webapp together.**

### Which passenger-level detail families should the stations gain?
| Option | What it means |
|---|---|
| Platform surface & edges | Tactile strip, coping stone, yellow line, paving joints, drainage, platform numbers and sector letters on posts |
| Furniture & info | Varied benches, bins, ticket machines, validators, info pillars, timetable cases, departure boards, speakers, CCTV, clocks, vending machine |
| Stairs, lifts & underpass | Real step treads with nosings, handrails both sides, a lift shaft with a glass cab beside the stairs, a lit passage below |
| Structure close-ups | Column bases and capitals, ribs, purlins, gutters, downpipes, lamp brackets, suspended lights under the roof |

**Answer: all four - Platform surface & edges, Furniture & info, Stairs, lifts & underpass,
Structure close-ups.**

### Should a station type itself draw catenary masts and wires?
| Option | What it means |
|---|---|
| No, game draws it | Catenary stays the game's line decoration; stations keep their overhead members clear for it |
| Station draws masts | The station places its own masts on the platforms or vault, styled with it |

**Answer: No, game draws it.**

(The user then had `rail-island/rail-island-webapp` cloned into the session; the game's
station renderer is `src/render/StationMesh.ts` there, which this change extends.)

### How should the passenger view in the factory's 3D viewer work?
| Option | What it means |
|---|---|
| Walk mode | Toggle drops the camera to eye height on a platform; WASD/arrows walk, drag looks, kept on walkable decks; touch equivalents |
| Preset viewpoints | A few fixed passenger cameras (platform end, island middle, stair top, under the roof), drag to look, no walking |
| Both | Presets to jump to, plus walking from there |

**Answer: Both.**

### Which pages offer the passenger view?
| Option | What it means |
|---|---|
| Railway station pages | Only the 8 station-type previews |
| All structures | Stations, bus stations, cable car stations, ports, airports - every walkable structure preview |
| Every model | A generic ground-level camera on any model page |

**Answer: All structures.**

### Should the station preview add context to look like the screenshot?
| Option | What it means |
|---|---|
| Parked train | A real factory coach or EMU at one platform, for scale and gauge |
| Catenary over tracks | One catenary style's masts and wires over the tracks, as the game draws them |
| Nothing extra | Station, ballast and rails only |

**Answer: "both, but optional (with checkboxes)"** - a parked train and catenary, each
switched on and off by a checkbox.

### Where do the 'parked train' and 'catenary' checkboxes live?
| Option | What it means |
|---|---|
| Viewer overlay | Viewer checkboxes load the train's and catenary's own exported models beside the station at runtime; station JS, thumbnails and pins unchanged |
| Preview parameters | Two preview parameters baked into the station preview mesh; in thumbnails, but the preview JS grows |

**Answer: Viewer overlay.**

### What should the new `station` skill cover?
| Option | What it means |
|---|---|
| Station set types | The 8 game-built types: budget, primitives, passenger detail checklist, gauge rule, pins, webapp renderer, passenger-view checks; fixed station buildings stay with `building` |
| Types + station buildings | One skill for everything station-shaped, the fixed buildings moved out of `building` |

**Answer: Station set types.**

## High-level plan

1. **Primitive vocabulary.** The station set's box list grows four primitives - an N-sided
   cylinder, a low-poly sphere/dome, a bar between two points, a swept arc (curved slab) -
   each with a fixed, documented triangle count by its parameters, so a budget is countable
   from the list alone. The set module stays self-contained (imports nothing, every export
   typed). The factory's preview sketch and the game's station renderer draw them alike.
   Everything else depends on this.
2. **Game renderer (rail-island-webapp).** The game's station mesh builder draws the new
   primitives, including in its structure LOD (`shell` / `support`), and its legacy-layout
   floor filter still recognises the deck. Landed together with the factory change; the
   webapp imports the new `station.js` only with its renderer ready.
3. **Budget and checks.** The three tiers become one formula,
   `budget = 4,000 + 35 x length x (tracks + 1)` = 25,000 at 4 x 120 (6,800 at 1 x 40,
   79,600 at 8 x 240, so today's heaviest type, `arch_shed` at 74,152 for 8 x 240, still
   fits). The gauge rule, the no-glass-on-solid rule, the ramp-clearance rule and the
   coplanar check extend to the new primitives.
4. **Passenger-level detail, all eight types.** Each type gains the four families, in the
   type's own style: platform surface and edges (tactile strip, coping, safety line,
   paving joints, drainage, platform numbers and sector letters); furniture and
   information (benches, bins, ticket machines, validators, info pillars, timetable cases,
   departure boards, speakers, CCTV, clocks, vending machines); stairs, lifts and the
   underpass (treads with nosings, handrails both sides, a glass lift beside the stairs, a
   lit passage); structure close-ups (column bases and capitals, ribs, purlins, gutters,
   downpipes, lamp brackets, suspended lights). Detail is placed where a passenger stands
   and looks - eye level and the roof underside over the platforms - and spent sparingly on
   what is only seen from above. Catenary stays the game's: stations draw no masts or
   wires. Pins move on purpose.
5. **Passenger view in the site.** On every structure preview page (railway, bus and cable
   car stations, ports, airports) the 3D viewer gains a passenger mode: preset viewpoints
   at eye height (about 2.5 studs above the walkable surface: platform end, island
   middle, stair top, under the roof, and the like) to jump to, and walking from there
   (keys and drag to look on desktop, touch equivalents on mobile), held on walkable
   surfaces. On railway station pages two checkboxes add a parked train at a platform and
   a catenary over the tracks, loaded as their own exported models beside the station.
6. **Skill and docs.** A new `station` skill in `.agents/skills/station/` (the 25k-at-4x120
   budget formula, primitives, passenger-detail checklist, gauge and glass rules, pins,
   the webapp renderer, passenger-view headless checks, what to show the user), listed in
   `AGENTS.md`; docs/models/station-types.md, docs/models/previews.md and the site docs
   updated.

## Database and persistent storage

Nothing new is stored. Saved station layouts (`LAYOUT_VERSION`) and type ids are
unchanged; the passenger mode and the checkboxes are viewer state for the open page only.
The pins file changes as a deliberate redraw, not as a schema change.

## Architecture decisions

- **New primitives over more boxes.** Round posts, lamps and vaults read far better at eye
  height and cost fewer triangles than stacked boxes; the price is a game renderer change,
  accepted by landing factory and webapp together.
- **Fixed triangle count per primitive.** Budgets and tests count triangles from the box
  list without building a mesh, as they do today.
- **One budget formula for every type.** A simple, uniform rule the skill can state; the
  open types gain room for passenger detail, the sheds are capped near today's heaviest.
- **Overlays in the viewer, not in the preview mesh.** The train and catenary are separate
  exported models loaded at runtime, so station pins, thumbnails and the 80 KB preview JS
  limit are untouched.
- **Passenger view for every structure page.** One viewer mode, finding walkable surfaces
  from the drawn geometry rather than per-family data, so ports and airports get it
  without each module describing its decks.

## Weaknesses and risks

- **Cross-repo landing.** A `station.js` with new primitives breaks an older game build;
  the two changes must land together and the game must not import the export before its
  renderer is ready. Medium likelihood, high cost; mitigation: a format version on the set
  module that the game checks.
- **Budget squeeze for sheds.** `arch_shed` already spends 22,088 at 4 x 120, leaving about
  3,000 for all passenger detail; the swept arc must save on the vault to pay for it.
- **Furniture density on long stations.** Per-stud detail at 8 x 240 approaches 80k
  triangles; repeated items need a spacing rule, not a fixed count.
- **Gauge and coplanar checks** grow to round shapes; their tolerance must stay strict
  enough to catch a lamp or bar over the track.
- **Walkable surfaces** found from geometry may let the camera onto roofs or into walls on
  odd structures (ports, airports); presets mitigate, walking may need a step-height limit.
- **Overlay models** (train, catenary) must be on the site for the checkbox to work; open
  question: which train and which catenary style are the defaults.
- **Test time** must stay under five minutes with the heavier stations.

## Out of scope

- The fixed station buildings (`generator/stations.ts`; the `building` skill).
- Catenary drawn by the station itself.
- Changing saved layouts, recipes or type ids.
- Publishing the export to the game outside this change's joint landing.
- A passenger view on non-structure pages (buildings, vehicles).
