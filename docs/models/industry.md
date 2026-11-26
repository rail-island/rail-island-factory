# Procedural industry

**Covers** - the Industry audit, eighteen parametric families (the offshore platform at sea with its helideck among them, and the supply chain's primary industries: a farm, a coal mine, an iron ore mine, a stone quarry, a sand pit and a logging camp), geometry budgets and future game migration.
**Code** - `generator/industry.ts`, `generator/offshorePlatform.ts`, `generator/primaryIndustry.ts`, `generator/oilWell.ts`, `generator/industryHall.ts`, `generator/industryMigration.ts`, `generator/generate.ts`, `test/industry.test.ts`
**See also** - [parameters.md](parameters.md), [export.md](export.md), [animation.md](animation.md), [game-properties.md](game-properties.md#helipads), [hospital.md](hospital.md)

## Scope and design

The webapp catalog was audited including thumbnails for all 35 entries in the
Industry category: 31 in the industry group plus chemical-factory, coal-plant,
nuclear-plant and oil-refinery. These are new procedural designs inspired by
industrial building types, not geometry conversions of the licensed source GLBs.
No source mesh or texture is embedded. New geometry is CC0, authored for Rail Island.

Twenty small factories become four architectural families, with compact/extended
footprints and brick/blue/cream finishes. Roofs distinguish the families, rather
than twenty minor variations of the same box. They share one hall kit
(`generator/industryHall.ts`), also used by the heavy works and the power plant's
turbine hall:

- **Walls built around planned openings.** `hallOpenings` lays out every window,
  clerestory, loading dock, personnel door and taking-in door per bay (about 4 m on
  front and rear, 4.5 m on the ends), and the wall is filled only where no opening
  is, so glass, shutters and doors sit in 0.2-0.3 m reveals and can never overlap.
  The front (+z) has a dock in every bay but the last, which holds the entrance;
  a single-storey hall has a clerestory window above each dock. test/industry.test.ts
  checks that no two openings overlap and none cuts a pilaster.
- **Facade structure.** Concrete plinth, brick pilasters at the bay lines and
  corners (a darker `trim` shade of the finish), stone sills and lintels on a hall,
  string courses at the window heads of a multi-storey mill; multi-pane steel
  windows with mullions and transoms.
- **Docks.** Roller shutter with slats, black dock seal and buffers, leveller lip,
  a hood with tie rods over each dock (or one cantilevered canopy on the
  warehouse), guard posts and painted truck lines on the apron.
- **Roofs.** Flat with parapet and coping; gable with standing seams, rooflight
  strips, a louvred ridge ventilator, eaves gutters, downpipes and round louvred
  vents in the gables; sawtooth with mullioned north-light glazing, capped ridges
  and valley gutters.
- **Per design.** The mill (14 m, four floors) has a stack, a stair tower, a water
  tank on its stand, rooflights, roof ventilators and taking-in doors with a hoist
  on its right end; the assembly hall a compressor house with its air receiver;
  the sawtooth works a dust-extraction cyclone; the warehouse its dock canopy,
  air-handling units, rooflights and a name board. Every site has yard lamps,
  pallets and drums.

| Factory design | Replaces source models | Parameters / character |
|---|---|---|
| ind-building-a | ind-building-a,b,d,f,g,l,o | Four-storey mill, stack, stair tower, water tank, taking-in doors and hoist |
| ind-building-h | ind-building-h,i,j | Gabled assembly hall: ridge ventilator, rooflights, compressor house |
| ind-building-k | ind-building-k,m,n | Sawtooth roof with mullioned north-light glazing, dust cyclone |
| ind-building-s | ind-building-c,e,p,q,r,s,t | Warehouse, cantilevered dock canopy, roof plant |
| ind-chimney-basic | ind-chimney-basic,large,medium,small | Three heights and brick/striped/steel finishes; recessed mouth, service ladder |
| ind-detail-tank | ind-detail-tank | Horizontal vessel, vertical tank, twin tank cluster |
| industry-factory-a | industry-factory-a,b,c | Heavy works with three stacks; two sizes and three finishes |
| industry-power-plant | industry-power-plant, coal-plant, nuclear-plant | Thermal/coal/nuclear installations, cooling towers, turbine hall and switchyard |
| chemical-factory | chemical-factory, oil-refinery | Chemical/refinery process train, columns, platforms, pipe rack and storage |
| industry-oil-pump | industry-oil-pump | A well site in two sizes: the pumpjack (open trestle, rounded gear reducer with its belt guard and electric motor, crank discs with fan counterweights, an I-section walking beam, a curved horsehead with its bridle, pitman arms), a pipe railing round the cranks, the wellhead with its valve, a power pole with its transformer and starter cabinet, and a tank battery behind a firewall (one stock tank compact, two with a catwalk large, a vertical separator and the flowlines); the `pumping` clip moves the mechanism ([animation.md](animation.md)). Its own module and JS bundle entry, `oilWell.ts` (`OIL_WELL`), so its code rides with no other industry design |
| industry-wind-turbine | industry-wind-turbine | Two heights; three-section tapered tower with flanges, entrance platform and transformer kiosk; nacelle with cooler, wind sensors and obstruction light; spinner and three twisted aerofoil blades with red tips, turned by the `wind` clip ([animation.md](animation.md)) |
| industry-offshore-platform | (new) | Steel jacket on the waterline, cellar and main decks, living quarters with a lifeboat station, process and power modules, workover derrick, pedestal crane, flare boom and a large helideck ([below](#offshore-platform)) |
| industry-farm | (new) | Arable farm: farmhouse, red barn, grain bins with a bucket elevator leg, machinery shed with a tractor in a fenced yard - the farmstead only, its fields lie freely on the map; compact or large ([below](#farm)) |
| industry-mine | (new) | Coal mine: headframe with two turning sheave wheels and a cage that winds down the shaft (the `winding` clip), raking back legs, brick winding house with its smoking boiler chimney, screening house on legs, conveyor gallery, bunker and loadout over a siding, dark spoil heap ([below](#coal-mine)) |
| industry-iron-mine | (new, draft) | Iron ore mine: the coal mine's head painted red and rust, a sheeted winding house with its substation, a crusher house, a rust-red ore ridge and a waste rock heap on ore-stained ground ([below](#iron-ore-mine)) |
| industry-quarry | (new, draft) | Stone quarry: three benches cut into a rock face with a haul road, a crusher plant fed from a hopper in the lowest bench, conveyors to loading silos over a siding and to graded stone heaps, an excavator ([below](#stone-quarry)) |
| industry-sand-pit | (new, draft) | Sand pit: a shallow pit under a sand face, a feed hopper and loader, a washing and screening plant with a settling pond, stackers to conical sand heaps, a loading bin over a road bay with a tipper truck ([below](#sand-pit)) |
| industry-logging-camp | (new) | Logging camp: a sawmill on piles with a monitor roof, jackladder, boiler house and guyed stack, a wigwam burner, a lumber yard, three log decks, a bunkhouse, a cookhouse with its dinner bell, a water tower and a false-front office ([below](#logging-camp)) |

## Geometry and export

All geometry is generated from deterministic primitives in metres, +Y up, at
ground y=0. Catalog defaultScale is 1. The budget is a ceiling of 10,000 triangles
for **every** parameter combination, not a target to fill with invisible detail.
The 59 combinations currently range from 598 to 9,202 triangles; the four factory
buildings use 4,000-9,200, the primary industries 3,000-10,500, the oil well site 3,000-3,600, the wind turbine about 2,000 (its slender tower and
blades need no more to read at game distance).
Small standalone equipment deliberately uses fewer triangles. Named scopes expose
structure in the factory's source tree. Geometry is shared by GLB and standalone
JS exports; only default variants have static thumbnails and GLBs.

The turbine's rotor node is retained and a six-second looping GLB animation turns
it. The pumpjack's mechanism and the two mine heads' winders are animated too
([animation.md](animation.md)). Every chimney, cooling tower and flare stack carries its
own emitter where it is drawn ([emitters.md](emitters.md)); nothing is copied from
the old geometry's coordinates.

## Offshore platform

`proc-building-industry-offshore-platform` (`generator/offshorePlatform.ts`, re-exported by
`industry.ts`, which stays the family's JS entry) is an oil and gas production platform at sea,
the factory's counterpart of OpenTTD's oil rig. It is **confirmed** (in
`generator/catalogModels.json`), has no parameters and is listed in `NOT_IN_CITIES`
(`generator/cityVariants.ts`): no city stands it on land; it is placed by hand.

- **Datum.** y = 0 is the **waterline**. The factory has no seabed or water datum for
  buildings, so the jacket's eight legs stand from y = 0 like every building's ground (the
  ships put their waterline in `draftFrac` instead; a building has none). The legs are
  battered 1:10 (10 % further out at the waterline than at the jacket's top, 20 m), drawn as
  sheared prisms between horizontal rings so the model's lowest point is exactly 0. The lower
  4 m are the dark splash zone.
- **Jacket.** X bracing in every face and in the two inner transverse frames between three
  levels (1.5, 10.5, 19.4 m), horizontals at the two lower ones; six well conductors and their
  guide frames under the derrick; two risers on the -Z face; a boat landing with fenders and a
  ladder up to the cellar deck on the +Z face.
- **Topsides** (48 x 32 m): the cellar deck at 20.65 m (separators, pumps, tanks, headers) and
  the main deck at 27.65 m, both with handrails. On the main deck: the three-storey living
  quarters (+X end) with windows on every face and a red roof trim, the lifeboat station on
  their +X face (a walkway, two enclosed orange lifeboats on davits), a windsock on their roof;
  the utility module beside them; the separation module, the blue power module with its
  turbine exhausts, two scrubbers and three containers; the workover derrick over the wells; the
  red pedestal crane on the +Z edge with its lattice boom, A-frame, pendant and hook; and the
  flare boom off the -X end, a triangular lattice 36 m long at 32 degrees, whose tip carries a
  `flame` emitter ([emitters.md](emitters.md)).
- **Helideck** (`PLATFORM_HELIDECK`): a 27 m square deck at 39.7 m, cantilevered off the
  quarters' (+X, +Z) corner - borne by columns on the quarters' roof and the utility module and
  by struts from the main deck's edges, on a beam grid with a closed underside. It is a **large**
  pad (`HELIPAD_D.large`, 26 m: an S-92's D-value is about 21 m, a Mi-8's about 25 m). Its
  touchdown surface is the material `helipad` (dark green, as offshore decks are), drawn in
  nothing else; on it, each a few centimetres higher so no faces are coplanar, the landing net
  (15 m square), the white perimeter line, the yellow touchdown and positioning circle (13.5 m
  across, a metre wide), the white "H" (4 x 6 m), and twenty green perimeter lights; round the
  rim the safety net on its frame, and a stair down to the quarters' roof. The design declares
  `game: { helipad: { material: "helipad", pad: "large" } }` (no `when`: every build has it);
  the export measures `{ pad: "large", centre: [25.5, 39.7, 8.5], size: 27 }`
  ([game-properties.md](game-properties.md#helipads)).
- **Placement** (`game.block`, `game.offshore`): one block rect, the jacket's base (x -24..24,
  z -15.3..17.2 m: the battered legs at the waterline and the boat landing), as a fraction of the
  96 x 48 m plan the flare and crane booms span. The game blocks and grades only that rect, so
  nothing is reserved under the booms, and `offshore: true` stands it at sea level over the sea
  without reclaiming the water ([game-properties.md](game-properties.md#buildings)).
  `test/industry.test.ts` checks every vertex below the cellar deck lies inside the rect.
- **Budget.** 6,954 triangles (the family's 10,000 ceiling). Its low detail
  (`offshorePlatformLod`, 304 triangles, `lodTriangles: 500` like the power and process plants)
  keeps the legs, two X braces, both decks and the gap between them, the quarters, modules,
  derrick, the crane and flare booms as plates, the lifeboats and the helideck in the `helipad`
  material on its strut plate.
- **References** (`assets/offshore-platform/`, `SOURCES.md`): Commons photographs of a Gulf of
  Mexico jacket platform (topside layout, crane, lifeboat, derrick) and of the LUN-A platform
  (corner helideck, markings), fetched with `pnpm refs:fetch`.

`test/industry.test.ts` checks it with the family (deterministic, grounded at 0, under 10,000,
no coplanar faces) and on its own: the measured pad is large, at least 26 m, at the helideck's
centre, the flare is its only emitter, and the low detail keeps the deck's 27 m;
`test/emitters.test.ts` lists it among the smokers.

## Primary industries

The supply chain's raw commodities (grain, coal, iron ore, stone, sand, wood) are made from
nothing by six sites in `generator/primaryIndustry.ts` (`PRIMARY_INDUSTRY`, registered in
`generate.ts` with that module as their own JS entry, so the other industry bundles do not carry
their code): one design per commodity, so each can look like what it makes. The farm, the coal
mine and the logging camp are confirmed (`generator/catalogModels.json`); the iron ore mine, the
quarry and the sand pit are **drafts** until the user confirms them, so no game meta file carries
them yet. Each has its chain role in `generator/trafficTable.ts` ([traffic.md](traffic.md)):

| design | produces (t/min) | jobs | harvests |
|---|---|---|---|
| `industry-farm` | grain 180 (large 300) | 6 (large 10) | `field` |
| `industry-mine` | coal 300 | 120 | |
| `industry-iron-mine` | iron-ore 360 | 120 | |
| `industry-quarry` | stone 300 | 60 | |
| `industry-sand-pit` | sand 240 | 20 | `sand` (sand ground around it) |
| `industry-logging-camp` | wood 144 | 15 | `woods` |

All six are listed in `NOT_IN_CITIES` (`generator/cityVariants.ts`): no city stands an industry
site on a house lot. Each is a site of several buildings on its own ground plate (y = 0 to
0.15-0.2 m), the front (+z) toward the road or track, held within its plan (`test/industry.test.ts`
checks every vertex); a pit is never dug below the plate: the quarry's and the sand pit's faces
rise from it as terraces of the ground around. Their low detail keeps every building as a block
with its roof, the bins, tower, terraces, heaps and decks as solids, at most 500 triangles
(`lodTriangles: 500`, as the power and process plants). References with their licences and the
judged dimensions are in `assets/<id>/SOURCES.md`.

### Farm

`proc-building-industry-farm`, `size` compact (30 x 30 m, about 4,000 triangles) or large
(38 x 38 m, about 5,500). The model is the farmstead alone: its fields are not part of it, the
game lays them out freely on the map around the farm. On the gravel yard: the rendered two-storey farmhouse (tiled gable roof,
chimney, porch, windows on every face), the red board barn (battens, double doors on a rail,
a hay door in the gable, ridge ventilators), corrugated grain bins on ring footings (two, or
four on the large farm) with stiffener rings, conical roofs, fans and ladders, fed by a bucket
elevator leg in a lattice tower whose spouts fall to each bin; a machinery shed open to the
front with a tractor, a trailer and a seed drill; round bales, a water trough, a diesel tank
and a yard lamp, a strip of front garden; a post-and-rail fence round the yard with an open
gateway on the front.

### Coal mine

`proc-building-industry-mine` ("Coal mine"), 46 x 32 m (`MINE`), no parameters, about 5,200
triangles (low detail about 190). Until the split it had a `type` parameter (coal or iron); the
coal mine keeps the id and draws exactly what `type: coal` drew, and the iron ore mine is its
own design. The shaft's concrete collar carries a four-legged steel headframe (girts every
4 m, X bracing, the guides of two cages) and its sheave deck with railing and two 4.2 m spoked
sheave wheels, set back so each rope drops plumb into the shaft; the back legs rake 13 m to the
brick winding house (round-arched engine windows, pilasters, a string course, the boiler's
brick chimney beside it, smoking), which the two winding ropes reach through its gable.
The winder moves: the model's parts are `site` (everything fixed), `sheave-a`, `sheave-b`,
`cage` and `rope`, and the `winding` clip (drive `time`, 40 s) waits at bank, winds the cage
down the shaft, waits and winds it back up - both sheaves turning (the second against the
first, its unseen cage rising), the cage sinking into the collar and its rope paying out
([animation.md](animation.md#the-mine-heads-winder)). An enclosed conveyor gallery on trestles climbs from the banking level to the gallery
on top of the bunker: a bin on four legs with two hoppers, gates and chutes over a standard-gauge
siding with a hopper wagon being loaded. The headframe is painted black and the bunker dark
steel, the load near black; the screening house stands on legs beside the shaft; a grey-black
spoil heap, a coal stockpile, spare mine cars, pit props and lamps fill the yard.

### Iron ore mine

`proc-building-industry-iron-mine` ("Iron ore mine", draft), the same 46 x 32 m plan and mine
head kit (`mineHead` in the module: headframe, winder and its `winding` clip, conveyor gallery,
bunker over the siding), about 5,600 triangles (low detail about 200). It reads as its own mine:
the headframe and the hopper wagon are red and rust, the load iron ore red, and the yard
ore-stained (`oreYard`). The winding house is sheeted on a red steel frame with a strip of
windows, its winder electric: a transformer on its plinth inside a fence and the incoming line on
two poles stand where the coal mine's boiler chimney smokes. The primary crusher house stands on
the ground where the coal mine's screening house stands on legs. At the back, a long rust-red ore
stockpile lies beside a grey-brown waste rock heap in place of the coal mine's one dark spoil heap.

### Stone quarry

`proc-building-industry-quarry` ("Stone quarry", draft), 46 x 32 m (`QUARRY`), no parameters,
about 3,600 triangles (low detail about 290). No headframe: the stone is won from an open face.
The back and west of the site rise as three **benches** (`quarryBenches`: tops at 4.6, 8.8 and
13 m, each a battered rock face with a gravel bench on top, the middle face a warmer grey), the
top under a band of soil and grass, sloping down to the site's back and west edges like the hill
it is cut into. A **haul road** climbs from the yard along the west face to the lowest bench;
blasted boulders and a scree fan lie at the faces' feet, a row of blast-hole collars on the
second bench, and an **excavator** works the foot of the face. The **crusher plant** stands
against the lowest face: the primary hopper sunk into the bench (trucks tip from the bench),
its chute into a sheeted hall, the screen house over it under a gabled roof, a dust cyclone and
its duct, oversize and undersize chutes. Open **belt conveyors** on trestles (`belt`) carry the
stone from the plant up to the gallery over two concrete **loading silos** on a braced table over
the standard-gauge siding, where a hopper wagon is loaded, and out on two stackers to the light
and dark grey **graded stone heaps**; a third heap, a yellow site cabin and lamps complete it.

### Sand pit

`proc-building-industry-sand-pit` ("Sand pit", draft), 46 x 32 m (`SAND_PIT`), no parameters,
about 3,000 triangles (low detail about 200). No headframe: a shallow excavation. The back and
west of the site are the **pit face** (`sandBank`): a pale ochre sand face sloping about 1:1 up
3.2 m to a band of soil and grass, slumps of sand at its foot where a yellow **wheel loader** digs
and feeds a **hopper** with its grizzly. A field conveyor climbs from it to the **washing and
screening plant** (`washPlant`, painted blue): a stage on braced legs with its railing, carrying
the inclined vibrating screen on its springs under a spray bar, two hydrocyclones and their
dewatering frame; under it the control cabin, beside it the sump tank and the sand screw rising
toward the sand heap. A water main runs from the **settling pond** (water with a wet sand margin)
up to the plant. Stackers carry washed sand to two pale **conical sand heaps** and a conveyor to
the **loading bin** over a concrete **road bay** with its kerbs, a red three-axle tipper under it
being loaded; a small heap of oversize gravel, a site cabin and lamps complete it. The game
counts sand ground around it (`harvests: "sand"`).

### Logging camp

`proc-building-industry-logging-camp`, 44 x 32 m, no parameters, about 10,500 triangles. No trees
and no vehicles: the camp is its buildings and its wood. At the back stand three log decks of
6-8 m logs on timber bearers (each log a six-sided round of bark with pale sawn ends). In the
middle the **sawmill** (`SAWMILL`): an 18 x 8 m boarded mill raised on timber piles, battens and
windows along both faces, a corrugated gable roof with a louvred clerestory monitor along its
ridge, the log door in the west gable fed by an inclined **jackladder** on trestles with a log
riding up it, the lumber door in the east gable onto the **sorting deck** (the green chain's
deck on posts, boards crossing it); behind it the brick **boiler house** under a lean-to with
its guyed steel stack, smoking. An enclosed sawdust conveyor climbs on a trestle to the
**wigwam burner** (`BURNER`): a rusted steel cone with bands, a charging door and a wire-mesh
spark dome, smoking. Stickered **lumber piles** under tin sheets stand beside it. Along the
front, across a gravel lane: the **bunkhouse** (a long log house, courses crossing at the
corners, a porch on the lane with bench and wash stand, two stovepipes), the **cookhouse**
(board and batten, its gable to the lane with a hooded door, a stone chimney, the dinner bell
on its post, split firewood stacked against it), the **water tower** (a hooped wooden tank with
a conical roof on a braced timber trestle, its spout swung to the lane) and the camp **office**
(a false front with its sign over a boardwalk and an awning). A fuel tank and two lamps complete
the camp.

## Future game import and saved maps

`export/industry-migration.json` contains all 35 source IDs with their suggested
target design and parameters, old defaultScale and original group. It is a
reviewable mapping, not an automatic migration. The factory has not imported,
removed or renamed anything in the webapp. The existing game IDs remain intact.

When importing separately, retain legacy saved-map IDs through aliases or an
explicit migration. Do not simply overwrite old GLBs: these designs use metres,
new origins/footprints and defaultScale 1, unlike the heterogeneous old meshes.
Recompute old placement scales and collision footprints; smoke/steam outlets come
from the emitters.
The old turbine spin metadata must not run simultaneously with the new animation.
The table consolidates visual types rather than promising identical dimensions.

## Validation

`test/industry.test.ts` exercises all parameter combinations for deterministic
bytes, finite grounded bounds, budget, no coplanar material overlaps, distinct
variants, migration coverage and rotor animation. The existing parameter/export
suites additionally verify JS/GLB parity and factory integration. Inspect the
headless exported thumbnails after building; browser checks remain user-run.
