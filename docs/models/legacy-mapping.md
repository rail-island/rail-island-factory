# Legacy model mapping
**Covers** - the complete Creator inventory, procedural IDs, real dimensions and on-the-fly saved-map compatibility.
**Code** - `generator/legacyCatalog.json`, `generator/legacyTargets.json`, `generator/legacyMapping.ts`, `generator/modelReference.ts`, `generator/modelId.ts`, `generator/generate.ts`, `test/modelReference.test.ts`
**See also** - [export.md](export.md), [remaining-models.md](remaining-models.md), [commercial-streets.md](commercial-streets.md), [industry.md](industry.md)

## IDs and inventory

All exported factory IDs and filenames use `proc-building-<name>` or
`proc-vehicle-<name>`. The registry canonicalizes the building families' authoring
keys; these are not saved-map aliases. Vehicle declarations and their comparison
configurations use the canonical IDs directly. `proceduralId()` is an authoring
helper, not a legacy resolver: never use it to convert a saved map's ID.

The source snapshot contains all **531** shipped Creator records, including **77
archived records**. It is a deterministic projection of the webapp's
`public/models-catalog.json` (webapp checkout `d85d2588`). Source dimensions are
those of the game's built GLBs, not the unscaled source meshes. This matters for
aircraft and ships whose game build changes axes and length. `legacyTargets.json`
records explicit reviewed target families and parameter overrides. The commercial
inventory supplies the more detailed street-house overrides directly. The existing
industrial correspondence is reused; this change adds no industrial model.

Every source ID must have a target. Unknown targets, unknown parameter names,
invalid enum values and non-positive bounds fail export. The generator resolves
and writes **every parameter**, including defaults, so a later factory default
change cannot silently change an old map's appearance.

`quality` distinguishes a reconstruction (`reproduction`), a related parametric
architectural family (`family`), and an intentionally omitted/archived model's
replacement (`substitute`). Substitutes carry a reason. The 23 deferred commercial
models are mapped as replacements; the hospital sign receives a low-rise office
building replacement and is explicitly approximate. Archived narrow-gauge vehicles
use their closest available role; the game retains responsibility for their gauge,
running behaviour and scaling.

## Units and defaults

Factory geometry is in metres. Building storeys, doors and vehicle bodies share
that unit; old placement factors such as 1.88 are not baked into the new geometry.
`defaultScale` is exported only for **buildings, aircraft and ships**. It is 1,
except the Eiffel Tower's explicit 0.55 placement preference; its geometry is still
330 m high. The game owns sizing for road/rail vehicles and cable cabins, which have
no exported defaultScale. Native vehicle orientation remains explicit in `yaw`
where applicable, in degrees, using the existing game's convention. A cable cabin
runs along X in the game; the aerial tramway car is modelled long along Z and so
carries `yaw: 90`, as the old model did.

## Export and runtime

The build adds two standalone files:

- `legacy-models.json`: version 1, `entries` keyed by the unchanged old game ID.
- `model-reference.js`: the pure `resolveModelReference` helper; no THREE, filesystem,
  network or model geometry dependency.

Each entry includes `modelId`, complete `params`, `scale`, `sourceDefaultScale`,
`archived`, `quality`, `scaleAxis`, and the source/target native dimensions.
For a building, `scale = sourceHeight / targetHeight` (`scaleAxis = "height"`),
unless that gives the building a bigger plan than the old model's: then
`scale = sqrt(sourceW * sourceD / (targetW * targetD))`, so the plan area equals the
old one and the building comes out lower (`scaleAxis = "footprint"`). A saved map
keeps the old model's footprint and blocking, so a larger plan would spill into its
neighbours. For an aircraft or ship,
`scale = sourceBuiltLength / targetLength` along its yaw-adjusted longitudinal axis.
For all other vehicles `scale = 1` and `scaleAxis = "game"`.

Uniform scaling cannot retain every dimension when substituting a differently
proportioned model. Buildings preserve height up to the old plan area, aircraft and
ships preserve length; width/depth can change. Both bounding boxes are included for review. This is an
explicit approximation, not an anisotropic deformation of a model.

```js
import { resolveModelReference } from './model-reference.js';
const models = new Map(catalog.records.map(model => [model.id, model]));
const rendered = resolveModelReference(
  legacyTable, models, saved.modelId, saved.scale, saved.params
);
// Load rendered.modelId and build it with rendered.params.
// Apply rendered.scale to this render instance only.
```

For a legacy ID, the result's scale is `saved.scale * entry.scale`. Only when the
saved scale is absent does it use `entry.sourceDefaultScale * entry.scale`.
Never multiply by the new model's defaultScale again. For a procedural ID,
preserve an explicit instance scale, otherwise use its defaultScale or 1.
Unknown IDs return `undefined` so the consumer can use its existing custom-model
loader; missing known targets and invalid parameters/scales are errors.

The resolver does not mutate any saved object or write any map. Keep the old ID
and scale when saving an unchanged old placement. Re-resolve from that stored
reference on every load; do not feed an already multiplied scale back together
with the old ID. A procedural reference passed through again keeps its scale.
The `legacy` result flag distinguishes these two cases.

Importing the exports and wiring the renderer, footprint cache, picking and
vehicle metadata into the game is a separate step. This factory change does not
rewrite the webapp's catalogs, GLBs or saved maps. In particular, aircraft gear,
ship waterline and cabin attachment metadata must be reconciled during that import.
