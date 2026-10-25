# Vehicle interiors

Status: agreed
Date: 2026-10-25
Area: generator (door kit, coach kit, railcar kit, tram kit, buses, every passenger design), export (JS model userData), catalog site (3D preview)

## Context of the change

Every passenger design of the factory (groups `coach`, `unit`, `tram`, `metro`,
`bus`) opens its passenger doors (docs/models/doors.md). `openable`
(`generator/doors.ts`) turns each door into moving leaf parts `door<n>-<k>` and
gathers them into one `door` clip per side and car (`doors-right`,
`doors-left-section1`), shut at rest. Three motions exist: `fold` and `swing` cut
a doorway in the shell (`doorwaySegment`, `generator/csdCoachParts.ts`) with a
dark `seam` vestibule 0.6 m deep behind it (`vestibules`); `plug` doors leave the
shell whole and their dark seam panel is the doorway; every bus has a dark
doorway panel behind its leaves. Through an open door there is therefore only a
dark box or a dark panel - no vehicle has an interior.

Clips animate only `rotation` and `translation` of part nodes; drives travel
beside them as `userData.clipDrives`. The site's `src/ModelViewer.tsx` has Open
left / Open right / Close buttons for the door clips. The low level of detail
draws every door shut and still. The game (rail-island-webapp,
`docs/rendering/vehicle-doors.md`) plays the door clips at stops.

## User request

I want to create vehicle interiors. They could be very simple. Interiors should
be rendered only when the doors are opening or opened. When doors are closed,
remove interior triangles from the rendered set. At first, implement it only in
the factory. When opening doors, the interior should be visible. Make the
interior quite generic, nothing spatial. Only seats must respect the place where
the doors are opened. Implement it for all vehicles in the factory with opening
doors, with the ability to preview it in the factory UI.

## Decisions

### How should the interior be removed from the rendered set while the doors are shut?
| Option | What it means |
|---|---|
| Part + visible flag | Interior is its own part node per car; userData says which door clips reveal it; the consumer sets `visible = false` while all those doors stand at 0. No draw call and no triangles when shut; each consumer needs a little logic. |
| Scale track in door clip | The interior part gets a scale track in the door clip (about 0 at sample 0, 1 after). Any clip player works unchanged, but the triangles are still submitted and the clip format gains a `scale` path. |
| Both | Visible flag where supported, scale track as fallback. Most robust, most code. |

**Answer: Part + visible flag.**

### What granularity of interior visibility?
| Option | What it means |
|---|---|
| Per car | One interior per car or section, shown while any door of that car, either side, is opening or open. |
| Per car and side | Two halves per car, each shown with its own side's doors; fewer triangles, but a visible seam between halves. |

**Answer: Per car.**

### What should an open doorway look into?
| Option | What it means |
|---|---|
| Cabin replaces vestibule | The dark vestibule goes; the doorway opens into one continuous generic cabin (floor, walls, ceiling, seat rows). Plug doors also get a doorway cut so their cabin shows. |
| Keep vestibule, cabin beyond | The vestibule stays as an entrance area with its back wall opened into the cabin. |
| Only where a doorway exists | Interiors only behind fold and swing doors; plug doors and buses keep the dark panel. |

**Answer: Cabin replaces vestibule.**

### What does the generic interior contain, and how are the seats laid out?
| Option | What it means |
|---|---|
| Shell + transverse rows | Floor, ceiling, inner side and end walls in flat materials, plus simple box seats in 2+2 transverse rows at a fixed pitch, rows skipped at each door's clear zone (door width plus a margin); one layout for every vehicle, sized to the car's width (2+1 or 1+1 on narrow cars). |
| Per-family layout | The same shell with a seat style per family: longitudinal benches in metro and trams, transverse rows elsewhere. |
| Shell + seats + poles | Transverse rows plus vertical grab poles by each door. |

**Answer: Shell + transverse rows.**

