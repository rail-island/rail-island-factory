# Dedicated LODs for every model

Status: draft
Date: 2026-10-17
Area: generator (vehicle and building kits, LOD, rig), standalone JS export, factory preview, tests, docs/models/lod.md

## Context of the change

Every standalone JS model has a low level of detail (docs/models/lod.md): at most
100 triangles for a road or rail vehicle. Except for four designs, it is made by
the generic recipe in `generator/lod.ts`: each selected body scope becomes a
convex envelope of at most 48 triangles. For the roughly 115 vehicle designs this
gives 12 to 88 triangles, mostly 30 to 45, and a one-colour box: the livery
bands disappear, cab ends lose their shape, running gear is excluded so a train
body floats about 1 m above the rail, and pantographs are dropped.

The CD 163 and CD 263 now have a dedicated builder (`cd163LodBody` in
`generator/cd163.ts`): the raked cab ends, sides painted in the livery's colour
bands and cab paint, merging of the least visible bands to fit the budget, roof
hip, cooler box, bogie blocks and a raised pantograph of rods, 94 to 100
triangles for all 18 liveries. Its helpers (`lodPolygon`, `lodSideBox`,
`lodRod`, band clipping and merging) are private to that file.

Most vehicle families are already built from shared kits (`boxLocoKit`,
`czElectricKit`, `dmuKit`, `emuClassicKit`, `unitParts`, `tramKit`, `busKit` /
`busBody`, `liveryCoach`, `csdCoachParts`, `germanCoachParts`,
`smallDieselKit`, `steamLoco`, `wagonParts`, `freightWagonParts`, the truck
builders), many describing paint with the same kind of colour bands. LOD is
static: no rig, no part nodes, no animation. Vehicle LODs must not use window,
glass, rubber, lamp, logo or number materials (`test/lod.test.ts`).

## User request

"OK, in similar way make LOD variants for all trains, buses and trams. Try to
reuse code parts." (following the dedicated CD 163 LOD)

Asked what happens to the generic recipe afterwards: "plan also dedicaded LOD
for other objects" - the scope then widened from trains, buses and trams to
every model in the catalog.

## Decisions

### Which vehicles are in scope?
| Option | What it means |
|---|---|
| All rail + buses + trams | Locomotives (incl. steam), units, coaches, metro, trams, freight wagons and the 9 buses; trucks, cable cars, aircraft and ships keep what they have. |
| Passenger stock only | Locos, units, coaches, metro, trams, buses; freight wagons stay on the generic hull. |
| Also trucks | Everything above plus the 6 trucks: every road and rail vehicle has a dedicated LOD. |

**Answer: Also trucks** - every road and rail vehicle gets a dedicated LOD;
cable cars, aircraft and ships are not part of this change.

### How should the LOD code be reused across ~90 designs?
| Option | What it means |
|---|---|
| Shared LOD kit fed by kits | Generalise `cd163LodBody` into a parametric LOD body (end profile, width, heights, bands, cab bands, roof, running-gear blocks, pantographs) with one adapter per existing kit passing the kit's own constants and livery. |
| Automatic extraction | One algorithm reads the full model's outline, band colours and running gear; no per-family code, less control. |
| Hybrid | Automatic by default, optional per-family override spec. |

**Answer: Shared LOD kit fed by kits** - exact and readable; every kit gets an
adapter that feeds the kit's own dimensions and livery to the shared builder.

### Articulated vehicles (articulated buses, multi-section trams, TGV/ICE/units with several cars): how should their LOD handle sections?
| Option | What it means |
|---|---|
| Keep sections as rig nodes | The LOD keeps one node per section and the joint pivots, so pose()/renderJoint bend it on curves like the full model; changes the "LOD is static" contract; 100 triangles for the whole vehicle. |
| Static, one piece | Today's contract: one static mesh; long articulated vehicles look straight on curves. |
| Static, budget per section | Still static, each section with its own 100-triangle budget. |

**Answer: Keep sections as rig nodes** - an articulated LOD bends like the full
model; the whole vehicle still fits 100 triangles.

### Windows: may the dedicated LODs show dark window bands / windscreens?
| Option | What it means |
|---|---|
| Yes, as merged dark bands | One dark material per vehicle for the windscreen and a continuous side window band; relaxes the "no glass material" rule for dedicated LODs. |
| Windscreens only | Only the cab front glass; side windows stay body colour. |
| No, keep the rule | No glass at all, as on the CD 163 now. |

**Answer: Yes, as merged dark bands** - windscreens and continuous side window
bands in one dark material; the test rule is relaxed for it.

