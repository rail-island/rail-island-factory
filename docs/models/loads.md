# Freight loads

**Covers** - what a freight vehicle carries, drawn as hidden load parts instead of a loaded/empty parameter: the `load-` parts and their pivot on the bed, heaps scaled with the fill and stepped loads of discrete items shown item by item (the `step-<i>` contract), `userData.loads` and the GLB's marks, the model at rest without them, the shared palette and looks, the budget's count, the distant models, the thumbnails, the site's Load select, OpenTTD, saved maps, the designs that carry loads and the tests.
**Code** - `generator/loadKit.ts` (`LOAD_PALETTE`, `LOAD_COMMODITIES`, `BULK_LOOKS`, `bulkLoads`, `CONTAINER_COMMODITIES`, `TRAILER_COMMODITIES`, `lumberBundle`, `lumberLoad`, `lumberItems`, `lumberLoadPart`, `bearers`, `cementPallet`, `cementLoad`, `cementItems`, `cementLoadPart`, `orientedFace`, `isLoadName`, `loadLodPart`), `generator/loadPart.ts` (`loadPart`, `itemLoadPart`, `itemSteps`, `Step`, `MAX_LOAD_STEPS`, `stepName`, `loadTriangleCounts`, `budgetTriangles`), `generator/meshCore.ts` (`loadParts`, `loadBudget`), `generator/meshBuilder.ts` (`loads`, `loadTriangleCounts`, `exteriorTriangleCount`, `budgetTriangleCount`, `toGlb`, `sourceTree`), `generator/jsModel.ts` (`bundleDesign`), `generator/glbTriangles.ts` (`collectTriangles`, `CollectOptions` with `fill`, `firstLoad`, `loadEntries`, `shownSteps`, `loadCommodities`, `Tri.load`), `generator/glbStats.ts`, `generator/coplanar.ts`, `generator/renderGlbThumb.ts` (`ThumbOptions.loads`, `ThumbOptions.fill`), `generator/generate.ts`, `generator/lodKit.ts` (`fitLod`, `fitParts`), `generator/lodClassic.ts` (`WagonLodItem.load`), `generator/hullKit.ts` (the `load` item, `containerLoad`), `generator/truckKit.ts` (`Kit.load`, `Kit.itemLoad`), `generator/truckBodies.ts` (`flatbedLoads`), `generator/openttdScenes/previewSheet.ts`, `src/viewerLoads.ts` (`loadsOf`, `applyLoads`, `shownSteps`, `initialLoad`), `src/ModelViewer.tsx`, `src/viewerHighlight.ts`, `src/exportRun.ts`, `src/thumbRender.ts`, `test/loads.test.ts`
**See also** - [interiors.md](interiors.md), [js-format.md](js-format.md), [traffic.md](traffic.md), [wagons.md](wagons.md), [freight-wagons.md](freight-wagons.md), [us-freight.md](us-freight.md), [world-trucks.md](world-trucks.md), [world-ships-cargo.md](world-ships-cargo.md), [../site/openttd-export.md](../site/openttd-export.md)

## The idea

A freight vehicle does not come loaded or empty any more. It is one model that
draws every load it can show - a heap each of coal, iron ore, grain, stone and
sand, logs, steel, bundles of lumber, pallets of cement, containers, cars - each as
its own **load part**, hidden. The game
shows the part whose commodities hold what the vehicle carries, as full as the
vehicle is: a **heap** (coal, ore, grain, stone, sand) scaled in height, sinking
into its tub; a **stepped** load of discrete items (tubes, logs, bundles, pallets,
containers, cars, trailers) item by item, so a half-full Nas shows some of its
tubes whole rather than all of them sunk half into the deck. An empty vehicle shows
none. So there is no `cargo`
(or ship and car-carrier `load`) parameter and no weight variant tied to one: the
carried tonnes add to the vehicle's weight in the game instead. The Kenworth T909
keeps its `load` parameter: it counts trailers, it is no cargo.