### How do interior triangles count against the triangle budgets?
| Option | What it means |
|---|---|
| Separate interior budget | Existing budgets apply to the exterior as today; the interior has its own cap per car (about 1,500 triangles), checked by a test. |
| Counted in the budget | The interior counts in the existing total; designs near the cap shed exterior detail or get a sparser interior. |

**Answer: Separate interior budget.**

### Windows are opaque dark glass today. Should they change?
| Option | What it means |
|---|---|
| Keep opaque | The interior is seen only through open doorways; nothing changes while the doors are shut. |
| Transparent while open | Glass turns semi-transparent while the interior shows; needs material switching in consumers. |

**Answer: Keep opaque.**

### How should the factory preview show the interior?
| Option | What it means |
|---|---|
| Follows doors + Interior toggle | By default the interior shows as the game would show it: with Open left / Open right, hidden once Close has finished. An extra Interior toggle forces it visible with the doors shut and cuts the roof away, so the seat layout can be inspected from above. |
| Follows doors only | The interior shows only through opening doors. |
| Follows doors + force-visible | The toggle shows the interior with the doors shut but keeps the roof. |

**Answer: Follows doors + Interior toggle.**

### Double-deck coaches and units - how many floors?
| Option | What it means |
|---|---|
| One floor at door level | A single floor at the doorway's sill and a ceiling above the doorway's head; generic, nothing spatial. |
| Two decks | A lower and an upper deck with seat rows on each, per-design heights. |

**Answer: One floor at door level.**

### What colours should the interior use?
| Option | What it means |
|---|---|
| One shared palette | Fixed interior materials for every vehicle (floor, walls and ceiling, seats); no parameter, no new exported text. |
| Seat colour per design | Shared floor and walls; a design or family may set its seat colour. |
| Interior parameter | A new enum parameter on every passenger design; text in 14 languages, more variants. |

**Answer: One shared palette.**

### What should the built JS model do with the interior by default?
| Option | What it means |
|---|---|
| Hidden by default | `build()` returns the interior parts with `visible = false`; a consumer that reads the interior metadata shows them while doors open. The game, until updated, draws no extra triangles, but its open doorways look into an empty shell (the vestibules are gone). |
| Visible by default | The interior is always drawn unless a consumer hides it; the game looks right at once but pays the interior triangles on every passenger car. |
| Hidden + keep vestibules for the game | Hidden by default with the old vestibules kept behind the cabin as a fallback; extra geometry and overlap between vestibule and cabin. |

**Answer: Hidden by default.**

### How should the change roll out across the catalog?
| Option | What it means |
|---|---|
| Phased by kit | Phase 1: the interior kit, metadata and site preview with the coach kit (trams, CSD and livery coaches). Phase 2: the railcar kit and the plug-door units (doorway cuts). Phase 3: buses and the bespoke high-speed sets. Each phase leaves the catalog consistent and tested. |
| All at once | One change covers every passenger design; one very large diff. |

**Answer: Phased by kit.**

## High-level plan

The interior is one generic cabin per car, built from the car's own outline and
the list of its passenger doors, in its own part, hidden unless a door of that
car is opening or open.

1. **Interior kit and metadata.** A shared builder draws a cabin from a car's
   length, inner width, floor (the doorway sill) and ceiling (above the doorway
   head): floor, ceiling, inner side and end walls, and box seats in 2+2
   transverse rows at a fixed pitch, 2+1 or 1+1 where the car is narrow. A seat
   row is left out wherever it would reach into a door's clear zone (the door's
   width plus a margin, on either side of the car), so every doorway opens onto
   floor, never onto a seat back. All of it uses one shared interior palette.
   The cabin lands in an interior part per car (a child of the car part on an
   articulated or multi-car model). The model's metadata gains, per interior
   part, the door clips that reveal it; the built group has the interior parts
   hidden. Interiors have their own triangle cap per car, checked by a test;
   the exterior budgets are unchanged. The low level of detail draws no
   interior. Phase 1 also moves the site preview: an interior part is shown
   while any of its door clips stands above 0 and hidden once all are shut
   again, and an Interior toggle forces every interior visible with the doors
   shut and cuts the model away above the ceiling for a view from above.