### Should the LOD keep rotating bogies and steered wheels as rig nodes too (single-body vehicles)?
| Option | What it means |
|---|---|
| No, static running gear | Bogies and wheels are dark blocks fixed to the body; only articulated sections and joints are rig nodes. |
| Yes, full rig | Bogies turn and a road vehicle's front wheels steer, as in full detail. |

**Answer: No, static running gear** - only sections and joints move in LOD.

### Triangle budget for the dedicated vehicle LODs?
| Option | What it means |
|---|---|
| Keep 100 for all | The same limit for every road and rail vehicle, including multi-car sets and articulated vehicles. |
| 100, more for long sets | 100 per vehicle, but 150-200 for articulated vehicles and multi-car trainsets (TGV, ICE, units with sections). |
| Raise to 150 for all | Room for windows, pantographs and bands everywhere; 50% more distant geometry. |

**Answer: 100, more for long sets** - single-body vehicles keep 100; the exact
limit for articulated and multi-car vehicles is settled below.

### Should the CD 163's adaptive band merging be the rule for all liveries?
| Option | What it means |
|---|---|
| Yes, shared priority list | One shared order: optional parts (folded pantograph etc.) first, then thinnest / least visible bands, then window bands; deterministic, every livery fits. |
| Per-family hand-picked | Each adapter states what its LOD keeps; budget failures are build errors. |

**Answer: Yes, shared priority list** - the fitting rule lives in the shared kit.

### What exactly is the budget for long sets?
| Option | What it means |
|---|---|
| 100 per section, cap 300 | Each section or car of an articulated bus, tram or trainset gets 100 triangles; an 18 m bus 200, a KT8 tram 300, the TGV set capped at 300. |
| Flat 200 for any multi-section vehicle | One number regardless of the number of sections. |
| Flat 150 | A modest rise; long sets lose more bands and windows. |

**Answer: 100 per section, cap 300.**

### How should the work be rolled out across ~100 designs?
| Option | What it means |
|---|---|
| Phased by kit | First the shared kit (moving the CD 163 onto it), then families in batches, each shipped and reviewed with contact sheets; the generic hull stays for families not yet done. |
| All at once | One change converting every family. |

**Answer: Phased by kit.**

### What happens to the generic convex-hull recipe for vehicles when done?
| Option | What it means |
|---|---|
| Remove for vehicles | Every road and rail vehicle must have a dedicated LOD; the hull stays for buildings, cable cars, aircraft, ships. |
| Keep as fallback | New vehicles may still ship with the generic hull. |

**Answer: "plan also dedicaded LOD for other objects"** - the scope widens
beyond road and rail vehicles; which objects, and the hull's fate, are settled
below.

### Which 'other objects' should also get dedicated LODs?
| Option | What it means |
|---|---|
| Aircraft, ships, cable cars | The remaining vehicles: 8 aircraft (budget 200), 2 ships still on the hull, 4 cable car cabins and the chair. |
| Ordinary buildings | Village houses, commercial streets, stations, industry, fountains (budget 100): roofs, storeys and facade colours from each building kit. |
| Landmarks and towers | Historical buildings, churches, cathedrals, towers, skyscrapers (budget 500); some already have dedicated builders. |

**Answer: all three** - every model in the catalog gets a dedicated LOD.

### Once everything has a dedicated LOD, what happens to the generic convex-hull recipe?
| Option | What it means |
|---|---|
| Remove it entirely | Every model must supply its own LOD builder; a model without one fails the build. |
| Keep as fallback | Stays as a safety net for new models. |

**Answer: Remove it entirely.**

### Buildings: may their LODs show windows?
| Option | What it means |
|---|---|
| Dark window bands per storey | One dark strip per storey per facade, consistent with the vehicles. |
| No windows on buildings | Buildings read by mass, roof and wall colour only; more budget for shape. |

**Answer: No windows on buildings.**

### Order of the phases?
| Option | What it means |
|---|---|
| Vehicles first, then buildings | Shared kit and CD 163 migration, rail, buses and trucks, aircraft / ships / cabins, ordinary buildings, landmarks / towers / skyscrapers, then removal of the generic hull. |
| Most-seen objects first | Ordered by how many instances the game shows at distance. |

**Answer: Vehicles first, then buildings.**

### How is each phase reviewed before the next one starts?
| Option | What it means |
|---|---|
| User approves contact sheets | Each batch ships full / LOD contact sheets of every model and representative variants; the next batch starts after approval. |
| Automatic checks only | Tests decide; phases run back to back. |

**Answer: User approves contact sheets.**

## High-level plan

