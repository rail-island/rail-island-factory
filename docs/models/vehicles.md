# Vehicles

**Covers** - the procedurally generated road and rail vehicles (an articulated American
truck, the CD 150 and CD 163 electric locomotives and the nine CSD coaches), their triangle budget and conventions, articulated vehicles'
truck and trailer parts, the `sweep` primitive they are mostly built from, and
how to add one.
**Code** - `generator/vehicles.ts`, `generator/cd150.ts`, `generator/cd150Comparison.ts`, `generator/cd150Report.ts`, `test/cd150.test.ts`, `generator/cd163.ts`, `generator/cdLogo.ts`, `generator/vehicleParts.ts`, `generator/design.ts`, `generator/meshCore.ts` (`sweep`, `part`), `generator/meshBuilder.ts` (`toGlb`), `src/viewerHighlight.ts`, `test/models.test.ts`, `test/cdLogo.test.ts`, `test/viewerHighlight.test.ts`, `.agents/skills/road-vehicle/SKILL.md`, `.agents/skills/railroad-vehicle/SKILL.md`, `.agents/skills/vlakosimdb-transfer/SKILL.md`
**See also** - [csd-coaches.md](csd-coaches.md) (the CSD coaches), [skyscrapers.md](skyscrapers.md) (the mesh builder, "Flicker"), [export.md](export.md), [source-tree.md](source-tree.md)

## The designs

| id | title | look |
|---|---|---|
| `veh-american-truck` | American Truck | articulated: a long-nose conventional tractor (chrome grille, sleeper, twin stacks, tandem drive axle) and a 53 ft dry van; 22.2 m, about 4,900 triangles |
| `veh-cd-150` | CD 150 | rigid cream/green electric locomotive 150 222-8 reconstructed from native vlakosimdb XML/BMPs: tapered sloping cabs, a green skirt lowered between the bogies, opposite grille/window sides, asymmetric cooler and two linked-arm pantographs (rear raised, front folded); 16.80 m over buffers, 6.24 m operating height, about 9,100 triangles. [Source notes](../../assets/cd-150/SOURCES.md), [measured comparison](../../assets/cd-150/COMPARISON.md) |
| `veh-cd-163` | CD 163 | rigid rail vehicle (`cd163.ts`): the Czech Railways class 163 Bo'Bo' electric 163 244-7 in the green livery with the yellow band - ribbed sides, four portholes opposite continuous intake shutters, the raised cooler box and cant grilles, raked framed windscreens, an upright period CD monogram and condensed number plates, two single-arm pantographs on shedded insulators (rear raised, front folded), bogies with coil springs, axle boxes, motors and sandboxes; 16.80 m over the buffers, 5.74 m high with the rear collector raised, about 22,500 triangles. Modelled from photographs, the vlakosimdb elevation drawings and the official emblem (`assets/cd-163/`, see `SOURCES.md` there) |

| `veh-csd-a` ... `veh-csd-dsk` | CSD A, B, Balm, Bam, Bdmtee, Be31, Bi20, Bmo, Dsk | rigid coaches and a luggage van reconstructed from native vlakosimdb XML/BMPs by a shared coach builder (`csdCoaches.ts`, `csdCoachParts.ts`): Y-type A and B, the Balm and Bam trailers, the Bdmtee commuter coach, the Bmo double-decker, the two-axle Be31, Bi20 and Dsk; 10.5 to 26.8 m, 2,900 to 5,900 triangles. See [csd-coaches.md](csd-coaches.md) |

`VEHICLES` in `vehicles.ts` lists them as `{ id, title, build }`, the same
`ProceduralDesign` shape as the skyscrapers (`design.ts`). `VEHICLE_CATALOG`
beside it holds the game-catalog fields they share - category `Road vehicles`,
group `truck`, `defaultScale` 1, CC0 by Rail Island - which the build writes into
`vehicles.meta.json` ([export.md](export.md)). Those values are a first guess
for the game's vehicle import; settle them when the webapp side is written.

A design may carry its own `catalog` (`ProceduralDesign.catalog`) in place of
`VEHICLE_CATALOG`: both locomotives use `RAIL_CATALOG` (category `Rail vehicles`,
group `loco`) and its own palette; the CSD coaches use `COACH_CATALOG` (category
`Rail vehicles`, group `coach`). The repository rail envelope in
`test/models.test.ts` allows at most 3.1 m width and 4.7 m fixed-equipment height,
with a separate 6.5 m operating height limit for extended pantographs. These are
project limits rather than a universal loading gauge. Rail vehicles have a **25,000-triangle** budget
instead of 10,000: it is 16.8 m long and seen up close along the track. The
test also pins the CD 163's length (16.80 m) and axle positions (the bogie
pivots 8.30 m apart, 3.20 m wheelbase). The shared helpers (`block`, `side`,
`plate`, `arc`) live in `vehicleParts.ts`; `vehicles.ts` re-exports `cd150`, `cd163` and the CSD coaches'
builders so the JS bundle finds every vehicle's build function in one module.