2. **Coach kit (phase 1).** The trams, the CSD and livery coaches and the other
   coach-kit designs lose their dark vestibules: a fold or swing doorway opens
   straight into the cabin. Their plug doors get a doorway cut through the
   shell like the inward doors have, so the plug leaf uncovers the cabin.
3. **Railcar kit and plug-door units (phase 2).** The same for the railcar
   kit's loft and the units drawn outside the coach kit: doorway cuts for plug
   doors, vestibules replaced by the cabin.
4. **Buses and bespoke sets (phase 3).** Every bus replaces the dark doorway
   panel behind its leaves with a cut into a cabin; TGV, TGV Duplex, ICE 1,
   Shinkansen 0 and the other bespoke designs follow. At the end every design
   with a door clip has an interior on every car with doors, which a test
   asserts.

Each phase updates docs/models/doors.md (and a new interior document) and
verifies with the usual typecheck, test and build, plus headless renders of a
doors-open view per family. The game is not touched.

## Database and persistent storage

Nothing new is stored: no database, file or browser storage changes. The
exported JS model gains interior parts and a metadata entry beside
`clipDrives`; the export folder stays generated and gitignored.

## Architecture decisions

- **Hidden part plus metadata, not a clip track.** Toggling `visible` removes
  the interior's draw calls and triangles entirely while shut, which is what was
  asked; a scale track would keep them submitted. The cost is a few lines in
  every consumer, today only the site.
- **One interior per car, not per side.** One part, one rule (any door of the
  car), no seam in the middle of the cabin seen through a doorway.
- **The cabin replaces the vestibule.** One continuous space behind every door
  rather than a dark box, so the same builder serves fold, swing and plug doors
  and buses alike. It means plug doors and buses need doorway cuts they do not
  have now.
- **Hidden by default in the built group.** A consumer that knows nothing of
  interiors pays nothing for them.
- **Generic, from door positions only.** Seats are the only element that
  depends on the design (door clear zones); everything else is derived from the
  car's outline, so no design needs hand-placed interior geometry.
- **Separate interior budget.** No exterior detail is traded away.

## Weaknesses and risks

- **The game sees empty doorways until it adopts the metadata.** With the
  vestibules gone and the interior hidden by default, a game that imports this
  export and ignores the metadata looks through an open doorway into an empty
  shell (back faces culled: likely straight through the car). Likely if the
  export is imported before the game change; the mitigation is not to import it
  into the game until the game reads the interior metadata - publishing is a
  separate step anyway.
- **Doorway cuts for plug doors and buses touch many shells.** Each kit draws
  its shell differently (coach volume, railcar loft, bus assembly, bespoke
  sets); cutting them risks z-fighting and gaps round the frame. Mitigated by
  the existing coplanar checks at half-open and open, run per phase.
- **Every passenger design's geometry changes.** Allowed, since the design
  changes, but large; the source tree, thumbnails (shut, so visually the same)
  and stats all move.
- **Generic cabin versus real outlines.** Tumblehome, tapered noses, low-floor
  steps and double-deck shells may leave the flat cabin walls poking through
  or floating; walls follow the inner skin only roughly. Mitigated by a test
  that the cabin stays inside the shell, and by headless views per family.
- **Double-deckers show a single level** at door height; acceptable while
  windows stay opaque.
- **Open question:** the exact interior cap per car (about 1,500 triangles is
  the working figure) and the door clear-zone margin are left to
  implementation.

## Out of scope

- Any change to the game (rail-island-webapp): reading the interior metadata
  there is a later, separate change.
- Transparent or semi-transparent windows.
- Spatial or per-design interiors: real seat plans, compartments, toilets,
  stairs, a second deck, passengers, lighting.
- Interiors at the low level of detail, and interiors for locomotives, wagons
  and the doors that stay paint (cab, luggage, end doors).
- New parameters or exported text.
