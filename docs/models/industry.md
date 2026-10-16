# Procedural industry

**Covers** - the Industry audit, eleven parametric families, geometry budgets and future game migration.
**Code** - `generator/industry.ts`, `generator/industryMigration.ts`, `generator/generate.ts`, `test/industry.test.ts`
**See also** - [parameters.md](parameters.md), [export.md](export.md), [animation.md](animation.md)

## Scope and design

The webapp catalog was audited including thumbnails for all 35 entries in the
Industry category: 31 in the industry group plus chemical-factory, coal-plant,
nuclear-plant and oil-refinery. These are new procedural designs inspired by
industrial building types, not geometry conversions of the licensed source GLBs.
No source mesh or texture is embedded. New geometry is CC0, authored for Rail Island.

Twenty small factories become four architectural families, with compact/extended
footprints and brick/blue/cream finishes. Each includes loading doors, raised
ramps, bollards, framed glazing and structural piers. Roofs distinguish the
families, rather than twenty minor variations of the same box.

| Factory design | Replaces source models | Parameters / character |
|---|---|---|
| ind-building-a | ind-building-a,b,d,f,g,l,o | Multi-storey mill, roof lights, stack and service gallery |
| ind-building-h | ind-building-h,i,j | Gabled assembly hall with ridge ventilation |
| ind-building-k | ind-building-k,m,n | Repeated sawtooth roof with northlight glazing |
| ind-building-s | ind-building-c,e,p,q,r,s,t | Warehouse, canopy and loading bays |
| ind-chimney-basic | ind-chimney-basic,large,medium,small | Three heights and brick/striped/steel finishes; recessed mouth, service ladder |
| ind-detail-tank | ind-detail-tank | Horizontal vessel, vertical tank, twin tank cluster |
| industry-factory-a | industry-factory-a,b,c | Heavy works with three stacks; two sizes and three finishes |
| industry-power-plant | industry-power-plant, coal-plant, nuclear-plant | Thermal/coal/nuclear installations, cooling towers, turbine hall and switchyard |
| chemical-factory | chemical-factory, oil-refinery | Chemical/refinery process train, columns, platforms, pipe rack and storage |
| industry-oil-pump | industry-oil-pump | Two sizes, open trestle, crank wheels on the gear reducer, pitman arms and horsehead; the `pumping` clip moves the mechanism ([animation.md](animation.md)) |
| industry-wind-turbine | industry-wind-turbine | Two heights, tapered mast, nacelle and three-blade rotor turned by the `wind` clip ([animation.md](animation.md)) |

## Geometry and export

All geometry is generated from deterministic primitives in metres, +Y up, at
ground y=0. Catalog defaultScale is 1. The budget is a ceiling of 10,000 triangles
for **every** parameter combination, not a target to fill with invisible detail.
The 51 combinations currently range from 290 to 6,790 triangles.
Small standalone equipment deliberately uses fewer triangles. Named scopes expose
structure in the factory's source tree. Geometry is shared by GLB and standalone
JS exports; only default variants have static thumbnails and GLBs.

The turbine's rotor node is retained and a six-second looping GLB animation turns
it. The pumpjack is static. Every chimney, cooling tower and flare stack carries its
own emitter where it is drawn ([emitters.md](emitters.md)); nothing is copied from
the old geometry's coordinates.

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