The CD 150 preserves the source XML's 1 m upper cab setback and different
2.6/2.7 m nose breaks. Panels split at the changes of slope. Its two sides have
different machine-room features: large intake banks versus four rectangular
windows, with a higher cooler on the window side. The green side skirt drops
from the body's 1.2 m underside to 0.6 m above rail over x=-1.1..1.1 m, rising
at the native BMPs' slope (0.3 m per 0.4 m) - source columns 70..100 of both
side textures. Wheel contact is at y=0,
bogie centres are 8.40 m apart and the wheelbase is 3.30 m. Its collector arm
lengths are preserved between folded and raised poses. The dedicated tests
check these mechanical constraints and 39 native-raster landmarks; generic
model tests cover the envelope, deterministic output, source tree, GLB/JS
agreement and coplanar surfaces. Generate the review table and annotated
orthographic views with `pnpm exec tsx generator/cd150Report.ts` after a model
build. The initial authored-to-fitted MAE falls from 0.573 to 0.219 percentage
points on those annotations; this does not measure photographic accuracy.

### Running numbers

Each locomotive shows one full national running number on its side and front
plates, in the CSD/CD scheme of 1988: `ABC DEF-G` - class, serial and a check
digit (from the right, weights 2, 1, 2, ...; digit sums of the products; the
difference to the next multiple of ten). The CD 150 is `150 222-8`
(`CD150_NUMBER` in `cd150.ts`; a CD-era 150.2 unit, since the native plate does
not resolve digits), the CD 163 `163 244-7` (`NUMBER` in `cd163.ts`, from its
photograph). `test/cd150.test.ts` checks the CD 150's check digit. The
railroad-vehicle skill has the whole scheme.

The CD 163's body is lofted in plan rather than swept: horizontal octagons (the
cab ends' corners chamfered) stacked in colour bands, with both the upper and
lower cab faces raked inward from the nose, and a hipped roof. Cab and side
landmarks are calibrated to the original vlakosimdb BMPs, retained under
`assets/cd-163/native/`: `x_both.bmp` (30 by 60 pixels) and `z_dec.bmp` /
`z_inc.bmp` (170 by 60). The source XML maps these to 3 by 6 m and 17 by 6 m,
so each native pixel represents 0.10 m. The old 4x images are not measurement
sources. Photographs still establish mechanical dimensions, including buffer
spacing, wheel diameter and overall length.

The body runs from 1.03 to 3.70 m, with a yellow band at 1.70 to 2.30 m.
Grey roof aprons start at 3.50 m on the sides; the front stays green to 3.70 m,
matching the different paint boundaries in the native front and side BMPs.
The projecting nose is at the band's upper edge: the face recedes 0.20 m toward
the eave and 0.10 m toward the apron at 1.20 m. Below that apron the chassis
skirt is upright. Each colour band follows this same double-raked profile.
Each front glass is 1.20 m wide and approximately 0.70 m high (aspect 1.71),
from 2.70 to 3.40 m above rail, inside a metal surround and rubber gasket.
The 80 mm corner chamfers leave room for frames extending to 1.39 m either
side of the centreline. The side cab panes are 0.60 by 0.70 m with a sloping
leading edge; the door glazing is 0.50 by 0.70 m, aligned at 2.60 to 3.30 m.
Doors, handles, steps and handrails move together with the wider glazing.
Bottom-mounted wipers and front handrails stand proud of the shell.

Both red and white lower marker lenses are circular, 200 mm across, in equal
300 mm housings centred at 1.50 m above rail. Their lateral centres are 0.85
and 1.25 m either side of the centreline. The 1 by 2 pixel lens patches do not
justify stretching a circular lens to a narrow rectangle. Housings stay below
the yellow band, with about 150 mm above the buffer heads. The front number
plate's red field is 1,000 by 300 mm, inside a 1,040 by 340 mm surround; the
upper twin headlight has a 600 by 200 mm housing. The side number plates are
1,100 by 300 mm. Upright badges retain their outline proportions at 400 mm
height rather than copying the pixel stair steps.

