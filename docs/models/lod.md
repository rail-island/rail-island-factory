# Low level of detail

**Covers** - distant geometry for every standalone JS export, triangle budgets and the factory preview switch.
**Code** - `generator/lod.ts`, `generator/lodKit.ts`, `generator/lodLocos.ts`, `generator/lodClassic.ts`, `generator/lodUnits.ts`, `generator/lodTrams.ts`, `generator/lodSteam.ts`, `generator/lodRoad.ts`, `generator/lodAir.ts`, `generator/lodBuildings.ts`, `generator/lodCommercial.ts`, `generator/lodStreets.ts`, `generator/lodVillage.ts`, `generator/lodStations.ts`, `generator/lodFountains.ts`, `generator/lodLandmarks.ts`, `generator/cd163.ts` (`cd163LodBody`), `generator/boxLocoKit.ts` (`boxLocoLod`), `generator/rig.ts`, `generator/lodModel.ts`, `generator/lodPrimitives.ts`, `generator/meshCore.ts`, `generator/jsModel.ts`, `generator/towers.ts`, `src/ModelDetail.tsx`, `src/ModelViewer.tsx`, `test/lod.test.ts`, `test/lodKit.test.ts`, `test/lod-*.test.ts`.
**See also** - [js-format.md](js-format.md), [parameters.md](parameters.md), [vehicle-rig.md](vehicle-rig.md), [../site/catalog-site.md](../site/catalog-site.md).

## Consumer API

Every `export/js/<id>.js` accepts the optional third boolean argument `lod`:

```js
import build, { lodTriangleBudget } from './proc-vehicle-karosa-short.js';
const full = build(THREE);                    // Existing API, full resolution
const low = build(THREE, undefined, true);    // Default variant, low detail
// A parameterized LOD: pass any valid selection from the exported params.
const variant = build(THREE, chosenParameters, true);
```

Use the module's exported `params` to discover valid enum values. The third argument
is independent of those values and must be a boolean. Omitting it or passing `false`
keeps the original geometry. Each returned group records the choice in `userData.lod`.
`lodTriangleBudget` is the limit for the **entire model**, summed across all parts
and materials, including a complete articulated bus. It is not a per-mesh allowance.

