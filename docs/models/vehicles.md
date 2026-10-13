# Vehicles

**Covers** - the procedurally generated road vehicles (today one American
truck), the conventions they are modelled in, the `sweep` primitive they are
mostly built from, and how to add one.
**Code** - `generator/vehicles.ts`, `generator/design.ts`, `generator/meshBuilder.ts` (`sweep`), `test/models.test.ts`
**See also** - [skyscrapers.md](skyscrapers.md) (the mesh builder, "Flicker"), [export.md](export.md), [source-tree.md](source-tree.md)

## The designs

| id | title | look |
|---|---|---|
| `veh-american-truck` | American Truck | long-nose conventional tractor: chrome grille, sleeper, twin stacks, tandem drive axle |

`VEHICLES` in `vehicles.ts` lists them as `{ id, title, build }`, the same
`ProceduralDesign` shape as the skyscrapers (`design.ts`). `VEHICLE_CATALOG`
beside it holds the game-catalog fields they share - category `Road vehicles`,
group `truck`, `defaultScale` 1, CC0 by Rail Island - which the build writes into
`vehicles.meta.json` ([export.md](export.md)). Those values are a first guess
for the game's vehicle import; settle them when the webapp side is written.

**The ids are stored in the game's saved maps**: never rename one that has
shipped. Vehicle ids start with `veh-`.

## Conventions

- Metres, **+X forward**, +Y up, +Z to the vehicle's right; centred on z = 0.
- The wheels **stand on y = 0**. A tyre is a 16-gon with a flat side down, so the
  axle sits at `WHEEL_R * cos(pi / 16)`, not at the radius.
- Real proportions: the tests hold a vehicle under 2.7 m wide (2.6 m legal,
  plus mirrors) and 4.115 m high (13 ft 6 in), longer than twice its width, and
  under 4,000 triangles.
- The GLB's generator string is `Rail Island procedural vehicle (<id>)` and its
  one node is named `vehicle`.
- Chrome is only mildly metallic (0.45): the game and the site light models with
  no environment map, where a fully metallic surface renders nearly black.

## Sweeps

A building is lofted between horizontal rings; a vehicle is mostly the same loft
laid on its side. `m.sweep(mat, axis, s0, a0, s1, a1, caps = true)` draws the
walls between two vertical cross-sections at `a0` and `a1` along the horizontal
`axis` (`"x"` or `"z"`), with both end caps unless `caps` is false:

- a section's points are **(x, y) for a sweep along z** and **(z, y) for one
  along x**, in either winding - the sweep normalises it, so the walls always
  face out (tested);
- both sections must be convex (caps are triangle fans) and of equal length.

What the truck builds with it:

| part | sweep |
|---|---|
| a wheel, an axle | an `ngon` in (x, y) along z |
| the cab, the sleeper, the visor | the side profile in (x, y) along z |
| the hood | a chamfered (z, y) section along x, to a slightly smaller one |
| a fuel tank, an air horn | an `ngon` in (z, y) along x |
| a closed box (`block()`) | a (z, y) rectangle along x - six faces, unlike `box()`, which has no floor |
| a fender (`plate()`) | quads between two parallel side-view polylines, each along z |

A non-convex outline, such as a fender's arch, is several convex sweeps: `plate()`
makes one quad per segment, and neighbouring quads meet back to back.

Vertical cylinders (exhaust stacks, air cleaners) are ordinary `prism`s.

## Flicker

The same rule as the skyscrapers ([skyscrapers.md](skyscrapers.md), "Flicker"),
and the same build guard. Details that sit on a surface (windows, lamps, door
handles, a grille's bars) are **sunk into it**, a centimetre or two behind the
face they sit on, and stand a centimetre or more proud of it: never flush with a
face of another material. The grille's dark mesh starts 1 cm inside the chrome
shell for that reason - flush, its back face shared a plane with the bars'.

## Adding a vehicle

1. Write a function in `vehicles.ts` that returns a `MeshBuilder` over
   `VEHICLE_PALETTE`, and add it to `VEHICLES` with a `veh-` id and a title.
   Wrap every part in a named `m.scope(...)` - chassis, each axle, hood, cab - so
   the site's Source tab reads like the design.
2. `pnpm build:models`, then look at `export/thumbs/<id>.png`.
3. `pnpm test` - every design's z-fighting, scope and source-tree checks run
   over the vehicles too, plus the vehicle shape checks above.
