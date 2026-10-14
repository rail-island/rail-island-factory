# Vehicles

**Covers** - the procedurally generated road vehicles (an articulated American
truck and the CD 163 electric locomotive), their triangle budget and conventions, articulated vehicles'
truck and trailer parts, the `sweep` primitive they are mostly built from, and
how to add one.
**Code** - `generator/vehicles.ts`, `generator/cd163.ts`, `generator/cdLogo.ts`, `generator/vehicleParts.ts`, `generator/design.ts`, `generator/meshCore.ts` (`sweep`, `part`), `generator/meshBuilder.ts` (`toGlb`), `src/viewerHighlight.ts`, `test/models.test.ts`, `test/cdLogo.test.ts`, `test/viewerHighlight.test.ts`, `.agents/skills/road-vehicle/SKILL.md`
**See also** - [skyscrapers.md](skyscrapers.md) (the mesh builder, "Flicker"), [export.md](export.md), [source-tree.md](source-tree.md)

## The designs

| id | title | look |
|---|---|---|
| `veh-american-truck` | American Truck | articulated: a long-nose conventional tractor (chrome grille, sleeper, twin stacks, tandem drive axle) and a 53 ft dry van; 22.2 m, about 4,900 triangles |
| `veh-cd-163` | CD 163 | rigid rail vehicle (`cd163.ts`): the Czech Railways class 163 Bo'Bo' electric 163 244-7 in the green livery with the yellow band - ribbed sides, portholes, the raised cooler box and cant grilles, raked framed windscreens, the exact CD emblem and number plates, two single-arm pantographs on shedded insulators, bogies with coil springs, axle boxes, motors and sandboxes; 16.80 m over the buffers, 4.64 m high, about 21,100 triangles. Modelled from photographs, the vlakosimdb elevation drawings and the official emblem (`assets/cd-163/`, see `SOURCES.md` there) |

`VEHICLES` in `vehicles.ts` lists them as `{ id, title, build }`, the same
`ProceduralDesign` shape as the skyscrapers (`design.ts`). `VEHICLE_CATALOG`
beside it holds the game-catalog fields they share - category `Road vehicles`,
group `truck`, `defaultScale` 1, CC0 by Rail Island - which the build writes into
`vehicles.meta.json` ([export.md](export.md)). Those values are a first guess
for the game's vehicle import; settle them when the webapp side is written.

A design may carry its own `catalog` (`ProceduralDesign.catalog`) in place of
`VEHICLE_CATALOG`: the CD 163 uses `RAIL_CATALOG` (category `Rail vehicles`,
group `loco`) and its own palette. A rail vehicle is held to the UIC loading
gauge in `test/models.test.ts` (at most 3.1 m wide and 4.7 m high, pantographs
folded) instead of the US road limits, and to a **25,000-triangle** budget
instead of 10,000: it is 16.8 m long and seen up close along the track. The
test also pins the CD 163's length (16.80 m) and axle positions (the bogie
pivots 8.30 m apart, 3.20 m wheelbase). The shared helpers (`block`, `side`,
`plate`, `arc`) live in `vehicleParts.ts`; `vehicles.ts` re-exports `cd163` so
the JS bundle finds every vehicle's build function in one module.

The CD 163's body is lofted in plan rather than swept: horizontal octagons (the
cab ends' corners chamfered) stacked in colour bands, the end faces raked back
above the sill, and the roof a hip over the whole body. Its proportions are
measured, not guessed: the heights from a square-on side photograph scaled by
the painted 16.80 m (body 1.03 to 3.56 m, the yellow band 1.78 to 2.38 m, the
windows 2.72 to 3.42 m), the positions along the body and across the ends from
the vlakosimdb elevation drawings and a head-on photograph of 163 244-7. Windows,
lamps and plates are `slab`s laid on a face through a small `Surface` mapping
(the side wall, the upright end, the raked windscreen face); the lettering
(seven-segment strokes) and the emblem are one-sided `facets` decals a few
millimetres off the plate or the band. The emblem (`cdLogo.ts`) is the outline
of the official CD logo, flattened from its SVG and triangulated by ear
clipping. Coil springs and insulators are stacks of rings of alternating radius.

**The ids are stored in the game's saved maps**: never rename one that has
shipped. Vehicle ids start with `veh-`.

Agents adding or changing a vehicle follow the `road-vehicle` skill
(`.agents/skills/road-vehicle/SKILL.md`), the checklist for this page.

## Budget

At most **10,000 triangles** per road vehicle and **25,000** per rail vehicle, tested; there is no file-size budget.
A vehicle's GLB is the same format as a skyscraper's: non-indexed triangle
soups with **flat normals stored** per face (tested). The normals are
redundant - a loader could compute the same ones - but storing them means no
step of the game's pipeline that recomputes normals on shared vertices (which
smooths every hard edge) can get them wrong.

## Articulated vehicles: truck and trailer

A tractor with a semi-trailer is one model with **two named parts**, divided at
the coupling's rotation point - the king pin on the fifth wheel:

```ts
m.part("truck", [0, 0, 0], () => tractor(m));
m.part("trailer", PIVOT, () => trailer(m)); // PIVOT = the king pin
```

The design draws both in world coordinates as usual. `toGlb` writes a node per
part, named after it and translated to its pivot, with its mesh's positions
relative to that pivot: the `truck` node sits at the origin, the `trailer` node
at the king pin, so **the game turns the trailer by rotating that node about its
own Y axis**. Each part is also a top-level scope of the source tree, and a
material's triangle numbering runs across the parts in node order
([source-tree.md](source-tree.md)). Parts are top level, used once each, and
once a model has parts every triangle must be in one (`part()` and `toGlb`
throw otherwise).

The American truck's king pin is at x = 1.05 m, on the fifth wheel's top
(y = 1.18 m), 0.6 m behind the trailer's front. Its front corners sweep a
1.43 m circle about it and the sleeper starts 1.55 m ahead, so the trailer can
swing without touching the tractor; the landing gear stands behind the
tractor's rear wheels. Both are tested.

## Conventions

- Metres, **+X forward**, +Y up, +Z to the vehicle's right; centred on z = 0.
- The wheels **stand on y = 0**. A tyre is a 16-gon with a flat side down, so the
  axle sits at `WHEEL_R * cos(pi / 16)`, not at the radius.
- Real proportions: the tests hold a vehicle under 2.7 m wide (2.6 m legal,
  plus mirrors) and 4.115 m high (13 ft 6 in), and longer than twice its width.
- The GLB's generator string is `Rail Island procedural vehicle (<id>)`; a rigid
  vehicle's one node is named `vehicle`, an articulated one's are `truck` and
  `trailer`.
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
| the trailer's body, rails, posts, doors | `block()`s |
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

Follow the `road-vehicle` skill. In short:

1. Write a function in `vehicles.ts` that returns a `MeshBuilder` over
   `VEHICLE_PALETTE`, and add it to `VEHICLES` with a `veh-` id and a title.
   Wrap every part in a named `m.scope(...)` - chassis, each axle, hood, cab - so
   the site's Source tab reads like the design. An articulated vehicle draws
   its tractor and trailer in `m.part("truck", ...)` and `m.part("trailer", pivot, ...)`.
2. `pnpm build:models`, then look at `export/thumbs/<id>.png` and the triangle
   count.
3. `pnpm test` - every design's z-fighting, scope and source-tree checks run
   over the vehicles too, plus the vehicle shape and triangle budget checks above.