1. **Shared vehicle LOD kit.** The CD 163 builder is generalised into a shared
   kit: a body described by its plan length and width, the profile of each end
   (raked, flat, rounded noses as a few facets, hoods), heights of floor, eave
   and roof, colour bands and cab bands, a roof shape, roof equipment
   (pantographs raised or folded, cooler boxes, domes, exhausts), running-gear
   blocks (bogies, axles, road wheels) and dark window bands and windscreens.
   It owns the shared fitting rule: optional parts go first, then the least
   visible band (thin, short), then window bands, until the budget holds. The
   CD 163 / 263 move onto it unchanged in look. The rig contract of the LOD is
   extended: an articulated vehicle's LOD keeps one node per section and its
   joint pivots, so `pose` and `renderJoint` bend it; bogies and steered wheels
   stay fixed. The window-material ban in the tests is lifted for the one dark
   LOD glass material.
2. **Rail vehicles, batch by kit**: electric locomotives (box-loco, Czech
   electric and mainline kits), diesel and small diesel locomotives, steam
   locomotives (boiler, cab, tender as kit masses), units and railcars (DMU,
   EMU, unit parts, ICE, TGV, KiHa, MDmot), coaches (CSD, livery, German,
   CZ/SK), metro and trams, freight wagons (each load variant). Each family's
   adapter reads the kit's own constants and the selected livery.
3. **Road vehicles**: buses (kit and body), articulated buses with sections,
   trucks with their trailers and loads.
4. **Remaining vehicles**: aircraft (fuselage, wings, tail, engines, livery
   cheatline), ships, cable car cabins and the chair.
5. **Ordinary buildings**: village houses, commercial streets, stations,
   industry and fountains from their kits: masses, roofs and wall colours, no
   windows.
6. **Landmarks, towers and skyscrapers**: the existing dedicated builders are
   kept or brought onto shared helpers; the rest get their own.
7. **Retire the generic hull**: every design must supply a dedicated LOD; the
   recipe tables and convex envelopes are removed and a model without one
   fails the build.

Each batch ships with full / LOD contact sheets of every model and
representative variants, and the next batch starts after the user approves.

## Database and persistent storage

Nothing new is stored: no database, files or browser storage. The export folder
keeps its layout; only the generated JS of each model gains its dedicated LOD
code (and, for articulated vehicles, LOD section nodes).

## Architecture decisions

- **Parametric shared kit with per-kit adapters** rather than automatic
  extraction from the full model: exact control of what a distant vehicle keeps,
  no fragile geometry analysis; the cost is one adapter per kit.
- **Budgets**: 100 triangles per single-body vehicle and ordinary building,
  100 per section or car of an articulated vehicle or trainset with a cap of
  300, 200 for aircraft, 500 for landmarks, towers and skyscrapers.
- **Articulated LODs are rigged by section** (joints only): long buses, trams
  and sets bend on curves; this changes the documented "LOD is static" contract
  and the game's LOD handling must pose them like full models. Bogies and
  steered wheels stay static.
- **One shared fitting rule** decides what survives the budget, so every
  livery and variant fits deterministically without per-livery tuning.
- **Vehicles show windows as one dark material; buildings show none.**
- **The generic convex hull is removed at the end**: a dedicated LOD becomes
  part of every model's contract.

## Weaknesses and risks

- **Size of the work**: about 115 vehicle and 60 building designs, many with
  parameters; phased batches with user review keep it manageable but long.
- **Rigged LOD in the game**: the game currently treats LOD as static; it has to
  apply the section poses to LOD models too. Until the webapp does, an
  articulated LOD shows straight. Coordination with `rail-island-webapp` is
  needed (publishing stays a separate step).
- **Budget pressure on long sets and liveries**: TGV / ICE sets at 300 and
  multi-band liveries will lose bands or windows; the fitting order decides
  which, and contact-sheet review is the only quality gate for that.
- **Adapters drift from the full models**: a kit change may not be mirrored in
  its LOD adapter; tests compare LOD bounds and colours with the full model to
  catch large drift.
- **Lifting the window-material ban** weakens a check that today catches detail
  leaking into LOD; it must allow exactly the one LOD glass material.
- **Removing the hull** makes every future model need a hand-written LOD,
  raising the cost of adding models.
- Open: the exact list of section counts per trainset (which sets count as
  "long") follows from each design's rig.

## Out of scope

- Publishing the export to the game and the webapp's handling of rigged LODs.
- Animated LOD (steam rods, rotating bogies, steering wheels).
- Changing full-detail models, their budgets or thumbnails.
- Windows on building LODs.