Closed bodies - box vans, tanks, reefers, covered wagons and hoppers (the Hadgs,
the Raj's pressure hoppers), the Praga RV under its canvas, aircraft, mail
coaches - show no load and have no load parts, whatever their capacity lists (a box
van's lumber and cement, a covered hopper's cement).

## The load part

`loadPart(m, commodities, floor, fn)` (loadPart.ts) draws `fn` as a child part of the part
being drawn (the same `spin` a rolling wheel or an interior uses, so it moves with
its car or trailer), named:

- `load-<first commodity>` outside any part (`load-coal`, `load-iron-ore`);
- `load-<first commodity>-<car>` inside a car part (`load-coal-trailer`,
  `load-wood-body`);
- `-2`, `-3` after either for a second one in the same car.

Part names starting `load-` are reserved (`isLoadName`). A part stands for every
commodity in its list (`CONTAINER_COMMODITIES`: a container stands for goods,
steel, lumber, cement and grain). Every commodity is one of the supply chain's (`LOAD_COMMODITIES`, the same
list as traffic.ts `COMMODITIES`: grain, wood, coal, iron-ore, stone, sand, oil,
goods, steel, lumber, cement, fuel, mail), and every one a design's loads name must
be in its `game.capacity.commodities` ([traffic.md](traffic.md)).

**The pivot sits on the bed** the load rests on - a wagon's floor, a hopper's tub
floor, a well car's deck, a ship's hatch covers or hold - so scaling the part in y
from 0 to 1 grows the load out of its bed and never lifts it off. The load's own
geometry stands at or above the pivot. A heap drawn as a surface over a hopper's
rim (Faccs, Falls) or an open box's rim (BOXN) sinks into the body as it scales
down, so a half-full hopper shows its heap half way down the tub. A stepped load
(below) is not scaled: its steps share the pivot.

## Stepped loads

A load of discrete items is **stepped**. This is the contract the game reads:

- Its entry in `userData.loads` (and the GLB scene's `extras.loads`) carries
  `steps: N`, an integer from 2 to 16 (`MAX_LOAD_STEPS`):
  `{ "part": "load-steel", "commodities": ["steel"], "steps": 9 }`. A heap's entry
  has no `steps`: `{ "part": "load-coal", "commodities": ["coal"] }`.
- The load part's Group (the GLB node) has exactly N direct children, Groups (nodes)
  named `step-0` .. `step-<N-1>`, in that order, at the load's pivot (no offset of
  their own). `step-0` holds the first item(s) loaded. Every triangle of the load
  lies under one of them; the load part draws none itself.
- The game shows step i when `i < ceil(fill * N)` - at fill 1 every step - hides the
  others, and leaves the part's scale at 1. Step names repeat from one load part to
  the next; look them up among the load Group's children.

A design opts in with `loadPart(m, commodities, floor, fn, { steps })`, `fn`
receiving `step(i, draw)` (every triangle drawn through it, each step drawn into;
the builder throws otherwise), or with `itemLoadPart(m, commodities, floor, count,
fn)`, whose `fn` receives `item(k, draw)` for `count` items in fill order and
groups them into steps (`itemSteps`: at most 16, consecutive items sharing a step -
28 cement pallets make 14 steps of a row of two). The kit's lumber and cement take
`item` (`lumberLoadPart`, `cementLoadPart`; `Kit.itemLoad` on a truck). The order
is the loading order: the bottom layer before the ones above, along the bed from
one end, a step a sensible unit - a tube, a log or two, a bundle, a row of pallets,
a car, a band of container tiers over a group of bays.

**A single unit** cannot fill in part, and must not shrink: it is stepped in two,
the unit itself first and its fittings with the second half - the Uaaikk's
transformer (the tank on its bearers, then the radiators and bushings, which travel
apart from it in practice), the heavy-lift ship's jack-up rig (hull, accommodation
and helideck, then its legs, crane and derrick) and the Sqns's Maersk box (the box,
then its Maersk livery).