| Models | Maximum triangles |
| --- | ---: |
| Rail and road vehicles, ordinary buildings, village houses, ships, cabins and other ordinary models | 100 |
| An articulated vehicle or trainset (its full rig has n sections) | min(300, 100 n); the Shinkansen 0 series and the TGV Duplex min(500, 100 n) |
| Aircraft | 200 |
| Historical buildings (including the castle), towers and skyscrapers | 500 |
| Woods models (a grove of a few hundred coarse trees, the site's only; [woods.md](woods.md)) | 12,000 |

A design can set `lodTriangles` to override its family policy (the TGV does:
its default build is the lone power car, its sets have up to six cars; the
Shinkansen 0 series and the TGV Duplex set 500 for their trains of up to 16 and
12 cars). Stable model ids,
scale, coordinates and parameter choices stay the same. The thumbnail,
metadata and source tree remain the full-resolution defaults.

## Geometry

The trees add a third, coarsest level below it, `buildCoarse` (at most 20 triangles,
exported as `buildCoarse(THREE)`), because a forest needs a geometry an order of
magnitude below `low` for the distance ([trees.md](trees.md)).

Every design supplies its own distant model, `buildLod`, exported from the same
source module as its `build` and resolving the same parameters; a design without
one does not compile (`ProceduralDesign.buildLod` is required) and there is no
generic fallback (docs/specs/2026-10-17-dedicated-model-lods.md). Polygon
decimation and convex hulls of the full model are not used: a family's adapter
reads the family kit's own dimensions, profile tables, paint bands and liveries,
so the distant model follows the full one and every variant.

A distant model keeps, in this order: its silhouette (bodies, cab shapes, noses,
hoods, boilers, wings, roofs, towers, spires, tiers), its colours as bands, then
- vehicles only - its windows. Buildings show no windows. Lettering, logos,
lamps, rails, rods and small fittings are left out. Rail vehicles stand on their
running gear as dark blocks reaching the rail, road vehicles on hexagonal
wheels, electric stock carries its raised rear pantograph.

### The shared vehicle kit

`lodKit.ts` holds what every vehicle LOD shares; the CD 163 / 263
(`cd163LodBody`) and the mainline electrics built from a `LocoSpec` - CD 180 /
181 / 182, DNT 184.5, DB 111, DR 243 / DB 143 / 112, OBB 1012 and 1040
(`boxLocoLod`) - use it directly, the families below through their adapters.

- **Shell** (`lodShell`): the body as a stack of plan rings from the family's own
  profile tables - the half width `hw(y)` and each end's centre line and, for a
  rounded or pointed nose, its corners' setback, drawn as a vee. A symmetric body
  gives one end (`tip` from `xc`, `setback`); a body whose ends differ (a tram
  section's cab and joint ends, a single-cab car's nose and square inner end, a
  driving trailer) gives `front` and `rear`, each with its own tables, paint and
  windscreens. Sides and ends are painted in the livery's colour bands; cab paint
  covers the cab sections of the sides (`cab` for a symmetric body, `cabs` as x
  ranges). An end can be hidden (a hood against its cab, an end inside a set).
  The crown is capped, the bottom is open. Faces of different colours never share
  a plane.
- **Windows**: windscreens and window bands in one dark material, `lodGlass`
  (`LOD_GLASS`) - the only glass a vehicle LOD may use (`test/catalogSweep.ts`).
  `windowBands` joins a split windscreen into one band; a windscreen within
  0.2 m of the corners spans the whole end. Small windows (a cab's side
  windows) are optional parts.
- **Parts**: `lodBogie` (a dark block narrowing toward the rail), `lodSideBox`
  (frame, equipment), `lodRoofBox` (roof covers, cooler boxes), `lodPantograph`
  (raised: two arms as rods without their downward face and the collector as a
  ridged bar; folded: a low ridge). One pantograph is raised, the rear one, as in
  full detail.
- **Fitting** (`fitLod`): the family states what is optional; the kit builds
  the LOD and, while it is over its budget, gives up in this order: the optional
  parts and small windows (lowest rank first: the folded pantograph, small
  windows, short roof boxes, the frame strip, the underframe equipment; those
  ranked `LATE` or higher, a second window row, only after the profile), the
  profile's detail (its tables simplified within 0.03 to 0.4 m - to 1.0 m for a
  `coarse` spec, a unit's long cars - a vee nose flattened halfway back), the
  least visible colour band (the thinnest; a band painted on sides and ends alike
  goes from both, an end or cab band counts half and a cab band then shows the
  sides' colours; a band goes from every section of an articulated set alike,
  while the shells of one body keep their own; a body's roof band stays), then
  the smallest window. Optional parts that fit again afterwards come back. The
  result is deterministic. `fitParts` does the same for a model of parts only (a
  building) without bundling the shell painter.
- **Sections** (`LodSpec.sections`): an articulated vehicle's LOD keeps one node
  per section (`section<i>`, pivoted at the full rig's hinges) and its bellows
  (`joint<i>`, drawn by the rig's own `drawJoint`), so the game poses and
  re-skins it like the full model (`drawSections`); bogies and steered wheels
  stay fixed.
- **Solids**: `lodBlock` (a box, each face group in its own material or left
  out), `lodPrism`, `lodNgon`, `lodWheel` (standing on a flat side; all, the
  lower or none of its tread faces), `lodGableRoof`, `lodHipRoof`, `lodRod`,
  `lodPolygon`. The family files keep only what is their own; what two families
  need comes from here.

### The families

- **Czech electrics, mainline and small diesels** (`lodLocos.ts`): one shell
  adapter per kit - `czShellLod` for czElectricKit's ShellSpec, `boxLod` for the
  shunters' BoxSpec (a hood through the cab split either side of it, `cutBox`),
  `planBodyLod` for dieselParts - and one assembly, `locoLod`, for frames or
  walkway decks, running gear, roof boxes, ploughs, tanks and pantographs.
  Painted surrounds and sweeps become bands (`overlay`).
- **CD 150, CD 230, CSD coaches, Bmo, CD green-white coach, the vehicles.ts
  wagons and the American truck** (`lodClassic.ts`): `coachLod` runs a coach's own
  builder with the coach kit's volume, window, door, bogie and axle calls recorded
  instead of drawn, and turns them into shells, window bands and running gear;
  `wagonLod` draws open bodies, decks, the tank, hoppers and every load.
- **Multiple units and railcars** (`lodUnits.ts`): `coachBody` reads each car's
  coach-builder volumes (rounded plans as vees, cab and nose paint), `dmuBody` the
  DMU kit's windows, `noseEnd` the `cabNose` profiles; each car is a kit shell
  with its two ends of its own, fitted by `fitLod` (`coarse`). The TGV set keeps
  its sections on the Jacobs bogies.
- **Trams, CZ/SK and German coaches** (`lodTrams.ts`): `volumeShell` reads the
  coach builder's volumes one end at a time into kit shells with two ends of
  their own; `tramLod` (the KT8, KT4 and GT4 keep their
  sections and bellows; the 81-71 metro uses it too), `liveryCoachLod`,
  `doubleDeckLod` (two window decks, the dropped belly, driving trailers).
- **Steam locomotives and freight wagons** (`lodSteam.ts`): `steamLocoLod` reads
  the steam LocoSpec - an octagonal boiler, smokebox, chimney, domes, cab, tanks,
  bunkers, tender, static wheel blocks in their paint, no rods; `freightWagonLod`
  turns the JT7 clip solids, boxes and loads into painted shells.
- **Buses and trucks** (`lodRoad.ts`): `roadBody` stacks each mass between its
  own front and rear profiles; `busLod` reads the bus kit's description and the
  notes the bus draft records beside its fittings (glass, doors, bumpers, roof
  boxes); `truckLod` the trucks' cabs and loads. Articulated buses keep their
  sections and bellows, semi-trucks their tractor and trailer (no joint).
- **Aircraft, ships and cabins** (`lodAir.ts`): `airLod` draws every aircraft and
  livery from its own tables - an n-gon fuselage tube painted in the livery,
  four-point airfoils, fins in their bands, nacelles; retractable gear is left
  out. `cabinLod` draws the cable car cabins and chair; the ferries stack their
  hull plans (`lodStack`). Ship and cabin LODs keep the full height range that
  draftFrac, ropeFrac and boardFrac refer to.
- **Ordinary buildings**: one adapter per kit - `lodCommercial.ts` (commercial
  houses), `lodStreets.ts` (commercial streets), `lodVillage.ts` (village houses,
  timber cottages, alpine hut), `lodStations.ts`, `lodFountains.ts` - on the
  shared building solids in `lodBuildings.ts`: masses, roof shapes (gable, hip,
  mansard, barrel, parapet), wall and finish colours; chimneys, dormers, belts and
  balconies are optional and give way through the kit's `fitParts`. Each kit has
  its own file so a model's standalone JS bundles only its own kit.
- **Landmarks, towers, skyscrapers** (`lodLandmarks.ts`): `skyscraperLod` for all
  ten towers from layout functions the full models share (glass drawn as wall
  paint of its colour, `TowerMesh` in LOD mode), `lodLathe` for domes, onions and
  spires, the Gothic cathedrals' `vesselLod` / `transeptLod`, the churches' and
  towers' own roof helpers. The industrial models, castle, Colosseum, pagoda,
  palace, station hotel, Brandenburg Gate, St Basil's, Eiffel and transmission
  towers, ocean liner and cruise ferry keep their earlier dedicated builders.

The process is deterministic. A LOD builder constructs only the low-detail
geometry. Consumers should cache built variants.

LOD has no animation clips, steering or rail supports. A rigid model's LOD has no
rig, and `pose` and `renderJoint` leave it unchanged. An articulated vehicle's LOD
carries `userData.rig` with its `sections`, `joints` and `maxBendDeg` only, and
`pose` / `renderJoint` bend it as the full model. Rebuild at full resolution to
animate a vehicle or turn its bogies and wheels. Full-detail geometry, source
trees and the existing API are unchanged.

## Factory GUI

The model detail panel has a **Level of detail** select: *Full detail* (initially),
*Low (LOD)*, and for a model whose record carries `coarse` (the trees) *Coarse
(distant forest)*, which builds its `buildCoarse`. The choice persists while stepping
between models; a model without a coarse level shows its LOD while *Coarse* is chosen. Enabling it loads
the model's JS export even at default parameters. Switching resolution keeps the
camera position and current enum choices; asynchronous stale loads are discarded.
The preview shows its actual triangle count. The Specs tab still describes the
full-resolution downloadable files.

Source-tree highlighting/picking and rig pose controls are disabled in LOD and coarse because
the source tree addresses full-detail triangle ranges. Returning to full detail
restores them. No browser automation is required for headless verification.

## Verification

The catalog sweep (`test/catalogSweep.ts`) compares every standalone default LOD with its generator
geometry (in model space) and checks deterministic output, unit normals and the
rig contract (none, or sections and joints that `pose` bends).
It builds the defaults and a fixed sample of the other combinations (every one with
`TEST_ALL_VARIANTS=1`, [../guide/setup-and-build.md](../guide/setup-and-build.md)) and
checks triangle budgets, finite coordinates, missing detail materials and the
same coplanar-overlap detector used for full models. Regressions specifically
cover long hoods and boilers and the open Colosseum arena. `test/lodKit.test.ts`
covers the kit, and each family has `test/lod-<group>.test.ts`: budget use per
variant, running gear reaching the ground, livery colours, sections.

`generateModels` checks both full detail and LOD for flickering surfaces before
writing any export file. Tests also inject a valid full model with a deliberately
flickering LOD to verify that this guard cannot silently skip the low variant.
Existing JS tests continue to compare full-detail geometry with its GLB.
Review full/LOD contact sheets for all models and representative non-default
variants when changing a LOD builder; triangle counts alone do not establish visual quality.
