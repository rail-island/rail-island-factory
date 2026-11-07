# Procedural industry

**Covers** - the Industry audit, twelve parametric families (the offshore platform at sea with its helideck among them), geometry budgets and future game migration.
**Code** - `generator/industry.ts`, `generator/offshorePlatform.ts`, `generator/industryHall.ts`, `generator/industryMigration.ts`, `generator/generate.ts`, `test/industry.test.ts`
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
| industry-oil-pump | industry-oil-pump | Two sizes, open trestle, crank wheels on the gear reducer, pitman arms and horsehead; the `pumping` clip moves the mechanism ([animation.md](animation.md)) |
| industry-wind-turbine | industry-wind-turbine | Two heights; three-section tapered tower with flanges, entrance platform and transformer kiosk; nacelle with cooler, wind sensors and obstruction light; spinner and three twisted aerofoil blades with red tips, turned by the `wind` clip ([animation.md](animation.md)) |
| industry-offshore-platform | (new, a draft) | Steel jacket on the waterline, cellar and main decks, living quarters with a lifeboat station, process and power modules, workover derrick, pedestal crane, flare boom and a large helideck ([below](#offshore-platform)) |

## Geometry and export

All geometry is generated from deterministic primitives in metres, +Y up, at
ground y=0. Catalog defaultScale is 1. The budget is a ceiling of 10,000 triangles
for **every** parameter combination, not a target to fill with invisible detail.
The 52 combinations currently range from 598 to 9,202 triangles; the four factory
buildings use 4,000-9,200, the wind turbine about 2,000 (its slender tower and
blades need no more to read at game distance).
Small standalone equipment deliberately uses fewer triangles. Named scopes expose
structure in the factory's source tree. Geometry is shared by GLB and standalone
JS exports; only default variants have static thumbnails and GLBs.

The turbine's rotor node is retained and a six-second looping GLB animation turns
it. The pumpjack is static. Every chimney, cooling tower and flare stack carries its
own emitter where it is drawn ([emitters.md](emitters.md)); nothing is copied from
the old geometry's coordinates.

## Offshore platform

`proc-building-industry-offshore-platform` (`generator/offshorePlatform.ts`, re-exported by
`industry.ts`, which stays the family's JS entry) is an oil and gas production platform at sea,
the factory's counterpart of OpenTTD's oil rig. It is a **draft** (not in
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