- **The JS model** builds every load Group with `visible = false` and carries
  `userData.loads: [{ part, commodities, steps? }]`, in drawing order (the bundle's
  `build()` calls the builder's `hideLoads` after `toGroup`).
- **The GLB** (thumbnails, stats, checks) carries the same list as the scene's
  `extras.loads` and marks each load node `extras.load` with its commodities.
  `collectTriangles` leaves load nodes out unless asked: `{ loads: true }` for
  every one, `{ loads: "<commodity>" }` for the parts standing for it, `fill`
  (0..1, default 1) showing them as the game does (steps by `ceil(fill * N)`, a
  heap scaled in y); the triangles it returns from a load carry `load: true`.
- **The source tree** is the model at rest: the loads and their triangles are out of
  it, as the interiors are, so its ranges still tile the GLB at rest; the site's
  highlight leaves the load groups out of its parts.
- **Triangles.** `triangleCount()` counts everything; a load's counts include its steps. `exteriorTriangleCount()` is
  the model at rest (no interiors, no loads) - the catalog's `triangles` count.
  `loadTriangleCounts()` is per load part. `budgetTriangleCount()` is what a
  design's triangle budget counts: the exterior and the **largest load shown at
  once** - per commodity the parts standing for it summed (one per car), the
  largest of those.

## The looks and the palette

Every look draws in the shared materials of `LOAD_PALETTE` (a design spreads it
into its palette), so coal is the same black on every wagon, truck and barge:

| Material | Look |
| --- | --- |
| `loadCoal` | near-black heap |
| `loadIronOre` | rust brown heap |
| `loadGrain` | golden heap |
| `loadStone` | mid grey heap |
| `loadSand` | pale ochre heap |
| `loadBark`, `loadBarkDark`, `loadLogEnd` | logs: bark in two tones, pale cut ends |
| `loadSteel`, `loadSteelDark`, `loadDark` | steel: tubes, coils, a transformer's fins; bores |
| `loadBoxRed`, `loadBoxBlue`, `loadBoxGreen`, `loadBoxOrange`, `loadBoxGrey` | goods: containers, crates, a car carrier's cars |
| `loadLumber`, `loadLumberEnd`, `loadLumberGap`, `loadStrap` | lumber: sawn plank faces, pale cut ends, the lines between planks and layers, blue strap bands |
| `loadPallet`, `loadCement` | cement: the pallets and the bearers under lumber; light grey bags |

A bulk body draws one heap per **bulk look** (`BULK_LOOKS`: coal, iron ore, grain,
stone, sand, each its own part and colour) with `bulkLoads(m, floor, draw)`: the
same heap geometry five times (the mine tub four: `MINE_LOOKS` leaves out grain).
Since the budget counts only the largest load, the two new heaps cost nothing. The
vlakosimdb wagons keep their measured load shapes: the Ua's coal heap is the coal
look, its sand heap the iron ore, grain, stone and sand looks; the Maersk box keeps
its livery and the well car its two lettered boxes, as goods.

**Containers** stand for anything boxed or bagged (`CONTAINER_COMMODITIES`: goods,
steel, lumber, cement, and grain, which moves in lined boxes by rail and sea), on the
container wagons, the well car and every container ship; a ro-ro's road trailers for
the same but grain (`TRAILER_COMMODITIES`).

A flat bed draws two more looks, built from the kit so they match on every vehicle:

- **Lumber** (`lumberLoad`): bundles of sawn planks on pairs of bearers, `rows`
  along the bed, `across` side by side, `high` stacked. Each bundle
  (`lumberBundle`, about 80 triangles) is one block - its long faces and top in
  `loadLumber`, its ends in the paler `loadLumberEnd` - with thin `loadLumberGap`
  strips just proud of it for the layers' lines on the sides and ends, the planks'
  ends on the ends and the planks along the top, and two or three `loadStrap` bands
  over the top and down the sides. The bundles stagger a few centimetres so a stack
  does not look stamped.
- **Cement** (`cementLoad`): pallets of bags, `rows` by `across`. A pallet
  (`cementPallet`) is a deck board on three runners in `loadPallet` under `tiers`
  (8 by default) of `loadCement` bags, two to a tier and laid crosswise in turn;
  each bag's sides lean in to its top, so the groove between tiers reads, and the
  tiers step in and out a little. About 200 triangles a pallet at 8 tiers.

The truck kit's flatbed (`flatbedLoads`, a `flatbed` body with no `load`) draws both,
as many bundles and pallets as its deck holds: lumber two high on a deck over 5 m,
cement six tiers high (a truck counts all its triangles against its 10,000). Both are
stepped, a bundle or a pallet an item.

## The designs

| Design | Load parts (commodities, steps) | Bed |
| --- | --- | --- |
| Eas, Ua open wagons | coal, iron-ore, grain, stone, sand heaps; logs (wood: Eas 15, a bundle a step; Ua 13, a log a step) | floor 1.1 m |
| Nas flat wagon | logs (wood, 13), tubes (steel, 5), cable reels (goods, 6), lumber (4 x 2 bundles, 2 high: 16), cement (14 x 2 pallets: 14) | deck 1.2 m |
| Sqns container wagon | the Maersk 40 ft box (containers, 2: the box, its livery) | pins 1.3 m |
| Pao flat wagon | nine 0.7 m tubes on two bolsters (steel, 9), 18 logs between stakes (wood, 9), four cable reels (goods, 4), lumber (3 x 2, 2 high: 12), cement (10 x 2 pallets, 7 tiers: 10) | deck 1.2 m |
| Faccs, Falls, Wap hoppers | coal, iron-ore, grain, stone, sand heaps over an inner tub | the tub's floor |
| US double-stack well car | two containers (containers, 2: lower, upper) | well deck |
| CR C70, IR BOXN (open unit) | coal, iron-ore, grain, stone, sand heaps | floor |
| Vte (legacy open wagon) | coal, iron-ore, grain, stone, sand heaps | floor 1.2 m |
| Uaaikk (legacy heavy wagon) | a power transformer on bearers (goods, 2), five tubes (steel, 5), 18 logs (wood, 9), lumber (2 x 2, 3 high: 12), cement (8 x 2 pallets: 16) | well deck 0.6 m |
| animal-rail mine tub | coal, iron-ore, stone, sand heaps (a mine or quarry sends no grain) | the tub's floor |
| Tatra 815 tipper, world-truck tippers, the T909's trailers, the truck kit's dump bodies with `load: gravel` | coal, iron-ore, grain, stone, sand heaps | the bin's floor |
| Kenworth C500 log truck (truck kit `logs`) | logs (wood, 10: two logs a step, the bottom row first) | the bunks |
| the truck kit's flatbeds (the Unimog, the Peterbilt 379, T680 and Western Star 4900 `body=flatbed`) | lumber, cement (a bundle or pallet an item) | the deck |
| Lohr car transporter (truck kit `carCarrier`) | the cars on both decks (goods, 4: a car a step, the lower deck first) | lower deck |
| container ships (Triple E, Emma Maersk, Gulsun, Panamax, Feeder), Europaschiff, Yangtze | container stacks (containers: 15 steps, the Europaschiff 10: three bands of tiers, bottom first, each from the stern in groups of bays) | hatch covers or hold |
| Ro-Ro | trailers (goods, steel, lumber, cement: 9, a bay a step) | deck |
| heavy-lift ship | the jack-up rig (goods, 2) | deck |
| push barge | coal, iron-ore, grain, stone, sand heaps | hold floor |

The hoppers that drew an open top over their load (Faccs, Falls, Wap) and the
BOXN's solid box got an inside instead: a rim from the opening in, the walls
facing in and a floor, so an empty one is never seen into. The Eas and Ua also
carry wood: their capacity has to list `wood` beside the bulk commodities.

**Every commodity a vehicle carries is shown.** A vehicle that draws any load part
has one standing for each commodity of its `game.capacity`, at its defaults and in
each capacity variant (test/loads.test.ts). The Pao gained logs and cable reels, the
Uaaikk tubes, logs, lumber and cement beside its transformer, to match the flat bed
their capacities state. A closed body draws no load at all, whatever it carries.

A ship's load is a hull-kit item, `{ k: "load", commodities, u, floor, items, stepOf? }`:
its items drawn as one load part pivoted at `u` metres from the stern, `floor` up
(worldShipsCargo.ts `cargo`). One holding `containers` is stepped by `containerLoad`:
each stack cut into up to three bands of tiers, one block per band (top, fore and aft
faces, and of its sides only what its neighbours in the bay leave bare, since they
share its step), the steps the bottom band from the stern forward in groups of bays,
then the next band; the other items (lashing bridges) go with step 0. `stepOf`
gives any other load an item's step each (the heavy-lift rig). A truck body's load is drawn through `Kit.load`, which
also marks the masses the low detail keeps inside it as that load's.

## The distant models

A LOD draws the same loads as hidden load parts, as simple masses. **A distant load
is either one mass (a few boxes at most) scaled in y like a heap, with no `steps`,
or stepped exactly as the full model's load of the same commodities (same N,
`step-<i>` children).** Every LOD load but the well car's is a mass: the two boxes of
the well car's are stepped in two as its full model. The game reads each model's
`userData.loads` on its own, so a vehicle may show its near model stepped and its
distant one scaled. `WagonLodItem.load`
(the classic wagons), `loadLodPart` (loadKit.ts; any `LodPart`: the lodSteam wagons, the C70,
BOXN, Vte, Uaaikk, Tatra, the Pao's lumber and cement), the ship's `load` item as
one primitive, a truck's kept load masses. Lumber and cement are one block each from
afar, in `loadLumber` (its ends `loadLumberEnd` on the Nas) and `loadCement`; a
flatbed keeps each as one mass (`Kit.keep` inside `Kit.load`). `fitLod` and `fitParts` fit the budget by the budget's count (the
builder's `loadBudget`, set by the first `loadPart`), so three bulk heaps cost the
LOD one heap; the build's LOD check counts the same.

**Bundle size.** The load code stays out of the shared runtime: the mesh core only
declares `loadParts`, `loadBudget` and `hideLoads` (no code). `loadPart.ts` - the
naming, the counting and `hideLoads` - is bundled only by a design that draws a
load, and only such a bundle's `build()` calls `mesh.hideLoads(group)` after
`toGroup` (jsModel.ts finds it in the first bundle's metafile and bundles again),
so the smallest models' JS stays smaller than their GLBs.

## Thumbnails, the site and OpenTTD

- **Thumbnails** show a vehicle loaded: `readTriangles` (renderGlbThumb.ts) shows
  the first load part's first commodity unless `loads` says otherwise (`false` for
  the model at rest), so the catalog's cargo ships and wagons look loaded. The
  side view, the cards, the parade and the variant thumbnails (`src/thumbRender.ts`)
  do the same.
- **The site's viewer** gives a vehicle with loads a **Load** select - every
  commodity its parts stand for, or Empty - and a **Fill** slider (0..1) that shows
  the load as the game will (`src/viewerLoads.ts` `applyLoads`): a stepped load's
  first `ceil(fill * N)` steps at full size, a heap scaled in y from its bed. It
  opens with the first load full, as the thumbnail, or with the commodity the
  address names (`?load=`, a Chains card's: `initialLoad`, [../site/chains.md](../site/chains.md))
  when the model's loads stand for it. A scratch render can show any commodity at
  any fill with `renderGlbThumb(glb, size, { loads, fill })`. The detail page's triangle count is the model
  at rest.
- **OpenTTD**: the sprites show the vehicle loaded with its first load, as the
  thumbnail (`showFirstLoad` in `src/exportRun.ts`; the prerendered preview sheets
  the same). OpenTTD draws one sprite set per vehicle, so a loaded look that matches
  the catalog was chosen over an empty one. The presets that named a removed value
  (the well car's `cargo=empty` and `cargo=double`, the Lohr's, Triple E's and
  Europaschiff's `load=empty`) are gone: their ids stay in `generator/openttdIds.json`,
  marked `retired`, never given again. Nothing was renamed, so no alias is needed;
  the default preset keeps its ids and now draws the loaded look.
- **The build's checks** run the z-fighting check at rest and once per commodity a
  design's loads stand for (`loadCommodities`), on the full model and the LOD.

## Saved maps

A saved map keeps whatever `cargo` or `load` value its vehicles were stored with;
the game ignores parameters a model no longer has, and the vehicle draws empty
until it carries something. The legacy table (`generator/legacyTargets.json`, the
exported `legacy-models.json`) no longer names a `cargo` value; the parade
(`trainParade.ts`) builds its wagons at their defaults; the vlakosimdb comparisons
(`wagonTransfers.ts`, `freightTransfers.ts`) name the load they are measured with
(`CoachTransfer.load`) instead of a parameter.

## Tests

`test/loads.test.ts` covers the kit (names, the hidden groups and `userData.loads`,
the GLB marks, the model at rest, the thumbnail's first load, the budget's count,
the site's Load select), the stepped contract (`steps`, the `step-<i>` children in
order, every triangle under a step, the fill's `ceil(fill * N)`, the refusals of a
load drawn wrong) and per freight design that every load of discrete items is
stepped, each step adding triangles, every heap not, and a stepped LOD load matching
its full model's; that every vehicle drawing a load shows every commodity its
capacity carries (defaults and variants); that no vehicle keeps a `cargo` or loaded/empty `load`
parameter or a weight variant tied to one, and per freight design: its load parts'
commodities, each part's pivot under its load and on an upward face of the bed,
hidden at rest and marked in the GLB, the LOD's loads of the same commodities, and
for a wagon, a truck and a ship the JS module's hidden groups. `test/catalogSweep.ts`
compares the JS model's triangles, loads included, with the GLB's and checks the
loads are listed and hidden. The family tests (`wagons`, `freightWagons`,
`usTransit`, `worldShips`) check each load's place on its own vehicle.
