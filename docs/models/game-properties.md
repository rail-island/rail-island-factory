# Game properties

**Covers** - what the game needs of a model beyond its geometry: a vehicle's
running figures (weight, power, top speed, acceleration), its size factor,
draft, rope and sill heights and airport class, their per-variant overrides,
and a building's plaza and block rules, city variants and party walls; where they are declared,
how they are checked and exported, and where today's values came from.
**Code** - `generator/design.ts` (`GameProperties`, `checkGameProperties`),
`generator/catalog.ts` (`metaEntry`, `exportMeta`, `withCityUse`, `exportVehicleMeta`),
`generator/cityVariants.ts`, `generator/partyWalls.ts`, `test/cityVariants.test.ts`, `test/partyWalls.test.ts`, every
design module's `game` field, `test/export.test.ts`
**See also** - [export.md](export.md), [../site/openttd-export.md](../site/openttd-export.md) (the optional `openttd` block for the GRF export), [parameters.md](parameters.md),
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

### City variants

What the game's cities may stand of a building is the factory's
(`generator/cityVariants.ts`), exported on every building a city builds as `game.city`:

- `variants`: its **shape** variants, every combination of the parameters a city may vary
  (its pool family's `FAMILY_VARY` - storeys and width for the commercial streets, size for
  a skyscraper - or the design's own `DESIGN_VARY`, limited by `FAMILY_VALUES`), each with its
  non-default `params`, its measured `size` (x, y, z at scale 1: the game sizes a lot from it
  without building anything) and its height `band` (`HEIGHT_TAGS`: storeys 1-2 low, 3-4 mid,
  5 and up tall; a skyscraper's size);
- `colours`: its **colour** parameters (the design's `finishParams`, which change no extent),
  every value with the named palettes it belongs to (`COLOUR_TAGS`: a red roof is warm and
  brick); a value tagged with none (an `original` finish) is neutral in every palette;
- `party`: the sides it can draw as a blank **party wall** (below).

A city samples the colours freely under its block's colour scheme and picks shapes under its
height band (sets.md, "Block types"). A building in a city pool (its catalog `group`) gets its
family's defaults, so a new design in a pool family appears in cities with no further line; one
too wide for any city lot at its placed scale opts out in `NOT_IN_CITIES` (it stays placeable by
hand). `test/cityVariants.test.ts` holds every variant the old fixed presets built
(`test/fixtures/city-presets-baseline.json`) reachable as a shape and a colour, the sizes to the
build, and every colour value tagged.

### Party walls

A street house a neighbour stands against draws that side blank: no windows, no trim or roof
overhang reaching into the neighbour (`generator/partyWalls.ts`). A design that supports it has a
parameter per side - `partyLeft`, `partyRight`, `partyBack` (left is -X, right +X, front +Z the
street), values `no` and `yes` - and the city sets them where its fill finds two footprints
sharing a face. A blank side is a solid slab out to where the windowed variant's extent ends, so
the extent never changes: the game centres a building on it and stands the next one against it.
The commercial street kit (`commercialStreets.ts`; the annex house has no right party wall, its
wing stands there) and the classic upright shop houses (`commercial.ts`; the corner shop's right
side is a second shop front) draw them; the tests vary them one side at a time
(`coverageCombinations`). `test/partyWalls.test.ts` checks the names, that a blank side drops its
windows and that the extent holds.

## OpenTTD

A vehicle may also declare `openttd` (introduction year, lives, costs, capacity,
cargo, climates, rail type, refits, with its own `variants`): what the site's GRF
export needs beyond these figures. It is optional, reaches only `catalog.json`
and is checked by `checkOpenttdProperties`; see
[../site/openttd-export.md](../site/openttd-export.md).

## Checks

`checkGameProperties` runs for every design when the meta is built, so the build
fails before anything is written:

- A vehicle without `game` fails.
- So does a vehicle lacking any of the four figures, or with a figure that is not a finite, non-negative number or `null`.
- A variant fails if its `params` does not resolve against the design's parameters, sits at a default, or repeats another variant.
- A building fails if its `game` holds anything but `plaza`, `block` and `city`.

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

Vehicles added after the snapshot state their own published figures, noted
beside the declaration: the JR KiHa 40 (JR Hokkaido's re-engined 1700 series),
the small airplane (a light sport aircraft with a Rotax 912) and the chairlift
chair (a detachable chair at 5 m/s, its rope and platform fractions from
[cable-cabins.md](cable-cabins.md)).
