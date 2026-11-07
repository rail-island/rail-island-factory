# Game properties

**Covers** - what the game needs of a model beyond its geometry: a vehicle's
running figures (weight, power, top speed, acceleration), its size factor,
draft, rope and sill heights, airport class and passenger seat, their per-variant overrides,
their exported sounds, and a building's plaza and block rules, city variants, party walls, bell and helipad; where they are declared,
how they are checked and exported, and where today's values came from.
**Code** - `generator/design.ts` (`GameProperties`, `checkGameProperties`),
`generator/catalog.ts` (`metaEntry`, `exportMeta`, `withCityUse`, `exportVehicleMeta`),
`generator/cityVariants.ts`, `generator/partyWalls.ts`, `generator/helipad.ts` (`measureHelipad`), `test/cityVariants.test.ts`, `test/partyWalls.test.ts`, every
design module's `game` field, `test/export.test.ts`
**See also** - [sounds.md](sounds.md) (the `sounds` field), [export.md](export.md), [../site/openttd-export.md](../site/openttd-export.md) (the optional `openttd` block for the GRF export), [parameters.md](parameters.md),
[legacy-mapping.md](legacy-mapping.md), [vehicles.md](vehicles.md),
[reproductions.md](reproductions.md), [hospital.md](hospital.md), [industry.md](industry.md#offshore-platform)

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
| `ropes` | cable car cabins (required there) | the ropes the game draws for the cabin, which draws none: `{ kind: "haul" \| "track", zFrac, dyFrac }`, across the rope (+ the cabin's platform side) and up from the rope datum, as fractions of the height ([world-cabins.md](world-cabins.md#ropes)) |
| `ropeway` | cable car cabins (required there) | `"jigback"`: an aerial tramway's cabin, one or two to a line; `"circulating"`: any count |
| `sizeClass` | aircraft but helicopters | the largest airport class it needs: `small`, `medium` or `big`. A helicopter has none (the build refuses it): it uses pads. |
| `aircraftKind` | helicopters | `"helicopter"`: it lifts off and lands vertically on helipads and needs no runway. Absent on every other aircraft. The build refuses it on anything but an aircraft. |
| `flight` | helicopters (required there) | `{ climb, cruiseHeight, pad }`: the vertical rate of climb at lift-off (m/s, published), the height above the ground it transits at (m), and the smallest helipad class it fits, `small` or `large`, by its D-value - its overall length with the rotors turning - against `HELIPAD_D` (`design.ts`: a small pad takes up to 16 m, a large one up to 26 m; `test/worldAircraft.test.ts` checks every helicopter's class). The build refuses it on anything but a helicopter. |
| `seatFrac` | aircraft, optional | where the game's Passenger camera sits, as a fraction of the body length from the nose (0..1): the window seat with the best outlook, ahead of or behind the wing as the design judges it. Absent, the game uses its own default. The build refuses it outside 0..1 or on anything but an aircraft. |
| `sounds` | any vehicle (exported) | its horn and engine, derived from its traction and weight or stated in `generator/soundTable.ts`; written by the export, never set on the design ([sounds.md](sounds.md)) |

A vehicle's **rider seat** - where the game's avatar sits riding it - is not a
declared property: the build measures it on the model and exports it as `rider`
([rider-seat.md](rider-seat.md)).

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
- **`sounds`** (exported): its `bell`, for the churches, cathedrals and bell towers, from `generator/soundTable.ts` ([sounds.md](sounds.md#bells)).
- **`helipad`** (`HelipadDecl`): the pad a helicopter can stop at, declared by the design and measured by the export ([below](#helipads)).

Fifteen landmarks, churches and industrial buildings carry one.

### Helipads

A building with a pad a helicopter can stop at declares it as `game.helipad`
(`HelipadDecl`, `generator/design.ts`): `{ material, pad, when? }`.

- **`material`** - the palette entry the model draws the pad's touchdown surface in, and
  nothing else: a level top surface whose top is where a helicopter stands. The markings
  (edge line, aiming or touchdown circle, "H", landing net) and the lights are separate
  materials a few centimetres above it, never coplanar with it.
- **`pad`** - its class, by the largest helicopter it takes: its D-value, the overall
  length with the rotors turning, against `HELIPAD_D`: `small` up to 16 m, `large` up to
  26 m. The pad's side must be at least that D-value.
- **`when`** - the parameter selection that draws it, when only some builds have it; absent,
  every build has it.

The export measures the pad on the model (`measureHelipad`, `generator/helipad.ts`): it
builds the design with `when` (every other parameter at its default), takes the triangles in
`material`, and writes into the meta entry's `game.helipad`
`{ material, pad, when?, centre: [x, y, z], size }` - `centre` the middle of the surface's top,
`size` the side of the square on it (the smaller of its two plan extents), both in the
model's own frame and units, before the catalog's yaw and scale. The build fails when the
material is not drawn with `when`, or when the surface is not level (more than 2 % of its
side between its highest and lowest point, unless a slab's top is level).

| building | pad | `when` | measured |
|---|---|---|---|
| `proc-building-sky-glass-office` (Glass Office Tower, [skyscrapers.md](skyscrapers.md)) | small, a 17 m deck in place of the mast | `{ helipad: "roof" }` (the default `none` has no pad) | `size` 17, on the crown's roof |
| `proc-building-hospital` (Hospital, [hospital.md](hospital.md)) | small (air ambulances, H145 class), a 20 m deck raised over the ward block's roof | none | `centre` [-14, 28.4, -9], `size` 20 |
| `proc-building-industry-offshore-platform` (Offshore oil platform, [industry.md](industry.md#offshore-platform)) | large (S-92 / Mi-8 class), a 27 m helideck cantilevered off the quarters | none | `centre` [25.5, 39.7, 8.5], `size` 27 |

A design's low detail may draw its deck in the same material or not; the export always
measures the full model. `test/export.test.ts` ("helipads") checks the three and the
refusals.

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
Every building whose plan can stand against a neighbour draws them:

- the commercial street kit (`commercialStreets.ts`; the annex house has no right party wall, its
  wing stands there);
- the classic upright shop houses (`commercial.ts`; the corner shop's right side is a second shop
  front) and the terraced house (left and back, where its upper floors stay flush; above the
  street terrace its party wall stands as a firewall);
- the village's row house, `village-narrow-house` (left and right, its eave sides: the slab
  slopes down under the roof's overhang and gutter, and two neighbours' eaves meet);
- the panel slab (left and right, its end walls; a pitched roof ends there in a gable;
  [panel-houses.md](panel-houses.md));
- the brick apartment tower (left and right; its balconies face front and back) and the glass
  office tower (its podium's left, right and back, up to the podium's cornice).

Detached houses with gardens or yards round them (the other village houses, the industry halls on
their concrete aprons) and the round, stepped or twisting towers keep their windows on every side.
The tests vary the parameters one side at a time (`coverageCombinations`). `test/partyWalls.test.ts`
checks the names, that a blank side drops its windows (the glass office's podium band is covered
instead) and that the extent holds.

## OpenTTD

Every vehicle an OpenTTD GRF can hold (not the cable cars) also states `openttd`,
in one table (`generator/openttdTable.ts`, keyed by model id) rather than on its
design: the facts the GRF export needs beyond these figures - introduction year,
capacity, cargo, refits, climates, a train's rail type - with the presets the
one-click download exports and any formations of its cars; costs, lives and
reliability decay are derived from the figures here unless stated. The build fails
without the facts and presets (`checkOpenttdDesign`); the block reaches only
`catalog.json`, resolved. See [../site/openttd-export.md](../site/openttd-export.md)
and every vehicle's figures in [openttd-figures.md](openttd-figures.md).

## Checks

`checkGameProperties` runs for every design when the meta is built, so the build
fails before anything is written:

- A vehicle without `game` fails.
- So does a vehicle lacking any of the four figures, or with a figure that is not a finite, non-negative number or `null`.
- A variant fails if its `params` does not resolve against the design's parameters, sits at a default, or repeats another variant.
- A building fails if its `game` holds anything but `plaza`, `block`, `city` and `helipad`; a `helipad` without a material, with a class other than `small` or `large`, or with a `when` that does not resolve to non-default values the design has, fails too, and so does one the export cannot measure (below).
- Sounds are never set on a design: they are derived or stated in `generator/soundTable.ts`, and checked by `checkDesignSounds` ([sounds.md](sounds.md#checks)).

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