Buffer heads are rounded 700 by 400 mm plates at the standard 1,750 mm spacing,
with separate housings and plungers; the locomotive stays 16.80 m long. The
coarse bitmap head outlines are ambiguous, so they do not override the standard
spacing. Broad, tilted snow ploughs span 0.10 to 0.50 m above rail and 0.40 to
1.40 m either side of the centreline. Their cutting edges project 170 mm ahead
of their tops, a rearward lean of approximately 23 degrees from vertical.
Horizontal corrugations use approximately 145 mm pitch and stop below the
gutters. Four 700 mm porthole panes sit at 2.85 m on the +Z side. The opposite
intake frame extends from 2.40 to 3.30 m, matching `z_inc`. The central cooler
has a skirt overlapping the upper side wall at 3.30 m and reaches 4.25 m, the
midpoint of the two side textures' half-pixel disagreement in its top edge.

`assets/cd-163/native/landmarks.json` records 50 independently annotated
native-pixel boxes and their model scopes. Regression checks project the actual
GLB vertices onto the same canvases: front `u = 1.5 - Z`, side `u = X + 8.5`,
vertical `v = 6 - Y`. Both side comparisons follow the bitmap's longitudinal
axis; the intake side is mirrored relative to a normal outside view. Tests
compare left/top coordinates and width/height within one pixel for clear
landmarks, two for ambiguous doors/buffers/ploughs. The painted band's
horizontal silhouette has a three-pixel tolerance because the texture extends
beyond the mesh; its vertical position and height are also covered by the
cab-profile and clearance tests. These are raster-layout tolerances, not claims
of engineering accuracy.

Across the same 50 annotated boxes, mean absolute error in normalized left, top,
width and height decreased from 1.736 percentage points in `421c9ce` to 0.356
(about 80%). Front error decreased from 1.732 to 0.657 pp; the porthole side
from 1.685 to 0.124 pp and the intake side from 1.804 to 0.153 pp. The metric
weights all four box components equally on the full texture canvases; it does
not measure photographic realism or the unannotated roof/underframe details.

Windows, lamps and plates are `slab`s laid on a face through a small `Surface`
mapping (the side wall and the two sloped cab faces). Marker lights, number
plates, the badge and lower handrails follow the lower plane and its outward
normal; the twin headlight follows the upper plane. Buffer heads remain
upright on the chassis, preserving the overall length. Lettering
uses connected condensed numeral strokes with diagonal legs and curved bowls,
rather than seven-segment digits. The period upright CD badge is an approximate
reconstruction: the official SVG outlines in `cdLogo.ts` are de-skewed and
narrowed to the photographed badge's proportions, normalized and triangulated
by ear clipping. It is not an exact historic logo tracing. These markings are
one-sided `facets` decals a few millimetres off their supporting surfaces.
Coil springs and insulators are stacks of rings of alternating radius.

The rear (-X) pantograph is raised to a 5.74 m collector height; the front one
remains folded at 4.64 m. This is a static operating pose in the rigid model,
not an animation. The raised linkage is solved from the folded arm lengths:
the knee moves at the intersection of hinge/head distance circles, preserving
both arm lengths while lifting the contact head 1.10 m. The collector strips
stay level, the base remains anchored, and the upper arm attaches 20 mm above
the lower knee. Tests cover exactly one raised collector, folded and operating
heights, constant arm lengths and joint continuity. Electric locomotives with
two pantographs use one raised and one folded in their default displayed pose.

Regression checks in `test/models.test.ts` cover the cab glazing aspect ratio
and rake, both cab setbacks and the upright skirt, the actual GLB surface
distances of lower fittings, door/window alignment, equal marker sizes and
clearances to the band, plate and buffers, snow-plough height and lean, buffer
head sizes, upright
badge proportions, and the different machine-room sides, alongside the overall
dimensions, axle positions, triangle budget and coplanar-overlap checks.

**The ids are stored in the game's saved maps**: never rename one that has
shipped. Vehicle ids start with `veh-`.

Use [road-vehicle](../../.agents/skills/road-vehicle/SKILL.md) for road models
and [railroad-vehicle](../../.agents/skills/railroad-vehicle/SKILL.md) for rail
models. When vlakosimdb is a source, also follow
[vlakosimdb-transfer](../../.agents/skills/vlakosimdb-transfer/SKILL.md): use XML
shapes and original BMPs, optimize an element-comparison table, and present
the final table and before/after errors to the user.

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

Follow the applicable road or railroad vehicle skill linked above:

1. Write a function in `vehicles.ts` that returns a `MeshBuilder` over
   `VEHICLE_PALETTE`, and add it to `VEHICLES` with a `veh-` id and a title.
   Wrap every part in a named `m.scope(...)` - chassis, each axle, hood, cab - so
   the site's Source tab reads like the design. An articulated vehicle draws
   its tractor and trailer in `m.part("truck", ...)` and `m.part("trailer", pivot, ...)`.
2. `pnpm build:models`, then look at `export/thumbs/<id>.png` and the triangle
   count.
3. `pnpm test` - every design's z-fighting, scope and source-tree checks run
   over the vehicles too, plus the vehicle shape and triangle budget checks above.
