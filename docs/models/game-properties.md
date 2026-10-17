# Game properties

**Covers** - what the game needs of a model beyond its geometry: a vehicle's
running figures (weight, power, top speed, acceleration), its size factor,
draft, rope and sill heights and airport class, their per-variant overrides,
and a building's plaza and block rules; where they are declared, how they are
checked and exported, and where today's values came from.
**Code** - `generator/design.ts` (`GameProperties`, `checkGameProperties`),
`generator/catalog.ts` (`metaEntry`, `exportMeta`, `exportVehicleMeta`), every
design module's `game` field, `test/export.test.ts`
**See also** - [export.md](export.md), [parameters.md](parameters.md),
[legacy-mapping.md](legacy-mapping.md), [vehicles.md](vehicles.md),
[reproductions.md](reproductions.md)

## Where they live

Each design states them in its own declaration, as `game`
(`ProceduralDesign.game`, a `GameProperties`). A short block sits inline after
the design's `id`; a long one (many variants) is a named constant just above the
design list in the same module, e.g. `CD_163_GAME`. The item types of the mapped
lists (`SteamDesign`, `TramDesign`, `WagonDesign`, `FreightDesign`,
`CoachDesign`) carry a required `game`, which their map hands on.

The build writes the block, unchanged, into the design's meta entry as `game`
(`skyscrapers.meta.json`, `village.meta.json`, `vehicles.meta.json`), and
the site's `catalog.json` record inherits it. The webapp's procedural build reads
it from there ([export.md](export.md)).

## Vehicles

Every vehicle states all four running figures, a number or `null` where the game
has none (a coach's or wagon's power is 0, a cable car cabin's weight is null):

| Field | Unit | What |
|---|---|---|
| `weight` | t | mass |
| `power` | kW | traction power |
| `maxspeed` | km/h | top speed |
| `accel` | m/s2 | acceleration; null lets the game derive it |

The fields below are set only where they apply:

| Field | Applies to | What |
|---|---|---|
| `scale` | some vehicles | the on-map size factor the game applies. It is absent (1) for most vehicles, and for ships and aircraft, whose length scale comes from the legacy table ([legacy-mapping.md](legacy-mapping.md)). |
| `draftFrac` | ships | fraction of the model's height below the waterline |
| `ropeFrac` | cable car cabins | fraction of the height at the rope |
| `boardFrac` | cable car cabins | fraction of the height at the door sill |
| `sizeClass` | aircraft | the largest airport class it needs: `small`, `medium` or `big` |

`variants` lists the parameter variants whose figures differ from the design's:

- each entry's `params` is the variant's **non-default** selection, matched exactly;
- each entry lists only the fields that differ.

For example, the CD 163's `livery: "cd162"` runs at 140 km/h, not 120:

```ts
variants: [
  { params: { livery: "cd162" }, maxspeed: 140 },
  { params: { livery: "cd362" }, weight: 87, power: 3060, maxspeed: 140 },
]
```

## Buildings

A building sets `game` only for its placement rules, in the webapp's shapes:

- **`plaza`** (`PlazaUse`): which city types' main square it may stand on, which layouts, and how the square fits it.
- **`block`** (`BlockShape`): the rectangles of its plan that block rails and roads, as fractions of the plan. Examples are the Eiffel Tower's four legs and the wind turbine's mast.

Fifteen landmarks, churches and industrial buildings carry one.

## Checks

`checkGameProperties` runs for every design when the meta is built, so the build
fails before anything is written:

- A vehicle without `game` fails.
- So does a vehicle lacking any of the four figures, or with a figure that is not a finite, non-negative number or `null`.
- A variant fails if its `params` does not resolve against the design's parameters, sits at a default, or repeats another variant.
- A building fails if its `game` holds anything but `plaza` and `block`.

`test/export.test.ts` ("game properties") covers each refusal and pins two
examples.

## Where today's values came from

The values were taken over **once** (2026-10-17) from the game's old hand-authored
models. Until then the webapp's procedural build looked each figure up in its
old GLB pipeline's manifests, matching a design to its best old model through the
legacy table. The snapshot is the figures the game was using at that moment,
read from the webapp's built `manifest.json` and `buildings.json`, per design and
per variant. A design no old model maps to got the category defaults the game
used for it.

They are ordinary design data now: change them in the design, and state them
for every new vehicle. There is no other source.
